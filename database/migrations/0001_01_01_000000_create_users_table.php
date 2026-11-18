<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Exécute le schéma complet Wecce (PostgreSQL avec types ENUM, triggers en ajout seul et vues,
     * et compatibilité SQLite pour les tests automatisés).
     */
    public function up(): void
    {
        $driver = DB::getDriverName();

        if ($driver === 'pgsql') {
            $this->upPostgres();
        } else {
            $this->upPortable();
        }

        Schema::create('password_reset_tokens', function (Blueprint $table) {
            $table->string('email')->primary();
            $table->string('token');
            $table->timestamp('created_at')->nullable();
        });

        Schema::create('sessions', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->uuid('user_id')->nullable()->index();
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->longText('payload');
            $table->integer('last_activity')->index();
        });
    }

    private function upPostgres(): void
    {
        DB::unprepared(<<<'SQL'
CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$ BEGIN
    CREATE TYPE role_utilisateur   AS ENUM ('ETUDIANT', 'AGENT', 'ADMIN');
    CREATE TYPE tranche_age        AS ENUM ('MOINS_1AN', '1_2ANS', '2_3ANS', 'PLUS_4ANS', 'INCONNU');
    CREATE TYPE etat_appareil      AS ENUM ('COMME_NEUF', 'BON', 'USE', 'FONCTIONNEL', 'DEFECTUEUX');
    CREATE TYPE statut_appareil    AS ENUM ('DECLARE', 'EN_STOCK', 'EN_LIGNE', 'RETIRE', 'REFUSE');
    CREATE TYPE statut_depot       AS ENUM ('BROUILLON', 'RDV_PRIS', 'EXPERTISE', 'VALIDE', 'REFUSE', 'ANNULE');
    CREATE TYPE decision_expertise AS ENUM ('ACCEPTE', 'ACCEPTE_EN_PIECES', 'REFUSE');
    CREATE TYPE statut_compte      AS ENUM ('ACTIF', 'DORMANT', 'CLOTURE');
    CREATE TYPE type_mouvement     AS ENUM ('CREDIT_DEPOT', 'BONUS', 'DEBIT_RETRAIT', 'FONTE', 'AJUSTEMENT');
    CREATE TYPE origine_annonce    AS ENUM ('DEPOT_ETUDIANT', 'STOCK_PARTENAIRE');
    CREATE TYPE statut_annonce     AS ENUM ('A_PHOTOGRAPHIER', 'EN_LIGNE', 'RESERVEE', 'VENDUE', 'RETIREE');
    CREATE TYPE moyen_paiement     AS ENUM ('WAVE', 'ORANGE_MONEY', 'ESPECES');
    CREATE TYPE statut_paiement    AS ENUM ('EN_ATTENTE', 'CONFIRME', 'ECHOUE');
    CREATE TYPE niveau_couverture  AS ENUM ('OUVERT', 'SURVEILLANCE', 'SUSPENDU');
    CREATE TYPE action_admin       AS ENUM ('SUSPENSION', 'REPRISE', 'AJUSTEMENT_POINTS',
                                            'RETRAIT_ANNONCE', 'CATEGORIE', 'COMPTE', 'CONFIGURATION');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE campus (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code            VARCHAR(20)  NOT NULL UNIQUE,
    nom             VARCHAR(120) NOT NULL,
    partenaire_nom  VARCHAR(120) NOT NULL,
    partenaire_lieu VARCHAR(160) NOT NULL,
    actif           BOOLEAN      NOT NULL DEFAULT TRUE,
    cree_le         TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE TABLE utilisateur (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campus_id         UUID REFERENCES campus(id),
    nom               VARCHAR(80)  NOT NULL,
    prenom            VARCHAR(80)  NOT NULL,
    email             VARCHAR(160) NOT NULL UNIQUE,
    telephone         VARCHAR(20)  NOT NULL UNIQUE,
    mot_de_passe_hash VARCHAR(255) NOT NULL,
    remember_token    VARCHAR(100),
    role              role_utilisateur NOT NULL,
    actif             BOOLEAN      NOT NULL DEFAULT TRUE,
    cree_le           TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE TABLE etudiant (
    id            UUID PRIMARY KEY REFERENCES utilisateur(id) ON DELETE CASCADE,
    numero_carte  VARCHAR(16) NOT NULL UNIQUE,
    niveau        VARCHAR(40),
    ufr           VARCHAR(80)
);

CREATE TABLE agent (
    id              UUID PRIMARY KEY REFERENCES utilisateur(id) ON DELETE CASCADE,
    fonction        VARCHAR(60),
    peut_expertiser BOOLEAN     NOT NULL DEFAULT TRUE,
    poste           VARCHAR(60) NOT NULL DEFAULT 'Comptoir 1'
);

CREATE TABLE administrateur (
    id     UUID PRIMARY KEY REFERENCES utilisateur(id) ON DELETE CASCADE,
    portee VARCHAR(40) NOT NULL DEFAULT 'GLOBAL'
);

CREATE TABLE configuration_plateforme (
    id                       SMALLINT PRIMARY KEY DEFAULT 1,
    campus_id                UUID REFERENCES campus(id),
    depots_ouverts           BOOLEAN      NOT NULL DEFAULT TRUE,
    suspension_manuelle      BOOLEAN      NOT NULL DEFAULT FALSE,
    motif_suspension         TEXT,
    suspendu_le              TIMESTAMPTZ,
    bonus_actif              BOOLEAN      NOT NULL DEFAULT TRUE,
    bonus_taux               NUMERIC(4,3) NOT NULL DEFAULT 0.200,
    bonus_quota              INTEGER      NOT NULL DEFAULT 100,
    bonus_consomme           INTEGER      NOT NULL DEFAULT 0,
    taux_fonte               NUMERIC(4,3) NOT NULL DEFAULT 0.050,
    seuil_surveillance       NUMERIC(5,3) NOT NULL DEFAULT 1.200,
    seuil_suspension         NUMERIC(5,3) NOT NULL DEFAULT 1.100,
    seuil_reouverture        NUMERIC(5,3) NOT NULL DEFAULT 1.200,
    delai_retrait_jours      SMALLINT     NOT NULL DEFAULT 3,
    duree_garantie_jours     SMALLINT     NOT NULL DEFAULT 7,
    taux_commission          NUMERIC(4,3) NOT NULL DEFAULT 0.050,
    derniere_fonte_le        TIMESTAMPTZ,
    derniere_fonte_comptes   INTEGER,
    derniere_fonte_annonces  INTEGER,
    mis_a_jour_le            TIMESTAMPTZ  NOT NULL DEFAULT now(),
    mis_a_jour_par           UUID REFERENCES administrateur(id),
    CONSTRAINT ligne_unique   CHECK (id = 1),
    CONSTRAINT bonus_coherent CHECK (bonus_consomme BETWEEN 0 AND bonus_quota)
);

CREATE TABLE journal_administration (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    administrateur_id UUID REFERENCES administrateur(id),
    utilisateur_id    UUID REFERENCES utilisateur(id),
    auteur_libelle    VARCHAR(120) NOT NULL,
    action            action_admin NOT NULL,
    cible_type        VARCHAR(40),
    cible_id          UUID,
    cible_libelle     VARCHAR(160) NOT NULL,
    changement        VARCHAR(255) NOT NULL,
    avant             JSONB,
    apres             JSONB,
    motif             TEXT NOT NULL,
    effectue_le       TIMESTAMPTZ NOT NULL DEFAULT now(),
    adresse_ip        VARCHAR(45)
);
CREATE INDEX idx_journal_date  ON journal_administration (effectue_le DESC);
CREATE INDEX idx_journal_cible ON journal_administration (cible_type, cible_id);

CREATE TABLE categorie (
    code    VARCHAR(10) PRIMARY KEY,
    libelle VARCHAR(40) NOT NULL,
    actif   BOOLEAN NOT NULL DEFAULT TRUE,
    ordre   SMALLINT NOT NULL DEFAULT 0
);

CREATE TABLE appareil (
    id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    categorie_code     VARCHAR(10) NOT NULL REFERENCES categorie(code),
    designation        VARCHAR(120) NOT NULL,
    stockage           VARCHAR(20),
    precision          VARCHAR(120),
    numero_serie       VARCHAR(40) UNIQUE,
    age_declare        tranche_age   NOT NULL,
    etat_declare       etat_appareil NOT NULL,
    etat_constate      etat_appareil,
    batterie_pourcent  SMALLINT,
    statut             statut_appareil NOT NULL DEFAULT 'DECLARE',
    CONSTRAINT batterie_plausible CHECK (batterie_pourcent IS NULL
                                         OR batterie_pourcent BETWEEN 0 AND 100)
);

CREATE TABLE photo (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    appareil_id UUID NOT NULL REFERENCES appareil(id) ON DELETE CASCADE,
    url         TEXT NOT NULL,
    alt         VARCHAR(255),
    largeur     SMALLINT NOT NULL DEFAULT 800,
    hauteur     SMALLINT NOT NULL DEFAULT 800,
    ordre       SMALLINT NOT NULL DEFAULT 0
);
CREATE INDEX idx_photo_appareil ON photo (appareil_id);

CREATE TABLE depot (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reference           VARCHAR(16) NOT NULL UNIQUE,
    etudiant_id         UUID NOT NULL REFERENCES etudiant(id),
    appareil_id         UUID NOT NULL UNIQUE REFERENCES appareil(id),
    prix_souhaite       INTEGER,
    nb_photos_declarees SMALLINT NOT NULL DEFAULT 0,
    date_rendez_vous    TIMESTAMPTZ,
    statut              statut_depot NOT NULL DEFAULT 'BROUILLON',
    cree_le             TIMESTAMPTZ NOT NULL DEFAULT now(),
    cloture_le          TIMESTAMPTZ,
    CONSTRAINT souhait_positif CHECK (prix_souhaite IS NULL OR prix_souhaite >= 0)
);
CREATE INDEX idx_depot_etudiant ON depot (etudiant_id);
CREATE INDEX idx_depot_rdv      ON depot (date_rendez_vous) WHERE statut = 'RDV_PRIS';

CREATE TABLE expertise (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    depot_id            UUID NOT NULL UNIQUE REFERENCES depot(id),
    agent_id            UUID NOT NULL REFERENCES agent(id),
    realisee_le         TIMESTAMPTZ NOT NULL DEFAULT now(),
    etat_constate       etat_appareil,
    batterie_pourcent   SMALLINT,
    numero_serie_saisi  VARCHAR(40),
    valeur_reprise      INTEGER,
    prix_affichage      INTEGER,
    decision            decision_expertise NOT NULL,
    motif_refus         VARCHAR(120),
    commentaire         TEXT,
    controles           JSONB,
    CONSTRAINT prix_selon_decision CHECK (
        (decision = 'REFUSE'  AND valeur_reprise IS NULL AND prix_affichage IS NULL
                              AND motif_refus IS NOT NULL)
     OR (decision IN ('ACCEPTE', 'ACCEPTE_EN_PIECES')
                              AND valeur_reprise IS NOT NULL AND prix_affichage IS NOT NULL
                              AND valeur_reprise >= 0 AND prix_affichage >= valeur_reprise)
    )
);
CREATE INDEX idx_expertise_agent ON expertise (agent_id, realisee_le DESC);

CREATE TABLE renoncement (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    expertise_id          UUID NOT NULL UNIQUE REFERENCES expertise(id),
    agent_id              UUID REFERENCES agent(id),
    signe_le              TIMESTAMPTZ NOT NULL DEFAULT now(),
    lieu                  VARCHAR(120) NOT NULL,
    numero_serie_constate VARCHAR(40),
    valeur_cedee          INTEGER NOT NULL CHECK (valeur_cedee >= 0),
    prix_affichage        INTEGER NOT NULL,
    bonus_accorde         INTEGER NOT NULL DEFAULT 0,
    bonus_taux            NUMERIC(4,3) NOT NULL DEFAULT 0,
    solde_avant           INTEGER NOT NULL DEFAULT 0,
    signature_image       TEXT    NOT NULL,
    empreinte             CHAR(64) NOT NULL UNIQUE
);

CREATE TABLE compte_points (
    id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    etudiant_id          UUID NOT NULL UNIQUE REFERENCES etudiant(id),
    solde                INTEGER NOT NULL DEFAULT 0 CHECK (solde >= 0),
    statut               statut_compte NOT NULL DEFAULT 'ACTIF',
    derniere_fonte_le    DATE,
    dernier_mouvement_le TIMESTAMPTZ
);

CREATE TABLE mouvement_points (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    compte_id      UUID NOT NULL REFERENCES compte_points(id),
    type           type_mouvement NOT NULL,
    montant        INTEGER NOT NULL,
    taux_applique  NUMERIC(4,3),
    periode_fonte  VARCHAR(7),
    solde_apres    INTEGER NOT NULL CHECK (solde_apres >= 0),
    libelle        VARCHAR(160) NOT NULL,
    effectue_le    TIMESTAMPTZ NOT NULL DEFAULT now(),
    effectue_par   UUID REFERENCES administrateur(id),
    renoncement_id UUID REFERENCES renoncement(id),
    acquisition_id UUID,
    CONSTRAINT signe_coherent CHECK (
        (type IN ('CREDIT_DEPOT', 'BONUS')          AND montant > 0)
     OR (type IN ('DEBIT_RETRAIT', 'FONTE')         AND montant < 0)
     OR (type = 'AJUSTEMENT'                        AND montant <> 0)
    ),
    CONSTRAINT ajustement_impute CHECK (
        (type = 'AJUSTEMENT' AND effectue_par IS NOT NULL)
     OR (type <> 'AJUSTEMENT' AND effectue_par IS NULL)
    ),
    CONSTRAINT taux_si_fonte CHECK (type <> 'FONTE' OR taux_applique IS NOT NULL)
);
CREATE INDEX idx_mouvement_compte ON mouvement_points (compte_id, effectue_le DESC);
CREATE UNIQUE INDEX idx_mouvement_fonte_unique ON mouvement_points (compte_id, periode_fonte) WHERE periode_fonte IS NOT NULL;

CREATE TABLE annonce (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug              VARCHAR(120) NOT NULL UNIQUE,
    appareil_id       UUID NOT NULL UNIQUE REFERENCES appareil(id),
    origine           origine_annonce NOT NULL,
    depot_origine_id  UUID REFERENCES depot(id),
    titre             VARCHAR(160),
    sous_titre        VARCHAR(200),
    mots_cles         VARCHAR(255),
    info              VARCHAR(160),
    controles         JSONB,
    examine_le        TIMESTAMPTZ,
    prix_initial      INTEGER NOT NULL CHECK (prix_initial > 0),
    prix_courant      INTEGER NOT NULL CHECK (prix_courant > 0),
    derniere_fonte_le DATE,
    cree_le           TIMESTAMPTZ NOT NULL DEFAULT now(),
    mise_en_ligne_le  TIMESTAMPTZ,
    statut            statut_annonce NOT NULL DEFAULT 'EN_LIGNE',
    note_statut       VARCHAR(160),
    CONSTRAINT origine_coherente CHECK (
        (origine = 'DEPOT_ETUDIANT'   AND depot_origine_id IS NOT NULL)
     OR (origine = 'STOCK_PARTENAIRE' AND depot_origine_id IS NULL)
    )
);
CREATE INDEX idx_annonce_marche ON annonce (statut, prix_courant);

CREATE TABLE acquisition (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reference        VARCHAR(16) NOT NULL UNIQUE,
    annonce_id       UUID NOT NULL REFERENCES annonce(id),
    etudiant_id      UUID NOT NULL REFERENCES etudiant(id),
    moyen_paiement   moyen_paiement NOT NULL,
    prix_total       INTEGER NOT NULL CHECK (prix_total > 0),
    points_debites   INTEGER NOT NULL CHECK (points_debites >= 0),
    complement_du    INTEGER NOT NULL CHECK (complement_du >= 0),
    statut           VARCHAR(20) NOT NULL DEFAULT 'RESERVE',
    cree_le          TIMESTAMPTZ NOT NULL DEFAULT now(),
    confirme_le      TIMESTAMPTZ,
    retire_le        TIMESTAMPTZ,
    garantie_jusquau DATE,
    CONSTRAINT total_coherent CHECK (points_debites + complement_du = prix_total)
);
CREATE INDEX idx_acquisition_etudiant ON acquisition (etudiant_id);
CREATE UNIQUE INDEX idx_acquisition_annonce_active ON acquisition (annonce_id) WHERE statut <> 'ANNULE';

ALTER TABLE mouvement_points
    ADD CONSTRAINT fk_mouvement_acquisition
    FOREIGN KEY (acquisition_id) REFERENCES acquisition(id);

CREATE TABLE paiement (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    acquisition_id  UUID NOT NULL REFERENCES acquisition(id),
    moyen           moyen_paiement NOT NULL,
    montant_fcfa    INTEGER NOT NULL CHECK (montant_fcfa >= 0),
    commission_fcfa INTEGER NOT NULL DEFAULT 0,
    reference       VARCHAR(60) UNIQUE,
    telephone       VARCHAR(20),
    statut          statut_paiement NOT NULL DEFAULT 'EN_ATTENTE',
    cree_le         TIMESTAMPTZ NOT NULL DEFAULT now(),
    confirme_le     TIMESTAMPTZ,
    CONSTRAINT confirme_date CHECK (statut <> 'CONFIRME' OR confirme_le IS NOT NULL)
);
CREATE INDEX idx_paiement_acquisition ON paiement (acquisition_id);

CREATE TABLE snapshot_couverture (
    id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    arrete_le          TIMESTAMPTZ NOT NULL,
    dette_en_points    INTEGER NOT NULL CHECK (dette_en_points >= 0),
    valeur_stock       INTEGER NOT NULL CHECK (valeur_stock >= 0),
    nb_objets_en_stock INTEGER NOT NULL CHECK (nb_objets_en_stock >= 0),
    taux_couverture    NUMERIC(6,3) NOT NULL,
    niveau             niveau_couverture NOT NULL,
    evenement          VARCHAR(160)
);

CREATE OR REPLACE FUNCTION refuser_modification()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    RAISE EXCEPTION '% est en ajout seul : ni UPDATE ni DELETE. %',
        TG_TABLE_NAME,
        CASE TG_TABLE_NAME
            WHEN 'mouvement_points' THEN 'Pour corriger un solde, écrivez un mouvement de type AJUSTEMENT.'
            ELSE 'Un journal modifiable ne prouve rien.'
        END;
END;
$$;

CREATE TRIGGER trg_mouvement_ajout_seul
    BEFORE UPDATE OR DELETE ON mouvement_points
    FOR EACH ROW EXECUTE FUNCTION refuser_modification();

CREATE TRIGGER trg_journal_ajout_seul
    BEFORE UPDATE OR DELETE ON journal_administration
    FOR EACH ROW EXECUTE FUNCTION refuser_modification();

CREATE OR REPLACE VIEW v_controle_soldes AS
SELECT c.id AS compte_id,
       c.solde AS solde_cache,
       COALESCE(SUM(m.montant), 0) AS solde_reel
FROM compte_points c
LEFT JOIN mouvement_points m ON m.compte_id = c.id
GROUP BY c.id, c.solde
HAVING c.solde <> COALESCE(SUM(m.montant), 0);

CREATE OR REPLACE VIEW v_couverture_actuelle AS
SELECT (SELECT COALESCE(SUM(solde), 0) FROM compte_points
         WHERE statut = 'ACTIF')                             AS dette_en_points,
       (SELECT COALESCE(SUM(prix_courant), 0) FROM annonce
         WHERE statut IN ('A_PHOTOGRAPHIER', 'EN_LIGNE', 'RESERVEE')) AS valeur_stock,
       (SELECT COUNT(*) FROM annonce
         WHERE statut IN ('A_PHOTOGRAPHIER', 'EN_LIGNE', 'RESERVEE')) AS nb_objets;

CREATE OR REPLACE VIEW v_marge_observee AS
SELECT date_trunc('month', realisee_le)::date AS mois,
       COUNT(*)                               AS nb_expertises,
       ROUND(AVG((prix_affichage - valeur_reprise)::numeric
                 / NULLIF(prix_affichage, 0)), 3) AS marge_moyenne
FROM expertise
WHERE decision = 'ACCEPTE'
GROUP BY 1
ORDER BY 1;
SQL);
    }

    private function upPortable(): void
    {
        Schema::create('campus', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('code', 20)->unique();
            $table->string('nom', 120);
            $table->string('partenaire_nom', 120);
            $table->string('partenaire_lieu', 160);
            $table->boolean('actif')->default(true);
            $table->timestampTz('cree_le')->useCurrent();
        });

        Schema::create('utilisateur', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('campus_id')->nullable();
            $table->string('nom', 80);
            $table->string('prenom', 80);
            $table->string('email', 160)->unique();
            $table->string('telephone', 20)->unique();
            $table->string('mot_de_passe_hash', 255);
            $table->string('remember_token', 100)->nullable();
            $table->string('role', 20);
            $table->boolean('actif')->default(true);
            $table->timestampTz('cree_le')->useCurrent();
        });

        Schema::create('etudiant', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('numero_carte', 16)->unique();
            $table->string('niveau', 40)->nullable();
            $table->string('ufr', 80)->nullable();
            $table->foreign('id')->references('id')->on('utilisateur')->cascadeOnDelete();
        });

        Schema::create('agent', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('fonction', 60)->nullable();
            $table->boolean('peut_expertiser')->default(true);
            $table->string('poste', 60)->default('Comptoir 1');
            $table->foreign('id')->references('id')->on('utilisateur')->cascadeOnDelete();
        });

        Schema::create('administrateur', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('portee', 40)->default('GLOBAL');
            $table->foreign('id')->references('id')->on('utilisateur')->cascadeOnDelete();
        });

        Schema::create('configuration_plateforme', function (Blueprint $table) {
            $table->smallInteger('id')->primary()->default(1);
            $table->uuid('campus_id')->nullable();
            $table->boolean('depots_ouverts')->default(true);
            $table->boolean('suspension_manuelle')->default(false);
            $table->text('motif_suspension')->nullable();
            $table->timestampTz('suspendu_le')->nullable();
            $table->boolean('bonus_actif')->default(true);
            $table->decimal('bonus_taux', 4, 3)->default(0.200);
            $table->integer('bonus_quota')->default(100);
            $table->integer('bonus_consomme')->default(0);
            $table->decimal('taux_fonte', 4, 3)->default(0.050);
            $table->decimal('seuil_surveillance', 5, 3)->default(1.200);
            $table->decimal('seuil_suspension', 5, 3)->default(1.100);
            $table->decimal('seuil_reouverture', 5, 3)->default(1.200);
            $table->smallInteger('delai_retrait_jours')->default(3);
            $table->smallInteger('duree_garantie_jours')->default(7);
            $table->decimal('taux_commission', 4, 3)->default(0.050);
            $table->timestampTz('derniere_fonte_le')->nullable();
            $table->integer('derniere_fonte_comptes')->nullable();
            $table->integer('derniere_fonte_annonces')->nullable();
            $table->timestampTz('mis_a_jour_le')->useCurrent();
            $table->uuid('mis_a_jour_par')->nullable();
        });

        Schema::create('journal_administration', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('administrateur_id')->nullable();
            $table->uuid('utilisateur_id')->nullable();
            $table->string('auteur_libelle', 120);
            $table->string('action', 40);
            $table->string('cible_type', 40)->nullable();
            $table->uuid('cible_id')->nullable();
            $table->string('cible_libelle', 160);
            $table->string('changement', 255);
            $table->json('avant')->nullable();
            $table->json('apres')->nullable();
            $table->text('motif');
            $table->timestampTz('effectue_le')->useCurrent();
            $table->string('adresse_ip', 45)->nullable();
        });

        Schema::create('categorie', function (Blueprint $table) {
            $table->string('code', 10)->primary();
            $table->string('libelle', 40);
            $table->boolean('actif')->default(true);
            $table->smallInteger('ordre')->default(0);
        });

        Schema::create('appareil', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('categorie_code', 10);
            $table->string('designation', 120);
            $table->string('stockage', 20)->nullable();
            $table->string('precision', 120)->nullable();
            $table->string('numero_serie', 40)->nullable()->unique();
            $table->string('age_declare', 20);
            $table->string('etat_declare', 20);
            $table->string('etat_constate', 20)->nullable();
            $table->smallInteger('batterie_pourcent')->nullable();
            $table->string('statut', 20)->default('DECLARE');
            $table->foreign('categorie_code')->references('code')->on('categorie');
        });

        Schema::create('photo', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('appareil_id')->index();
            $table->text('url');
            $table->string('alt', 255)->nullable();
            $table->smallInteger('largeur')->default(800);
            $table->smallInteger('hauteur')->default(800);
            $table->smallInteger('ordre')->default(0);
            $table->foreign('appareil_id')->references('id')->on('appareil')->cascadeOnDelete();
        });

        Schema::create('depot', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('reference', 16)->unique();
            $table->uuid('etudiant_id')->index();
            $table->uuid('appareil_id')->unique();
            $table->integer('prix_souhaite')->nullable();
            $table->smallInteger('nb_photos_declarees')->default(0);
            $table->timestampTz('date_rendez_vous')->nullable();
            $table->string('statut', 20)->default('BROUILLON');
            $table->timestampTz('cree_le')->useCurrent();
            $table->timestampTz('cloture_le')->nullable();
            $table->foreign('etudiant_id')->references('id')->on('etudiant');
            $table->foreign('appareil_id')->references('id')->on('appareil');
        });

        Schema::create('expertise', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('depot_id')->unique();
            $table->uuid('agent_id');
            $table->timestampTz('realisee_le')->useCurrent();
            $table->string('etat_constate', 20)->nullable();
            $table->smallInteger('batterie_pourcent')->nullable();
            $table->string('numero_serie_saisi', 40)->nullable();
            $table->integer('valeur_reprise')->nullable();
            $table->integer('prix_affichage')->nullable();
            $table->string('decision', 30);
            $table->string('motif_refus', 120)->nullable();
            $table->text('commentaire')->nullable();
            $table->json('controles')->nullable();
            $table->foreign('depot_id')->references('id')->on('depot');
            $table->foreign('agent_id')->references('id')->on('agent');
        });

        Schema::create('renoncement', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('expertise_id')->unique();
            $table->uuid('agent_id')->nullable();
            $table->timestampTz('signe_le')->useCurrent();
            $table->string('lieu', 120);
            $table->string('numero_serie_constate', 40)->nullable();
            $table->integer('valeur_cedee');
            $table->integer('prix_affichage');
            $table->integer('bonus_accorde')->default(0);
            $table->decimal('bonus_taux', 4, 3)->default(0);
            $table->integer('solde_avant')->default(0);
            $table->text('signature_image');
            $table->char('empreinte', 64)->unique();
            $table->foreign('expertise_id')->references('id')->on('expertise');
        });

        Schema::create('compte_points', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('etudiant_id')->unique();
            $table->integer('solde')->default(0);
            $table->string('statut', 20)->default('ACTIF');
            $table->date('derniere_fonte_le')->nullable();
            $table->timestampTz('dernier_mouvement_le')->nullable();
            $table->foreign('etudiant_id')->references('id')->on('etudiant');
        });

        Schema::create('mouvement_points', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('compte_id')->index();
            $table->string('type', 20);
            $table->integer('montant');
            $table->decimal('taux_applique', 4, 3)->nullable();
            $table->string('periode_fonte', 7)->nullable();
            $table->integer('solde_apres');
            $table->string('libelle', 160);
            $table->timestampTz('effectue_le')->useCurrent();
            $table->uuid('effectue_par')->nullable();
            $table->uuid('renoncement_id')->nullable();
            $table->uuid('acquisition_id')->nullable();
            $table->foreign('compte_id')->references('id')->on('compte_points');
            $table->unique(['compte_id', 'periode_fonte']);
        });

        Schema::create('annonce', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('slug', 120)->unique();
            $table->uuid('appareil_id')->unique();
            $table->string('origine', 20);
            $table->uuid('depot_origine_id')->nullable();
            $table->string('titre', 160)->nullable();
            $table->string('sous_titre', 200)->nullable();
            $table->string('mots_cles', 255)->nullable();
            $table->string('info', 160)->nullable();
            $table->json('controles')->nullable();
            $table->timestampTz('examine_le')->nullable();
            $table->integer('prix_initial');
            $table->integer('prix_courant');
            $table->date('derniere_fonte_le')->nullable();
            $table->timestampTz('cree_le')->useCurrent();
            $table->timestampTz('mise_en_ligne_le')->nullable();
            $table->string('statut', 20)->default('EN_LIGNE');
            $table->string('note_statut', 160)->nullable();
            $table->foreign('appareil_id')->references('id')->on('appareil');
            $table->foreign('depot_origine_id')->references('id')->on('depot');
        });

        Schema::create('acquisition', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('reference', 16)->unique();
            $table->uuid('annonce_id');
            $table->uuid('etudiant_id')->index();
            $table->string('moyen_paiement', 20);
            $table->integer('prix_total');
            $table->integer('points_debites');
            $table->integer('complement_du');
            $table->string('statut', 20)->default('RESERVE');
            $table->timestampTz('cree_le')->useCurrent();
            $table->timestampTz('confirme_le')->nullable();
            $table->timestampTz('retire_le')->nullable();
            $table->date('garantie_jusquau')->nullable();
            $table->foreign('annonce_id')->references('id')->on('annonce');
            $table->foreign('etudiant_id')->references('id')->on('etudiant');
        });

        Schema::create('paiement', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('acquisition_id')->index();
            $table->string('moyen', 20);
            $table->integer('montant_fcfa');
            $table->integer('commission_fcfa')->default(0);
            $table->string('reference', 60)->nullable()->unique();
            $table->string('telephone', 20)->nullable();
            $table->string('statut', 20)->default('EN_ATTENTE');
            $table->timestampTz('cree_le')->useCurrent();
            $table->timestampTz('confirme_le')->nullable();
            $table->foreign('acquisition_id')->references('id')->on('acquisition');
        });

        Schema::create('snapshot_couverture', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->timestampTz('arrete_le');
            $table->integer('dette_en_points');
            $table->integer('valeur_stock');
            $table->integer('nb_objets_en_stock');
            $table->decimal('taux_couverture', 6, 3);
            $table->string('niveau', 20);
            $table->string('evenement', 160)->nullable();
        });

        // Déclencheurs en ajout seul sous SQLite également
        DB::unprepared(<<<'SQL'
CREATE TRIGGER trg_mouvement_no_update BEFORE UPDATE ON mouvement_points BEGIN
    SELECT RAISE(ABORT, 'mouvement_points est en ajout seul : ni UPDATE ni DELETE.');
END;
CREATE TRIGGER trg_mouvement_no_delete BEFORE DELETE ON mouvement_points BEGIN
    SELECT RAISE(ABORT, 'mouvement_points est en ajout seul : ni UPDATE ni DELETE.');
END;
CREATE TRIGGER trg_journal_no_update BEFORE UPDATE ON journal_administration BEGIN
    SELECT RAISE(ABORT, 'journal_administration est en ajout seul : ni UPDATE ni DELETE.');
END;
CREATE TRIGGER trg_journal_no_delete BEFORE DELETE ON journal_administration BEGIN
    SELECT RAISE(ABORT, 'journal_administration est en ajout seul : ni UPDATE ni DELETE.');
END;
CREATE VIEW v_controle_soldes AS
SELECT c.id AS compte_id,
       c.solde AS solde_cache,
       COALESCE(SUM(m.montant), 0) AS solde_reel
FROM compte_points c
LEFT JOIN mouvement_points m ON m.compte_id = c.id
GROUP BY c.id, c.solde
HAVING c.solde <> COALESCE(SUM(m.montant), 0);

CREATE VIEW v_couverture_actuelle AS
SELECT (SELECT COALESCE(SUM(solde), 0) FROM compte_points WHERE statut = 'ACTIF') AS dette_en_points,
       (SELECT COALESCE(SUM(prix_courant), 0) FROM annonce WHERE statut IN ('A_PHOTOGRAPHIER', 'EN_LIGNE', 'RESERVEE')) AS valeur_stock,
       (SELECT COUNT(*) FROM annonce WHERE statut IN ('A_PHOTOGRAPHIER', 'EN_LIGNE', 'RESERVEE')) AS nb_objets;
SQL);
    }

    public function down(): void
    {
        $driver = DB::getDriverName();
        if ($driver === 'pgsql') {
            DB::unprepared('DROP VIEW IF EXISTS v_marge_observee, v_couverture_actuelle, v_controle_soldes CASCADE;');
        } else {
            DB::unprepared('DROP VIEW IF EXISTS v_couverture_actuelle; DROP VIEW IF EXISTS v_controle_soldes;');
        }

        Schema::dropIfExists('sessions');
        Schema::dropIfExists('password_reset_tokens');
        Schema::dropIfExists('snapshot_couverture');
        Schema::dropIfExists('paiement');
        Schema::dropIfExists('mouvement_points');
        Schema::dropIfExists('acquisition');
        Schema::dropIfExists('annonce');
        Schema::dropIfExists('compte_points');
        Schema::dropIfExists('renoncement');
        Schema::dropIfExists('expertise');
        Schema::dropIfExists('depot');
        Schema::dropIfExists('photo');
        Schema::dropIfExists('appareil');
        Schema::dropIfExists('categorie');
        Schema::dropIfExists('journal_administration');
        Schema::dropIfExists('configuration_plateforme');
        Schema::dropIfExists('administrateur');
        Schema::dropIfExists('agent');
        Schema::dropIfExists('etudiant');
        Schema::dropIfExists('utilisateur');
        Schema::dropIfExists('campus');
    }
};
