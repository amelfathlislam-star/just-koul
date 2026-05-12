// seed-demo.js — Données démo réalistes Just Koul
// node seed-demo.js

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://ooozqerfebedybmtjszn.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vb3pxZXJmZWJlZHlibXRqc3puIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzczODk2NzcsImV4cCI6MjA5Mjk2NTY3N30.dk3_S4ah5yNkexOv9vRf8Xj_oJNcfqaRti01xHxmCXc'

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

function log(table, data, error) {
  if (error) {
    console.error(`  ✗ ${table} :`, error.message)
  } else {
    const count = Array.isArray(data) ? data.length : 1
    console.log(`  ✓ ${table} : ${count} ligne(s) insérée(s)`)
  }
}

// ─────────────────────────────────────────
//  1. ÉQUIPE
// ─────────────────────────────────────────
async function seedTeam() {
  console.log('\n📋 Équipe...')

  // Vider pour réinsérer proprement
  await supabase.from('team').delete().neq('id', '00000000-0000-0000-0000-000000000000')

  const { data, error } = await supabase.from('team').insert([
    {
      prenom: 'Aicha', nom: 'Benali', role: 'Cuisinière principale',
      tel: '0661234500', email: 'aicha@justkoul.com',
      status: 'active', avatar: '👩‍🍳',
      schedule: { lundi: true, mardi: true, mercredi: true, jeudi: true, vendredi: false },
      salary: 3500, start_date: '2024-09-01',
      note: 'Spécialiste tajines et cuisine marocaine'
    },
    {
      prenom: 'Omar', nom: 'Raji', role: 'Livreur',
      tel: '0662345600', email: 'omar@justkoul.com',
      status: 'active', avatar: '🛵',
      schedule: { lundi: true, mardi: true, mercredi: true, jeudi: true, vendredi: false },
      salary: 2800, start_date: '2024-10-01',
      note: 'Zone : Al Hanane, Al Inbihat'
    },
    {
      prenom: 'Sara', nom: 'Idrissi', role: 'Assistante cuisine',
      tel: '0663456700', email: 'sara@justkoul.com',
      status: 'active', avatar: '👩‍🍳',
      schedule: { lundi: true, mardi: true, mercredi: false, jeudi: true, vendredi: false },
      salary: 2800, start_date: '2025-01-15',
      note: 'Spécialiste desserts et pâtisseries'
    },
    {
      prenom: 'Hamid', nom: 'Cherkaoui', role: 'Livreur',
      tel: '0664567800', email: 'hamid@justkoul.com',
      status: 'off', avatar: '🛵',
      schedule: { lundi: false, mardi: false, mercredi: true, jeudi: true, vendredi: false },
      salary: 2800, start_date: '2025-02-01',
      note: 'Zone : Salsabil, La Chrysalide'
    },
    {
      prenom: 'Leila', nom: 'Tazi', role: 'Commerciale',
      tel: '0665678900', email: 'leila@justkoul.com',
      status: 'active', avatar: '👩‍💼',
      schedule: { lundi: true, mardi: true, mercredi: true, jeudi: true, vendredi: true },
      salary: 4000, start_date: '2024-11-01',
      note: 'Gestion clients et devis événementiels'
    }
  ]).select()

  log('team', data, error)
  return data || []
}

