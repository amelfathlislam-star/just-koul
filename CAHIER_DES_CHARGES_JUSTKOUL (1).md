# 📋 CAHIER DES CHARGES — JUST KOUL HUB
## Application Web de Gestion de Traiteur Scolaire & Événementiel
**Version :** 1.0 | **Année :** 2026 | **Ville :** Agadir, Maroc  
**Stack :** React + Vite + Framer Motion + Supabase + Vercel  
**Fichier source :** `src/App.jsx`  
**Repo GitHub :** `https://github.com/amelfathlislam-star/just-koul`  
**URL production :** `https://just-koul.vercel.app`

---

## 1. PRÉSENTATION DU PROJET

Just Koul est un traiteur basé à Agadir (Maroc) proposant deux activités :
1. **Cantine scolaire** : Livraison de repas frais du lundi au jeudi directement dans les écoles
2. **Buffets événementiels** : Mariages, anniversaires, corporate, Ftour Ramadan, etc.

L'application est un **hub professionnel complet** qui centralise :
- Le site public de présentation et de commande
- Un espace parent pour gérer les repas des enfants
- Un espace admin pour piloter toute l'activité
- Un espace livreur pour valider les livraisons

---

## 2. DESIGN & IDENTITÉ VISUELLE

### Palette de couleurs
```
Crème principal :   #FDF8EE
Crème clair :       #FAF4E4
Or/Gold :           #C8873A
Or clair :          #E8A555
Vert foncé :        #2C4A1E
Vert clair :        #3D6B2C
Marron :            #7B4F2E
Texte principal :   #2A1F14
Texte secondaire :  #6B5240
Blanc :             #FFFFFF
Carte :             #FFFDF5
Rouge :             #C0392B
Bleu :              #2563EB
Orange :            #D97706
Violet :            #7C3AED
Teal :              #0D9488
Sidebar :           #111A0A
```

### Typographie
- **Titres** : Playfair Display (serif), Google Fonts
- **Corps** : Nunito (sans-serif), Google Fonts

### Logo Just Koul
- SVG custom : assiette ronde avec smiley, fourchette à gauche, cuillère à droite
- Texte "JUST" en vert + "KOUL" en or
- Sous-titre : "Eat · Enjoy · Repeat"
- Le logo doit apparaître dans la nav, le footer, les espaces connectés

### Style général
- Animations Framer Motion professionnelles sur toutes les sections
- Cartes avec ombres douces, bordures subtiles
- Hover effects sur tous les éléments interactifs
- Transitions de pages fluides (AnimatePresence)
- Sidebar admin rétractable (collapsed/expanded)

---

## 3. ARCHITECTURE DE L'APPLICATION

```
App.jsx
├── Site Public (non connecté)
│   ├── Navigation fixe avec logo + liens + bouton "Mon espace"
│   ├── Section Hero (animation professionnelle)
│   ├── Strip catégories (Cantine / Buffets / Anniversaires / Corporate / Ftour / Mon espace)
│   ├── Section Cantine scolaire (menus + tarifs)
│   ├── Section Buffets & Événements
│   ├── Section Galerie & Avis
│   ├── Section Commander (formulaire cantine + formulaire devis)
│   └── Section Contact + Footer
│
├── Modal de connexion (multi-écrans)
│   ├── Choix du rôle (Parent / Admin / Livreur)
│   ├── Connexion parent (email + mot de passe)
│   ├── Inscription parent (formulaire complet)
│   ├── Vérification email (code 6 chiffres)
│   ├── Mot de passe oublié (3 étapes)
│   ├── Connexion Admin (mot de passe)
│   └── Connexion Livreur (mot de passe)
│
├── Espace Admin (11 onglets, sidebar rétractable)
│   ├── Dashboard
│   ├── Commandes
│   ├── Clients
│   ├── Factures
│   ├── Paiements
│   ├── Stocks
│   ├── Équipe
│   ├── Devis événements
│   ├── Menus
│   ├── Galerie
│   └── Avis
│
├── Espace Parents (6 onglets)
│   ├── Accueil / Dashboard
│   ├── Mon compte
│   ├── Menus
│   ├── Mes commandes
│   ├── Paiement
│   └── Mon avis
│
├── Espace Livreur
│   ├── Liste livraisons du jour
│   ├── Validation avec heure auto
│   └── Historique
│
└── Chatbot IA (bouton flottant, FAQ + API Claude)
```

---

## 4. SITE PUBLIC — DÉTAIL PAR SECTION

### 4.1 Navigation
- Logo Just Koul SVG (cliquable → retour accueil)
- Liens : Accueil / Cantine scolaire / Buffets / Galerie / Commander / Contact
- Lien actif mis en évidence (underline animé avec Framer Motion layoutId)
- Badge "📍 Agadir" affiché dans la nav
- Bouton "Mon espace →" (vert, arrondi, shadow)
- Navigation responsive : hamburger menu sur mobile
- Fond transparent au top → blanc/blur au scroll

