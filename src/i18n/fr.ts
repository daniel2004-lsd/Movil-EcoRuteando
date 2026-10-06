export default {
    common: {
        appName: 'EcoRuteando',
        back: 'Retour',
    },
    home: {
        logout: 'Se déconnecter',

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
    }, history: {
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
};