// ─────────────────────────────────────────
//  2. ENROLLMENTS (inscriptions cantine)
// ─────────────────────────────────────────
async function seedEnrollments() {
  console.log('\n📋 Inscriptions cantine...')

  await supabase.from('enrollments').delete().neq('id', '00000000-0000-0000-0000-000000000000')

  const rows = [
    {
      parent_prenom: 'Fatima', parent_nom: 'Benali',
      tel: '0612345678', email: 'fatima.benali@gmail.com',
      school: 'al-hanane', formule: 'mensuel', repas_type: 'cpd',
      children: [
        { prenom: 'Youssef', nom: 'Benali', classe: 'CE2' },
        { prenom: 'Amina', nom: 'Benali', classe: 'CM1' }
      ],
      days: { lundi: true, mardi: true, mercredi: true, jeudi: false },
      status: 'validated', pay_status: 'paid', pay_method: 'virement',
      amount: 1238, discount: 138, delivery: 0,
      created_at: '2026-03-01T10:00:00Z'
    },
    {
      parent_prenom: 'Khalid', parent_nom: 'Ouchane',
      tel: '0699887766', email: 'khalid.ouchane@gmail.com',
      school: 'salsabil', formule: 'semaine', repas_type: 'pe',
      children: [
        { prenom: 'Rayan', nom: 'Ouchane', classe: '6ème' }
      ],
      days: { lundi: true, mardi: true, mercredi: false, jeudi: true },
      status: 'pending', pay_status: 'pending', pay_method: '',
      amount: 176, discount: 0, delivery: 0,
      created_at: '2026-04-15T09:30:00Z'
    },
    {
      parent_prenom: 'Nadia', parent_nom: 'Alami',
      tel: '0655443322', email: 'nadia.alami@gmail.com',
      school: 'chrysalide', formule: 'trimestriel', repas_type: 'cpd',
      children: [
        { prenom: 'Sirine', nom: 'Alami', classe: '5ème' },
        { prenom: 'Adam', nom: 'Alami', classe: 'CM2' },
        { prenom: 'Lina', nom: 'Alami', classe: 'CE1' }
      ],
      days: { lundi: true, mardi: true, mercredi: true, jeudi: true },
      status: 'validated', pay_status: 'paid', pay_method: 'virement',
      amount: 4620, discount: 1540, delivery: 0,
      created_at: '2026-02-20T11:00:00Z'
    },
    {
      parent_prenom: 'Youssef', parent_nom: 'Tazi',
      tel: '0677889900', email: 'youssef.tazi@gmail.com',
      school: 'al-inbihat', formule: 'mensuel', repas_type: 'pe',
      children: [
        { prenom: 'Mehdi', nom: 'Tazi', classe: '4ème' },
        { prenom: 'Sara', nom: 'Tazi', classe: 'CE2' }
      ],
      days: { lundi: true, mardi: true, mercredi: true, jeudi: true },
      status: 'validated', pay_status: 'paid', pay_method: 'espèces',
      amount: 1238, discount: 138, delivery: 0,
      created_at: '2026-03-10T08:30:00Z'
    },
    {
      parent_prenom: 'Samira', parent_nom: 'Idrissi',
      tel: '0644332211', email: 'samira.idrissi@gmail.com',
      school: 'al-hanane', formule: 'mensuel', repas_type: 'cpd',
      children: [
        { prenom: 'Ines', nom: 'Idrissi', classe: 'CM2' }
      ],
      days: { lundi: true, mardi: false, mercredi: true, jeudi: true },
      status: 'validated', pay_status: 'pending', pay_method: 'virement',
      amount: 770, discount: 0, delivery: 0,
      created_at: '2026-04-18T14:00:00Z'
    }
  ]

  const { data, error } = await supabase.from('enrollments').insert(rows).select()
  log('enrollments', data, error)
  return data || []
}

