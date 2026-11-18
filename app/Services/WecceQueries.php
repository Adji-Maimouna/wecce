<?php

namespace App\Services;

use App\Models\Acquisition;
use App\Models\Annonce;
use App\Models\Categorie;
use App\Models\ComptePoints;
use App\Models\ConfigurationPlateforme;
use App\Models\Depot;
use App\Models\Etudiant;
use App\Models\Expertise;
use App\Models\JournalAdministration;
use App\Models\MouvementPoints;
use App\Models\Photo;
use App\Models\SnapshotCouverture;
use App\Models\User;
use App\Services\Points\AppliquerFonte;
use App\Services\Points\RegleBonus;
use App\Support\WecceClock;
use App\Support\WecceCodes;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

/**
 * Projections et lectures pour les contrôleurs Inertia : produit exactement
 * les props camelCase attendues par chaque page React (GUIDE-FRONT-BACK.md sections 4 et 5).
 */
class WecceQueries
{
    public function __construct(
        private readonly WecceEngine $engine
    ) {}

    public function sessionFor(?User $user): array
    {
        if (!$user) {
            return [];
        }
        if ($user->role === 'ETUDIANT') {
            return [
                'student' => $this->studentEntity($user->id),
                'missedDeposits' => $this->missedDepositsForStudent($user->id),
            ];
        }
        if ($user->role === 'AGENT') {
            return [
                'agent' => $this->agentEntity($user->id),
                'appointmentsToReceive' => $this->appointmentsToReceive(),
                'partnerTodo' => $this->partnerTodo(),
            ];
        }

        return ['admin' => $this->adminEntity($user->id)];
    }

    public function studentEntity(string $userId): array
    {
        $u = User::query()->with(['etudiant.comptePoints'])->findOrFail($userId);
        $etudiant = $u->etudiant;
        $compte = $etudiant?->comptePoints;

        return [
            'prenom' => $u->prenom,
            'nom' => $u->nom,
            'role' => 'ETUDIANT',
            'email' => $u->email,
            'telephone' => $u->telephone,
            'numeroCarte' => $etudiant?->numero_carte ?? '',
            'niveau' => $etudiant?->niveau,
            'ufr' => $etudiant?->ufr,
            'balance' => (int) ($compte?->solde ?? 0),
            'heldPoints' => $this->engine->heldPoints($userId),
            'memberSince' => WecceClock::dayMonthYear($u->cree_le),
            'depositCount' => Depot::query()->where('etudiant_id', $userId)->count(),
        ];
    }

    public function agentEntity(string $userId): array
    {
        $u = User::query()->with('agent')->findOrFail($userId);
        $agent = $u->agent;

        return [
            'prenom' => $u->prenom,
            'nom' => $u->nom,
            'role' => 'AGENT',
            'email' => $u->email,
            'telephone' => $u->telephone,
            'fonction' => $agent?->fonction ?? '',
            'peutExpertiser' => (bool) ($agent?->peut_expertiser ?? true),
            'poste' => $agent?->poste ?? 'Comptoir 1',
        ];
    }

    public function adminEntity(string $userId): array
    {
        $u = User::query()->with('administrateur')->findOrFail($userId);

        return [
            'prenom' => $u->prenom,
            'nom' => $u->nom,
            'role' => 'ADMIN',
            'email' => $u->email,
            'telephone' => $u->telephone,
            'portee' => $u->administrateur?->portee ?? 'GLOBAL',
        ];
    }

    /** Compteurs de la barre latérale LBC : ce qui attend une action de la boutique. */
    public function partnerTodo(): array
    {
        return [
            'requests' => Depot::query()->where('statut', 'RDV_DEMANDE')->count(),
            'purchases' => Acquisition::query()->where('statut', 'A_VALIDER')->count(),
            'handovers' => Acquisition::query()->where('statut', 'RESERVE')->count(),
            'toPublish' => Annonce::query()->whereIn('statut', ['A_PHOTOGRAPHIER', 'EN_BOUTIQUE'])->where('origine', 'DEPOT_ETUDIANT')->count(),
        ];
    }

    public function appointmentsToReceive(): int
    {
        $today = WecceClock::today();

        return Depot::query()
            ->whereNotNull('date_rendez_vous')
            ->whereIn('statut', ['RDV_PRIS', 'EXPERTISE'])
            ->get()
            ->filter(fn (Depot $d) => WecceClock::dateOf($d->date_rendez_vous) === $today)
            ->count();
    }

    public function toPhoto(?Annonce $annonce): ?array
    {
        if (!$annonce) {
            return null;
        }
        $appareil = $annonce->relationLoaded('appareil') ? $annonce->appareil : $annonce->appareil()->with('photos')->first();
        $first = $appareil?->photos?->first();
        if (!$first) {
            return null;
        }

        return [
            'src' => $first->url,
            'alt' => $first->alt ?: ($this->engine->articleDisplayName($annonce) . ', photo prise au comptoir'),
            'width' => (int) ($first->largeur ?: 800),
            'height' => (int) ($first->hauteur ?: 800),
        ];
    }

    public function toMarketItem(Annonce $a, int $order, ?string $viewerId = null): array
    {
        $appareil = $a->appareil;
        $conditionSql = $appareil->etat_constate ?: $appareil->etat_declare;
        $condition = WecceCodes::CONDITION_FROM_SQL[$conditionSql] ?? 'bon';
        $depositorId = $a->depotOrigine?->etudiant_id;
        $photo = $this->toPhoto($a);

        $item = [
            'slug' => $a->slug,
            'name' => $this->engine->articleDisplayName($a),
            'keywords' => $a->mots_cles ?: $this->engine->articleDisplayName($a),
            'category' => $appareil->categorie_code,
            'price' => (int) $a->prix_courant,
            'condition' => $condition,
            'order' => $order,
            'mine' => $viewerId !== null && $depositorId === $viewerId,
            'reserved' => $a->statut === 'RESERVEE',
        ];

        if ($photo) {
            $item['photo'] = $photo;
        }
        if ($appareil->batterie_pourcent !== null) {
            $item['battery'] = (int) $appareil->batterie_pourcent;
        }
        if ($appareil->precision !== null && $appareil->precision !== '') {
            $item['detail'] = $appareil->precision;
        }

        return $item;
    }

    public function marketItems(?string $viewerId = null): array
    {
        $annonces = Annonce::query()
            ->with(['appareil.photos', 'depotOrigine'])
            ->whereIn('statut', ['EN_LIGNE', 'RESERVEE'])
            ->get()
            ->sort(function (Annonce $x, Annonce $y) {
                $tx = WecceClock::toIso($x->mise_en_ligne_le ?: $x->cree_le);
                $ty = WecceClock::toIso($y->mise_en_ligne_le ?: $y->cree_le);
                return $ty <=> $tx;
            })
            ->values();

        $result = [];
        foreach ($annonces as $idx => $a) {
            $result[] = $this->toMarketItem($a, $idx + 1, $viewerId);
        }

        return $result;
    }

    private function genericChecks(Annonce $a): array
    {
        $appareil = $a->appareil;
        $list = [];
        if ($appareil->batterie_pourcent !== null) {
            $list[] = [
                'label' => 'Batterie',
                'value' => "{$appareil->batterie_pourcent} % de sa capacité d'origine",
            ];
        }
        $list[] = [
            'label' => 'Fonctionnement',
            'value' => $appareil->categorie_code === 'piece'
                ? ($appareil->precision ?: 'Testé dans un appareil')
                : 'Testé au comptoir, tout fonctionne',
        ];
        if (in_array($appareil->categorie_code, ['tel', 'tab', 'ordi'], true)) {
            $list[] = [
                'label' => 'Comptes',
                'value' => 'Déconnectés, appareil réinitialisé',
            ];
        }

        return $list;
    }

    public function activeAcquisition(string $annonceId): ?Acquisition
    {
        return Acquisition::query()
            ->with('paiements')
            ->where('annonce_id', $annonceId)
            ->whereIn('statut', ['EN_ATTENTE', 'A_VALIDER', 'RESERVE'])
            ->first();
    }

    /** Dernier achat de cet objet refusé par LBC, s'il est le plus récent de l'étudiant sur cet objet. */
    public function lastRefusedAcquisition(string $viewerId, string $slug): ?array
    {
        $a = Annonce::query()->where('slug', $slug)->first();
        if (!$a) {
            return null;
        }
        $last = Acquisition::query()
            ->where('annonce_id', $a->id)
            ->where('etudiant_id', $viewerId)
            ->orderByDesc('cree_le')
            ->first();
        if (!$last || $last->statut !== 'ANNULE' || !$last->motif_refus) {
            return null;
        }

        return [
            'ref' => $last->reference,
            'reason' => $last->motif_refus,
            'at' => $last->valide_le ? WecceClock::stampAt($last->valide_le) : '',
        ];
    }

    public function itemPage(string $slug, ?string $viewerId = null, bool $includeSold = false): ?array
    {
        $a = Annonce::query()->with(['appareil.photos', 'depotOrigine'])->where('slug', $slug)->first();
        if (!$a) {
            return null;
        }

        $onMarket = in_array($a->statut, ['EN_LIGNE', 'RESERVEE'], true);
        if (!$onMarket && !($includeSold && $a->statut === 'VENDUE')) {
            return null;
        }

        $item = $this->toMarketItem($a, 0, $viewerId);
        $mine = (bool) ($item['mine'] ?? false);
        $activeAcq = $this->activeAcquisition($a->id);
        $holder = $activeAcq?->etudiant_id;

        $catLabel = WecceCodes::CATEGORY_NAME[$a->appareil->categorie_code] ?? 'Appareil';
        $originText = $mine
            ? 'votre dépôt'
            : ($a->origine === 'DEPOT_ETUDIANT' ? 'déposé par un étudiant' : 'stock de la boutique LBC');

        $examinedIso = $a->examine_le ?: ($a->mise_en_ligne_le ?: $a->cree_le);

        return [
            'details' => [
                'item' => $item,
                'title' => $a->titre ?: $item['name'],
                'details' => $a->sous_titre ?: "{$catLabel} · {$originText}",
                'examinedOn' => WecceClock::dayMonth($examinedIso),
                'checks' => !empty($a->controles) ? $a->controles : $this->genericChecks($a),
            ],
            'reservedByOther' => $a->statut === 'RESERVEE' && ($viewerId === null || $holder !== $viewerId),
            'reservedByMe' => $viewerId !== null && $a->statut === 'RESERVEE' && $holder === $viewerId,
        ];
    }

    public function acquisitionOf(string $viewerId, string $slug): ?array
    {
        $a = Annonce::query()->where('slug', $slug)->first();
        if (!$a) {
            return null;
        }

        $q = Acquisition::query()
            ->with('paiements')
            ->where('annonce_id', $a->id)
            ->where('etudiant_id', $viewerId)
            ->where('statut', '<>', 'ANNULE')
            ->orderByDesc('cree_le')
            ->first();

        if (!$q) {
            return null;
        }

        $config = ConfigurationPlateforme::current();
        $pickupDays = (int) ($config->delai_retrait_jours ?: 3);
        $from = $q->confirme_le ?: $q->cree_le;
        $paiement = $q->paiements->first();

        $statusMap = [
            'EN_ATTENTE' => 'en-attente',
            'A_VALIDER' => 'a-valider',
            'RESERVE' => 'reserve',
            'REMIS' => 'remis',
        ];

        $res = [
            'ref' => $q->reference,
            'method' => WecceCodes::PAYMENT_METHOD_FROM_SQL[$q->moyen_paiement] ?? 'especes',
            'points' => (int) $q->points_debites,
            'complement' => (int) $q->complement_du,
            'status' => $statusMap[$q->statut] ?? 'reserve',
            'sentAt' => WecceClock::stamp($q->cree_le),
            'pickupBefore' => WecceClock::weekdayDayMonth(WecceClock::addDays(WecceClock::dateOf($from), $pickupDays)),
        ];

        if ($paiement?->reference && $q->moyen_paiement !== 'ESPECES') {
            $res['paymentRef'] = $paiement->reference;
        }
        if ($q->confirme_le) {
            $res['confirmedAt'] = WecceClock::stampAt($q->confirme_le);
        }
        if ($q->valide_le) {
            $res['validatedAt'] = WecceClock::stampAt($q->valide_le);
        }
        if ($q->retire_le) {
            $res['handedAt'] = WecceClock::stampAt($q->retire_le);
        }
        if ($q->garantie_jusquau) {
            $res['warrantyUntil'] = WecceClock::dayMonthYear($q->garantie_jusquau);
        }

        return $res;
    }

    public function nextFonte(): string
    {
        return WecceClock::monthName(WecceClock::today(), 1);
    }

