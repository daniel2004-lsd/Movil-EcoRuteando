export default {
    common: {
        appName: 'EcoRuteando',
        back: 'Voltar',
    },
    home: {
        logout: 'Sair',

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
};