// ─────────────────────────────────────────
//  3. PARENT ACCOUNTS
// ─────────────────────────────────────────
async function seedParentAccounts(enrollments) {
  console.log('\n📋 Comptes parents...')

  await supabase.from('parent_accounts').delete().neq('id', '00000000-0000-0000-0000-000000000000')

  const findEnroll = (email) => enrollments.find(e => e.email === email)?.id || null

  const rows = [
    {
      prenom: 'Fatima', nom: 'Benali', email: 'fatima.benali@gmail.com',
      tel: '0612345678', status: 'verified',
      enrollment_id: findEnroll('fatima.benali@gmail.com')
    },
    {
      prenom: 'Khalid', nom: 'Ouchane', email: 'khalid.ouchane@gmail.com',
      tel: '0699887766', status: 'verified',
      enrollment_id: findEnroll('khalid.ouchane@gmail.com')
    },
    {
      prenom: 'Nadia', nom: 'Alami', email: 'nadia.alami@gmail.com',
      tel: '0655443322', status: 'verified',
      enrollment_id: findEnroll('nadia.alami@gmail.com')
    },
    {
      prenom: 'Youssef', nom: 'Tazi', email: 'youssef.tazi@gmail.com',
      tel: '0677889900', status: 'verified',
      enrollment_id: findEnroll('youssef.tazi@gmail.com')
    },
    {
      prenom: 'Samira', nom: 'Idrissi', email: 'samira.idrissi@gmail.com',
      tel: '0644332211', status: 'verified',
      enrollment_id: findEnroll('samira.idrissi@gmail.com')
    }
  ]

  const { data, error } = await supabase.from('parent_accounts').insert(rows).select()
  log('parent_accounts', data, error)
  return data || []
}

// ─────────────────────────────────────────
//  4. ORDERS (livraisons journalières)
// ─────────────────────────────────────────
async function seedOrders(enrollments) {
  console.log('\n📋 Commandes / Livraisons...')

  await supabase.from('orders').delete().neq('id', '00000000-0000-0000-0000-000000000000')

  const enroll = (email) => enrollments.find(e => e.email === email)?.id

  const rows = [
    // Semaine du 28 avril
    {
      enroll_id: enroll('khalid.ouchane@gmail.com'), date: '2026-04-28',
      menu: 'Riz cantonais & poulet', child_name: 'Rayan Ouchane',
      delivered: true, delivered_at: '12:10'
    },
    {
      enroll_id: enroll('nadia.alami@gmail.com'), date: '2026-04-29',
      menu: 'Cordon bleu & purée', child_name: 'Lina Alami',
      delivered: true, delivered_at: '12:05'
    },
    // Semaine du 5 mai
    {
      enroll_id: enroll('fatima.benali@gmail.com'), date: '2026-05-05',
      menu: 'Poulet rôti & riz pilaf', child_name: 'Youssef Benali',
      delivered: true, delivered_at: '12:00'
    },
    {
      enroll_id: enroll('fatima.benali@gmail.com'), date: '2026-05-05',
      menu: 'Poulet rôti & riz pilaf', child_name: 'Amina Benali',
      delivered: true, delivered_at: '12:00'
    },
    {
      enroll_id: enroll('nadia.alami@gmail.com'), date: '2026-05-06',
      menu: 'Lasagnes maison', child_name: 'Sirine Alami',
      delivered: true, delivered_at: '12:20'
    },
    {
      enroll_id: enroll('youssef.tazi@gmail.com'), date: '2026-05-06',
      menu: 'Lasagnes maison', child_name: 'Mehdi Tazi',
      delivered: true, delivered_at: '11:55'
    },
    {
      enroll_id: enroll('fatima.benali@gmail.com'), date: '2026-05-07',
      menu: 'Filet de poisson & purée', child_name: 'Youssef Benali',
      delivered: true, delivered_at: '12:15'
    },
    {
      enroll_id: enroll('samira.idrissi@gmail.com'), date: '2026-05-07',
      menu: 'Filet de poisson & purée', child_name: 'Ines Idrissi',
      delivered: true, delivered_at: '12:10'
    },
    {
      enroll_id: enroll('nadia.alami@gmail.com'), date: '2026-05-08',
      menu: 'Tajine légumes & couscous', child_name: 'Adam Alami',
      delivered: true, delivered_at: '12:30'
    },
    // Semaine du 12 mai (aujourd'hui — en cours)
    {
      enroll_id: enroll('fatima.benali@gmail.com'), date: '2026-05-12',
      menu: 'Pasta bolognaise', child_name: 'Amina Benali',
      delivered: false, delivered_at: null
    },
    {
      enroll_id: enroll('nadia.alami@gmail.com'), date: '2026-05-12',
      menu: 'Pasta bolognaise', child_name: 'Lina Alami',
      delivered: false, delivered_at: null
    },
    {
      enroll_id: enroll('youssef.tazi@gmail.com'), date: '2026-05-12',
      menu: 'Pasta bolognaise', child_name: 'Sara Tazi',
      delivered: false, delivered_at: null
    }
  ]

  const { data, error } = await supabase.from('orders').insert(rows).select()
  log('orders', data, error)
  return data || []
}

