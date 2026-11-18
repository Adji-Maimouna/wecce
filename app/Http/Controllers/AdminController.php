<?php

namespace App\Http\Controllers;

use App\Services\WecceEngine;
use App\Services\WecceQueries;
use App\Support\WecceClock;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AdminController extends Controller
{
    public function __construct(
        private readonly WecceEngine $engine,
        private readonly WecceQueries $queries,
    ) {}

    public function pilotage(): Response
    {
        $mismatches = $this->queries->balanceMismatches();

        return Inertia::render('admin/Pilotage', [
            'deposits' => $this->queries->depositsState(),
            'bonus' => $this->queries->launchBonus(),
            'tasks' => $this->queries->scheduledTasks(),
            'mismatch' => $mismatches[0] ?? null,
        ]);
    }

    public function ajustement(): Response
    {
        return Inertia::render('admin/Ajustement', [
            'accounts' => $this->queries->accountSummaries(),
        ]);
    }

    public function journal(): Response
    {
        return Inertia::render('admin/Journal', [
            'entries' => $this->queries->adminLog(),
        ]);
    }

    public function statistiques(Request $request): Response
    {
        return Inertia::render('admin/Statistiques', $this->queries->statisticsPage(
            $request->query('periode', 'tout'),
            includeCatalog: false,
            fromDate: $request->query('du'),
            toDate: $request->query('au'),
        ));
    }

    public function profil(): Response
    {
        return Inertia::render('admin/Profil');
    }

    public function setDepositsSuspended(Request $request): JsonResponse
    {
        $this->engine->setSuspended(
            (bool) $request->input('suspended', false),
            (string) $request->input('reason', ''),
            WecceClock::now(),
            $request->user(),
            $request->ip()
        );

        return response()->json(['ok' => true]);
    }

    public function saveBonus(Request $request): JsonResponse
    {
        $this->engine->saveBonus(
            (int) $request->input('rate', 0),
            (int) $request->input('quota', 100),
            (string) $request->input('reason', ''),
            WecceClock::now(),
            $request->user(),
            $request->ip()
        );

        return response()->json(['ok' => true]);
    }

    public function adjustPoints(Request $request): JsonResponse
    {
        $balanceAfter = $this->engine->adjust(
            (string) $request->input('card', ''),
            (string) $request->input('direction', 'credit'),
            (int) $request->input('amount', 0),
            (string) $request->input('reason', ''),
            $request->user(),
            WecceClock::now(),
            $request->ip()
        );

        return response()->json([
            'balanceAfter' => $balanceAfter,
        ]);
    }
}