### 4.2 Section Hero
- Layout 2 colonnes : texte à gauche, visuel à droite
- **Titre** : "Des repas faits **avec amour**, livrés avec soin"
- **Sous-titre** : description de l'activité Just Koul Agadir
- **2 boutons CTA** : "🥡 Commander la cantine" + "🎊 Demander un devis"
- **Stats** : 100+ Familles servies / 4 Écoles partenaires / 0% Conservateurs / ★ 4.9 Avis
- **Visuel droit** : Grande cercle vert avec emoji 🍱 animé (rotation ring, emojis qui flottent autour : 🥘 🥗 🍋 🌿 🍳)
- **Cartes flottantes animées** :
  - Carte livraison : "✅ Livraison confirmée · Youssef Benali · 12:15"
  - Carte menu : "⭐ Menu du jour · Poulet rôti & riz pilaf · 49 DH"
  - Bubble rating : "★ 4.9" (pulsation animée)
- **Strip catégories en bas** : Cantine / Buffets & Mariages / Anniversaires / Corporate / Ftour Ramadan / Mon espace (avec bordure animée au hover)

### 4.3 Section Cantine Scolaire
- Titre : "La Cantine Scolaire" avec badge "🏫 Pour vos enfants"
- Description : "Du lundi au jeudi, des repas frais, équilibrés et savoureux..."
- **Sélecteur de jours** (Lundi / Mardi / Mercredi / Jeudi) avec AnimatePresence
- **Carte menu du jour** : emoji du plat animé (spring) + entrée + plat + dessert sur fond coloré
- **Grille tarifs** (4 cartes) :
  - À la commande : 49 DH / 56 DH
  - Forfait semaine : 176 DH / 200 DH
  - Forfait mensuel : 688 DH / 770 DH ⭐ (le plus choisi, badge en avant)
  - Forfait trimestriel : 1 950 DH / 2 200 DH
- Réductions fratrie : 2 enfants -10%, 3 enfants -20%, 4+ enfants -30%
- Livraison incluse pour les 4 écoles, +30 DH autre école

### 4.4 Section Buffets & Événements
- 6 cartes : Mariages & Fiançailles / Corporate / Anniversaires / Ftour Ramadan / Ventes Privées / Cocktails Dînatoires
- Bandeau CTA vert : "Demandez votre devis personnalisé"

### 4.5 Galerie & Avis
- Grille de réalisations (avec badges "Cantine scolaire" / "Événementiel")
- Section avis clients (étoiles, nom, commentaire) — seulement les avis approuvés par l'admin

### 4.6 Commander (formulaire)
- 2 onglets : "🏫 Cantine scolaire" / "🎊 Devis événement"
- **Formulaire Cantine** :
  - Prénom, Nom, Téléphone
  - École (liste : Al Hanane / Al Inbihat / Salsabil / La Chrysalide / Autre +30 DH)
  - Nombre d'enfants
  - Formule
  - Type de repas (Plat+entrée/dessert OU Complet)
  - Jours souhaités (Lundi / Mardi / Mercredi / Jeudi) — cases à cocher stylées
  - Récapitulatif prix calculé en temps réel (avec réduction fratrie visible)
  - Message / Allergies
  - ⚡ **A la soumission : créer une inscription dans la base admin (statut "En attente")**
- **Formulaire Devis** :
  - Prénom, Nom, Téléphone, Email
  - Type d'événement (liste)
  - Date, Nombre de personnes
  - Description libre
  - ⚡ **A la soumission : créer un devis dans la liste admin (statut "Nouveau")**
- Après soumission : écran de confirmation avec WhatsApp clickable

### 4.7 Contact & Footer
- WhatsApp : 06 33 95 87 60 (lien cliquable)
- Instagram cantine : @just_koul
- Instagram buffets : @just_koulbuffet
- Zone livraison : Agadir & environs
- Boutons d'accès aux espaces (Parents / Admin / Livreur)
- Copyright : © 2026 Just Koul · Agadir, Maroc

---

## 5. MODAL DE CONNEXION — AUTH COMPLÈTE

### 5.1 Écran choix du rôle
- 3 options visuelles : Parents / Administration / Livreur
- Hover effect avec bordure colorée animée

### 5.2 Connexion parent
- Champs : Email + Mot de passe (avec bouton voir/cacher 👁️)
- Message d'erreur animé (email non trouvé / mot de passe incorrect / email non vérifié)
- Lien "Mot de passe oublié ?"
- Bouton "Créer mon compte gratuitement"
- Mode démo affiché : `fatima@ex.com` / `parent123`

### 5.3 Inscription parent
- Champs : Prénom, Nom, Email, Téléphone, Mot de passe, Confirmer mot de passe
- Validation en temps réel :
  - Email format valide
  - Mot de passe minimum 6 caractères
  - Mots de passe identiques
  - Email non déjà utilisé
- Mention RGPD/loi 09-08 : données confidentielles, pas de revente
- A la soumission : générer code 6 chiffres → passer à vérification email

### 5.4 Vérification email
- Affichage du code (mode démo) → avec Supabase : envoi email réel via `supabase.auth`
- Champ de saisie du code
- Bouton "Vérifier et accéder à mon espace →"
- Lien "Changer d'email"
- Note expliquant que le code arrivera par email en production

### 5.5 Mot de passe oublié (3 étapes)
- **Étape 1** : Saisir l'email → vérifier qu'il existe → générer code
- **Étape 2** : Saisir le code reçu par email (affiché en démo)
- **Étape 3** : Saisir nouveau mot de passe (min 6 caractères) → confirmer
- **Étape 4** : Écran succès animé 🎉 → bouton "Se connecter"