// ─────────────────────────────────────────
//  5. QUOTES (devis événements)
// ─────────────────────────────────────────
async function seedQuotes() {
  console.log('\n📋 Devis événements...')

  await supabase.from('quotes').delete().neq('id', '00000000-0000-0000-0000-000000000000')

  const rows = [
    {
      nom: 'Rachid Amrani', tel: '0661234567', email: 'rachid.amrani@gmail.com',
      type_event: 'Mariage', date: '2026-06-14',
      nb_personnes: 120, budget: '10 000 DH',
      message: 'Buffet complet mariage, cuisine marocaine et internationale. Pas d\'alcool.',
      status: 'confirmed',
      items: [
        { desc: 'Buffet marocain complet', qty: 120, unit: 45, total: 5400 },
        { desc: 'Cocktail dînatoire', qty: 120, unit: 22, total: 2640 },
        { desc: 'Décoration table', qty: 1, unit: 960, total: 960 }
      ],
      total: 9000, deposit: 2500, deposit_paid: true,
      notes: 'Halal certifié — Livraison sur place',
      created_at: '2026-04-10T10:00:00Z'
    },
    {
      nom: 'Sara Idrissi Corp', tel: '0677889900', email: 'sara@entreprise.ma',
      type_event: 'Corporate', date: '2026-05-20',
      nb_personnes: 40, budget: '3 000 DH',
      message: 'Déjeuner d\'équipe mensuel, formule finger food. Séminaire annuel.',
      status: 'replied',
      items: [
        { desc: 'Finger food varié', qty: 40, unit: 55, total: 2200 },
        { desc: 'Jus frais maison', qty: 40, unit: 15, total: 600 }
      ],
      total: 2800, deposit: 0, deposit_paid: false,
      notes: 'Devis envoyé le 18/04',
      created_at: '2026-04-08T14:00:00Z'
    },
    {
      nom: 'Ahmed Tazi', tel: '0644332211', email: 'ahmed.tazi@gmail.com',
      type_event: 'Anniversaire', date: '2026-05-10',
      nb_personnes: 60, budget: '4 000 DH',
      message: 'Buffet anniversaire 40 ans, ambiance festive, thème doré.',
      status: 'confirmed',
      items: [
        { desc: 'Buffet chaud et froid', qty: 60, unit: 50, total: 3000 },
        { desc: 'Gâteau maison personnalisé', qty: 1, unit: 450, total: 450 },
        { desc: 'Jus et boissons', qty: 60, unit: 12, total: 720 }
      ],
      total: 4170, deposit: 1000, deposit_paid: true,
      notes: 'Thème doré — décoration incluse',
      created_at: '2026-04-05T09:00:00Z'
    },
    {
      nom: 'Houda Berrada', tel: '0666554433', email: 'houda.berrada@gmail.com',
      type_event: 'Ftour Ramadan', date: '2026-03-25',
      nb_personnes: 80, budget: '5 000 DH',
      message: 'Ftour familial, cuisine marocaine traditionnelle, harira, bastilla, etc.',
      status: 'done',
      items: [
        { desc: 'Buffet Ftour complet', qty: 80, unit: 55, total: 4400 },
        { desc: 'Pâtisseries marocaines', qty: 80, unit: 12, total: 960 }
      ],
      total: 5360, deposit: 1500, deposit_paid: true,
      notes: 'Réalisé avec succès le 25/03/2026',
      created_at: '2026-03-01T11:00:00Z'
    },
    {
      nom: 'Imane Cherkaoui', tel: '0655667788', email: 'imane@startup.ma',
      type_event: 'Vente Privée', date: '2026-05-30',
      nb_personnes: 30, budget: '2 000 DH',
      message: 'Vente privée mode, finger food élégant, ambiance chic.',
      status: 'new',
      items: [],
      total: 0, deposit: 0, deposit_paid: false,
      notes: '',
      created_at: '2026-05-08T16:00:00Z'
    }
  ]

  const { data, error } = await supabase.from('quotes').insert(rows).select()
  log('quotes', data, error)
  return data || []
}

