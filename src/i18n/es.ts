// src/i18n/es.ts
export default {
  common: {
    errorTitle: 'Error',
    networkError: 'Error de conexión',
    appName: 'EcoRuteando',
    back: 'Volver',
    ok: 'Aceptar',
    close: 'Cerrar',
    cancel: 'Cancelar',
  },
  home: {
    logout: 'Cerrar sesión',
    impactCo2: '0.21 kg de CO₂',

    welcome: '¡Bienvenido de vuelta!',

    planTitle: 'Planear ruta',
    planDesc: 'Encuentra la ruta más ecológica para tu destino.',

    historyTitle: 'Mi historial',
    historyDesc: 'Revisa tu impacto ambiental y el ahorro de CO₂.',

    favoritesTitle: 'Rutas favoritas',
    favoritesDesc: 'Accede rápido a tus rutas ecológicas preferidas.',

    poiTitle: 'Puntos de interés',
    poiDesc: 'Explora lugares ecológicos en tu ruta.',

    reportTitle: 'Reportar problema',
    reportDesc: 'Ayuda mejorando las rutas reportando obstáculos.',

    profileTitle: 'Mi perfil',
    profileDesc: 'Gestiona tus datos, seguridad y soporte técnico.',

    impactTitle: 'Tu impacto en el planeta',

    impactText:
      'Cada trayecto ecológico cuenta. Pronto podrás ver aquí el CO₂ que has evitado emitir.',

    statsButton: 'Ver estadísticas completas',

    // DASHBOARD
    hello: 'Hola',
    greetingSub: '¿A dónde te llevamos hoy de forma sostenible?',
    logoutShort: 'Salir',
    defaultUser: 'usuario',
    guestUser: 'invitado',
    statCo2: 'CO₂ evitado',
    statTrips: 'Viajes',
    statTime: 'Tiempo',
    statFavs: 'Favoritos',
    tools: 'Herramientas',
    modulesCount: 'módulos',
    modPlan: 'Planificar ruta',
    modPlanSub: 'Calcula tu ruta ecológica',
    modRoutes: 'Mis rutas',
    modRoutesSub: 'Tus rutas guardadas',
    modHistory: 'Historial',
    modHistorySub: 'Tus trayectos pasados',
    modFavs: 'Favoritos',
    modFavsSub: 'Rutas favoritas',
    modProfile: 'Perfil',
    modProfileSub: 'Tu información',
    modAlerts: 'Alertas',
    modAlertsSub: 'Clima y avisos',
    impactCardTitle: 'Tu impacto importa',
    impactDescBefore: 'Cada kilómetro a pie evita ',
    impactDescAfter: ' frente al carro.',
    seeStats: 'Ver estadísticas',
    footerNote: 'Cada viaje sostenible cuenta',
  },

  tabs: {
    home: 'Inicio',
    route: 'Ruta',
    history: 'Historial',
    favorites: 'Favoritos',
    report: 'Reportar',
    stats: 'Estadísticas',
    profile: 'Perfil',
  },
  stats: {
    title: 'Estadísticas de tu movilidad',
    subtitle: 'Visualiza tu impacto ecológico, tus hábitos de trayectos y descarga tus datos para reportes.',
    co2ThisMonth: 'CO₂ evitado este mes',
    ecoTrips: 'Trayectos ecológicos',
    co2PerMonth: 'CO₂ evitado por mes (kg)',
    co2PerMonthDesc: 'Seguimiento de cuánto CO₂ has dejado de emitir gracias a tus rutas sostenibles.',
    modeDistribution: 'Distribución de trayectos por modo',
    modeDistributionDesc: 'Comparación de cuántos trayectos haces en cada modo de transporte.',
    timePerMode: 'Tiempo relativo por modo',
    timePerModeDesc: 'Proporción aproximada del tiempo total que dedicas a cada modo de transporte.',
    co2PerTrip: 'CO₂ por trayecto: eco vs carro',
    co2PerTripDesc: 'Proporción de emisiones en una ruta promedio usando opciones eco frente a un carro particular.',
    detailedSummary: 'Resumen detallado',
    taxiKm: 'Kilómetros en carro',
    totalTime: 'Tiempo total en trayectos',
    jan: 'Ene',
    feb: 'Feb',
    mar: 'Mar',
    apr: 'Abr',
    may: 'May',
    jun: 'Jun',
    jul: 'Jul',
    ago: 'Ago',
    sep: 'Sep',
    oct: 'Oct',
    nov: 'Nov',
    dic: 'Dic',
    modeWalk: 'Caminar',
    routeEco: 'Ruta eco',
    modeCar: 'Carro',
  },
  poi: {
    back: 'Volver',
    title: 'Puntos de interés',
    helper:
      'Explora lugares públicos cercanos a tus trayectos: parques, cafés, puntos ecológicos y más.',

    distance: {
      nearRoute: 'Cerca de tu ruta',
      nearDestination: 'Cerca de tu destino',
    },

    actions: {
      details: 'Detalles',
      map: 'Ver en el mapa',
    },

    types: {
      park: 'Parque público',
      recycle: 'Punto ecológico',
      cafe: 'Cafetería',
    },

  },
  planRoute: {
    selectOrigin: 'Selecciona el origen para calcular la ruta',
    tripErrorFallback: 'Error completando el viaje',

    needAccountTitle: 'Necesitas una cuenta',
    needAccountMsg: 'Para {action} inicia sesión o crea una cuenta gratis.',
    notNow: 'Ahora no',
    actionStartTrips: 'iniciar y registrar viajes',
    actionShare: 'compartir rutas',
    actionSave: 'guardar rutas',
    actionVote: 'votar reportes',
    actionReport: 'reportar obstáculos',
    permissionDeniedTitle: 'Permiso denegado',
    locationDeniedMsg: 'No se pudo acceder a tu ubicación',
    myLocation: 'Mi ubicación',
    selectOriginDest: 'Selecciona origen y destino',
    routeNotFound: 'No se encontró una ruta',
    routeCalcError: 'No se pudo calcular la ruta',
    routeFromApp: 'Ruta calculada desde la app móvil',
    startTripError: 'Error iniciando el viaje',
    missingOriginDest: 'Faltan origen o destino para iniciar el viaje',
    tripCompletedTitle: '¡Viaje completado!',
    tripCompletedMsg: 'Tu trayecto quedó registrado en el historial.',
    close: 'Cerrar',
    viewHistory: 'Ver historial',
    arrivedSpeak: 'Has llegado a tu destino. Puedes completar el viaje.',
    arrivedAlertTitle: '¡Has llegado!',
    arrivedAlertMsg: 'Tu trayecto llegó al destino. ¿Completar el viaje?',
    later: 'Después',
    completeTrip: 'Completar viaje',
    navArrived: 'Has llegado a tu destino',
    navContinue: 'Continúa hasta el destino',
    navStartedSpeak: 'Navegación iniciada hacia {name}.',
    routeSaved: 'Ruta guardada',
    routeSavedMsg: 'La ruta quedó en tu historial de rutas.',
    routeAlreadySaved: 'Ya estaba guardada',
    routeAlreadySavedMsg: 'Esta ruta ya estaba en tu lista de Mis rutas, así que no se creó otra igual.',
    favoriteAdded: 'Guardado en Favoritos',
    favoriteAddedMsg: 'Ya aparece en la pantalla de Rutas favoritas.',
    favoriteRemoved: 'Quitado de Favoritos',
    favoriteRemovedMsg: 'La ruta se quitó de tus favoritos.',
    saveError: 'No se pudo guardar',
    unexpectedError: 'Error inesperado',
    locationRequiredTitle: 'Ubicación requerida',
    voteLocationMsg: 'Activa tu ubicación para votar reportes cercanos.',
    voteConfirmed: 'Confirmaste que sigue ocurriendo',
    voteRejected: 'Marcaste que ya no ocurre',
    voteThanks: 'Gracias por votar',
    voteError: 'No se pudo votar',
    addAsStop: 'Agregar como parada',
    howToGet: 'Cómo llegar',
    minSlower: '{n} min más lento',
    minFaster: '{n} min más rápido',
    sameTime: 'Mismo tiempo',
    viewRoute: 'Ver ruta',
    report: 'Reportar',
    title: 'Planear ruta ecológica',

    subtitle:
      'Define tu trayecto y el tipo de transporte sostenible que quieres usar.',

    routeDataTitle: 'Datos del trayecto',

    origin: 'Origen',
    originPlaceholder: 'Ej: Parque Central',

    destination: 'Destino',
    destinationPlaceholder: 'Ej: Parque, calle o lugar',

    transportType: 'Tipo de transporte ecológico',

    taxi: 'Taxi',

    calculateButton: 'Calcular ruta ecológica',

    mapTitle: 'Mapa del trayecto',

    ecoSummaryTitle: 'Resumen ecológico (ejemplo)',

    estimatedTime: 'Tiempo estimado',
    distance: 'Distancia',
    avoidedCO2: 'CO₂ evitado',
  },
  alerts: {
  title: 'Alertas climáticas',
  subtitle: 'Alertas activas en tu ubicación actual',
  empty: 'No hay alertas activas en tu zona ahora mismo',
  loading: 'Consultando el clima de tu zona…',
  locationError: 'No pudimos obtener tu ubicación. Revisa el permiso de ubicación.',
  permLocation: 'Activa el permiso de ubicación para saber si estás en una zona con alerta.',
  permNotifications: 'Activa las notificaciones para recibir alertas climáticas.',
  area: 'Zona afectada',
  period: 'Vigencia',
  description: 'Descripción',
  instruction: 'Recomendación',
  source: 'Fuente',
  testButton: 'Probar notificación',
  testSent: 'Notificación de prueba enviada',
  refresh: 'Actualizar',
  severity: 'Severidad',
    feelsLike: 'Sensación térmica',
  humidity: 'Humedad',
  wind: 'Viento',
  extendedForecast: 'Pronóstico extendido',
  statActiveAlerts: 'Alertas activas',
  statMaxSeverity: 'Alerta máxima',
  statTemperature: 'Temperatura',
  rainChance: 'Lluvia',
  today: 'Hoy',
},
  favorites: {
    defaultName: 'Ruta favorita',

    empty: 'No tienes rutas favoritas guardadas',
    refreshNote: 'Rutas que marcaste con el corazón se guardan aquí.',
    back: 'Volver',

    title: 'Rutas favoritas',

    savedRoutes: 'Rutas guardadas',
    ecoFocus: 'Enfoque',
    ecoRoutes: 'Rutas eco',

    ecoBadge: 'Eco',

    origin: 'Origen',
    destination: 'Destino',

    detailsButton: 'Ver detalles',
    useRouteButton: 'Usar esta ruta',

    route1Name: 'Casa → Trabajo',
    route1From: 'Barrio Las Palmas',
    route1To: 'Centro de Neiva',
    route1Co2: '0.20 t CO₂ evitado por mes',

    route2Name: 'Universidad → Parque',
    route2From: 'Universidad',
    route2To: 'Parque Santander',
    route2Co2: '0.10 t CO₂ evitado por mes',
    menuViewMap: 'Ver en el mapa',
    menuRouteInfo: 'Información de la ruta',
    routeInfoTitle: 'Información de la ruta',
    menuHint: 'Elige una opción para esta ruta',
    infoDescription: 'Descripción',
    infoOrigin: 'Origen',
    infoDestination: 'Destino',
    infoMode: 'Modo',
    infoDistance: 'Distancia',
    infoDuration: 'Duración estimada',
    infoCo2Saved: 'CO₂ ahorrado',
    infoDifficulty: 'Dificultad',
    infoSavedOn: 'Guardada el',
    noData: 'Sin dato',
    noDescription: 'Sin descripción',
    difficultyEasy: 'Fácil',
    difficultyMedium: 'Moderada',
    difficultyHard: 'Difícil',
    tapHint: 'Toca una ruta para verla en el mapa',
    kmUnit: 'km',
    minUnit: 'min',
    kgUnit: 'kg',
    noCoordsTitle: 'Ruta sin ubicación',
    noCoordsMsg: 'Esta ruta no tiene coordenadas guardadas.',
  },
  landing: {
    changeLanguage: 'Cambiar idioma',
    changeTheme: 'Cambiar tema',
    openMenu: 'Abrir menú',

    tagline: 'Movilidad sostenible',
    heroTitle: 'Muévete inteligente',
    heroSlogan: 'Conecta rutas y cuida el planeta',
    heroDesc:
      'EcoRuteando te ayuda a encontrar rutas eficientes y ecológicas.',
    guestButton: 'Modo invitado',

    mobilityTitle: 'Movilidad inteligente',
    mobilityDesc:
      'EcoRuteando te ayuda a moverte de forma eficiente mientras cuidas el ambiente.',

    optimizedRoutes: 'Rutas optimizadas',
    optimizedRoutesDesc:
      'Encuentra trayectos eficientes para ahorrar tiempo.',

    environmentalImpact: 'Impacto ambiental',
    environmentalImpactDesc:
      'Visualiza cuánto CO₂ evitas en cada viaje que realizas.',

    easyUse: 'Fácil de usar',
    easyUseDesc:
      'Interfaz intuitiva diseñada para planificar en segundos.',

    whyTitle: '¿Por qué EcoRuteando?',

    whyRealtime: 'Tiempo real',
    whyRealtimeDesc:
      'Información actualizada de rutas locales y tiempos estimados.',

    whyGreen: 'Compromiso verde',
    whyGreenDesc:
      'Cada trayecto sostenible aporta a reducir la contaminación.',

    drawerLanguage: 'IDIOMA',
    drawerAccess: 'ACCESO RÁPIDO',

    features: 'Características',
    whyMenu: '¿Por qué?',
    join: 'Únete',
    routes: 'Rutas',

    privacy: 'Privacidad',
    terms: 'Términos',
    contact: 'Contacto',

    joinGreen: 'Únete a la revolución verde 🌿',

    footerText: '© 2025 EcoRuteando — SENA Neiva, Huila',
  }, report: {
    formTitle: 'Reportar obstáculo',
    voteHint: 'Solo puedes votar cerca del reporte (máx. 500 m). Tu voto es único y anónimo para otros usuarios.',
    formSubtitle: '¿Qué estás encontrando en tu ruta?',
    gpsMsg: 'Se necesita tu ubicación GPS para enviar el reporte.',
    sentTitle: 'Reporte enviado',
    sentMsg: 'Gracias. El reporte ya está en el mapa.',
    sentMsgFull: 'Gracias. El reporte ya está en el mapa con confianza inicial.',
    sentToast: 'Reporte enviado. ¡Gracias!',
    sendFailedTitle: 'No se pudo enviar',
    cameraPermTitle: 'Permiso de cámara',
    cameraPermMsg: 'Permite el acceso a la cámara para fotografiar el obstáculo.',
    galleryPermTitle: 'Permiso de galería',
    galleryPermMsg: 'Permite el acceso a tus fotos para adjuntar una imagen.',
    cameraError: 'No se pudo abrir la cámara.',
    galleryError: 'No se pudo abrir la galería.',
    chooseTypeTitle: 'Elige un tipo',
    chooseTypeMsg: 'Selecciona qué obstáculo estás reportando.',
    photoAttached: 'Foto adjunta',
    cameraBtn: 'Tomar foto',
    galleryBtn: 'Galería',
    detailsPlaceholderOpt: 'Detalles adicionales (opcional)',
    stillHappening: '¿Sigue ocurriendo?',
    sending: 'Enviando…',
    yes: 'Sí',
    no: 'No',
    voteActive: 'Activo',
    voteConfirmed: 'Confirmado',
    voteDisputed: 'Disputado',
    voteExpired: 'Expirado',
    nearbyReport: 'Reporte cercano',

    title: 'Reporte ciudadano',

    helperText:
      'Reporta obstáculos que dificulten las rutas ecológicas: huecos, inundaciones, ciclorutas bloqueadas, falta de iluminación, etc.',

    obstacleType: 'Tipo de obstáculo',
    selectObstacle: 'Selecciona el tipo de obstáculo',

    obstacles: {
      hole: 'Hueco en la vía',
      blocked: 'Cicloruta bloqueada',
      flood: 'Inundación / agua',
      works: 'Obras en la vía',
      traffic: 'Tráfico muy pesado',
      lighting: 'Falta de iluminación',
      other: 'Otro problema',
    },

    locationTitle: 'Ubicación aproximada',

    locationPlaceholder:
      'Ejemplo: Cra 5 con calle 10, junto al parque',

    photoTitle: 'Foto del obstáculo',

    photoHelp:
      'Adjunta una foto para que el administrador pueda validar mejor el reporte (muy recomendado).',

    changePhoto: 'Cambiar foto',
    takePhoto: 'Tomar o seleccionar foto',

    detailsTitle: 'Detalles adicionales',

    detailsPlaceholder:
      'Describe qué está pasando y cómo afecta la ruta...',

    send: 'Enviar reporte',

    footerNote:
      'Los reportes serán validados según RF17 y RF18 del SRS y podrán usarse para ajustar rutas y alertas ecológicas.',
  },
  history: {
    empty: 'No tienes trayectos registrados aún',
    title: "Historial de trayectos",
    origin: 'Ubicación de origen',
    destination: 'Destino',
    tripsRegistered: "Trayectos registrados",
    totalCO2: "CO₂ total evitado",
    exportPdf: "Exportar PDF",
    exportExcel: "Exportar Excel",
  },
  auth: {
    tooManyAttempts: 'Demasiados intentos. Espera antes de reintentar.',
    invalidCredentials: 'Correo o contraseña incorrectos.',
    resetPassError: 'Error al restablecer contraseña',

    // RECOVER CODE
    stepEmail: 'CORREO',
    stepCode: 'CÓDIGO',
    stepPassword: 'CONTRASEÑA',
    recoverCodeTitle: 'Verificar código',
    recoverCodeSubtitle:
      'Hemos enviado un código de 6 dígitos a tu correo registrado',
    recoverCodeErrorFill: 'Completa los 6 dígitos del código',
    recoverCodeNotReceived: '¿No recibiste el código?',
    recoverCodeResend: 'Reenviar',
    recoverCodeButton: 'Verificar código',

    loginTitle: 'Iniciar sesión',
    loginSubtitle:
      'Accede a tu cuenta para continuar.',

    // REGISTER
    registerTitle: 'Crear cuenta',
    registerSubtitle:
      'Completa tus datos para comenzar tu experiencia sostenible.',

    // LABELS
    nameLabel: 'Nombre completo',
    emailLabel: 'Correo electrónico',
    passwordLabel: 'Contraseña',
    confirmPasswordLabel: 'Confirmar contraseña',

    // PLACEHOLDERS
    emailPlaceholder: 'tucorreo@email.com',
    passwordPlaceholder: 'Tu contraseña',

    // BUTTONS
    loginButton: 'Iniciar sesión',
    registerButton: 'Registrarse',
    acceptTermsButton: 'Acepto los términos',
    close: 'Cerrar',
    back: 'Volver',

    // LINKS
    alreadyAccount: '¿Ya tienes cuenta?',
    loginHere: 'Inicia sesión aquí.',
    noAccount: '¿No tienes cuenta?',
    registerHere: 'Regístrate aquí.',
    forgotPassword: '¿Olvidaste tu contraseña?',

    // TERMS
    acceptTermsPrefix: 'He leído y acepto los',
    andPrivacy: 'y la',
    termsAndConditions: 'Términos y Condiciones',
    privacyPolicy: 'Política de Privacidad',
    termsUpdated:
      'EcoRuteando · Última actualización: enero 2025',

    // VALIDATIONS
    requiredField: 'Campo obligatorio',

    emailRequired: 'El correo es requerido',
    emailInvalid:
      'Ingresa un correo válido con @',

    passwordRequired:
      'La contraseña es requerida',

    passwordMin: 'Mínimo 8 caracteres',

    passwordStrong:
      'Debe tener mayúscula, número y carácter especial',

    passwordMismatch:
      'Las contraseñas no coinciden',

    termsError:
      'Debes aceptar los términos para continuar',

    // PASSWORD STATES
    passwordEmpty: 'Contraseña sin evaluar',
    passwordWeak: 'Contraseña débil',
    passwordMedium: 'Contraseña media',
    passwordStrongLabel: 'Contraseña fuerte',

    // SOCIAL
    orContinueWith: 'O continúa con',

    // AUTH SCREENS (login / register / recover / verify-code)
    loggingIn: 'Iniciando sesión...',
    loginTagline: 'Cada viaje sostenible comienza con un paso',
    registerTagline: 'Comienza tu viaje sostenible',
    communityTagline: 'Únete a la comunidad que cuida el planeta',
    firstNameLabel: 'Nombre',
    firstNamePlaceholder: 'Tu nombre',
    lastNameLabel: 'Apellido',
    lastNamePlaceholder: 'Salazar',
    emailValid: 'Correo válido',
    pwCheckUppercase: 'Al menos una mayúscula',
    pwCheckNumber: 'Al menos un número',
    pwCheckSpecial: 'Al menos un carácter especial',
    confirmPasswordPlaceholder: 'Repite tu contraseña',
    passwordMatch: 'Las contraseñas coinciden',
    passwordMinShort: 'Mín. 8 caracteres',
    orRegisterWith: 'O regístrate con',
    registering: 'Registrando...',
    recoverTitle: 'Recuperar contraseña',
    recoverSubtitle: 'Ingresa tu correo electrónico y te enviaremos un código de verificación de 6 dígitos para restablecer tu contraseña.',
    recoverSentTitle: 'Revisa tu correo',
    recoverSentSubtitle: 'Hemos enviado un código de verificación a:',
    recoverWrongEmail: '¿Correo incorrecto? Cambiarlo',
    recoverHaveCode: 'Ya tengo el código →',
    sendCode: 'Enviar código',
    sendingCode: 'Enviando código...',
    backToLogin: 'Volver al inicio de sesión',
    backToRegister: 'Volver al registro',
    stepEmailLabel: 'CORREO',
    stepCodeLabel: 'CÓDIGO',
    stepPasswordLabel: 'CONTRASEÑA',
    newPasswordTitle: 'Nueva contraseña',
    newPasswordSubtitle: 'Elige una contraseña segura para proteger tu cuenta',
    confirmNewPasswordLabel: 'Confirmar nueva contraseña',
    resetPasswordButton: 'Restablecer contraseña',
    verifyCodeTitle: 'Verifica tu cuenta',
    verifyCodeSubtitle: 'Ingresa el código de 4 dígitos que enviamos a tu correo.',
    confirmCodeButton: 'Confirmar código',
    resendCode: 'Reenviar código',
    fillAllFields: 'Completa todos los campos',
    passwordMin8Error: 'La contraseña debe tener al menos 8 caracteres',
    invalidEmailMsg: 'Ingresa un correo electrónico válido.',
    tooManyRequests: 'Demasiadas solicitudes. Espera unos minutos.',
    sendCodeError: 'No fue posible enviar el código.',
    fillBothFields: 'Completa ambos campos',
    codeIncomplete: 'Completa los 4 dígitos del código',
    codeInvalid: 'Código inválido',
    resendError: 'Error al reenviar código',
    registerInvalidForm: 'Por favor, completa todos los campos correctamente',
    emailAlreadyRegistered: 'El correo ya está registrado.',
    alreadyRegisteredTitle: 'Ya estás registrado',
    alreadyRegisteredMsg: 'Este correo ya tiene una cuenta. ¿Quieres iniciar sesión o reenviar el código de verificación?',
    alreadyRegisteredOAuthMsg: 'Este correo ya tiene una cuenta en EcoRuteando. Inicia sesión para continuar.',
    registerErrorFallback: 'No fue posible registrar el usuario',
    oauthCancelledTitle: 'Inicio con Google cancelado',
    oauthCancelledMsg: 'No completaste el inicio de sesión con Google.',
    oauthErrorTitle: 'No se pudo iniciar con Google',
    oauthNoCode: 'Google no devolvió el código de autorización. Inténtalo de nuevo.',
    oauthNoToken: 'Google no devolvió un token de acceso válido. Inténtalo de nuevo.',
    cancel: 'Cancelar',
    errorTitle: 'Error',

    termsContent: `1. Aceptación de los Términos

      Al registrarse y utilizar los servicios de EcoRuteando, usted acepta quedar vinculado por estos Términos y Condiciones. Si no está de acuerdo con alguno de los términos aquí establecidos, le recomendamos no hacer uso de la plataforma.

      2. Descripción del Servicio

      EcoRuteando es una plataforma de movilidad sostenible desarrollada en el marco del programa de Desarrollo de Software del SENA, sede Neiva, Colombia. Su propósito es facilitar la planificación de rutas ecológicas eficientes, promoviendo la reducción de la huella de carbono en entornos urbanos.

      3. Registro de Usuario

      Para acceder a las funcionalidades completas de la plataforma, el usuario deberá crear una cuenta con información veraz, completa y actualizada. EcoRuteando se reserva el derecho de suspender o eliminar cuentas que contengan datos falsos o que infrinjan estos términos. El usuario es responsable de mantener la confidencialidad de sus credenciales de acceso.

      4. Uso Aceptable

      El usuario se compromete a utilizar la plataforma únicamente para fines lícitos y de acuerdo con su propósito. Queda expresamente prohibido compartir contenido ofensivo, usar la plataforma para actividades ilegales, intentar vulnerar la seguridad del sistema, suplantar la identidad de otros usuarios o de EcoRuteando, y realizar acciones que puedan afectar el rendimiento de la plataforma.

      5. Privacidad y Protección de Datos

      EcoRuteando recopila y trata los datos personales de sus usuarios conforme a la Ley 1581 de 2012 (Ley de Protección de Datos Personales de Colombia) y sus decretos reglamentarios. Los datos recopilados se utilizan exclusivamente para la prestación del servicio, la mejora de la plataforma y el envío de comunicaciones relacionadas, siempre con el consentimiento previo del usuario.

      6. Información de Rutas y Disponibilidad

      La información sobre rutas y tiempos de trayecto es referencial y puede variar en función de las condiciones locales. EcoRuteando no se hace responsable por retrasos, cambios de ruta o información desactualizada.

      7. Propiedad Intelectual

      Todos los derechos de propiedad intelectual sobre la plataforma, incluyendo su diseño, código fuente, logotipos y contenidos, pertenecen al equipo de desarrollo de EcoRuteando. Queda prohibida su reproducción, modificación o distribución sin autorización expresa y por escrito.

      8. Modificaciones al Servicio

      EcoRuteando se reserva el derecho de modificar, suspender o discontinuar el servicio en cualquier momento, con o sin previo aviso. Asimismo, estos Términos y Condiciones pueden ser actualizados periódicamente; los cambios entrarán en vigor en el momento de su publicación en la plataforma.

      9. Limitación de Responsabilidad

      EcoRuteando no será responsable por daños directos, indirectos, incidentales o consecuentes derivados del uso o la imposibilidad de uso de la plataforma, incluyendo pérdidas de datos, interrupciones del servicio o inexactitudes en la información de rutas.

      10. Ley Aplicable y Jurisdicción

      Estos Términos y Condiciones se rigen por las leyes de la República de Colombia. Cualquier disputa derivada de su interpretación o aplicación será resuelta ante los tribunales competentes de la ciudad de Neiva, Huila, Colombia.

      11. Contacto

      Para consultas relacionadas con estos términos, el usuario puede comunicarse a través de los canales oficiales de EcoRuteando disponibles en la plataforma.`
  },
  guest: {
    title: 'Modo invitado',

    subtitle:
      'Explora cómo funciona EcoRuteando. Para calcular tus propias rutas en tiempo real, crea una cuenta gratuita.',

    routeTitle: 'Así verás tu ruta',

    routeSubtitle:
      'Al calcular una ruta obtendrás estos datos reales en cada viaje:',

    featureTime: 'Tiempo estimado y hora de llegada',

    featureDistance: 'Distancia total del trayecto',

    featureCo2: 'CO₂ evitado frente a ir en carro',

    mapTitle: 'Vista del mapa (demo)',

    mapSubtitle:
      'En modo invitado verás un mapa de ejemplo. Al registrarte podrás calcular rutas reales sobre el mapa.',

    ctaTitle:
      'Da el siguiente paso hacia una movilidad más verde',

    ctaText:
      'Crea tu cuenta y empieza a planear rutas ecológicas, ver tu impacto en CO₂ y acceder a todas las funciones de EcoRuteando.',

    ctaPrimaryBtn: 'Crear cuenta',

    ctaSecondaryBtn: 'Iniciar sesión',

    enterMap: 'Entrar al mapa',

    capabilitiesTitle: 'Qué puedes hacer como invitado',

    capabilitiesSubtitle:
      'Explora EcoRuteando sin cuenta. Si quieres guardar, compartir o crear, inicia sesión cuando quieras.',

    capabilitySearch: 'Buscar lugares',

    capabilityLocation: 'Ver ubicaciones en el mapa',

    capabilityDirections: 'Calcular rutas y obtener indicaciones',

    capabilityBusiness: 'Consultar información de negocios y lugares',

    capabilityMapViews: 'Usar diferentes vistas del mapa',

    capabilityCurrentLocation:
      'Usar la ubicación actual del dispositivo si concede permiso',

    guestNote:
      'Para guardar, compartir, crear o iniciar viajes necesitas una cuenta.',
  },

    profile: {
      tabs: {
        personal: 'Perfil y ajustes',
        security: 'Seguridad',
        support: 'Soporte',
      },
      defaultName: 'Usuario EcoRuteando',
      defaultEmail: '—',
      changePhoto: 'Cambiar foto',
      theme: {
        light: 'Claro',
        dark: 'Oscuro',
      },
      languages: {
        es: 'Español',
        en: 'Inglés',
        fr: 'Francés',
        pt: 'Portugués',
      },
      feedback: {
        savedTitle: 'Cambios guardados',
        savedMsg: 'Tu perfil se actualizó correctamente.',
        error: 'No se pudo completar la operación.',
        invalidPass: 'La contraseña no cumple los requisitos o no coincide.',
        passTitle: 'Contraseña actualizada',
        passMsg: 'Tu contraseña se cambió correctamente.',
        supportTitle: 'Mensaje enviado',
        supportMsg: 'El equipo de soporte revisará tu caso pronto.',
        emptyMessage: 'Escribe un mensaje antes de enviarlo.',
      },
    personal: {
      title: 'Información personal',
      subtitle:
        'Actualiza tus datos básicos. Estos ayudan a personalizar tus rutas y estadísticas.',

      fields: {
        fullName: 'Nombre completo',
        documentId: 'Documento (opcional)',
        phone: 'Teléfono',
        city: 'Ciudad',
        birthdate: 'Fecha de nacimiento',
        gender: 'Género (opcional)',
        transport: 'Medio principal de transporte',
        bio: 'Biografía',
      },

      placeholders: {
        fullName: 'Tu nombre y apellidos',
        documentId: 'CC / TI / Pasaporte',
        phone: 'Ej: 310 000 0000',
        city: 'Ciudad, país',
        birthdate: 'dd/mm/aa',
        bio: 'Cuéntanos cómo te mueves por la ciudad...',
      },

      gender: {
        male: 'Masculino',
        female: 'Femenino',
        other: 'Otro',
      },

      transport: {
        walk: 'Caminar',
        taxi: 'Taxi',
      },

      save: 'Guardar cambios',
    },

    account: {
      title: 'Configuración de cuenta',
      subtitle:
        'Idioma, tema y exportación de información según los requerimientos del SRS.',

      language: 'Idioma de la interfaz',
      export: 'Exportar mis datos',

      deleteTitle: 'Zona de riesgo',
      deleteText:
        'Si eliminas tu cuenta, se borrarán tus datos personales y no podrás recuperarlos.',
      deleteButton: 'Eliminar cuenta',

      exportOptions: {
        pdf: 'PDF',
        excel: 'Excel',
      },
    },

    security: {
      title: 'Seguridad de la cuenta',
      subtitle:
        'Actualiza tu contraseña y protege tu acceso según autenticación segura.',

      email: 'Correo electrónico',
      newPassword: 'Nueva contraseña',
      confirmPassword: 'Confirmar contraseña',

      hint:
        'Mínimo 8 caracteres, una mayúscula, un número y un carácter especial.',

      button: 'Actualizar contraseña',
    },

    support: {
      title: 'Soporte técnico',
      subtitle: 'Envía un mensaje y el administrador revisará tu caso.',

      priority: 'Prioridad',

      priorities: {
        low: 'Baja',
        medium: 'Media',
        high: 'Alta',
      },

      message: 'Mensaje',
      placeholder: 'Describe el problema o mejora...',

      button: 'Enviar mensaje',

      hint: 'Pronto podrás chatear en tiempo real con soporte.',
    },
  },
  terms: {
    hint: 'Desplázate hasta el final para poder aceptar',
    readToEnd: 'Lee hasta el final',
    acceptance: {
      title: '1. Aceptación de los Términos',
      body: 'Al registrarse y utilizar los servicios de EcoRuteando, usted acepta quedar vinculado por estos Términos y Condiciones. Si no está de acuerdo con alguno de los términos aquí establecidos, le recomendamos no hacer uso de la plataforma.',
    },
    service: {
      title: '2. Descripción del Servicio',
      body: 'EcoRuteando es una plataforma de movilidad sostenible desarrollada en el marco del programa de Desarrollo de Software del SENA, sede Neiva, Colombia. Su propósito es facilitar la planificación de rutas ecológicas eficientes, promoviendo la reducción de la huella de carbono en entornos urbanos.',
    },
    registration: {
      title: '3. Registro de Usuario',
      body: 'Para acceder a las funcionalidades completas de la plataforma, el usuario deberá crear una cuenta con información veraz, completa y actualizada. EcoRuteando se reserva el derecho de suspender o eliminar cuentas que contengan datos falsos o que infrinjan estos términos. El usuario es responsable de mantener la confidencialidad de sus credenciales de acceso.',
    },
    acceptableUse: {
      title: '4. Uso Aceptable',
      body: 'El usuario se compromete a utilizar la plataforma únicamente para fines lícitos y de acuerdo con su propósito. Queda expresamente prohibido: compartir contenido ofensivo, usar la plataforma para actividades ilegales, intentar vulnerar la seguridad del sistema, suplantar la identidad de otros usuarios o de EcoRuteando, y realizar acciones que puedan afectar el rendimiento de la plataforma.',
    },
    privacy: {
      title: '5. Privacidad y Protección de Datos',
      body: 'EcoRuteando recopila y trata los datos personales de sus usuarios conforme a la Ley 1581 de 2012 (Ley de Protección de Datos Personales de Colombia) y sus decretos reglamentarios. Los datos recopilados se utilizan exclusivamente para la prestación del servicio, la mejora de la plataforma y el envío de comunicaciones relacionadas, siempre con el consentimiento previo del usuario.',
    },
    routes: {
      title: '6. Información de Rutas y Disponibilidad',
      body: 'La información sobre rutas y tiempos de trayecto es referencial y puede variar en función de las condiciones locales. EcoRuteando no se hace responsable por retrasos, cambios de ruta o información desactualizada.',
    },
    intellectual: {
      title: '7. Propiedad Intelectual',
      body: 'Todos los derechos de propiedad intelectual sobre la plataforma, incluyendo su diseño, código fuente, logotipos y contenidos, pertenecen al equipo de desarrollo de EcoRuteando. Queda prohibida su reproducción, modificación o distribución sin autorización expresa y por escrito.',
    },
    modifications: {
      title: '8. Modificaciones al Servicio',
      body: 'EcoRuteando se reserva el derecho de modificar, suspender o discontinuar el servicio en cualquier momento, con o sin previo aviso. Asimismo, estos Términos y Condiciones pueden ser actualizados periódicamente; los cambios entrarán en vigor en el momento de su publicación en la plataforma.',
    },
    liability: {
      title: '9. Limitación de Responsabilidad',
      body: 'EcoRuteando no será responsable por daños directos, indirectos, incidentales o consecuentes derivados del uso o la imposibilidad de uso de la plataforma, incluyendo pérdidas de datos, interrupciones del servicio o inexactitudes en la información de rutas.',
    },
    law: {
      title: '10. Ley Aplicable y Jurisdicción',
      body: 'Estos Términos y Condiciones se rigen por las leyes de la República de Colombia. Cualquier disputa derivada de su interpretación o aplicación será resuelta ante los tribunales competentes de la ciudad de Neiva, Huila, Colombia.',
    },
    contact: {
      title: '11. Contacto',
      body: 'Para consultas relacionadas con estos términos, el usuario puede comunicarse a través de los canales oficiales de EcoRuteando disponibles en la plataforma.',
    },
  },

  pw: {
    weak: 'Débil',
    regular: 'Regular',
    strong: 'Fuerte',
    veryStrong: 'Muy fuerte',
  },

  reportTypes: {
    traffic_light: 'Semáforo dañado',
    signage: 'Señalización',
    obstruction: 'Obstrucción en la vía',
    pothole: 'Hueco',
    sewer: 'Alcantarilla destapada',
    hole: 'Hueco',
    blocked: 'Vía bloqueada',
    flood: 'Inundación',
    works: 'Obras en la vía',
    traffic: 'Tráfico',
    lighting: 'Falta de iluminación',
    other: 'Otro obstáculo',
    default: 'Obstáculo',
  },

  poiCats: {
    restaurant: 'Restaurantes',
    cafe: 'Cafés',
    lodging: 'Hoteles',
    atm: 'Cajeros',
    gas: 'Gasolineras',
    pharmacy: 'Farmacias',
    supermarket: 'Supermercados',
    bar: 'Bares',
  },

  modes: {
    driving: 'Auto',
    walking: 'Caminar',
  },

  map: {
    explore: 'Explora EcoRuteando',
    barPlaceholder: '¿A dónde quieres ir?',
    popular: 'Destinos populares',
    planRoute: 'Planear ruta',
    whereFrom: '¿Dónde estás?',
    whereTo: '¿A dónde vas?',
    calculating: 'Calculando…',
    searching: 'Buscando cerca de ti…',
    searchingFor: 'Buscando {name}…',
    resultsCount: '{n} lugares encontrados',
    noResults: 'No se encontraron lugares cercanos',
    open: 'Abierto',
    closed: 'Cerrado',
  },

  addStop: {
    extraMin: 'más de {n} min',
    title: 'Agrega paradas a tu ruta',
    subtitle: 'Encuentra cafeterías, parques y mucho más',
    searchPlaceholder: 'Buscar en la ruta',
    onRoute: 'En tu ruta',
    bestOf: 'Los mejores {name}',
    empty: 'No encontramos lugares cerca. Prueba otra categoría.',
    hint: 'Elige una categoría o busca un lugar para agregarlo.',
    add: 'Agregar',
  },

  routeSheet: {
    otherRoutes: 'Otras rutas',
    directions: 'Indicaciones',
    addStops: 'Agregar paradas',
    share: 'Compartir',
    inProgress: 'En curso',
    save: 'Guardar',
    saved: 'Guardada',
    favorite: 'Favorito',
    favorited: 'Favorita',
    completing: 'Completando...',
    complete: 'Completar',
    starting: 'Iniciando...',
    startTrip: 'Iniciar viaje',
    am: 'a. m.',
    pm: 'p. m.',
  },

  settings: {
    title: 'Ajustes',
  },

  tracking: {
    title: 'Seguimiento',
  },

  savedRoutes: {
    title: 'Mis rutas',
    back: 'Volver',
    subtitle: 'Rutas que guardaste',
    refreshNote: 'Se actualiza cada vez que entras aquí',
    listTitle: 'Tus rutas',
    retry: 'Reintentar',
    countLabel: 'Guardadas',
    distanceLabel: 'Distancia total',
    co2Label: 'CO₂ evitado',
    origin: 'Origen',
    destination: 'Destino',
    kmSuffix: 'km',
    minSuffix: 'min',
    empty: 'Aún no tienes rutas guardadas',
    emptySub: 'Planifica una ruta y guárdala para verla aquí',
    loadError: 'No se pudieron cargar tus rutas',
    delete: 'Eliminar',
    deleteTitle: 'Eliminar ruta',
    deleteMessage: '¿Seguro que quieres eliminar esta ruta guardada?',
    deleteCancel: 'Cancelar',
    deleteConfirm: 'Eliminar',
    deleteError: 'No se pudo eliminar la ruta',
    searchPlaceholder: 'Buscar por nombre, origen o destino',
    noResults: 'No encontramos rutas con ese texto',
    noResultsSub: 'Prueba con otra palabra o borra la búsqueda',
    transport: {
      bike: 'Bici',
      public_transport: 'Transporte público',
      mixed: 'Mixto',
      walking: 'Caminando',
      car: 'Auto',
    },
    status: {
      active: 'Activa',
      inactive: 'Inactiva',
      under_review: 'En revisión',
      archived: 'Archivada',
    },
  },

};