### 5.6 Connexion Admin
- Mot de passe unique (stocker en variable d'environnement, pas en dur dans le code)
- Mode démo affiché

### 5.7 Connexion Livreur
- Mot de passe unique (stocker en variable d'environnement)
- Mode démo affiché

---

## 6. ESPACE ADMIN — DÉTAIL PAR ONGLET

### Sidebar
- Logo Just Koul en haut
- Bouton collapse/expand (← / →)
- En mode collapsed : icônes seulement + tooltips au hover
- Badges rouges sur les onglets avec actions en attente
- Bouton "🚪 Retour au site" en bas

### 6.1 Dashboard (Tableau de bord)
**KPIs (6 cartes) :**
- 💰 Chiffre d'affaires (factures payées) avec tendance %
- ⏳ En attente de paiement (montant + nb factures)
- 🎊 Devis confirmés (CA événementiel)
- 👨‍👩‍👧 Familles actives / Total inscrits
- 🍱 Repas livrés / commandés du jour
- ⚠️ Alertes stock (nombre d'articles sous le seuil)

**Graphique revenus :** 7 derniers jours (barres CSS animées avec Framer Motion)

**Pipeline livraisons du jour :**
- Commandées / En route / Livrées / Problèmes
- Barres de progression animées

**3 colonnes en bas :**
- Alertes stock (articles à commander)
- Équipe aujourd'hui (statut actif/congé/malade)
- Activité récente (dernières actions)

**Tâches en cours :** grille avec assignee, priorité (rouge/jaune), statut

### 6.2 Commandes
- **Bouton "+ Nouveau client"** : formulaire admin pour créer une inscription directement
- Filtres : Toutes / En attente / Validées + barre de recherche (nom, tél)
- **Stats rapides** : Total / En attente / Validées / Enfants total
- **Tableau** : Client, École, Enfants, Formule, Montant, Statut, Actions
- **Actions** : Valider ✓ / Refuser ✕ (pour inscriptions en attente)
- **Modal détail** : toutes les infos du client + recap prix + boutons action

**Formulaire ajout client (modal) :**
- Prénom, Nom, Téléphone, Email
- École + (si "Autre" : champ texte nom de l'école)
- Nombre d'enfants
- Formule
- Type de repas
- Jours cochés
- Méthode de paiement
- Récapitulatif prix calculé en temps réel
- Notes / allergies
- Statut créé directement en "Validé" (car ajout manuel par admin)

### 6.3 Clients
- KPIs : Familles inscrites / Enfants total / Abonnements actifs / CA cantine
- Fiches clients avec photo initiale, badge fratrie, statut paiement
- Suivi repas par famille (livrés / commandés)
- Barre de recherche

### 6.4 Factures
- **Filtres** : Toutes / En attente / Acompte / Payées
- **KPIs** : Total facturé / Payées / En attente / Taux de recouvrement %
- **Tableau** : N° Facture, Client, Type (Cantine/Événement), Montant, Émise le, Échéance, Statut, Actions
- **Modal détail** : tableau des lignes, totaux, réductions, acompte
- **Actions** : Marquer comme payée + **Télécharger en PDF** (pas .txt)
- **Génération PDF** : en-tête Just Koul avec logo, coordonnées, RIB, tableau des lignes, total, mention légale

### 6.5 Paiements
- Tableau statuts de paiement par famille
- Actions : Marquer payé / Annuler
- KPIs : Payés / En attente / Total encaissé
- Méthode de paiement (virement / espèces)

### 6.6 Stocks
- **KPIs** : Articles en stock / Alertes rupture / Valeur totale stock / Mis à jour aujourd'hui
- **Filtres par catégorie** : Tous / Protéines / Légumes / Féculents / Épicerie / Condiments / Fruits / Produits laitiers / Emballages
- **Tableau** : Article, Catégorie, Stock actuel (avec +/-), Minimum, Statut (OK/Bas/Critique), Prix unitaire, Fournisseur, Valeur, Actions
- Couleurs de statut : vert (OK), orange (proche du minimum), rouge (en dessous)
- **Bouton +/- direct** dans le tableau pour ajuster rapidement
- **CRUD complet** : Ajouter / Modifier / Supprimer
- **Alerte stock bas** → notification admin (voir section Notifications)

**15 articles initiaux :**
Poulet frais, Riz basmati, Pâtes, Tomates, Pommes de terre, Oignons, Huile d'olive, Farine, Filet de poisson, Œufs, Fromage râpé, Citrons, Herbes fraîches, Boîtes repas noires, Sacs kraft

### 6.7 Équipe
**3 vues (onglets internes) :**

**Vue Équipe :**
- Cards par membre : avatar emoji, nom, rôle, tél, badge salaire, jours travaillés, note
- Boutons statut : ✅ Actif / 🏖️ Congé / 🤒 Malade
- KPIs : Total équipe / Actifs / Congés / Masse salariale mensuelle

**Vue Planning hebdomadaire :**
- Tableau : Membre / Rôle / Lundi / Mardi / Mercredi / Jeudi / Vendredi / Heures/sem
- Cases ✅ ou — selon planning

**Vue Tâches :**
- Liste des tâches éditable inline (titre, assignee, statut, date, priorité)
- Bouton "+ Nouvelle tâche"
- Priorité : 🔴 Haute / 🟡 Moyenne / 🟢 Basse
- Statuts : En attente / En cours / Terminé

**Formulaire ajout membre :**
- Prénom, Nom, Rôle, Avatar emoji, Tél, Email, Salaire, Date de début, Jours travaillés, Note

**5 membres initiaux :**
Aicha Benali (Cuisinière), Omar Raji (Livreur), Sara Idrissi (Assistante cuisine), Hamid Cherkaoui (Livreur - congé), Leila Tazi (Commerciale)

### 6.8 Devis Événements
- **Pipeline visuel 5 étapes cliquables** : 📩 Nouveau / 💬 Répondu / ✅ Confirmé / 🏆 Réalisé / ❌ Annulé
- Cliquer sur une étape → filtrer la liste
- **KPIs** : Revenus événements confirmés / Total devis reçus
- **Liste des devis** : nom, tél, email, type événement, date, nb personnes, montant estimé, statut
- **Dropdown statut** directement dans la carte
- **Bouton WhatsApp direct** (lien wa.me)
- **Modal détail** : tableau des lignes (description, quantité, prix unitaire, total), total + acompte, notes
- Boutons : Marquer répondu / Confirmer / Réalisé / Annuler / Contacter

### 6.9 Menus
- **2 menus mensuels** (Avril 2025, Mai 2025 — à mettre à jour en 2026)
- **Création d'un nouveau menu** : choisir mois + année, remplir 4 semaines × 4 jours
- Tableau d'affichage : Semaine / Lundi / Mardi / Mercredi / Jeudi
- Vacances affichées en orange 🏖️
- Bouton "Supprimer" par menu

### 6.10 Galerie
- Ajout de photos avec description et date
- Grille d'affichage avec placeholder
- Bouton "Supprimer" par photo

### 6.11 Avis
- Section "En attente" avec boutons Publier / Rejeter
- Section "Publiés" avec liste des avis approuvés
- Les avis approuvés apparaissent sur le site public

---

## 7. ESPACE PARENTS — DÉTAIL

### Logique d'accès
- Un compte parent = un email + mot de passe créé lors de l'inscription
- Si le compte a une inscription liée (enrollmentId) → accès complet aux données
- Si nouveau compte sans inscription encore → écran d'attente avec coordonnées WhatsApp
- Le prénom du compte s'affiche dans le greeting "Bonjour, {prenom} ! 👋"

### 7.1 Accueil / Dashboard
- KPIs : Enfants inscrits / Repas livrés / Repas restants / Statut paiement
- Carte "Ma formule" : école, formule, enfants + classe, total
- Carte "Actions rapides" : voir menus, mes commandes, paiement, avis

### 7.2 Mon compte
- Affichage des infos d'inscription (non modifiable directement — contact WhatsApp pour modifier)
- Fiches enfants avec prénom, nom, classe
- **TÂCHE FUTURE** : Permettre modification classe et allergies directement

### 7.3 Menus
- Tableau des menus mensuels (identique à l'admin, lecture seule)
- Vacances affichées en orange

### 7.4 Mes commandes
- Historique des repas triés par date décroissante
- Colonnes : Enfant / Menu / Date / Livraison (heure ou ⏳) / Note

### 7.5 Paiement
- Récapitulatif de la facture avec réductions
- **RIB Banque Populaire du Maroc** :
  - Banque : Banque Populaire du Maroc
  - Titulaire : Just Koul
  - RIB : 101 810 0004800078601 34
  - Référence : {enrollmentId} — {prenom} {nom}
- Paiement espèces : au livreur ou en centre
- Instruction : confirmer par WhatsApp au 06 33 95 87 60 + envoyer capture
- Si paiement confirmé : badge "Payé ✓" affiché

### 7.6 Mon avis
- Formulaire : étoiles (1 à 5) + commentaire texte
- Soumission → statut "pending" dans la liste admin (modération avant publication)
- Affichage des avis déjà publiés par les autres familles

---

## 8. ESPACE LIVREUR — DÉTAIL

- Header bleu avec titre + date du jour + bouton retour
- **KPIs** : À livrer / Livrées / Taux %
- **Liste livraisons en attente** :
  - Nom de l'enfant (gras)
  - Menu du jour
  - École + zone de livraison
  - Nom parent + téléphone
  - Zone textarea "Remarque"
  - Bouton "✅ Livré" (jaune/or)
- Au clic "Livré" : heure auto enregistrée + notification verte animée en haut
- **Historique du jour** : livraisons confirmées avec heure et note

---

## 9. CHATBOT IA

### Design
- Bouton flottant vert en bas à droite (💬 / ✕ animé rotate 90°)
- Fenêtre slide depuis le bas
- Header vert avec logo Just Koul + "Assistant virtuel · En ligne"
- Messages user (vert, droite) vs assistant (crème, gauche)

### FAQ pré-programmée (10 questions, réponse immédiate sans API)
Mots-clés → réponse formatée :
1. **tarif / prix / formule** → tableau complet des tarifs
2. **école / livraison** → liste des 4 écoles + supplément autre école
3. **menu / plat / semaine / jours** → menu de la semaine
4. **paiement / virement / RIB** → méthodes + RIB complet
5. **allergie / halal / régime** → engagement qualité + procédure
6. **inscri / comment / démarrer** → étapes d'inscription
7. **horaire / heure / quand** → livraison 11h30-13h lundi-jeudi
8. **buffet / mariage / événement** → liste des types + devis
9. **contact / WhatsApp / Instagram** → toutes les coordonnées
10. **qualité / frais / maison** → engagement qualité

### Boutons raccourcis FAQ
- 💰 Tarifs / 🍽️ Menus / 🏫 Écoles / 💳 Paiement

### API Claude (si pas de FAQ match)
- Modèle : claude-sonnet-4-20250514
- Clé API en variable d'environnement (VITE_ANTHROPIC_API_KEY)
- System prompt complet avec toutes les infos Just Koul

---

## 10. DONNÉES MÉTIER INITIALES

### Tarification Cantine
| Formule | Plat + entrée/dessert | Complet (E+P+D) |
|---|---|---|
| À la commande | 49 DH | 56 DH |
| Semaine (4 repas) | 176 DH | 200 DH |
| Mensuel (16 repas) | 688 DH | 770 DH |
| Trimestriel | 1 950 DH | 2 200 DH |

### Réductions fratrie
- 2 enfants : -10%
- 3 enfants : -20%
- 4 enfants et plus : -30%

### Écoles desservies
- École Al Hanane (Agadir) — inclus
- École Al Inbihat (Agadir) — inclus
- École Salsabil (Agadir) — inclus
- La Chrysalide (Agadir) — inclus
- Autre école — +30 DH

### Jours de livraison
Lundi, Mardi, Mercredi, Jeudi (pas le vendredi)

### Méthodes de paiement acceptées
- Virement bancaire Banque Populaire du Maroc
- Espèces (au livreur ou en centre)
- ❌ Pas de paiement par carte

### Contacts
- WhatsApp : 06 33 95 87 60
- Instagram cantine : @just_koul
- Instagram buffets : @just_koulbuffet

---

## 11. TÂCHES À RÉALISER — PHASE PAR PHASE

---

### 🔴 PHASE 1 — AUTHENTIFICATION & SÉCURITÉ (URGENT)

#### 1.1 Inscription parent (FAIT en partie — à compléter avec Supabase)
- [x] Formulaire inscription : prénom, nom, email, tél, mot de passe, confirmation
- [x] Validation : format email, min 6 caractères, mots de passe identiques, email unique
- [x] Génération code 6 chiffres
- [ ] **Envoi réel de l'email** via Supabase Auth ou Resend.io
- [x] Écran vérification avec saisie du code
- [x] Activation du compte après vérification

#### 1.2 Connexion parent
- [x] Login email + mot de passe
- [x] Icône voir/cacher le mot de passe
- [x] Messages d'erreur précis et animés
- [ ] **Session persistante** : stocker dans localStorage/Supabase session
- [ ] **Expiration de session** : déconnexion automatique après 24h d'inactivité

#### 1.3 Récupération mot de passe
- [x] Étape 1 : saisir email → vérifier existence
- [x] Étape 2 : code reçu par email (affiché en démo)
- [ ] **Envoi réel de l'email de récupération** via Supabase
- [x] Étape 3 : nouveau mot de passe
- [x] Étape 4 : confirmation succès

#### 1.4 Sécurité des mots de passe staff
- [ ] **NE PAS stocker les mots de passe admin/livreur en clair dans le code**
- [ ] Utiliser des variables d'environnement : `VITE_ADMIN_PASSWORD` et `VITE_LIVREUR_PASSWORD`
- [ ] Créer fichier `.env.local` (ne jamais commit sur GitHub)
- [ ] Ajouter `.env.local` dans `.gitignore`
- [ ] Hacher idéalement avec bcrypt (ou utiliser Supabase Auth pour tous)

#### 1.5 Clé API Chatbot
- [ ] Créer variable `VITE_ANTHROPIC_API_KEY` dans `.env.local`
- [ ] Remplacer toute référence hardcodée dans le code
- [ ] La clé ne doit JAMAIS apparaître dans le code source

#### 1.6 Création fichier .env.local
```
VITE_ANTHROPIC_API_KEY=sk-ant-xxxxx
VITE_ADMIN_PASSWORD=votre_mot_de_passe_admin_securise
VITE_LIVREUR_PASSWORD=votre_mot_de_passe_livreur
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyxxxxx
```

---

### 🔴 PHASE 2 — PERSISTANCE DES DONNÉES (SUPABASE) (URGENT)

> ⚠️ Actuellement toutes les données sont en mémoire RAM. Au rechargement de la page, tout disparaît. C'est le problème le plus critique.

#### 2.1 Créer le projet Supabase
- Aller sur supabase.com → New Project → "just-koul" → région Europe (ou US East)
- Récupérer l'URL et la clé anon key → mettre dans `.env.local`
- Installer : `npm install @supabase/supabase-js`
- Créer `src/supabaseClient.js` :
```javascript
import { createClient } from '@supabase/supabase-js'
export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)
```

#### 2.2 Structure des tables Supabase

**Table `parent_accounts`**
```sql
id UUID PRIMARY KEY DEFAULT uuid_generate_v4()
prenom TEXT NOT NULL
nom TEXT NOT NULL
email TEXT UNIQUE NOT NULL
tel TEXT
password_hash TEXT (si auth custom) ou utiliser Supabase Auth
status TEXT DEFAULT 'pending_verification' -- pending_verification | verified
enrollment_id UUID REFERENCES enrollments(id)
created_at TIMESTAMPTZ DEFAULT NOW()
```

**Table `enrollments`** (inscriptions cantine)
```sql
id UUID PRIMARY KEY DEFAULT uuid_generate_v4()
parent_nom TEXT
parent_prenom TEXT
tel TEXT
email TEXT
school TEXT
autre_ecole TEXT
children JSONB -- [{nom, prenom, classe}]
formule TEXT -- unite | semaine | mensuel | trimestriel
repas_type TEXT -- pe | cpd
days JSONB -- {lundi, mardi, mercredi, jeudi}
status TEXT DEFAULT 'pending' -- pending | validated | rejected
pay_status TEXT DEFAULT 'pending' -- pending | paid
pay_method TEXT
amount NUMERIC
discount NUMERIC
delivery NUMERIC
invoice_validated BOOLEAN DEFAULT false
notes TEXT
created_at TIMESTAMPTZ DEFAULT NOW()
```

**Table `orders`** (livraisons)
```sql
id UUID PRIMARY KEY DEFAULT uuid_generate_v4()
enroll_id UUID REFERENCES enrollments(id)
date DATE
menu TEXT
delivered BOOLEAN DEFAULT false
delivered_at TEXT
note TEXT
child_name TEXT
created_at TIMESTAMPTZ DEFAULT NOW()
```

**Table `invoices`** (factures)
```sql
id UUID PRIMARY KEY DEFAULT uuid_generate_v4()
enroll_id UUID REFERENCES enrollments(id)
quote_id UUID REFERENCES quotes(id)
type TEXT -- cantine | evenement
client_nom TEXT
client_tel TEXT
issue_date DATE
due_date DATE
paid_date DATE
status TEXT -- pending | paid | partial | overdue
items JSONB -- [{desc, qty, unit, total}]
subtotal NUMERIC
discount NUMERIC
total NUMERIC
deposit NUMERIC
deposit_paid BOOLEAN DEFAULT false
notes TEXT
```

**Table `quotes`** (devis événements)
```sql
id UUID PRIMARY KEY DEFAULT uuid_generate_v4()
nom TEXT
tel TEXT
email TEXT
type_event TEXT
date DATE
nb_personnes INTEGER
budget TEXT
message TEXT
status TEXT DEFAULT 'new' -- new | replied | confirmed | done | cancelled
items JSONB
total NUMERIC
deposit NUMERIC
deposit_paid BOOLEAN DEFAULT false
notes TEXT
created_at TIMESTAMPTZ DEFAULT NOW()
```

**Table `stock`**
```sql
id UUID PRIMARY KEY DEFAULT uuid_generate_v4()
name TEXT
category TEXT
unit TEXT
qty NUMERIC
min_qty NUMERIC
cost_unit NUMERIC
supplier TEXT
last_updated TIMESTAMPTZ DEFAULT NOW()
```

**Table `team`**
```sql
id UUID PRIMARY KEY DEFAULT uuid_generate_v4()
nom TEXT
prenom TEXT
role TEXT
tel TEXT
email TEXT
status TEXT -- active | off | sick
avatar TEXT
schedule JSONB
salary NUMERIC
start_date DATE
note TEXT
```

**Table `tasks`**
```sql
id UUID PRIMARY KEY DEFAULT uuid_generate_v4()
title TEXT
assignee UUID REFERENCES team(id)
due_date DATE
status TEXT -- pending | in_progress | done
priority TEXT -- high | medium | low
```

**Table `month_menus`**
```sql
id UUID PRIMARY KEY DEFAULT uuid_generate_v4()
month INTEGER
year INTEGER
label TEXT
weeks JSONB -- [{lundi, mardi, mercredi, jeudi}] × 4 semaines
```

**Table `reviews`**
```sql
id UUID PRIMARY KEY DEFAULT uuid_generate_v4()
enroll_id UUID REFERENCES enrollments(id)
parent_nom TEXT
rating INTEGER
text TEXT
status TEXT DEFAULT 'pending' -- pending | approved
date DATE DEFAULT NOW()
```

**Table `gallery`**
```sql
id UUID PRIMARY KEY DEFAULT uuid_generate_v4()
url TEXT
label TEXT
date DATE DEFAULT NOW()
```

#### 2.3 Intégration dans l'application
- Remplacer le state `INIT` par des appels Supabase (`supabase.from('table').select()`)
- Utiliser `useEffect` pour charger les données au démarrage
- Remplacer chaque `setData(d=>...)` par un `supabase.from('table').insert/update/delete`
- Utiliser Supabase Realtime pour la synchronisation admin ↔ parents

#### 2.4 Supabase Auth (pour les comptes parents)
- Utiliser `supabase.auth.signUp()` pour l'inscription → email de vérification automatique
- Utiliser `supabase.auth.signInWithPassword()` pour la connexion
- Utiliser `supabase.auth.resetPasswordForEmail()` pour le mot de passe oublié
- Session persistante gérée automatiquement par Supabase
- `supabase.auth.onAuthStateChange()` dans App pour gérer l'état de connexion

---

### 🟠 PHASE 3 — NOTIFICATIONS

#### 3.1 WhatsApp automatique (CallMeBot API — gratuit)
Quand un parent s'inscrit :
- Envoyer un message WhatsApp à l'admin : "Nouvelle inscription : {prenom} {nom} - {formule} - {école}"
- API : `https://api.callmebot.com/whatsapp.php?phone=212XXXXXXXXX&text=...&apikey=...`
- Stocker la clé API dans `.env.local`

#### 3.2 Email de confirmation parent
Après validation de l'inscription par l'admin :
- Envoyer email via Resend.io ou Supabase Edge Function
- Contenu : "Votre inscription est validée ! Voici vos informations + RIB pour le paiement"

#### 3.3 Notification livraison parent
Quand le livreur marque "Livré" :
- SMS ou WhatsApp au parent : "✅ Le repas de {prenom enfant} a été livré à {heure} à {école}"

#### 3.4 Alerte stock bas
Quand un article passe sous le seuil minimum :
- Notification dans le dashboard admin (déjà implémenté visuellement)
- **À ajouter** : email ou WhatsApp à l'admin

---

### 🟠 PHASE 4 — FONCTIONNEL AVANCÉ

#### 4.1 Gestion des vacances scolaires
- Calendrier des jours non livrés (fériés marocains + vacances scolaires)
- Dans l'espace livreur : ne pas afficher de livraisons les jours fériés
- Dans l'espace parent : afficher les jours de fermeture dans le planning
- Dans le formulaire d'inscription : exclure automatiquement les vacances du calcul

**Jours fériés Maroc 2026 (à mettre à jour chaque année) :**
- 1 Jan : Nouvel An
- 11 Jan : Indépendance
- 1 Mai : Fête du Travail
- 30 Juil : Fête du Trône
- 14 Août : Allégeance
- 20 Août : Révolution du Roi
- 21 Août : Fête de la Jeunesse
- 6 Nov : Marche Verte
- 18 Nov : Fête de l'Indépendance
- Dates variables : Aïd Al-Fitr, Aïd Al-Adha, Mawlid, An Hégire

#### 4.2 Bon de livraison imprimable
- Bouton "🖨️ Imprimer la tournée" dans l'espace livreur
- Format A4 : logo Just Koul + date + liste des livraisons avec cases à cocher
- Colonnes : Enfant / École / Classe / Menu / Signature
- Généré avec `window.print()` + CSS `@media print`

#### 4.3 Export Excel de la liste clients
- Bouton "📊 Exporter Excel" dans l'onglet Clients
- Colonnes : Nom, Prénom, Email, Tél, École, Formule, Enfants, Total, Statut paiement, Date inscription
- Utiliser la librairie SheetJS (`npm install xlsx`)

#### 4.4 Statistiques avancées (onglet dédié dans l'admin)
Ajouter un 12ème onglet "📈 Statistiques" :
- Graphique revenus par mois (barres, 12 mois)
- École la plus active (pie chart)
- Formule la plus choisie (donut)
- Taux de fidélisation clients
- Évolution du nombre d'inscriptions
- Pic de commandes par jour de la semaine
- Utiliser la librairie Recharts (déjà disponible dans l'environnement)

#### 4.5 Facturation PDF téléchargeable
- Remplacer la génération de fichier .txt par un vrai PDF
- Utiliser jsPDF (`npm install jspdf`)
- Contenu du PDF :
  - En-tête : Logo Just Koul (SVG converti), Nom, Adresse, Tél, Email, Instagram
  - Bloc client : Nom, Tél, Email
  - N° facture, Date d'émission, Date d'échéance
  - Tableau des lignes : Description / Quantité / Prix unitaire / Total
  - Sous-total, Réductions, Total TTC
  - Statut de paiement
  - RIB : Banque Populaire du Maroc — 101 810 0004800078601 34
  - Pied de page : "Merci de votre confiance · Just Koul · Agadir · 06 33 95 87 60"

#### 4.6 Espace parent — Modifier infos enfant
Dans l'onglet "Mon compte" → section enfants :
- Bouton "Modifier" par enfant
- Champs modifiables : Prénom, Classe, Allergies / Régime alimentaire
- Sauvegarde → mise à jour dans Supabase

---

### 🟡 PHASE 5 — UX & DESIGN

#### 5.1 Version mobile optimisée pour l'admin
- Sidebar en drawer overlay sur mobile (hamburger)
- Tableaux horizontalement scrollables
- Cards empilées sur mobile
- Formulaires en colonne unique sur mobile
- Breakpoints : 768px (tablet), 480px (mobile)

#### 5.2 Animation page d'accueil professionnelle
- Hero : stagger animation sur le texte (mot par mot ou ligne par ligne)
- Compteur animé pour les stats (0 → 100+, 0 → 4.9, etc.)
- Scroll-triggered animations sur chaque section (Framer Motion whileInView)
- Parallax subtil sur le cercle emoji
- Strip catégories : slide in depuis le bas
- Effets hover élaborés sur les cartes buffets

#### 5.3 Page 404 personnalisée
Créer `src/NotFound.jsx` :
- Emoji 🍱 + "404 · Page introuvable"
- Message humoristique : "Ce plat n'est pas au menu aujourd'hui !"
- Bouton "← Retour à l'accueil"
- Fond crème avec animation

#### 5.4 SEO
Modifier `index.html` :
```html
<title>Just Koul — Cantine scolaire & Traiteur Agadir</title>
<meta name="description" content="Just Koul : repas frais livrés à l'école à Agadir du lundi au jeudi. Buffets et traiteur pour événements. Commander en ligne.">
<meta name="keywords" content="cantine scolaire Agadir, traiteur Agadir, livraison repas enfants Agadir, buffet mariage Agadir">
<meta property="og:title" content="Just Koul — Cantine scolaire & Traiteur Agadir">
<meta property="og:description" content="Repas faits maison livrés à l'école. Buffets événementiels sur mesure.">
<meta property="og:image" content="/og-image.jpg">
<meta property="og:url" content="https://just-koul.vercel.app">
<link rel="canonical" href="https://just-koul.vercel.app">
```

---

### 🟡 PHASE 6 — LÉGAL (OBLIGATOIRE AVANT LIVRAISON CLIENT)

#### 6.1 Mentions légales
Page modale ou page dédiée (`/mentions-legales`) :
- Raison sociale : Just Koul
- Forme juridique : Auto-entrepreneur / SARL (à confirmer)
- Siège social : Agadir, Maroc
- Responsable de publication : [Nom du gérant]
- Téléphone : 06 33 95 87 60
- Email de contact
- Hébergeur : Vercel Inc., San Francisco, CA, USA

#### 6.2 CGV (Conditions Générales de Vente)
Inclure :
- Description des services (cantine + événements)
- Tarifs et formules
- Modalités de commande et d'inscription
- Modalités de paiement (virement / espèces)
- Délais de livraison
- Conditions d'annulation (annulation avant J-3 / J-7 selon formule)
- Responsabilité (allergies : obligation de déclaration)
- Litiges : droit applicable marocain

#### 6.3 Politique de confidentialité (loi 09-08 Maroc)
Inclure :
- Données collectées (nom, email, tél, école, informations enfants)
- Finalités du traitement (gestion des inscriptions, facturation, livraisons)
- Base légale (consentement)
- Durée de conservation (durée de l'abonnement + 5 ans comptables)
- Droits des personnes (accès, rectification, suppression)
- Contact CNDP (Commission Nationale de contrôle de la Protection des Données à caractère Personnel)
- Pas de partage avec des tiers

#### 6.4 Cookie Banner
- Bandeau en bas de page au premier chargement
- "Ce site utilise des cookies pour améliorer votre expérience"
- Bouton "Accepter" (vert) + "Refuser" (lien texte)
- Mémoriser le choix dans localStorage
- Cookies utilisés : session auth (nécessaire), analytiques (optionnel)

---

## 12. NOTES TECHNIQUES IMPORTANTES

### Ce qui DOIT aller dans .env.local (ne jamais commit)
```
VITE_ANTHROPIC_API_KEY=
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_ADMIN_PASSWORD=
VITE_LIVREUR_PASSWORD=
VITE_CALLMEBOT_APIKEY=
VITE_WHATSAPP_ADMIN=212633958760
```

### Variables d'environnement sur Vercel
Les variables doivent être ajoutées dans Vercel Dashboard → Project → Settings → Environment Variables

### Librairies déjà installées
- React + Vite
- Framer Motion
- À installer : `@supabase/supabase-js`, `jspdf`, `xlsx`, `recharts`

### Structure de fichiers recommandée
```
src/
├── App.jsx (fichier principal actuel — peut rester monofichier)
├── supabaseClient.js (nouveau)
├── components/ (optionnel si refactoring)
└── hooks/ (optionnel)
public/
├── images/ (vraies photos des plats Just Koul)
├── og-image.jpg (image partage réseaux sociaux)
└── favicon.ico
.env.local (ne pas committer !)
.gitignore (ajouter .env.local)
```

### Année correcte
⚠️ Toutes les mentions de date dans le code et le footer doivent afficher **2026**, pas 2025.
- Footer : `© 2026 Just Koul · Agadir, Maroc`
- Factures : année 2026
- Dates par défaut dans les formulaires : 2026

### RIB Bancaire (à afficher dans toute l'app)
```
Banque : Banque Populaire du Maroc
Titulaire : Just Koul
RIB : 101 810 0004800078601 34
```

---

## 13. ORDRE DE PRIORITÉ RECOMMANDÉ À CLAUDE CODE

```
1. [CRITIQUE] Variables d'environnement (.env.local) + sécuriser les mots de passe
2. [CRITIQUE] Connecter Supabase + créer toutes les tables
3. [CRITIQUE] Migrer toutes les données du state React vers Supabase
4. [CRITIQUE] Supabase Auth pour les comptes parents (inscription + vérif email réel)
5. [IMPORTANT] Notifications WhatsApp (CallMeBot) quand nouveau client
6. [IMPORTANT] Facturation PDF (jsPDF)
7. [IMPORTANT] Export Excel clients (SheetJS)
8. [IMPORTANT] Bon de livraison imprimable
9. [MOYEN] Gestion vacances scolaires automatique
10. [MOYEN] Statistiques avancées (Recharts)
11. [MOYEN] Mobile responsive admin
12. [AVANT LIVRAISON] Pages légales (CGV, mentions légales, politique confidentialité)
13. [AVANT LIVRAISON] Cookie banner
14. [AVANT LIVRAISON] SEO (meta tags index.html)
15. [AVANT LIVRAISON] Page 404 personnalisée
16. [BONUS] Animation hero plus élaborée
17. [BONUS] Modifier infos enfant depuis espace parent
18. [BONUS] Onglet Statistiques avancées dans l'admin
```

---

*Cahier des charges rédigé en 2026 pour le projet Just Koul — Agadir, Maroc*
*Application développée avec React + Vite + Framer Motion + Supabase + Vercel*