// ─────────────────────────────────────────
//  6. INVOICES (factures)
// ─────────────────────────────────────────
async function seedInvoices(enrollments, quotes) {
  console.log('\n📋 Factures...')

  await supabase.from('invoices').delete().neq('id', '00000000-0000-0000-0000-000000000000')

  const enroll = (email) => enrollments.find(e => e.email === email)?.id || null
  const quoteByNom = (nom) => quotes.find(q => q.nom === nom)?.id || null

  const rows = [
    {
      type: 'cantine', enroll_id: enroll('fatima.benali@gmail.com'),
      client_nom: 'Fatima Benali', client_tel: '0612345678',
      issue_date: '2026-03-01', due_date: '2026-03-15', paid_date: '2026-03-12',
      status: 'paid',
      items: [
        { desc: 'Forfait mensuel Cantine — 2 enfants', qty: 1, unit: 1376, total: 1376 },
        { desc: 'Réduction fratrie 10%', qty: 1, unit: -138, total: -138 }
      ],
      subtotal: 1376, discount: 138, total: 1238
    },
    {
      type: 'cantine', enroll_id: enroll('nadia.alami@gmail.com'),
      client_nom: 'Nadia Alami', client_tel: '0655443322',
      issue_date: '2026-02-20', due_date: '2026-03-05', paid_date: '2026-02-28',
      status: 'paid',
      items: [
        { desc: 'Forfait trimestriel Cantine — 3 enfants', qty: 1, unit: 6600, total: 6600 },
        { desc: 'Réduction fratrie 20%', qty: 1, unit: -1320, total: -1320 },
        { desc: 'Réduction fidélité client', qty: 1, unit: -220, total: -220 }
      ],
      subtotal: 6600, discount: 1540, total: 4620
    },
    {
      type: 'evenement', quote_id: quoteByNom('Rachid Amrani'),
      client_nom: 'Rachid Amrani', client_tel: '0661234567',
      issue_date: '2026-04-14', due_date: '2026-05-14', paid_date: null,
      status: 'partial',
      items: [
        { desc: 'Buffet marocain complet x120 personnes', qty: 120, unit: 45, total: 5400 },
        { desc: 'Cocktail dînatoire x120 personnes', qty: 120, unit: 22, total: 2640 },
        { desc: 'Décoration et mise en place', qty: 1, unit: 960, total: 960 }
      ],
      subtotal: 9000, discount: 0, total: 9000,
      deposit: 2500, deposit_paid: true,
      notes: 'Mariage 14 juin 2026 — Acompte 2500 DH reçu'
    },
    {
      type: 'cantine', enroll_id: enroll('khalid.ouchane@gmail.com'),
      client_nom: 'Khalid Ouchane', client_tel: '0699887766',
      issue_date: '2026-04-15', due_date: '2026-04-30', paid_date: null,
      status: 'pending',
      items: [
        { desc: 'Forfait semaine Cantine — 1 enfant', qty: 1, unit: 176, total: 176 }
      ],
      subtotal: 176, discount: 0, total: 176
    },
    {
      type: 'cantine', enroll_id: enroll('youssef.tazi@gmail.com'),
      client_nom: 'Youssef Tazi', client_tel: '0677889900',
      issue_date: '2026-03-10', due_date: '2026-03-25', paid_date: '2026-03-20',
      status: 'paid',
      items: [
        { desc: 'Forfait mensuel Cantine — 2 enfants', qty: 1, unit: 1376, total: 1376 },
        { desc: 'Réduction fratrie 10%', qty: 1, unit: -138, total: -138 }
      ],
      subtotal: 1376, discount: 138, total: 1238
    }
  ]

  const { data, error } = await supabase.from('invoices').insert(rows).select()
  log('invoices', data, error)
  return data || []
}

