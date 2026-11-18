<?php

use App\Http\Controllers\AdminController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\EtudiantController;
use App\Http\Controllers\PartenaireController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\PublicController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

/*
|--------------------------------------------------------------------------
| Pages publiques & invité (4 écrans)
|--------------------------------------------------------------------------
*/
Route::get('/', [PublicController::class, 'accueil'])->name('accueil');
Route::get('/entree', [PublicController::class, 'entree'])->name('entree');
Route::get('/credits', [PublicController::class, 'credits'])->name('credits');

Route::middleware('wecce.guest')->group(function () {
    Route::get('/connexion', [PublicController::class, 'connexion'])->name('connexion');
});

/*
|--------------------------------------------------------------------------
| Actions d'authentification & profil partagé (6 actions)
|--------------------------------------------------------------------------
*/
Route::post('/connexion', [AuthController::class, 'login'])->name('auth.login');
Route::post('/inscription', [AuthController::class, 'register'])->name('auth.register');
Route::post('/mot-de-passe/oubli', [AuthController::class, 'forgotPassword'])->name('auth.forgot');
Route::post('/deconnexion', [AuthController::class, 'logout'])->name('auth.logout');

Route::middleware('role')->group(function () {
    Route::put('/profil/coordonnees', [ProfileController::class, 'updateContact'])->name('profil.contact');
    Route::put('/profil/mot-de-passe', [ProfileController::class, 'changePassword'])->name('profil.password');
});

/*
|--------------------------------------------------------------------------
| Espace Étudiant (10 écrans + 6 actions)
| Navigation libre sur le marché, les fiches, le formulaire de dépôt et l'aide ;
| connexion obligatoire pour les actions engageantes et l'espace personnel.
|--------------------------------------------------------------------------
*/
Route::prefix('etudiant')->group(function () {
    // Pages et actions consultables sans connexion
    Route::get('/marche', [EtudiantController::class, 'marche'])->name('etudiant.marche');
    Route::get('/objets/{slug}', [EtudiantController::class, 'fiche'])->name('etudiant.fiche');
    Route::get('/deposer', [EtudiantController::class, 'deposer'])->name('etudiant.deposer');
    Route::post('/depots/brouillon', [EtudiantController::class, 'saveDraft'])->name('etudiant.depots.draft');
    Route::get('/questions', [EtudiantController::class, 'questions'])->name('etudiant.questions');

    // Pages et actions nécessitant un compte étudiant
    Route::middleware('role:ETUDIANT')->group(function () {
        Route::get('/prendre/{slug}', [EtudiantController::class, 'prendre'])->name('etudiant.prendre');
        Route::get('/depots', [EtudiantController::class, 'depots'])->name('etudiant.depots');
        Route::get('/depots/{ref}/rendez-vous', [EtudiantController::class, 'changerRendezVous'])->name('etudiant.depots.rdv');
        Route::get('/depots/{ref}/renoncement', [EtudiantController::class, 'renoncement'])->name('etudiant.depots.renoncement');
        Route::get('/solde', [EtudiantController::class, 'solde'])->name('etudiant.solde');
        Route::get('/profil', [EtudiantController::class, 'profil'])->name('etudiant.profil');

        // Actions (POST / PUT / DELETE)
        Route::post('/depots', [EtudiantController::class, 'submitDeposit'])->name('etudiant.depots.submit');
        Route::delete('/depots/{ref}', [EtudiantController::class, 'cancelDeposit'])->name('etudiant.depots.cancel');
        Route::put('/depots/{ref}/rendez-vous', [EtudiantController::class, 'rescheduleDeposit'])->name('etudiant.depots.reschedule');
        Route::post('/acquisitions', [EtudiantController::class, 'acquireItem'])->name('etudiant.acquisitions.store');
        Route::get('/paiements/{paymentRef}/statut', [EtudiantController::class, 'paymentStatus'])->name('etudiant.paiements.status');
        Route::delete('/acquisitions/{ref}', [EtudiantController::class, 'cancelAcquisition'])->name('etudiant.acquisitions.cancel');
    });
});

