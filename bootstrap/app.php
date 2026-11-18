<?php

use App\Exceptions\RuleViolationException;
use App\Http\Middleware\EnsureWecceRole;
use App\Http\Middleware\HandleInertiaRequests;
use App\Http\Middleware\RedirectIfWecceAuthenticated;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->trustProxies(at: '*');

        $middleware->web(append: [
            HandleInertiaRequests::class,
        ]);

        $middleware->alias([
            'role' => EnsureWecceRole::class,
            'wecce.guest' => RedirectIfWecceAuthenticated::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->render(function (RuleViolationException $e, Request $request) {
            if ($request->expectsJson() && !$request->header('X-Inertia')) {
                $errors = !empty($e->fieldErrors)
                    ? array_map(fn ($msg) => is_array($msg) ? $msg : [$msg], $e->fieldErrors)
                    : [$e->violationCode => [$e->getMessage()]];

                return response()->json([
                    'code' => $e->violationCode,
                    'message' => $e->getMessage(),
                    'errors' => $errors,
                ], 422);
            }

            return back()->withErrors([
                'code' => $e->violationCode,
                'message' => $e->getMessage(),
            ]);
        });
    })->create();
