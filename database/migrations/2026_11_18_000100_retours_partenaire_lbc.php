<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Retours du partenaire LBC (voir PLAN-RETOURS-PARTENAIRE.md) :
 * - rendez-vous fixés par la boutique à partir d'une demande de l'étudiant ;
 * - échange direct (points sans mise en vente, ou objet de la boutique) ;
 * - validation des achats par la boutique ;
 * - bonus plafonnés ; garantie de 90 jours.
 *
 * Migration additive : aucune colonne existante n'est supprimée.
 */
return new class extends Migration
{
    /** ALTER TYPE … ADD VALUE ne doit pas partager sa transaction avec un usage de la valeur. */
    public $withinTransaction = false;

    public function up(): void
    {
        if (DB::getDriverName() === 'pgsql') {
            DB::statement("ALTER TYPE statut_depot ADD VALUE IF NOT EXISTS 'RDV_DEMANDE' AFTER 'BROUILLON'");
            DB::statement("ALTER TYPE statut_annonce ADD VALUE IF NOT EXISTS 'EN_BOUTIQUE' AFTER 'EN_LIGNE'");
        }

        Schema::table('depot', function (Blueprint $table) {
            // Disponibilités données par l'étudiant : {"days": ["2026-11-20"], "moment": "matin", "note": "..."}
            $table->json('disponibilites')->nullable();
            $table->timestampTz('rdv_fixe_le')->nullable();
            $table->uuid('rdv_fixe_par')->nullable();
        });

        Schema::table('expertise', function (Blueprint $table) {
            // VENTE_WECCE (points + mise en vente), ECHANGE_POINTS (points, objet gardé en boutique),
            // ECHANGE_OBJET (objet de la boutique LBC en contrepartie, sans point).
            $table->string('mode_reprise', 20)->default('VENTE_WECCE');
            $table->string('contrepartie_libelle', 160)->nullable();
            $table->uuid('contrepartie_annonce_id')->nullable();
        });

        Schema::table('acquisition', function (Blueprint $table) {
            $table->timestampTz('valide_le')->nullable();
            $table->uuid('valide_par')->nullable();
            $table->uuid('remis_par')->nullable();
            $table->string('motif_refus', 200)->nullable();
        });

        Schema::table('configuration_plateforme', function (Blueprint $table) {
            $table->integer('bonus_plafond_points')->default(5000);
            $table->boolean('bonus_un_par_etudiant')->default(true);
        });

        DB::table('configuration_plateforme')
            ->where('duree_garantie_jours', '<', 90)
            ->update(['duree_garantie_jours' => 90]);
    }

    public function down(): void
    {
        Schema::table('configuration_plateforme', function (Blueprint $table) {
            $table->dropColumn(['bonus_plafond_points', 'bonus_un_par_etudiant']);
        });
        Schema::table('acquisition', function (Blueprint $table) {
            $table->dropColumn(['valide_le', 'valide_par', 'remis_par', 'motif_refus']);
        });
        Schema::table('expertise', function (Blueprint $table) {
            $table->dropColumn(['mode_reprise', 'contrepartie_libelle', 'contrepartie_annonce_id']);
        });
        Schema::table('depot', function (Blueprint $table) {
            $table->dropColumn(['disponibilites', 'rdv_fixe_le', 'rdv_fixe_par']);
        });
        // Les valeurs d'énumération PostgreSQL ne se retirent pas : elles restent, inutilisées.
    }
};