    public function toDeposit(Depot $d): array
    {
        $d->loadMissing(['appareil.photos', 'expertise.renoncement', 'annonce.appareil.photos']);
        $a = $d->annonce;
        $e = $d->expertise;
        $w = $e?->renoncement;
        $statusFront = WecceCodes::DEPOSIT_STATUS_FROM_SQL[$d->statut] ?? 'brouillon';
        $firstPhoto = $d->appareil->photos->first()?->url ?? $a?->appareil?->photos?->first()?->url;

        $base = [
            'ref' => $d->reference,
            'deviceName' => $d->appareil->fullName(),
            'category' => $d->appareil->categorie_code,
            'status' => $statusFront,
        ];
        if ($firstPhoto) {
            $base['photo'] = $firstPhoto;
        }
        if ($d->prix_souhaite !== null && in_array($statusFront, ['brouillon', 'demande-rdv', 'rendez-vous', 'a-signer'], true)) {
            $base['wish'] = (int) $d->prix_souhaite;
        }

        switch ($statusFront) {
            case 'brouillon':
                $missingParts = [];
                if ((int) $d->nb_photos_declarees === 0 && $d->appareil->photos->isEmpty()) {
                    $missingParts[] = 'les photos';
                }
                if (!$d->date_rendez_vous) {
                    $missingParts[] = 'le rendez-vous';
                }
                $base['stageIndex'] = 0;
                if (count($missingParts)) {
                    $base['missing'] = 'Il manque ' . implode(' et ', $missingParts);
                }
                return $base;

            case 'demande-rdv':
                $base['stageIndex'] = 1;
                $base['request'] = [
                    'sentAt' => WecceClock::dayMonth($d->cree_le),
                    'summary' => $this->availabilitySummary($d->disponibilites),
                ];
                return $base;

            case 'rendez-vous':
                $base['stageIndex'] = 1;
                if ($d->date_rendez_vous) {
                    $base['appointment'] = [
                        'label' => WecceClock::capitalize(WecceClock::weekdayDayMonth($d->date_rendez_vous)) . ', ' . WecceClock::time($d->date_rendez_vous),
                        'long' => WecceClock::weekdayDayMonth($d->date_rendez_vous) . ' à ' . WecceClock::time($d->date_rendez_vous),
                        'missed' => WecceClock::dateOf($d->date_rendez_vous) < WecceClock::today(),
                    ];
                }
                return $base;

            case 'a-signer':
                $base['stageIndex'] = 3;
                if ($e) {
                    $base['examinedOn'] = WecceClock::dayMonth($e->realisee_le);
                }
                return $base;

            case 'repris':
                $base['stageIndex'] = ($a && $a->statut !== 'A_PHOTOGRAPHIER') ? 5 : 4;
                if ($w) {
                    $base['signedOn'] = WecceClock::dayMonth($w->signe_le);
                }
                $modeFront = WecceCodes::TAKEBACK_MODE_FROM_SQL[$e?->mode_reprise ?? 'VENTE_WECCE'] ?? 'vente';
                if ($e && $e->decision !== 'REFUSE' && $modeFront !== 'echange-objet') {
                    $base['takeBack'] = [
                        'points' => (int) $e->valeur_reprise,
                        'bonus' => (int) ($w?->bonus_accorde ?? 0),
                    ];
                }
                if ($modeFront !== 'vente') {
                    $base['exchange'] = ['mode' => $modeFront, 'counterpart' => $e?->contrepartie_libelle];
                    $base['stageIndex'] = 5;
                    unset($base['prices']);
                    return $base;
                }
                if ($a) {
                    $base['prices'] = [
                        'initial' => (int) $a->prix_initial,
                        'today' => (int) $a->prix_courant,
                    ];
                    if (in_array($a->statut, ['EN_LIGNE', 'RESERVEE'], true)) {
                        $base['itemSlug'] = $a->slug;
                    }
                }
                return $base;

            case 'refuse':
                if ($e) {
                    $base['examinedOn'] = WecceClock::dayMonth($e->realisee_le);
                    if ($e->decision === 'REFUSE') {
                        $base['refusal'] = [
                            'reason' => $e->motif_refus ?: 'modele',
                            'comment' => $e->commentaire ?: '',
                        ];
                    }
                }
                return $base;

            case 'annule':
                if ($d->cloture_le) {
                    $base['cancelledOn'] = WecceClock::dayMonth($d->cloture_le);
                }
                if ($e) {
                    $base['examinedOn'] = WecceClock::dayMonth($e->realisee_le);
                }
                return $base;
        }

        return $base;
    }

    public function studentDeposits(string $viewerId): array
    {
        $mine = Depot::query()
            ->with(['appareil.photos', 'expertise.renoncement', 'annonce.appareil.photos'])
            ->where('etudiant_id', $viewerId)
            ->get();

        $openStatuses = ['BROUILLON', 'RDV_DEMANDE', 'RDV_PRIS', 'EXPERTISE'];

        $current = $mine
            ->filter(fn (Depot $d) => in_array($d->statut, $openStatuses, true))
            ->sortBy(fn (Depot $d) => $d->date_rendez_vous ? WecceClock::toIso($d->date_rendez_vous) : '9999')
            ->values()
            ->map(fn (Depot $d) => $this->toDeposit($d))
            ->all();

        $done = $mine
            ->reject(fn (Depot $d) => in_array($d->statut, $openStatuses, true))
            ->sortByDesc(function (Depot $d) {
                $when = $d->expertise?->renoncement?->signe_le
                    ?? $d->expertise?->realisee_le
                    ?? $d->cloture_le
                    ?? $d->cree_le;
                return WecceClock::toIso($when);
            })
            ->values()
            ->map(fn (Depot $d) => $this->toDeposit($d))
            ->all();

        return [
            'current' => $current,
            'done' => $done,
        ];
    }

    public function schedule(?string $exceptRef = null): array
    {
        $today = WecceClock::today();
        $times = config('wecce.appointment_times');
        $dates = [];

        for ($i = 0; count($dates) < 4; $i++) {
            $d = WecceClock::addDays($today, $i);
            if (WecceClock::weekday($d) !== 0) {
                $dates[] = $d;
            }
        }

        $nowMinutes = WecceClock::minutesOf(WecceClock::now());

        $activeSlots = Depot::query()
            ->whereNotNull('date_rendez_vous')
            ->whereNotIn('statut', ['ANNULE', 'BROUILLON'])
            ->when($exceptRef, fn ($q) => $q->where('reference', '<>', strtoupper($exceptRef)))
            ->pluck('date_rendez_vous')
            ->map(fn ($dt) => WecceClock::toIso($dt))
            ->all();

        $busySet = array_flip($activeSlots);

        $days = [];
        foreach ($dates as $date) {
            $taken = [];
            foreach ($times as $idx => $t) {
                $slotIso = "{$date}T" . WecceClock::parseTime($t);
                $busy = isset($busySet[$slotIso]);
                $past = $date === $today && WecceClock::minutesOf($slotIso) <= $nowMinutes;
                if ($busy || $past) {
                    $taken[] = $idx;
                }
            }
            $picker = WecceClock::pickerDay($date);
            $days[] = [
                'label' => $picker['label'],
                'month' => $picker['month'],
                'freeCount' => count($times) - count($taken),
                'taken' => $taken,
            ];
        }

        return [
            'days' => $days,
            'times' => $times,
            'dates' => $dates,
        ];
    }

    public function slotPosition(?string $slotIso, array $schedule): ?array
    {
        if (!$slotIso) {
            return null;
        }
        $iso = WecceClock::toIso($slotIso);
        $date = WecceClock::dateOf($iso);
        $timePart = substr($iso, 11, 5);

        $dayIdx = array_search($date, $schedule['dates'], true);
        if ($dayIdx === false) {
            return null;
        }

        foreach ($schedule['times'] as $tIdx => $label) {
            if (WecceClock::parseTime($label) === $timePart) {
                return ['day' => (int) $dayIdx, 'slot' => (int) $tIdx];
            }
        }

        return null;
    }

    public function firstFree(array $schedule): array
    {
        foreach ($schedule['days'] as $dayIdx => $dayData) {
            foreach ($schedule['times'] as $slotIdx => $_) {
                if (!in_array($slotIdx, $dayData['taken'], true)) {
                    return ['day' => (int) $dayIdx, 'slot' => (int) $slotIdx];
                }
            }
        }

        return ['day' => 0, 'slot' => null];
    }

    public function slotFrom(int $day, int $slot, ?string $exceptRef = null): string
    {
        $s = $this->schedule($exceptRef);
        $date = $s['dates'][$day] ?? null;
        $timeLabel = $s['times'][$slot] ?? null;

        if (!$date || !$timeLabel || in_array($slot, $s['days'][$day]['taken'] ?? [], true)) {
            throw new \App\Exceptions\RuleViolationException('creneau-pris', "Ce créneau n'est plus libre. Choisissez-en un autre.");
        }

        return "{$date}T" . WecceClock::parseTime($timeLabel);
    }

    public function reschedulePage(string $viewerId, string $ref): ?array
    {
        $d = Depot::query()
            ->with(['appareil.photos', 'expertise.renoncement', 'annonce'])
            ->where('reference', strtoupper($ref))
            ->where('etudiant_id', $viewerId)
            ->whereIn('statut', ['RDV_DEMANDE', 'RDV_PRIS'])
            ->first();

        if (!$d) {
            return null;
        }

        return [
            'deposit' => $this->toDeposit($d),
            'availabilityDays' => $this->availabilityDays(),
            'availability' => is_array($d->disponibilites) ? $d->disponibilites : null,
        ];
    }

    public function draftOf(string $viewerId, string $ref): ?array
    {
        $d = Depot::query()
            ->with('appareil')
            ->where('reference', strtoupper($ref))
            ->where('etudiant_id', $viewerId)
            ->where('statut', 'BROUILLON')
            ->first();

        if (!$d) {
            return null;
        }

        $piece = $d->appareil->categorie_code === 'piece';
        $etatFront = WecceCodes::CONDITION_FROM_SQL[$d->appareil->etat_declare] ?? ($piece ? 'fonctionnel' : 'bon');

        $draft = [
            'draftRef' => $d->reference,
            'category' => $d->appareil->categorie_code,
            'modele' => $d->appareil->designation,
            'stockage' => $d->appareil->stockage ?? '',
            'age' => WecceCodes::AGE_FROM_SQL[$d->appareil->age_declare] ?? '1-2',
            'souhait' => $d->prix_souhaite,
        ];

        if ($piece) {
            $draft['etatPiece'] = $etatFront;
        } else {
            $draft['etat'] = $etatFront;
        }

        return $draft;
    }

    public function depositsSuspension(): array
    {
        $config = ConfigurationPlateforme::current();
        $suspended = $this->engine->depositsSuspended();

        return [
            'suspended' => $suspended,
            'reason' => $suspended
                ? ($config->motif_suspension ?: 'La couverture du stock est passée sous le seuil.')
                : null,
        ];
    }

    public function bonusOffer(?string $viewerId = null): ?array
    {
        $c = ConfigurationPlateforme::current();
        $compte = $viewerId ? ComptePoints::query()->where('etudiant_id', $viewerId)->first() : null;
        if (!RegleBonus::eligible($c, $compte)) {
            return null;
        }

        return [
            'rate' => min(RegleBonus::TAUX_MAX_POURCENT, (int) round($c->bonus_taux * 100)),
            'quota' => (int) $c->bonus_quota,
            'left' => (int) ($c->bonus_quota - $c->bonus_consomme),
            'cap' => (int) $c->bonus_plafond_points,
            'onePerStudent' => (bool) $c->bonus_un_par_etudiant,
        ];
    }

    public function balancePage(string $viewerId): array
    {
        $compte = ComptePoints::query()->where('etudiant_id', $viewerId)->first();
        $balance = (int) ($compte?->solde ?? 0);

        $items = $this->marketItems($viewerId);
        $online = array_values(array_filter($items, fn (array $i) => empty($i['reserved'])));
        $phones = array_values(array_filter($online, fn (array $i) => $i['category'] === 'tel' && !empty($i['photo'])));

        $candidates = count($phones) ? $phones : $online;
        usort($candidates, fn (array $a, array $b) => $a['price'] <=> $b['price']);
        $ref = $candidates[0] ?? null;

        $moves = $compte
            ? MouvementPoints::query()
                ->where('compte_id', $compte->id)
                ->get()
                ->sortBy(fn (MouvementPoints $m) => WecceClock::toIso($m->effectue_le))
                ->values()
            : collect();

        $movements = $moves
            ->reverse()
            ->values()
            ->map(fn (MouvementPoints $m) => [
                'date' => WecceClock::dayMonthYearShort($m->effectue_le),
                'type' => WecceCodes::MOVEMENT_FROM_SQL[$m->type] ?? 'ajustement',
                'detail' => $m->libelle,
                'amount' => (int) $m->montant,
                'balanceAfter' => (int) $m->solde_apres,
            ])
            ->all();

        return [
            'balance' => $balance,
            'itemsInBalance' => count(array_filter($online, fn (array $i) => $i['price'] <= $balance)),
            'reference' => $ref
                ? ['name' => explode(' · ', $ref['name'])[0], 'price' => (int) $ref['price']]
                : ['name' => 'Tecno Spark 4', 'price' => 24500],
            'history' => $this->balanceHistory($viewerId, $moves->all()),
            'movements' => $movements,
        ];
    }

