<?php

namespace App\Http\Controllers;

use App\Services\WecceQueries;
use Inertia\Inertia;
use Inertia\Response;

class PublicController extends Controller
{
    public function __construct(
        private readonly WecceQueries $queries
    ) {}

    public function entree(): Response
    {
        return Inertia::render('Entree');
    }

    public function connexion(): Response
    {
        return Inertia::render('Connexion');
    }

    public function accueil(): Response
    {
        return Inertia::render('Accueil', $this->queries->homePage());
    }

    public function credits(): Response
    {
        return Inertia::render('Credits', [
            'credits' => $this->queries->creditsList(),
        ]);
    }
}
