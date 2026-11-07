-- =====================================================================
--  WECCE — schéma PostgreSQL
--  Correspond à wecce-classes-simplifie.puml
--
--  Principes tenus par ce schéma :
--   · aucun calcul de barème en base — l'agent saisit les deux prix
--   · les constantes de calcul (taux de fonte, seuil) vivent dans le code
--   · les résultats de calcul, eux, sont écrits et horodatés
--   · mouvement_points est en ajout seul, garanti par déclencheur
--
--  Exécution :  psql -d wecce -f wecce-schema.sql
-- =====================================================================

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;   -- gen_random_uuid()

-- ---------------------------------------------------------------------
-- Types énumérés
-- ---------------------------------------------------------------------
CREATE TYPE role_utilisateur   AS ENUM ('ETUDIANT', 'AGENT', 'ADMIN');
-- INCONNU sert aux pièces détachées : l'âge d'une barrette de RAM sortie d'un
-- vieux portable n'est presque jamais connu du déposant.
CREATE TYPE tranche_age        AS ENUM ('MOINS_1AN', '1_2ANS', '2_3ANS', 'PLUS_4ANS', 'INCONNU');
-- Deux vocabulaires dans un même type : l'usure (appareils complets) et le
-- fonctionnement (pièces). L'interface n'offre que le sous-ensemble pertinent
-- selon la catégorie de l'objet déposé.
CREATE TYPE etat_appareil      AS ENUM ('COMME_NEUF', 'BON', 'USE', 'FONCTIONNEL', 'DEFECTUEUX');
CREATE TYPE statut_appareil    AS ENUM ('DECLARE', 'EN_STOCK', 'EN_LIGNE', 'RETIRE', 'REFUSE');
CREATE TYPE statut_depot       AS ENUM ('BROUILLON', 'RDV_PRIS', 'EXPERTISE', 'VALIDE', 'REFUSE', 'ANNULE');
-- ACCEPTE_EN_PIECES : l'appareil est trop vieux ou trop abîmé pour repartir
-- entier, mais l'agent le reprend pour le proposer en pièces détachées plutôt
-- que de le refuser sèchement. Il requalifie alors appareil.categorie_code
-- en 'piece'. Le déposant accepte le prix annoncé ou repart avec son appareil,
-- comme pour toute autre décision.
CREATE TYPE decision_expertise AS ENUM ('ACCEPTE', 'ACCEPTE_EN_PIECES', 'REFUSE');
CREATE TYPE statut_compte      AS ENUM ('ACTIF', 'DORMANT', 'CLOTURE');
CREATE TYPE type_mouvement     AS ENUM ('CREDIT_DEPOT', 'BONUS', 'DEBIT_RETRAIT', 'FONTE', 'AJUSTEMENT');
CREATE TYPE origine_annonce    AS ENUM ('DEPOT_ETUDIANT', 'STOCK_PARTENAIRE');
CREATE TYPE statut_annonce     AS ENUM ('EN_LIGNE', 'RESERVEE', 'VENDUE', 'RETIREE');
CREATE TYPE moyen_paiement     AS ENUM ('WAVE', 'ORANGE_MONEY', 'ESPECES');
CREATE TYPE statut_paiement    AS ENUM ('EN_ATTENTE', 'CONFIRME', 'ECHOUE');
CREATE TYPE niveau_couverture  AS ENUM ('OUVERT', 'SURVEILLANCE', 'SUSPENDU');
CREATE TYPE action_admin       AS ENUM ('SUSPENSION', 'REPRISE', 'AJUSTEMENT_POINTS',
                                        'RETRAIT_ANNONCE', 'CATEGORIE', 'COMPTE', 'CONFIGURATION');