// ─────────────────────────────────────────
//  7. STOCK
// ─────────────────────────────────────────
async function seedStock() {
  console.log('\n📋 Stock...')

  await supabase.from('stock').delete().neq('id', '00000000-0000-0000-0000-000000000000')

  const rows = [
    { name: 'Poulet frais',        category: 'Protéines',         unit: 'kg',    qty: 8,   min_qty: 10,  cost_unit: 48,  supplier: 'Chez Hassan Marché' },
    { name: 'Riz basmati',         category: 'Féculents',         unit: 'kg',    qty: 22,  min_qty: 8,   cost_unit: 18,  supplier: 'Grossiste Agadir' },
    { name: 'Pâtes variées',       category: 'Féculents',         unit: 'kg',    qty: 15,  min_qty: 5,   cost_unit: 12,  supplier: 'Grossiste Agadir' },
    { name: 'Tomates fraîches',    category: 'Légumes',           unit: 'kg',    qty: 4,   min_qty: 5,   cost_unit: 8,   supplier: 'Marché Agadir' },
    { name: 'Pommes de terre',     category: 'Légumes',           unit: 'kg',    qty: 30,  min_qty: 10,  cost_unit: 5,   supplier: 'Marché Agadir' },
    { name: 'Oignons',             category: 'Légumes',           unit: 'kg',    qty: 12,  min_qty: 5,   cost_unit: 4,   supplier: 'Marché Agadir' },
    { name: "Huile d'olive",       category: 'Condiments',        unit: 'L',     qty: 3,   min_qty: 4,   cost_unit: 65,  supplier: 'Coopérative Tiznit' },
    { name: 'Farine',              category: 'Épicerie',          unit: 'kg',    qty: 18,  min_qty: 10,  cost_unit: 9,   supplier: 'Grossiste Agadir' },
    { name: 'Filet de poisson',    category: 'Protéines',         unit: 'kg',    qty: 3,   min_qty: 6,   cost_unit: 65,  supplier: 'Marché poissons Agadir' },
    { name: 'Œufs frais',          category: 'Protéines',         unit: 'unité', qty: 120, min_qty: 60,  cost_unit: 1.5, supplier: 'Ferme locale' },
    { name: 'Fromage râpé',        category: 'Produits laitiers', unit: 'kg',    qty: 2,   min_qty: 2,   cost_unit: 85,  supplier: 'Centrale laitière' },
    { name: 'Citrons',             category: 'Fruits',            unit: 'kg',    qty: 5,   min_qty: 3,   cost_unit: 10,  supplier: 'Marché Agadir' },
    { name: 'Herbes fraîches',     category: 'Condiments',        unit: 'botte', qty: 8,   min_qty: 5,   cost_unit: 8,   supplier: 'Marché Agadir' },
    { name: 'Boîtes repas noires', category: 'Emballages',        unit: 'unité', qty: 150, min_qty: 100, cost_unit: 2.5, supplier: 'Fournisseur emballages' },
    { name: 'Sacs kraft Just Koul',category: 'Emballages',        unit: 'unité', qty: 80,  min_qty: 50,  cost_unit: 3,   supplier: 'Fournisseur emballages' }
  ]

  const { data, error } = await supabase.from('stock').insert(rows).select()
  log('stock', data, error)
  return data || []
}

