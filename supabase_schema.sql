-- ============================================================
--  JUST KOUL — Schéma Supabase complet
--  Coller et exécuter dans Supabase > SQL Editor > New Query
-- ============================================================

-- Extensions nécessaires
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─────────────────────────────────────────
--  TABLE : enrollments (inscriptions cantine)
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS enrollments (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  parent_nom    TEXT,
  parent_prenom TEXT,
  tel           TEXT,
  email         TEXT,
  school        TEXT,
  autre_ecole   TEXT,
  children      JSONB  DEFAULT '[]',   -- [{nom, prenom, classe}]
  formule       TEXT,                  -- unite | semaine | mensuel | trimestriel
  repas_type    TEXT,                  -- pe | cpd
  days          JSONB  DEFAULT '{}',   -- {lundi, mardi, mercredi, jeudi}
  status        TEXT   DEFAULT 'pending',   -- pending | validated | rejected
  pay_status    TEXT   DEFAULT 'pending',   -- pending | paid
  pay_method    TEXT,
  amount        NUMERIC,
  discount      NUMERIC DEFAULT 0,
  delivery      NUMERIC DEFAULT 0,
  invoice_validated BOOLEAN DEFAULT false,
  notes         TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────
--  TABLE : parent_accounts
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS parent_accounts (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  prenom        TEXT NOT NULL,
  nom           TEXT NOT NULL,
  email         TEXT UNIQUE NOT NULL,
  tel           TEXT,
  -- Si tu utilises Supabase Auth, pas besoin de password_hash ici
  -- auth_id sera l'UUID de auth.users
  auth_id       UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  status        TEXT DEFAULT 'pending_verification',  -- pending_verification | verified
  enrollment_id UUID REFERENCES enrollments(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────
--  TABLE : orders (livraisons journalières)
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS orders (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  enroll_id    UUID REFERENCES enrollments(id) ON DELETE CASCADE,
  date         DATE,
  menu         TEXT,
  delivered    BOOLEAN DEFAULT false,
  delivered_at TEXT,
  note         TEXT,
  child_name   TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────
--  TABLE : quotes (devis événements)
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS quotes (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nom          TEXT,
  tel          TEXT,
  email        TEXT,
  type_event   TEXT,
  date         DATE,
  nb_personnes INTEGER,
  budget       TEXT,
  message      TEXT,
  status       TEXT DEFAULT 'new',  -- new | replied | confirmed | done | cancelled
  items        JSONB DEFAULT '[]',  -- [{desc, qty, unit, total}]
  total        NUMERIC DEFAULT 0,
  deposit      NUMERIC DEFAULT 0,
  deposit_paid BOOLEAN DEFAULT false,
  notes        TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────
--  TABLE : invoices (factures)
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS invoices (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  enroll_id    UUID REFERENCES enrollments(id) ON DELETE SET NULL,
  quote_id     UUID REFERENCES quotes(id) ON DELETE SET NULL,
  type         TEXT,                  -- cantine | evenement
  client_nom   TEXT,
  client_tel   TEXT,
  issue_date   DATE DEFAULT CURRENT_DATE,
  due_date     DATE,
  paid_date    DATE,
  status       TEXT DEFAULT 'pending',  -- pending | paid | partial | overdue
  items        JSONB DEFAULT '[]',
  subtotal     NUMERIC DEFAULT 0,
  discount     NUMERIC DEFAULT 0,
  total        NUMERIC DEFAULT 0,
  deposit      NUMERIC DEFAULT 0,
  deposit_paid BOOLEAN DEFAULT false,
  notes        TEXT
);

-- ─────────────────────────────────────────
--  TABLE : stock
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS stock (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name         TEXT NOT NULL,
  category     TEXT,
  unit         TEXT DEFAULT 'kg',
  qty          NUMERIC DEFAULT 0,
  min_qty      NUMERIC DEFAULT 0,
  cost_unit    NUMERIC DEFAULT 0,
  supplier     TEXT,
  last_updated TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────
--  TABLE : team (membres de l'équipe)
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS team (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nom        TEXT,
  prenom     TEXT,
  role       TEXT,
  tel        TEXT,
  email      TEXT,
  status     TEXT DEFAULT 'active',  -- active | off | sick
  avatar     TEXT,
  schedule   JSONB DEFAULT '{}',     -- {lundi:true, ...}
  salary     NUMERIC DEFAULT 0,
  start_date DATE,
  note       TEXT
);

-- ─────────────────────────────────────────
--  TABLE : tasks (tâches équipe)
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tasks (
  id        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title     TEXT NOT NULL,
  assignee  UUID REFERENCES team(id) ON DELETE SET NULL,
  due_date  DATE,
  status    TEXT DEFAULT 'pending',  -- pending | in_progress | done
  priority  TEXT DEFAULT 'medium'    -- high | medium | low
);

-- ─────────────────────────────────────────
--  TABLE : month_menus (menus mensuels)
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS month_menus (
  id     UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  month  INTEGER NOT NULL,
  year   INTEGER NOT NULL,
  label  TEXT,
  weeks  JSONB DEFAULT '[]',   -- [{lundi, mardi, mercredi, jeudi}] × 4 semaines
  UNIQUE(month, year)
);

-- ─────────────────────────────────────────
--  TABLE : reviews (avis clients)
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS reviews (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  enroll_id  UUID REFERENCES enrollments(id) ON DELETE SET NULL,
  parent_nom TEXT,
  rating     INTEGER CHECK (rating BETWEEN 1 AND 5),
  text       TEXT,
  status     TEXT DEFAULT 'pending',  -- pending | approved
  date       DATE DEFAULT CURRENT_DATE
);

-- ─────────────────────────────────────────
--  TABLE : gallery (galerie photos)
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS gallery (
  id    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  url   TEXT NOT NULL,
  label TEXT,
  date  DATE DEFAULT CURRENT_DATE
);

-- ============================================================
--  DONNÉES INITIALES — Stock (15 articles)
-- ============================================================
INSERT INTO stock (name, category, unit, qty, min_qty, cost_unit, supplier) VALUES
  ('Poulet frais',        'Protéines',        'kg',  15, 5,  32, 'Fournisseur local'),
  ('Riz basmati',         'Féculents',        'kg',  20, 8,  12, 'Grossiste Agadir'),
  ('Pâtes',               'Féculents',        'kg',  12, 5,   9, 'Grossiste Agadir'),
  ('Tomates',             'Légumes',          'kg',  10, 4,   6, 'Souk'),
  ('Pommes de terre',     'Légumes',          'kg',  18, 6,   4, 'Souk'),
  ('Oignons',             'Légumes',          'kg',   8, 3,   3, 'Souk'),
  ('Huile d''olive',      'Condiments',       'L',    6, 2,  35, 'Grossiste Agadir'),
  ('Farine',              'Épicerie',         'kg',  10, 4,   6, 'Grossiste Agadir'),
  ('Filet de poisson',    'Protéines',        'kg',   8, 3,  45, 'Marché poisson'),
  ('Œufs',                'Protéines',        'unité',60,20,  1.5,'Ferme locale'),
  ('Fromage râpé',        'Produits laitiers','kg',   3, 1,  55, 'Grossiste'),
  ('Citrons',             'Fruits',           'kg',   5, 2,   8, 'Souk'),
  ('Herbes fraîches',     'Condiments',       'botte',10,4,   4, 'Souk'),
  ('Boîtes repas noires', 'Emballages',       'unité',200,50, 1.2,'Fournisseur'),
  ('Sacs kraft',          'Emballages',       'unité',100,30, 0.8,'Fournisseur')
ON CONFLICT DO NOTHING;

-- ============================================================
--  DONNÉES INITIALES — Équipe (5 membres)
-- ============================================================
INSERT INTO team (nom, prenom, role, tel, status, avatar, salary, schedule) VALUES
  ('Benali',    'Aicha',  'primary',    '0612000001', 'active', '👩‍🍳', 4500, '{"lundi":true,"mardi":true,"mercredi":true,"jeudi":true,"vendredi":false}'),
  ('Raji',      'Omar',   'livreur',    '0612000002', 'active', '🛵',   3800, '{"lundi":true,"mardi":true,"mercredi":true,"jeudi":true,"vendredi":false}'),
  ('Idrissi',   'Sara',   'assistant',  '0612000003', 'active', '👩‍🍳', 3500, '{"lundi":true,"mardi":true,"mercredi":true,"jeudi":true,"vendredi":false}'),
  ('Cherkaoui', 'Hamid',  'livreur',    '0612000004', 'off',    '🛵',   3800, '{"lundi":true,"mardi":true,"mercredi":true,"jeudi":true,"vendredi":false}'),
  ('Tazi',      'Leila',  'commercial', '0612000005', 'active', '👩‍💼', 4200, '{"lundi":true,"mardi":true,"mercredi":true,"jeudi":true,"vendredi":true}')
ON CONFLICT DO NOTHING;

-- ============================================================
--  ROW LEVEL SECURITY (RLS) — Recommandations de base
-- ============================================================

-- Activer RLS sur toutes les tables
ALTER TABLE enrollments     ENABLE ROW LEVEL SECURITY;
ALTER TABLE parent_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders          ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotes          ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices        ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock           ENABLE ROW LEVEL SECURITY;
ALTER TABLE team            ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks           ENABLE ROW LEVEL SECURITY;
ALTER TABLE month_menus     ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews         ENABLE ROW LEVEL SECURITY;
ALTER TABLE gallery         ENABLE ROW LEVEL SECURITY;

-- Politique : lecture publique pour menus, galerie, avis approuvés
CREATE POLICY "menus_public_read"   ON month_menus FOR SELECT USING (true);
CREATE POLICY "gallery_public_read" ON gallery     FOR SELECT USING (true);
CREATE POLICY "reviews_public_read" ON reviews     FOR SELECT USING (status = 'approved');

-- Politique : toutes les opérations via service_role (admin)
-- (utilisé côté admin avec la clé service_role, jamais exposée au client)

-- Politique : un parent ne voit que ses propres données
CREATE POLICY "parent_own_enrollment" ON enrollments
  FOR SELECT USING (
    email = (SELECT email FROM parent_accounts WHERE auth_id = auth.uid())
  );

CREATE POLICY "parent_own_orders" ON orders
  FOR SELECT USING (
    enroll_id IN (
      SELECT id FROM enrollments
      WHERE email = (SELECT email FROM parent_accounts WHERE auth_id = auth.uid())
    )
  );

-- Insertion publique pour les formulaires du site (inscriptions + devis)
CREATE POLICY "public_insert_enrollments" ON enrollments FOR INSERT WITH CHECK (true);
CREATE POLICY "public_insert_quotes"      ON quotes      FOR INSERT WITH CHECK (true);
CREATE POLICY "public_insert_reviews"     ON reviews     FOR INSERT WITH CHECK (true);

-- ============================================================
--  POLITIQUES ADMIN (anon key — opérations back-office)
--  À exécuter si les opérations admin échouent silencieusement
-- ============================================================

-- Avis : lecture complète (pending + approved) et modération
CREATE POLICY "admin_read_all_reviews"   ON reviews FOR SELECT USING (true);
CREATE POLICY "admin_update_reviews"     ON reviews FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "admin_delete_reviews"     ON reviews FOR DELETE USING (true);

-- Factures : CRUD complet pour la génération automatique
CREATE POLICY "admin_select_invoices"    ON invoices FOR SELECT USING (true);
CREATE POLICY "admin_insert_invoices"    ON invoices FOR INSERT WITH CHECK (true);
CREATE POLICY "admin_update_invoices"    ON invoices FOR UPDATE USING (true) WITH CHECK (true);

-- Inscriptions : lecture complète et mises à jour admin
CREATE POLICY "admin_select_enrollments" ON enrollments FOR SELECT USING (true);
CREATE POLICY "admin_update_enrollments" ON enrollments FOR UPDATE USING (true) WITH CHECK (true);

-- Commandes / Devis / Stocks / Équipe / Tâches / Menus / Galerie
CREATE POLICY "admin_all_orders"         ON orders       FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "admin_all_quotes"         ON quotes       FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "admin_all_stock"          ON stock        FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "admin_all_team"           ON team         FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "admin_all_tasks"          ON tasks        FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "admin_all_month_menus"    ON month_menus  FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "admin_all_gallery"        ON gallery      FOR ALL USING (true) WITH CHECK (true);
