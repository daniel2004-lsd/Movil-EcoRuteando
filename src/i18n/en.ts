// src/i18n/en.ts
export default {
  common: {
    errorTitle: 'Error',
    networkError: 'Connection error',
    appName: 'EcoRuteando',
    back: 'Back',
    ok: 'OK',
    close: 'Close',
    cancel: 'Cancel',
  },
  home: {
    logout: 'Log out',
    impactCo2: '0.21 kg of CO₂',

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

    // DASHBOARD
    hello: 'Hi',
    greetingSub: 'Where are we taking you today in a sustainable way?',
    logoutShort: 'Log out',
    defaultUser: 'user',
    guestUser: 'guest',
    statCo2: 'CO₂ avoided',
    statTrips: 'Trips',
    statTime: 'Time',
    statFavs: 'Favorites',
    tools: 'Tools',
    modulesCount: 'modules',
    modPlan: 'Plan route',
    modPlanSub: 'Calculate your eco-friendly route',
    modRoutes: 'My routes',
    modRoutesSub: 'Your saved routes',
    modHistory: 'History',
    modHistorySub: 'Your past trips',
    modFavs: 'Favorites',
    modFavsSub: 'Favorite routes',
    modProfile: 'Profile',
    modProfileSub: 'Your information',
    modAlerts: 'Alerts',
    modAlertsSub: 'Weather and notices',
    impactCardTitle: 'Your impact matters',
    impactDescBefore: 'Walking one kilometer avoids ',
    impactDescAfter: ' compared to driving.',
    seeStats: 'See statistics',
    footerNote: 'Every sustainable trip counts',
  },

  tabs: {
    home: 'Home',
    route: 'Route',
    history: 'History',
    favorites: 'Favorites',
    report: 'Report',
    stats: 'Statistics',
    profile: 'Profile',
  },
  stats: {
    title: 'Your mobility statistics',
    subtitle: 'See your environmental impact, your trip habits and download your data for reports.',
    co2ThisMonth: 'CO₂ avoided this month',
    ecoTrips: 'Eco-friendly trips',
    co2PerMonth: 'CO₂ avoided per month (kg)',
    co2PerMonthDesc: 'How much CO₂ you have stopped emitting thanks to your sustainable routes.',
    modeDistribution: 'Trip distribution by mode',
    modeDistributionDesc: 'Comparison of how many trips you make in each transport mode.',
    timePerMode: 'Relative time by mode',
    timePerModeDesc: 'Approximate proportion of the total time you spend on each mode of transport.',
    co2PerTrip: 'CO₂ per trip: eco vs car',
    co2PerTripDesc: 'Share of emissions on an average route using eco options versus a private car.',
    detailedSummary: 'Detailed summary',
    taxiKm: 'Kilometers by car',
    totalTime: 'Total time on trips',
    jan: 'Jan',
    feb: 'Feb',
    mar: 'Mar',
    apr: 'Apr',
    may: 'May',
    jun: 'Jun',
    jul: 'Jul',
    aug: 'Aug',
    sep: 'Sep',
    oct: 'Oct',
    nov: 'Nov',
    dec: 'Dec',
    modeWalk: 'Walking',
    routeEco: 'Eco route',
    modeCar: 'Car',
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

  },
  planRoute: {
    selectOrigin: 'Select the origin to calculate the route',
    tripErrorFallback: 'Error completing the trip',

    needAccountTitle: 'Account required',
    needAccountMsg: 'To {action}, log in or create a free account.',
    notNow: 'Not now',
    actionStartTrips: 'start and log trips',
    actionShare: 'share routes',
    actionSave: 'save routes',
    actionVote: 'vote on reports',
    actionReport: 'report obstacles',
    permissionDeniedTitle: 'Permission denied',
    locationDeniedMsg: 'Could not access your location',
    myLocation: 'My location',
    selectOriginDest: 'Select origin and destination',
    routeNotFound: 'No route was found',
    routeCalcError: 'The route could not be calculated',
    routeFromApp: 'Route calculated from the mobile app',
    startTripError: 'Error starting the trip',
    missingOriginDest: 'Origin or destination is missing to start the trip',
    tripCompletedTitle: 'Trip completed!',
    tripCompletedMsg: 'Your trip has been recorded in your history.',
    close: 'Close',
    viewHistory: 'View history',
    arrivedSpeak: 'You have arrived at your destination. You can complete the trip.',
    arrivedAlertTitle: 'You have arrived!',
    arrivedAlertMsg: 'You reached your destination. Complete the trip?',
    later: 'Later',
    completeTrip: 'Complete trip',
    navArrived: 'You have arrived at your destination',
    navContinue: 'Continue to the destination',
    navStartedSpeak: 'Navigation started towards {name}.',
    routeSaved: 'Route saved',
    routeSavedMsg: 'The route was saved to your route history.',
    routeAlreadySaved: 'Already saved',
    routeAlreadySavedMsg: 'This route was already in your My routes list, so no duplicate was created.',
    favoriteAdded: 'Added to Favorites',
    favoriteAddedMsg: 'It now appears on the Favourite routes screen.',
    favoriteRemoved: 'Removed from Favorites',
    favoriteRemovedMsg: 'The route was removed from your favorites.',
    saveError: 'Could not be saved',
    unexpectedError: 'Unexpected error',
    locationRequiredTitle: 'Location required',
    voteLocationMsg: 'Enable your location to vote on nearby reports.',
    voteConfirmed: 'You confirmed it is still happening',
    voteRejected: 'You marked it as no longer happening',
    voteThanks: 'Thanks for voting',
    voteError: 'The vote could not be cast',
    addAsStop: 'Add as stop',
    howToGet: 'How to get there',
    minSlower: '{n} min slower',
    minFaster: '{n} min faster',
    sameTime: 'Same time',
    viewRoute: 'View route',
    report: 'Report',
    title: 'Plan Eco Route',

    subtitle:
      'Define your trip and choose the sustainable transportation method you want to use.',

    routeDataTitle: 'Trip Details',

    origin: 'Origin',
    originPlaceholder: 'Ex: Central Park',

    destination: 'Destination',
    destinationPlaceholder: 'Ex: Park, street or place',

    transportType: 'Eco-friendly transportation type',

    taxi: 'Taxi',

    calculateButton: 'Calculate eco route',

    mapTitle: 'Route Map',

    ecoSummaryTitle: 'Eco Summary (example)',

    estimatedTime: 'Estimated Time',
    distance: 'Distance',
    avoidedCO2: 'Avoided CO₂',
  },
  alerts: {
  title: 'Weather alerts',
  subtitle: 'Active alerts at your current location',
  empty: 'There are no active alerts in your area right now',
  loading: 'Checking your area\'s weather…',
  locationError: 'We could not get your location. Check the location permission.',
  permLocation: 'Turn on location permission to know if you are in an alert zone.',
  permNotifications: 'Turn on notifications to receive weather alerts.',
  area: 'Affected area',
  period: 'Validity period',
  description: 'Description',
  instruction: 'Recommendation',
  source: 'Source',
  testButton: 'Test notification',
  testSent: 'Test notification sent',
  refresh: 'Refresh',
  severity: 'Severity',
    feelsLike: 'Feels like',
  humidity: 'Humidity',
  wind: 'Wind',
  extendedForecast: 'Extended forecast',
  statActiveAlerts: 'Active alerts',
  statMaxSeverity: 'Highest alert',
  statTemperature: 'Temperature',
  rainChance: 'Rain',
  today: 'Today',
},
  favorites: {
    defaultName: 'Favorite route',

    empty: 'You have no saved favorite routes',
    refreshNote: 'Routes you marked with the heart are kept here.',
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
    menuViewMap: 'View on map',
    menuRouteInfo: 'Route info',
    routeInfoTitle: 'Route Information',
    menuHint: 'Choose an option for this route',
    infoDescription: 'Description',
    infoOrigin: 'Origin',
    infoDestination: 'Destination',
    infoMode: 'Mode',
    infoDistance: 'Distance',
    infoDuration: 'Estimated time',
    infoCo2Saved: 'CO₂ saved',
    infoDifficulty: 'Difficulty',
    infoSavedOn: 'Saved on',
    noData: 'No data',
    noDescription: 'No description',
    difficultyEasy: 'Easy',
    difficultyMedium: 'Moderate',
    difficultyHard: 'Hard',
    tapHint: 'Tap a route to see it on the map',
    kmUnit: 'km',
    minUnit: 'min',
    kgUnit: 'kg',
    noCoordsTitle: 'Route without location',
    noCoordsMsg: 'This route has no saved coordinates.',
  },
  landing: {
    changeLanguage: 'Change language',
    changeTheme: 'Change theme',
    openMenu: 'Open menu',

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
    voteHint: 'You can only vote near the report (max. 500 m). Your vote is unique and anonymous for other users.',
    formTitle: 'Report an obstacle',
    formSubtitle: 'What are you finding on your route?',
    gpsMsg: 'Your GPS location is required to submit the report.',
    sentTitle: 'Report submitted',
    sentMsg: 'Thanks. The report is already on the map.',
    sentMsgFull: 'Thanks. The report is already on the map with initial trust.',
    sentToast: 'Report submitted. Thanks!',
    sendFailedTitle: 'Could not be sent',
    cameraPermTitle: 'Camera permission',
    cameraPermMsg: 'Allow camera access to photograph the obstacle.',
    galleryPermTitle: 'Photos permission',
    galleryPermMsg: 'Allow access to your photos to attach an image.',
    cameraError: 'Could not open the camera.',
    galleryError: 'Could not open the gallery.',
    chooseTypeTitle: 'Choose a type',
    chooseTypeMsg: 'Select which obstacle you are reporting.',
    photoAttached: 'Photo attached',
    cameraBtn: 'Take photo',
    galleryBtn: 'Gallery',
    detailsPlaceholderOpt: 'Additional details (optional)',
    stillHappening: 'Is it still happening?',
    sending: 'Sending…',
    yes: 'Yes',
    no: 'No',
    voteActive: 'Active',
    voteConfirmed: 'Confirmed',
    voteDisputed: 'Disputed',
    voteExpired: 'Expired',
    nearbyReport: 'Nearby report',

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
    empty: 'You have no trips registered yet',
    title: "Trip history",
    origin: 'Origin location',
    destination: 'Destination',
    tripsRegistered: "Registered trips",
    totalCO2: "Total CO₂ saved",
    exportPdf: "Export PDF",
    exportExcel: "Export Excel",
  },
  auth: {
    tooManyAttempts: 'Too many attempts. Wait before trying again.',
    invalidCredentials: 'Incorrect email or password.',
    resetPassError: 'Error resetting the password',

    // RECOVER CODE
    stepEmail: 'EMAIL',
    stepCode: 'CODE',
    stepPassword: 'PASSWORD',
    recoverCodeTitle: 'Verify code',
    recoverCodeSubtitle:
      'We sent a 6-digit code to your registered email address',
    recoverCodeErrorFill: 'Enter the 6 digits of the code',
    recoverCodeNotReceived: "Didn't receive the code?",
    recoverCodeResend: 'Resend',
    recoverCodeButton: 'Verify code',

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

    // AUTH SCREENS (login / register / recover / verify-code)
    loggingIn: 'Logging in...',
    loginTagline: 'Every sustainable journey begins with a single step',
    registerTagline: 'Start your sustainable journey',
    communityTagline: 'Join the community that cares for the planet',
    firstNameLabel: 'First name',
    firstNamePlaceholder: 'Your name',
    lastNameLabel: 'Last name',
    lastNamePlaceholder: 'Doe',
    emailValid: 'Valid email',
    pwCheckUppercase: 'At least one uppercase letter',
    pwCheckNumber: 'At least one number',
    pwCheckSpecial: 'At least one special character',
    confirmPasswordPlaceholder: 'Repeat your password',
    passwordMatch: 'Passwords match',
    passwordMinShort: 'Min. 8 characters',
    orRegisterWith: 'Or sign up with',
    registering: 'Signing up...',
    recoverTitle: 'Recover password',
    recoverSubtitle: 'Enter your email and we will send you a 6-digit verification code to reset your password.',
    recoverSentTitle: 'Check your email',
    recoverSentSubtitle: 'We have sent a verification code to:',
    recoverWrongEmail: 'Wrong email? Change it',
    recoverHaveCode: 'I already have the code →',
    sendCode: 'Send code',
    sendingCode: 'Sending code...',
    backToLogin: 'Back to login',
    backToRegister: 'Back to registration',
    stepEmailLabel: 'EMAIL',
    stepCodeLabel: 'CODE',
    stepPasswordLabel: 'PASSWORD',
    newPasswordTitle: 'New password',
    newPasswordSubtitle: 'Choose a strong password to protect your account',
    confirmNewPasswordLabel: 'Confirm new password',
    resetPasswordButton: 'Reset password',
    verifyCodeTitle: 'Verify your account',
    verifyCodeSubtitle: 'Enter the 4-digit code we sent to your email.',
    confirmCodeButton: 'Confirm code',
    resendCode: 'Resend code',
    fillAllFields: 'Fill in all fields',
    passwordMin8Error: 'The password must be at least 8 characters long',
    invalidEmailMsg: 'Enter a valid email address.',
    tooManyRequests: 'Too many requests. Wait a few minutes.',
    sendCodeError: 'The code could not be sent.',
    fillBothFields: 'Fill in both fields',
    codeIncomplete: 'Enter the 4 digits of the code',
    codeInvalid: 'Invalid code',
    resendError: 'Error resending the code',
    registerInvalidForm: 'Please fill in all fields correctly',
    emailAlreadyRegistered: 'This email is already registered.',
    alreadyRegisteredTitle: 'You are already registered',
    alreadyRegisteredMsg: 'This email already has an account. Do you want to log in or resend the verification code?',
    alreadyRegisteredOAuthMsg: 'This email already has an EcoRuteando account. Sign in to continue.',
    registerErrorFallback: 'Could not register the user',
    oauthCancelledTitle: 'Sign in with Google cancelled',
    oauthCancelledMsg: 'You did not finish signing in with Google.',
    oauthErrorTitle: 'Could not sign in with Google',
    oauthNoCode: 'Google did not return the authorization code. Please try again.',
    oauthNoToken: 'Google did not return a valid access token. Please try again.',
    cancel: 'Cancel',
    errorTitle: 'Error',

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
     tabs: {
       personal: 'Profile & settings',
       security: 'Security',
       support: 'Support',
     },
     defaultName: 'EcoRuteando user',
     defaultEmail: '—',
     changePhoto: 'Change photo',
     theme: {
       light: 'Light',
       dark: 'Dark',
     },
     languages: {
       es: 'Spanish',
       en: 'English',
       fr: 'French',
       pt: 'Portuguese',
     },
     feedback: {
       savedTitle: 'Changes saved',
       savedMsg: 'Your profile was updated successfully.',
       error: 'The operation could not be completed.',
       invalidPass: 'The password does not meet the requirements or does not match.',
       passTitle: 'Password updated',
       passMsg: 'Your password was changed successfully.',
       supportTitle: 'Message sent',
       supportMsg: 'The support team will review your case soon.',
       emptyMessage: 'Write a message before sending it.',
     },
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
  terms: {
    hint: 'Scroll to the end to enable acceptance',
    readToEnd: 'Read to the end',
    acceptance: {
      title: '1. Acceptance of the Terms',
      body: 'By registering and using EcoRuteando services, you agree to be bound by these Terms and Conditions. If you do not agree with any of the terms set out here, we recommend that you do not use the platform.',
    },
    service: {
      title: '2. Description of the Service',
      body: 'EcoRuteando is a sustainable mobility platform developed as part of the SENA Software Development programme, Neiva, Colombia. Its purpose is to make it easier to plan efficient eco-friendly routes, promoting lower carbon footprints in urban environments.',
    },
    registration: {
      title: '3. User Registration',
      body: 'To access the full features of the platform, the user must create an account with truthful, complete and up-to-date information. EcoRuteando reserves the right to suspend or delete accounts containing false data or that breach these terms. The user is responsible for keeping their access credentials confidential.',
    },
    acceptableUse: {
      title: '4. Acceptable Use',
      body: 'The user agrees to use the platform only for lawful purposes and in line with its intent. The following are expressly prohibited: sharing offensive content, using the platform for illegal activities, attempting to break system security, impersoning other users or EcoRuteando, and performing actions that may affect platform performance.',
    },
    privacy: {
      title: '5. Privacy and Data Protection',
      body: 'EcoRuteando collects and processes its users’ personal data in accordance with Law 1581 of 2012 (Colombia’s Personal Data Protection Law) and its regulatory decrees. The data collected is used solely to provide the service, improve the platform and send related communications, always with the user’s prior consent.',
    },
    routes: {
      title: '6. Route Information and Availability',
      body: 'Information about routes and travel times is indicative and may vary depending on local conditions. EcoRuteando is not responsible for delays, route changes or outdated information.',
    },
    intellectual: {
      title: '7. Intellectual Property',
      body: 'All intellectual property rights over the platform, including its design, source code, logos and content, belong to the EcoRuteando development team. Reproducing, modifying or distributing them without express written permission is prohibited.',
    },
    modifications: {
      title: '8. Service Modifications',
      body: 'EcoRuteando reserves the right to modify, suspend or discontinue the service at any time, with or without prior notice. These Terms and Conditions may also be updated periodically; changes take effect when published on the platform.',
    },
    liability: {
      title: '9. Limitation of Liability',
      body: 'EcoRuteando will not be liable for direct, indirect, incidental or consequential damages arising from the use or inability to use the platform, including data loss, service interruptions or inaccuracies in route information.',
    },
    law: {
      title: '10. Applicable Law and Jurisdiction',
      body: 'These Terms and Conditions are governed by the laws of the Republic of Colombia. Any dispute arising from their interpretation or application will be settled before the competent courts of the city of Neiva, Huila, Colombia.',
    },
    contact: {
      title: '11. Contact',
      body: 'For questions related to these terms, the user can contact EcoRuteando through the official channels available on the platform.',
    },
  },

  pw: {
    weak: 'Weak',
    regular: 'Fair',
    strong: 'Strong',
    veryStrong: 'Very strong',
  },

  reportTypes: {
    traffic_light: 'Broken traffic light',
    signage: 'Signage',
    obstruction: 'Obstruction on the road',
    pothole: 'Pothole',
    sewer: 'Open manhole',
    hole: 'Pothole',
    blocked: 'Blocked road',
    flood: 'Flood',
    works: 'Roadworks',
    traffic: 'Traffic',
    lighting: 'Missing street light',
    other: 'Other obstacle',
    default: 'Obstacle',
  },

  poiCats: {
    restaurant: 'Restaurants',
    cafe: 'Cafés',
    lodging: 'Hotels',
    atm: 'ATMs',
    gas: 'Gas stations',
    pharmacy: 'Pharmacies',
    supermarket: 'Supermarkets',
    bar: 'Bars',
  },

  modes: {
    driving: 'Car',
    walking: 'Walk',
  },

  map: {
    explore: 'Explore EcoRuteando',
    barPlaceholder: 'Where do you want to go?',
    popular: 'Popular destinations',
    planRoute: 'Plan a route',
    whereFrom: 'Where are you?',
    whereTo: 'Where are you going?',
    calculating: 'Calculating…',
    searching: 'Searching near you…',
    searchingFor: 'Searching {name}…',
    resultsCount: '{n} places found',
    noResults: 'No nearby places found',
    open: 'Open',
    closed: 'Closed',
  },

  addStop: {
    extraMin: 'more than {n} min',
    title: 'Add stops to your route',
    subtitle: 'Find cafés, parks and much more',
    searchPlaceholder: 'Search along the route',
    onRoute: 'On your route',
    bestOf: 'Best {name}',
    empty: 'We found no places nearby. Try another category.',
    hint: 'Choose a category or search for a place to add it.',
    add: 'Add',
  },

  routeSheet: {
    otherRoutes: 'Other routes',
    directions: 'Directions',
    addStops: 'Add stops',
    share: 'Share',
    inProgress: 'In progress',
    save: 'Save',
    saved: 'Saved',
    favorite: 'Favorite',
    favorited: 'Favorited',
    completing: 'Completing...',
    complete: 'Complete',
    starting: 'Starting...',
    startTrip: 'Start trip',
    am: 'AM',
    pm: 'PM',
  },

  settings: {
    title: 'Settings',
  },

  tracking: {
    title: 'Tracking',
  },

  savedRoutes: {
    title: 'My routes',
    back: 'Back',
    subtitle: 'Routes you saved',
    refreshNote: 'Refreshes every time you open this screen',
    listTitle: 'Your routes',
    retry: 'Try again',
    countLabel: 'Saved',
    distanceLabel: 'Total distance',
    co2Label: 'CO₂ avoided',
    origin: 'Origin',
    destination: 'Destination',
    kmSuffix: 'km',
    minSuffix: 'min',
    empty: 'You have no saved routes yet',
    emptySub: 'Plan a route and save it to see it here',
    loadError: 'Could not load your routes',
    delete: 'Delete',
    deleteTitle: 'Delete route',
    deleteMessage: 'Are you sure you want to delete this saved route?',
    deleteCancel: 'Cancel',
    deleteConfirm: 'Delete',
    deleteError: 'Could not delete the route',
    searchPlaceholder: 'Search by name, origin or destination',
    noResults: 'No routes match that text',
    noResultsSub: 'Try another word or clear the search',
    transport: {
      bike: 'Bike',
      public_transport: 'Public transport',
      mixed: 'Mixed',
      walking: 'Walking',
      car: 'Car',
    },
    status: {
      active: 'Active',
      inactive: 'Inactive',
      under_review: 'Under review',
      archived: 'Archived',
    },
  },

};