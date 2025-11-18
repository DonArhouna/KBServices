# KB&S - Plateforme E-commerce Agroalimentaire Sénégalaise

## 🌟 À propos du projet

KB&S est une plateforme e-commerce moderne développée pour une entreprise sénégalaise spécialisée dans la transformation de produits agroalimentaires 100% naturels. L'application offre une expérience d'achat complète avec un panneau d'administration avancé pour la gestion des opérations commerciales.

## 🚀 Fonctionnalités principales

### 🛒 Boutique en ligne
- **Catalogue de produits** : Affichage des produits avec images, descriptions et prix
- **Système de panier** : Gestion du panier d'achat avec calcul automatique des totaux
- **Processus de commande** : Formulaire de commande complet avec informations client
- **Catégorisation** : Organisation des produits par catégories

### 👨‍💼 Panneau d'administration
- **Gestion des produits** : Ajout, modification, suppression des produits
- **Gestion des catégories** : Organisation hiérarchique des produits
- **Gestion des commandes** : Suivi et traitement des commandes clients
- **Gestion des devis** : Création et gestion des devis personnalisés
- **Gestion des factures** : Génération et suivi des factures
- **Gestion des stocks** : Suivi des niveaux de stock et alertes automatiques
- **Gestion du contenu** : Modification du contenu du site web

### 📊 Fonctionnalités avancées
- **Génération de PDF** : Factures et devis exportables en PDF
- **Intégration WhatsApp** : Envoi automatique de messages WhatsApp
- **Service d'email** : Notifications automatiques par email
- **Système de stockage** : Gestion des images et fichiers
- **Authentification admin** : Accès sécurisé au panneau d'administration

## 🛠️ Technologies utilisées

### Frontend
- **React 18** : Bibliothèque JavaScript pour l'interface utilisateur
- **TypeScript** : Typage statique pour JavaScript
- **Vite** : Outil de build rapide et moderne
- **Tailwind CSS** : Framework CSS utilitaire
- **shadcn/ui** : Composants UI réutilisables
- **React Router** : Routage côté client
- **React Query** : Gestion des requêtes API

### Backend & Base de données
- **Supabase** : Backend-as-a-Service (Base de données, Authentification, Storage)
- **Prisma** : ORM pour la base de données PostgreSQL
- **Node.js** : Environnement d'exécution JavaScript côté serveur
- **Express.js** : Framework web pour Node.js

### Outils de développement
- **ESLint** : Linting du code JavaScript/TypeScript
- **PostCSS** : Outil de transformation CSS
- **Autoprefixer** : Ajout automatique des préfixes CSS
- **TypeScript Compiler** : Compilation TypeScript

## 📁 Structure du projet

```
KBS/
├── src/
│   ├── components/          # Composants React réutilisables
│   │   ├── ui/             # Composants UI de base (shadcn/ui)
│   │   └── admin/          # Composants du panneau d'administration
│   ├── pages/              # Pages de l'application
│   ├── services/           # Services API et logique métier
│   ├── hooks/              # Hooks React personnalisés
│   ├── context/            # Contextes React (panier, etc.)
│   ├── lib/                # Utilitaires et configurations
│   ├── data/               # Données statiques
│   └── integrations/       # Intégrations externes (Supabase)
├── prisma/                 # Schéma et migrations Prisma
├── supabase/               # Configuration et fonctions Supabase
├── public/                 # Assets statiques
└── server/                 # Serveur Express.js
```

## 🗄️ Modèle de données

Le projet utilise Prisma avec PostgreSQL et comprend les entités suivantes :

- **Categories** : Catégories de produits
- **Products** : Produits avec gestion des stocks
- **StockMovements** : Historique des mouvements de stock
- **StockAlerts** : Alertes de niveau de stock
- **Orders** : Commandes clients
- **OrderItems** : Articles des commandes
- **Invoices** : Factures
- **InvoiceItems** : Articles des factures
- **Quotes** : Devis
- **QuoteItems** : Articles des devis
- **Services** : Services pour les devis
- **SiteContent** : Contenu dynamique du site

## 🚀 Installation et configuration

