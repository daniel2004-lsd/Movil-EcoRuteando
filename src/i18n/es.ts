// src/i18n/es.ts
export default {
  common: {
    appName: 'EcoRuteando',
    back: 'Volver',
  },
  home: {
    logout: 'Cerrar sesión',

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

    mock: {
      park1: {
        name: 'Parque Santander',
        desc: 'Zona verde ideal para descansar durante tu trayecto.',
      },
      recycle1: {
        name: 'Punto de reciclaje principal',
        desc: 'Entrega de residuos reciclables y educación ambiental.',
      },
      cafe1: {
        name: 'Café La Ruta',
        desc: 'Lugar para tomar algo y recargar energía durante el recorrido.',
      },
    },
  },
  planRoute: {
    title: 'Planear ruta ecológica',

    subtitle:
      'Define tu trayecto y el tipo de transporte sostenible que quieres usar.',

    routeDataTitle: 'Datos del trayecto',

    origin: 'Origen',
    originPlaceholder: 'Ej: Parque Central',

    destination: 'Destino',
    destinationPlaceholder: 'Ej: Universidad Surcolombiana',

    transportType: 'Tipo de transporte ecológico',

    taxi: 'Taxi',

    calculateButton: 'Calcular ruta ecológica',

    mapTitle: 'Mapa del trayecto',

    ecoSummaryTitle: 'Resumen ecológico (ejemplo)',

    estimatedTime: 'Tiempo estimado',
    distance: 'Distancia',
    avoidedCO2: 'CO₂ evitado',
  },
  favorites: {
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
  },
  landing: {
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
    title: "Historial de trayectos",
    tripsRegistered: "Trayectos registrados",
    totalCO2: "CO₂ total evitado",
    exportPdf: "Exportar PDF",
    exportExcel: "Exportar Excel",
    viewDetails: "Ver detalles del recorrido",
    trips: {
      trip1: {
        from: "Barrio Las Palmas",
        to: "Centro de Neiva",
        co2: "0.35 t CO₂ evitado",
        date: "Hoy, 8:15 a.m."
      }
    }
  },
  auth: {
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
};