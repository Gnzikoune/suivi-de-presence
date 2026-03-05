# Suivi de Présence - Marketing Digital

Application moderne de suivi de présence développée avec **Next.js**, **Supabase** et **Tailwind CSS**.

## 🚀 Fonctionnalités Clés

- **Système Multi-Rôles** : 
  - **Super Admin** : Gestion complète des utilisateurs, des formations et audit système.
  - **Campus Manager** : Vue globale sur plusieurs formations, statistiques avancées et pilotage campus.
  - **Coach** : Gestion de sa propre formation, appel quotidien et gestion des apprenants.
- **Authentification Sécurisée** : Intégration complète avec Supabase Auth (Email/Mot de passe).
- **Gestion des Formations** : Création dynamique de cohortes et personnalisation des paramètres.
- **Tableau de Bord Dynamique** : Visualisation des taux de présence et d'absentéisme en temps réel via Recharts.
- **Mode Hors-ligne & Responsive** : Optimisé pour une utilisation sur tablette et mobile en salle de cours.

## 🛠️ Stack Technique

- **Framework** : Next.js 14 (App Router)
- **Base de données & Auth** : Supabase (PostgreSQL + RLS)
- **Stylisation** : Tailwind CSS + Lucide React (Icônes)
- **Composants UI** : Radix UI / Shadcn UI
- **Animations** : Framer Motion
- **Typographie** : Outfit (Google Fonts)

## 📦 Structure de la Base de Données

Le projet utilise **Supabase Row Level Security (RLS)** pour garantir l'isolation des données :
- `profiles` : Informations utilisateurs et rôles.
- `students` : Liste des apprenants (liés aux formations).
- `records` : Historique des présences.
- `formations` : Liste des cohortes disponibles.
- `settings` : Paramètres de configuration (dates, labels).

## 📁 Structure du Projet

- `/app` : Routes Next.js, API et pages du tableau de bord.
- `/components` : Bibliothèque de composants UI (Shadcn/UI + Custom).
- `/lib` : Services API, types TypeScript et utilitaires de calcul.
- `/public` : Assets statiques (Logos, Icônes).
- `/styles` : Configurations CSS globales et Tailwind.

## ⚙️ Configuration & Installation

### 1. Variables d'Environnement
Créez un fichier `.env.local` :
```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=votre_url_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre_cle_anon
SUPABASE_SERVICE_ROLE_KEY=votre_cle_admin # Requis pour les invitations Super Admin

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 2. Initialisation de la Base de Données
Pour que le système fonctionne parfaitement, vous devez :
1. Créer les tables `profiles`, `students`, `records`, `formations` et `settings` dans Supabase.
2. Activer le **Row Level Security (RLS)** sur toutes les tables.
3. Installer le trigger SQL pour la synchronisation automatique des profils (voir documentation interne).

## 🚀 Déploiement

Le projet est optimisé pour un déploiement sur **Vercel** :
1. Connectez votre dépôt GitHub à Vercel.
2. Configurez les variables d'environnement dans le dashboard Vercel.
3. Le déploiement est automatique à chaque `git push`.

## 🛡️ Sécurité & Isolation

L'isolation des données est le cœur du projet. Grâce au `user_id` présent sur chaque ligne de la base de données, Supabase filtre automatiquement les résultats. Un coach ne peut en aucun cas voir les élèves d'un confrère, garantissant une confidentialité totale.

## 📈 Monitoring

L'application intègre **Vercel Analytics** pour suivre les performances et l'engagement des utilisateurs en production.