// ─────────────────────────────────────────
//  8. TASKS (tâches équipe)
// ─────────────────────────────────────────
async function seedTasks(team) {
  console.log('\n📋 Tâches...')

  await supabase.from('tasks').delete().neq('id', '00000000-0000-0000-0000-000000000000')

  const byPrenom = (p) => team.find(m => m.prenom === p)?.id || null

  const rows = [
    {
      title: 'Préparer menus semaine 20',
      assignee: byPrenom('Aicha'),
      due_date: '2026-05-12', status: 'pending', priority: 'high'
    },
    {
      title: 'Commander poulet fournisseur Hassan',
      assignee: byPrenom('Leila'),
      due_date: '2026-05-12', status: 'pending', priority: 'high'
    },
    {
      title: 'Livraisons Al Hanane + Al Inbihat',
      assignee: byPrenom('Omar'),
      due_date: '2026-05-12', status: 'in_progress', priority: 'high'
    },
    {
      title: 'Préparer devis mariage Amrani',
      assignee: byPrenom('Leila'),
      due_date: '2026-05-13', status: 'done', priority: 'medium'
    },
    {
      title: 'Inventaire stocks fin de semaine',
      assignee: byPrenom('Aicha'),
      due_date: '2026-05-14', status: 'pending', priority: 'medium'
    },
    {
      title: 'Appeler fournisseur emballages',
      assignee: byPrenom('Leila'),
      due_date: '2026-05-13', status: 'pending', priority: 'low'
    }
  ]

  const { data, error } = await supabase.from('tasks').insert(rows).select()
  log('tasks', data, error)
  return data || []
}

// ─────────────────────────────────────────
//  9. MENUS MENSUELS
// ─────────────────────────────────────────
async function seedMonthMenus() {
  console.log('\n📋 Menus mensuels...')

  // Supprimer uniquement les mois concernés
  await supabase.from('month_menus').delete().in('month', [4, 5])

  const rows = [
    {
      month: 4, year: 2026, label: 'Menu Avril 2026',
      weeks: [
        { lundi: 'Poulet rôti & riz pilaf', mardi: 'Lasagnes maison', mercredi: 'Filet de poisson & purée', jeudi: 'Tajine légumes & couscous' },
        { lundi: 'Pasta bolognaise', mardi: 'Brochettes & frites', mercredi: 'Omelette & salade', jeudi: 'Riz aux légumes & poulet' },
        { lundi: 'Vacances', mardi: 'Vacances', mercredi: 'Vacances', jeudi: 'Vacances' },
        { lundi: 'Cordon bleu & purée', mardi: 'Spaghetti aux crevettes', mercredi: 'Tajine kefta', jeudi: 'Riz cantonais & poulet' }
      ]
    },
    {
      month: 5, year: 2026, label: 'Menu Mai 2026',
      weeks: [
        { lundi: 'Poulet bbq & frites', mardi: 'Lasagnes végétariennes', mercredi: 'Poisson pané & riz', jeudi: 'Tajine aux pruneaux' },
        { lundi: 'Penne arrabbiata', mardi: 'Escalope & purée', mercredi: 'Briouat poulet & salade', jeudi: 'Couscous du vendredi' },
        { lundi: 'Poulet tikka & riz', mardi: 'Gratin dauphinois', mercredi: 'Pasta au saumon', jeudi: 'Tajine olives & citron' },
        { lundi: 'Burger maison & salade', mardi: 'Macaroni gratinés', mercredi: 'Poulet rôti & légumes', jeudi: 'Couscous kefta' }
      ]
    }
  ]

  const { data, error } = await supabase.from('month_menus').insert(rows).select()
  log('month_menus', data, error)
  return data || []
}

