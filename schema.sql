-- i. Table SP
CREATE TABLE sp (
    id SERIAL PRIMARY KEY,
    description TEXT NOT NULL,
    region VARCHAR(100) NOT NULL
);

-- ii. Table Personne
CREATE TABLE personne (
    id SERIAL PRIMARY KEY,
    nom VARCHAR(100) NOT NULL,
    prenom VARCHAR(100) NOT NULL,
    dtn DATE NOT NULL,
    sp INTEGER REFERENCES sp(id) ON DELETE SET NULL
);

-- iii. Table Membres (hérite de Personne)
CREATE TABLE membres (
    id INTEGER PRIMARY KEY REFERENCES personne(id) ON DELETE CASCADE,
    date_affiliation DATE NOT NULL
);

-- iv. Table Activites
CREATE TABLE activites (
    id SERIAL PRIMARY KEY,
    daty DATE NOT NULL,
    description TEXT NOT NULL,
    priorite INTEGER NOT NULL,
    region VARCHAR(100) NOT NULL,
    cotisation DECIMAL(10, 2) NOT NULL
);

-- v. Table PresenceAct
CREATE TABLE presenceact (
    id SERIAL PRIMARY KEY,
    id_membre INTEGER REFERENCES membres(id) ON DELETE SET NULL,
    id_personne INTEGER REFERENCES personne(id) ON DELETE SET NULL,
    id_act INTEGER REFERENCES activites(id) ON DELETE CASCADE
);

-- vi. Table PayementAct
CREATE TABLE payementact (
    id SERIAL PRIMARY KEY,
    daty DATE NOT NULL,
    id_presence_act INTEGER REFERENCES presenceact(id) ON DELETE CASCADE,
    montant DECIMAL(10, 2) NOT NULL
);

-- vii. Table Constante (table avec une seule ligne)
CREATE TABLE constante (
    id SERIAL PRIMARY KEY,
    cotisation_inf DECIMAL(10, 2) NOT NULL,
    cotisation_sup DECIMAL(10, 2) NOT NULL
);

-- viii. Table Remise (pour les remises sur les paiements)
CREATE TABLE remise (
    id SERIAL PRIMARY KEY,
    nb_personnes INTEGER NOT NULL,
    pourcentage DECIMAL(5, 2) NOT NULL,
    description VARCHAR(255) NOT NULL
);
