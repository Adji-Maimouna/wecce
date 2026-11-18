<?php

namespace App\Http\Controllers;

use App\Exceptions\RuleViolationException;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class ProfileController extends Controller
{
    public function updateContact(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();
        $email = mb_strtolower(trim((string) $request->input('email', '')), 'UTF-8');
        $telephone = trim((string) $request->input('telephone', ''));

        if ($email === '' || !str_contains($email, '@')) {
            throw new RuleViolationException('email-invalide', 'Indiquez une adresse e-mail valide.');
        }

        $exists = User::query()
            ->where('id', '<>', $user->id)
            ->whereRaw('LOWER(email) = ?', [$email])
            ->exists();

        if ($exists) {
            throw new RuleViolationException('email-invalide', 'Cette adresse e-mail est déjà utilisée par un autre compte.');
        }

        $user->update([
            'email' => $email,
            'telephone' => $telephone,
        ]);

        if ($user->role === 'ETUDIANT' && $user->etudiant) {
            $user->etudiant->update([
                'niveau' => $request->input('niveau'),
                'ufr' => $request->input('ufr'),
            ]);
        }

        return response()->json(['ok' => true]);
    }

    public function changePassword(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();
        $current = (string) $request->input('current', '');
        $next = (string) $request->input('next', '');

        if (mb_strlen($next, 'UTF-8') < 8) {
            throw new RuleViolationException('mot-de-passe-court', 'Choisissez un mot de passe de 8 caractères au moins.');
        }

        if (!Hash::check($current, $user->mot_de_passe_hash)) {
            return response()->json(['ok' => false]);
        }

        $user->update([
            'mot_de_passe_hash' => Hash::make($next),
        ]);

        return response()->json(['ok' => true]);
    }
}
