<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureWecceRole
{
    public const HOME_BY_ROLE = [
        'ETUDIANT' => '/etudiant/solde',
        'AGENT' => '/partenaire/tableau-de-bord',
        'ADMIN' => '/admin/pilotage',
    ];

    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $user = $request->user();

        if (!$user) {
            if ($request->expectsJson() && !$request->header('X-Inertia')) {
                return response()->json([
                    'code' => 'non-connecte',
                    'message' => 'Votre session a expiré. Reconnectez-vous.',
                ], 401);
            }

            $retour = $request->getRequestUri();
            return redirect('/connexion?retour=' . rawurlencode($retour));
        }

        if (count($roles) > 0 && !in_array($user->role, $roles, true)) {
            if ($request->expectsJson() && !$request->header('X-Inertia')) {
                return response()->json([
                    'code' => 'acces-refuse',
                    'message' => "Cette action n'est pas permise pour votre compte.",
                ], 403);
            }

            return redirect(self::HOME_BY_ROLE[$user->role] ?? '/');
        }

        return $next($request);
    }
}
