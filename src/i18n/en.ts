// src/i18n/en.ts
export default {
  common: {
    appName: 'EcoRuteando',
    back: 'Back',
  },
  home: {
    logout: 'Log out',

    welcome: 'Welcome back!',

    planTitle: 'Plan route',
    planDesc: 'Find the most eco-friendly route to your destination.',

    historyTitle: 'My history',
    historyDesc: 'Review your environmental impact and CO₂ savings.',

    favoritesTitle: 'Favorite routes',
    favoritesDesc: 'Quickly access your preferred eco-friendly routes.',

    poiTitle: 'Points of interest',
    poiDesc: 'Explore eco-friendly places along your route.',

    reportTitle: 'Report issue',
    reportDesc: 'Help improve routes by reporting obstacles.',

    profileTitle: 'My profile',
    profileDesc: 'Manage your data, security, and technical support.',

    impactTitle: 'Your impact on the planet',

    impactText:
      'Every eco-friendly trip counts. Soon you will be able to see the CO₂ you have avoided emitting here.',

    statsButton: 'View full statistics',
  },
  poi: {
    back: 'Back',
    title: 'Points of interest',
    helper:
      'Explore public places near your routes: parks, cafés, recycling points and more.',

    distance: {
      nearRoute: 'Near your route',
      nearDestination: 'Near your destination',
    },

    actions: {
      details: 'Details',
      map: 'View on map',
    },

    types: {
      park: 'Public park',
      recycle: 'Recycling point',
      cafe: 'Café',
    },

    mock: {
      park1: {
        name: 'Santander Park',
        desc: 'Green area ideal for resting during your trip.',
      },
      recycle1: {
        name: 'Main recycling point',
        desc: 'Drop off recyclable waste and environmental education.',
      },
      cafe1: {
        name: 'La Ruta Café',
        desc: 'Place to take a break and recharge energy.',
      },
    },
  },
  planRoute: {
    title: 'Plan Eco Route',

    subtitle:
      'Define your trip and choose the sustainable transportation method you want to use.',

    routeDataTitle: 'Trip Details',

    origin: 'Origin',
    originPlaceholder: 'Ex: Central Park',

    destination: 'Destination',
    destinationPlaceholder: 'Ex: Surcolombiana University',

    transportType: 'Eco-friendly transportation type',

    taxi: 'Taxi',

    calculateButton: 'Calculate eco route',

    mapTitle: 'Route Map',

    ecoSummaryTitle: 'Eco Summary (example)',

    estimatedTime: 'Estimated Time',
    distance: 'Distance',
    avoidedCO2: 'Avoided CO₂',
  },
  favorites: {
    back: 'Back',

    title: 'Favorite Routes',

    savedRoutes: 'Saved Routes',
    ecoFocus: 'Focus',
    ecoRoutes: 'Eco Routes',

    ecoBadge: 'Eco',

    origin: 'Origin',
    destination: 'Destination',

    detailsButton: 'View Details',
    useRouteButton: 'Use This Route',

    route1Name: 'Home → Work',
    route1From: 'Las Palmas Neighborhood',
    route1To: 'Downtown Neiva',
    route1Co2: '0.20 t CO₂ avoided per month',

    route2Name: 'University → Park',
    route2From: 'University',
    route2To: 'Santander Park',
    route2Co2: '0.10 t CO₂ avoided per month',
  },
  landing: {
    tagline: 'Sustainable mobility',
    heroTitle: 'Move smarter',
    heroSlogan: 'Connect routes and protect the planet',
    heroDesc:
      'EcoRuteando helps you find efficient and eco-friendly routes.',
    guestButton: 'Guest mode',

    mobilityTitle: 'Smart mobility',
    mobilityDesc:
      'EcoRuteando helps you move efficiently while caring for the environment.',

    optimizedRoutes: 'Optimized routes',
    optimizedRoutesDesc:
      'Find efficient routes to save time.',

    environmentalImpact: 'Environmental impact',
    environmentalImpactDesc:
      'See how much CO₂ you avoid on every trip.',

    easyUse: 'Easy to use',
    easyUseDesc:
      'Intuitive interface designed for planning in seconds.',
    whyTitle: 'Why EcoRuteando?',

    whyRealtime: 'Real time',
    whyRealtimeDesc:
      'Updated local route information and estimated times.',

    whyGreen: 'Green commitment',
    whyGreenDesc:
      'Every sustainable trip helps reduce pollution.',

    drawerLanguage: 'LANGUAGE',
    drawerAccess: 'QUICK ACCESS',

    features: 'Features',
    whyMenu: 'Why?',
    join: 'Join',
    routes: 'Routes',

    privacy: 'Privacy',
    terms: 'Terms',
    contact: 'Contact',

    joinGreen: 'Join the green revolution 🌿',

    footerText: '© 2025 EcoRuteando — SENA Neiva, Huila',
  },
  report: {
    title: 'Citizen Report',

    helperText:
      'Report obstacles that make eco-friendly routes difficult: potholes, floods, blocked bike lanes, lack of lighting, etc.',

    obstacleType: 'Obstacle type',
    selectObstacle: 'Select the type of obstacle',

    obstacles: {
      hole: 'Road pothole',
      blocked: 'Blocked bike lane',
      flood: 'Flood / water',
      works: 'Road works',
      traffic: 'Heavy traffic',
      lighting: 'Lack of lighting',
      other: 'Other issue',
    },

    locationTitle: 'Approximate location',

    locationPlaceholder:
      'Example: 5th Avenue and 10th Street, near the park',

    photoTitle: 'Obstacle photo',

    photoHelp:
      'Attach a photo so the administrator can better validate the report (highly recommended).',

    changePhoto: 'Change photo',
    takePhoto: 'Take or select a photo',

    detailsTitle: 'Additional details',

    detailsPlaceholder:
      'Describe what is happening and how it affects the route...',

    send: 'Send report',

    footerNote:
      'Reports will be validated according to RF17 and RF18 of the SRS and may be used to adjust routes and eco alerts.',
  },
  history: {
    title: "Trip history",
    tripsRegistered: "Registered trips",
    totalCO2: "Total CO₂ saved",
    exportPdf: "Export PDF",
    exportExcel: "Export Excel",
    viewDetails: "View trip details",
    trips: {
      trip1: {
        from: "Las Palmas Neighborhood",
        to: "Neiva Downtown",
        co2: "0.35 t CO₂ saved",
        date: "Today, 8:15 a.m."
      }
    }
  },
  auth: {
    loginTitle: 'Log in',
    loginSubtitle:
      'Access your account to continue.',

    registerTitle: 'Create account',
    registerSubtitle:
      'Complete your information to start your sustainable experience.',

    // LABELS
    nameLabel: 'Full name',
    emailLabel: 'Email address',
    passwordLabel: 'Password',
    confirmPasswordLabel: 'Confirm password',

    // PLACEHOLDERS
    emailPlaceholder: 'yourmail@email.com',
    passwordPlaceholder: 'Your password',

    // BUTTONS
    loginButton: 'Log in',
    registerButton: 'Register',
    acceptTermsButton: 'I accept the terms',
    close: 'Close',
    back: 'Back',

    // LINKS
    alreadyAccount: 'Already have an account?',
    loginHere: 'Log in here.',
    noAccount: "Don't have an account?",
    registerHere: 'Register here.',
    forgotPassword: 'Forgot your password?',

    // TERMS
    acceptTermsPrefix: 'I have read and accept the',
    andPrivacy: 'and the',
    termsAndConditions: 'Terms and Conditions',
    privacyPolicy: 'Privacy Policy',
    termsUpdated:
      'EcoRuteando · Last updated: January 2025',

    // VALIDATIONS
    requiredField: 'Required field',
    emailRequired: 'Email is required',
    emailInvalid:
      'Enter a valid email with @',

    passwordRequired:
      'Password is required',

    passwordMin: 'Minimum 8 characters',

    passwordStrong:
      'Must contain uppercase, number and special character',

    passwordMismatch:
      'Passwords do not match',

    termsError:
      'You must accept the terms to continue',

    // PASSWORD STATES
    passwordEmpty: 'Password not evaluated',
    passwordWeak: 'Weak password',
    passwordMedium: 'Medium password',
    passwordStrongLabel: 'Strong password',

    // SOCIAL
    orContinueWith: 'Or continue with',

    termsContent: `1. Acceptance of Terms
        
        By registering and using EcoRuteando services, you agree to be bound by these Terms and Conditions. If you do not agree with any of the terms established herein, we recommend that you do not use the platform.
        
        2. Service Description
        
        EcoRuteando is a sustainable mobility platform developed within the Software Development program of SENA in Neiva, Colombia. Its purpose is to facilitate the planning of efficient eco-friendly routes, promoting the reduction of carbon footprint in urban environments.
        
        3. User Registration
        
        To access the full functionality of the platform, users must create an account with truthful, complete, and updated information. EcoRuteando reserves the right to suspend or delete accounts containing false information or violating these terms. Users are responsible for maintaining the confidentiality of their access credentials.
        
        4. Acceptable Use
        
        Users agree to use the platform only for lawful purposes and according to its intended purpose. Sharing offensive content, using the platform for illegal activities, attempting to breach system security, impersonating other users or EcoRuteando, and performing actions that may affect platform performance are strictly prohibited.
        
        5. Privacy and Data Protection
        
        EcoRuteando collects and processes personal data in accordance with Colombian Law 1581 of 2012 and related regulations. Collected data is used exclusively for service provision, platform improvement, and related communications, always with the user's prior consent.
        
        6. Route Information and Availability
        
        Information regarding routes and travel times is provided for reference purposes and may vary depending on local conditions. EcoRuteando is not responsible for delays, route changes, or outdated information.
        
        7. Intellectual Property
        
        All intellectual property rights related to the platform, including its design, source code, logos, and content, belong to the EcoRuteando development team. Reproduction, modification, or distribution without prior written authorization is prohibited.
        
        8. Service Modifications
        
        EcoRuteando reserves the right to modify, suspend, or discontinue the service at any time, with or without prior notice. Likewise, these Terms and Conditions may be updated periodically; changes will become effective upon publication on the platform.
        
        9. Limitation of Liability
        
        EcoRuteando shall not be liable for direct, indirect, incidental, or consequential damages resulting from the use or inability to use the platform, including data loss, service interruptions, or inaccuracies in route information.
        
        10. Governing Law and Jurisdiction
        
        These Terms and Conditions are governed by the laws of the Republic of Colombia. Any dispute arising from their interpretation or application shall be resolved before the competent courts of Neiva, Huila, Colombia.
        
        11. Contact
        
        For inquiries related to these terms, users may contact EcoRuteando through the official communication channels available on the platform.`,
  },
  guest: {
    title: 'Guest mode',

    subtitle:
      'Explore how EcoRuteando works. To calculate your own routes in real time, create a free account.',

    routeTitle: 'This is how your route looks',

    routeSubtitle:
      'When you calculate a route you will get this real data on every trip:',

    featureTime: 'Estimated time and arrival',

    featureDistance: 'Total trip distance',

    featureCo2: 'CO₂ saved compared to driving',

    mapTitle: 'Map view (demo)',

    mapSubtitle:
      'In guest mode you will see an example map. By registering, you will be able to calculate real routes on the map.',

    ctaTitle:
      'Take the next step toward greener mobility',

    ctaText:
      'Create your account and start planning eco-friendly routes, track your CO₂ impact, and access all EcoRuteando features.',

    ctaPrimaryBtn: 'Create account',

    ctaSecondaryBtn: 'Sign in',

    enterMap: 'Enter the map',

    capabilitiesTitle: 'What you can do as a guest',

    capabilitiesSubtitle:
      'Explore EcoRuteando without an account. Sign in whenever you want to save, share or create.',

    capabilitySearch: 'Search places',

    capabilityLocation: 'See locations on the map',

    capabilityDirections: 'Calculate routes and get directions',

    capabilityBusiness: 'View business and place information',

    capabilityMapViews: 'Use different map views',

    capabilityCurrentLocation:
      "Use the device's current location if you grant permission",

    guestNote: 'To save, share, create or start trips you need an account.',
  },
   profile: {
    personal: {
      title: 'Personal information',
      subtitle:
        'Update your basic data. This helps personalize your routes and statistics.',

      fields: {
        fullName: 'Full name',
        documentId: 'ID (optional)',
        phone: 'Phone',
        city: 'City',
        birthdate: 'Birthdate',
        gender: 'Gender (optional)',
        transport: 'Main transport mode',
        bio: 'Bio',
      },

      placeholders: {
        fullName: 'Your full name',
        documentId: 'ID / Passport',
        phone: 'Ex: 310 000 0000',
        city: 'City, country',
        birthdate: 'dd/mm/yy',
        bio: 'Tell us how you move around the city...',
      },

      gender: {
        male: 'Male',
        female: 'Female',
        other: 'Other',
      },

      transport: {
        walk: 'Walk',
        taxi: 'Taxi',
      },

      save: 'Save changes',
    },

    account: {
      title: 'Account settings',
      subtitle:
        'Language, theme and data export according to SRS requirements.',

      language: 'Interface language',
      export: 'Export my data',

      deleteTitle: 'Danger zone',
      deleteText:
        'If you delete your account, your personal data will be permanently removed.',
      deleteButton: 'Delete account',

      exportOptions: {
        pdf: 'PDF',
        excel: 'Excel',
      },
    },

    security: {
      title: 'Account security',
      subtitle: 'Update your password and secure your account.',

      email: 'Email',
      newPassword: 'New password',
      confirmPassword: 'Confirm password',

      hint:
        'Minimum 8 characters, one uppercase, one number and one special character.',

      button: 'Update password',
    },

    support: {
      title: 'Technical support',
      subtitle: 'Send a message and the admin will review your case.',

      priority: 'Priority',

      priorities: {
        low: 'Low',
        medium: 'Medium',
        high: 'High',
      },

      message: 'Message',
      placeholder: 'Describe the issue or improvement...',

      button: 'Send message',

      hint: 'Soon you will be able to chat with support in real time.',
    },
  },
};