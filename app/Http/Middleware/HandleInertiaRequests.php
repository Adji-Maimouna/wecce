<?php

namespace App\Http\Middleware;

use App\Services\WecceQueries;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    protected $rootView = 'app';

    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    public function share(Request $request): array
    {
        /** @var WecceQueries $queries */
        $queries = app(WecceQueries::class);
        $session = $queries->sessionFor($request->user());

        return [
            ...parent::share($request),
            'auth' => empty($session) ? (object) [] : $session,
        ];
    }
}
