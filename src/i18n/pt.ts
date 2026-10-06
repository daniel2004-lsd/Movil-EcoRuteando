export default {
    common: {
      errorTitle: 'Erro',
      networkError: 'Erro de conexão',
        appName: 'EcoRuteando',
        back: 'Voltar',
    },
    home: {
        logout: 'Sair',
        impactCo2: '0,21 kg de CO₂',

        welcome: 'Bem-vindo de volta!',

        planTitle: 'Planejar rota',
        planDesc: 'Encontre a rota mais ecológica para o seu destino.',

        historyTitle: 'Meu histórico',
        historyDesc: 'Veja seu impacto ambiental e a economia de CO₂.',

        favoritesTitle: 'Rotas favoritas',
        favoritesDesc: 'Acesse rapidamente suas rotas ecológicas preferidas.',

        poiTitle: 'Pontos de interesse',
        poiDesc: 'Explore lugares ecológicos ao longo da sua rota.',

        reportTitle: 'Reportar problema',
        reportDesc: 'Ajude a melhorar as rotas reportando obstáculos.',

        profileTitle: 'Meu perfil',
        profileDesc: 'Gerencie seus dados, segurança e suporte técnico.',

        impactTitle: 'Seu impacto no planeta',

        impactText:
            'Cada trajeto ecológico conta. Em breve você poderá ver aqui o CO₂ que deixou de emitir.',

        statsButton: 'Ver estatísticas completas',

    // DASHBOARD
        hello: 'Olá',
        greetingSub: 'Para onde vamos levar você hoje de forma sustentável?',
        logoutShort: 'Sair',
        defaultUser: 'usuário',
        statCo2: 'CO₂ evitado',
        statTrips: 'Viagens',
        statTime: 'Tempo',
        statFavs: 'Favoritos',
        tools: 'Ferramentas',
        modulesCount: 'módulos',
        modPlan: 'Planejar rota',
        modPlanSub: 'Calcule sua rota ecológica',
        modRoutes: 'Minhas rotas',
        modRoutesSub: 'Suas rotas salvas',
        modHistory: 'Histórico',
        modHistorySub: 'Suas viagens anteriores',
        modFavs: 'Favoritos',
        modFavsSub: 'Rotas favoritas',
        modProfile: 'Perfil',
        modProfileSub: 'Suas informações',
        modAlerts: 'Alertas',
        modAlertsSub: 'Clima e avisos',
        impactCardTitle: 'Seu impacto importa',
        impactDescBefore: 'Cada quilômetro a pé evita ',
        impactDescAfter: ' em relação ao carro.',
        seeStats: 'Ver estatísticas',
        footerNote: 'Cada viagem sustentável conta',
    },

    tabs: {
        home: 'Início',
        route: 'Rota',
        history: 'Histórico',
        favorites: 'Favoritos',
        report: 'Reportar',
        stats: 'Estatísticas',
        profile: 'Perfil',
    },
    stats: {
        title: 'Suas estatísticas de mobilidade',
        subtitle: 'Veja seu impacto ecológico, seus hábitos de trajetos e baixe seus dados para relatórios.',
        co2ThisMonth: 'CO₂ evitado neste mês',
        ecoTrips: 'Trajetos ecológicos',
        co2PerMonth: 'CO₂ evitado por mês (kg)',
        co2PerMonthDesc: 'Quanto CO₂ você deixou de emitir graças às suas rotas sustentáveis.',
        modeDistribution: 'Distribuição de trajetos por modo',
        modeDistributionDesc: 'Comparação de quantos trajetos você faz a pé e de táxi.',
        timePerMode: 'Tempo relativo por modo',
        timePerModeDesc: 'Proporção aproximada do tempo total que você dedica a cada modo de transporte.',
        co2PerTrip: 'CO₂ por trajeto: eco vs carro',
        co2PerTripDesc: 'Proporção de emissões em uma rota média usando opções eco frente a um carro particular.',
        detailedSummary: 'Resumo detalhado (exemplo)',
        taxiKm: 'Quilômetros de táxi',
        totalTime: 'Tempo total nos trajetos',
        jan: 'Jan',
        feb: 'Fev',
        mar: 'Mar',
        apr: 'Abr',
        may: 'Mai',
        jun: 'Jun',
        modeWalk: 'A pé',
        routeEco: 'Rota eco',
        modeCar: 'Carro',
    },
    poi: {
        back: 'Voltar',
        title: 'Pontos de interesse',
        helper:
            'Explore locais públicos próximos às suas rotas: parques, cafés, pontos de reciclagem e mais.',

        distance: {
            nearRoute: 'Perto da sua rota',
            nearDestination: 'Perto do seu destino',
        },

        actions: {
            details: 'Detalhes',
            map: 'Ver no mapa',
        },

        types: {
            park: 'Parque público',
            recycle: 'Ponto de reciclagem',
            cafe: 'Café',
        },

        mock: {
            park1: {
                name: 'Parque Santander',
                desc: 'Área verde ideal para descansar durante sua viagem.',
            },
            recycle1: {
                name: 'Ponto de reciclagem principal',
                desc: 'Entrega de resíduos recicláveis e educação ambiental.',
            },
            cafe1: {
                name: 'Café La Ruta',
                desc: 'Lugar para descansar e recarregar energia.',
            },
        },
    },

    planRoute: {
        selectOrigin: 'Selecione a origem para calcular a rota',
        tripErrorFallback: 'Erro ao concluir a viagem',

        needAccountTitle: 'Conta necessária',
        needAccountMsg: 'Para {action}, entre ou crie uma conta gratuita.',
        notNow: 'Agora não',
        actionStartTrips: 'iniciar e registrar viagens',
        actionShare: 'compartilhar rotas',
        actionSave: 'salvar rotas',
        actionVote: 'votar em reportes',
        actionReport: 'reportar obstáculos',
        permissionDeniedTitle: 'Permissão negada',
        locationDeniedMsg: 'Não foi possível acessar sua localização',
        myLocation: 'Minha localização',
        selectOriginDest: 'Selecione origem e destino',
        routeNotFound: 'Nenhuma rota encontrada',
        routeCalcError: 'Não foi possível calcular a rota',
        routeFromApp: 'Rota calculada pelo aplicativo móvel',
        startTripError: 'Erro ao iniciar a viagem',
        missingOriginDest: 'Faltam origem ou destino para iniciar a viagem',
        tripCompletedTitle: 'Viagem concluída!',
        tripCompletedMsg: 'Seu trajeto foi registrado no histórico.',
        close: 'Fechar',
        viewHistory: 'Ver histórico',
        arrivedSpeak: 'Você chegou ao seu destino. Você pode concluir a viagem.',
        arrivedAlertTitle: 'Você chegou!',
        arrivedAlertMsg: 'Seu trajeto chegou ao destino. Concluir a viagem?',
        later: 'Depois',
        completeTrip: 'Concluir viagem',
        navArrived: 'Você chegou ao seu destino',
        navContinue: 'Continue até o destino',
        navStartedSpeak: 'Navegação iniciada para {name}.',
        routeSaved: 'Rota salva',
        routeSavedMsg: 'A rota foi salva no seu histórico de rotas.',
        saveError: 'Não foi possível salvar',
        unexpectedError: 'Erro inesperado',
        locationRequiredTitle: 'Localização necessária',
        voteLocationMsg: 'Ative sua localização para votar em reportes próximos.',
        voteConfirmed: 'Você confirmou que ainda está acontecendo',
        voteRejected: 'Você marcou que não acontece mais',
        voteThanks: 'Obrigado por votar',
        voteError: 'Não foi possível votar',
        addAsStop: 'Adicionar como parada',
        howToGet: 'Como chegar',
        minSlower: '{n} min mais lento',
        minFaster: '{n} min mais rápido',
        sameTime: 'Mesmo tempo',
        viewRoute: 'Ver rota',
        report: 'Reportar',
        title: 'Planejar rota ecológica',

        subtitle:
            'Defina seu trajeto e escolha o tipo de transporte sustentável que deseja usar.',

        routeDataTitle: 'Dados do trajeto',

        origin: 'Origem',
        originPlaceholder: 'Ex: Parque Central',

        destination: 'Destino',
        destinationPlaceholder: 'Ex: Universidade Surcolombiana',

        transportType: 'Tipo de transporte ecológico',

        taxi: 'Táxi',

        calculateButton: 'Calcular rota ecológica',

        mapTitle: 'Mapa do trajeto',

        ecoSummaryTitle: 'Resumo ecológico (exemplo)',

        estimatedTime: 'Tempo estimado',
        distance: 'Distância',
        avoidedCO2: 'CO₂ evitado',
    },
    favorites: {
        defaultName: 'Rota favorita',

        empty: 'Você não tem rotas favoritas salvas',
        back: 'Voltar',

        title: 'Rotas favoritas',

        savedRoutes: 'Rotas salvas',
        ecoFocus: 'Foco',
        ecoRoutes: 'Rotas ecológicas',

        ecoBadge: 'Eco',

        origin: 'Origem',
        destination: 'Destino',

        detailsButton: 'Ver detalhes',
        useRouteButton: 'Usar esta rota',

        route1Name: 'Casa → Trabalho',
        route1From: 'Bairro Las Palmas',
        route1To: 'Centro de Neiva',
        route1Co2: '0,20 t de CO₂ evitado por mês',

        route2Name: 'Universidade → Parque',
        route2From: 'Universidade',
        route2To: 'Parque Santander',
        route2Co2: '0,10 t de CO₂ evitado por mês',
    },
    landing: {
        changeLanguage: 'Alterar idioma',
        changeTheme: 'Alterar tema',
        openMenu: 'Abrir menu',

        tagline: 'Mobilidade sustentável',
        heroTitle: 'Mova-se com inteligência',
        heroSlogan: 'Conecte rotas e proteja o planeta',
        heroDesc:
            'EcoRuteando ajuda você a encontrar rotas eficientes e ecológicas.',
        guestButton: 'Modo visitante',

        mobilityTitle: 'Mobilidade inteligente',
        mobilityDesc:
            'EcoRuteando ajuda você a se mover de forma eficiente enquanto cuida do meio ambiente.',

        optimizedRoutes: 'Rotas otimizadas',
        optimizedRoutesDesc:
            'Encontre trajetos eficientes para economizar tempo.',

        environmentalImpact: 'Impacto ambiental',
        environmentalImpactDesc:
            'Veja quanto CO₂ você evita em cada viagem.',

        easyUse: 'Fácil de usar',
        easyUseDesc:
            'Interface intuitiva projetada para planejar em segundos.',
        whyTitle: 'Por que EcoRuteando?',

        whyRealtime: 'Tempo real',
        whyRealtimeDesc:
            'Informações atualizadas de rotas e tempos estimados.',

        whyGreen: 'Compromisso verde',
        whyGreenDesc:
            'Cada trajeto sustentável ajuda a reduzir a poluição.',

        drawerLanguage: 'IDIOMA',
        drawerAccess: 'ACESSO RÁPIDO',

        features: 'Recursos',
        whyMenu: 'Por quê?',
        join: 'Junte-se',
        routes: 'Rotas',

        privacy: 'Privacidade',
        terms: 'Termos',
        contact: 'Contato',

        joinGreen: 'Junte-se à revolução verde 🌿',

        footerText: '© 2025 EcoRuteando — SENA Neiva, Huila',
    },
    report: {
        voteHint: 'Você só pode votar perto do relatório (máx. 500 m). O seu voto é único e anónimo para outros utilizadores.',
        formTitle: 'Reportar um obstáculo',
        formSubtitle: 'O que você está encontrando na sua rota?',
        gpsMsg: 'Sua localização GPS é necessária para enviar o relatório.',
        sentTitle: 'Relatório enviado',
        sentMsg: 'Obrigado. O relatório já está no mapa.',
        sentMsgFull: 'Obrigado. O relatório já está no mapa com confiança inicial.',
        sentToast: 'Relatório enviado. Obrigado!',
        sendFailedTitle: 'Não foi possível enviar',
        cameraPermTitle: 'Permissão da câmera',
        cameraPermMsg: 'Permita o acesso à câmera para fotografar o obstáculo.',
        galleryPermTitle: 'Permissão da galeria',
        galleryPermMsg: 'Permita o acesso às suas fotos para anexar uma imagem.',
        cameraError: 'Não foi possível abrir a câmera.',
        galleryError: 'Não foi possível abrir a galeria.',
        chooseTypeTitle: 'Escolha um tipo',
        chooseTypeMsg: 'Selecione qual obstáculo você está reportando.',
        photoAttached: 'Foto anexada',
        cameraBtn: 'Tirar foto',
        galleryBtn: 'Galeria',
        detailsPlaceholderOpt: 'Detalhes adicionais (opcional)',
        stillHappening: 'Ainda está acontecendo?',
        sending: 'Enviando…',
        yes: 'Sim',
        no: 'Não',
        voteActive: 'Ativo',
        voteConfirmed: 'Confirmado',
        voteDisputed: 'Contestado',
        voteExpired: 'Expirado',
        nearbyReport: 'Relatório próximo',

        title: 'Relatório cidadão',

        helperText:
            'Reporte obstáculos que dificultam as rotas ecológicas: buracos, inundações, ciclovias bloqueadas, falta de iluminação, etc.',

        obstacleType: 'Tipo de obstáculo',
        selectObstacle: 'Selecione o tipo de obstáculo',

        obstacles: {
            hole: 'Buraco na via',
            blocked: 'Ciclovia bloqueada',
            flood: 'Inundação / água',
            works: 'Obras na via',
            traffic: 'Trânsito muito intenso',
            lighting: 'Falta de iluminação',
            other: 'Outro problema',
        },

        locationTitle: 'Localização aproximada',

        locationPlaceholder:
            'Exemplo: Rua 5 com Avenida 10, perto do parque',

        photoTitle: 'Foto do obstáculo',

        photoHelp:
            'Anexe uma foto para que o administrador possa validar melhor o relatório (altamente recomendado).',

        changePhoto: 'Alterar foto',
        takePhoto: 'Tirar ou selecionar foto',

        detailsTitle: 'Detalhes adicionais',

        detailsPlaceholder:
            'Descreva o que está acontecendo e como isso afeta a rota...',

        send: 'Enviar relatório',

        footerNote:
            'Os relatórios serão validados de acordo com RF17 e RF18 do SRS e poderão ser usados para ajustar rotas e alertas ecológicos.',
    },
    history: {
        empty: 'Você ainda não tem viagens registradas',
        title: "Histórico de viagens",
        tripsRegistered: "Viagens registradas",
        totalCO2: "CO₂ total evitado",
        exportPdf: "Exportar PDF",
        exportExcel: "Exportar Excel",
        viewDetails: "Ver detalhes da viagem",
        trips: {
            trip1: {
                from: "Bairro Las Palmas",
                to: "Centro de Neiva",
                co2: "0.35 t CO₂ evitado",
                date: "Hoje, 8:15 da manhã"
            }
        }
    },
    auth: {
        tooManyAttempts: 'Muitas tentativas. Aguarde antes de tentar novamente.',
        invalidCredentials: 'E-mail ou senha incorretos.',
        resetPassError: 'Erro ao redefinir a senha',

        // RECOVER CODE
        stepEmail: 'E-MAIL',
        stepCode: 'CÓDIGO',
        stepPassword: 'SENHA',
        recoverCodeTitle: 'Verificar código',
        recoverCodeSubtitle:
            'Enviamos um código de 6 dígitos para o seu e-mail registrado',
        recoverCodeErrorFill: 'Preencha os 6 dígitos do código',
        recoverCodeNotReceived: 'Não recebeu o código?',
        recoverCodeResend: 'Reenviar',
        recoverCodeButton: 'Verificar código',

        loginTitle: 'Entrar',
        loginSubtitle:
            'Acesse sua conta para continuar.',

        registerTitle: 'Criar conta',
        registerSubtitle:
            'Complete seus dados para iniciar sua experiência sustentável.',

        // LABELS
        nameLabel: 'Nome completo',
        emailLabel: 'E-mail',
        passwordLabel: 'Senha',
        confirmPasswordLabel: 'Confirmar senha',

        // PLACEHOLDERS
        emailPlaceholder: 'seuemail@email.com',
        passwordPlaceholder: 'Sua senha',

        // BUTTONS
        loginButton: 'Entrar',
        registerButton: 'Registrar',
        acceptTermsButton: 'Aceito os termos',
        close: 'Fechar',
        back: 'Voltar',

        // LINKS
        alreadyAccount: 'Já tem uma conta?',
        loginHere: 'Entre aqui.',
        noAccount: 'Não tem uma conta?',
        registerHere: 'Registre-se aqui.',
        forgotPassword: 'Esqueceu sua senha?',

        // TERMS
        acceptTermsPrefix: 'Li e aceito os',
        andPrivacy: 'e a',
        termsAndConditions: 'Termos e Condições',
        privacyPolicy: 'Política de Privacidade',
        termsUpdated:
            'EcoRuteando · Última atualização: janeiro 2025',

        // VALIDATIONS
        requiredField: 'Campo obrigatório',
        emailRequired: 'O e-mail é obrigatório',
        emailInvalid:
            'Digite um e-mail válido com @',

        passwordRequired:
            'A senha é obrigatória',

        passwordMin: 'Mínimo 8 caracteres',

        passwordStrong:
            'Deve conter letra maiúscula, número e caractere especial',

        passwordMismatch:
            'As senhas não coincidem',

        termsError:
            'Você deve aceitar os termos para continuar',

        // PASSWORD STATES
        passwordEmpty: 'Senha não avaliada',
        passwordWeak: 'Senha fraca',
        passwordMedium: 'Senha média',
        passwordStrongLabel: 'Senha forte',

        // SOCIAL
        orContinueWith: 'Ou continue com',

        // AUTH SCREENS (login / register / recover / verify-code)
        loggingIn: 'Entrando...',
        loginTagline: 'Cada viagem sustentável começa com um passo',
        registerTagline: 'Comece sua jornada sustentável',
        communityTagline: 'Junte-se à comunidade que cuida do planeta',
        firstNameLabel: 'Nome',
        firstNamePlaceholder: 'Seu nome',
        lastNameLabel: 'Sobrenome',
        lastNamePlaceholder: 'Silva',
        emailValid: 'E-mail válido',
        pwCheckUppercase: 'Pelo menos uma letra maiúscula',
        pwCheckNumber: 'Pelo menos um número',
        pwCheckSpecial: 'Pelo menos um caractere especial',
        confirmPasswordPlaceholder: 'Repita sua senha',
        passwordMatch: 'As senhas coincidem',
        passwordMinShort: 'Mín. 8 caracteres',
        orRegisterWith: 'Ou registre-se com',
        registering: 'Registrando...',
        recoverTitle: 'Recuperar senha',
        recoverSubtitle: 'Informe seu e-mail e enviaremos um código de verificação de 6 dígitos para redefinir sua senha.',
        recoverSentTitle: 'Verifique seu e-mail',
        recoverSentSubtitle: 'Enviamos um código de verificação para:',
        recoverWrongEmail: 'E-mail incorreto? Alterar',
        recoverHaveCode: 'Já tenho o código →',
        sendCode: 'Enviar código',
        sendingCode: 'Enviando código...',
        backToLogin: 'Voltar ao login',
        backToRegister: 'Voltar ao cadastro',
        stepEmailLabel: 'E-MAIL',
        stepCodeLabel: 'CÓDIGO',
        stepPasswordLabel: 'SENHA',
        newPasswordTitle: 'Nova senha',
        newPasswordSubtitle: 'Escolha uma senha segura para proteger sua conta',
        confirmNewPasswordLabel: 'Confirmar nova senha',
        resetPasswordButton: 'Redefinir senha',
        verifyCodeTitle: 'Verifique sua conta',
        verifyCodeSubtitle: 'Insira o código de 4 dígitos que enviamos para o seu e-mail.',
        confirmCodeButton: 'Confirmar código',
        resendCode: 'Reenviar código',
        fillAllFields: 'Preencha todos os campos',
        passwordMin8Error: 'A senha deve ter pelo menos 8 caracteres',
        invalidEmailMsg: 'Insira um endereço de e-mail válido.',
        tooManyRequests: 'Muitas solicitações. Aguarde alguns minutos.',
        sendCodeError: 'Não foi possível enviar o código.',
        fillBothFields: 'Preencha os dois campos',
        codeIncomplete: 'Preencha os 4 dígitos do código',
        codeInvalid: 'Código inválido',
        resendError: 'Erro ao reenviar o código',
        registerInvalidForm: 'Preencha todos os campos corretamente',
        emailAlreadyRegistered: 'Este e-mail já está cadastrado.',
        alreadyRegisteredTitle: 'Você já está cadastrado',
        alreadyRegisteredMsg: 'Este e-mail já tem uma conta. Deseja entrar ou reenviar o código de verificação?',
        registerErrorFallback: 'Não foi possível registrar o usuário',
        cancel: 'Cancelar',
        errorTitle: 'Erro',

        termsContent: `1. Aceitação dos Termos
      
      Ao se registrar e utilizar os serviços da EcoRuteando, você concorda em cumprir estes Termos e Condições. Caso não concorde com algum dos termos aqui estabelecidos, recomendamos que não utilize a plataforma.
      
      2. Descrição do Serviço
      
      EcoRuteando é uma plataforma de mobilidade sustentável desenvolvida no âmbito do programa de Desenvolvimento de Software do SENA em Neiva, Colômbia. Seu objetivo é facilitar o planejamento de rotas ecológicas eficientes, promovendo a redução da pegada de carbono em ambientes urbanos.
      
      3. Registro do Usuário
      
      Para acessar todas as funcionalidades da plataforma, o usuário deverá criar uma conta com informações verdadeiras, completas e atualizadas. EcoRuteando reserva-se o direito de suspender ou excluir contas que contenham dados falsos ou violem estes termos. O usuário é responsável por manter a confidencialidade de suas credenciais de acesso.
      
      4. Uso Aceitável

      O usuário compromete-se a utilizar a plataforma apenas para fins legais e de acordo com sua finalidade. É expressamente proibido compartilhar conteúdo ofensivo, utilizar a plataforma para atividades ilegais, tentar violar a segurança do sistema, se passar por outros usuários ou pela EcoRuteando, bem como realizar ações que possam afetar o desempenho da plataforma.

      5. Privacidade e Proteção de Dados

      EcoRuteando coleta e trata os dados pessoais de seus usuários conforme a Lei Colombiana 1581 de 2012 e seus regulamentos. Os dados coletados são utilizados exclusivamente para prestação do serviço, melhoria da plataforma e envio de comunicações relacionadas, sempre com o consentimento prévio do usuário.

      6. Informações de Rotas e Disponibilidade

      As informações sobre rotas e tempos de trajeto são apenas referenciais e podem variar de acordo com as condições locais. EcoRuteando não se responsabiliza por atrasos, mudanças de rotas ou informações desatualizadas.

      7. Propriedade Intelectual

      Todos os direitos de propriedade intelectual relacionados à plataforma, incluindo design, código-fonte, logotipos e conteúdos, pertencem à equipe de desenvolvimento da EcoRuteando. É proibida sua reprodução, modificação ou distribuição sem autorização prévia e por escrito.

      8. Modificações do Serviço

      EcoRuteando reserva-se o direito de modificar, suspender ou descontinuar o serviço a qualquer momento, com ou sem aviso prévio. Da mesma forma, estes Termos e Condições podem ser atualizados periodicamente; as alterações entrarão em vigor no momento de sua publicação na plataforma.

      9. Limitação de Responsabilidade

      EcoRuteando não será responsável por danos diretos, indiretos, incidentais ou consequenciais decorrentes do uso ou da impossibilidade de uso da plataforma, incluindo perda de dados, interrupções do serviço ou imprecisões nas informações de rotas.

      10. Lei Aplicável e Jurisdição

      Estes Termos e Condições são regidos pelas leis da República da Colômbia. Qualquer disputa decorrente de sua interpretação ou aplicação será resolvida perante os tribunais competentes da cidade de Neiva, Huila, Colômbia.

      11. Contato

      Para dúvidas relacionadas a estes termos, o usuário poderá entrar em contato através dos canais oficiais da EcoRuteando disponíveis na plataforma.`,
    },
    guest: {
        title: 'Modo visitante',

        subtitle:
            'Explore como o EcoRuteando funciona. Para calcular suas próprias rotas em tempo real, crie uma conta gratuita.',

        routeTitle: 'É assim que verá sua rota',

        routeSubtitle:
            'Ao calcular uma rota você terá estes dados reais em cada viagem:',

        featureTime: 'Tempo estimado e chegada',

        featureDistance: 'Distância total da trajetória',

        featureCo2: 'CO₂ evitado em relação ao carro',

        mapTitle: 'Visualização do mapa (demo)',

        mapSubtitle:
            'No modo visitante você verá um mapa de exemplo. Ao se registrar, poderá calcular rotas reais no mapa.',

        ctaTitle:
            'Dê o próximo passo rumo a uma mobilidade mais verde',

        ctaText:
            'Crie sua conta e comece a planejar rotas ecológicas, acompanhar seu impacto de CO₂ e acessar todos os recursos do EcoRuteando.',

        ctaPrimaryBtn: 'Criar conta',

        ctaSecondaryBtn: 'Entrar',

        enterMap: 'Entrar no mapa',

        capabilitiesTitle: 'O que você pode fazer como convidado',

        capabilitiesSubtitle:
            'Explore o EcoRuteando sem conta. Entre quando quiser para salvar, compartilhar ou criar.',

        capabilitySearch: 'Buscar lugares',

        capabilityLocation: 'Ver localizações no mapa',

        capabilityDirections: 'Calcular rotas e obter instruções',

        capabilityBusiness: 'Consultar informações de negócios e lugares',

        capabilityMapViews: 'Usar diferentes visualizações do mapa',

        capabilityCurrentLocation:
            'Usar a localização atual do dispositivo se você permitir',

        guestNote:
            'Para salvar, compartilhar, criar ou iniciar viagens você precisa de uma conta.',
    },
  profile: {
    tabs: {
      personal: 'Perfil e ajustes',
      security: 'Segurança',
      support: 'Suporte',
    },
    defaultName: 'Usuário EcoRuteando',
    defaultEmail: 'usuario@ecoruteando.com',
    changePhoto: 'Alterar foto',
    theme: {
      light: 'Claro',
      dark: 'Escuro',
    },
    languages: {
      es: 'Espanhol',
      en: 'Inglês',
      fr: 'Francês',
      pt: 'Português',
    },
    feedback: {
      savedTitle: 'Alterações salvas',
      savedMsg: 'Seu perfil foi atualizado com sucesso.',
      error: 'Não foi possível concluir a operação.',
      invalidPass: 'A senha não atende aos requisitos ou não corresponde.',
      passTitle: 'Senha atualizada',
      passMsg: 'Sua senha foi alterada com sucesso.',
      supportTitle: 'Mensagem enviada',
      supportMsg: 'A equipe de suporte analisará seu caso em breve.',
      emptyMessage: 'Escreva uma mensagem antes de enviar.',
    },
    personal: {
      title: 'Informações pessoais',
      subtitle:
        'Atualize seus dados básicos. Isso ajuda a personalizar suas rotas e estatísticas.',

      fields: {
        fullName: 'Nome completo',
        documentId: 'Documento (opcional)',
        phone: 'Telefone',
        city: 'Cidade',
        birthdate: 'Data de nascimento',
        gender: 'Gênero (opcional)',
        transport: 'Principal meio de transporte',
        bio: 'Biografia',
      },

      placeholders: {
        fullName: 'Seu nome completo',
        documentId: 'RG / CPF / Passaporte',
        phone: 'Ex: 310 000 0000',
        city: 'Cidade, país',
        birthdate: 'dd/mm/aa',
        bio: 'Conte como você se move pela cidade...',
      },

      gender: {
        male: 'Masculino',
        female: 'Feminino',
        other: 'Outro',
      },

      transport: {
        walk: 'Caminhar',
        taxi: 'Táxi',
      },

      save: 'Salvar alterações',
    },

    account: {
      title: 'Configurações da conta',
      subtitle:
        'Idioma, tema e exportação de dados conforme requisitos do SRS.',

      language: 'Idioma da interface',
      export: 'Exportar meus dados',

      deleteTitle: 'Zona de risco',
      deleteText:
        'Se você excluir sua conta, seus dados serão removidos permanentemente.',
      deleteButton: 'Excluir conta',

      exportOptions: {
        pdf: 'PDF',
        excel: 'Excel',
      },
    },

    security: {
      title: 'Segurança da conta',
      subtitle: 'Atualize sua senha e proteja sua conta.',

      email: 'E-mail',
      newPassword: 'Nova senha',
      confirmPassword: 'Confirmar senha',

      hint:
        'Mínimo de 8 caracteres, uma letra maiúscula, um número e um caractere especial.',

      button: 'Atualizar senha',
    },

    support: {
      title: 'Suporte técnico',
      subtitle: 'Envie uma mensagem e o administrador revisará seu caso.',

      priority: 'Prioridade',

      priorities: {
        low: 'Baixa',
        medium: 'Média',
        high: 'Alta',
      },

      message: 'Mensagem',
      placeholder: 'Descreva o problema ou melhoria...',

      button: 'Enviar mensagem',

      hint: 'Em breve você poderá conversar com suporte em tempo real.',
    },
  },    
  terms: {
    hint: 'Role até o final para poder aceitar',
    readToEnd: 'Leia até o final',
    acceptance: {
      title: '1. Aceitação dos Termos',
      body: 'Ao se registar e utilizar os serviços do EcoRuteando, você concorda em ficar vinculado a estes Termos e Condições. Se não concorda com algum dos termos aqui estabelecidos, recomendamos não utilizar a plataforma.',
    },
    service: {
      title: '2. Descrição do Serviço',
      body: 'O EcoRuteando é uma plataforma de mobilidade sustentável desenvolvida no programa de Desenvolvimento de Software do SENA, em Neiva, Colômbia. O seu propósito é facilitar o planejamento de rotas ecológicas eficientes, promovendo a redução da pegada de carbono nos ambientes urbanos.',
    },
    registration: {
      title: '3. Registo de utilizador',
      body: 'Para aceder às funcionalidades completas da plataforma, o utilizador deve criar uma conta com informações verídicas, completas e atualizadas. O EcoRuteando reserva-se o direito de suspender ou eliminar contas com dados falsos ou que violem estes termos. O utilizador é responsável pela confidencialidade das suas credenciais de acesso.',
    },
    acceptableUse: {
      title: '4. Uso aceitável',
      body: 'O utilizador compromete-se a utilizar a plataforma apenas para fins lícitos e de acordo com o seu propósito. É expressamente proibido: partilhar conteúdo ofensivo, usar a plataforma para atividades ilegais, tentar comprometer a segurança do sistema, suplantar a identidade de outros utilizadores ou do EcoRuteando e realizar ações que possam afetar o desempenho da plataforma.',
    },
    privacy: {
      title: '5. Privacidade e proteção de dados',
      body: 'O EcoRuteando recolhe e trata os dados pessoais dos seus utilizadores de acordo com a Lei 1581 de 2012 (Lei de Proteção de Dados Pessoais da Colômbia) e os seus decretos regulamentares. Os dados recolhidos são usados exclusivamente para a prestação do serviço, a melhoria da plataforma e o envio de comunicações relacionadas, sempre com o consentimento prévio do utilizador.',
    },
    routes: {
      title: '6. Informações de rotas e disponibilidade',
      body: 'As informações sobre rotas e tempos de percurso são referenciais e podem variar conforme as condições locais. O EcoRuteando não se responsabiliza por atrasos, mudanças de rota ou informações desatualizadas.',
    },
    intellectual: {
      title: '7. Propriedade intelectual',
      body: 'Todos os direitos de propriedade intelectual sobre a plataforma, incluindo o seu design, código-fonte, logótipos e conteúdos, pertencem à equipa de desenvolvimento do EcoRuteando. É proibida a sua reprodução, modificação ou distribuição sem autorização expressa e por escrito.',
    },
    modifications: {
      title: '8. Modificações do serviço',
      body: 'O EcoRuteando reserva-se o direito de modificar, suspender ou interromper o serviço a qualquer momento, com ou sem aviso prévio. Estes Termos e Condições também podem ser atualizados periodicamente; as alterações entram em vigor no momento da sua publicação na plataforma.',
    },
    liability: {
      title: '9. Limitação de responsabilidade',
      body: 'O EcoRuteando não será responsável por danos diretos, indiretos, incidentais ou consequentes decorrentes do uso ou da impossibilidade de uso da plataforma, incluindo perda de dados, interrupções do serviço ou inexatidões nas informações de rota.',
    },
    law: {
      title: '10. Lei aplicável e jurisdição',
      body: 'Estes Termos e Condições são regidos pelas leis da República da Colômbia. Qualquer disputa decorrente da sua interpretação ou aplicação será resolvida nos tribunais competentes da cidade de Neiva, Huila, Colômbia.',
    },
    contact: {
      title: '11. Contacto',
      body: 'Para dúvidas relacionadas com estes termos, o utilizador pode contactar o EcoRuteando através dos canais oficiais disponíveis na plataforma.',
    },
  },

  pw: {
    weak: 'Fraco',
    regular: 'Razoável',
    strong: 'Forte',
    veryStrong: 'Muito forte',
  },

  reportTypes: {
    traffic_light: 'Semáforo avariado',
    signage: 'Sinalização',
    obstruction: 'Obstrução na via',
    pothole: 'Buraco',
    sewer: 'Boca de lobo destapada',
    hole: 'Buraco',
    blocked: 'Via bloqueada',
    flood: 'Inundação',
    works: 'Obras na via',
    traffic: 'Trânsito',
    lighting: 'Falta de iluminação',
    other: 'Outro obstáculo',
    default: 'Obstáculo',
  },

  poiCats: {
    restaurant: 'Restaurantes',
    cafe: 'Cafés',
    lodging: 'Hotéis',
    atm: 'Caixas eletrônicos',
    gas: 'Postos de gasolina',
    pharmacy: 'Farmácias',
    supermarket: 'Supermercados',
    bar: 'Bares',
  },

  modes: {
    driving: 'Carro',
    walking: 'Caminhar',
  },

  map: {
    explore: 'Explore o EcoRuteando',
    barPlaceholder: 'Para onde você quer ir?',
    popular: 'Destinos populares',
    planRoute: 'Planejar rota',
    whereFrom: 'Onde você está?',
    whereTo: 'Para onde você vai?',
    calculating: 'Calculando…',
    searching: 'Buscando perto de você…',
    searchingFor: 'Buscando {name}…',
    resultsCount: '{n} lugares encontrados',
    noResults: 'Nenhum lugar próximo encontrado',
    open: 'Aberto',
    closed: 'Fechado',
  },

  addStop: {
    extraMin: 'mais de {n} min',
    title: 'Adicione paradas à sua rota',
    subtitle: 'Encontre cafés, parques e muito mais',
    searchPlaceholder: 'Buscar na rota',
    onRoute: 'Na sua rota',
    bestOf: 'Os melhores {name}',
    empty: 'Não encontramos lugares próximos. Tente outra categoria.',
    hint: 'Escolha uma categoria ou procure um lugar para adicionar.',
    add: 'Adicionar',
  },

  routeSheet: {
    otherRoutes: 'Outras rotas',
    directions: 'Indicações',
    addStops: 'Adicionar paradas',
    share: 'Compartilhar',
    inProgress: 'Em andamento',
    save: 'Salvar',
    saved: 'Salva',
    completing: 'Concluindo...',
    complete: 'Concluir',
    starting: 'Iniciando...',
    startTrip: 'Iniciar viagem',
    am: 'a. m.',
    pm: 'p. m.',
  },

  settings: {
    title: 'Configurações',
  },

  tracking: {
    title: 'Acompanhamento',
  },

};