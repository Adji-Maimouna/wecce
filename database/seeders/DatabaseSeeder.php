<?php

namespace Database\Seeders;

use App\Models\Administrateur;
use App\Models\Agent;
use App\Models\Annonce;
use App\Models\Campus;
use App\Models\Categorie;
use App\Models\ComptePoints;
use App\Models\ConfigurationPlateforme;
use App\Models\Depot;
use App\Models\Etudiant;
use App\Models\JournalAdministration;
use App\Models\User;
use App\Services\WecceEngine;
use App\Support\WecceClock;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public const DEMO_PASSWORD = 'wecce2026';

    /**
     * Jour « aujourd'hui » du scénario écrit. Les données sont décalées pour que ce jour tombe
     * sur la date du jour de l'application (WecceClock::today) : rendez-vous du jour, achats en
     * attente et statistiques récentes suivent le calendrier réel. Avec WECCE_REFERENCE_DATE=2026-11-07
     * (les tests), le décalage est nul et le scénario reste à l'identique.
     */
    public const SCENARIO_TODAY = '2026-11-07';

    private int $offsetDays = 0;

    private array $userMap = [];

    public function run(): void
    {
        $this->offsetDays = WecceClock::daysBetween(self::SCENARIO_TODAY, WecceClock::today());

        $engine = app(WecceEngine::class);

        $campus = Campus::query()->firstOrCreate(
            ['code' => config('wecce.campus_code', 'ugb')],
            [
                'nom' => config('wecce.campus_nom', 'Université Gaston Berger (Saint-Louis)'),
                'partenaire_nom' => config('wecce.partenaire_nom', 'LBC (Leye Business Company)'),
                'partenaire_lieu' => config('wecce.partenaire_lieu', "LBC, campus de l'UGB, entre les villages E et F"),
                'actif' => true,
                'cree_le' => $this->at('2026-08-20T08:00'),
            ]
        );

        $categories = [
            ['code' => 'tel', 'libelle' => 'Téléphones', 'ordre' => 1],
            ['code' => 'ordi', 'libelle' => 'Ordinateurs', 'ordre' => 2],
            ['code' => 'tab', 'libelle' => 'Tablettes', 'ordre' => 3],
            ['code' => 'audio', 'libelle' => 'Audio', 'ordre' => 4],
            ['code' => 'piece', 'libelle' => 'Pièces et composants', 'ordre' => 5],
        ];
        foreach ($categories as $cat) {
            Categorie::query()->updateOrCreate(['code' => $cat['code']], $cat + ['actif' => true]);
        }

        ConfigurationPlateforme::query()->updateOrCreate(
            ['id' => 1],
            [
                'campus_id' => $campus->id,
                'depots_ouverts' => true,
                'suspension_manuelle' => false,
                'bonus_actif' => false,
                'bonus_taux' => 0.0,
                'bonus_quota' => 100,
                'bonus_consomme' => 0,
                // Historique de démonstration : bonus sans limite jusqu'à la décision du jour du scénario (voir fin du scénario).
                'bonus_plafond_points' => 0,
                'bonus_un_par_etudiant' => false,
                'duree_garantie_jours' => 90,
                'mis_a_jour_le' => $this->at('2026-09-01T07:00'),
            ]
        );

        $this->seedUsers($campus->id);

        $steps = $this->scenario($engine);
        usort($steps, fn (array $a, array $b) => $a['at'] <=> $b['at']);

        foreach ($steps as $step) {
            ($step['run'])();
        }
    }

    /**
     * Une date du scénario, recalée sur le calendrier réel (heure conservée).
     * Le décalage se compte en jours d'ouverture (LBC ferme le dimanche) : un rendez-vous du scénario
     * ne tombe jamais un dimanche, et l'ordre des évènements est conservé.
     */
    private function at(string $iso): string
    {
        if ($this->offsetDays === 0) {
            return $iso;
        }
        $day = substr($iso, 0, 10);
        $time = strlen($iso) > 10 ? substr($iso, 10) : '';

        return $this->openingDayFromBase($this->openingIndex($day)) . $time;
    }

    /** Rang d'un jour du scénario en jours d'ouverture depuis SCENARIO_TODAY (un dimanche compte comme le samedi). */
    private function openingIndex(string $day): int
    {
        if (WecceClock::weekday($day) === 0) {
            $day = WecceClock::addDays($day, -1);
        }
        $k = 0;
        $step = $day >= self::SCENARIO_TODAY ? 1 : -1;
        for ($d = self::SCENARIO_TODAY; $d !== $day; $d = WecceClock::addDays($d, $step)) {
            $next = WecceClock::addDays($d, $step);
            if (WecceClock::weekday($step > 0 ? $next : $d) !== 0) {
                $k += $step;
            }
        }

        return $k;
    }

    /** Le k-ième jour d'ouverture à partir d'aujourd'hui (aujourd'hui un dimanche : à partir de lundi). */
    private function openingDayFromBase(int $k): string
    {
        $d = WecceClock::today();
        if (WecceClock::weekday($d) === 0) {
            $d = WecceClock::addDays($d, 1);
        }
        $step = $k >= 0 ? 1 : -1;
        for ($i = 0; $i !== $k; $i += $step) {
            do {
                $d = WecceClock::addDays($d, $step);
            } while (WecceClock::weekday($d) === 0);
        }

        return $d;
    }

    /** La baisse mensuelle reste le 1er du mois : le mois décalé (en jours calendaires), ramené à son premier jour. */
    private function monthStart(string $iso): string
    {
        $shifted = WecceClock::addDays(substr($iso, 0, 10), $this->offsetDays);

        return substr($shifted, 0, 8) . '01' . substr($iso, 10);
    }

    private function seedUsers(string $campusId): void
    {
        $passwordHash = Hash::make(self::DEMO_PASSWORD);

        $students = [
            ['u-moussa', 'Moussa', 'Diallo', 'moussa.diallo@exemple.sn', '2024-1183', 'Licence 3', 'SAT', $this->at('2026-09-10T18:20')],
            ['u-aissatou', 'Aïssatou', 'Sarr', 'aissatou.sarr@exemple.sn', '2023-0871', 'Master 1', 'SJP', $this->at('2026-11-03T12:10')],
            ['u-ismaila', 'Ismaïla', 'Ndiaye', 'ismaila.ndiaye@exemple.sn', '2025-0213', 'Licence 1', 'SEG', $this->at('2026-09-16T09:00')],
            ['u-fatou', 'Fatou', 'Diop', 'fatou.diop@exemple.sn', '2024-0456', 'Licence 2', 'LSH', $this->at('2026-10-30T19:45')],
            ['u-omar', 'Omar', 'Ba', 'omar.ba@exemple.sn', '2022-1120', 'Master 2', 'SAT', $this->at('2026-09-04T11:30')],
            ['u-khady', 'Khady', 'Sy', 'khady.sy@exemple.sn', '2025-0098', 'Licence 1', '2S', $this->at('2026-09-25T17:05')],
            ['u-babacar', 'Babacar', 'Thiam', 'babacar.thiam@exemple.sn', '2023-0412', 'Licence 3', 'SEG', $this->at('2026-09-02T08:40')],
            ['u-ndeye', 'Ndèye', 'Sow', 'ndeye.sow@exemple.sn', '2024-0877', 'Licence 2', 'SJP', $this->at('2026-09-06T10:15')],
            ['u-aliou', 'Aliou', 'Diouf', 'aliou.diouf@exemple.sn', '2025-0150', 'Licence 1', 'SAT', $this->at('2026-09-12T15:00')],
            ['u-mariama', 'Mariama', 'Faye', 'mariama.faye@exemple.sn', '2024-0091', 'Master 1', 'LSH', $this->at('2026-09-29T20:30')],
            ['u-cheikh', 'Cheikh', 'Bâ', 'cheikh.ba@exemple.sn', '2025-0333', 'Licence 1', 'S2ATA', $this->at('2026-10-02T13:25')],
        ];

        foreach ($students as $i => [$key, $prenom, $nom, $email, $card, $niveau, $ufr, $createdAt]) {
            $phoneSuffix = str_pad((string) ($i === 0 ? 0 : 10 + $i), 2, '0', STR_PAD_LEFT);
            $user = User::query()->create([
                'campus_id' => $campusId,
                'prenom' => $prenom,
                'nom' => $nom,
                'email' => $email,
                'telephone' => "77 000 00 {$phoneSuffix}",
                'mot_de_passe_hash' => $passwordHash,
                'role' => 'ETUDIANT',
                'actif' => true,
                'cree_le' => $createdAt,
            ]);

            Etudiant::query()->create([
                'id' => $user->id,
                'numero_carte' => $card,
                'niveau' => $niveau,
                'ufr' => $ufr,
            ]);

            ComptePoints::query()->create([
                'etudiant_id' => $user->id,
                'solde' => 0,
                'statut' => 'ACTIF',
            ]);

            $this->userMap[$key] = $user;
        }

        $yakhya = User::query()->create([
            'campus_id' => $campusId,
            'prenom' => 'Yakhya',
            'nom' => 'Wade',
            'email' => 'comptoir1@lbc.exemple.sn',
            'telephone' => '77 000 00 01',
            'mot_de_passe_hash' => $passwordHash,
            'role' => 'AGENT',
            'actif' => true,
            'cree_le' => $this->at('2026-08-28T10:00'),
        ]);
        Agent::query()->create([
            'id' => $yakhya->id,
            'fonction' => 'Agent de comptoir',
            'peut_expertiser' => true,
            'poste' => 'Comptoir 1',
        ]);
        $this->userMap['u-awa'] = $yakhya;

        $admin = User::query()->create([
            'campus_id' => $campusId,
            'prenom' => 'Ibrahima',
            'nom' => 'Fall',
            'email' => 'admin@wecce.exemple.sn',
            'telephone' => '77 000 00 02',
            'mot_de_passe_hash' => $passwordHash,
            'role' => 'ADMIN',
            'actif' => true,
            'cree_le' => $this->at('2026-08-20T09:00'),
        ]);
        Administrateur::query()->create([
            'id' => $admin->id,
            'portee' => 'GLOBAL',
        ]);
        $this->userMap['u-admin'] = $admin;
    }

    private function uid(string $key): string
    {
        return $this->userMap[$key]->id;
    }

    private function scenario(WecceEngine $engine): array
    {
        $photos = [
            'redmi' => ['src' => '/img/redmi.jpg', 'alt' => 'Redmi Note 8, face avant, écran allumé', 'width' => 480, 'height' => 640],
            'a12' => ['src' => '/img/galaxya12.jpg', 'alt' => 'Galaxy A12 noir, vue de dos sur le bloc photo', 'width' => 720, 'height' => 960],
            'ssd' => ['src' => '/img/ssd.jpg', 'alt' => 'SSD 2,5 pouces de 1 To', 'width' => 500, 'height' => 281],
            't480' => ['src' => '/img/thinkpad.jpg', 'alt' => 'ThinkPad T480 ouvert sur une table', 'width' => 500, 'height' => 477],
            'airpods' => ['src' => '/img/airpods.jpg', 'alt' => 'AirPods et leur boîtier de charge ouvert', 'width' => 500, 'height' => 318],
            'ip11' => ['src' => '/img/iphone11.jpg', 'alt' => 'iPhone 11 rouge posé sur sa boîte', 'width' => 500, 'height' => 615],
            'sony' => ['src' => '/img/casque.jpg', 'alt' => 'Casque Sony WH-CH510 bleu', 'width' => 500, 'height' => 374],
            'probook' => ['src' => '/img/probook.jpg', 'alt' => 'Ordinateur portable HP ProBook ouvert', 'width' => 500, 'height' => 518],
            'ipad' => ['src' => '/img/ipad.jpg', 'alt' => 'iPad 2017 vu de face', 'width' => 453, 'height' => 640],
            'tecno' => ['src' => '/img/tecno.jpg', 'alt' => 'Tecno Spark 4 bleu, vue de dos', 'width' => 309, 'height' => 640],
            'ram' => ['src' => '/img/ram.jpg', 'alt' => 'Barrette de mémoire DDR4 SO-DIMM', 'width' => 500, 'height' => 248],
            'jbl' => ['src' => '/img/jbl.jpg', 'alt' => 'Enceinte JBL Go rouge', 'width' => 500, 'height' => 375],
            'latitude' => ['src' => '/img/latitude.jpg', 'alt' => 'Dell Latitude E6540 ouvert sur un bureau', 'width' => 500, 'height' => 375],
            'tab' => ['src' => '/img/galaxytab.jpg', 'alt' => 'Galaxy Tab A avec son stylet S Pen', 'width' => 417, 'height' => 640],
            'mac' => ['src' => '/img/macbook.jpg', 'alt' => 'MacBook noir ouvert', 'width' => 500, 'height' => 372],
            'batt' => ['src' => '/img/batterie.jpg', 'alt' => "Batterie lithium-ion d'ordinateur portable Fujitsu", 'width' => 500, 'height' => 310],
            's9' => ['src' => '/img/galaxys9.jpg', 'alt' => 'Galaxy S9+ vu de côté', 'width' => 500, 'height' => 281],
            'ibm' => ['src' => '/img/hdd.jpg', 'alt' => 'Disque dur IBM Travelstar 2,5 pouces', 'width' => 360, 'height' => 640],
        ];

        $adminUser = $this->userMap['u-admin'];
        $agentId = $this->uid('u-awa');

        $declare = fn (array $d): array => [
            'at' => $d['created'],
            'run' => fn () => $engine->createDeposit(
                $this->uid($d['user']),
                [
                    'ref' => $d['ref'],
                    'category' => $d['category'],
                    'modele' => $d['modele'],
                    'stockage' => $d['stockage'] ?? '',
                    'age' => $d['age'] ?? '1-2',
                    'etat' => $d['etat'] ?? ($d['category'] === 'piece' ? 'fonctionnel' : 'bon'),
                    'photos' => $d['photoUrls'] ?? [],
                    'photoCount' => $d['photos'] ?? (isset($d['photoUrls']) ? count($d['photoUrls']) : 3),
                    'wish' => $d['wish'] ?? null,
                    'slot' => $d['slot'],
                ],
                $d['created']
            ),
        ];

        $takenBack = function (string $ref, string $at, array $v, ?array $article = null) use ($engine, $agentId): array {
            $hh = str_pad((string) ((int) substr($at, 11, 2)), 2, '0', STR_PAD_LEFT);
            $mm = str_pad((string) min(59, ((int) substr($at, 14, 2)) + 9), 2, '0', STR_PAD_LEFT);
            $signedAt = substr($at, 0, 11) . "{$hh}:{$mm}";

            return [
                [
                    'at' => $at,
                    'run' => fn () => $engine->recordExpertise(
                        $agentId,
                        $ref,
                        [
                            'pieces' => $v['pieces'] ?? false,
                            'condition' => $v['condition'],
                            'battery' => $v['battery'] ?? null,
                            'serial' => $v['serial'] ?? '',
                            'takeBack' => $v['takeBack'],
                            'listPrice' => $v['listPrice'],
                        ],
                        $at
                    ),
                ],
                [
                    'at' => $signedAt,
                    'run' => function () use ($engine, $ref, $signedAt, $article) {
                        $res = $engine->sign($ref, $signedAt, null, $article['photo'] ?? null);
                        if (!$article) {
                            return;
                        }
                        /** @var Annonce $a */
                        $a = $res['article'];
                        $updates = [];
                        if (!empty($article['slug'])) {
                            $updates['slug'] = $article['slug'];
                        }
                        if (!empty($article['keywords'])) {
                            $updates['mots_cles'] = $article['keywords'];
                        }
                        if (!empty($article['title'])) {
                            $updates['titre'] = $article['title'];
                        }
                        if (!empty($article['details'])) {
                            $updates['sous_titre'] = $article['details'];
                        }
                        if (!empty($article['checks'])) {
                            $updates['controles'] = $article['checks'];
                        }
                        if (count($updates)) {
                            $a->update($updates);
                        }
                        if (!empty($article['detail'])) {
                            $a->appareil->update(['precision' => $article['detail']]);
                        }
                        if (!empty($article['online']) && $a->statut === 'A_PHOTOGRAPHIER') {
                            $engine->publish($a->id, $signedAt);
                        }
                    },
                ],
            ];
        };

        $refused = fn (string $ref, string $at, string $reason, string $comment): array => [
            'at' => $at,
            'run' => fn () => $engine->refuse($agentId, $ref, $reason, $comment, $at),
        ];

        $shopItem = fn (string $at, array $a): array => [
            'at' => $at,
            'run' => fn () => $engine->addShopArticle($a + ['at' => $at]),
        ];

        $bought = function (string $userKey, string $slug, string $method, string $at, ?string $handedAt = null, bool $validate = true) use ($engine, $agentId): array {
            $mm = str_pad((string) min(59, ((int) substr($at, 14, 2)) + 1), 2, '0', STR_PAD_LEFT);
            $confirmAt = substr($at, 0, 14) . $mm;

            return [
                [
                    'at' => $at,
                    'run' => function () use ($engine, $agentId, $userKey, $slug, $method, $at, $confirmAt, $handedAt, $validate) {
                        $article = Annonce::query()->where('slug', $slug)->firstOrFail();
                        $res = $engine->acquire($this->uid($userKey), $article->id, $method, $at);
                        $q = $res['acquisition'];
                        if ($q->statut === 'EN_ATTENTE') {
                            $engine->confirmPayment($q->reference, $confirmAt);
                        }
                        if (!$validate) {
                            return;
                        }
                        // LBC valide l'achat peu après (les points sont débités à ce moment).
                        $engine->validateAcquisition($agentId, $q->reference, $confirmAt);
                        if ($handedAt) {
                            $engine->handOver($q->reference, $handedAt, $agentId);
                        }
                    },
                ],
            ];
        };

        $mondays = [
            $this->at('2026-09-01'), $this->at('2026-09-08'), $this->at('2026-09-15'), $this->at('2026-09-22'), $this->at('2026-09-29'),
            $this->at('2026-10-06'), $this->at('2026-10-13'), $this->at('2026-10-20'), $this->at('2026-10-27'), $this->at('2026-11-03'),
        ];
        $events = [
            $this->at('2026-10-06') => 'après la baisse du ' . WecceClock::dayMonth($this->monthStart('2026-10-01T02:00')),
            $this->at('2026-11-03') => 'après la baisse du ' . WecceClock::dayMonth($this->monthStart('2026-11-01T02:00')),
        ];

        $steps = [
            [
                'at' => $this->at('2026-09-01T07:50'),
                'run' => fn () => $engine->saveBonus(20, 100, 'Ouverture de la plateforme.', $this->at('2026-09-01T07:50'), $adminUser),
            ],
            $shopItem($this->at('2026-09-01T09:00'), ['slug' => 'jbl-go', 'name' => 'Enceinte JBL Go', 'keywords' => 'JBL Go enceinte', 'category' => 'audio', 'condition' => 'bon', 'info' => 'Bon état', 'price' => 12200, 'photo' => $photos['jbl']]),
            $shopItem($this->at('2026-09-01T09:05'), ['slug' => 'ssd-1-to', 'name' => 'SSD 2,5″ · 1 To SATA', 'keywords' => 'SSD 2,5 1 To SATA disque', 'category' => 'piece', 'condition' => 'fonctionnel', 'detail' => 'Âge inconnu', 'info' => 'Fonctionnel · testé', 'price' => 34400, 'photo' => $photos['ssd']]),
            $shopItem($this->at('2026-09-01T09:10'), ['slug' => 'galaxy-j5', 'name' => 'Galaxy J5 · 16 Go', 'keywords' => 'Galaxy J5 16 Go Samsung', 'category' => 'tel', 'condition' => 'use', 'battery' => 74, 'info' => 'Usé · batterie 74 %', 'price' => 26000]),
            $shopItem($this->at('2026-09-01T09:15'), ['slug' => 'chargeur-magsafe', 'name' => 'Chargeur MagSafe 2 · 60 W', 'keywords' => 'Chargeur MagSafe Apple MacBook', 'category' => 'piece', 'condition' => 'fonctionnel', 'info' => 'Fonctionnel', 'price' => 9000]),
            $shopItem($this->at('2026-09-01T09:20'), ['slug' => 'cle-usb-sandisk', 'name' => 'Clé USB SanDisk · 64 Go', 'keywords' => 'Clé USB SanDisk 64 Go', 'category' => 'piece', 'condition' => 'fonctionnel', 'info' => 'Fonctionnel', 'price' => 5000]),
            $shopItem($this->at('2026-09-02T10:00'), ['slug' => 'hp-probook', 'name' => 'HP ProBook · 8 Go', 'keywords' => 'HP ProBook 8 Go ordinateur', 'category' => 'ordi', 'condition' => 'bon', 'battery' => 77, 'info' => 'Bon état · batterie 77 %', 'price' => 108600, 'photo' => $photos['probook']]),
            $shopItem($this->at('2026-09-02T10:05'), ['slug' => 'ram-ddr4-16', 'name' => 'RAM DDR4 SO-DIMM · 16 Go', 'keywords' => 'RAM DDR4 SO-DIMM 16 Go barrette mémoire', 'category' => 'piece', 'condition' => 'fonctionnel', 'detail' => 'Âge inconnu', 'info' => 'Fonctionnel · testée', 'price' => 21000, 'photo' => $photos['ram']]),
            $shopItem($this->at('2026-09-03T11:00'), ['slug' => 'dell-latitude', 'name' => 'Dell Latitude E6540', 'keywords' => 'Dell Latitude E6540 ordinateur', 'category' => 'ordi', 'condition' => 'use', 'battery' => 71, 'info' => 'Usé · batterie 71 %', 'price' => 94700, 'photo' => $photos['latitude']]),
            $shopItem($this->at('2026-09-03T11:05'), ['slug' => 'batterie-fujitsu', 'name' => 'Batterie Fujitsu Amilo', 'keywords' => 'Batterie Fujitsu Amilo portable', 'category' => 'piece', 'condition' => 'fonctionnel', 'detail' => 'Tient 2 h', 'info' => 'Fonctionnelle · tient 2 h', 'price' => 7200, 'photo' => $photos['batt']]),
            [
                'at' => $this->at('2026-09-01T07:55'),
                'run' => fn () => JournalAdministration::query()->create([
                    'administrateur_id' => $adminUser->id,
                    'utilisateur_id' => $adminUser->id,
                    'auteur_libelle' => $adminUser->auditSignature(),
                    'action' => 'CONFIGURATION',
                    'cible_type' => 'configuration_plateforme',
                    'cible_libelle' => 'Dépôts',
                    'changement' => 'Fermés → ouverts',
                    'motif' => 'Ouverture de la plateforme avec les articles de la boutique.',
                    'effectue_le' => $this->at('2026-09-01T07:55'),
                ]),
            ],

            // Septembre
            $declare(['ref' => 'WC-2026-0412', 'user' => 'u-moussa', 'created' => $this->at('2026-09-10T18:30'), 'slot' => $this->at('2026-09-14T10:00'), 'category' => 'tel', 'modele' => 'Redmi Note 8', 'stockage' => '64 Go', 'wish' => 35000]),
            ...$takenBack('WC-2026-0412', $this->at('2026-09-14T10:06'), ['condition' => 'bon', 'battery' => 86, 'takeBack' => 30000, 'listPrice' => 40000, 'serial' => 'R58K44Q2'], ['slug' => 'redmi-note-8', 'photo' => $photos['redmi'], 'keywords' => 'Redmi Note 8 64 Go Xiaomi']),
            $declare(['ref' => 'WC-2026-0433', 'user' => 'u-aliou', 'created' => $this->at('2026-09-13T09:00'), 'slot' => $this->at('2026-09-18T11:00'), 'category' => 'piece', 'modele' => 'Disque dur IBM Travelstar 2,5″', 'stockage' => '4 Go', 'age' => 'inconnu']),
            ...$takenBack('WC-2026-0433', $this->at('2026-09-18T11:04'), ['condition' => 'fonctionnel', 'takeBack' => 4500, 'listPrice' => 6000], ['slug' => 'ibm-travelstar', 'photo' => $photos['ibm']]),
            $declare(['ref' => 'WC-2026-0455', 'user' => 'u-ismaila', 'created' => $this->at('2026-09-16T09:30'), 'slot' => $this->at('2026-09-19T10:00'), 'category' => 'tel', 'modele' => 'Redmi 9A', 'stockage' => '32 Go', 'wish' => 18000]),
            ...$takenBack('WC-2026-0455', $this->at('2026-09-19T10:05'), ['condition' => 'bon', 'battery' => 90, 'takeBack' => 14000, 'listPrice' => 18700], ['slug' => 'redmi-9a', 'online' => true]),
            $declare(['ref' => 'WC-2026-0466', 'user' => 'u-babacar', 'created' => $this->at('2026-09-18T20:00'), 'slot' => $this->at('2026-09-22T10:00'), 'category' => 'tel', 'modele' => 'Tecno Spark 4', 'stockage' => '32 Go', 'age' => '2-3', 'etat' => 'use', 'wish' => 22000]),
            ...$takenBack('WC-2026-0466', $this->at('2026-09-22T10:04'), ['condition' => 'use', 'battery' => 79, 'takeBack' => 20000, 'listPrice' => 27100], ['slug' => 'tecno-spark-4', 'photo' => $photos['tecno'], 'keywords' => 'Tecno Spark 4 32 Go']),
            $declare(['ref' => 'WC-2026-0488', 'user' => 'u-moussa', 'created' => $this->at('2026-09-18T21:10'), 'slot' => $this->at('2026-09-24T15:00'), 'category' => 'audio', 'modele' => 'Casque JBL Tune 500', 'age' => '2-3']),
            [
                'at' => $this->at('2026-09-22T19:30'),
                'run' => fn () => Depot::query()->where('reference', 'WC-2026-0488')->update(['statut' => 'ANNULE', 'cloture_le' => $this->at('2026-09-22T19:30')]),
            ],
            $declare(['ref' => 'WC-2026-0505', 'user' => 'u-aliou', 'created' => $this->at('2026-09-24T12:00'), 'slot' => $this->at('2026-09-28T15:00'), 'category' => 'tab', 'modele' => 'iPad (2017)', 'stockage' => '32 Go', 'age' => 'plus-4', 'wish' => 70000]),
            ...$takenBack('WC-2026-0505', $this->at('2026-09-28T15:06'), ['condition' => 'bon', 'battery' => 83, 'takeBack' => 63000, 'listPrice' => 84000], ['slug' => 'ipad-2017', 'photo' => $photos['ipad'], 'keywords' => 'iPad 2017 32 Go Apple tablette']),

            // Octobre
            ['at' => $this->monthStart('2026-10-01T02:00'), 'run' => fn () => $engine->monthlyFonte($this->monthStart('2026-10-01T02:00'))],
            ...$bought('u-khady', 'redmi-9a', 'wave', $this->at('2026-10-02T13:40'), $this->at('2026-10-03T10:20')),
            $declare(['ref' => 'WC-2026-0520', 'user' => 'u-mariama', 'created' => $this->at('2026-09-30T08:00'), 'slot' => $this->at('2026-10-03T09:30'), 'category' => 'tab', 'modele' => 'Galaxy Tab A (2016)', 'stockage' => 'S Pen', 'age' => 'plus-4', 'etat' => 'use', 'wish' => 45000]),
            ...$takenBack('WC-2026-0520', $this->at('2026-10-03T09:34'), ['condition' => 'use', 'battery' => 76, 'takeBack' => 31000, 'listPrice' => 41000], ['slug' => 'galaxy-tab-a', 'photo' => $photos['tab'], 'keywords' => 'Galaxy Tab A 2016 S Pen Samsung tablette']),
            $declare(['ref' => 'WC-2026-0521', 'user' => 'u-moussa', 'created' => $this->at('2026-09-29T22:15'), 'slot' => $this->at('2026-10-03T10:30'), 'category' => 'tel', 'modele' => 'Tecno Camon 12', 'stockage' => '64 Go', 'age' => '2-3', 'wish' => 30000]),
            $refused('WC-2026-0521', $this->at('2026-10-03T10:34'), 'ecran', "Écran fissuré sur toute la largeur. Une fois l'écran remplacé, vous pouvez le déposer à nouveau."),
            ...$bought('u-babacar', 'galaxy-j5', 'especes', $this->at('2026-10-06T17:10'), $this->at('2026-10-08T12:00')),
            $declare(['ref' => 'WC-2026-0540', 'user' => 'u-khady', 'created' => $this->at('2026-09-27T21:00'), 'slot' => $this->at('2026-10-10T14:00'), 'category' => 'audio', 'modele' => 'AirPods', 'stockage' => '1re génération', 'age' => 'plus-4', 'etat' => 'use']),
            ...$takenBack('WC-2026-0540', $this->at('2026-10-10T14:05'), ['condition' => 'use', 'battery' => 74, 'takeBack' => 17000, 'listPrice' => 22600], ['slug' => 'airpods', 'photo' => $photos['airpods'], 'keywords' => 'AirPods Apple écouteurs']),
            [
                'at' => $this->at('2026-10-12T16:21'),
                'run' => fn () => $engine->adjust('2025-0213', 'credit', 2000, 'Reprise WC-2026-0455 saisie à 14 000 pts au lieu des 16 000 annoncés au comptoir.', $adminUser, $this->at('2026-10-12T16:21')),
            ],
            ...$bought('u-ndeye', 'chargeur-magsafe', 'om', $this->at('2026-10-14T11:00'), $this->at('2026-10-15T09:45')),
            $shopItem($this->at('2026-10-15T10:00'), ['slug' => 'thinkpad-t480', 'name' => 'ThinkPad T480 · 8 Go', 'keywords' => 'ThinkPad T480 Lenovo 8 Go ordinateur', 'category' => 'ordi', 'condition' => 'comme-neuf', 'battery' => 92, 'info' => 'Comme neuf · batterie 92 %', 'price' => 149500, 'photo' => $photos['t480']]),
            $declare(['ref' => 'WC-2026-0571', 'user' => 'u-ndeye', 'created' => $this->at('2026-10-16T19:00'), 'slot' => $this->at('2026-10-20T10:00'), 'category' => 'tel', 'modele' => 'iPhone 11', 'stockage' => '64 Go', 'wish' => 100000]),
            ...$takenBack('WC-2026-0571', $this->at('2026-10-20T10:07'), ['condition' => 'bon', 'battery' => 84, 'takeBack' => 93000, 'listPrice' => 124200], ['slug' => 'iphone-11', 'photo' => $photos['ip11'], 'keywords' => 'iPhone 11 64 Go Apple rouge']),
            ...$bought('u-omar', 'cle-usb-sandisk', 'especes', $this->at('2026-10-20T16:30'), $this->at('2026-10-21T10:10')),
            [
                'at' => $this->at('2026-10-24T08:05'),
                'run' => fn () => $engine->setSuspended(true, "Fermeture de la boutique pour inventaire jusqu'au " . WecceClock::dayMonth($this->at('2026-10-28')) . '.', $this->at('2026-10-24T08:05'), $adminUser),
            ],
            $declare(['ref' => 'WC-2026-0587', 'user' => 'u-cheikh', 'created' => $this->at('2026-10-21T18:00'), 'slot' => $this->at('2026-10-26T10:30'), 'category' => 'ordi', 'modele' => 'MacBook noir', 'stockage' => '', 'age' => 'plus-4', 'etat' => 'use', 'wish' => 20000]),
            ...$takenBack('WC-2026-0587', $this->at('2026-10-26T10:36'), ['condition' => 'defectueux', 'takeBack' => 9500, 'listPrice' => 12600, 'pieces' => true], ['slug' => 'macbook-pieces', 'photo' => $photos['mac'], 'keywords' => 'MacBook noir pour pièces', 'detail' => 'Ne démarre pas']),
            [
                'at' => $this->at('2026-10-28T11:40'),
                'run' => fn () => $engine->setSuspended(false, "Fin de l'inventaire de la boutique.", $this->at('2026-10-28T11:40'), $adminUser),
            ],
            $declare(['ref' => 'WC-2026-0598', 'user' => 'u-mariama', 'created' => $this->at('2026-10-24T09:20'), 'slot' => $this->at('2026-10-28T14:00'), 'category' => 'tel', 'modele' => 'Galaxy A12', 'stockage' => '64 Go', 'wish' => 38000]),
            ...$takenBack(
                'WC-2026-0598',
                $this->at('2026-10-28T14:06'),
                ['condition' => 'bon', 'battery' => 81, 'takeBack' => 33000, 'listPrice' => 44200, 'serial' => 'R58R1Q7KD'],
                [
                    'slug' => 'galaxy-a12',
                    'photo' => $photos['a12'],
                    'keywords' => 'Galaxy A12 64 Go Samsung',
                    'title' => 'Samsung Galaxy A12 · 64 Go',
                    'details' => 'Noir · 4 Go de mémoire vive · déposé par un étudiant',
                    'checks' => [
                        ['label' => 'Écran', 'value' => 'Une rayure fine en bas, invisible écran allumé'],
                        ['label' => 'Batterie', 'value' => "81 % de sa capacité d'origine"],
                        ['label' => 'Compte Google', 'value' => 'Déconnecté, téléphone réinitialisé'],
                        ['label' => 'Appareils photo et micro', 'value' => 'Testés, fonctionnent'],
                        ['label' => 'Réseau', 'value' => 'Double SIM, tous opérateurs'],
                        ['label' => 'Numéro de série', 'value' => 'R58R••••7KD', 'numeric' => true],
                    ],
                ]
            ),
            $declare(['ref' => 'WC-2026-0602', 'user' => 'u-omar', 'created' => $this->at('2026-10-27T10:00'), 'slot' => $this->at('2026-10-30T11:00'), 'category' => 'audio', 'modele' => 'Casque Sony WH-CH510', 'age' => 'moins-1', 'etat' => 'comme-neuf', 'wish' => 15000]),
            ...$takenBack('WC-2026-0602', $this->at('2026-10-30T11:03'), ['condition' => 'comme-neuf', 'takeBack' => 13800, 'listPrice' => 18400], ['slug' => 'casque-sony', 'photo' => $photos['sony'], 'keywords' => 'Sony WH-CH510 casque']),

            // Novembre
            ['at' => $this->monthStart('2026-11-01T02:00'), 'run' => fn () => $engine->monthlyFonte($this->monthStart('2026-11-01T02:00'))],
            [
                'at' => $this->at('2026-11-04T18:02'),
                'run' => function () use ($engine, $adminUser) {
                    $art = Annonce::query()->where('slug', 'ibm-travelstar')->firstOrFail();
                    $engine->withdraw($art->id, 'Interface IDE, 4 Go : aucune demande depuis 7 semaines.', $this->at('2026-11-04T18:02'), $adminUser);
                },
            ],
            $declare(['ref' => 'WC-2026-0611', 'user' => 'u-babacar', 'created' => $this->at('2026-11-02T21:00'), 'slot' => $this->at('2026-11-06T09:30'), 'category' => 'tel', 'modele' => 'Galaxy A20', 'stockage' => '32 Go', 'age' => '2-3', 'etat' => 'use', 'wish' => 25000]),
            ...$takenBack('WC-2026-0611', $this->at('2026-11-06T09:36'), ['condition' => 'use', 'battery' => 78, 'takeBack' => 21000, 'listPrice' => 28000]),
            $declare(['ref' => 'WC-2026-0612', 'user' => 'u-cheikh', 'created' => $this->at('2026-11-03T08:30'), 'slot' => $this->at('2026-11-06T14:00'), 'category' => 'tel', 'modele' => 'Galaxy S9+', 'stockage' => '64 Go', 'age' => 'plus-4', 'etat' => 'use', 'wish' => 40000]),
            ...$takenBack('WC-2026-0612', $this->at('2026-11-06T14:05'), ['condition' => 'use', 'battery' => 72, 'takeBack' => 36000, 'listPrice' => 47500], ['slug' => 'galaxy-s9', 'photo' => $photos['s9'], 'keywords' => 'Galaxy S9+ 64 Go Samsung']),
            $declare(['ref' => 'WC-2026-0615', 'user' => 'u-ndeye', 'created' => $this->at('2026-11-03T18:00'), 'slot' => $this->at('2026-11-06T11:00'), 'category' => 'ordi', 'modele' => 'HP 250 G7', 'stockage' => '8 Go', 'age' => '2-3', 'wish' => 110000]),
            ...$takenBack('WC-2026-0615', $this->at('2026-11-06T11:08'), ['condition' => 'bon', 'battery' => 85, 'takeBack' => 88000, 'listPrice' => 115000]),
            $declare(['ref' => 'WC-2026-0619', 'user' => 'u-aliou', 'created' => $this->at('2026-11-04T07:45'), 'slot' => $this->at('2026-11-06T15:00'), 'category' => 'piece', 'modele' => 'Clé USB', 'stockage' => '64 Go', 'age' => 'inconnu']),
            $refused('WC-2026-0619', $this->at('2026-11-06T15:03'), 'modele', 'Une clé USB de 64 Go se trouve neuve pour moins cher : elle ne se revendrait pas sur Wecce.'),
            ...$bought('u-fatou', 'iphone-11', 'especes', $this->at('2026-11-06T16:20')),
            // Achat en attente de validation par LBC (démonstration de l'onglet Stock).
            ...$bought('u-aissatou', 'ram-ddr4-16', 'especes', $this->at('2026-11-07T10:50'), null, false),
            $declare(['ref' => 'WC-2026-0629', 'user' => 'u-aissatou', 'created' => $this->at('2026-11-03T12:30'), 'slot' => $this->at('2026-11-07T09:30'), 'category' => 'tel', 'modele' => 'Galaxy A32', 'stockage' => '128 Go', 'wish' => 45000]),
            ...$takenBack('WC-2026-0629', $this->at('2026-11-07T09:42'), ['condition' => 'bon', 'battery' => 87, 'takeBack' => 38000, 'listPrice' => 51000]),
            $declare(['ref' => 'WC-2026-0631', 'user' => 'u-ismaila', 'created' => $this->at('2026-11-04T10:00'), 'slot' => $this->at('2026-11-07T10:00'), 'category' => 'audio', 'modele' => 'Écouteurs Oraimo FreePods', 'age' => '2-3', 'etat' => 'use']),
            $refused('WC-2026-0631', $this->at('2026-11-07T10:08'), 'batterie', 'Autonomie mesurée à 40 minutes. Après remplacement de la batterie, vous pouvez les déposer à nouveau.'),
            $declare(['ref' => 'WC-2026-0634', 'user' => 'u-moussa', 'created' => $this->at('2026-11-04T20:15'), 'slot' => $this->at('2026-11-07T10:30'), 'category' => 'ordi', 'modele' => 'Lenovo IdeaPad 3', 'stockage' => '256 Go SSD', 'wish' => 90000, 'photoUrls' => [$photos['t480']['src']]]),
            $declare(['ref' => 'WC-2026-0643', 'user' => 'u-fatou', 'created' => $this->at('2026-11-05T09:00'), 'slot' => $this->at('2026-11-07T14:00'), 'category' => 'tel', 'modele' => 'iPhone XR', 'stockage' => '64 Go', 'age' => 'plus-4', 'etat' => 'use', 'wish' => 70000, 'photoUrls' => [$photos['ip11']['src']]]),
            $declare(['ref' => 'WC-2026-0647', 'user' => 'u-omar', 'created' => $this->at('2026-11-05T14:20'), 'slot' => $this->at('2026-11-07T15:30'), 'category' => 'piece', 'modele' => 'Disque dur 2,5″', 'stockage' => '500 Go', 'age' => 'inconnu', 'wish' => 8000, 'photoUrls' => [$photos['ibm']['src']]]),
            $declare(['ref' => 'WC-2026-0650', 'user' => 'u-khady', 'created' => $this->at('2026-11-05T18:00'), 'slot' => $this->at('2026-11-07T16:30'), 'category' => 'audio', 'modele' => 'Enceinte JBL Flip 4', 'age' => '2-3', 'wish' => 25000]),
            [
                'at' => $this->at('2026-11-06T20:10'),
                'run' => fn () => Depot::query()->where('reference', 'WC-2026-0650')->update(['statut' => 'ANNULE', 'cloture_le' => $this->at('2026-11-06T20:10')]),
            ],
            $declare(['ref' => 'WC-2026-0652', 'user' => 'u-mariama', 'created' => $this->at('2026-11-06T08:00'), 'slot' => $this->at('2026-11-09T09:30'), 'category' => 'tab', 'modele' => 'iPad Air 2', 'stockage' => '64 Go', 'age' => 'plus-4', 'etat' => 'use', 'wish' => 60000, 'photoUrls' => [$photos['ipad']['src']]]),
            $declare(['ref' => 'WC-2026-0653', 'user' => 'u-cheikh', 'created' => $this->at('2026-11-06T09:15'), 'slot' => $this->at('2026-11-09T10:30'), 'category' => 'piece', 'modele' => 'Barrette DDR4', 'stockage' => '8 Go', 'wish' => 9000, 'photoUrls' => [$photos['ram']['src']]]),
            $declare(['ref' => 'WC-2026-0654', 'user' => 'u-babacar', 'created' => $this->at('2026-11-06T22:00'), 'slot' => $this->at('2026-11-11T09:30'), 'category' => 'tab', 'modele' => 'Galaxy Tab A7', 'stockage' => '32 Go', 'wish' => 50000, 'photoUrls' => [$photos['tab']['src']]]),
            [
                'at' => $this->at('2026-11-07T18:00'),
                'run' => fn () => $engine->saveBonus(20, 100, 'Limites demandées par LBC : un bonus par étudiant, 5 000 points au plus par dépôt.', $this->at('2026-11-07T18:00'), $adminUser, null, 5000, true),
            ],
            // Demandes de rendez-vous en attente : c'est LBC qui fixe le jour et l'heure.
            [
                'at' => $this->at('2026-11-07T08:15'),
                'run' => fn () => $engine->createDeposit($this->uid('u-ismaila'), [
                    'category' => 'tel', 'modele' => 'Infinix Hot 10', 'stockage' => '64 Go', 'age' => '1-2', 'etat' => 'bon',
                    'wish' => 32000, 'photoCount' => 2,
                    'availability' => ['days' => [$this->at('2026-11-09'), $this->at('2026-11-10')], 'moment' => 'matin', 'note' => 'Après mon TD de 8 h'],
                ], $this->at('2026-11-07T08:15')),
            ],
            [
                'at' => $this->at('2026-11-07T09:05'),
                'run' => fn () => $engine->createDeposit($this->uid('u-ndeye'), [
                    'category' => 'audio', 'modele' => 'Casque Bose QuietComfort 35', 'age' => '2-3', 'etat' => 'bon',
                    'wish' => 45000, 'photoCount' => 3,
                    'availability' => ['days' => [$this->at('2026-11-09'), $this->at('2026-11-11'), $this->at('2026-11-12')], 'moment' => 'apres-midi', 'note' => ''],
                ], $this->at('2026-11-07T09:05')),
            ],
            $declare(['ref' => 'WC-2026-0655', 'user' => 'u-moussa', 'created' => $this->at('2026-11-06T21:40'), 'slot' => null, 'category' => 'piece', 'modele' => 'Disque dur externe', 'stockage' => '1 To', 'age' => '1-2', 'photos' => 0]),
        ];

        foreach ($mondays as $d) {
            $at = $d === $this->at('2026-09-01') ? "{$d}T12:00" : "{$d}T06:00";
            $ev = $events[$d] ?? null;
            $steps[] = [
                'at' => $at,
                'run' => fn () => $engine->snapshot($at, $ev),
            ];
        }

        return $steps;
    }
}