    /**
     * @param array<int, MouvementPoints> $moves
     */
    private function balanceHistory(string $viewerId, array $moves): ?array
    {
        $first = null;
        foreach ($moves as $m) {
            if ($m->type === 'CREDIT_DEPOT') {
                $first = $m;
                break;
            }
        }
        if (!$first) {
            return null;
        }

        $depot = Depot::query()
            ->with(['appareil', 'expertise.renoncement'])
            ->where('etudiant_id', $viewerId)
            ->get()
            ->first(fn (Depot $d) => $d->expertise?->renoncement && WecceClock::toIso($d->expertise->renoncement->signe_le) === WecceClock::toIso($first->effectue_le));

        if (!$depot || !$depot->expertise || $depot->expertise->decision === 'REFUSE') {
            return null;
        }

        $price = (int) $depot->expertise->prix_affichage;
        $balanceAt = function (string $date) use ($moves): int {
            for ($i = count($moves) - 1; $i >= 0; $i--) {
                if (WecceClock::dateOf($moves[$i]->effectue_le) <= $date) {
                    return (int) $moves[$i]->solde_apres;
                }
            }
            return 0;
        };

        $start = WecceClock::dateOf($first->effectue_le);
        $points = [
            [
                'label' => WecceClock::dayMonthShort($start),
                'day' => 0,
                'balance' => $balanceAt($start),
                'price' => $price,
            ],
        ];

        $fonteDates = [];
        foreach ($moves as $m) {
            if ($m->type === 'FONTE') {
                $d = WecceClock::dateOf($m->effectue_le);
                if ($d > $start && !in_array($d, $fonteDates, true)) {
                    $fonteDates[] = $d;
                }
            }
        }

        foreach ($fonteDates as $d) {
            $price = AppliquerFonte::afterFonte($price, 1);
            $points[] = [
                'label' => WecceClock::dayMonthShort($d),
                'day' => WecceClock::daysBetween($start, $d),
                'balance' => $balanceAt($d),
                'price' => $price,
            ];
        }

        $today = WecceClock::today();
        $p = WecceClock::parts($today);
        $nextMonth = $p['m'] === 12 ? 1 : $p['m'] + 1;
        $nextYear = $p['m'] === 12 ? $p['y'] + 1 : $p['y'];
        $nextDate = sprintf('%04d-%02d-01', $nextYear, $nextMonth);
        $current = $balanceAt($today);

        $points[] = [
            'label' => WecceClock::dayMonthShort($nextDate),
            'day' => WecceClock::daysBetween($start, $nextDate),
            'balance' => AppliquerFonte::afterFonte($current, 1),
            'price' => AppliquerFonte::afterFonte($price, 1),
            'projected' => true,
        ];

        return [
            'itemName' => $depot->appareil->designation,
            'points' => $points,
        ];
    }

    public function waiverOf(string $ref): ?array
    {
        $d = Depot::query()
            ->with(['etudiant.utilisateur', 'etudiant.comptePoints', 'appareil', 'expertise.agent.utilisateur', 'expertise.renoncement.agent.utilisateur'])
            ->where('reference', strtoupper($ref))
            ->first();

        $e = $d?->expertise;
        if (!$d || !$e || $e->decision === 'REFUSE' || !in_array($d->statut, ['EXPERTISE', 'VALIDE'], true)) {
            return null;
        }

        $u = $d->etudiant->utilisateur;
        $signed = $e->renoncement;
        $agentModel = $signed?->agent ?? $e->agent;
        $agentUser = $agentModel->utilisateur;

        $config = ConfigurationPlateforme::current();
        $pending = ($e->mode_reprise ?? 'VENTE_WECCE') === 'ECHANGE_OBJET'
            ? ['bonus' => 0, 'ratePercent' => 0]
            : RegleBonus::pour($config, $d->etudiant->comptePoints, (int) $e->valeur_reprise);

        $serialRaw = $signed?->numero_serie_constate ?: ($e->numero_serie_saisi ?: $d->appareil->numero_serie);

        return [
            'ref' => $d->reference,
            'place' => $signed?->lieu ?: (string) config('wecce.partenaire_lieu'),
            'openedAt' => WecceClock::fullStamp($e->realisee_le),
            'depositor' => [
                'name' => $u->shortName(),
                'card' => $d->etudiant->numero_carte,
                'study' => $d->etudiant->studyLabel(),
            ],
            'device' => [
                'name' => $d->appareil->fullName(),
                'serial' => $serialRaw ? WecceEngine::maskSerial($serialRaw) : 'non relevé',
                'condition' => WecceCodes::CONDITION_FROM_SQL[$e->etat_constate] ?? 'bon',
                'battery' => $e->batterie_pourcent !== null ? (int) $e->batterie_pourcent : null,
            ],
            'wish' => $d->prix_souhaite !== null ? (int) $d->prix_souhaite : null,
            'takeBack' => (int) $e->valeur_reprise,
            'listPrice' => (int) $e->prix_affichage,
            'bonusRate' => $signed ? (int) round($signed->bonus_taux * 100) : $pending['ratePercent'],
            'bonus' => $signed ? (int) $signed->bonus_accorde : $pending['bonus'],
            'pieces' => $e->decision === 'ACCEPTE_EN_PIECES',
            'mode' => WecceCodes::TAKEBACK_MODE_FROM_SQL[$e->mode_reprise ?? 'VENTE_WECCE'] ?? 'vente',
            'counterpart' => $e->contrepartie_libelle,
            'balanceBefore' => $signed ? (int) $signed->solde_avant : (int) ($d->etudiant->comptePoints?->solde ?? 0),
            'signedAt' => $signed ? WecceClock::stampYear($signed->signe_le) : '',
            'agent' => ($agentModel->poste ?: 'Comptoir') . ' · ' . $agentUser->shortName(),
            'hash' => $signed?->empreinte ?? '',
        ];
    }

    public function depositState(string $ref): ?array
    {
        $d = Depot::query()->where('reference', strtoupper($ref))->first();
        if (!$d) {
            return null;
        }

        return [
            'userId' => $d->etudiant_id,
            'status' => WecceCodes::DEPOSIT_STATUS_FROM_SQL[$d->statut] ?? 'brouillon',
        ];
    }

    public function homePage(): array
    {
        $repris = Depot::query()
            ->with(['appareil', 'expertise.renoncement', 'annonce.appareil.photos'])
            ->where('statut', 'VALIDE')
            ->get()
            ->filter(fn (Depot $d) => $d->expertise?->renoncement !== null);

        $recentTakeBacks = $repris
            ->filter(fn (Depot $d) => $this->toPhoto($d->annonce) !== null && $d->expertise && $d->expertise->decision !== 'REFUSE')
            ->sortByDesc(fn (Depot $d) => WecceClock::toIso($d->expertise->renoncement->signe_le))
            ->take(5)
            ->values()
            ->map(fn (Depot $d) => [
                'photo' => $this->toPhoto($d->annonce),
                'points' => (int) $d->expertise->valeur_reprise,
                'label' => $d->appareil->designation . ' · repris le ' . WecceClock::dayMonthShort($d->expertise->renoncement->signe_le),
            ])
            ->all();

        $items = $this->marketItems();
        $wanted = ['airpods', 'casque-sony', 'galaxy-a12', 'ipad-2017'];
        $available = array_values(array_filter($items, fn (array $i) => empty($i['reserved']) && !empty($i['photo'])));

        $preview = [];
        $seen = [];
        foreach ($wanted as $slug) {
            foreach ($available as $av) {
                if ($av['slug'] === $slug) {
                    $preview[] = $av;
                    $seen[$slug] = true;
                    break;
                }
            }
        }
        foreach ($available as $av) {
            if (!isset($seen[$av['slug']])) {
                $preview[] = $av;
            }
        }

        return [
            'recentTakeBacks' => $recentTakeBacks,
            'takenBackCount' => $repris->count(),
            'previewItems' => array_slice($preview, 0, 4),
            'previewBalance' => 30000,
            'marketTotal' => count($items),
            'faq' => $this->faqData()['faq'],
        ];
    }

    private function deviceInfo(Depot $d): string
    {
        $e = $d->expertise;
        $conditionSql = ($e && $e->decision !== 'REFUSE' && $e->etat_constate)
            ? $e->etat_constate
            : $d->appareil->etat_declare;

        $catName = WecceCodes::CATEGORY_NAME[$d->appareil->categorie_code] ?? 'Appareil';
        $ageCode = WecceCodes::AGE_FROM_SQL[$d->appareil->age_declare] ?? '1-2';
        $condCode = WecceCodes::CONDITION_FROM_SQL[$conditionSql] ?? 'bon';

        return implode(' · ', [
            $catName,
            WecceCodes::AGE_NAME[$ageCode] ?? '1 à 2 ans',
            WecceCodes::CONDITION_NAME[$condCode] ?? 'bon état',
        ]);
    }

    public function toAppointment(Depot $d): array
    {
        $d->loadMissing(['etudiant.utilisateur', 'appareil', 'expertise']);
        $u = $d->etudiant->utilisateur;
        $e = $d->expertise;

        $statusMap = [
            'BROUILLON' => 'a-venir',
            'RDV_DEMANDE' => 'a-planifier',
            'RDV_PRIS' => 'a-venir',
            'EXPERTISE' => 'a-signer',
            'VALIDE' => 'repris',
            'REFUSE' => 'refuse',
            'ANNULE' => 'annule',
        ];

        $missed = $d->statut === 'RDV_PRIS'
            && $d->date_rendez_vous
            && WecceClock::dateOf($d->date_rendez_vous) < WecceClock::today();

        $app = [
            'time' => $d->date_rendez_vous ? WecceClock::time($d->date_rendez_vous) : '',
            'dateLabel' => $d->date_rendez_vous
                ? WecceClock::capitalize(WecceClock::dayMonthShort($d->date_rendez_vous)) . ' · ' . WecceClock::time($d->date_rendez_vous)
                : '',
            'missed' => $missed,
            'student' => [
                'name' => $u->shortName(),
                'initials' => $u->initials(),
                'card' => $d->etudiant->numero_carte,
                'phone' => $u->telephone,
            ],
            'depositRef' => $d->reference,
            'device' => $d->appareil->fullName(),
            'deviceInfo' => $this->deviceInfo($d),
            'wish' => $d->prix_souhaite !== null ? (int) $d->prix_souhaite : null,
            'status' => $statusMap[$d->statut] ?? 'a-venir',
        ];

        if ($e && $e->decision !== 'REFUSE' && $d->statut === 'VALIDE') {
            $app['takeBack'] = (int) $e->valeur_reprise;
        }
        if ($e && $e->decision === 'REFUSE' && $e->motif_refus) {
            $app['refusalShort'] = WecceCodes::REFUSAL_SHORT[$e->motif_refus] ?? $e->motif_refus;
        }
        if (is_array($d->disponibilites) && in_array($d->statut, ['RDV_DEMANDE', 'RDV_PRIS'], true)) {
            $app['request'] = [
                'sentAt' => WecceClock::capitalize(WecceClock::dayMonthShort($d->cree_le)) . ', ' . WecceClock::time($d->cree_le),
                'summary' => $this->availabilitySummary($d->disponibilites),
                'days' => array_values($d->disponibilites['days'] ?? []),
                'moment' => $d->disponibilites['moment'] ?? 'indifferent',
                'note' => $d->disponibilites['note'] ?? '',
            ];
        }

        return $app;
    }