-- ---------------------------------------------------------------------
-- 1 · Comptes
--
-- Héritage par table : une ligne dans utilisateur, plus une ligne dans
-- la table du rôle, qui partage la même clé primaire. On garde ainsi
-- une seule identité et une seule contrainte d'unicité sur l'e-mail,
-- sans colonnes nulles pour les rôles qui ne les utilisent pas.
-- ---------------------------------------------------------------------
CREATE TABLE utilisateur (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nom               VARCHAR(80)  NOT NULL,
    prenom            VARCHAR(80)  NOT NULL,
    email             VARCHAR(160) NOT NULL UNIQUE,
    telephone         VARCHAR(20)  NOT NULL UNIQUE,
    mot_de_passe_hash VARCHAR(255) NOT NULL,
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
    peut_expertiser BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE administrateur (
    id     UUID PRIMARY KEY REFERENCES utilisateur(id) ON DELETE CASCADE,
    portee VARCHAR(40) NOT NULL DEFAULT 'GLOBAL'
);

-- ---------------------------------------------------------------------
-- 2 · Administration
-- ---------------------------------------------------------------------

-- Une seule ligne, verrouillée par la contrainte ligne_unique.
-- N'y mettre que ce que l'admin doit pouvoir changer sans redéploiement.
CREATE TABLE configuration_plateforme (
    id                  SMALLINT PRIMARY KEY DEFAULT 1,
    depots_ouverts      BOOLEAN     NOT NULL DEFAULT TRUE,
    suspension_manuelle BOOLEAN     NOT NULL DEFAULT FALSE,
    motif_suspension    TEXT,
    bonus_actif         BOOLEAN     NOT NULL DEFAULT TRUE,
    bonus_taux          NUMERIC(4,3) NOT NULL DEFAULT 0.200,
    bonus_quota         INTEGER     NOT NULL DEFAULT 100,
    bonus_consomme      INTEGER     NOT NULL DEFAULT 0,
    mis_a_jour_le       TIMESTAMPTZ NOT NULL DEFAULT now(),
    mis_a_jour_par      UUID REFERENCES administrateur(id),
    CONSTRAINT ligne_unique   CHECK (id = 1),
    CONSTRAINT bonus_coherent CHECK (bonus_consomme BETWEEN 0 AND bonus_quota)
);

CREATE TABLE journal_administration (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    administrateur_id UUID NOT NULL REFERENCES administrateur(id),
    action            action_admin NOT NULL,
    cible_type        VARCHAR(40),
    cible_id          UUID,
    avant             JSONB,
    apres             JSONB,
    motif             TEXT NOT NULL,
    effectue_le       TIMESTAMPTZ NOT NULL DEFAULT now(),
    adresse_ip        INET
);
CREATE INDEX idx_journal_date  ON journal_administration (effectue_le DESC);
CREATE INDEX idx_journal_cible ON journal_administration (cible_type, cible_id);

-- ---------------------------------------------------------------------
-- 3 · Objets et dépôt
-- ---------------------------------------------------------------------
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
    url         VARCHAR(255) NOT NULL,
    ordre       SMALLINT NOT NULL DEFAULT 0
);
CREATE INDEX idx_photo_appareil ON photo (appareil_id);

CREATE TABLE depot (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reference         VARCHAR(16) NOT NULL UNIQUE,
    etudiant_id       UUID NOT NULL REFERENCES etudiant(id),
    appareil_id       UUID NOT NULL UNIQUE REFERENCES appareil(id),
    prix_souhaite     INTEGER,
    date_rendez_vous  TIMESTAMPTZ,
    statut            statut_depot NOT NULL DEFAULT 'BROUILLON',
    cree_le           TIMESTAMPTZ NOT NULL DEFAULT now(),
    cloture_le        TIMESTAMPTZ,
    CONSTRAINT souhait_positif CHECK (prix_souhaite IS NULL OR prix_souhaite >= 0)
);
CREATE INDEX idx_depot_etudiant ON depot (etudiant_id);
CREATE INDEX idx_depot_rdv      ON depot (date_rendez_vous) WHERE statut = 'RDV_PRIS';

CREATE TABLE expertise (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    depot_id          UUID NOT NULL UNIQUE REFERENCES depot(id),
    agent_id          UUID NOT NULL REFERENCES agent(id),
    realisee_le       TIMESTAMPTZ NOT NULL DEFAULT now(),
    etat_constate     etat_appareil NOT NULL,
    batterie_pourcent SMALLINT,
    valeur_reprise    INTEGER,
    prix_affichage    INTEGER,
    decision          decision_expertise NOT NULL,
    motif_refus       VARCHAR(120),
    commentaire       TEXT,
    -- Un refus n'a pas de prix ; une acceptation en a deux, et le prix
    -- d'affichage ne peut pas être inférieur à la reprise.
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
    signe_le              TIMESTAMPTZ NOT NULL DEFAULT now(),
    lieu                  VARCHAR(120) NOT NULL,
    numero_serie_constate VARCHAR(40),
    valeur_cedee          INTEGER NOT NULL CHECK (valeur_cedee >= 0),
    prix_affichage        INTEGER NOT NULL,
    signature_image       BYTEA   NOT NULL,
    empreinte             CHAR(64) NOT NULL UNIQUE
);