// ─────────────────────────────────────────
//  10. REVIEWS (avis clients)
// ─────────────────────────────────────────
async function seedReviews(enrollments) {
  console.log('\n📋 Avis clients...')

  await supabase.from('reviews').delete().neq('id', '00000000-0000-0000-0000-000000000000')

  const enroll = (email) => enrollments.find(e => e.email === email)?.id || null

  const rows = [
    {
      enroll_id: enroll('fatima.benali@gmail.com'),
      parent_nom: 'Fatima B.', rating: 5,
      text: "Les enfants adorent les repas chaque jour ! Tout est frais, varié et délicieux. Mes deux enfants rentrent de l'école en parlant du menu. Bravo Just Koul pour cette belle initiative à Agadir !",
      status: 'approved', date: '2026-04-10'
    },
    {
      enroll_id: enroll('nadia.alami@gmail.com'),
      parent_nom: 'Nadia A.', rating: 5,
      text: "Mes 3 enfants sont ravis chaque jour. La qualité est constante, les portions généreuses et les menus vraiment variés. Le service de livraison est ponctuel et souriant. Je recommande vivement !",
      status: 'approved', date: '2026-03-25'
    },
    {
      enroll_id: enroll('youssef.tazi@gmail.com'),
      parent_nom: 'Youssef T.', rating: 4,
      text: "Très bon service, repas équilibrés et livrés à l'heure. Mon fils réclame le poulet rôti tous les lundis ! La formule mensuelle est vraiment avantageuse pour les familles.",
      status: 'approved', date: '2026-04-02'
    },
    {
      enroll_id: null,
      parent_nom: 'Houda M.', rating: 5,
      text: "Enfin une vraie cantine de qualité à Agadir ! Produits frais, cuisine faite maison, équipe réactive. En plus le hub parents est super pratique pour suivre les menus et les livraisons.",
      status: 'approved', date: '2026-04-20'
    },
    {
      enroll_id: enroll('khalid.ouchane@gmail.com'),
      parent_nom: 'Khalid O.', rating: 4,
      text: "Très satisfait du service. Les repas sont bons et mon fils mange mieux qu'avant. Je recommande la formule hebdomadaire pour commencer.",
      status: 'pending', date: '2026-05-01'
    }
  ]

  const { data, error } = await supabase.from('reviews').insert(rows).select()
  log('reviews', data, error)
  return data || []
}

// ─────────────────────────────────────────
//  11. GALLERY
// ─────────────────────────────────────────
async function seedGallery() {
  console.log('\n📋 Galerie...')

  await supabase.from('gallery').delete().neq('id', '00000000-0000-0000-0000-000000000000')

  const rows = [
    { label: 'Buffet mariage Agadir — Juin 2026',     url: '', date: '2026-04-14' },
    { label: 'Poulet rôti & riz pilaf — Menu du lundi', url: '', date: '2026-04-07' },
    { label: 'Ftour Ramadan — Famille Berrada',         url: '', date: '2026-03-25' },
    { label: 'Lasagnes maison — Menu du mardi',         url: '', date: '2026-04-08' },
    { label: 'Cocktail dînatoire corporate',            url: '', date: '2026-03-15' },
    { label: 'Tajine légumes & couscous',               url: '', date: '2026-04-10' }
  ]

  const { data, error } = await supabase.from('gallery').insert(rows).select()
  log('gallery', data, error)
  return data || []
}

// ─────────────────────────────────────────
//  MAIN
// ─────────────────────────────────────────
async function main() {
  console.log('═══════════════════════════════════════')
  console.log('  JUST KOUL — Seed données démo')
  console.log('═══════════════════════════════════════')

  try {
    const team        = await seedTeam()
    const enrollments = await seedEnrollments()
    await seedParentAccounts(enrollments)
    await seedOrders(enrollments)
    const quotes      = await seedQuotes()
    await seedInvoices(enrollments, quotes)
    await seedStock()
    await seedTasks(team)
    await seedMonthMenus()
    await seedReviews(enrollments)
    await seedGallery()

    console.log('\n═══════════════════════════════════════')
    console.log('  Seed terminé.')
    console.log('  Vérifier dans Supabase Table Editor.')
    console.log('═══════════════════════════════════════\n')
  } catch (err) {
    console.error('\n✗ Erreur inattendue :', err.message)
    process.exit(1)
  }
}

main()