    /** Jours d'ouverture proposés à l'étudiant pour indiquer ses disponibilités (6 jours, sans dimanche). */
    public function availabilityDays(int $count = 6): array
    {
        $today = WecceClock::today();
        $lastTime = WecceClock::parseTime((string) last(config('wecce.appointment_times')));
        $start = WecceClock::minutesOf(WecceClock::now()) >= WecceClock::minutesOf("{$today}T{$lastTime}") ? 1 : 0;

        $days = [];
        for ($i = $start; count($days) < $count; $i++) {
            $d = WecceClock::addDays($today, $i);
            if (WecceClock::weekday($d) === 0) {
                continue;
            }
            $picker = WecceClock::pickerDay($d);
            $days[] = [
                'date' => $d,
                'label' => $d === $today ? "Aujourd'hui" : $picker['label'],
                'month' => $picker['month'],
            ];
        }

        return $days;
    }

    /** « lun. 23 nov., mar. 24 nov. · le matin · « après 10 h » » */
    public function availabilitySummary(?array $av): string
    {
        if (!$av || empty($av['days'])) {
            return 'Disponibilités non indiquées';
        }
        $days = array_map(function (string $d): string {
            $p = WecceClock::parts($d);
            $wd = mb_substr(WecceClock::WEEKDAYS[WecceClock::weekday($d)], 0, 3, 'UTF-8');
            return "{$wd}. " . WecceClock::dayNumber($p['d']) . ' ' . WecceClock::MONTHS_SHORT[$p['m']];
        }, $av['days']);
        $moment = ['matin' => 'le matin', 'apres-midi' => "l'après-midi", 'indifferent' => 'toute la journée'][$av['moment'] ?? 'indifferent'] ?? 'toute la journée';
        $txt = implode(', ', $days) . ' · ' . $moment;
        if (!empty($av['note'])) {
            $txt .= ' · « ' . $av['note'] . ' »';
        }

        return $txt;
    }

    /** Demandes de rendez-vous en attente d'un créneau fixé par LBC, la plus ancienne d'abord. */
    public function appointmentRequests(): array
    {
        return Depot::query()
            ->with(['etudiant.utilisateur', 'appareil', 'expertise'])
            ->where('statut', 'RDV_DEMANDE')
            ->get()
            ->sortBy(fn (Depot $d) => WecceClock::toIso($d->cree_le))
            ->values()
            ->map(fn (Depot $d) => $this->toAppointment($d))
            ->all();
    }

    /**
     * Page Rendez-vous de LBC : un jour choisi librement (navigation précédent / suivant, calendrier),
     * la semaine qui le contient, les demandes à planifier et les rendez-vous manqués.
     */
    public function rendezVousPage(?string $date = null): array
    {
        $today = WecceClock::today();
        $day = (is_string($date) && preg_match('/^\d{4}-\d{2}-\d{2}$/', $date) === 1) ? $date : $today;

        $weekday = WecceClock::weekday($day);
        $monday = WecceClock::addDays($day, $weekday === 0 ? -6 : 1 - $weekday);

        $active = Depot::query()
            ->whereNotNull('date_rendez_vous')
            ->where('statut', '<>', 'BROUILLON')
            ->get(['date_rendez_vous', 'statut']);
        $countOn = fn (string $d): array => [
            'total' => $active->filter(fn (Depot $x) => WecceClock::dateOf($x->date_rendez_vous) === $d && $x->statut !== 'ANNULE')->count(),
            'open' => $active->filter(fn (Depot $x) => WecceClock::dateOf($x->date_rendez_vous) === $d && in_array($x->statut, ['RDV_PRIS', 'EXPERTISE'], true))->count(),
        ];

        $week = [];
        for ($i = 0; $i < 6; $i++) {
            $d = WecceClock::addDays($monday, $i);
            $p = WecceClock::parts($d);
            $c = $countOn($d);
            $week[] = [
                'date' => $d,
                'weekday' => WecceClock::capitalize(mb_substr(WecceClock::WEEKDAYS[WecceClock::weekday($d)], 0, 3, 'UTF-8')) . '.',
                'day' => $p['d'],
                'count' => $c['total'],
                'open' => $c['open'],
                'isToday' => $d === $today,
            ];
        }

        $prev = $this->openingDay($day, -1);
        $next = $this->openingDay($day, 1);

        $relative = match (true) {
            $day === $today => "Aujourd'hui",
            $day === WecceClock::addDays($today, 1) => 'Demain',
            $day === WecceClock::addDays($today, -1) => 'Hier',
            default => null,
        };

        $first = $active->filter(fn (Depot $x) => $x->statut !== 'ANNULE')->map(fn (Depot $x) => WecceClock::dateOf($x->date_rendez_vous))->sort()->values();
        $upcoming = $first->first(fn (string $d) => $d > $day);
        $past = $first->reverse()->first(fn (string $d) => $d < $day);

        return [
            'date' => $day,
            'today' => $today,
            'label' => WecceClock::longDate($day),
            'relative' => $relative,
            'isPast' => $day < $today,
            'closed' => WecceClock::weekday($day) === 0,
            'appointments' => $this->appointmentsOn($day),
            'week' => $week,
            'prevDate' => $prev,
            'nextDate' => $next,
            'prevWeek' => WecceClock::addDays($monday, -7),
            'nextWeek' => WecceClock::addDays($monday, 7),
            'nearestBefore' => $past,
            'nearestAfter' => $upcoming,
            'requests' => $this->appointmentRequests(),
            'missed' => $this->missedAppointments(),
            'times' => array_map(fn (string $t) => ['label' => $t, 'value' => WecceClock::parseTime($t)], config('wecce.appointment_times')),
        ];
    }

    public function appointmentsOn(string $date): array
    {
        return Depot::query()
            ->with(['etudiant.utilisateur', 'appareil', 'expertise'])
            ->whereNotNull('date_rendez_vous')
            ->where('statut', '<>', 'BROUILLON')
            ->get()
            ->filter(fn (Depot $d) => WecceClock::dateOf($d->date_rendez_vous) === $date)
            ->sortBy(fn (Depot $d) => WecceClock::toIso($d->date_rendez_vous))
            ->values()
            ->map(fn (Depot $d) => $this->toAppointment($d))
            ->all();
    }

    private function openingDay(string $from, int $step): string
    {
        $d = WecceClock::addDays($from, $step);
        while (WecceClock::weekday($d) === 0) {
            $d = WecceClock::addDays($d, $step);
        }
        return $d;
    }

    public function counterDays(): array
    {
        $today = WecceClock::today();
        $before = $this->openingDay($today, -1);
        $after = $this->openingDay($today, 1);

        $shortName = fn (string $date): string => WecceClock::capitalize(mb_strtolower(explode(' ', WecceClock::longDate($date))[0], 'UTF-8'));

        $makeDay = fn (string $date, string $short): array => [
            'label' => WecceClock::longDate($date),
            'short' => $short,
            'appointments' => $this->appointmentsOn($date),
        ];

        return [
            'hier' => $makeDay($before, $before === WecceClock::addDays($today, -1) ? 'Hier' : $shortName($before)),
            'aujourdhui' => $makeDay($today, "Aujourd'hui"),
            'demain' => $makeDay($after, $after === WecceClock::addDays($today, 1) ? 'Demain' : $shortName($after)),
        ];
    }

    public function expertiseQueue(): array
    {
        return array_values(array_filter(
            $this->appointmentsOn(WecceClock::today()),
            fn (array $a) => $a['status'] === 'a-venir'
        ));
    }

    public function missedAppointments(): array
    {
        $today = WecceClock::today();

        return Depot::query()
            ->with(['etudiant.utilisateur', 'appareil', 'expertise'])
            ->where('statut', 'RDV_PRIS')
            ->whereNotNull('date_rendez_vous')
            ->get()
            ->filter(fn (Depot $d) => WecceClock::dateOf($d->date_rendez_vous) < $today)
            ->sortByDesc(fn (Depot $d) => WecceClock::toIso($d->date_rendez_vous))
            ->values()
            ->map(fn (Depot $d) => $this->toAppointment($d))
            ->all();
    }

    public function missedDepositsForStudent(string $studentId): array
    {
        $today = WecceClock::today();

        return Depot::query()
            ->with('appareil')
            ->where('etudiant_id', $studentId)
            ->where('statut', 'RDV_PRIS')
            ->whereNotNull('date_rendez_vous')
            ->get()
            ->filter(fn (Depot $d) => WecceClock::dateOf($d->date_rendez_vous) < $today)
            ->sortByDesc(fn (Depot $d) => WecceClock::toIso($d->date_rendez_vous))
            ->values()
            ->map(fn (Depot $d) => [
                'ref' => $d->reference,
                'deviceName' => $d->appareil->fullName(),
                'scheduledAt' => WecceClock::capitalize(WecceClock::dayMonthShort($d->date_rendez_vous)) . ' à ' . WecceClock::time($d->date_rendez_vous),
            ])
            ->all();
    }

    public function declaredDevice(string $ref): ?array
    {
        $d = Depot::query()
            ->with(['etudiant.utilisateur', 'appareil.photos'])
            ->where('reference', strtoupper($ref))
            ->first();

        if (!$d) {
            return null;
        }

        $u = $d->etudiant->utilisateur;
        $today = WecceClock::today();
        $appointmentTime = 'sans rendez-vous';
        if ($d->date_rendez_vous) {
            $appointmentTime = WecceClock::dateOf($d->date_rendez_vous) === $today
                ? WecceClock::time($d->date_rendez_vous)
                : (WecceClock::weekdayDayMonth($d->date_rendez_vous) . ', ' . WecceClock::time($d->date_rendez_vous));
        }

        $photos = $d->appareil->photos
            ->sortBy('ordre')
            ->values()
            ->map(fn (Photo $p) => [
                'src' => $p->url,
                'alt' => $p->alt ?: $d->appareil->designation,
            ])
            ->all();

        $photoCount = count($photos) > 0 ? count($photos) : (int) $d->nb_photos_declarees;

        return [
            'depositRef' => $d->reference,
            'student' => [
                'name' => $u->shortName(),
                'card' => $d->etudiant->numero_carte,
            ],
            'appointmentTime' => $appointmentTime,
            'category' => $d->appareil->categorie_code,
            'modele' => $d->appareil->designation,
            'stockage' => $d->appareil->stockage ?: 'non indiqué',
            'age' => WecceCodes::AGE_FROM_SQL[$d->appareil->age_declare] ?? '1-2',
            'etat' => WecceCodes::CONDITION_FROM_SQL[$d->appareil->etat_declare] ?? 'bon',
            'photoCount' => $photoCount,
            'photos' => $photos,
            'wish' => $d->prix_souhaite !== null ? (int) $d->prix_souhaite : null,
        ];
    }

    /** Objets du stock propre de LBC pouvant être donnés en échange direct d'un dépôt. */
    public function exchangeableShopItems(): array
    {
        return Annonce::query()
            ->with('appareil')
            ->where('origine', 'STOCK_PARTENAIRE')
            ->whereIn('statut', ['EN_LIGNE', 'EN_BOUTIQUE'])
            ->orderBy('prix_courant')
            ->get()
            ->map(fn (Annonce $a) => [
                'id' => $a->id,
                'name' => $this->engine->articleDisplayName($a),
                'price' => (int) $a->prix_courant,
                'online' => $a->statut === 'EN_LIGNE',
            ])
            ->values()
            ->all();
    }

    public function expertiseControls(string $category): array
    {
        return WecceEngine::controlsFor($category);
    }

    public function expertiseBonus(?string $depositRef = null): ?array
    {
        $c = ConfigurationPlateforme::current();
        $compte = null;
        if ($depositRef) {
            $etudiantId = Depot::query()->where('reference', strtoupper($depositRef))->value('etudiant_id');
            $compte = $etudiantId ? ComptePoints::query()->where('etudiant_id', $etudiantId)->first() : null;
        }
        if (!RegleBonus::eligible($c, $compte)) {
            return null;
        }

        return [
            'rate' => min(RegleBonus::TAUX_MAX_POURCENT, (int) round($c->bonus_taux * 100)),
            'rank' => (int) $c->bonus_consomme + 1,
            'quota' => (int) $c->bonus_quota,
            'cap' => (int) $c->bonus_plafond_points,
        ];
    }