-- ---------------------------------------------------------------------
-- 4 · Points
-- ---------------------------------------------------------------------
CREATE TABLE compte_points (
    id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    etudiant_id        UUID NOT NULL UNIQUE REFERENCES etudiant(id),
    solde              INTEGER NOT NULL DEFAULT 0 CHECK (solde >= 0),
    statut             statut_compte NOT NULL DEFAULT 'ACTIF',
    derniere_fonte_le  DATE,
    dernier_mouvement_le TIMESTAMPTZ
);

-- Journal en ajout seul. solde du compte n'est qu'un cache : la vérité
-- est ici. solde_apres permet de rejouer l'historique ligne à ligne.
CREATE TABLE mouvement_points (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    compte_id      UUID NOT NULL REFERENCES compte_points(id),
    type           type_mouvement NOT NULL,
    montant        INTEGER NOT NULL,
    taux_applique  NUMERIC(4,3),
    solde_apres    INTEGER NOT NULL CHECK (solde_apres >= 0),
    libelle        VARCHAR(160) NOT NULL,
    effectue_le    TIMESTAMPTZ NOT NULL DEFAULT now(),
    effectue_par   UUID REFERENCES administrateur(id),
    renoncement_id UUID UNIQUE REFERENCES renoncement(id),
    acquisition_id UUID,
    -- Le signe du montant doit suivre le type : pas de « crédit négatif ».
    CONSTRAINT signe_coherent CHECK (
        (type IN ('CREDIT_DEPOT', 'BONUS')          AND montant > 0)
     OR (type IN ('DEBIT_RETRAIT', 'FONTE')         AND montant < 0)
     OR (type = 'AJUSTEMENT'                        AND montant <> 0)
    ),
    -- Un ajustement est toujours imputable à un administrateur ; les
    -- mouvements automatiques n'en ont jamais.
    CONSTRAINT ajustement_impute CHECK (
        (type = 'AJUSTEMENT' AND effectue_par IS NOT NULL)
     OR (type <> 'AJUSTEMENT' AND effectue_par IS NULL)
    ),
    CONSTRAINT taux_si_fonte CHECK (type <> 'FONTE' OR taux_applique IS NOT NULL)
);
CREATE INDEX idx_mouvement_compte ON mouvement_points (compte_id, effectue_le DESC);

-- ---------------------------------------------------------------------
-- 5 · Marché et retrait
-- ---------------------------------------------------------------------
CREATE TABLE annonce (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    appareil_id       UUID NOT NULL UNIQUE REFERENCES appareil(id),
    origine           origine_annonce NOT NULL,
    depot_origine_id  UUID REFERENCES depot(id),
    prix_initial      INTEGER NOT NULL CHECK (prix_initial > 0),
    prix_courant      INTEGER NOT NULL CHECK (prix_courant > 0),
    derniere_fonte_le DATE,
    mise_en_ligne_le  TIMESTAMPTZ NOT NULL DEFAULT now(),
    statut            statut_annonce NOT NULL DEFAULT 'EN_LIGNE',
    -- Le stock d'amorçage du partenaire n'a pas de dépôt derrière lui.
    CONSTRAINT origine_coherente CHECK (
        (origine = 'DEPOT_ETUDIANT'   AND depot_origine_id IS NOT NULL)
     OR (origine = 'STOCK_PARTENAIRE' AND depot_origine_id IS NULL)
    )
);
CREATE INDEX idx_annonce_marche ON annonce (statut, prix_courant);

CREATE TABLE acquisition (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    annonce_id       UUID NOT NULL UNIQUE REFERENCES annonce(id),
    etudiant_id      UUID NOT NULL REFERENCES etudiant(id),
    prix_total       INTEGER NOT NULL CHECK (prix_total > 0),
    points_debites   INTEGER NOT NULL CHECK (points_debites >= 0),
    complement_du    INTEGER NOT NULL CHECK (complement_du >= 0),
    retire_le        TIMESTAMPTZ,
    garantie_jusquau DATE,
    CONSTRAINT total_coherent CHECK (points_debites + complement_du = prix_total)
);
CREATE INDEX idx_acquisition_etudiant ON acquisition (etudiant_id);

ALTER TABLE mouvement_points
    ADD CONSTRAINT fk_mouvement_acquisition
    FOREIGN KEY (acquisition_id) REFERENCES acquisition(id);