### Prérequis
- Node.js (version 18 ou supérieure)
- npm ou yarn
- Base de données PostgreSQL (via Supabase)

### Étapes d'installation

1. **Cloner le repository**
   ```bash
   git clone https://github.com/DonArhouna/KBServices.git
   cd KBServices
   ```

2. **Installer les dépendances**
   ```bash
   npm install
   ```

3. **Configuration de l'environnement**
   - Copier le fichier `.env.example` vers `.env`
   - Configurer les variables d'environnement :
     ```env
     DATABASE_URL="postgresql://..."
     SUPABASE_URL="..."
     SUPABASE_ANON_KEY="..."
     ```

4. **Configuration de la base de données**
   ```bash
   # Générer le client Prisma
   npm run db:generate

   # Appliquer les migrations
   npm run db:push
   ```

5. **Démarrer l'application**
   ```bash
   # Mode développement (frontend + serveur)
   npm run dev:full

   # Ou séparément :
   npm run server    # Serveur backend
   npm run dev       # Frontend
   ```

## 📜 Scripts disponibles

- `npm run dev` : Démarre le serveur de développement Vite
- `npm run dev:full` : Démarre simultanément le serveur et le frontend
- `npm run server` : Démarre le serveur Express.js
- `npm run build` : Construit l'application pour la production
- `npm run preview` : Prévisualise la version de production
- `npm run lint` : Vérifie le code avec ESLint
- `npm run db:generate` : Génère le client Prisma
- `npm run db:push` : Applique le schéma Prisma à la base de données
- `npm run db:migrate` : Crée et applique une migration
- `npm run db:studio` : Ouvre Prisma Studio

## 🔧 Configuration

### Variables d'environnement
Créer un fichier `.env` à la racine avec :

```env
# Base de données
DATABASE_URL="postgresql://username:password@localhost:5432/kbs_db"

# Supabase
SUPABASE_URL="https://your-project.supabase.co"
SUPABASE_ANON_KEY="your-anon-key"

# Autres configurations
NODE_ENV="development"
```

### Configuration Supabase
1. Créer un projet sur [Supabase](https://supabase.com)
2. Configurer la base de données PostgreSQL
3. Déployer les fonctions Edge (dans le dossier `supabase/functions/`)
4. Configurer les variables d'environnement

## 🌐 Déploiement

### Via Lovable (recommandé)
1. Ouvrir [Lovable](https://lovable.dev/projects/e299da88-0994-4b9f-bcb9-3fa2cea3fbde)
2. Cliquer sur "Share" → "Publish"
3. Suivre les instructions pour connecter un domaine personnalisé

### Déploiement manuel
1. Construire l'application : `npm run build`
2. Déployer le dossier `dist/` sur votre serveur
3. Configurer le serveur pour servir les fichiers statiques
4. Configurer les variables d'environnement en production

## 👥 Utilisation

### Accès au panneau d'administration
- URL : `/admin`
- Mot de passe par défaut : `kbs2024admin`
- ⚠️ **Important** : Changer le mot de passe en production

### Gestion des produits
1. Se connecter au panneau d'administration
2. Aller dans l'onglet "Produits"
3. Ajouter/modifier/supprimer des produits
4. Gérer les catégories et les niveaux de stock

### Gestion des commandes
1. Les commandes arrivent automatiquement depuis le site
2. Traiter les commandes dans l'onglet "Commandes"
3. Générer des factures depuis les commandes validées

## 🤝 Contribution

1. Fork le projet
2. Créer une branche pour votre fonctionnalité (`git checkout -b feature/AmazingFeature`)
3. Commit vos changements (`git commit -m 'Add some AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

## 📝 Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.

## 📞 Support

Pour toute question ou support technique :
- Email : support@kbs.sn
- Téléphone : +221 XX XXX XX XX
- WhatsApp : +221 XX XXX XX XX

## 🏢 À propos de KB&S

KB&S est une entreprise sénégalaise spécialisée dans la transformation de produits agroalimentaires naturels. Notre mission est de promouvoir les produits locaux de qualité supérieure tout en offrant une expérience d'achat moderne et conviviale.

---

Développé avec ❤️ pour le Sénégal 🇸🇳