    public function processedDeposit(string $ref): ?array
    {
        $d = Depot::query()
            ->with(['etudiant.utilisateur', 'appareil', 'expertise.agent.utilisateur', 'expertise.renoncement', 'annonce'])
            ->where('reference', strtoupper($ref))
            ->first();

        $e = $d?->expertise;
        if (!$d || !$e || !in_array($d->statut, ['VALIDE', 'REFUSE'], true)) {
            return null;
        }

        $u = $d->etudiant->utilisateur;
        $agentUser = $e->agent->utilisateur;
        $battery = ($e->decision !== 'REFUSE' && $e->batterie_pourcent !== null)
            ? " · batterie {$e->batterie_pourcent} %"
            : '';

        $outcome = $e->decision === 'REFUSE'
            ? [
                'status' => 'refuse',
                'reason' => $e->motif_refus ?: 'modele',
                'comment' => $e->commentaire ?: '',
            ]
            : [
                'status' => 'repris',
                'takeBack' => (int) $e->valeur_reprise,
                'listPrice' => (int) $e->prix_affichage,
                'bonus' => (int) ($e->renoncement?->bonus_accorde ?? 0),
                'pieces' => $e->decision === 'ACCEPTE_EN_PIECES',
                'signedAt' => $e->renoncement ? WecceClock::stampYear($e->renoncement->signe_le) : '',
                'articleId' => $d->annonce?->id,
                'mode' => WecceCodes::TAKEBACK_MODE_FROM_SQL[$e->mode_reprise ?? 'VENTE_WECCE'] ?? 'vente',
                'counterpart' => $e->contrepartie_libelle,
            ];

        return [
            'ref' => $d->reference,
            'student' => [
                'name' => $u->shortName(),
                'card' => $d->etudiant->numero_carte,
            ],
            'device' => $d->appareil->fullName(),
            'deviceInfo' => $this->deviceInfo($d) . $battery,
            'examinedAt' => WecceClock::weekdayDayMonth($e->realisee_le) . ', ' . WecceClock::time($e->realisee_le),
            'agent' => ($e->agent->poste ?: 'Comptoir') . ' · ' . $agentUser->shortName(),
            'wish' => $d->prix_souhaite !== null ? (int) $d->prix_souhaite : null,
            'outcome' => $outcome,
        ];
    }

    public function toStockArticle(Annonce $a): array
    {
        $a->loadMissing(['appareil.photos', 'depotOrigine']);
        $appareil = $a->appareil;
        $statusFront = WecceCodes::STOCK_STATUS_FROM_SQL[$a->statut] ?? 'en-ligne';
        $activeAcq = $a->statut === 'RESERVEE' ? $this->activeAcquisition($a->id) : null;
        $conditionSql = $appareil->etat_constate ?: $appareil->etat_declare;

        $art = [
            'id' => $a->id,
            'name' => $this->engine->articleDisplayName($a),
            'info' => $a->info ?: '',
            'category' => $appareil->categorie_code,
            'condition' => WecceCodes::CONDITION_FROM_SQL[$conditionSql] ?? 'bon',
            'origin' => WecceCodes::ORIGIN_FROM_SQL[$a->origine] ?? 'boutique',
            'onlineSince' => $a->mise_en_ligne_le ? WecceClock::dayMonthShort($a->mise_en_ligne_le) : 'pas encore',
            'initialPrice' => (int) $a->prix_initial,
            'todayPrice' => (int) $a->prix_courant,
            'status' => $statusFront,
        ];

        if ($appareil->batterie_pourcent !== null) {
            $art['battery'] = (int) $appareil->batterie_pourcent;
        }
        $firstPhoto = $appareil->photos->first();
        if ($firstPhoto) {
            $art['photo'] = $firstPhoto->url;
        }
        if ($a->depotOrigine) {
            $art['originRef'] = $a->depotOrigine->reference;
        }
        if ($activeAcq && in_array($activeAcq->statut, ['RESERVE', 'A_VALIDER'], true)) {
            $art['acquisitionRef'] = $activeAcq->reference;
        }
        if ($activeAcq && $activeAcq->statut === 'EN_ATTENTE') {
            $art['statusNote'] = 'paiement en attente';
        } elseif ($activeAcq && $activeAcq->statut === 'A_VALIDER') {
            $art['statusNote'] = 'achat à valider';
        } elseif ($a->note_statut) {
            $art['statusNote'] = $a->note_statut;
        }

        return $art;
    }

    public function stockPage(): array
    {
        $all = Annonce::query()->with(['appareil.photos', 'depotOrigine'])->get();

        $stockOrder = [
            'A_PHOTOGRAPHIER' => 0,
            'RESERVEE' => 1,
            'EN_BOUTIQUE' => 2,
            'EN_LIGNE' => 3,
            'VENDUE' => 4,
            'RETIREE' => 5,
        ];

        $sorted = $all->sort(function (Annonce $x, Annonce $y) use ($stockOrder) {
            $ox = $stockOrder[$x->statut] ?? 9;
            $oy = $stockOrder[$y->statut] ?? 9;
            if ($ox !== $oy) {
                return $ox <=> $oy;
            }
            $tx = WecceClock::toIso($x->mise_en_ligne_le ?: $x->cree_le);
            $ty = WecceClock::toIso($y->mise_en_ligne_le ?: $y->cree_le);
            return $ty <=> $tx;
        })->values();

        $articles = $sorted->map(fn (Annonce $a) => $this->toStockArticle($a))->all();
        $online = $all->where('statut', 'EN_LIGNE');

        $today = WecceClock::today();
        $p = WecceClock::parts($today);
        $lastMonthNum = $p['m'] === 1 ? 12 : $p['m'] - 1;
        $lastMonthYear = $p['m'] === 1 ? $p['y'] - 1 : $p['y'];
        $lastMonthKey = sprintf('%04d-%02d', $lastMonthYear, $lastMonthNum);

        $left = Acquisition::query()
            ->where('statut', 'REMIS')
            ->whereNotNull('retire_le')
            ->get()
            ->filter(fn (Acquisition $q) => WecceClock::monthKey($q->retire_le) === $lastMonthKey);

        $summary = $all->isNotEmpty()
            ? [
                'online' => $online->count(),
                'onlineFromShop' => $online->where('origine', 'STOCK_PARTENAIRE')->count(),
                'displayedValue' => (int) $online->sum('prix_courant'),
                'reserved' => $all->where('statut', 'RESERVEE')->count(),
                'leftLastMonth' => $left->count(),
                'leftWithComplement' => $left->where('complement_du', '>', 0)->count(),
                'lastMonthLabel' => WecceClock::monthName($today, -1),
            ]
            : null;

        return [
            'summary' => $summary,
            'articles' => $articles,
            'counts' => [
                'tout' => $all->count(),
                'depot' => $all->where('origine', 'DEPOT_ETUDIANT')->count(),
                'boutique' => $all->where('origine', 'STOCK_PARTENAIRE')->count(),
            ],
        ];
    }

    /**
     * Tableau de bord de LBC : ce qui attend une action, le jour au comptoir, l'activité des
     * huit dernières semaines, le mois en cours face au précédent, le stock et la couverture.
     */
    public function partnerDashboard(): array
    {
        $today = WecceClock::today();
        $config = ConfigurationPlateforme::current();
        $weekday = WecceClock::weekday($today);
        $monday = WecceClock::addDays($today, $weekday === 0 ? -6 : 1 - $weekday);

        $expertises = Expertise::query()->whereIn('decision', ['ACCEPTE', 'ACCEPTE_EN_PIECES'])->whereHas('renoncement')->get();
        $sales = Acquisition::query()->whereIn('statut', ['RESERVE', 'REMIS'])->get();
        $refused = Expertise::query()->where('decision', 'REFUSE')->get();

        $weeks = [];
        for ($i = 7; $i >= 0; $i--) {
            $start = WecceClock::addDays($monday, -7 * $i);
            $end = WecceClock::addDays($start, 6);
            $in = fn ($dt) => $dt && WecceClock::dateOf($dt) >= $start && WecceClock::dateOf($dt) <= $end;
            $p = WecceClock::parts($start);
            $weeks[] = [
                'key' => $start,
                'label' => WecceClock::dayNumber($p['d']) . ' ' . WecceClock::MONTHS_SHORT[$p['m']],
                'takeBacks' => $expertises->filter(fn (Expertise $e) => $in($e->realisee_le))->count(),
                'sales' => $sales->filter(fn (Acquisition $q) => $in($q->valide_le ?: $q->cree_le))->count(),
                'current' => $i === 0,
            ];
        }

        $monthKey = WecceClock::monthKey($today);
        $prevKey = WecceClock::monthKey(Carbon::parse($today)->subMonthNoOverflow()->format('Y-m-d'));
        $month = function (string $key) use ($expertises, $sales, $refused): array {
            $exp = $expertises->filter(fn (Expertise $e) => WecceClock::monthKey($e->realisee_le) === $key);
            $sal = $sales->filter(fn (Acquisition $q) => WecceClock::monthKey($q->valide_le ?: $q->cree_le) === $key);

            return [
                'takeBacks' => $exp->count(),
                'refused' => $refused->filter(fn (Expertise $e) => WecceClock::monthKey($e->realisee_le) === $key)->count(),
                'pointsCredited' => (int) $exp->where('mode_reprise', '<>', 'ECHANGE_OBJET')->sum('valeur_reprise'),
                'sales' => $sal->count(),
                'salesPoints' => (int) $sal->sum('prix_total'),
                'complements' => (int) $sal->sum('complement_du'),
                'margin' => (int) $exp->sum(fn (Expertise $e) => max(0, (int) $e->prix_affichage - (int) $e->valeur_reprise)),
            ];
        };

        $annonces = Annonce::query()->with('appareil')->whereIn('statut', ['EN_LIGNE', 'EN_BOUTIQUE', 'A_PHOTOGRAPHIER', 'RESERVEE'])->get();
        $categories = Categorie::query()->where('actif', true)->orderBy('ordre')->get();
        $byCategory = $categories->map(function (Categorie $c) use ($annonces) {
            $set = $annonces->filter(fn (Annonce $a) => $a->appareil?->categorie_code === $c->code && $a->statut === 'EN_LIGNE');
            return ['code' => $c->code, 'label' => $c->libelle, 'count' => $set->count(), 'value' => (int) $set->sum('prix_courant')];
        })->values()->all();

        $activity = collect();
        foreach ($expertises->sortByDesc(fn ($e) => WecceClock::toIso($e->realisee_le))->take(6) as $e) {
            $e->loadMissing('depot.appareil');
            $activity->push([
                'at' => WecceClock::toIso($e->realisee_le),
                'kind' => 'reprise',
                'text' => trim((string) $e->depot?->appareil?->designation) . ' repris à ' . number_format((int) $e->valeur_reprise, 0, ',', ' ') . ' pts',
                'ref' => $e->depot?->reference,
            ]);
        }
        foreach ($sales->sortByDesc(fn ($q) => WecceClock::toIso($q->retire_le ?: ($q->valide_le ?: $q->cree_le)))->take(6) as $q) {
            $q->loadMissing('annonce.appareil');
            $when = $q->retire_le ?: ($q->valide_le ?: $q->cree_le);
            $activity->push([
                'at' => WecceClock::toIso($when),
                'kind' => $q->statut === 'REMIS' ? 'remise' : 'vente',
                'text' => trim((string) $q->annonce?->appareil?->designation) . ($q->statut === 'REMIS' ? ' remis à l\'étudiant' : ' vendu, à remettre'),
                'ref' => $q->reference,
            ]);
        }
        $activity = $activity->sortByDesc('at')->take(7)->values()->map(fn (array $x) => $x + [
            'when' => WecceClock::capitalize(WecceClock::dayMonthShort($x['at'])) . ', ' . WecceClock::time($x['at']),
        ])->all();

        $debt = $this->engine->debt();
        $stockValue = $this->engine->stockValue();

        return [
            'todayLabel' => WecceClock::longDate($today),
            'todo' => $this->partnerTodo(),
            'today' => $this->appointmentsOn($today),
            'requests' => array_slice($this->appointmentRequests(), 0, 4),
            'weeks' => $weeks,
            'month' => [
                'label' => ucfirst(WecceClock::monthTitle("{$monthKey}-01")),
                'prevLabel' => WecceClock::monthTitle("{$prevKey}-01"),
                'current' => $month($monthKey),
                'previous' => $month($prevKey),
            ],
            'stock' => [
                'online' => $annonces->where('statut', 'EN_LIGNE')->count(),
                'onlineValue' => (int) $annonces->where('statut', 'EN_LIGNE')->sum('prix_courant'),
                'offline' => $annonces->whereIn('statut', ['EN_BOUTIQUE', 'A_PHOTOGRAPHIER'])->count(),
                'reserved' => $annonces->where('statut', 'RESERVEE')->count(),
                'byCategory' => $byCategory,
            ],
            'coverage' => [
                'ratio' => $debt > 0 ? round($stockValue / $debt, 3) : null,
                'debt' => $debt,
                'stockValue' => $stockValue,
                'watch' => (float) $config->seuil_surveillance,
                'suspend' => (float) $config->seuil_suspension,
            ],
            'activity' => $activity,
        ];
    }