/*
|--------------------------------------------------------------------------
| Espace Boutique partenaire LBC (9 écrans + 9 actions)
|--------------------------------------------------------------------------
*/
Route::middleware('role:AGENT')->prefix('partenaire')->group(function () {
    // Pages (GET)
    Route::get('/rendez-vous', [PartenaireController::class, 'rendezVous'])->name('partenaire.rdv');
    Route::get('/expertise', [PartenaireController::class, 'expertise'])->name('partenaire.expertise');
    Route::get('/depots/{ref}', [PartenaireController::class, 'depot'])->name('partenaire.depot');
    Route::get('/depots/{ref}/renoncement', [PartenaireController::class, 'renoncement'])->name('partenaire.depot.renoncement');
    Route::get('/stock', [PartenaireController::class, 'stock'])->name('partenaire.stock');
    Route::get('/stock/nouveau', [PartenaireController::class, 'nouvelArticle'])->name('partenaire.stock.nouveau');
    Route::get('/stock/{id}', [PartenaireController::class, 'editerArticle'])->name('partenaire.stock.editer');
    Route::get('/couverture', [PartenaireController::class, 'couverture'])->name('partenaire.couverture');
    Route::get('/statistiques', [PartenaireController::class, 'statistiques'])->name('partenaire.statistiques');
    Route::get('/profil', [PartenaireController::class, 'profil'])->name('partenaire.profil');

    // Actions (POST / PUT / DELETE)
    Route::post('/expertises', [PartenaireController::class, 'submitExpertise'])->name('partenaire.expertises.store');
    Route::post('/depots/{ref}/refus', [PartenaireController::class, 'refuseDeposit'])->name('partenaire.depots.refus');
    Route::post('/depots/{ref}/renoncement/signature', [PartenaireController::class, 'signWaiver'])->name('partenaire.renoncement.sign');
    Route::post('/depots/{ref}/renoncement/refus', [PartenaireController::class, 'declineWaiver'])->name('partenaire.renoncement.decline');
    Route::post('/stock/{id}/publication', [PartenaireController::class, 'publishArticle'])->name('partenaire.stock.publish');
    Route::post('/acquisitions/{ref}/validation', [PartenaireController::class, 'validateAcquisition'])->name('partenaire.acquisitions.validation');
    Route::post('/acquisitions/{ref}/refus', [PartenaireController::class, 'refuseAcquisition'])->name('partenaire.acquisitions.refus');
    Route::post('/acquisitions/{ref}/remise', [PartenaireController::class, 'handOver'])->name('partenaire.acquisitions.remise');
    Route::post('/stock', [PartenaireController::class, 'saveArticle'])->name('partenaire.stock.store');
    Route::put('/stock/{id}', [PartenaireController::class, 'saveArticle'])->name('partenaire.stock.update');
    Route::delete('/stock/{id}', [PartenaireController::class, 'withdrawArticle'])->name('partenaire.stock.withdraw');
});

/*
|--------------------------------------------------------------------------
| Espace Administration Wecce (4 écrans + 3 actions)
|--------------------------------------------------------------------------
*/
Route::middleware('role:ADMIN')->prefix('admin')->group(function () {
    // Pages (GET)
    Route::get('/pilotage', [AdminController::class, 'pilotage'])->name('admin.pilotage');
    Route::get('/ajustement', [AdminController::class, 'ajustement'])->name('admin.ajustement');
    Route::get('/journal', [AdminController::class, 'journal'])->name('admin.journal');
    Route::get('/statistiques', [AdminController::class, 'statistiques'])->name('admin.statistiques');
    Route::get('/profil', [AdminController::class, 'profil'])->name('admin.profil');

    // Actions (PUT / POST)
    Route::put('/pilotage/depots', [AdminController::class, 'setDepositsSuspended'])->name('admin.pilotage.depots');
    Route::put('/pilotage/bonus', [AdminController::class, 'saveBonus'])->name('admin.pilotage.bonus');
    Route::post('/ajustements', [AdminController::class, 'adjustPoints'])->name('admin.ajustements.store');
});

/*
|--------------------------------------------------------------------------
| Fallback 404 Inertia
|--------------------------------------------------------------------------
*/
Route::fallback(function () {
    return Inertia::render('NotFound')->toResponse(request())->setStatusCode(404);
});
