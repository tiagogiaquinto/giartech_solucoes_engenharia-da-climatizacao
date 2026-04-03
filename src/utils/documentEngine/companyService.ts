import { supabase } from '../../lib/supabase'
import type { CompanyProfile } from './types'

const FALLBACK: CompanyProfile = {
  company_name: 'Minha Empresa',
  trade_name: '',
  cnpj: '',
  address: '',
  city: '',
  state: '',
  zip_code: '',
  phone: '',
  email: '',
  website: '',
  logo_url: '',
  primary_color: '#0F567D',
  secondary_color: '#10B981',
  pix_key: '',
  default_warranty_days: 90,
}

let _cache: CompanyProfile | null = null

export async function getCompanyProfile(): Promise<CompanyProfile> {
  if (_cache) return _cache

  const { data } = await supabase
    .from('company_profile')
    .select('*')
    .maybeSingle()

  if (data) {
    _cache = data as CompanyProfile
    return _cache
  }

  return FALLBACK
}

export function clearCompanyProfileCache() {
  _cache = null
}

export function hexToRgb(hex: string): [number, number, number] {
  const cleaned = hex.replace('#', '')
  const r = parseInt(cleaned.substring(0, 2), 16)
  const g = parseInt(cleaned.substring(2, 4), 16)
  const b = parseInt(cleaned.substring(4, 6), 16)
  if (isNaN(r) || isNaN(g) || isNaN(b)) return [15, 86, 125]
  return [r, g, b]
}

export function valorPorExtenso(valor: number): string {
  if (valor === 0) return 'zero reais'

  const grupos = [
    '', 'mil', 'milhão', 'bilhão',
  ]
  const unidades = [
    '', 'um', 'dois', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove',
    'dez', 'onze', 'doze', 'treze', 'quatorze', 'quinze', 'dezesseis', 'dezessete', 'dezoito', 'dezenove',
  ]
  const dezenas = [
    '', '', 'vinte', 'trinta', 'quarenta', 'cinquenta', 'sessenta', 'setenta', 'oitenta', 'noventa',
  ]
  const centenas = [
    '', 'cem', 'duzentos', 'trezentos', 'quatrocentos', 'quinhentos', 'seiscentos', 'setecentos', 'oitocentos', 'novecentos',
  ]

  const reais = Math.floor(valor)
  const centavos = Math.round((valor - reais) * 100)

  function converterGrupo(n: number): string {
    if (n === 0) return ''
    if (n === 100) return 'cem'
    const c = Math.floor(n / 100)
    const resto = n % 100
    const dz = Math.floor(resto / 10)
    const un = resto % 10
    const parts: string[] = []
    if (c > 0) parts.push(centenas[c])
    if (resto < 20 && resto > 0) {
      parts.push(unidades[resto])
    } else {
      if (dz > 0) parts.push(dezenas[dz])
      if (un > 0) parts.push(unidades[un])
    }
    return parts.join(' e ')
  }

  function converterInteiro(n: number): string {
    if (n === 0) return 'zero'
    const partes: string[] = []
    let i = 0
    while (n > 0) {
      const grupo = n % 1000
      if (grupo !== 0) {
        const txt = converterGrupo(grupo)
        partes.unshift(grupos[i] ? `${txt} ${grupos[i]}` : txt)
      }
      n = Math.floor(n / 1000)
      i++
    }
    return partes.join(', ')
  }

  const partes: string[] = []
  if (reais > 0) {
    const txt = converterInteiro(reais)
    partes.push(`${txt} ${reais === 1 ? 'real' : 'reais'}`)
  }
  if (centavos > 0) {
    const txt = converterInteiro(centavos)
    partes.push(`${txt} ${centavos === 1 ? 'centavo' : 'centavos'}`)
  }

  return partes.join(' e ')
}