    /** Un achat vu par LBC dans l'onglet Stock (validation, remise, historique). */
    public function toPartnerPurchase(Acquisition $q): array
    {
        $q->loadMissing(['annonce.appareil.photos', 'etudiant.utilisateur', 'paiements']);
        $u = $q->etudiant->utilisateur;
        $a = $q->annonce;
        $config = ConfigurationPlateforme::current();
        $from = $q->valide_le ?: ($q->confirme_le ?: $q->cree_le);
        $statusMap = ['EN_ATTENTE' => 'en-attente', 'A_VALIDER' => 'a-valider', 'RESERVE' => 'reserve', 'REMIS' => 'remis', 'ANNULE' => 'annule'];
        $paidMobile = $q->paiements->contains(fn ($p) => $p->statut === 'CONFIRME' && in_array($p->moyen, ['WAVE', 'ORANGE_MONEY'], true));
        $compte = ComptePoints::query()->where('etudiant_id', $q->etudiant_id)->first();

        $res = [
            'ref' => $q->reference,
            'status' => $statusMap[$q->statut] ?? 'reserve',
            'student' => [
                'name' => $u->shortName(),
                'initials' => $u->initials(),
                'card' => $q->etudiant->numero_carte,
                'phone' => $u->telephone,
                'balance' => (int) ($compte?->solde ?? 0),
            ],
            'item' => [
                'id' => $a->id,
                'name' => $this->engine->articleDisplayName($a),
                'category' => $a->appareil->categorie_code,
                'photo' => $a->appareil->photos->first()?->url,
                'origin' => WecceCodes::ORIGIN_FROM_SQL[$a->origine] ?? 'boutique',
            ],
            'price' => (int) $q->prix_total,
            'points' => (int) $q->points_debites,
            'complement' => (int) $q->complement_du,
            'method' => WecceCodes::PAYMENT_METHOD_FROM_SQL[$q->moyen_paiement] ?? 'especes',
            'paidMobile' => $paidMobile,
            'createdAt' => WecceClock::capitalize(WecceClock::dayMonthShort($q->cree_le)) . ', ' . WecceClock::time($q->cree_le),
            'pickupBefore' => WecceClock::weekdayDayMonth(WecceClock::addDays(WecceClock::dateOf($from), (int) ($config->delai_retrait_jours ?: 3))),
        ];
        if ($q->valide_le) {
            $res['validatedAt'] = WecceClock::capitalize(WecceClock::dayMonthShort($q->valide_le)) . ', ' . WecceClock::time($q->valide_le);
        }
        if ($q->retire_le) {
            $res['handedAt'] = WecceClock::capitalize(WecceClock::dayMonthShort($q->retire_le)) . ', ' . WecceClock::time($q->retire_le);
        }
        if ($q->garantie_jusquau) {
            $res['warrantyUntil'] = WecceClock::dayMonthYear($q->garantie_jusquau);
        }
        if ($q->motif_refus) {
            $res['refusal'] = $q->motif_refus;
        }

        return $res;
    }

    /**
     * Onglet Stock de LBC : les achats à valider et les objets à remettre, les dépôts à mettre
     * (ou non) en ligne, et le catalogue complet de la boutique.
     */
    public function stockTab(): array
    {
        $purchases = Acquisition::query()
            ->with(['annonce.appareil.photos', 'etudiant.utilisateur', 'paiements'])
            ->get();

        $byStatus = fn (array $statuses) => $purchases
            ->filter(fn (Acquisition $q) => in_array($q->statut, $statuses, true))
            ->sortBy(fn (Acquisition $q) => WecceClock::toIso($q->cree_le))
            ->values()
            ->map(fn (Acquisition $q) => $this->toPartnerPurchase($q))
            ->all();

        $history = $purchases
            ->filter(fn (Acquisition $q) => $q->statut === 'REMIS' || ($q->statut === 'ANNULE' && $q->motif_refus))
            ->sortByDesc(fn (Acquisition $q) => WecceClock::toIso($q->retire_le ?: ($q->valide_le ?: $q->cree_le)))
            ->take(12)
            ->values()
            ->map(fn (Acquisition $q) => $this->toPartnerPurchase($q))
            ->all();

        $stock = $this->stockPage();
        $toPublish = array_values(array_filter(
            $stock['articles'],
            fn (array $a) => $a['origin'] === 'depot' && in_array($a['status'], ['a-photographier', 'en-boutique'], true)
        ));

        $all = Annonce::query()->get(['statut', 'origine', 'prix_courant']);
        $inShop = $all->whereIn('statut', ['A_PHOTOGRAPHIER', 'EN_LIGNE', 'EN_BOUTIQUE', 'RESERVEE']);

        return [
            'toValidate' => $byStatus(['A_VALIDER']),
            'awaitingPayment' => $byStatus(['EN_ATTENTE']),
            'toHandOver' => $byStatus(['RESERVE']),
            'history' => $history,
            'toPublish' => $toPublish,
            'catalog' => [
                'articles' => $stock['articles'],
                'counts' => $stock['counts'],
            ],
            'summary' => [
                'inShopCount' => $inShop->count(),
                'inShopValue' => (int) $inShop->sum('prix_courant'),
                'onlineCount' => $all->where('statut', 'EN_LIGNE')->count(),
                'onlineValue' => (int) $all->where('statut', 'EN_LIGNE')->sum('prix_courant'),
                'offlineCount' => $all->whereIn('statut', ['EN_BOUTIQUE', 'A_PHOTOGRAPHIER'])->count(),
                'reservedCount' => $all->where('statut', 'RESERVEE')->count(),
                'shopOwnCount' => $inShop->where('origine', 'STOCK_PARTENAIRE')->count(),
            ],
        ];
    }

    public function stockArticle(string $id): ?array
    {
        $a = Annonce::query()->with(['appareil.photos', 'depotOrigine'])->find($id);
        return $a ? $this->toStockArticle($a) : null;
    }

    public function coveragePage(): array
    {
        $at = WecceClock::now();
        $snaps = SnapshotCouverture::query()->orderBy('arrete_le')->get();

        $rows = [];
        foreach ($snaps as $s) {
            $rows[] = [
                'at' => WecceClock::toIso($s->arrete_le),
                'stock' => (int) $s->valeur_stock,
                'debt' => (int) $s->dette_en_points,
                'event' => $s->evenement,
            ];
        }
        $rows[] = [
            'at' => $at,
            'stock' => $this->engine->stockValue(),
            'debt' => $this->engine->debt(),
            'event' => null,
        ];

        $start = WecceClock::dateOf($rows[0]['at']);
        $history = array_map(function (array $s) use ($start) {
            $point = [
                'label' => WecceClock::dayMonthShort($s['at']),
                'day' => WecceClock::daysBetween($start, WecceClock::dateOf($s['at'])),
                'stock' => $s['stock'],
                'debt' => $s['debt'],
            ];
            if (!empty($s['event'])) {
                $point['event'] = $s['event'];
            }
            return $point;
        }, $rows);

        $expertises = Expertise::query()
            ->where('decision', 'ACCEPTE')
            ->where('prix_affichage', '>', 0)
            ->get();

        $byMonth = [];
        foreach ($expertises as $e) {
            $key = WecceClock::monthKey($e->realisee_le);
            $byMonth[$key][] = $e;
        }
        ksort($byMonth);

        $todayMonth = WecceClock::monthKey(WecceClock::today());
        $margins = [];
        foreach ($byMonth as $key => $list) {
            $count = count($list);
            $sumTakeBack = array_sum(array_map(fn (Expertise $e) => (int) $e->valeur_reprise, $list));
            $sumListPrice = array_sum(array_map(fn (Expertise $e) => (int) $e->prix_affichage, $list));
            $sumMarginPct = array_sum(array_map(fn (Expertise $e) => ($e->prix_affichage - $e->valeur_reprise) / $e->prix_affichage, $list));

            $margins[] = [
                'month' => WecceClock::monthTitle("{$key}-01") . ($key === $todayMonth ? ', en cours' : ''),
                'expertises' => $count,
                'margin' => $sumMarginPct / $count,
                'avgTakeBack' => (int) round($sumTakeBack / $count),
                'avgListPrice' => (int) round($sumListPrice / $count),
                'totalMarginPoints' => $sumListPrice - $sumTakeBack,
            ];
        }

        $config = ConfigurationPlateforme::current();

        $coveringAnnonces = Annonce::query()
            ->whereIn('statut', ['A_PHOTOGRAPHIER', 'EN_LIGNE', 'RESERVEE'])
            ->get(['origine', 'statut', 'prix_courant']);

        $studentDeposits = $coveringAnnonces->where('origine', 'DEPOT_ETUDIANT');
        $shopArticles = $coveringAnnonces->where('origine', 'STOCK_PARTENAIRE');
        $enLigne = $coveringAnnonces->where('statut', 'EN_LIGNE');
        $aPhotographier = $coveringAnnonces->where('statut', 'A_PHOTOGRAPHIER');
        $reservee = $coveringAnnonces->where('statut', 'RESERVEE');

        $comptes = ComptePoints::query()->where('statut', 'ACTIF')->get(['solde']);
        $funded = $comptes->filter(fn (ComptePoints $cp) => $cp->solde > 0);
        $fundedCount = $funded->count();
        $totalAccounts = User::query()->where('role', 'ETUDIANT')->count();
        $debt = $this->engine->debt();
        $stockValue = $this->engine->stockValue();

        $pointsIssued = (int) MouvementPoints::query()->where('type', 'CREDIT_DEPOT')->sum('montant');
        $bonusIssued = (int) MouvementPoints::query()->where('type', 'BONUS')->sum('montant');
        $pointsSpent = (int) abs((int) MouvementPoints::query()->where('type', 'DEBIT_RETRAIT')->sum('montant'));
        $pointsMelted = (int) abs((int) MouvementPoints::query()->where('type', 'FONTE')->sum('montant'));

        $acquisitions = Acquisition::query()->whereIn('statut', ['RESERVE', 'REMIS'])->get(['statut', 'complement_du']);
        $acquisitionsCount = $acquisitions->count();
        $handedOverCount = $acquisitions->where('statut', 'REMIS')->count();
        $complementsTotal = (int) $acquisitions->sum('complement_du');
        $acquisitionsWithComplement = $acquisitions->filter(fn (Acquisition $acq) => $acq->complement_du > 0)->count();

        $acceptedWhole = $expertises->count();
        $acceptedPieces = Expertise::query()->where('decision', 'ACCEPTE_EN_PIECES')->count();
        $refusedCount = Expertise::query()->where('decision', 'REFUSE')->count();

        return [
            'coverage' => [
                'computedAt' => 'Calculé le ' . WecceClock::stampYear($at),
                'ratio' => $this->engine->coverageRatio(),
                'pointsInCirculation' => $debt,
                'studentAccounts' => $totalAccounts,
                'fundedAccounts' => $fundedCount,
                'stockValue' => $stockValue,
                'stockCount' => $this->engine->coveringCount(),
                'thresholds' => [
                    'watch' => (float) $config->seuil_surveillance,
                    'suspend' => (float) $config->seuil_suspension,
                    'reopen' => (float) $config->seuil_reouverture,
                ],
            ],
            'stockBreakdown' => [
                'studentDepositsCount' => $studentDeposits->count(),
                'studentDepositsValue' => (int) $studentDeposits->sum('prix_courant'),
                'shopStockCount' => $shopArticles->count(),
                'shopStockValue' => (int) $shopArticles->sum('prix_courant'),
                'enLigneCount' => $enLigne->count(),
                'enLigneValue' => (int) $enLigne->sum('prix_courant'),
                'aPhotographierCount' => $aPhotographier->count(),
                'aPhotographierValue' => (int) $aPhotographier->sum('prix_courant'),
                'reserveeCount' => $reservee->count(),
                'reserveeValue' => (int) $reservee->sum('prix_courant'),
            ],
            'activityStats' => [
                'pointsIssued' => $pointsIssued,
                'bonusIssued' => $bonusIssued,
                'pointsSpent' => $pointsSpent,
                'pointsMelted' => $pointsMelted,
                'acquisitionsCount' => $acquisitionsCount,
                'handedOverCount' => $handedOverCount,
                'complementsTotal' => $complementsTotal,
                'acquisitionsWithComplement' => $acquisitionsWithComplement,
                'avgBalance' => $fundedCount > 0 ? (int) round($debt / $fundedCount) : 0,
                'maxBalance' => (int) ($funded->max('solde') ?? 0),
                'acceptedExpertises' => $acceptedWhole,
                'piecesExpertises' => $acceptedPieces,
                'refusedExpertises' => $refusedCount,
            ],
            'history' => $history,
            'margins' => $margins,
        ];
    }

