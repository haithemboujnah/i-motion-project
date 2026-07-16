# 🏋️ I-Motion - Plateforme de Gestion Sportive

![React](https://img.shields.io/badge/React-18-blue)
![Node](https://img.shields.io/badge/Node.js-Express-green)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue)
![FastAPI](https://img.shields.io/badge/FastAPI-ML-success)
![License](https://img.shields.io/badge/License-Academic-orange)

## 📋 Description

I-Motion est une plateforme web complète de gestion de salle de sport et de suivi des performances sportives. Elle permet aux adhérents de gérer leurs séances, suivre leurs performances, recevoir des programmes personnalisés par IA, et interagir avec leur coach. Les coachs peuvent suivre leurs adhérents, gérer les séances et analyser les performances. Les administrateurs disposent d'outils de supervision et d'analyse avancés.

## 🚀 Fonctionnalités Principales

### 👤 Adhérent
- 🔐 **Authentification** - Inscription, connexion, réinitialisation de mot de passe
- 📅 **Séances** - Réservation, annulation, planning, historique
- 📈 **Performances** - Suivi des mesures, IMC, graphiques d'évolution, rapports PDF
- 🤖 **Programmes IA** - Programmes personnalisés avec score de confiance
- 📖 **Exercices** - Bibliothèque complète avec images et instructions
- 🏆 **Gamification** - Points, badges, défis mensuels, classement
- 💬 **Chatbot IA** - Assistant virtuel intelligent
- 🎫 **QR Code** - Génération et pointage
- 🔔 **Notifications** - Rappels de séances, alertes de progression
- 💳 **Abonnement & Paiement** - Gestion des abonnements

### 🧑‍🏫 Coach
- 📊 **Tableau de bord** - Statistiques générales, séances du jour
- 👥 **Adhérents** - Liste, profils, suivi
- ⚠️ **Adhérents à risque** - Détection IA du churn
- 📅 **Séances** - Création, modification, pointage
- 📈 **Performances** - Suivi des adhérents
- 🎫 **QR Code** - Scan et validation de présence
- 💡 **Fidélisation** - Recommandations personnalisées

### 👨‍💼 Administrateur
- 👤 **Utilisateurs** - Gestion complète des comptes
- 📅 **Séances** - Supervision globale
- 💪 **Programmes** - Création et attribution
- 🤖 **IA Churn** - Analyse des désabonnements
- 🏆 **Gamification** - Gestion des badges et défis
- 📊 **BI Dashboard** - Indicateurs clés, graphiques, prévisions
- 💬 **Feedback** - Gestion des réclamations et analyse NLP
- 📤 **Export** - CSV, PDF
- 🌙 **Dark/Light Mode** - Interface adaptative

### 🤖 Intelligence Artificielle
- 📊 Analyse de profil utilisateur
- 🎯 Génération de programmes personnalisés
- 📈 Prédiction de churn
- 💬 Chatbot NLP (compréhension du langage naturel)
- 📋 Analyse de sentiment des feedbacks
- 💡 Recommandations de fidélisation

## 🧠 Modules d'Intelligence Artificielle - I-Motion

### 🤖 1. Recommandation de Programmes Personnalisés

#### Description
Le système analyse le profil de l'adhérent (âge, poids, taille, objectifs et niveau sportif) afin de générer automatiquement un programme d'entraînement personnalisé. Chaque recommandation est accompagnée d'un score de confiance indiquant sa pertinence.

#### Fonctionnalités
- ✅ Génération de programmes selon l'objectif :
  - Perte de poids
  - Prise de masse musculaire
  - Remise en forme
- ✅ Adaptation selon le niveau :
  - Débutant
  - Intermédiaire
  - Avancé
- ✅ Score de confiance (0-100%)
- ✅ Explication des recommandations
- ✅ Planning hebdomadaire détaillé
- ✅ Enrichissement avec la bibliothèque d'exercices

#### Technologie
- **Modèle :** Random Forest Classifier
- **Features :** Âge, poids, taille, IMC, masse grasse, masse musculaire
- **Dataset :** 10 000 données synthétiques
- **Précision :** ~85%


---

### 📈 2. Prédiction de Désabonnement (Churn Prediction)

#### Description
Le système analyse l'activité des adhérents afin de prédire le risque de désabonnement et proposer des actions de fidélisation adaptées.

#### Fonctionnalités
- ✅ Score de risque (0-100%)
- ✅ Classification en 5 niveaux :
  - 🔴 Critique
  - 🟠 Élevé
  - 🟡 Moyen
  - 🟢 Faible
  - ✅ Safe
- ✅ Identification des facteurs de risque
- ✅ Recommandations de fidélisation
- ✅ Prédiction en temps réel
- ✅ Analyse batch des adhérents

#### Données analysées
- 📊 Fréquence des séances
- 📊 Taux d'assiduité
- 📊 Dernière activité
- 📊 Évolution physique
- 📊 Engagement (badges, défis)
- 📊 Suivi des programmes

#### Technologie
- **Modèle :** Random Forest Classifier
- **Features :** 13 caractéristiques
- **Données :** Historique des sessions et performances
- **Précision :** ~75%


---

### 💬 3. Chatbot Intelligent NLP

#### Description
Assistant virtuel capable de comprendre les questions des adhérents en langage naturel et fournir des réponses personnalisées selon leur contexte.

#### Fonctionnalités
- ✅ Compréhension du langage naturel
- ✅ Réponses contextuelles
- ✅ Suggestions de questions
- ✅ Historique des conversations
- ✅ Score de confiance des réponses
- ✅ Support multi-intents

#### Intents supportés
| Intent | Exemple |
|---|---|
| Greeting | Bonjour, Salut |
| Programmes | Mon programme, Workout |
| Séances | Réserver, Planning |
| Performances | Mon poids, IMC |
| Gamification | Points, Badges |
| Motivation | Besoin de motivation |
| Nutrition | Conseils nutrition |

#### Technologie
- **Modèle :** TensorFlow / LSTM
- **Traitement NLP :** NLTK
- **Vectorisation :** TF-IDF
- **Classification :** Réseau de neurones


---

### 📋 4. Analyse de Sentiment des Feedbacks

#### Description
Le système analyse automatiquement les retours des adhérents afin d'identifier leur satisfaction et détecter les problèmes récurrents.

#### Fonctionnalités
- ✅ Classification :
  - Positif
  - Négatif
  - Neutre
- ✅ Score de confiance
- ✅ Extraction de mots-clés
- ✅ Catégorisation automatique
- ✅ Analyse batch
- ✅ Détection des tendances
- ✅ Recommandations d'amélioration

#### Applications
- 📊 Analyse des feedbacks après séance
- 📊 Suivi de satisfaction
- 📊 Détection des problèmes récurrents
- 📊 Amélioration continue des services

#### Technologie
- **Modèle :** Logistic Regression / TensorFlow
- **Vectorisation :** TF-IDF
- **Traitement :** NLTK + Stemmer
- **Langue :** Français


---

### 📊 5. Tableau de Bord BI

#### Description
Dashboard décisionnel permettant aux administrateurs de visualiser les indicateurs clés et prendre des décisions basées sur les données.

#### Fonctionnalités
- ✅ KPIs en temps réel
- ✅ Graphiques interactifs
- ✅ Analyse des heures de pointe
- ✅ Taux de renouvellement
- ✅ Analyse du chiffre d'affaires
- ✅ Distribution des adhérents
- ✅ Tendances et prévisions

#### Indicateurs clés

| KPI | Description |
|---|---|
| Total adhérents | Nombre d'adhérents actifs |
| Nouveaux (30 jours) | Nouvelles inscriptions |
| Actifs | Adhérents actifs mensuellement |
| Taux de rétention | Pourcentage de fidélisation |
| Chiffre d'affaires | Revenus mensuels |
| Heures de pointe | Créneaux les plus fréquentés |

#### Technologie
- **Backend :** Node.js + PostgreSQL
- **Frontend :** React + Chart.js
- **Visualisation :** Graphiques interactifs


---

### 🎯 6. Optimisation du Pointage QR Code

#### Description
Système de génération et scan QR Code permettant un pointage rapide, sécurisé et sans contact.

#### Fonctionnalités
- ✅ QR Code unique par adhérent
- ✅ Scan par caméra
- ✅ Validation automatique
- ✅ Historique des présences
- ✅ Téléchargement du QR Code
- ✅ Expiration des tokens

#### Technologie
- **Backend :** Node.js + qrcode
- **Frontend :** React + qrcode.react + react-qr-reader
- **Sécurité :** JWT + expiration des tokens


---

### 📈 7. Suivi Intelligent des Performances

#### Description
Module permettant d'analyser l'évolution physique des adhérents grâce aux données collectées et aux visualisations intelligentes.

#### Fonctionnalités
- ✅ Suivi du poids
- ✅ Suivi de la masse grasse et musculaire
- ✅ Calcul automatique de l'IMC
- ✅ Graphiques d'évolution
- ✅ Statistiques synthétiques
- ✅ Génération de rapports PDF
- ✅ Alertes de progression

#### Technologie
- **Backend :** Node.js + PDFKit
- **Frontend :** React + Chart.js
- **Base de données :** PostgreSQL

## 🛠️ Stack Technique

### Backend
- **Node.js** - Runtime JavaScript
- **Express.js** - Framework web
- **PostgreSQL** - Base de données
- **JWT** - Authentification
- **BCrypt** - Hashage des mots de passe
- **Nodemailer** - Envoi d'emails
- **PDFKit** - Génération de PDF
- **Node-cron** - Tâches planifiées

### Machine Learning / IA
- **FastAPI** - Framework Python
- **Scikit-learn** - Modèles ML
- **TensorFlow** - Deep Learning
- **NLTK** - Traitement du langage naturel
- **Pandas** - Manipulation de données
- **NumPy** - Calculs scientifiques

### Frontend
- **React 18** - Framework UI
- **TailwindCSS** - Styling
- **Framer Motion** - Animations
- **Chart.js** - Graphiques
- **React Hook Form** - Gestion des formulaires
- **Axios** - Requêtes HTTP
- **QRCode.react** - Génération QR Code
- **React QR Reader** - Scan QR Code

### DevOps
- **Git** - Versionnement

## 📁 Structure du Projet
```text
i-motion-project/
│
├── backend/
│   ├── controllers/
│   ├── routes/
│   ├── middleware/
│   ├── models/
│   └── server.js
│
├── frontend/
│   ├── src/
│   ├── components/
│   ├── pages/
│   └── services/
│
├── ml-service/
│   ├── app/
│   ├── models/
│   ├── datasets/
│   └── main.py
│
└── README.md
```

## 🚀 Installation

### Prérequis
- Node.js (v18+)
- Python (3.10+)
- PostgreSQL (v14+)
- Docker & Docker Compose (optionnel)

### 1. Cloner le dépôt
```bash
git clone https://github.com/haithemboujnah/i-motion-project
cd i-motion-project
```


## 🎯 Roadmap
### Version 1.0 (Actuelle)
- ✅ Authentification complète (3 rôles)
- ✅ Gestion des séances
- ✅ Suivi des performances
- ✅ Programmes IA personnalisés
- ✅ Gamification (points, badges, défis)
- ✅ Chatbot IA
- ✅ QR Code pour pointage
- ✅ Dashboard BI
- ✅ Feedback & Analyse NLP
- ✅ Dark/Light Mode

### Version 2.0 (À venir)
- ⏳ Application mobile (React Native)
- ⏳ Notifications push natives
- ⏳ Intégration Google Calendar
- ⏳ Apple Health / Google Fit
- ⏳ Visioconférence pour cours à distance
- ⏳ Programme adaptatif en temps réel
- ⏳ Analyse prédictive avancée

## 👥 Équipe
- Architecte Technique - [Haithem Boujnah]
- Développement Backend - [Haithem Boujnah]
- Machine Learning Engineer - [Haithem Boujnah]
- UI/UX Designer - [Haithem Boujnah]

## 📄 Licence
Projet académique développé dans le cadre d'un stage d'été.