<?php

namespace App\Http\Controllers;

use App\Exceptions\RuleViolationException;
use App\Models\Campus;
use App\Models\ComptePoints;
use App\Models\Etudiant;
use App\Models\User;
use App\Support\WecceClock;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    public function login(Request $request): JsonResponse
    {
        $identifiant = trim((string) $request->input('identifiant', $request->input('identifier', '')));
        $motDePasse = (string) $request->input('motDePasse', $request->input('password', ''));
        $rester = (bool) $request->input('rester', $request->input('remember', false));

        $idLower = mb_strtolower($identifiant, 'UTF-8');
        $digits = $this->normalizePhoneDigits($identifiant);

        $user = User::query()
            ->get()
            ->first(function (User $u) use ($idLower, $digits) {
                if (mb_strtolower($u->email, 'UTF-8') === $idLower) {
                    return true;
                }
                $uDigits = $this->normalizePhoneDigits($u->telephone);
                return strlen($digits) >= 8 && $uDigits === $digits;
            });

        if (!$user || !$user->actif || !Hash::check($motDePasse, $user->mot_de_passe_hash)) {
            return response()->json([
                'ok' => false,
                'reason' => 'identifiants-invalides',
            ]);
        }

        Auth::login($user, $rester);
        $request->session()->regenerate();

        return response()->json([
            'ok' => true,
            'role' => $user->role,
        ]);
    }

    public function logout(Request $request): JsonResponse|RedirectResponse
    {
        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        if ($request->expectsJson() && !$request->header('X-Inertia')) {
            return response()->json(['ok' => true]);
        }

        return redirect('/');
    }

    public function forgotPassword(Request $request): JsonResponse
    {
        return response()->json(['ok' => true]);
    }

    public function register(Request $request): JsonResponse
    {
        $prenom = trim((string) $request->input('prenom', ''));
        $nom = trim((string) $request->input('nom', ''));
        $numeroCarte = trim((string) $request->input('numeroCarte', ''));
        $telephone = trim((string) $request->input('telephone', ''));
        $email = mb_strtolower(trim((string) $request->input('email', '')), 'UTF-8');
        $niveau = $request->input('niveau');
        $ufr = $request->input('ufr');
        $motDePasse = (string) $request->input('motDePasse', '');

        $fieldErrors = [];

        if ($prenom === '') {
            $fieldErrors['prenom'] = 'Indiquez votre prénom.';
        } elseif (mb_strlen($prenom, 'UTF-8') > 80) {
            $fieldErrors['prenom'] = 'Le prénom ne peut pas dépasser 80 caractères.';
        }

        if ($nom === '') {
            $fieldErrors['nom'] = 'Indiquez votre nom.';
        } elseif (mb_strlen($nom, 'UTF-8') > 80) {
            $fieldErrors['nom'] = 'Le nom ne peut pas dépasser 80 caractères.';
        }

        if ($numeroCarte === '') {
            $fieldErrors['numeroCarte'] = 'Indiquez le numéro de votre carte.';
        } elseif (mb_strlen($numeroCarte, 'UTF-8') > 16) {
            $fieldErrors['numeroCarte'] = 'Le numéro de carte ne peut pas dépasser 16 caractères.';
        }

        $telDigits = $this->normalizePhoneDigits($telephone);
        if ($telephone === '') {
            $fieldErrors['telephone'] = 'Indiquez votre numéro de téléphone.';
        } elseif (strlen($telDigits) < 8) {
            $fieldErrors['telephone'] = 'Indiquez un numéro de téléphone valide (8 chiffres au moins).';
        } elseif (mb_strlen($telephone, 'UTF-8') > 20) {
            $fieldErrors['telephone'] = 'Le numéro de téléphone ne peut pas dépasser 20 caractères.';
        }

        if ($email === '') {
            $fieldErrors['email'] = 'Indiquez votre e-mail.';
        } elseif (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            $fieldErrors['email'] = 'Indiquez une adresse e-mail valide.';
        } elseif (mb_strlen($email, 'UTF-8') > 160) {
            $fieldErrors['email'] = "L'adresse e-mail ne peut pas dépasser 160 caractères.";
        }

        if (mb_strlen($motDePasse, 'UTF-8') < 8) {
            $fieldErrors['motDePasse'] = 'Choisissez un mot de passe de 8 caractères au moins.';
        }

        if ($fieldErrors !== []) {
            $code = count($fieldErrors) === 1 && isset($fieldErrors['motDePasse'])
                ? 'mot-de-passe-court'
                : 'champs-invalides';
            $message = count($fieldErrors) === 1
                ? reset($fieldErrors)
                : 'Certains champs sont invalides. Vérifiez les informations saisies.';

            throw new RuleViolationException($code, $message, $fieldErrors);
        }

        $conflicts = [];

        if (User::query()->whereRaw('LOWER(email) = ?', [$email])->exists()) {
            $conflicts['email'] = 'Cet e-mail est déjà utilisé par un autre compte.';
        }

        $phoneTaken = User::query()
            ->pluck('telephone')
            ->contains(fn (string $existing) => $this->normalizePhoneDigits($existing) === $telDigits);

        if ($phoneTaken) {
            $conflicts['telephone'] = 'Ce numéro de téléphone est déjà utilisé par un autre compte.';
        }

        if (Etudiant::query()->whereRaw('LOWER(numero_carte) = ?', [mb_strtolower($numeroCarte, 'UTF-8')])->exists()) {
            $conflicts['numeroCarte'] = "Cette carte d'étudiant est déjà associée à un compte.";
        }

        if ($conflicts !== []) {
            if (count($conflicts) === 1) {
                if (isset($conflicts['email'])) {
                    throw new RuleViolationException(
                        'email-pris',
                        'Un compte existe déjà avec cet e-mail. Connectez-vous ou utilisez une autre adresse.',
                        $conflicts
                    );
                }
                if (isset($conflicts['telephone'])) {
                    throw new RuleViolationException(
                        'telephone-pris',
                        'Un compte existe déjà avec ce numéro de téléphone. Connectez-vous ou utilisez un autre numéro.',
                        $conflicts
                    );
                }

                throw new RuleViolationException(
                    'carte-prise',
                    "Un compte existe déjà pour cette carte d'étudiant. Présentez-vous chez LBC si ce n'est pas vous.",
                    $conflicts
                );
            }

            $labels = [];
            if (isset($conflicts['email'])) {
                $labels[] = 'cet e-mail';
            }
            if (isset($conflicts['telephone'])) {
                $labels[] = 'ce numéro de téléphone';
            }
            if (isset($conflicts['numeroCarte'])) {
                $labels[] = "cette carte d'étudiant";
            }

            $last = array_pop($labels);
            $joined = $labels === [] ? $last : implode(', ', $labels).' et '.$last;

            throw new RuleViolationException(
                'compte-existant',
                "Un compte existe déjà avec {$joined}. Connectez-vous ou modifiez les champs indiqués.",
                $conflicts
            );
        }

        $user = DB::transaction(function () use ($prenom, $nom, $numeroCarte, $telephone, $email, $niveau, $ufr, $motDePasse) {
            $campus = Campus::query()->first();

            $user = User::query()->create([
                'campus_id' => $campus?->id,
                'prenom' => $prenom,
                'nom' => $nom,
                'email' => $email,
                'telephone' => $telephone,
                'mot_de_passe_hash' => Hash::make($motDePasse),
                'role' => 'ETUDIANT',
                'actif' => true,
                'cree_le' => WecceClock::now(),
            ]);

            Etudiant::query()->create([
                'id' => $user->id,
                'numero_carte' => $numeroCarte,
                'niveau' => $niveau ?: null,
                'ufr' => $ufr ?: null,
            ]);

            ComptePoints::query()->create([
                'etudiant_id' => $user->id,
                'solde' => 0,
                'statut' => 'ACTIF',
            ]);

            return $user;
        });

        Auth::login($user, true);
        $request->session()->regenerate();

        return response()->json([
            'ok' => true,
            'role' => 'ETUDIANT',
        ]);
    }

    private function normalizePhoneDigits(string $phone): string
    {
        $digits = preg_replace('/\D/', '', $phone) ?? '';

        if (str_starts_with($digits, '00221') && strlen($digits) === 14) {
            return substr($digits, 5);
        }

        if (str_starts_with($digits, '221') && strlen($digits) === 12) {
            return substr($digits, 3);
        }

        return $digits;
    }
}