    public function depositsState(): array
    {
        $c = ConfigurationPlateforme::current();
        $at = WecceClock::now();

        $upcoming = Depot::query()
            ->where('statut', 'RDV_PRIS')
            ->whereNotNull('date_rendez_vous')
            ->get()
            ->filter(fn (Depot $d) => WecceClock::toIso($d->date_rendez_vous) >= $at)
            ->count();

        $res = [
            'suspended' => (bool) $c->suspension_manuelle,
            'coverageRatio' => $this->engine->coverageRatio(),
            'autoSuspendBelow' => (float) $c->seuil_suspension,
            'upcomingAppointments' => $upcoming,
        ];

        if ($c->motif_suspension) {
            $res['reason'] = $c->motif_suspension;
        }
        if ($c->suspendu_le) {
            $res['suspendedAt'] = WecceClock::stampAt($c->suspendu_le);
        }

        return $res;
    }

    public function launchBonus(): array
    {
        $c = ConfigurationPlateforme::current();

        return [
            'active' => RegleBonus::campagneOuverte($c),
            'rate' => (int) round($c->bonus_taux * 100),
            'quota' => (int) $c->bonus_quota,
            'used' => (int) $c->bonus_consomme,
            'ceiling' => (int) $c->bonus_plafond_points,
            'onePerStudent' => (bool) $c->bonus_un_par_etudiant,
            'limits' => [
                'maxRate' => RegleBonus::TAUX_MAX_POURCENT,
                'maxQuota' => RegleBonus::QUOTA_MAX,
                'maxCeiling' => RegleBonus::PLAFOND_MAX,
            ],
        ];
    }

    public function balanceMismatches(): array
    {
        $rows = DB::select('SELECT c.etudiant_id, c.solde AS recorded, COALESCE(SUM(m.montant), 0) AS computed FROM compte_points c LEFT JOIN mouvement_points m ON m.compte_id = c.id GROUP BY c.id, c.etudiant_id, c.solde HAVING c.solde <> COALESCE(SUM(m.montant), 0)');

        $result = [];
        foreach ($rows as $r) {
            $etudiant = \App\Models\Etudiant::query()->find($r->etudiant_id);
            $result[] = [
                'card' => $etudiant?->numero_carte ?? '',
                'recorded' => (int) $r->recorded,
                'computed' => (int) $r->computed,
            ];
        }

        return $result;
    }

    public function scheduledTasks(): array
    {
        $c = ConfigurationPlateforme::current();
        $mismatches = count($this->balanceMismatches());
        $pending = Acquisition::query()->where('statut', 'EN_ATTENTE')->count();
        $today = WecceClock::today();
        $at = WecceClock::now();
        $tenMinutes = substr($at, 0, 15) . '0';
        $ratio = $this->engine->coverageRatio();

        return [
            [
                'name' => 'Baisse mensuelle',
                'description' => 'Points et prix, même taux, même arrondi',
                'frequency' => 'Le 1er du mois',
                'lastRun' => $c->derniere_fonte_le ? WecceClock::stamp($c->derniere_fonte_le) : 'pas encore',
                'result' => $c->derniere_fonte_le
                    ? "{$c->derniere_fonte_comptes} comptes et {$c->derniere_fonte_annonces} annonces"
                    : '—',
                'tone' => 'ok',
            ],
            [
                'name' => 'Contrôle des soldes',
                'description' => 'Solde enregistré face à la somme des mouvements',
                'frequency' => 'Chaque nuit',
                'lastRun' => WecceClock::stamp("{$today}T03:00"),
                'result' => $mismatches ? ($mismatches . ' écart' . ($mismatches > 1 ? 's' : '')) : 'Aucun écart',
                'tone' => $mismatches ? 'danger' : 'ok',
            ],
            [
                'name' => 'Couverture',
                'description' => 'Dette en points face à la valeur du stock',
                'frequency' => 'Chaque matin',
                'lastRun' => WecceClock::stamp("{$today}T06:00"),
                'result' => round($ratio * 100) . ' %',
                'tone' => $ratio < (float) $c->seuil_surveillance ? 'danger' : 'ok',
            ],
            [
                'name' => 'Rapprochement des paiements',
                'description' => 'Paiements Wave et Orange Money restés en attente',
                'frequency' => 'Toutes les 10 min',
                'lastRun' => WecceClock::stamp($tenMinutes),
                'result' => $pending ? "{$pending} en attente" : 'Aucun paiement en attente',
                'tone' => 'neutral',
            ],
        ];
    }

    public function accountSummaries(): array
    {
        return User::query()
            ->with(['etudiant.comptePoints'])
            ->where('role', 'ETUDIANT')
            ->get()
            ->sort(fn (User $a, User $b) => strcmp($a->nom, $b->nom))
            ->values()
            ->map(fn (User $u) => [
                'name' => "{$u->prenom} {$u->nom}",
                'initials' => $u->initials(),
                'card' => $u->etudiant?->numero_carte ?? '',
                'study' => $u->etudiant ? $u->etudiant->studyLabel() : "Étudiant de l'UGB",
                'active' => (bool) $u->actif,
                'balance' => (int) ($u->etudiant?->comptePoints?->solde ?? 0),
            ])
            ->all();
    }

    public function adminLog(): array
    {
        return JournalAdministration::query()
            ->get()
            ->sortByDesc(fn (JournalAdministration $j) => WecceClock::toIso($j->effectue_le))
            ->values()
            ->map(fn (JournalAdministration $j) => [
                'at' => WecceClock::stamp($j->effectue_le),
                'type' => WecceCodes::ADMIN_ACTION_FROM_SQL[$j->action] ?? 'configuration',
                'target' => $j->cible_libelle,
                'change' => $j->changement,
                'reason' => $j->motif,
                'by' => $j->auteur_libelle,
            ])
            ->all();
    }

    public function creditsList(): array
    {
        $path = database_path('data/credits.json');
        if (!file_exists($path)) {
            $path = base_path('wecce-front/src/infrastructure/demo/credits.json');
        }
        if (!file_exists($path)) {
            return [];
        }
        $decoded = json_decode((string) file_get_contents($path), true);
        return is_array($decoded) ? array_values($decoded) : [];
    }

    public function faqData(): array
    {
        $path = database_path('data/faq.json');
        if (!file_exists($path)) {
            return ['faq' => [], 'sections' => []];
        }
        $decoded = json_decode((string) file_get_contents($path), true);
        return is_array($decoded) ? $decoded : ['faq' => [], 'sections' => []];
    }

