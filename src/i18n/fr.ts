export default {
    common: {
      errorTitle: 'Erreur',
      networkError: 'Erreur de connexion',
        appName: 'EcoRuteando',
        back: 'Retour',
    },
    home: {
        logout: 'Se déconnecter',
        impactCo2: '0,21 kg de CO₂',

        welcome: 'Bon retour !',

        planTitle: 'Planifier un trajet',
        planDesc: 'Trouvez l’itinéraire le plus écologique pour votre destination.',

        historyTitle: 'Mon historique',
        historyDesc: 'Consultez votre impact environnemental et vos économies de CO₂.',

        favoritesTitle: 'Itinéraires favoris',
        favoritesDesc: 'Accédez rapidement à vos itinéraires écologiques préférés.',

        poiTitle: 'Points d’intérêt',
        poiDesc: 'Explorez des lieux écologiques sur votre trajet.',

        reportTitle: 'Signaler un problème',
        reportDesc: 'Aidez à améliorer les itinéraires en signalant des obstacles.',

        profileTitle: 'Mon profil',
        profileDesc: 'Gérez vos données, votre sécurité et le support technique.',

        impactTitle: 'Votre impact sur la planète',

        impactText:
            'Chaque trajet écologique compte. Bientôt, vous pourrez voir ici le CO₂ que vous avez évité d’émettre.',

        statsButton: 'Voir les statistiques complètes',

    // DASHBOARD
        hello: 'Bonjour',
        greetingSub: 'Où vous emmenons-nous aujourd’hui de manière durable ?',
        logoutShort: 'Se déconnecter',
        defaultUser: 'utilisateur',
        statCo2: 'CO₂ évité',
        statTrips: 'Trajets',
        statTime: 'Temps',
        statFavs: 'Favoris',
        tools: 'Outils',
        modulesCount: 'modules',
        modPlan: 'Planifier un trajet',
        modPlanSub: 'Calculez votre itinéraire écologique',
        modRoutes: 'Mes itinéraires',
        modRoutesSub: 'Vos itinéraires enregistrés',
        modHistory: 'Historique',
        modHistorySub: 'Vos trajets passés',
        modFavs: 'Favoris',
        modFavsSub: 'Itinéraires favoris',
        modProfile: 'Profil',
        modProfileSub: 'Vos informations',
        modAlerts: 'Alertes',
        modAlertsSub: 'Météo et avis',
        impactCardTitle: 'Votre impact compte',
        impactDescBefore: 'Marcher un kilomètre évite ',
        impactDescAfter: ' par rapport à la voiture.',
        seeStats: 'Voir les statistiques',
        footerNote: 'Chaque trajet durable compte',
    },

    tabs: {
        home: 'Accueil',
        route: 'Itinéraire',
        history: 'Historique',
        favorites: 'Favoris',
        report: 'Signaler',
        stats: 'Statistiques',
        profile: 'Profil',
    },
    stats: {
        title: 'Vos statistiques de mobilité',
        subtitle: 'Visualisez votre impact écologique, vos habitudes de trajet et téléchargez vos données pour les rapports.',
        co2ThisMonth: 'CO₂ évité ce mois-ci',
        ecoTrips: 'Trajets écologiques',
        co2PerMonth: 'CO₂ évité par mois (kg)',
        co2PerMonthDesc: 'La quantité de CO₂ que vous n’avez plus émise grâce à vos itinéraires durables.',
        modeDistribution: 'Répartition des trajets par mode',
        modeDistributionDesc: 'Comparaison du nombre de trajets réalisés à pied et en taxi.',
        timePerMode: 'Temps relatif par mode',
        timePerModeDesc: 'Proportion approximative du temps total consacré à chaque mode de transport.',
        co2PerTrip: 'CO₂ par trajet : éco vs voiture',
        co2PerTripDesc: 'Part des émissions sur un itinéraire moyen avec des options éco face à une voiture particulière.',
        detailedSummary: 'Résumé détaillé (exemple)',
        taxiKm: 'Kilomètres en taxi',
        totalTime: 'Temps total sur les trajets',
        jan: 'Jan',
        feb: 'Fév',
        mar: 'Mar',
        apr: 'Avr',
        may: 'Mai',
        jun: 'Juin',
        modeWalk: 'À pied',
        routeEco: 'Route éco',
        modeCar: 'Voiture',
    },
    poi: {
        back: 'Retour',
        title: 'Points d’intérêt',
        helper:
            'Explorez des lieux publics proches de vos trajets : parcs, cafés, points de recyclage et plus.',

        distance: {
            nearRoute: 'Près de votre trajet',
            nearDestination: 'Près de votre destination',
        },

        actions: {
            details: 'Détails',
            map: 'Voir sur la carte',
        },

        types: {
            park: 'Parc public',
            recycle: 'Point de recyclage',
            cafe: 'Café',
        },

        mock: {
            park1: {
                name: 'Parc Santander',
                desc: 'Espace vert idéal pour se reposer pendant le trajet.',
            },
            recycle1: {
                name: 'Point de recyclage principal',
                desc: 'Dépôt de déchets recyclables et sensibilisation environnementale.',
            },
            cafe1: {
                name: 'Café La Ruta',
                desc: 'Lieu pour se détendre et reprendre de l’énergie.',
            },
        },
    },
    planRoute: {
        selectOrigin: 'Sélectionnez l’origine pour calculer l’itinéraire',
        tripErrorFallback: 'Erreur lors de l’achèvement du trajet',

        needAccountTitle: 'Compte requis',
        needAccountMsg: 'Pour {action}, connectez-vous ou créez un compte gratuit.',
        notNow: 'Pas maintenant',
        actionStartTrips: 'démarrer et enregistrer des trajets',
        actionShare: 'partager des itinéraires',
        actionSave: 'enregistrer des itinéraires',
        actionVote: 'voter sur des signalements',
        actionReport: 'signaler des obstacles',
        permissionDeniedTitle: 'Permission refusée',
        locationDeniedMsg: 'Impossible d’accéder à votre position',
        myLocation: 'Ma position',
        selectOriginDest: 'Sélectionnez l’origine et la destination',
        routeNotFound: 'Aucun itinéraire trouvé',
        routeCalcError: 'Impossible de calculer l’itinéraire',
        routeFromApp: 'Itinéraire calculé depuis l’application mobile',
        startTripError: 'Erreur lors du démarrage du trajet',
        missingOriginDest: 'Il manque l’origine ou la destination pour démarrer le trajet',
        tripCompletedTitle: 'Trajet terminé !',
        tripCompletedMsg: 'Votre trajet a été enregistré dans votre historique.',
        close: 'Fermer',
        viewHistory: 'Voir l’historique',
        arrivedSpeak: 'Vous êtes arrivé à destination. Vous pouvez terminer le trajet.',
        arrivedAlertTitle: 'Vous êtes arrivé !',
        arrivedAlertMsg: 'Votre trajet est arrivé à destination. Terminer le trajet ?',
        later: 'Plus tard',
        completeTrip: 'Terminer le trajet',
        navArrived: 'Vous êtes arrivé à destination',
        navContinue: 'Continuez jusqu’à la destination',
        navStartedSpeak: 'Navigation démarrée vers {name}.',
        routeSaved: 'Itinéraire enregistré',
        routeSavedMsg: 'L’itinéraire a été ajouté à votre historique.',
        saveError: 'Impossible d’enregistrer',
        unexpectedError: 'Erreur inattendue',
        locationRequiredTitle: 'Localisation requise',
        voteLocationMsg: 'Activez votre localisation pour voter sur les signalements à proximité.',
        voteConfirmed: 'Vous avez confirmé que cela se produit toujours',
        voteRejected: 'Vous avez indiqué que cela n’arrive plus',
        voteThanks: 'Merci d’avoir voté',
        voteError: 'Impossible de voter',
        addAsStop: 'Ajouter comme arrêt',
        howToGet: 'Comment s’y rendre',
        minSlower: '{n} min plus lent',
        minFaster: '{n} min plus rapide',
        sameTime: 'Même durée',
        viewRoute: 'Voir l’itinéraire',
        report: 'Signaler',
        title: 'Planifier un itinéraire écologique',

        subtitle:
            'Définissez votre trajet et choisissez le moyen de transport durable que vous souhaitez utiliser.',

        routeDataTitle: 'Détails du trajet',

        origin: 'Origine',
        originPlaceholder: 'Ex : Parc Central',

        destination: 'Destination',
        destinationPlaceholder: 'Ex : Université Surcolombiana',

        transportType: 'Type de transport écologique',

        taxi: 'Taxi',

        calculateButton: 'Calculer l’itinéraire écologique',

        mapTitle: 'Carte du trajet',

        ecoSummaryTitle: 'Résumé écologique (exemple)',

        estimatedTime: 'Temps estimé',
        distance: 'Distance',
        avoidedCO2: 'CO₂ évité',
    },
    favorites: {
        defaultName: 'Itinéraire favori',

        empty: 'Vous n’avez aucun itinéraire favori enregistré',
        back: 'Retour',

        title: 'Itinéraires favoris',

        savedRoutes: 'Itinéraires enregistrés',
        ecoFocus: 'Focus',
        ecoRoutes: 'Itinéraires écologiques',

        ecoBadge: 'Éco',

        origin: 'Origine',
        destination: 'Destination',

        detailsButton: 'Voir les détails',
        useRouteButton: 'Utiliser cet itinéraire',

        route1Name: 'Maison → Travail',
        route1From: 'Quartier Las Palmas',
        route1To: 'Centre de Neiva',
        route1Co2: '0,20 t de CO₂ évité par mois',

        route2Name: 'Université → Parc',
        route2From: 'Université',
        route2To: 'Parc Santander',
        route2Co2: '0,10 t de CO₂ évité par mois',
    },
    landing: {
        changeLanguage: 'Changer la langue',
        changeTheme: 'Changer le thème',
        openMenu: 'Ouvrir le menu',

        tagline: 'Mobilité durable',
        heroTitle: 'Déplacez-vous intelligemment',
        heroSlogan: 'Connectez les routes et protégez la planète',
        heroDesc:
            'EcoRuteando vous aide à trouver des itinéraires efficaces et écologiques.',
        guestButton: 'Mode invité',

        mobilityTitle: 'Mobilité intelligente',
        mobilityDesc:
            "EcoRuteando vous aide à vous déplacer efficacement tout en protégeant l'environnement.",

        optimizedRoutes: 'Itinéraires optimisés',
        optimizedRoutesDesc:
            'Trouvez des trajets efficaces pour gagner du temps.',

        environmentalImpact: 'Impact environnemental',
        environmentalImpactDesc:
            'Visualisez la quantité de CO₂ évitée à chaque trajet.',
        easyUse: 'Facile à utiliser',
        easyUseDesc:
            'Interface intuitive conçue pour planifier en quelques secondes.',

        whyTitle: 'Pourquoi EcoRuteando ?',

        whyRealtime: 'Temps réel',
        whyRealtimeDesc:
            'Informations actualisées sur les itinéraires et les temps estimés.',

        whyGreen: 'Engagement écologique',
        whyGreenDesc:
            'Chaque trajet durable contribue à réduire la pollution.',

        drawerLanguage: 'LANGUE',
        drawerAccess: 'ACCÈS RAPIDE',

        features: 'Fonctionnalités',
        whyMenu: 'Pourquoi ?',
        join: 'Rejoindre',
        routes: 'Routes',

        privacy: 'Confidentialité',
        terms: 'Conditions',
        contact: 'Contact',

        joinGreen: 'Rejoignez la révolution verte 🌿',

        footerText: '© 2025 EcoRuteando — SENA Neiva, Huila',
    },
    report: {
        voteHint: 'Vous ne pouvez voter qu’à proximité du signalement (max. 500 m). Votre vote est unique et anonyme pour les autres utilisateurs.',
        formTitle: 'Signaler un obstacle',
        formSubtitle: 'Que rencontrez-vous sur votre itinéraire ?',
        gpsMsg: 'Votre position GPS est nécessaire pour envoyer le signalement.',
        sentTitle: 'Signalement envoyé',
        sentMsg: 'Merci. Le signalement est déjà sur la carte.',
        sentMsgFull: 'Merci. Le signalement est déjà sur la carte avec une confiance initiale.',
        sentToast: 'Signalement envoyé. Merci !',
        sendFailedTitle: 'Échec de l’envoi',
        cameraPermTitle: 'Permission caméra',
        cameraPermMsg: 'Autorisez l’accès à la caméra pour photographier l’obstacle.',
        galleryPermTitle: 'Permission photos',
        galleryPermMsg: 'Autorisez l’accès à vos photos pour joindre une image.',
        cameraError: 'Impossible d’ouvrir la caméra.',
        galleryError: 'Impossible d’ouvrir la galerie.',
        chooseTypeTitle: 'Choisissez un type',
        chooseTypeMsg: 'Sélectionnez l’obstacle que vous signalez.',
        photoAttached: 'Photo jointe',
        cameraBtn: 'Prendre une photo',
        galleryBtn: 'Galerie',
        detailsPlaceholderOpt: 'Détails supplémentaires (facultatif)',
        stillHappening: 'Cela se produit-il encore ?',
        sending: 'Envoi…',
        yes: 'Oui',
        no: 'Non',
        voteActive: 'Actif',
        voteConfirmed: 'Confirmé',
        voteDisputed: 'Contesté',
        voteExpired: 'Expiré',
        nearbyReport: 'Signalement à proximité',

        title: 'Rapport citoyen',

        helperText:
            'Signalez les obstacles qui compliquent les itinéraires écologiques : nids-de-poule, inondations, pistes cyclables bloquées, manque d’éclairage, etc.',

        obstacleType: 'Type d’obstacle',
        selectObstacle: 'Sélectionnez le type d’obstacle',

        obstacles: {
            hole: 'Nid-de-poule',
            blocked: 'Piste cyclable bloquée',
            flood: 'Inondation / eau',
            works: 'Travaux sur la route',
            traffic: 'Trafic très dense',
            lighting: 'Manque d’éclairage',
            other: 'Autre problème',
        },

        locationTitle: 'Localisation approximative',

        locationPlaceholder:
            'Exemple : 5e Avenue et 10e Rue, près du parc',

        photoTitle: 'Photo de l’obstacle',

        photoHelp:
            'Joignez une photo afin que l’administrateur puisse mieux valider le rapport (fortement recommandé).',

        changePhoto: 'Changer la photo',
        takePhoto: 'Prendre ou sélectionner une photo',

        detailsTitle: 'Détails supplémentaires',

        detailsPlaceholder:
            'Décrivez ce qui se passe et comment cela affecte l’itinéraire...',

        send: 'Envoyer le rapport',

        footerNote:
            'Les rapports seront validés conformément aux RF17 et RF18 du SRS et pourront être utilisés pour ajuster les itinéraires et les alertes écologiques.',
    },
    history: {
        empty: 'Vous n’avez encore aucun trajet enregistré',
        title: "Historique des trajets",
        tripsRegistered: "Trajets enregistrés",
        totalCO2: "CO₂ total évité",
        exportPdf: "Exporter PDF",
        exportExcel: "Exporter Excel",
        viewDetails: "Voir les détails du trajet",
        trips: {
            trip1: {
                from: "Quartier Las Palmas",
                to: "Centre de Neiva",
                co2: "0.35 t CO₂ évité",
                date: "Aujourd’hui, 8h15"
            }
        }
    },
    auth: {
        tooManyAttempts: 'Trop de tentatives. Patientez avant de réessayer.',
        invalidCredentials: 'E-mail ou mot de passe incorrect.',
        resetPassError: 'Erreur de réinitialisation du mot de passe',

        // RECOVER CODE
        stepEmail: 'EMAIL',
        stepCode: 'CODE',
        stepPassword: 'MOT DE PASSE',
        recoverCodeTitle: 'Vérifier le code',
        recoverCodeSubtitle:
            'Nous avons envoyé un code à 6 chiffres à votre e-mail enregistré',
        recoverCodeErrorFill: 'Saisissez les 6 chiffres du code',
        recoverCodeNotReceived: "Vous n'avez pas reçu le code ?",
        recoverCodeResend: 'Renvoyer',
        recoverCodeButton: 'Vérifier le code',

        loginTitle: 'Connexion',
        loginSubtitle:
            'Accédez à votre compte pour continuer.',

        registerTitle: 'Créer un compte',
        registerSubtitle:
            'Complétez vos informations pour commencer votre expérience durable.',

        // LABELS
        nameLabel: 'Nom complet',
        emailLabel: 'Adresse e-mail',
        passwordLabel: 'Mot de passe',
        confirmPasswordLabel: 'Confirmer le mot de passe',

        // PLACEHOLDERS
        emailPlaceholder: 'votremail@email.com',
        passwordPlaceholder: 'Votre mot de passe',

        // BUTTONS
        loginButton: 'Connexion',
        registerButton: "S'inscrire",
        acceptTermsButton: "J'accepte les conditions",
        close: 'Fermer',
        back: 'Retour',

        // LINKS
        alreadyAccount: 'Vous avez déjà un compte ?',
        loginHere: 'Connectez-vous ici.',
        noAccount: "Vous n'avez pas de compte ?",
        registerHere: "Inscrivez-vous ici.",
        forgotPassword: 'Mot de passe oublié ?',

        // TERMS
        acceptTermsPrefix: "J'ai lu et accepté les",
        andPrivacy: 'et la',
        termsAndConditions: 'Conditions générales',
        privacyPolicy: 'Politique de confidentialité',
        termsUpdated:
            'EcoRuteando · Dernière mise à jour : janvier 2025',

        // VALIDATIONS
        requiredField: 'Champ obligatoire',
        emailRequired: "L'e-mail est requis",
        emailInvalid:
            'Entrez une adresse e-mail valide avec @',

        passwordRequired:
            'Le mot de passe est requis',

        passwordMin: 'Minimum 8 caractères',

        passwordStrong:
            'Doit contenir une majuscule, un chiffre et un caractère spécial',

        passwordMismatch:
            'Les mots de passe ne correspondent pas',

        termsError:
            'Vous devez accepter les conditions pour continuer',

        // PASSWORD STATES
        passwordEmpty: 'Mot de passe non évalué',
        passwordWeak: 'Mot de passe faible',
        passwordMedium: 'Mot de passe moyen',
        passwordStrongLabel: 'Mot de passe fort',

        // SOCIAL
        orContinueWith: 'Ou continuer avec',

        // AUTH SCREENS (login / register / recover / verify-code)
        loggingIn: 'Connexion en cours...',
        loginTagline: 'Chaque trajet durable commence par un pas',
        registerTagline: 'Commencez votre parcours durable',
        communityTagline: 'Rejoignez la communauté qui protège la planète',
        firstNameLabel: 'Prénom',
        firstNamePlaceholder: 'Votre nom',
        lastNameLabel: 'Nom de famille',
        lastNamePlaceholder: 'Dupont',
        emailValid: 'E-mail valide',
        pwCheckUppercase: 'Au moins une majuscule',
        pwCheckNumber: 'Au moins un chiffre',
        pwCheckSpecial: 'Au moins un caractère spécial',
        confirmPasswordPlaceholder: 'Répétez votre mot de passe',
        passwordMatch: 'Les mots de passe correspondent',
        passwordMinShort: 'Min. 8 caractères',
        orRegisterWith: "Ou inscrivez-vous avec",
        registering: 'Inscription en cours...',
        recoverTitle: 'Récupérer le mot de passe',
        recoverSubtitle: 'Saisissez votre e-mail et nous vous enverrons un code de vérification à 6 chiffres pour réinitialiser votre mot de passe.',
        recoverSentTitle: 'Vérifiez votre e-mail',
        recoverSentSubtitle: 'Nous avons envoyé un code de vérification à :',
        recoverWrongEmail: 'Mauvais e-mail ? Le modifier',
        recoverHaveCode: "J'ai déjà le code →",
        sendCode: 'Envoyer le code',
        sendingCode: 'Envoi du code...',
        backToLogin: 'Retour à la connexion',
        backToRegister: "Retour à l'inscription",
        stepEmailLabel: 'E-MAIL',
        stepCodeLabel: 'CODE',
        stepPasswordLabel: 'MOT DE PASSE',
        newPasswordTitle: 'Nouveau mot de passe',
        newPasswordSubtitle: 'Choisissez un mot de passe sécurisé pour protéger votre compte',
        confirmNewPasswordLabel: 'Confirmer le nouveau mot de passe',
        resetPasswordButton: 'Réinitialiser le mot de passe',
        verifyCodeTitle: 'Vérifiez votre compte',
        verifyCodeSubtitle: 'Saisissez le code à 4 chiffres que nous avons envoyé à votre e-mail.',
        confirmCodeButton: 'Confirmer le code',
        resendCode: 'Renvoyer le code',
        fillAllFields: 'Remplissez tous les champs',
        passwordMin8Error: 'Le mot de passe doit contenir au moins 8 caractères',
        invalidEmailMsg: 'Saisissez une adresse e-mail valide.',
        tooManyRequests: 'Trop de requêtes. Attendez quelques minutes.',
        sendCodeError: 'Impossible d’envoyer le code.',
        fillBothFields: 'Remplissez les deux champs',
        codeIncomplete: 'Saisissez les 4 chiffres du code',
        codeInvalid: 'Code invalide',
        resendError: 'Erreur lors du renvoi du code',
        registerInvalidForm: 'Veuillez remplir tous les champs correctement',
        emailAlreadyRegistered: 'Cet e-mail est déjà enregistré.',
        alreadyRegisteredTitle: 'Vous êtes déjà inscrit',
        alreadyRegisteredMsg: 'Cet e-mail possède déjà un compte. Voulez-vous vous connecter ou renvoyer le code de vérification ?',
        registerErrorFallback: 'Impossible d’enregistrer l’utilisateur',
        cancel: 'Annuler',
        errorTitle: 'Erreur',

        termsContent: `1. Acceptation des Conditions

      En vous inscrivant et en utilisant les services d’EcoRuteando, vous acceptez d’être lié par les présentes Conditions Générales. Si vous n’êtes pas d’accord avec l’un des termes établis ici, nous vous recommandons de ne pas utiliser la plateforme.

      2. Description du Service

      EcoRuteando est une plateforme de mobilité durable développée dans le cadre du programme de Développement Logiciel du SENA à Neiva, Colombie. Son objectif est de faciliter la planification d’itinéraires écologiques efficaces, afin de réduire l’empreinte carbone dans les environnements urbains.

      3. Inscription de l’Utilisateur

      Pour accéder aux fonctionnalités complètes de la plateforme, l’utilisateur doit créer un compte avec des informations exactes, complètes et à jour. EcoRuteando se réserve le droit de suspendre ou supprimer les comptes contenant de fausses informations ou violant ces conditions. L’utilisateur est responsable de la confidentialité de ses identifiants d’accès.

      4. Utilisation Acceptable

      L’utilisateur s’engage à utiliser la plateforme uniquement à des fins légales et conformément à son objectif. Il est strictement interdit de partager du contenu offensant, d’utiliser la plateforme pour des activités illégales, de tenter de compromettre la sécurité du système, d’usurper l’identité d’autres utilisateurs ou d’EcoRuteando, ou d’effectuer des actions pouvant affecter les performances de la plateforme.

      5. Confidentialité et Protection des Données

      EcoRuteando collecte et traite les données personnelles conformément à la Loi colombienne 1581 de 2012 et à ses règlements. Les données collectées sont utilisées exclusivement pour fournir le service, améliorer la plateforme et envoyer des communications liées au service, toujours avec le consentement préalable de l’utilisateur.

      6. Informations sur les Itinéraires et Disponibilité

      Les informations concernant les itinéraires et les temps de trajet sont fournies à titre indicatif et peuvent varier selon les conditions locales. EcoRuteando n’est pas responsable des retards, changements d’itinéraires ou informations obsolètes.

      7. Propriété Intellectuelle

      Tous les droits de propriété intellectuelle relatifs à la plateforme, y compris son design, son code source, ses logos et son contenu, appartiennent à l’équipe de développement EcoRuteando. Toute reproduction, modification ou distribution sans autorisation écrite préalable est interdite.

      8. Modifications du Service

      EcoRuteando se réserve le droit de modifier, suspendre ou interrompre le service à tout moment, avec ou sans préavis. De même, les présentes Conditions Générales peuvent être mises à jour périodiquement ; les modifications entreront en vigueur dès leur publication sur la plateforme.

      9. Limitation de Responsabilité

      EcoRuteando ne pourra être tenu responsable des dommages directs, indirects, accessoires ou consécutifs résultant de l’utilisation ou de l’impossibilité d’utiliser la plateforme, y compris les pertes de données, interruptions de service ou inexactitudes dans les informations d’itinéraires.

      10. Loi Applicable et Juridiction

      Les présentes Conditions Générales sont régies par les lois de la République de Colombie. Tout litige découlant de leur interprétation ou application sera soumis aux tribunaux compétents de Neiva, Huila, Colombie.

      11. Contact

      Pour toute question relative à ces conditions, l’utilisateur peut contacter EcoRuteando via les canaux officiels disponibles sur la plateforme.`,
    },
    guest: {
        title: 'Mode invité',

        subtitle:
            'Découvrez le fonctionnement d’EcoRuteando. Pour calculer vos propres itinéraires en temps réel, créez un compte gratuit.',

        routeTitle: 'Voici votre itinéraire',

        routeSubtitle:
            'Lors du calcul, vous obtiendrez ces données réelles à chaque trajet :',

        featureTime: 'Temps estimé et heure d’arrivée',

        featureDistance: 'Distance totale du trajet',

        featureCo2: 'CO₂ évité par rapport à la voiture',

        mapTitle: 'Vue de la carte (démo)',

        mapSubtitle:
            'En mode invité, vous verrez une carte d’exemple. En vous inscrivant, vous pourrez calculer de véritables itinéraires sur la carte.',

        ctaTitle:
            'Faites le prochain pas vers une mobilité plus verte',

        ctaText:
            'Créez votre compte et commencez à planifier des itinéraires écologiques, suivre votre impact en CO₂ et accéder à toutes les fonctionnalités d’EcoRuteando.',

        ctaPrimaryBtn: 'Créer un compte',

        ctaSecondaryBtn: 'Se connecter',

        enterMap: 'Entrer sur la carte',

        capabilitiesTitle: 'Ce que vous pouvez faire en invité',

        capabilitiesSubtitle:
            'Explorez EcoRuteando sans compte. Connectez-vous quand vous voulez enregistrer, partager ou créer.',

        capabilitySearch: 'Rechercher des lieux',

        capabilityLocation: 'Voir les lieux sur la carte',

        capabilityDirections: 'Calculer des itinéraires et obtenir des indications',

        capabilityBusiness: 'Consulter les informations des commerces et lieux',

        capabilityMapViews: 'Utiliser différentes vues de la carte',

        capabilityCurrentLocation:
            'Utiliser la position actuelle de l’appareil si vous l’autorisez',

        guestNote:
            'Pour enregistrer, partager, créer ou démarrer des trajets, vous avez besoin d’un compte.',
    },
    profile: {
      tabs: {
        personal: 'Profil et réglages',
        security: 'Sécurité',
        support: 'Assistance',
      },
      defaultName: 'Utilisateur EcoRuteando',
      defaultEmail: 'utilisateur@ecoruteando.com',
      changePhoto: 'Changer la photo',
      theme: {
        light: 'Clair',
        dark: 'Sombre',
      },
      languages: {
        es: 'Espagnol',
        en: 'Anglais',
        fr: 'Français',
        pt: 'Portugais',
      },
      feedback: {
        savedTitle: 'Modifications enregistrées',
        savedMsg: 'Votre profil a été mis à jour.',
        error: 'Impossible d’effectuer l’opération.',
        invalidPass: 'Le mot de passe ne respecte pas les exigences ou ne correspond pas.',
        passTitle: 'Mot de passe mis à jour',
        passMsg: 'Votre mot de passe a été modifié.',
        supportTitle: 'Message envoyé',
        supportMsg: 'L’équipe de support examinera votre demande rapidement.',
        emptyMessage: 'Écrivez un message avant de l’envoyer.',
      },
    personal: {
      title: 'Informations personnelles',
      subtitle:
        'Mettez à jour vos données de base. Cela permet de personnaliser vos itinéraires et statistiques.',

      fields: {
        fullName: 'Nom complet',
        documentId: 'Document (optionnel)',
        phone: 'Téléphone',
        city: 'Ville',
        birthdate: 'Date de naissance',
        gender: 'Genre (optionnel)',
        transport: 'Moyen de transport principal',
        bio: 'Biographie',
      },

      placeholders: {
        fullName: 'Votre nom complet',
        documentId: 'CNI / Passeport',
        phone: 'Ex: 310 000 0000',
        city: 'Ville, pays',
        birthdate: 'jj/mm/aa',
        bio: 'Expliquez comment vous vous déplacez en ville...',
      },

      gender: {
        male: 'Homme',
        female: 'Femme',
        other: 'Autre',
      },

      transport: {
        walk: 'Marche',
        taxi: 'Taxi',
      },

      save: 'Enregistrer les modifications',
    },

    account: {
      title: 'Paramètres du compte',
      subtitle:
        'Langue, thème et exportation des données selon les exigences SRS.',

      language: 'Langue de l’interface',
      export: 'Exporter mes données',

      deleteTitle: 'Zone de danger',
      deleteText:
        'Si vous supprimez votre compte, vos données seront définitivement supprimées.',
      deleteButton: 'Supprimer le compte',

      exportOptions: {
        pdf: 'PDF',
        excel: 'Excel',
      },
    },

    security: {
      title: 'Sécurité du compte',
      subtitle: 'Mettez à jour votre mot de passe et sécurisez votre compte.',

      email: 'E-mail',
      newPassword: 'Nouveau mot de passe',
      confirmPassword: 'Confirmer le mot de passe',

      hint:
        'Minimum 8 caractères, une majuscule, un chiffre et un caractère spécial.',

      button: 'Mettre à jour le mot de passe',
    },

    support: {
      title: 'Support technique',
      subtitle:
        'Envoyez un message et l’administrateur examinera votre cas.',

      priority: 'Priorité',

      priorities: {
        low: 'Basse',
        medium: 'Moyenne',
        high: 'Haute',
      },

      message: 'Message',
      placeholder: 'Décrivez le problème ou l’amélioration...',

      button: 'Envoyer le message',

      hint: 'Bientôt, vous pourrez discuter en temps réel avec le support.',
    },
  },
  terms: {
    hint: 'Faites défiler jusqu’à la fin pour pouvoir accepter',
    readToEnd: 'Lisez jusqu’à la fin',
    acceptance: {
      title: '1. Acceptation des conditions',
      body: 'En vous inscrivant et en utilisant les services d’EcoRuteando, vous acceptez d’être lié par ces conditions générales. Si vous n’êtes pas d’accord avec l’un des termes énoncés ici, nous vous déconseillons d’utiliser la plateforme.',
    },
    service: {
      title: '2. Description du service',
      body: 'EcoRuteando est une plateforme de mobilité durable développée dans le cadre du programme de développement logiciel du SENA, à Neiva (Colombie). Elle vise à faciliter la planification d’itinéraires écologiques efficaces et à réduire l’empreinte carbone en milieu urbain.',
    },
    registration: {
      title: '3. Inscription de l’utilisateur',
      body: 'Pour accéder à toutes les fonctionnalités de la plateforme, l’utilisateur doit créer un compte avec des informations véridiques, complètes et à jour. EcoRuteando se réserve le droit de suspendre ou de supprimer les comptes contenant de faux données ou enfreignant ces conditions. L’utilisateur est responsable de la confidentialité de ses identifiants d’accès.',
    },
    acceptableUse: {
      title: '4. Utilisation acceptable',
      body: 'L’utilisateur s’engage à utiliser la plateforme uniquement à des fins licites et conformément à sa finalité. Il est expressément interdit : partager un contenu offensant, utiliser la plateforme pour des activités illégales, tenter de compromettre la sécurité du système, usurper l’identité d’autres utilisateurs ou d’EcoRuteando, et réaliser des actions pouvant affecter les performances de la plateforme.',
    },
    privacy: {
      title: '5. Confidentialité et protection des données',
      body: 'EcoRuteando collecte et traite les données personnelles de ses utilisateurs conformément à la loi 1581 de 2012 (loi colombienne de protection des données personnelles) et à ses décrets d’application. Les données collectées servent exclusivement à la prestation du service, à l’amélioration de la plateforme et à l’envoi de communications liées, toujours avec le consentement préalable de l’utilisateur.',
    },
    routes: {
      title: '6. Informations sur les itinéraires et disponibilité',
      body: 'Les informations sur les itinéraires et les durées de trajet sont indicatives et peuvent varier selon les conditions locales. EcoRuteando n’est pas responsable des retards, changements d’itinéraire ou informations obsolètes.',
    },
    intellectual: {
      title: '7. Propriété intellectuelle',
      body: 'Tous les droits de propriété intellectuelle sur la plateforme, y compris sa conception, son code source, ses logos et ses contenus, appartiennent à l’équipe de développement d’EcoRuteando. Leur reproduction, modification ou distribution sans autorisation écrite expresse est interdite.',
    },
    modifications: {
      title: '8. Modifications du service',
      body: 'EcoRuteando se réserve le droit de modifier, suspendre ou interrompre le service à tout moment, avec ou sans préavis. Ces conditions générales peuvent également être mises à jour périodiquement ; les changements entrent en vigueur à leur publication sur la plateforme.',
    },
    liability: {
      title: '9. Limitation de responsabilité',
      body: 'EcoRuteando ne sera pas responsable des dommages directs, indirects, accessoires ou consécutifs résultant de l’utilisation ou de l’impossibilité d’utiliser la plateforme, y compris perte de données, interruptions de service ou inexactitudes dans les informations d’itinéraire.',
    },
    law: {
      title: '10. Droit applicable et juridiction',
      body: 'Ces conditions générales sont régies par les lois de la République de Colombie. Tout litige relatif à leur interprétation ou à leur application sera tranché par les tribunaux compétents de la ville de Neiva, Huila (Colombie).',
    },
    contact: {
      title: '11. Contact',
      body: 'Pour toute question relative à ces conditions, l’utilisateur peut contacter EcoRuteando via les canaux officiels disponibles sur la plateforme.',
    },
  },

  pw: {
    weak: 'Faible',
    regular: 'Moyen',
    strong: 'Fort',
    veryStrong: 'Très fort',
  },

  reportTypes: {
    traffic_light: 'Feu endommagé',
    signage: 'Signalisation',
    obstruction: 'Obstruction sur la voie',
    pothole: 'Nid-de-poule',
    sewer: 'Bouche d’égout ouverte',
    hole: 'Nid-de-poule',
    blocked: 'Voie bloquada',
    flood: 'Inondation',
    works: 'Travaux sur la voie',
    traffic: 'Trafic',
    lighting: 'Manque d’éclairage',
    other: 'Autre obstacle',
    default: 'Obstacle',
  },

  poiCats: {
    restaurant: 'Restaurants',
    cafe: 'Cafés',
    lodging: 'Hôtels',
    atm: 'Distributeurs',
    gas: 'Stations-service',
    pharmacy: 'Pharmacies',
    supermarket: 'Supermarchés',
    bar: 'Bars',
  },

  modes: {
    driving: 'Voiture',
    walking: 'Marche',
  },

  map: {
    explore: 'Explorez EcoRuteando',
    barPlaceholder: 'Où voulez-vous aller ?',
    popular: 'Destinations populaires',
    planRoute: 'Planifier un itinéraire',
    whereFrom: 'Où êtes-vous ?',
    whereTo: 'Où allez-vous ?',
    calculating: 'Calcul…',
    searching: 'Recherche près de vous…',
    searchingFor: 'Recherche de {name}…',
    resultsCount: '{n} lieux trouvés',
    noResults: 'Aucun lieu à proximité',
    open: 'Ouvert',
    closed: 'Fermé',
  },

  addStop: {
    extraMin: 'plus de {n} min',
    title: 'Ajoutez des arrêts à votre itinéraire',
    subtitle: 'Trouvez des cafés, des parcs et bien plus',
    searchPlaceholder: 'Rechercher sur l’itinéraire',
    onRoute: 'Sur votre itinéraire',
    bestOf: 'Les meilleurs {name}',
    empty: 'Aucun lieu trouvé à proximité. Essayez une autre catégorie.',
    hint: 'Choisissez une catégorie ou recherchez un lieu à ajouter.',
    add: 'Ajouter',
  },

  routeSheet: {
    otherRoutes: 'Autres itinéraires',
    directions: 'Itinéraire',
    addStops: 'Ajouter des arrêts',
    share: 'Partager',
    inProgress: 'En cours',
    save: 'Enregistrer',
    saved: 'Enregistrée',
    completing: 'Achèvement…',
    complete: 'Terminer',
    starting: 'Démarrage…',
    startTrip: 'Démarrer le trajet',
    am: 'AM',
    pm: 'PM',
  },

  settings: {
    title: 'Paramètres',
  },

  tracking: {
    title: 'Suivi',
  },

};