CREATE TABLE paiement (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    acquisition_id UUID NOT NULL REFERENCES acquisition(id),
    moyen          moyen_paiement NOT NULL,
    montant_fcfa   INTEGER NOT NULL CHECK (montant_fcfa > 0),
    reference      VARCHAR(60) UNIQUE,
    statut         statut_paiement NOT NULL DEFAULT 'EN_ATTENTE',
    confirme_le    TIMESTAMPTZ,
    CONSTRAINT confirme_date CHECK (statut <> 'CONFIRME' OR confirme_le IS NOT NULL)
);
CREATE INDEX idx_paiement_acquisition ON paiement (acquisition_id);

-- ---------------------------------------------------------------------
-- 6 · Pilotage
-- ---------------------------------------------------------------------
CREATE TABLE snapshot_couverture (
    id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    arrete_le          DATE NOT NULL UNIQUE,
    dette_en_points    INTEGER NOT NULL CHECK (dette_en_points >= 0),
    valeur_stock       INTEGER NOT NULL CHECK (valeur_stock >= 0),
    nb_objets_en_stock INTEGER NOT NULL CHECK (nb_objets_en_stock >= 0),
    taux_couverture    NUMERIC(6,3) NOT NULL,
    niveau             niveau_couverture NOT NULL
);

-- ---------------------------------------------------------------------
-- Protection du journal des points
--
-- Le modèle dit « ajout seul ». Sans ce déclencheur, ce n'est qu'une
-- intention : n'importe quel UPDATE réécrirait l'historique des points
-- sans laisser de trace.
-- ---------------------------------------------------------------------
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

-- Même protection sur le journal d'administration : un audit modifiable
-- n'est pas un audit.
CREATE TRIGGER trg_journal_ajout_seul
    BEFORE UPDATE OR DELETE ON journal_administration
    FOR EACH ROW EXECUTE FUNCTION refuser_modification();

-- ---------------------------------------------------------------------
-- Vues de contrôle
-- ---------------------------------------------------------------------

-- Écart entre le solde mis en cache et la somme réelle des mouvements.
-- Doit toujours renvoyer zéro ligne.
CREATE VIEW v_controle_soldes AS
SELECT c.id AS compte_id,
       c.solde AS solde_cache,
       COALESCE(SUM(m.montant), 0) AS solde_reel
FROM compte_points c
LEFT JOIN mouvement_points m ON m.compte_id = c.id
GROUP BY c.id, c.solde
HAVING c.solde <> COALESCE(SUM(m.montant), 0);

-- Dette en points face à la valeur du stock, à l'instant présent.
CREATE VIEW v_couverture_actuelle AS
SELECT (SELECT COALESCE(SUM(solde), 0) FROM compte_points
         WHERE statut = 'ACTIF')                             AS dette_en_points,
       (SELECT COALESCE(SUM(prix_courant), 0) FROM annonce
         WHERE statut IN ('EN_LIGNE', 'RESERVEE'))           AS valeur_stock,
       (SELECT COUNT(*) FROM annonce
         WHERE statut IN ('EN_LIGNE', 'RESERVEE'))           AS nb_objets;

-- Marge réellement pratiquée par l'expert, par mois.
-- Sans barème, c'est la seule façon de savoir où se situe la marge.
CREATE VIEW v_marge_observee AS
SELECT date_trunc('month', realisee_le)::date AS mois,
       COUNT(*)                               AS nb_expertises,
       ROUND(AVG((prix_affichage - valeur_reprise)::numeric
                 / NULLIF(prix_affichage, 0)), 3) AS marge_moyenne
FROM expertise
WHERE decision = 'ACCEPTE'
GROUP BY 1
ORDER BY 1;

-- ---------------------------------------------------------------------
-- Données initiales
-- ---------------------------------------------------------------------
INSERT INTO categorie (code, libelle, ordre) VALUES
    ('tel',   'Téléphones',  1),
    ('ordi',  'Ordinateurs', 2),
    ('tab',   'Tablettes',   3),
    ('audio', 'Audio',       4),
    -- Deux voies d'entrée : l'étudiant dépose directement une pièce (son
    -- disque dur, une barrette de RAM), ou l'agent requalifie en pièces un
    -- appareil trop vieux pour repartir entier (decision ACCEPTE_EN_PIECES).
    ('piece', 'Pièces et composants', 5);

INSERT INTO configuration_plateforme (id) VALUES (1);

COMMIT;
