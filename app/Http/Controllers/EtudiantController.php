<?php

namespace App\Http\Controllers;

use App\Exceptions\RuleViolationException;
use App\Services\WecceEngine;
use App\Services\WecceQueries;
use App\Support\WecceClock;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class EtudiantController extends Controller
{
    public function __construct(
        private readonly WecceEngine $engine,
        private readonly WecceQueries $queries,
    ) {}

    private function studentId(Request $request): ?string
    {
        $user = $request->user();

        return ($user && $user->role === 'ETUDIANT') ? $user->id : null;
    }

    public function marche(Request $request): Response
    {
        $uid = $this->studentId($request);
        $suspension = $this->queries->depositsSuspension();

        return Inertia::render('etudiant/Marche', [
            'items' => $this->queries->marketItems($uid),
            'depositsSuspended' => $suspension['suspended'],
            'nextFonte' => $this->queries->nextFonte(),
        ]);
    }

    public function fiche(Request $request, string $slug): Response
    {
        $uid = $this->studentId($request);
        $page = $this->queries->itemPage($slug, $uid);
        if (!$page) {
            return Inertia::render('NotFound');
        }

        $balance = 0;
        if ($uid !== null) {
            $student = $this->queries->studentEntity($uid);
            $balance = $student['balance'];
        }

        return Inertia::render('etudiant/Fiche', array_merge($page['details'], [
            'balance' => $balance,
            'reservedByOther' => $page['reservedByOther'],
            'reservedByMe' => $page['reservedByMe'],
            'nextFonte' => $this->queries->nextFonte(),
        ]));
    }

    public function prendre(Request $request, string $slug): Response
    {
        $uid = $request->user()->id;
        $acquisition = $this->queries->acquisitionOf($uid, $slug);
        $page = $this->queries->itemPage($slug, $uid, $acquisition !== null);
        if (!$page) {
            return Inertia::render('NotFound');
        }

        $student = $this->queries->studentEntity($uid);
        // Une acquisition en cours sur CET objet ne doit pas se bloquer elle-même.
        $held = $acquisition && in_array($acquisition['status'], ['en-attente', 'a-valider'], true)
            ? max(0, $student['heldPoints'] - $acquisition['points'])
            : $student['heldPoints'];

        return Inertia::render('etudiant/Prendre', [
            'item' => $page['details']['item'],
            'title' => $page['details']['title'],
            'balance' => max(0, $student['balance'] - $held),
            'heldPoints' => $held,
            'acquisition' => $acquisition,
            'refusal' => $acquisition ? null : $this->queries->lastRefusedAcquisition($uid, $slug),
            'unavailable' => $page['reservedByOther'],
        ]);
    }

    public function deposer(Request $request): Response
    {
        $uid = $this->studentId($request);
        $suspension = $this->queries->depositsSuspension();
        $s = $this->queries->schedule();
        $draftRef = $request->query('brouillon');
        $draft = ($uid !== null && is_string($draftRef) && $draftRef !== '') ? $this->queries->draftOf($uid, $draftRef) : null;

        $pending = $request->session()->get('pending_deposit');
        $hasPending = false;
        if (is_array($pending) && !empty($pending['modele'])) {
            $draft = array_merge($draft ?? [], $pending);
            $hasPending = true;
        }

        return Inertia::render('etudiant/Deposer', [
            'depositsSuspended' => $suspension['suspended'],
            'suspensionReason' => $suspension['reason'],
            'bonus' => $this->queries->bonusOffer($request->user()?->role === 'ETUDIANT' ? $request->user()->id : null),
            'days' => $s['days'],
            'times' => $s['times'],
            'start' => array_merge($draft ?? [], $this->queries->firstFree($s)),
            'hasPending' => $hasPending,
        ]);
    }

    public function saveDraft(Request $request): JsonResponse
    {
        $category = (string) $request->input('category', 'tel');
        $modele = trim((string) $request->input('modele', ''));
        $day = (int) $request->input('day', 0);
        $slotInput = $request->input('slot');
        $slot = ($slotInput === null || $slotInput === '') ? null : (int) $slotInput;
        $draftRef = $request->input('draftRef');

        $draftData = [
            'category' => $category,
            'modele' => $modele,
            'stockage' => (string) $request->input('stockage', ''),
            'age' => (string) $request->input('age', '1-2'),
            'etat' => (string) $request->input('etat', 'bon'),
            'etatPiece' => (string) $request->input('etatPiece', 'fonctionnel'),
            'souhait' => $request->input('souhait'),
            'day' => $day,
            'slot' => $slot,
            'draftRef' => is_string($draftRef) ? $draftRef : null,
        ];

        $request->session()->put('pending_deposit', $draftData);

        $uid = $this->studentId($request);
        if (!$uid) {
            return response()->json([
                'ok' => true,
                'redirect' => '/connexion?retour=' . rawurlencode('/etudiant/deposer'),
            ]);
        }

        return response()->json([
            'ok' => true,
            'redirect' => null,
            'draftRef' => $draftData['draftRef'],
        ]);
    }

    public function depots(Request $request): Response
    {
        return Inertia::render('etudiant/Depots', $this->queries->studentDeposits($request->user()->id));
    }

    public function changerRendezVous(Request $request, string $ref): Response|RedirectResponse
    {
        $page = $this->queries->reschedulePage($request->user()->id, $ref);
        if (!$page) {
            return redirect('/etudiant/depots');
        }

        return Inertia::render('etudiant/ChangerRendezVous', $page);
    }

    public function renoncement(Request $request, string $ref): Response
    {
        $uid = $request->user()->id;
        $state = $this->queries->depositState($ref);
        $waiver = $this->queries->waiverOf($ref);

        if (!$state || $state['userId'] !== $uid || $state['status'] !== 'repris' || !$waiver) {
            return Inertia::render('NotFound');
        }

        return Inertia::render('etudiant/Renoncement', [
            'waiver' => $waiver,
            'context' => 'etudiant',
        ]);
    }

    public function solde(Request $request): Response
    {
        $uid = $request->user()->id;

        return Inertia::render('etudiant/Solde', array_merge(
            $this->queries->balancePage($uid),
            ['nextFonte' => $this->queries->nextFonte()]
        ));
    }

    public function questions(): Response
    {
        return Inertia::render('etudiant/Questions', [
            'sections' => $this->queries->faqData()['sections'],
        ]);
    }

    public function profil(): Response
    {
        return Inertia::render('etudiant/Profil');
    }

    public function submitDeposit(Request $request): JsonResponse
    {
        if ($this->engine->depositsSuspended()) {
            throw new RuleViolationException('depots-suspendus', 'Les dépôts sont suspendus pour le moment.');
        }

        $category = (string) $request->input('category', 'tel');
        $modele = trim((string) $request->input('modele', ''));
        if ($modele === '') {
            throw new RuleViolationException('modele-manquant', 'Indiquez la marque et le modèle.');
        }

        $day = (int) $request->input('day', 0);
        $slotInput = $request->input('slot');
        $draftRef = $request->input('draftRef');

        $slotIso = ($slotInput === null || $slotInput === '')
            ? null
            : $this->queries->slotFrom($day, (int) $slotInput, is_string($draftRef) ? $draftRef : null);

        $photos = [];
        $rawPhotos = $request->input('photos', []);
        if (is_array($rawPhotos)) {
            foreach ($rawPhotos as $p) {
                if (is_string($p) && $p !== '') {
                    $photos[] = $p;
                }
            }
        }
        if ($request->hasFile('photos')) {
            foreach ($request->file('photos') as $file) {
                if ($file && $file->isValid()) {
                    $path = $file->store('depots', 'public');
                    $photos[] = '/storage/' . $path;
                }
            }
        }

        $etat = $category === 'piece'
            ? (string) $request->input('etatPiece', 'fonctionnel')
            : (string) $request->input('etat', 'bon');

        $souhaitRaw = $request->input('souhait');
        $souhait = ($souhaitRaw !== null && $souhaitRaw !== '') ? (int) $souhaitRaw : null;

        $ref = $this->engine->createDeposit(
            $request->user()->id,
            [
                'category' => $category,
                'modele' => $modele,
                'stockage' => (string) $request->input('stockage', ''),
                'age' => (string) $request->input('age', '1-2'),
                'etat' => $etat,
                'photos' => $photos,
                'wish' => $souhait,
                'slot' => $slotIso,
                'draftRef' => is_string($draftRef) ? $draftRef : null,
            ],
            WecceClock::now()
        );

        $request->session()->forget('pending_deposit');

        return response()->json(['ref' => $ref]);
    }

    public function cancelDeposit(Request $request, string $ref): JsonResponse
    {
        $this->engine->cancelDeposit($request->user()->id, $ref, WecceClock::now());
        return response()->json(['ok' => true]);
    }

    public function rescheduleDeposit(Request $request, string $ref): JsonResponse
    {
        $day = (int) $request->input('day', 0);
        $slot = (int) $request->input('slot', 0);
        $slotIso = $this->queries->slotFrom($day, $slot, $ref);

        $this->engine->reschedule($request->user()->id, $ref, $slotIso);
        return response()->json(['ok' => true]);
    }

    public function acquireItem(Request $request): JsonResponse
    {
        $slug = (string) $request->input('itemSlug', '');
        $method = (string) $request->input('method', 'especes');
        $phone = $request->input('phone');

        $article = \App\Models\Annonce::query()->where('slug', $slug)->first();
        if (!$article) {
            throw new RuleViolationException('article-inconnu', 'Objet introuvable.');
        }

        $res = $this->engine->acquire(
            $request->user()->id,
            $article->id,
            $method,
            WecceClock::now(),
            is_string($phone) ? $phone : null
        );

        $q = $res['acquisition'];
        $p = $res['paiement'];

        if ($q->statut === 'EN_ATTENTE') {
            return response()->json([
                'status' => 'en-attente',
                'acquisitionRef' => $q->reference,
                'paymentRef' => $p?->reference ?? $q->reference,
                'sentAt' => WecceClock::stamp($q->cree_le),
            ]);
        }

        return response()->json([
            'status' => 'a-valider',
            'acquisitionRef' => $q->reference,
        ]);
    }

    public function paymentStatus(string $paymentRef): JsonResponse
    {
        $q = $this->engine->confirmPayment($paymentRef, WecceClock::now());

        return response()->json([
            'status' => $q->statut === 'ANNULE' ? 'echoue' : 'confirme',
        ]);
    }

    public function cancelAcquisition(string $ref): JsonResponse
    {
        $this->engine->cancelPayment($ref);
        return response()->json(['ok' => true]);
    }
}
