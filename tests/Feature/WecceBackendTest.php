<?php

namespace Tests\Feature;

use App\Models\Annonce;
use App\Models\ComptePoints;
use App\Models\Etudiant;
use App\Models\JournalAdministration;
use App\Models\MouvementPoints;
use App\Models\User;
use App\Services\WecceEngine;
use App\Services\WecceQueries;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class WecceBackendTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(DatabaseSeeder::class);
    }

    public function test_seeded_balances_match_exact_chronological_scenario_and_views(): void
    {
        $expectedBalancesByCard = [
            '2024-1183' => 32490,  // Moussa Diallo
            '2023-0871' => 45600,  // Aïssatou Sarr
            '2025-0213' => 17062,  // Ismaïla Ndiaye
            '2024-0456' => 0,      // Fatou Diop
            '2022-1120' => 15732,  // Omar Ba
            '2025-0098' => 19380,  // Khady Sy
            '2023-0412' => 25200,  // Babacar Thiam
            '2024-0877' => 211620, // Ndèye Sow
            '2025-0150' => 73103,  // Aliou Diouf
            '2024-0091' => 72960,  // Mariama Faye
            '2025-0333' => 54030,  // Cheikh Bâ
        ];

        foreach ($expectedBalancesByCard as $card => $expected) {
            $etudiant = Etudiant::query()->where('numero_carte', $card)->firstOrFail();
            $compte = ComptePoints::query()->where('etudiant_id', $etudiant->id)->firstOrFail();
            $this->assertSame($expected, (int) $compte->solde, "Écart de solde sur la carte {$card}");
        }

        $queries = app(WecceQueries::class);
        $this->assertSame([], $queries->balanceMismatches());

        $couverture = DB::table('v_couverture_actuelle')->first();
        $this->assertNotNull($couverture);
        $this->assertSame(567177, (int) $couverture->dette_en_points);
        $this->assertSame(1020730, (int) $couverture->valeur_stock);
        $this->assertSame(20, (int) $couverture->nb_objets);
    }

    public function test_append_only_triggers_protect_mouvement_points_and_journal_administration(): void
    {
        $mouvement = MouvementPoints::query()->firstOrFail();

        try {
            DB::table('mouvement_points')
                ->where('id', $mouvement->id)
                ->update(['montant' => 999999]);
            $this->fail('UPDATE sur mouvement_points aurait dû être bloqué par le trigger append-only.');
        } catch (QueryException $e) {
            $this->assertStringContainsString('ajout seul', $e->getMessage());
        }

        $journal = JournalAdministration::query()->firstOrFail();

        try {
            DB::table('journal_administration')
                ->where('id', $journal->id)
                ->delete();
            $this->fail('DELETE sur journal_administration aurait dû être bloqué par le trigger append-only.');
        } catch (QueryException $e) {
            $this->assertStringContainsString('ajout seul', $e->getMessage());
        }
    }

    public function test_authentication_and_role_middlewares(): void
    {
        // Connexion échouée
        $bad = $this->postJson('/connexion', [
            'identifiant' => 'moussa.diallo@exemple.sn',
            'motDePasse'  => 'mauvais-mot-de-passe',
        ]);
        $bad->assertOk()->assertJson([
            'ok'     => false,
            'reason' => 'identifiants-invalides',
        ]);

        // Connexion réussie étudiant
        $ok = $this->postJson('/connexion', [
            'identifiant' => 'moussa.diallo@exemple.sn',
            'motDePasse'  => DatabaseSeeder::DEMO_PASSWORD,
            'rester'      => true,
        ]);
        $ok->assertOk()->assertJson([
            'ok'   => true,
            'role' => 'ETUDIANT',
        ]);

        // Redirection guest si déjà connecté (HOME_BY_ROLE['ETUDIANT'] = '/etudiant/solde')
        $this->get('/connexion')->assertRedirect('/etudiant/solde');

        // Un étudiant ne peut pas accéder à l'espace partenaire ou admin
        $this->get('/partenaire/rendez-vous')->assertRedirect('/etudiant/solde');
        $this->get('/admin/pilotage')->assertRedirect('/etudiant/solde');

        // Inscription nouvel étudiant
        $this->postJson('/deconnexion')->assertOk();
        $reg = $this->postJson('/inscription', [
            'prenom'      => 'Khadija',
            'nom'         => 'Ndiaye',
            'numeroCarte' => '2026-9999',
            'telephone'   => '77 999 88 77',
            'email'       => 'khadija.ndiaye@exemple.sn',
            'niveau'      => 'Master 1',
            'ufr'         => 'SAT',
            'motDePasse'  => 'Sanar2026!',
        ]);
        $reg->assertOk()->assertJson(['ok' => true, 'role' => 'ETUDIANT']);

        // Inscription avec téléphone déjà utilisé (même avec format différent)
        $this->postJson('/deconnexion')->assertOk();
        $this->postJson('/inscription', [
            'prenom'      => 'Test',
            'nom'         => 'DupPhone',
            'numeroCarte' => '2026-9998',
            'telephone'   => '+221 77 999 88 77',
            'email'       => 'nouveau.unique@exemple.sn',
            'motDePasse'  => 'Sanar2026!',
        ])->assertStatus(422)
            ->assertJson(['code' => 'telephone-pris'])
            ->assertJsonStructure(['errors' => ['telephone']]);

        // Inscription avec e-mail ET téléphone déjà utilisés simultanément
        $this->postJson('/inscription', [
            'prenom'      => 'Test',
            'nom'         => 'DupBoth',
            'numeroCarte' => '2026-9997',
            'telephone'   => '779998877',
            'email'       => 'KHADIJA.NDIAYE@exemple.sn',
            'motDePasse'  => 'Sanar2026!',
        ])->assertStatus(422)
            ->assertJson(['code' => 'compte-existant'])
            ->assertJsonStructure(['errors' => ['email', 'telephone']]);

        // Inscription avec champs invalides (e-mail invalide, téléphone trop court)
        $this->postJson('/inscription', [
            'prenom'      => 'Test',
            'nom'         => 'Invalid',
            'numeroCarte' => '2026-9996',
            'telephone'   => '123',
            'email'       => 'pas-un-email',
            'motDePasse'  => 'Sanar2026!',
        ])->assertStatus(422)
            ->assertJson(['code' => 'champs-invalides'])
            ->assertJsonStructure(['errors' => ['email', 'telephone']]);
    }

    public function test_all_public_student_partner_and_admin_inertia_screens_render(): void
    {
        // Pages publiques (4 écrans)
        $this->get('/')->assertOk()->assertInertia(fn (Assert $page) => $page
            ->component('Accueil')
            ->has('recentTakeBacks')
            ->has('previewItems')
            ->has('faq')
        );
        $this->get('/entree')->assertOk()->assertInertia(fn (Assert $page) => $page->component('Entree'));
        $this->get('/connexion')->assertOk()->assertInertia(fn (Assert $page) => $page->component('Connexion'));
        $this->get('/credits')->assertOk()->assertInertia(fn (Assert $page) => $page->component('Credits')->has('credits'));

        // Navigation libre sans connexion (marché, fiche produit, formulaire de dépôt, FAQ)
        $this->get('/etudiant/marche')->assertOk()->assertInertia(fn (Assert $page) => $page
            ->component('etudiant/Marche')
            ->has('items')
        );
        $this->get('/etudiant/objets/galaxy-a12')->assertOk()->assertInertia(fn (Assert $page) => $page
            ->component('etudiant/Fiche')
            ->where('item.slug', 'galaxy-a12')
            ->where('balance', 0)
        );
        $this->get('/etudiant/deposer')->assertOk()->assertInertia(fn (Assert $page) => $page
            ->component('etudiant/Deposer')
            ->has('days')
            ->has('times')
        );
        $this->get('/etudiant/questions')->assertOk()->assertInertia(fn (Assert $page) => $page
            ->component('etudiant/Questions')
            ->has('sections')
        );

        // Enregistrement d'un brouillon de dépôt côté serveur (session) par un visiteur non connecté
        $saveDraft = $this->postJson('/etudiant/depots/brouillon', [
            'category' => 'tel',
            'modele' => 'Samsung Galaxy S20',
            'slot' => 1,
        ]);
        $saveDraft->assertOk()->assertJson(['ok' => true]);
        $this->get('/etudiant/deposer')->assertOk()->assertInertia(fn (Assert $page) => $page
            ->component('etudiant/Deposer')
            ->where('hasPending', true)
            ->where('start.modele', 'Samsung Galaxy S20')
        );

        // Connexion obligatoire uniquement lors d'une action nécessitant un compte
        $this->get('/etudiant/prendre/galaxy-a12')->assertRedirect('/connexion?retour=%2Fetudiant%2Fprendre%2Fgalaxy-a12');
        $this->get('/etudiant/depots')->assertRedirect('/connexion?retour=%2Fetudiant%2Fdepots');
        $this->get('/etudiant/solde')->assertRedirect('/connexion?retour=%2Fetudiant%2Fsolde');
        $this->postJson('/etudiant/depots', ['modele' => 'iPhone 11'])->assertStatus(401);

        // Espace Étudiant connecté (10 écrans)
        $moussa = User::query()->where('email', 'moussa.diallo@exemple.sn')->firstOrFail();
        $this->actingAs($moussa);

        $this->get('/etudiant/marche')->assertOk()->assertInertia(fn (Assert $page) => $page
            ->component('etudiant/Marche')
            ->has('items')
            ->where('auth.student.balance', 32490)
        );
        $this->get('/etudiant/objets/galaxy-a12')->assertOk()->assertInertia(fn (Assert $page) => $page
            ->component('etudiant/Fiche')
            ->where('item.slug', 'galaxy-a12')
        );
        $this->get('/etudiant/prendre/galaxy-a12')->assertOk()->assertInertia(fn (Assert $page) => $page
            ->component('etudiant/Prendre')
            ->where('item.slug', 'galaxy-a12')
        );
        $this->get('/etudiant/deposer')->assertOk()->assertInertia(fn (Assert $page) => $page
            ->component('etudiant/Deposer')
            ->has('days')
            ->has('times')
        );
        $this->get('/etudiant/depots')->assertOk()->assertInertia(fn (Assert $page) => $page
            ->component('etudiant/Depots')
            ->has('current')
            ->has('done')
        );
        $this->get('/etudiant/depots/WC-2026-0634/rendez-vous')->assertOk()->assertInertia(fn (Assert $page) => $page
            ->component('etudiant/ChangerRendezVous')
            ->where('deposit.ref', 'WC-2026-0634')
        );
        $this->get('/etudiant/depots/WC-2026-0412/renoncement')->assertOk()->assertInertia(fn (Assert $page) => $page
            ->component('etudiant/Renoncement')
            ->where('context', 'etudiant')
        );
        $this->get('/etudiant/solde')->assertOk()->assertInertia(fn (Assert $page) => $page
            ->component('etudiant/Solde')
            ->where('balance', 32490)
            ->has('movements')
        );
        $this->get('/etudiant/questions')->assertOk()->assertInertia(fn (Assert $page) => $page->component('etudiant/Questions'));
        $this->get('/etudiant/profil')->assertOk()->assertInertia(fn (Assert $page) => $page->component('etudiant/Profil'));

        // Espace Partenaire LBC (9 écrans)
        $agent = User::query()->where('email', 'comptoir1@lbc.exemple.sn')->firstOrFail();
        $this->actingAs($agent);

        $this->get('/partenaire/rendez-vous')->assertOk()->assertInertia(fn (Assert $page) => $page
            ->component('partenaire/RendezVous')
            ->has('days')
            ->where('auth.appointmentsToReceive', 3)
        );
        $this->get('/partenaire/expertise?depot=WC-2026-0634')->assertOk()->assertInertia(fn (Assert $page) => $page
            ->component('partenaire/Expertise')
            ->where('declared.depositRef', 'WC-2026-0634')
            ->has('declared.photos', 1)
        );
        $this->get('/partenaire/depots/WC-2026-0412')->assertOk()->assertInertia(fn (Assert $page) => $page
            ->component('partenaire/Depot')
            ->where('deposit.ref', 'WC-2026-0412')
        );
        $this->get('/partenaire/depots/WC-2026-0412/renoncement')->assertOk()->assertInertia(fn (Assert $page) => $page
            ->component('etudiant/Renoncement')
            ->where('context', 'comptoir')
        );
        $this->assertSame('Yakhya', $agent->prenom);
        $this->assertSame('Wade', $agent->nom);

        $this->get('/partenaire/stock')->assertRedirect('/partenaire/statistiques#catalogue');
        $this->get('/partenaire/stock/nouveau')->assertOk()->assertInertia(fn (Assert $page) => $page->component('partenaire/Article'));

        $annonce = Annonce::query()->where('slug', 'galaxy-a12')->firstOrFail();
        $this->get("/partenaire/stock/{$annonce->id}")->assertOk()->assertInertia(fn (Assert $page) => $page
            ->component('partenaire/Article')
            ->where('article.id', $annonce->id)
        );
        $this->putJson("/partenaire/stock/{$annonce->id}", [
            'name' => '',
            'category' => 'tel',
            'condition' => 'bon',
            'price' => 45000,
        ])->assertStatus(422)->assertJson(['code' => 'nom-manquant']);
        $this->putJson("/partenaire/stock/{$annonce->id}", [
            'name' => 'Galaxy A12 · 64 Go',
            'category' => 'tel',
            'condition' => 'comme-neuf',
            'battery' => 92,
            'info' => 'Chargeur inclus',
            'price' => 48000,
        ])->assertOk()->assertJson(['id' => $annonce->id]);
        $this->get('/partenaire/couverture')->assertOk()->assertInertia(fn (Assert $page) => $page
            ->component('partenaire/Couverture')
            ->where('coverage.pointsInCirculation', 567177)
            ->has('coverage.fundedAccounts')
            ->has('stockBreakdown.studentDepositsCount')
            ->has('stockBreakdown.shopStockCount')
            ->has('activityStats.pointsIssued')
            ->has('activityStats.pointsSpent')
            ->has('margins.0.totalMarginPoints')
        );
        $this->get('/partenaire/statistiques')->assertOk()->assertInertia(fn (Assert $page) => $page
            ->component('partenaire/Statistiques')
            ->where('periode', 'tout')
            ->has('periodOptions')
            ->has('summary.totalDeposits')
            ->has('summary.totalEntered')
            ->has('byCategory', 5)
            ->has('byCondition', 5)
            ->has('paymentMethods', 4)
            ->has('monthly')
            ->has('byUfr')
            ->has('catalog.articles')
            ->has('catalog.counts')
        );
        $this->get('/partenaire/statistiques?periode=mois')->assertOk()->assertInertia(fn (Assert $page) => $page
            ->component('partenaire/Statistiques')
            ->where('periode', 'mois')
            ->has('summary.totalDeposits')
        );
        $this->get('/partenaire/statistiques?periode=personnalisee&du=2026-11-01&au=2026-11-07')->assertOk()->assertInertia(fn (Assert $page) => $page
            ->component('partenaire/Statistiques')
            ->where('periode', 'personnalisee')
            ->where('fromDate', '2026-11-01')
            ->where('toDate', '2026-11-07')
        );

        // Rendez-vous non respectés quand la date du jour avance (ex. 2026-11-18)
        config(['wecce.reference_date' => '2026-11-18']);
        $this->get('/partenaire/rendez-vous')->assertOk()->assertInertia(fn (Assert $page) => $page
            ->component('partenaire/RendezVous')
            ->where('missed.0.missed', true)
        );
        $fatou = User::query()->where('email', 'fatou.diop@exemple.sn')->firstOrFail();
        $this->actingAs($fatou);
        $this->get('/etudiant/solde')->assertOk()->assertInertia(fn (Assert $page) => $page
            ->component('etudiant/Solde')
            ->where('auth.missedDeposits.0.ref', 'WC-2026-0643')
        );
        $this->putJson('/etudiant/depots/WC-2026-0643/rendez-vous', ['day' => 1, 'slot' => 0])->assertOk();
        $this->get('/etudiant/solde')->assertOk()->assertInertia(fn (Assert $page) => $page
            ->component('etudiant/Solde')
            ->has('auth.missedDeposits', 0)
        );
        config(['wecce.reference_date' => '2026-11-07']);
        $this->actingAs($agent);
        $this->get('/partenaire/profil')->assertOk()->assertInertia(fn (Assert $page) => $page->component('partenaire/Profil'));

        // Espace Administration (5 écrans)
        $admin = User::query()->where('email', 'admin@wecce.exemple.sn')->firstOrFail();
        $this->actingAs($admin);

        $this->get('/admin/pilotage')->assertOk()->assertInertia(fn (Assert $page) => $page
            ->component('admin/Pilotage')
            ->has('deposits')
            ->has('bonus')
            ->has('tasks')
        );
        $this->get('/admin/ajustement')->assertOk()->assertInertia(fn (Assert $page) => $page
            ->component('admin/Ajustement')
            ->has('accounts', 11)
        );
        $this->get('/admin/journal')->assertOk()->assertInertia(fn (Assert $page) => $page
            ->component('admin/Journal')
            ->has('entries')
        );
        $this->get('/admin/statistiques')->assertOk()->assertInertia(fn (Assert $page) => $page
            ->component('admin/Statistiques')
            ->has('summary.totalStudents')
            ->has('byCategory', 5)
        );
        $this->get('/admin/profil')->assertOk()->assertInertia(fn (Assert $page) => $page->component('admin/Profil'));
    }

    public function test_full_deposit_expertise_waiver_credit_and_acquisition_debit_cycle(): void
    {
        $fatou = User::query()->where('email', 'fatou.diop@exemple.sn')->firstOrFail();
        $agent = User::query()->where('email', 'comptoir1@lbc.exemple.sn')->firstOrFail();
        $queries = app(WecceQueries::class);
        $free = $queries->firstFree($queries->schedule());

        // 1. Fatou (solde 0) dépose un appareil avec le premier créneau libre
        $this->actingAs($fatou);
        $depositResp = $this->postJson('/etudiant/depots', [
            'category'  => 'tel',
            'modele'    => 'Samsung Galaxy A53 5G',
            'stockage'  => '128 Go',
            'age'       => '1-2',
            'etat'      => 'bon',
            'etatPiece' => 'fonctionnel',
            'photos'    => ['/img/galaxya12.jpg'],
            'souhait'   => 60000,
            'day'       => $free['day'],
            'slot'      => $free['slot'],
        ])->assertOk();

        $ref = $depositResp->json('ref');
        $this->assertNotEmpty($ref);

        // 2. L'agent LBC réalise l'expertise au comptoir
        $this->actingAs($agent);
        $this->postJson('/partenaire/expertises', [
            'depositRef' => $ref,
            'pieces'     => false,
            'condition'  => 'bon',
            'battery'    => 87,
            'serial'     => 'R58T44100ZZ',
            'takeBack'   => 50000,
            'listPrice'  => 68000,
        ])->assertOk();

        // 3. Signature du renoncement : crédite 50 000 + 10 000 (bonus 20 %) = 60 000 pts
        $signResp = $this->postJson("/partenaire/depots/{$ref}/renoncement/signature", [
            'signature' => 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
        ])->assertOk();

        $this->assertSame(60000, $signResp->json('balanceAfter'));

        // 4. Fatou acquiert l'enceinte JBL Go entièrement avec ses points
        $this->actingAs($fatou);
        $jbl = Annonce::query()->where('slug', 'jbl-go')->firstOrFail();
        $jblPrice = (int) $jbl->prix_courant;

        $acqResp = $this->postJson('/etudiant/acquisitions', [
            'itemSlug' => 'jbl-go',
            'method'   => 'especes',
        ])->assertOk();

        $this->assertSame('reserve', $acqResp->json('status'));
        $acqRef = $acqResp->json('acquisitionRef');

        $compteFatou = ComptePoints::query()->where('etudiant_id', $fatou->id)->firstOrFail();
        $this->assertSame(60000 - $jblPrice, (int) $compteFatou->solde);

        // 5. Remise au comptoir par l'agent LBC
        $this->actingAs($agent);
        $this->postJson("/partenaire/acquisitions/{$acqRef}/remise")->assertOk();

        // Contrôle d'intégrité des soldes
        $this->assertSame([], app(WecceQueries::class)->balanceMismatches());
    }

    public function test_monthly_fonte_idempotence_and_admin_adjustment(): void
    {
        $engine = app(WecceEngine::class);

        // Déjà appliquée sur 2026-11 dans le seeder -> idempotente (0 compte retouché)
        $sameMonth = $engine->monthlyFonte('2026-11-15T00:05:00');
        $this->assertSame(0, $sameMonth['accounts']);
        $this->assertSame(0, $sameMonth['articles']);

        // Nouveau mois 2026-12 -> applique 5 % sur les 10 comptes positifs
        $nextMonth = $engine->monthlyFonte('2026-12-01T00:05:00');
        $this->assertSame(10, $nextMonth['accounts']);
        $this->assertGreaterThan(0, $nextMonth['articles']);

        // Ajustement manuel par l'administrateur
        $admin = User::query()->where('email', 'admin@wecce.exemple.sn')->firstOrFail();
        $this->actingAs($admin);

        $adjResp = $this->postJson('/admin/ajustements', [
            'card'      => '2024-1183',
            'direction' => 'credit',
            'amount'    => 1500,
            'reason'    => 'Régularisation test unitaire suite au contrôle contradictoire.',
        ])->assertOk();

        // Solde de Moussa après fonte de décembre (round(32490 * 0.95) = 30866) + 1500 = 32366
        $this->assertSame(32366, $adjResp->json('balanceAfter'));
        $this->assertSame([], app(WecceQueries::class)->balanceMismatches());
    }
}
