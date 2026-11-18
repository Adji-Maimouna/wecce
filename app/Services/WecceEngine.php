<?php

namespace App\Services;

use App\Exceptions\RuleViolationException;
use App\Models\Acquisition;
use App\Models\Annonce;
use App\Models\Appareil;
use App\Models\ComptePoints;
use App\Models\ConfigurationPlateforme;
use App\Models\Depot;
use App\Models\Etudiant;
use App\Models\Expertise;
use App\Models\JournalAdministration;
use App\Models\Paiement;
use App\Models\Photo;
use App\Models\Renoncement;
use App\Models\SnapshotCouverture;
use App\Models\User;
use App\Services\Paiements\EspecesPasserelle;
use App\Services\Paiements\OrangeMoneyPasserelle;
use App\Services\Paiements\WavePasserelle;
use App\Services\Points\AjusterManuellement;
use App\Services\Points\AppliquerFonte;
use App\Services\Points\CrediterDepot;
use App\Services\Points\DebiterAcquisition;
use App\Support\WecceClock;
use App\Support\WecceCodes;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class WecceEngine
{
    public const CONTROLS = [
        'tel' => [
            'Écran et tactile sans défaut',
            'Appareils photo, micro et haut-parleur testés',
            'Compte Google ou iCloud déconnecté, téléphone réinitialisé',
        ],
        'tab' => [
            'Écran et tactile sans défaut',
            'Charge et boutons testés',
            'Compte Google ou iCloud déconnecté, tablette réinitialisée',
        ],
        'ordi' => [
            'Écran sans pixel mort ni fissure',
            'Clavier, pavé tactile et ports testés',
            'Compte Microsoft déconnecté, appareil réinitialisé',
        ],
        'audio' => [
            'Son des deux côtés, sans grésillement',
            'Charge et connexion testées',
        ],
        'piece' => [
            'Testée dans un appareil du comptoir',
            'Connecteurs intacts',
        ],
    ];

    public function __construct(
        private readonly CrediterDepot $crediterDepot,
        private readonly DebiterAcquisition $debiterAcquisition,
        private readonly AppliquerFonte $appliquerFonte,
        private readonly AjusterManuellement $ajusterManuellement,
        private readonly WavePasserelle $wavePasserelle,
        private readonly OrangeMoneyPasserelle $orangeMoneyPasserelle,
        private readonly EspecesPasserelle $especesPasserelle,
    ) {}

    public static function controlsFor(string $category): array
    {
        return self::CONTROLS[$category] ?? self::CONTROLS['piece'];
    }

    public static function maskSerial(?string $serial): string
    {
        $s = trim((string) $serial);
        if (mb_strlen($s, 'UTF-8') > 6) {
            return mb_substr($s, 0, 4, 'UTF-8') . '••••' . mb_substr($s, -2, null, 'UTF-8');
        }

        return $s;
    }

    public static function slugify(string $name): string
    {
        $slug = Str::slug($name);
        return $slug !== '' ? $slug : 'article';
    }

    public function nextDepositRef(): string
    {
        $last = Depot::query()
            ->where('reference', 'like', 'WC-2026-%')
            ->orderByDesc('reference')
            ->value('reference');

        $num = $last ? ((int) substr($last, 8)) + 1 : 656;
        return sprintf('WC-2026-%04d', max(656, $num));
    }

    public function nextAcquisitionRef(): string
    {
        $last = Acquisition::query()
            ->where('reference', 'like', 'AQ-2026-%')
            ->orderByDesc('reference')
            ->value('reference');

        $num = $last ? ((int) substr($last, 8)) + 1 : 1181;
        return sprintf('AQ-2026-%04d', max(1181, $num));
    }

    public function slotTaken(string $slotIso, ?string $exceptRef = null): bool
    {
        $query = Depot::query()
            ->where('date_rendez_vous', $slotIso)
            ->whereNotIn('statut', ['ANNULE', 'BROUILLON']);

        if ($exceptRef) {
            $query->where('reference', '<>', strtoupper($exceptRef));
        }

        return $query->exists();
    }

    /**
     * @param array{
     *   category: string,
     *   modele: string,
     *   stockage?: string|null,
     *   age: string,
     *   etat: string,
     *   photos?: array<int, string>,
     *   photoCount?: int,
     *   wish?: int|null,
     *   slot?: string|null,
     *   draftRef?: string|null,
     *   ref?: string|null
     * } $req
     */
    public function createDeposit(string $userId, array $req, string $at): string
    {
        return DB::transaction(function () use ($userId, $req, $at) {
            $slot = !empty($req['slot']) ? WecceClock::toIso($req['slot']) : null;
            $draftRef = !empty($req['draftRef']) ? strtoupper(trim($req['draftRef'])) : null;

            if ($slot && $this->slotTaken($slot, $draftRef)) {
                throw new RuleViolationException('creneau-pris', "Ce créneau vient d'être pris. Choisissez-en un autre.");
            }

            $category = $req['category'];
            $modele = trim($req['modele']);
            $stockage = trim((string) ($req['stockage'] ?? ''));
            $ageSql = WecceCodes::AGE_TO_SQL[$req['age']] ?? '1_2ANS';
            $etatSql = WecceCodes::CONDITION_TO_SQL[$req['etat']] ?? ($category === 'piece' ? 'FONCTIONNEL' : 'BON');
            $photos = array_values(array_filter($req['photos'] ?? []));
            $photoCount = $req['photoCount'] ?? count($photos);
            $wish = isset($req['wish']) && $req['wish'] !== null && $req['wish'] !== '' ? (int) $req['wish'] : null;
            $statutSql = $slot ? 'RDV_PRIS' : 'BROUILLON';

            if ($draftRef) {
                $draft = Depot::query()->where('reference', $draftRef)->first();
                if (!$draft || $draft->etudiant_id !== $userId || $draft->statut !== 'BROUILLON') {
                    throw new RuleViolationException('depot-inconnu', "Ce brouillon n'existe plus.");
                }

                $draft->appareil->update([
                    'categorie_code' => $category,
                    'designation' => $modele,
                    'stockage' => $stockage !== '' ? $stockage : null,
                    'age_declare' => $ageSql,
                    'etat_declare' => $etatSql,
                ]);

                if (count($photos) > 0) {
                    Photo::query()->where('appareil_id', $draft->appareil_id)->delete();
                    foreach ($photos as $idx => $url) {
                        Photo::query()->create([
                            'appareil_id' => $draft->appareil_id,
                            'url' => $url,
                            'alt' => "{$modele}, photo déposée",
                            'ordre' => $idx + 1,
                        ]);
                    }
                }

                $draft->update([
                    'prix_souhaite' => $wish,
                    'nb_photos_declarees' => $photoCount,
                    'date_rendez_vous' => $slot,
                    'statut' => $statutSql,
                ]);

                return $draft->reference;
            }

            $appareil = Appareil::query()->create([
                'categorie_code' => $category,
                'designation' => $modele,
                'stockage' => $stockage !== '' ? $stockage : null,
                'age_declare' => $ageSql,
                'etat_declare' => $etatSql,
                'statut' => 'DECLARE',
            ]);

            foreach ($photos as $idx => $url) {
                Photo::query()->create([
                    'appareil_id' => $appareil->id,
                    'url' => $url,
                    'alt' => "{$modele}, photo déposée",
                    'ordre' => $idx + 1,
                ]);
            }

            $ref = !empty($req['ref']) ? strtoupper($req['ref']) : $this->nextDepositRef();

            Depot::query()->create([
                'reference' => $ref,
                'etudiant_id' => $userId,
                'appareil_id' => $appareil->id,
                'prix_souhaite' => $wish,
                'nb_photos_declarees' => $photoCount,
                'date_rendez_vous' => $slot,
                'statut' => $statutSql,
                'cree_le' => $at,
            ]);

            return $ref;
        });
    }

    public function cancelDeposit(string $userId, string $ref, string $at): void
    {
        $depot = Depot::query()->where('reference', strtoupper($ref))->first();
        if (!$depot || $depot->etudiant_id !== $userId) {
            throw new RuleViolationException('depot-inconnu', "Aucun dépôt {$ref}.");
        }
        if (!in_array($depot->statut, ['RDV_PRIS', 'BROUILLON'], true)) {
            throw new RuleViolationException('depot-traite', 'Ce dépôt a déjà été examiné.');
        }

        $depot->update([
            'statut' => 'ANNULE',
            'cloture_le' => $at,
        ]);
    }

    public function reschedule(string $userId, string $ref, string $slotIso): void
    {
        $depot = Depot::query()->where('reference', strtoupper($ref))->first();
        if (!$depot || $depot->etudiant_id !== $userId || $depot->statut !== 'RDV_PRIS') {
            throw new RuleViolationException('depot-traite', 'Ce rendez-vous ne peut plus être déplacé.');
        }

        $slot = WecceClock::toIso($slotIso);
        if ($this->slotTaken($slot, $depot->reference)) {
            throw new RuleViolationException('creneau-pris', "Ce créneau vient d'être pris. Choisissez-en un autre.");
        }

        $depot->update([
            'date_rendez_vous' => $slot,
        ]);
    }

    /**
     * @param array{pieces: bool, condition: string, battery: int|null, serial: string, takeBack: int, listPrice: int} $values
     */
    public function recordExpertise(string $agentId, string $ref, array $values, string $at): Expertise
    {
        return DB::transaction(function () use ($agentId, $ref, $values, $at) {
            $depot = Depot::query()->with('appareil')->where('reference', strtoupper($ref))->first();
            if (!$depot) {
                throw new RuleViolationException('depot-inconnu', "Aucun dépôt {$ref}.");
            }
            if (!in_array($depot->statut, ['RDV_PRIS', 'EXPERTISE'], true)) {
                throw new RuleViolationException('depot-traite', 'Ce dépôt a déjà été traité.');
            }

            $takeBack = (int) $values['takeBack'];
            $listPrice = (int) $values['listPrice'];
            if ($takeBack <= 0 || $listPrice <= 0 || $listPrice < $takeBack) {
                throw new RuleViolationException('prix-incoherents', "Le prix d'affichage doit être supérieur ou égal à la reprise.");
            }

            $pieces = !empty($values['pieces']);
            $conditionFront = $values['condition'];
            $conditionSql = WecceCodes::CONDITION_TO_SQL[$conditionFront] ?? 'BON';
            $battery = isset($values['battery']) && $values['battery'] !== null && $values['battery'] > 0 ? (int) $values['battery'] : null;
            $serial = trim((string) ($values['serial'] ?? ''));

            $checks = [];
            if ($battery !== null) {
                $checks[] = ['label' => 'Batterie', 'value' => "{$battery} % de sa capacité d'origine"];
            }
            $catForControls = $pieces ? 'piece' : $depot->appareil->categorie_code;
            foreach (self::controlsFor($catForControls) as $ctrl) {
                $firstComma = explode(',', $ctrl)[0];
                $label = explode(' sans', $firstComma)[0];
                $checks[] = ['label' => $label, 'value' => 'Vérifié au comptoir'];
            }
            if ($serial !== '') {
                $checks[] = ['label' => 'Numéro de série', 'value' => self::maskSerial($serial), 'numeric' => true];
            }

            $depot->appareil->update([
                'etat_constate' => $conditionSql,
                'batterie_pourcent' => $battery,
                'numero_serie' => $serial !== '' ? $serial : $depot->appareil->numero_serie,
            ]);

            $expertise = Expertise::query()->updateOrCreate(
                ['depot_id' => $depot->id],
                [
                    'agent_id' => $agentId,
                    'realisee_le' => $at,
                    'etat_constate' => $conditionSql,
                    'batterie_pourcent' => $battery,
                    'numero_serie_saisi' => $serial !== '' ? $serial : null,
                    'valeur_reprise' => $takeBack,
                    'prix_affichage' => $listPrice,
                    'decision' => $pieces ? 'ACCEPTE_EN_PIECES' : 'ACCEPTE',
                    'motif_refus' => null,
                    'commentaire' => null,
                    'controles' => $checks,
                ]
            );

            $depot->update([
                'statut' => 'EXPERTISE',
            ]);

            return $expertise;
        });
    }

    public function refuse(string $agentId, string $ref, string $reason, string $comment, string $at): void
    {
        DB::transaction(function () use ($agentId, $ref, $reason, $comment, $at) {
            $depot = Depot::query()->with('appareil')->where('reference', strtoupper($ref))->first();
            if (!$depot) {
                throw new RuleViolationException('depot-inconnu', "Aucun dépôt {$ref}.");
            }
            if (!in_array($depot->statut, ['RDV_PRIS', 'EXPERTISE'], true)) {
                throw new RuleViolationException('depot-traite', 'Ce dépôt a déjà été traité.');
            }

            Expertise::query()->updateOrCreate(
                ['depot_id' => $depot->id],
                [
                    'agent_id' => $agentId,
                    'realisee_le' => $at,
                    'etat_constate' => $depot->appareil->etat_declare,
                    'batterie_pourcent' => null,
                    'valeur_reprise' => null,
                    'prix_affichage' => null,
                    'decision' => 'REFUSE',
                    'motif_refus' => $reason,
                    'commentaire' => trim($comment),
                    'controles' => null,
                ]
            );

            $depot->appareil->update(['statut' => 'REFUSE']);
            $depot->update([
                'statut' => 'REFUSE',
                'cloture_le' => $at,
            ]);
        });
    }

    public function declineAtCounter(string $ref, string $at): void
    {
        $depot = Depot::query()->where('reference', strtoupper($ref))->first();
        if (!$depot) {
            throw new RuleViolationException('depot-inconnu', "Aucun dépôt {$ref}.");
        }
        if ($depot->statut !== 'EXPERTISE') {
            throw new RuleViolationException('depot-traite', "Ce dépôt n'attend pas de signature.");
        }

        $depot->update([
            'statut' => 'ANNULE',
            'cloture_le' => $at,
        ]);
    }

    /**
     * @param array{src: string, alt?: string, width?: int, height?: int}|null $photo
     * @return array{balanceAfter: int, article: Annonce}
     */
    public function sign(string $ref, string $at, ?string $signatureImage = null, ?array $photo = null): array
    {
        return DB::transaction(function () use ($ref, $at, $signatureImage, $photo) {
            $depot = Depot::query()->with(['appareil', 'expertise'])->where('reference', strtoupper($ref))->first();
            if (!$depot) {
                throw new RuleViolationException('depot-inconnu', "Aucun dépôt {$ref}.");
            }

            $expertise = $depot->expertise;
            if ($depot->statut !== 'EXPERTISE' || !$expertise || $expertise->decision === 'REFUSE') {
                throw new RuleViolationException('depot-traite', "Ce dépôt n'attend pas de signature.");
            }

            $compte = ComptePoints::query()->where('etudiant_id', $depot->etudiant_id)->firstOrFail();
            $balanceBefore = (int) $compte->solde;

            $config = ConfigurationPlateforme::current();
            $bonusOn = $config->bonus_actif && $config->bonus_consomme < $config->bonus_quota;
            $bonusRateDecimal = $bonusOn ? (float) $config->bonus_taux : 0.0;
            $bonusAccorde = $bonusOn ? (int) round($expertise->valeur_reprise * $bonusRateDecimal) : 0;

            $hash = hash('sha256', "{$depot->reference}|{$at}|{$expertise->valeur_reprise}");

            $renoncement = Renoncement::query()->create([
                'expertise_id' => $expertise->id,
                'agent_id' => $expertise->agent_id,
                'signe_le' => $at,
                'lieu' => (string) config('wecce.partenaire_lieu'),
                'numero_serie_constate' => $expertise->numero_serie_saisi ?: $depot->appareil->numero_serie,
                'valeur_cedee' => (int) $expertise->valeur_reprise,
                'prix_affichage' => (int) $expertise->prix_affichage,
                'bonus_accorde' => $bonusAccorde,
                'bonus_taux' => $bonusRateDecimal,
                'solde_avant' => $balanceBefore,
                'signature_image' => $signatureImage ?: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
                'empreinte' => $hash,
            ]);

            $shortName = trim((string) $depot->appareil->designation);
            $creditResult = $this->crediterDepot->execute(
                $compte,
                $renoncement,
                $depot->reference,
                $shortName,
                (int) $expertise->valeur_reprise,
                $at
            );

            $pieces = $expertise->decision === 'ACCEPTE_EN_PIECES';
            $fullName = $depot->appareil->fullName();
            $articleName = $pieces ? "{$shortName}, pour pièces" : $fullName;
            $categoryCode = $pieces ? 'piece' : $depot->appareil->categorie_code;

            $depot->appareil->update([
                'categorie_code' => $categoryCode,
                'etat_constate' => $expertise->etat_constate,
                'batterie_pourcent' => $expertise->batterie_pourcent,
                'precision' => $pieces ? 'Repris en pièces' : $depot->appareil->precision,
                'statut' => $photo ? 'EN_LIGNE' : 'EN_STOCK',
            ]);

            if ($photo && !empty($photo['src'])) {
                Photo::query()->where('appareil_id', $depot->appareil->id)->delete();
                Photo::query()->create([
                    'appareil_id' => $depot->appareil->id,
                    'url' => $photo['src'],
                    'alt' => $photo['alt'] ?? "{$articleName}, photo prise au comptoir",
                    'largeur' => $photo['width'] ?? 800,
                    'hauteur' => $photo['height'] ?? 800,
                    'ordre' => 1,
                ]);
            }

            $slug = $this->uniqueSlug($articleName);
            $info = $pieces ? 'Repris en pièces' : ('Examiné le ' . WecceClock::dayMonthShort($at));

            $annonce = Annonce::query()->create([
                'slug' => $slug,
                'appareil_id' => $depot->appareil->id,
                'origine' => 'DEPOT_ETUDIANT',
                'depot_origine_id' => $depot->id,
                'titre' => null,
                'sous_titre' => null,
                'mots_cles' => $articleName,
                'info' => $info,
                'controles' => $expertise->controles,
                'examine_le' => $expertise->realisee_le,
                'prix_initial' => (int) $expertise->prix_affichage,
                'prix_courant' => (int) $expertise->prix_affichage,
                'cree_le' => $at,
                'mise_en_ligne_le' => $photo ? $at : null,
                'statut' => $photo ? 'EN_LIGNE' : 'A_PHOTOGRAPHIER',
            ]);

            $depot->update([
                'statut' => 'VALIDE',
                'cloture_le' => $at,
            ]);

            return [
                'balanceAfter' => $creditResult['balanceAfter'],
                'article' => $annonce,
            ];
        });
    }

    public function uniqueSlug(string $baseText, ?string $preferredSlug = null, ?string $ignoreAnnonceId = null): string
    {
        $base = $preferredSlug ?: self::slugify($baseText);
        $slug = $base;
        $counter = 2;

        while (
            Annonce::query()
                ->where('slug', $slug)
                ->when($ignoreAnnonceId, fn ($q) => $q->where('id', '<>', $ignoreAnnonceId))
                ->exists()
        ) {
            $slug = "{$base}-{$counter}";
            $counter++;
        }

        return $slug;
    }

    /**
     * Ajoute un article directement (utilisé par le seeder ou par la boutique).
     *
     * @param array<string, mixed> $a
     */
    public function addShopArticle(array $a): Annonce
    {
        return DB::transaction(function () use ($a) {
            $conditionSql = WecceCodes::CONDITION_TO_SQL[$a['condition']] ?? 'BON';
            $category = $a['category'];
            $name = trim((string) $a['name']);
            $parts = explode(' · ', $name, 2);
            $designation = $parts[0];
            $stockage = $parts[1] ?? null;

            $appareil = Appareil::query()->create([
                'categorie_code' => $category,
                'designation' => $designation,
                'stockage' => $stockage,
                'precision' => $a['detail'] ?? null,
                'age_declare' => $category === 'piece' ? 'INCONNU' : '1_2ANS',
                'etat_declare' => $conditionSql,
                'etat_constate' => $conditionSql,
                'batterie_pourcent' => $a['battery'] ?? null,
                'statut' => 'EN_LIGNE',
            ]);

            if (!empty($a['photo']) && !empty($a['photo']['src'])) {
                Photo::query()->create([
                    'appareil_id' => $appareil->id,
                    'url' => $a['photo']['src'],
                    'alt' => $a['photo']['alt'] ?? "{$name}, photo prise au comptoir",
                    'largeur' => $a['photo']['width'] ?? 800,
                    'hauteur' => $a['photo']['height'] ?? 800,
                    'ordre' => 1,
                ]);
            }

            $slug = $this->uniqueSlug($name, $a['slug'] ?? null);
            $at = $a['at'] ?? WecceClock::now();
            $price = (int) $a['price'];

            return Annonce::query()->create([
                'slug' => $slug,
                'appareil_id' => $appareil->id,
                'origine' => 'STOCK_PARTENAIRE',
                'depot_origine_id' => null,
                'titre' => $a['title'] ?? null,
                'sous_titre' => $a['details'] ?? null,
                'mots_cles' => $a['keywords'] ?? $name,
                'info' => $a['info'] ?? '',
                'controles' => $a['checks'] ?? null,
                'examine_le' => $a['examinedAt'] ?? $at,
                'prix_initial' => $price,
                'prix_courant' => $price,
                'cree_le' => $at,
                'mise_en_ligne_le' => $at,
                'statut' => 'EN_LIGNE',
            ]);
        });
    }

    public function publish(string $articleId, string $at): void
    {
        $annonce = Annonce::query()->with('appareil')->find($articleId);
        if (!$annonce) {
            throw new RuleViolationException('article-inconnu', 'Article introuvable.');
        }
        if ($annonce->statut !== 'A_PHOTOGRAPHIER') {
            throw new RuleViolationException('article-en-ligne', 'Cet article est déjà en ligne.');
        }

        $annonce->appareil->update(['statut' => 'EN_LIGNE']);
        $annonce->update([
            'statut' => 'EN_LIGNE',
            'mise_en_ligne_le' => $at,
        ]);
    }

    /**
     * @param array{id?: string|null, name: string, category: string, condition: string, battery?: int|null, info?: string|null, price: int, photo?: string|null} $input
     */
    public function saveArticle(array $input, string $at): string
    {
        return DB::transaction(function () use ($input, $at) {
            $name = trim($input['name']);
            $category = $input['category'];
            $conditionSql = WecceCodes::CONDITION_TO_SQL[$input['condition']] ?? 'BON';
            $battery = isset($input['battery']) && $input['battery'] !== null ? (int) $input['battery'] : null;
            $price = (int) $input['price'];
            $info = trim((string) ($input['info'] ?? ''));

            if ($name === '') {
                throw new RuleViolationException('nom-manquant', "Indiquez le nom de l'article.");
            }
            if ($price <= 0) {
                throw new RuleViolationException('prix-manquant', "Indiquez le prix d'affichage en points.");
            }
            if ($battery !== null && ($battery < 0 || $battery > 100)) {
                throw new RuleViolationException('batterie-invalide', 'La batterie doit être comprise entre 0 et 100 %.');
            }
            if ($battery === 0) {
                $battery = null;
            }

            if (!empty($input['id'])) {
                $annonce = Annonce::query()->with('appareil')->find($input['id']);
                if (!$annonce) {
                    throw new RuleViolationException('article-inconnu', 'Article introuvable.');
                }
                if (in_array($annonce->statut, ['VENDUE', 'RETIREE'], true)) {
                    throw new RuleViolationException('article-ferme', "Cet article n'est plus en vente.");
                }

                $parts = explode(' · ', $name, 2);
                $annonce->appareil->update([
                    'categorie_code' => $category,
                    'designation' => $parts[0],
                    'stockage' => $parts[1] ?? null,
                    'etat_constate' => $conditionSql,
                    'batterie_pourcent' => $battery,
                ]);

                if (array_key_exists('photo', $input)) {
                    Photo::query()->where('appareil_id', $annonce->appareil_id)->delete();
                    if (!empty($input['photo'])) {
                        Photo::query()->create([
                            'appareil_id' => $annonce->appareil_id,
                            'url' => $input['photo'],
                            'alt' => "{$name}, photo prise au comptoir",
                            'largeur' => 800,
                            'hauteur' => 800,
                            'ordre' => 1,
                        ]);
                    }
                }

                $newInitial = $annonce->statut === 'A_PHOTOGRAPHIER' && $price !== $annonce->prix_courant
                    ? $price
                    : $annonce->prix_initial;

                $annonce->update([
                    'mots_cles' => $name,
                    'info' => $info,
                    'prix_courant' => $price,
                    'prix_initial' => $newInitial,
                ]);

                return $annonce->id;
            }

            $photoArr = !empty($input['photo'])
                ? ['src' => $input['photo'], 'alt' => "{$name}, photo prise au comptoir", 'width' => 800, 'height' => 800]
                : null;

            $annonce = $this->addShopArticle([
                'name' => $name,
                'category' => $category,
                'condition' => $input['condition'],
                'battery' => $battery,
                'info' => $info,
                'price' => $price,
                'photo' => $photoArr,
                'at' => $at,
            ]);

            return $annonce->id;
        });
    }

    public function withdraw(string $articleId, string $reason, string $at, User $actor, ?string $ip = null): void
    {
        DB::transaction(function () use ($articleId, $reason, $at, $actor, $ip) {
            $annonce = Annonce::query()->with('appareil')->find($articleId);
            if (!$annonce) {
                throw new RuleViolationException('article-inconnu', 'Article introuvable.');
            }
            if (!in_array($annonce->statut, ['EN_LIGNE', 'A_PHOTOGRAPHIER'], true)) {
                throw new RuleViolationException('article-ferme', 'Seul un article en vente peut être retiré.');
            }

            $name = $this->articleDisplayName($annonce);
            $annonce->appareil->update(['statut' => 'RETIRE']);
            $annonce->update(['statut' => 'RETIREE']);

            JournalAdministration::query()->create([
                'administrateur_id' => $actor->role === 'ADMIN' ? $actor->id : null,
                'utilisateur_id' => $actor->id,
                'auteur_libelle' => $actor->auditSignature($ip),
                'action' => 'RETRAIT_ANNONCE',
                'cible_type' => 'annonce',
                'cible_id' => $annonce->id,
                'cible_libelle' => $name,
                'changement' => 'En ligne → retirée',
                'avant' => ['statut' => 'EN_LIGNE'],
                'apres' => ['statut' => 'RETIREE'],
                'motif' => trim($reason),
                'effectue_le' => $at,
                'adresse_ip' => $ip,
            ]);
        });
    }

    public function articleDisplayName(Annonce $annonce): string
    {
        $appareil = $annonce->relationLoaded('appareil') ? $annonce->appareil : $annonce->appareil()->first();
        if (!$appareil) {
            return $annonce->mots_cles ?: 'Appareil';
        }
        if ($appareil->precision === 'Repris en pièces') {
            return trim($appareil->designation) . ', pour pièces';
        }

        return $appareil->fullName();
    }

    /**
     * @return array{acquisition: Acquisition, paiement: Paiement|null}
     */
    public function acquire(string $userId, string $articleId, string $methodFront, string $at, ?string $phone = null, ?string $forcedPaymentRef = null): array
    {
        return DB::transaction(function () use ($userId, $articleId, $methodFront, $at, $phone, $forcedPaymentRef) {
            $annonce = Annonce::query()->with('appareil')->lockForUpdate()->find($articleId);
            if (!$annonce) {
                throw new RuleViolationException('article-inconnu', 'Objet introuvable.');
            }
            if ($annonce->statut !== 'EN_LIGNE') {
                throw new RuleViolationException('objet-indisponible', "Cet objet vient d'être réservé par un autre étudiant.");
            }

            $compte = ComptePoints::query()->where('etudiant_id', $userId)->lockForUpdate()->firstOrFail();
            $price = (int) $annonce->prix_courant;
            $balance = (int) $compte->solde;
            $covered = min($price, $balance);
            $complement = max(0, $price - $balance);

            $methodSql = WecceCodes::PAYMENT_METHOD_TO_SQL[$methodFront] ?? 'ESPECES';
            $immediate = $methodFront === 'especes' || $complement === 0;
            $ref = $this->nextAcquisitionRef();

            $acquisition = Acquisition::query()->create([
                'reference' => $ref,
                'annonce_id' => $annonce->id,
                'etudiant_id' => $userId,
                'moyen_paiement' => $methodSql,
                'prix_total' => $price,
                'points_debites' => $covered,
                'complement_du' => $complement,
                'statut' => $immediate ? 'RESERVE' : 'EN_ATTENTE',
                'cree_le' => $at,
                'confirme_le' => $immediate ? $at : null,
            ]);

            $annonce->update(['statut' => 'RESERVEE']);

            $paiement = null;
            if (!$immediate) {
                $passerelle = $methodFront === 'wave' ? $this->wavePasserelle : $this->orangeMoneyPasserelle;
                $paiement = $passerelle->initier($acquisition, $complement, $phone, $at, $forcedPaymentRef);
            } elseif ($complement > 0) {
                $paiement = $this->especesPasserelle->initier($acquisition, $complement, $phone, $at, $forcedPaymentRef);
            }

            if ($immediate && $covered > 0) {
                $this->debiterAcquisition->execute(
                    $compte,
                    $acquisition,
                    $this->articleDisplayName($annonce),
                    $covered,
                    $at
                );
            }

            return [
                'acquisition' => $acquisition,
                'paiement' => $paiement,
            ];
        });
    }

    public function confirmPayment(string $refOrPaymentRef, string $at): Acquisition
    {
        return DB::transaction(function () use ($refOrPaymentRef, $at) {
            $paiement = Paiement::query()->where('reference', $refOrPaymentRef)->first();
            $acquisition = $paiement
                ? Acquisition::query()->lockForUpdate()->findOrFail($paiement->acquisition_id)
                : Acquisition::query()->where('reference', $refOrPaymentRef)->lockForUpdate()->first();

            if (!$acquisition) {
                throw new RuleViolationException('acquisition-inconnue', 'Acquisition introuvable.');
            }

            if ($acquisition->statut !== 'EN_ATTENTE') {
                return $acquisition;
            }

            $annonce = Annonce::query()->with('appareil')->findOrFail($acquisition->annonce_id);
            $compte = ComptePoints::query()->where('etudiant_id', $acquisition->etudiant_id)->lockForUpdate()->firstOrFail();

            $points = min((int) $acquisition->points_debites, (int) $compte->solde);
            $complement = (int) $annonce->prix_courant - $points;

            $acquisition->update([
                'points_debites' => $points,
                'complement_du' => $complement,
                'prix_total' => (int) $annonce->prix_courant,
                'statut' => 'RESERVE',
                'confirme_le' => $at,
            ]);

            Paiement::query()
                ->where('acquisition_id', $acquisition->id)
                ->update([
                    'statut' => 'CONFIRME',
                    'confirme_le' => $at,
                ]);

            if ($points > 0) {
                $this->debiterAcquisition->execute(
                    $compte,
                    $acquisition,
                    $this->articleDisplayName($annonce),
                    $points,
                    $at
                );
            }

            return $acquisition->fresh();
        });
    }

    public function cancelPayment(string $refOrPaymentRef): void
    {
        DB::transaction(function () use ($refOrPaymentRef) {
            $paiement = Paiement::query()->where('reference', $refOrPaymentRef)->first();
            $acquisition = $paiement
                ? Acquisition::query()->lockForUpdate()->find($paiement->acquisition_id)
                : Acquisition::query()->where('reference', $refOrPaymentRef)->lockForUpdate()->first();

            if (!$acquisition) {
                throw new RuleViolationException('acquisition-inconnue', 'Acquisition introuvable.');
            }
            if ($acquisition->statut !== 'EN_ATTENTE') {
                throw new RuleViolationException('paiement-confirme', 'Le paiement est déjà confirmé.');
            }

            $acquisition->update(['statut' => 'ANNULE']);
            Paiement::query()->where('acquisition_id', $acquisition->id)->update(['statut' => 'ECHOUE']);

            $annonce = Annonce::query()->find($acquisition->annonce_id);
            if ($annonce && $annonce->statut === 'RESERVEE') {
                $annonce->update(['statut' => 'EN_LIGNE']);
            }
        });
    }

    public function handOver(string $acquisitionRef, string $at): void
    {
        DB::transaction(function () use ($acquisitionRef, $at) {
            $acquisition = Acquisition::query()->where('reference', strtoupper($acquisitionRef))->lockForUpdate()->first();
            if (!$acquisition) {
                throw new RuleViolationException('acquisition-inconnue', 'Acquisition introuvable.');
            }
            if ($acquisition->statut !== 'RESERVE') {
                throw new RuleViolationException('acquisition-ouverte', "Cet objet n'est pas prêt à être remis.");
            }

            $config = ConfigurationPlateforme::current();
            $garantieJusquau = WecceClock::addDays(WecceClock::dateOf($at), (int) ($config->duree_garantie_jours ?: 7));

            $acquisition->update([
                'statut' => 'REMIS',
                'retire_le' => $at,
                'garantie_jusquau' => $garantieJusquau,
            ]);

            $annonce = Annonce::query()->with('appareil')->findOrFail($acquisition->annonce_id);
            $annonce->update(['statut' => 'VENDUE']);
            $annonce->appareil->update(['statut' => 'RETIRE']);
        });
    }

    public function adjust(string $numeroCarte, string $direction, int $amount, string $reason, User $admin, string $at, ?string $ip = null): int
    {
        $etudiant = Etudiant::query()->with('comptePoints')->where('numero_carte', trim($numeroCarte))->first();
        if (!$etudiant || !$etudiant->comptePoints) {
            throw new RuleViolationException('compte-inconnu', 'Aucun compte pour cette carte.');
        }

        return $this->ajusterManuellement->execute(
            $etudiant->comptePoints,
            $etudiant->numero_carte,
            $direction,
            $amount,
            $reason,
            $admin,
            $at,
            $ip
        );
    }

    public function setSuspended(bool $suspended, string $reason, string $at, User $admin, ?string $ip = null): void
    {
        DB::transaction(function () use ($suspended, $reason, $at, $admin, $ip) {
            $config = ConfigurationPlateforme::query()->lockForUpdate()->findOrFail(1);
            if ($config->suspension_manuelle === $suspended) {
                return;
            }

            $config->update([
                'depots_ouverts' => !$suspended,
                'suspension_manuelle' => $suspended,
                'motif_suspension' => $suspended ? trim($reason) : null,
                'suspendu_le' => $suspended ? $at : null,
                'mis_a_jour_le' => $at,
                'mis_a_jour_par' => $admin->id,
            ]);

            JournalAdministration::query()->create([
                'administrateur_id' => $admin->id,
                'utilisateur_id' => $admin->id,
                'auteur_libelle' => $admin->auditSignature($ip),
                'action' => $suspended ? 'SUSPENSION' : 'REPRISE',
                'cible_type' => 'configuration_plateforme',
                'cible_id' => null,
                'cible_libelle' => 'Dépôts',
                'changement' => $suspended ? 'Ouverts → suspendus' : 'Suspendus → ouverts',
                'avant' => ['suspension_manuelle' => !$suspended],
                'apres' => ['suspension_manuelle' => $suspended],
                'motif' => trim($reason) !== '' ? trim($reason) : 'Réouverture des dépôts.',
                'effectue_le' => $at,
                'adresse_ip' => $ip,
            ]);
        });
    }

    public function saveBonus(int $ratePercent, int $quota, string $reason, string $at, User $admin, ?string $ip = null): void
    {
        DB::transaction(function () use ($ratePercent, $quota, $reason, $at, $admin, $ip) {
            $config = ConfigurationPlateforme::query()->lockForUpdate()->findOrFail(1);
            $oldRatePercent = (int) round($config->bonus_taux * 100);
            $oldQuota = (int) $config->bonus_quota;

            $change = "{$oldRatePercent} % · {$oldQuota} dépôts → {$ratePercent} % · {$quota} dépôts";
            $active = $ratePercent > 0 && $config->bonus_consomme < $quota;

            $config->update([
                'bonus_actif' => $active,
                'bonus_taux' => $ratePercent / 100,
                'bonus_quota' => $quota,
                'mis_a_jour_le' => $at,
                'mis_a_jour_par' => $admin->id,
            ]);

            JournalAdministration::query()->create([
                'administrateur_id' => $admin->id,
                'utilisateur_id' => $admin->id,
                'auteur_libelle' => $admin->auditSignature($ip),
                'action' => 'CONFIGURATION',
                'cible_type' => 'configuration_plateforme',
                'cible_id' => null,
                'cible_libelle' => 'Bonus de lancement',
                'changement' => $change,
                'avant' => ['taux' => $oldRatePercent, 'quota' => $oldQuota],
                'apres' => ['taux' => $ratePercent, 'quota' => $quota],
                'motif' => trim($reason),
                'effectue_le' => $at,
                'adresse_ip' => $ip,
            ]);
        });
    }

    public function monthlyFonte(string $at): array
    {
        return $this->appliquerFonte->execute($at);
    }

    public function debt(): int
    {
        return (int) ComptePoints::query()->where('statut', 'ACTIF')->sum('solde');
    }

    public function stockValue(): int
    {
        return (int) Annonce::query()
            ->whereIn('statut', ['A_PHOTOGRAPHIER', 'EN_LIGNE', 'RESERVEE'])
            ->sum('prix_courant');
    }

    public function coveringCount(): int
    {
        return (int) Annonce::query()
            ->whereIn('statut', ['A_PHOTOGRAPHIER', 'EN_LIGNE', 'RESERVEE'])
            ->count();
    }

    public function coverageRatio(): float
    {
        $d = $this->debt();
        return $d > 0 ? $this->stockValue() / $d : 9.99;
    }

    public function depositsSuspended(): bool
    {
        $config = ConfigurationPlateforme::current();
        return $config->suspension_manuelle || $this->coverageRatio() < (float) $config->seuil_suspension;
    }

    public function snapshot(string $at, ?string $event = null): SnapshotCouverture
    {
        $debt = $this->debt();
        $stock = $this->stockValue();
        $count = $this->coveringCount();
        $ratio = $debt > 0 ? round($stock / $debt, 3) : 9.990;
        $config = ConfigurationPlateforme::current();

        $niveau = 'OUVERT';
        if ($ratio < (float) $config->seuil_suspension) {
            $niveau = 'SUSPENDU';
        } elseif ($ratio < (float) $config->seuil_surveillance) {
            $niveau = 'SURVEILLANCE';
        }

        return SnapshotCouverture::query()->create([
            'arrete_le' => $at,
            'dette_en_points' => $debt,
            'valeur_stock' => $stock,
            'nb_objets_en_stock' => $count,
            'taux_couverture' => $ratio,
            'niveau' => $niveau,
            'evenement' => $event,
        ]);
    }
}