    public function statisticsPage(
        ?string $periode = 'tout',
        bool $includeCatalog = false,
        ?string $fromDate = null,
        ?string $toDate = null,
    ): array
    {
        $periode = $periode ?: 'tout';
        $at = WecceClock::now();
        $todayStr = WecceClock::today();
        $today = Carbon::parse($todayStr);
        $todayMonth = WecceClock::monthKey($todayStr);
        $prevMonthCarbon = $today->copy()->subMonthNoOverflow();

        $allDepots = Depot::query()->with('appareil')->where('statut', '!=', 'BROUILLON')->get();
        $allExpertises = Expertise::query()->get();
        $allAnnonces = Annonce::query()->with('appareil')->get();
        $allAcquisitions = Acquisition::query()->get();
        $comptes = ComptePoints::query()->where('statut', 'ACTIF')->get();
        $etudiants = Etudiant::query()->get();
        $categories = Categorie::query()->where('actif', true)->orderBy('ordre')->get();
        $config = ConfigurationPlateforme::current();

        // Mois disponibles pour le filtre temporel
        $availableMonthKeys = [];
        foreach ($allDepots as $d) {
            if ($d->cree_le) {
                $availableMonthKeys[WecceClock::monthKey($d->cree_le)] = true;
            }
        }
        foreach ($allAnnonces as $a) {
            if ($a->cree_le) {
                $availableMonthKeys[WecceClock::monthKey($a->cree_le)] = true;
            }
        }
        foreach ($allAcquisitions as $acq) {
            if ($acq->cree_le) {
                $availableMonthKeys[WecceClock::monthKey($acq->cree_le)] = true;
            }
        }
        krsort($availableMonthKeys);

        $validDate = fn (?string $d): bool => is_string($d) && preg_match('/^\d{4}-\d{2}-\d{2}$/', $d) === 1;
        $hasCustom = $validDate($fromDate) || $validDate($toDate);

        $startDate = null;
        $endDate = null;
        $periodLabel = "Toute l'activité";

        if ($hasCustom || $periode === 'personnalisee') {
            $periode = 'personnalisee';
            $startDate = $validDate($fromDate) ? $fromDate : null;
            $endDate = $validDate($toDate) ? $toDate : null;
            if ($startDate && $endDate) {
                $periodLabel = 'Du ' . WecceClock::dayMonthYearShort($startDate) . ' au ' . WecceClock::dayMonthYearShort($endDate);
            } elseif ($startDate) {
                $periodLabel = 'À partir du ' . WecceClock::dayMonthYearShort($startDate);
            } elseif ($endDate) {
                $periodLabel = "Jusqu'au " . WecceClock::dayMonthYearShort($endDate);
            } else {
                $periode = 'tout';
            }
        } elseif ($periode === 'aujourdhui') {
            $startDate = $todayStr;
            $endDate = $todayStr;
            $periodLabel = "Aujourd'hui (" . WecceClock::dayMonthShort($todayStr) . ')';
        } elseif ($periode === '7j') {
            $startDate = $today->copy()->subDays(6)->format('Y-m-d');
            $endDate = $todayStr;
            $periodLabel = '7 derniers jours';
        } elseif ($periode === '30j') {
            $startDate = $today->copy()->subDays(29)->format('Y-m-d');
            $endDate = $todayStr;
            $periodLabel = '30 derniers jours';
        } elseif ($periode === 'mois') {
            $startDate = $today->copy()->startOfMonth()->format('Y-m-d');
            $endDate = $todayStr;
            $periodLabel = 'Ce mois (' . WecceClock::monthTitle("{$todayMonth}-01") . ')';
        } elseif ($periode === 'mois-prec') {
            $prevKey = $prevMonthCarbon->format('Y-m');
            $startDate = $prevMonthCarbon->copy()->startOfMonth()->format('Y-m-d');
            $endDate = $prevMonthCarbon->copy()->endOfMonth()->format('Y-m-d');
            $periodLabel = ucfirst(WecceClock::monthTitle("{$prevKey}-01"));
        } elseif (preg_match('/^\d{4}-\d{2}$/', $periode)) {
            $target = Carbon::parse("{$periode}-01");
            $startDate = $target->copy()->startOfMonth()->format('Y-m-d');
            $endDate = $target->copy()->endOfMonth()->format('Y-m-d');
            $periodLabel = ucfirst(WecceClock::monthTitle("{$periode}-01"));
        } else {
            $periode = 'tout';
        }

        $periodOptions = [
            ['value' => 'tout', 'label' => "Tout l'historique"],
            ['value' => 'aujourdhui', 'label' => "Aujourd'hui"],
            ['value' => '7j', 'label' => '7 derniers jours'],
            ['value' => '30j', 'label' => '30 derniers jours'],
            ['value' => 'mois', 'label' => 'Ce mois-ci'],
            ['value' => 'mois-prec', 'label' => 'Mois dernier'],
        ];
        foreach (array_keys($availableMonthKeys) as $mKey) {
            if ($mKey !== $todayMonth && $mKey !== $prevMonthCarbon->format('Y-m')) {
                $periodOptions[] = ['value' => $mKey, 'label' => ucfirst(WecceClock::monthTitle("{$mKey}-01"))];
            }
        }

        $inRange = function ($dt) use ($startDate, $endDate): bool {
            if ($startDate === null && $endDate === null) {
                return true;
            }
            if (!$dt) {
                return false;
            }
            $d = WecceClock::dateOf($dt);
            if ($startDate !== null && $d < $startDate) {
                return false;
            }
            if ($endDate !== null && $d > $endDate) {
                return false;
            }
            return true;
        };

        $depots = $allDepots->filter(fn (Depot $d) => $inRange($d->cree_le));
        $annonces = $allAnnonces->filter(fn (Annonce $a) => $inRange($a->cree_le));
        $acquisitions = $allAcquisitions->filter(fn (Acquisition $a) => $inRange($a->cree_le));
        $expertises = $allExpertises->filter(fn (Expertise $e) => $inRange($e->realisee_le));

        // Réconciliation exacte des dépôts : total = accepted + pending + refused + cancelled
        $acceptedDeposits = $depots->where('statut', 'VALIDE')->count();
        $pendingDeposits = $depots->whereIn('statut', ['RDV_DEMANDE', 'RDV_PRIS', 'EXPERTISE'])->count();
        $refusedDeposits = $depots->where('statut', 'REFUSE')->count();
        $cancelledDeposits = $depots->where('statut', 'ANNULE')->count();
        $decidedDeposits = $acceptedDeposits + $refusedDeposits;
        $acceptanceRate = $decidedDeposits > 0 ? (int) round(($acceptedDeposits / $decidedDeposits) * 100) : 0;

        // Réconciliation exacte du stock : fromDeposits + fromShop === available + reserved + sold + withdrawn
        $activeAcquisitions = $acquisitions->whereIn('statut', ['RESERVE', 'REMIS']);
        $acquisitionsCount = $activeAcquisitions->count();
        $handedOverCount = $activeAcquisitions->where('statut', 'REMIS')->count();
        $reservedAcqCount = $activeAcquisitions->where('statut', 'RESERVE')->count();
        $cancelledCount = $acquisitions->where('statut', 'ANNULE')->count();

        $totalSalesPoints = (int) $activeAcquisitions->sum('prix_total');
        $totalPointsDebited = (int) $activeAcquisitions->sum('points_debites');
        $totalComplementsFcfa = (int) $activeAcquisitions->sum('complement_du');
        $avgBasketPoints = $acquisitionsCount > 0 ? (int) round($totalSalesPoints / $acquisitionsCount) : 0;

        $availableForSale = $annonces->whereIn('statut', ['A_PHOTOGRAPHIER', 'EN_LIGNE']);
        $reservedAnnonces = $annonces->where('statut', 'RESERVEE');
        $soldAnnonces = $annonces->where('statut', 'VENDUE');
        $withdrawnAnnonces = $annonces->where('statut', 'RETIREE');

        $totalStudents = User::query()->where('role', 'ETUDIANT')->count();
        $fundedAccounts = $comptes->filter(fn (ComptePoints $c) => $c->solde > 0);
        $fundedCount = $fundedAccounts->count();
        $debt = $this->engine->debt();

        // Par catégorie : deux blocs 100 % équilibrés
        $byCategory = [];
        foreach ($categories as $cat) {
            $catDepots = $depots->filter(fn (Depot $d) => $d->appareil?->categorie_code === $cat->code);
            $catAnn = $annonces->filter(fn (Annonce $a) => $a->appareil?->categorie_code === $cat->code);

            $depTotal = $catDepots->count();
            $depAccepted = $catDepots->where('statut', 'VALIDE')->count();
            $depPending = $catDepots->whereIn('statut', ['RDV_DEMANDE', 'RDV_PRIS', 'EXPERTISE'])->count();
            $depRefused = $catDepots->where('statut', 'REFUSE')->count();
            $depCancelled = $catDepots->where('statut', 'ANNULE')->count();

            $fromDeposits = $catAnn->where('origine', 'DEPOT_ETUDIANT')->count();
            $fromShop = $catAnn->where('origine', 'STOCK_PARTENAIRE')->count();
            $availAnn = $catAnn->whereIn('statut', ['A_PHOTOGRAPHIER', 'EN_LIGNE']);
            $toPhotoCount = $catAnn->where('statut', 'A_PHOTOGRAPHIER')->count();
            $resAnn = $catAnn->where('statut', 'RESERVEE');
            $soldAnn = $catAnn->where('statut', 'VENDUE');
            $withAnn = $catAnn->where('statut', 'RETIREE');

            $byCategory[] = [
                'code' => $cat->code,
                'label' => $cat->libelle,
                'deposits' => $depTotal,
                'depAccepted' => $depAccepted,
                'depPending' => $depPending,
                'depRefused' => $depRefused,
                'depCancelled' => $depCancelled,
                'fromDeposits' => $fromDeposits,
                'fromShop' => $fromShop,
                'totalEntered' => $catAnn->count(),
                'available' => $availAnn->count(),
                'toPhoto' => $toPhotoCount,
                'availableValue' => (int) $availAnn->sum('prix_courant'),
                'reserved' => $resAnn->count(),
                'reservedValue' => (int) $resAnn->sum('prix_courant'),
                'sold' => $soldAnn->count(),
                'soldValue' => (int) $soldAnn->sum('prix_courant'),
                'withdrawn' => $withAnn->count(),
            ];
        }

        // Par état constaté (tous les articles : dispos + réservés + vendus + retirés = total)
        $byCondition = [];
        foreach (['comme-neuf', 'bon', 'use', 'fonctionnel', 'defectueux'] as $frontCode) {
            $sqlCode = WecceCodes::CONDITION_TO_SQL[$frontCode];
            $condAnn = $annonces->filter(fn (Annonce $a) => $a->appareil?->etat_constate === $sqlCode);
            $avail = $condAnn->whereIn('statut', ['A_PHOTOGRAPHIER', 'EN_LIGNE'])->count();
            $reserved = $condAnn->where('statut', 'RESERVEE')->count();
            $sold = $condAnn->where('statut', 'VENDUE')->count();
            $withdrawn = $condAnn->where('statut', 'RETIREE')->count();
            $byCondition[] = [
                'code' => $frontCode,
                'available' => $avail,
                'reserved' => $reserved,
                'sold' => $sold,
                'withdrawn' => $withdrawn,
                'total' => $condAnn->count(),
            ];
        }

        // Moyens de paiement
        $purePoints = $activeAcquisitions->filter(fn (Acquisition $a) => $a->complement_du === 0);
        $waveAcqs = $activeAcquisitions->filter(fn (Acquisition $a) => $a->complement_du > 0 && $a->moyen_paiement === 'WAVE');
        $omAcqs = $activeAcquisitions->filter(fn (Acquisition $a) => $a->complement_du > 0 && $a->moyen_paiement === 'ORANGE_MONEY');
        $cashAcqs = $activeAcquisitions->filter(fn (Acquisition $a) => $a->complement_du > 0 && $a->moyen_paiement === 'ESPECES');

        $paymentMethods = [
            [
                'key' => 'points',
                'label' => '100 % en points',
                'count' => $purePoints->count(),
                'pointsAmount' => (int) $purePoints->sum('points_debites'),
                'fcfaAmount' => 0,
            ],
            [
                'key' => 'wave',
                'label' => 'Points + Wave',
                'count' => $waveAcqs->count(),
                'pointsAmount' => (int) $waveAcqs->sum('points_debites'),
                'fcfaAmount' => (int) $waveAcqs->sum('complement_du'),
            ],
            [
                'key' => 'om',
                'label' => 'Points + Orange Money',
                'count' => $omAcqs->count(),
                'pointsAmount' => (int) $omAcqs->sum('points_debites'),
                'fcfaAmount' => (int) $omAcqs->sum('complement_du'),
            ],
            [
                'key' => 'especes',
                'label' => 'Points + Espèces en boutique',
                'count' => $cashAcqs->count(),
                'pointsAmount' => (int) $cashAcqs->sum('points_debites'),
                'fcfaAmount' => (int) $cashAcqs->sum('complement_du'),
            ],
        ];

        // Activité mensuelle (filtrée sur la période)
        $monthKeys = [];
        foreach ($depots as $d) {
            if ($d->cree_le) {
                $monthKeys[WecceClock::monthKey($d->cree_le)] = true;
            }
        }
        foreach ($expertises as $e) {
            if ($e->realisee_le) {
                $monthKeys[WecceClock::monthKey($e->realisee_le)] = true;
            }
        }
        foreach ($activeAcquisitions as $acq) {
            if ($acq->cree_le) {
                $monthKeys[WecceClock::monthKey($acq->cree_le)] = true;
            }
        }
        ksort($monthKeys);

        $monthly = [];
        foreach (array_keys($monthKeys) as $key) {
            $mDepots = $depots->filter(fn (Depot $d) => $d->cree_le && WecceClock::monthKey($d->cree_le) === $key);
            $mExp = $expertises->filter(fn (Expertise $e) => $e->realisee_le && WecceClock::monthKey($e->realisee_le) === $key);
            $mAcq = $activeAcquisitions->filter(fn (Acquisition $a) => $a->cree_le && WecceClock::monthKey($a->cree_le) === $key);
            $mMargin = $mExp
                ->whereIn('decision', ['ACCEPTE', 'ACCEPTE_EN_PIECES'])
                ->sum(fn (Expertise $e) => max(0, (int) $e->prix_affichage - (int) $e->valeur_reprise));

            $monthly[] = [
                'key' => $key,
                'month' => ucfirst(WecceClock::monthTitle("{$key}-01")) . ($key === $todayMonth ? ', en cours' : ''),
                'deposits' => $mDepots->count(),
                'accepted' => $mExp->whereIn('decision', ['ACCEPTE', 'ACCEPTE_EN_PIECES'])->count(),
                'refused' => $mExp->where('decision', 'REFUSE')->count(),
                'acquisitions' => $mAcq->count(),
                'salesPoints' => (int) $mAcq->sum('prix_total'),
                'complementsFcfa' => (int) $mAcq->sum('complement_du'),
                'marginPoints' => (int) $mMargin,
            ];
        }

        // Participation par UFR
        $byUfr = [];
        $groupedStudents = $etudiants->groupBy(fn (Etudiant $e) => $e->ufr ?: 'Non renseignée');
        foreach ($groupedStudents as $ufrName => $group) {
            $ids = $group->pluck('id')->all();
            $ufrDepots = $depots->whereIn('etudiant_id', $ids);
            $ufrAcqs = $activeAcquisitions->whereIn('etudiant_id', $ids);
            $byUfr[] = [
                'ufr' => $ufrName,
                'students' => $group->count(),
                'deposits' => $ufrDepots->count(),
                'accepted' => $ufrDepots->where('statut', 'VALIDE')->count(),
                'acquisitions' => $ufrAcqs->count(),
                'spentPoints' => (int) $ufrAcqs->sum('prix_total'),
            ];
        }
        usort($byUfr, fn (array $a, array $b) => ($b['deposits'] + $b['acquisitions']) <=> ($a['deposits'] + $a['acquisitions']) ?: strcmp($a['ufr'], $b['ufr']));

        $result = [
            'computedAt' => 'Calculé le ' . WecceClock::stampYear($at),
            'periode' => $periode,
            'periodLabel' => $periodLabel,
            'periodOptions' => $periodOptions,
            'fromDate' => $startDate ?? '',
            'toDate' => $endDate ?? '',
            'summary' => [
                'totalDeposits' => $depots->count(),
                'acceptedDeposits' => $acceptedDeposits,
                'refusedDeposits' => $refusedDeposits,
                'pendingDeposits' => $pendingDeposits,
                'cancelledDeposits' => $cancelledDeposits,
                'acceptanceRate' => $acceptanceRate,
                'fromDepositsCount' => $annonces->where('origine', 'DEPOT_ETUDIANT')->count(),
                'fromShopCount' => $annonces->where('origine', 'STOCK_PARTENAIRE')->count(),
                'totalEntered' => $annonces->count(),
                'availableCount' => $availableForSale->count(),
                'toPhotoCount' => $annonces->where('statut', 'A_PHOTOGRAPHIER')->count(),
                'reservedCount' => $reservedAnnonces->count(),
                'withdrawnCount' => $withdrawnAnnonces->count(),
                'totalAcquisitions' => $acquisitionsCount,
                'handedOverAcquisitions' => $handedOverCount,
                'reservedAcquisitions' => $reservedAcqCount,
                'cancelledAcquisitions' => $cancelledCount,
                'totalSalesPoints' => $totalSalesPoints,
                'totalPointsDebited' => $totalPointsDebited,
                'totalComplementsFcfa' => $totalComplementsFcfa,
                'avgBasketPoints' => $avgBasketPoints,
                'onlineCount' => $availableForSale->count() + $reservedAnnonces->count(),
                'onlineValue' => (int) ($availableForSale->sum('prix_courant') + $reservedAnnonces->sum('prix_courant')),
                'soldCount' => $soldAnnonces->count(),
                'soldValue' => (int) $soldAnnonces->sum('prix_courant'),
                'totalStudents' => $totalStudents,
                'studentsWithBalance' => $fundedCount,
                'totalPointsInCirculation' => $debt,
                'avgBalance' => $fundedCount > 0 ? (int) round($debt / $fundedCount) : 0,
                'bonusActive' => RegleBonus::campagneOuverte($config),
                'bonusRate' => (int) round($config->bonus_taux * 100),
                'bonusConsumed' => (int) $config->bonus_consomme,
                'bonusQuota' => (int) $config->bonus_quota,
            ],
            'byCategory' => $byCategory,
            'byCondition' => $byCondition,
            'paymentMethods' => $paymentMethods,
            'monthly' => $monthly,
            'byUfr' => $byUfr,
        ];

        if ($includeCatalog) {
            $stock = $this->stockPage();
            $result['catalog'] = [
                'articles' => $stock['articles'],
                'counts' => $stock['counts'],
            ];
        }

        return $result;
    }
}
