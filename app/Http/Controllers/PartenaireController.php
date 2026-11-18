<?php

namespace App\Http\Controllers;

use App\Services\WecceEngine;
use App\Services\WecceQueries;
use App\Support\WecceClock;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PartenaireController extends Controller
{
    public function __construct(
        private readonly WecceEngine $engine,
        private readonly WecceQueries $queries,
    ) {}

    public function rendezVous(Request $request): Response
    {
        $suspension = $this->queries->depositsSuspension();

        return Inertia::render('partenaire/RendezVous', array_merge(
            $this->queries->rendezVousPage($request->query('date')),
            ['depositsSuspended' => $suspension['suspended']],
        ));
    }

    public function scheduleAppointment(Request $request, string $ref): JsonResponse
    {
        $slot = $this->engine->scheduleAppointment(
            $request->user()->id,
            $ref,
            (string) $request->input('date', ''),
            (string) $request->input('time', ''),
            WecceClock::now()
        );

        return response()->json([
            'ok' => true,
            'label' => WecceClock::capitalize(WecceClock::weekdayDayMonth($slot)) . ' à ' . WecceClock::time($slot),
        ]);
    }

    public function expertise(Request $request): Response|RedirectResponse
    {
        $ref = strtoupper(trim((string) $request->query('depot', '')));
        $state = $ref !== '' ? $this->queries->depositState($ref) : null;

        if ($state && $state['status'] === 'a-signer') {
            return redirect("/partenaire/depots/{$ref}/renoncement");
        }
        if ($state && in_array($state['status'], ['repris', 'refuse'], true)) {
            return redirect("/partenaire/depots/{$ref}");
        }

        $declared = ($state && in_array($state['status'], ['rendez-vous', 'demande-rdv'], true)) ? $this->queries->declaredDevice($ref) : null;

        $props = [
            'declared' => $declared,
            'bonus' => $declared ? $this->queries->expertiseBonus($ref) : null,
            'controls' => $declared ? $this->queries->expertiseControls($declared['category']) : [],
            'queue' => $this->queries->expertiseQueue(),
            'missedQueue' => $this->queries->missedAppointments(),
        ];
        if ($ref !== '' && !$declared) {
            $props['missingRef'] = $ref;
        }

        return Inertia::render('partenaire/Expertise', $props);
    }

    public function depot(string $ref): Response|RedirectResponse
    {
        $deposit = $this->queries->processedDeposit($ref);
        if ($deposit) {
            return Inertia::render('partenaire/Depot', [
                'deposit' => $deposit,
            ]);
        }

        $state = $this->queries->depositState($ref);
        if ($state && $state['status'] === 'a-signer') {
            return redirect("/partenaire/depots/{$ref}/renoncement");
        }

        return Inertia::render('NotFound');
    }

    public function renoncement(string $ref): Response
    {
        $waiver = $this->queries->waiverOf($ref);
        if (!$waiver) {
            return Inertia::render('NotFound');
        }

        return Inertia::render('etudiant/Renoncement', [
            'waiver' => $waiver,
            'context' => 'comptoir',
        ]);
    }

    public function stock(): RedirectResponse
    {
        return redirect('/partenaire/statistiques#catalogue');
    }

    public function nouvelArticle(): Response
    {
        return Inertia::render('partenaire/Article');
    }

    public function editerArticle(string $id): Response
    {
        $article = $this->queries->stockArticle($id);
        if (!$article) {
            return Inertia::render('NotFound');
        }

        return Inertia::render('partenaire/Article', [
            'article' => $article,
        ]);
    }

    public function couverture(): Response
    {
        return Inertia::render('partenaire/Couverture', $this->queries->coveragePage());
    }

    public function statistiques(Request $request): Response
    {
        return Inertia::render('partenaire/Statistiques', $this->queries->statisticsPage(
            $request->query('periode', 'tout'),
            includeCatalog: true,
            fromDate: $request->query('du'),
            toDate: $request->query('au'),
        ));
    }

    public function profil(): Response
    {
        return Inertia::render('partenaire/Profil');
    }

    public function submitExpertise(Request $request): JsonResponse
    {
        $ref = (string) $request->input('depositRef', '');
        $battery = $request->input('battery');

        $this->engine->recordExpertise(
            $request->user()->id,
            $ref,
            [
                'pieces' => (bool) $request->input('pieces', false),
                'condition' => (string) $request->input('condition', 'bon'),
                'battery' => ($battery !== null && $battery !== '' && (int) $battery > 0) ? (int) $battery : null,
                'serial' => (string) $request->input('serial', ''),
                'takeBack' => (int) $request->input('takeBack', 0),
                'listPrice' => (int) $request->input('listPrice', 0),
            ],
            WecceClock::now()
        );

        return response()->json(['ok' => true]);
    }

    public function refuseDeposit(Request $request, string $ref): JsonResponse
    {
        $this->engine->refuse(
            $request->user()->id,
            $ref,
            (string) $request->input('reason', 'modele'),
            (string) $request->input('comment', ''),
            WecceClock::now()
        );

        return response()->json(['ok' => true]);
    }

    public function signWaiver(Request $request, string $ref): JsonResponse
    {
        $signature = (string) $request->input('signature', '');
        $res = $this->engine->sign($ref, WecceClock::now(), $signature);

        return response()->json([
            'balanceAfter' => $res['balanceAfter'],
        ]);
    }

    public function declineWaiver(string $ref): JsonResponse
    {
        $this->engine->declineAtCounter($ref, WecceClock::now());
        return response()->json(['ok' => true]);
    }

    public function publishArticle(string $id): JsonResponse
    {
        $this->engine->publish($id, WecceClock::now());
        return response()->json(['ok' => true]);
    }

    public function validateAcquisition(Request $request, string $ref): JsonResponse
    {
        $q = $this->engine->validateAcquisition($request->user()->id, $ref, WecceClock::now());

        return response()->json(['ok' => true, 'points' => (int) $q->points_debites, 'complement' => (int) $q->complement_du]);
    }

    public function refuseAcquisition(Request $request, string $ref): JsonResponse
    {
        $res = $this->engine->refuseAcquisition(
            $request->user()->id,
            $ref,
            (string) $request->input('reason', ''),
            WecceClock::now()
        );

        return response()->json(['ok' => true, 'refundFcfa' => $res['refundFcfa']]);
    }

    public function handOver(Request $request, string $ref): JsonResponse
    {
        $this->engine->handOver($ref, WecceClock::now(), $request->user()->id);
        return response()->json(['ok' => true]);
    }

    public function saveArticle(Request $request, ?string $id = null): JsonResponse
    {
        $payload = [
            'id' => $id ?: $request->input('id'),
            'name' => (string) $request->input('name', ''),
            'category' => (string) $request->input('category', 'tel'),
            'condition' => (string) $request->input('condition', 'bon'),
            'battery' => $request->input('battery') !== null && $request->input('battery') !== '' ? (int) $request->input('battery') : null,
            'info' => $request->input('info'),
            'price' => (int) $request->input('price', 0),
        ];

        if ($request->exists('photo')) {
            $payload['photo'] = $request->input('photo');
        }

        $articleId = $this->engine->saveArticle($payload, WecceClock::now());

        return response()->json(['id' => $articleId]);
    }

    public function withdrawArticle(Request $request, string $id): JsonResponse
    {
        $this->engine->withdraw(
            $id,
            (string) $request->input('reason', ''),
            WecceClock::now(),
            $request->user(),
            $request->ip()
        );

        return response()->json(['ok' => true]);
    }
}
