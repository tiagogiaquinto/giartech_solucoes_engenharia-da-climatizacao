/**
 * Branding Configuration - Identidade Visual Giartech
 *
 * Configuração centralizada de cores, logos, fontes e estilos
 * para manter consistência em TODOS os documentos gerados
 */

export interface BrandColors {
  primary: [number, number, number]
  secondary: [number, number, number]
  accent: [number, number, number]
  success: [number, number, number]
  warning: [number, number, number]
  danger: [number, number, number]
  text: [number, number, number]
  textLight: [number, number, number]
  textMuted: [number, number, number]
  background: [number, number, number]
  backgroundLight: [number, number, number]
}

export interface LogoConfig {
  primary: string
  fallback: string
  width: number
  height: number
  aspectRatio: number
}

export interface FontConfig {
  title: { size: number; weight: string; color?: [number, number, number] }
  subtitle: { size: number; weight: string; color?: [number, number, number] }
  heading: { size: number; weight: string; color?: [number, number, number] }
  body: { size: number; weight: string; color?: [number, number, number] }
  small: { size: number; weight: string; color?: [number, number, number] }
  caption: { size: number; weight: string; color?: [number, number, number] }
}

export interface SpacingConfig {
  xs: number
  sm: number
  md: number
  lg: number
  xl: number
  xxl: number
}

export interface DocumentMargins {
  top: number
  right: number
  bottom: number
  left: number
}

export interface BrandingConfig {
  colors: BrandColors
  logo: LogoConfig
  fonts: FontConfig
  spacing: SpacingConfig
  margins: DocumentMargins
  companyName: string
  companyTagline: string
}

/**
 * GIARTECH BRAND - Configuração oficial
 */
export const GIARTECH_BRAND: BrandingConfig = {
  // Cores da marca
  colors: {
    // Azul Giartech (Principal)
    primary: [15, 86, 125],

    // Azul claro (Secundário)
    secondary: [230, 240, 250],

    // Amarelo destaque (Accent)
    accent: [255, 193, 7],

    // Verde sucesso
    success: [76, 175, 80],

    // Laranja aviso
    warning: [255, 152, 0],

    // Vermelho erro
    danger: [244, 67, 54],

    // Cinza escuro (Texto principal)
    text: [51, 51, 51],

    // Cinza médio (Texto secundário)
    textLight: [102, 102, 102],

    // Cinza claro (Texto desabilitado)
    textMuted: [158, 158, 158],

    // Branco (Fundo)
    background: [255, 255, 255],

    // Cinza muito claro (Fundo alternativo)
    backgroundLight: [250, 250, 250]
  },

  // Configuração do logo
  logo: {
    primary: '/1000156010.jpg',  // Logo principal
    fallback: '/8.jpg',           // Logo alternativo
    width: 50,
    height: 50,
    aspectRatio: 1
  },

  // Tipografia
  fonts: {
    title: {
      size: 20,
      weight: 'bold',
      color: [15, 86, 125] // primary
    },
    subtitle: {
      size: 16,
      weight: 'bold',
      color: [15, 86, 125] // primary
    },
    heading: {
      size: 14,
      weight: 'bold',
      color: [51, 51, 51] // text
    },
    body: {
      size: 10,
      weight: 'normal',
      color: [51, 51, 51] // text
    },
    small: {
      size: 9,
      weight: 'normal',
      color: [102, 102, 102] // textLight
    },
    caption: {
      size: 8,
      weight: 'normal',
      color: [158, 158, 158] // textMuted
    }
  },

  // Espaçamentos
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    xxl: 32
  },

  // Margens do documento
  margins: {
    top: 20,
    right: 20,
    bottom: 20,
    left: 20
  },

  // Informações da empresa
  companyName: 'Giartech Soluções',
  companyTagline: 'Excelência em Serviços Técnicos'
}

/**
 * Helper: Converter RGB array para hex string
 */
export const rgbToHex = (rgb: [number, number, number]): string => {
  return '#' + rgb.map(c => c.toString(16).padStart(2, '0')).join('')
}

/**
 * Helper: Converter RGB array para string CSS
 */
export const rgbToCss = (rgb: [number, number, number]): string => {
  return `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`
}

/**
 * Helper: Obter cor com opacidade
 */
export const rgbaWithOpacity = (
  rgb: [number, number, number],
  opacity: number
): string => {
  return `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${opacity})`
}

/**
 * Templates de documentos disponíveis
 */
export enum DocumentTemplate {
  STANDARD = 'standard',
  PROFESSIONAL = 'professional',
  PREMIUM = 'premium',
  SIMPLIFIED = 'simplified'
}

/**
 * Configurações por template
 */
export interface TemplateConfig {
  showLogo: boolean
  showHeader: boolean
  showFooter: boolean
  showPageNumbers: boolean
  showWatermark: boolean
  detailLevel: 'minimal' | 'standard' | 'detailed'
  colorScheme: 'color' | 'grayscale'
}

export const TEMPLATE_CONFIGS: Record<DocumentTemplate, TemplateConfig> = {
  [DocumentTemplate.STANDARD]: {
    showLogo: true,
    showHeader: true,
    showFooter: true,
    showPageNumbers: true,
    showWatermark: false,
    detailLevel: 'standard',
    colorScheme: 'color'
  },
  [DocumentTemplate.PROFESSIONAL]: {
    showLogo: true,
    showHeader: true,
    showFooter: true,
    showPageNumbers: true,
    showWatermark: false,
    detailLevel: 'detailed',
    colorScheme: 'color'
  },
  [DocumentTemplate.PREMIUM]: {
    showLogo: true,
    showHeader: true,
    showFooter: true,
    showPageNumbers: true,
    showWatermark: true,
    detailLevel: 'detailed',
    colorScheme: 'color'
  },
  [DocumentTemplate.SIMPLIFIED]: {
    showLogo: false,
    showHeader: false,
    showFooter: false,
    showPageNumbers: false,
    showWatermark: false,
    detailLevel: 'minimal',
    colorScheme: 'grayscale'
  }
}

export default GIARTECH_BRAND
