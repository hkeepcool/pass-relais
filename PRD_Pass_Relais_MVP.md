# PRD - Pass-Relais (MVP)

**Nom du Projet :** Pass-Relais
**Version :** 1.0 (Phase de démarrage)
**Type de produit :** Micro-SaaS / PWA (Progressive Web App)
**Cible :** Personnel soignant (Infirmiers libéraux, aides-soignants, auxiliaires de vie)

---

## 1. Vision et Objectifs
### Vision
Simplifier la transmission d'informations critiques entre soignants pour éliminer le papier, réduire le stress de fin de garde et garantir la sécurité des soins.

### Objectifs du MVP
- Réduire le temps de rédaction d'une transmission à moins de 30 secondes.
- Assurer la continuité de l'information même sans connexion internet (PWA).
- Fournir une vue d'ensemble instantanée de l'état des patients d'une tournée.

---

## 2. Spécifications Fonctionnelles

### A. Gestion des Patients & Tournées
- **Vue Liste :** Affichage simple des patients de la journée.
- **Indicateurs Visuels :** Pastilles de couleur (Vert, Orange, Rouge) selon la dernière observation.
- **Tri automatique :** Les patients avec une alerte (Rouge) remontent en haut de la liste.

### B. Module "Quick-Tap" (Saisie Ultra-Rapide)
- **Interface sans clavier :** Grille de boutons larges pour évaluer les constantes :
    - *Sommeil* (Reposé / Agité / Insomnie)
    - *Appétit* (Normal / Faible / Refus)
    - *Douleur* (Échelle de 1 à 5 via icônes)
    - *Humeur* (Stable / Confus / Anxieux)
- **Saisie Vocale :** Bouton d'enregistrement pour dictée libre avec transcription automatique via IA.

### C. Le Flux de Transmission (Feed)
- **Chronologie :** Historique des interventions par patient.
- **Résumé IA :** Génération d'un résumé de 3 lignes des dernières 24h pour faciliter la reprise de service.
- **Filtres :** Possibilité de voir uniquement les incidents ou les changements de traitement.

### D. Capacités Offline (PWA)
- **Service Workers :** Mise en cache de l'application.
- **Local Storage :** Enregistrement des données en local si le réseau est absent.
- **Auto-Sync :** Synchronisation dès détection d'une connexion (navigator.onLine).

---

## 3. Architecture Technique (Instructions pour IA de Code)
- **Framework :** Next.js 14+ (App Router) ou Vite + React.
- **Style :** Tailwind CSS (Priorité à l'accessibilité et aux zones de clic larges).
- **Base de données :** Supabase (PostgreSQL) avec stockage local (IndexedDB).
- **Authentification :** Bio-métrique (WebAuthn) ou Passwordless (Magic Link).
- **Hébergement :** Compatible HDS (Hébergement Données de Santé) type AWS (région spécifique) ou OVH Cloud.

---

## 4. Design & UX
- **Mobile First :** L'interface doit être conçue pour une utilisation à une main.
- **Contraste élevé :** Lisibilité maximale pour les environnements lumineux ou sombres.
- **Zéro Friction :** Pas de formulaires longs. Priorité aux sélecteurs et boutons radio.

---

## 5. Roadmap Évolutive (Post-MVP)
- Accès sécurisé pour les familles (consultation uniquement).
- Rappels de médicaments (alertes push).
- Export PDF pour les dossiers médicaux officiels.

---

## 6. Critères d'Acceptation
- Le soignant peut créer une transmission en 3 clics + 1 note vocale.
- La transmission est lisible instantanément par un collègue sur un autre appareil.
- L'application fonctionne sans réseau (lecture/écriture).
