export const TAB_BAR_HEIGHT = 60;

export const colors = {
  // light — idéntico a web :root
  ecoDark:   '#2c5f3f',
  ecoMid:    '#3d7a55',
  ecoMain:   '#4a8f65',
  ecoLight:  '#5ea87a',
  ecoSoft:   '#cde4d5',
  ecoPale:   '#f2f8f4',
  ecoBg:     '#e8f3ec',
  ivory:     '#f9f6f0',
  ivoryDark: '#ede8df',
  error:     '#ef4444',
  errorBg:   '#fee2e2',
  success:   '#22c55e',
  inputBg:   '#e8f0eb',
  inputFocus:'#dce8e0',
  white:     '#ffffff',
  textMuted: '#8db09a',
  overlay:   'rgba(0,0,0,0.55)',
  // web específicos
  beige:     '#f5f0e8',
  beigeDark: '#e8e0d4',
  beigeHover:'#ebe4d5',
  textDark:  '#2d2d2d',
  labelBrown:'#8b7355',
  // dark — idéntico a web .dark
  darkBg:    '#0B1215',
  darkCard:  '#162329',
  darkSurface:'#111C20',
  darkBorder:'#26383D',
  darkText:  '#e2e8f0',
  darkTextSec:'#94a3b8',
  darkAccent:'#34D399',
  darkAccentHover:'#064E3B',
  darkMuted: '#cbd5e1',
};

export const gradients = {
  button:     ['#2c5f3f', '#4a8f65'] as const, // web .btn-primary 135deg
  buttonPress:['#143d28', '#256b4a'] as const, // hover
  nature:     ['#22c55e', '#059669'] as const, // web .btn-nature
  hero:       ['#3d6b4f', '#4e8866', '#5ea87a'] as const, // web .gradient-hero 150deg
  logo:       ['#2c5f3f', '#5ea87a'] as const,
  tag:        ['#c5e8d4', '#a8d9bc'] as const, // web .tag-eco 135deg
  card:       ['#ffffff', '#f9f6f0'] as const, // web .gradient-card 145deg
  stepActive: ['#2c5f3f', '#4a8f65'] as const,
  darkHero:   ['#0B1215', '#162329'] as const,
};

export const shadows = {
  button: {
    shadowColor: '#1e4a32',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.38,
    shadowRadius: 12,
    elevation: 10,
  },
  card: {
    shadowColor: '#1e4a32',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.13,
    shadowRadius: 16,
    elevation: 6,
  },
  cardHover: {
    shadowColor: '#1e4a32',
    shadowOffset: { width: 0, height: 22 },
    shadowOpacity: 0.15,
    shadowRadius: 45,
    elevation: 12,
  },
  modal: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 16,
  },
  // web .btn-nature hover
  nature: {
    shadowColor: '#22c55e',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 25,
    elevation: 12,
  },
};

export const radii = {
  input:  12,
  button: 16, // web btn 16
  card:   20, // web card 20
  modal:  24, // web modal 24
  pill:   50,
  // web específicos
  cardLarge: 24, // web rounded-3xl
  inputPill: 999, // web PlanRoute pill
};

export const spacing = {
  xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48,
};

export const fonts = {
  serif:       'PlayfairDisplay_400Regular',
  serifBold:   'PlayfairDisplay_700Bold',
  serifItalic: 'PlayfairDisplay_400Regular_Italic',
}
;
