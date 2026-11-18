<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class RedirectIfWecceAuthenticated
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();
        if ($user && $request->isMethod('GET')) {
            return redirect(EnsureWecceRole::HOME_BY_ROLE[$user->role] ?? '/');
        }

        return $next($request);
    }
}
