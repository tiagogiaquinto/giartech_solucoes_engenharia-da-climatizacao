import { supabase } from '../lib/supabase'

export type RegimeTributario = 'lucro_presumido' | 'simples_nacional' | 'lucro_real'

export interface FiscalConfig {
  id?: string
  regime_tributario: RegimeTributario
  iss_pct: number
  pis_pct: number
  cofins_pct: number
  irpj_pct: number
  csll_pct: number
  encargos_clt_pct: number
  margem_alerta_pct: number
  margem_boa_pct: number
}

export interface FiscalBreakdown {
  valorBruto: number
  pis: number
  cofins: number
  iss: number
  irpj: number
  csll: number
  totalImpostos: number
  totalImpostosPct: number
  lucroAntesOcustos: number
  custoMateriais: number
  custoMaoObra: number
  lucroLiquido: number
  margemLiquida: number
}

export const DEFAULT_FISCAL_CONFIG: FiscalConfig = {
  regime_tributario: 'lucro_presumido',
  iss_pct: 5.0,
  pis_pct: 0.65,
  cofins_pct: 3.0,
  irpj_pct: 4.8,
  csll_pct: 2.88,
  encargos_clt_pct: 70.0,
  margem_alerta_pct: 20.0,
  margem_boa_pct: 40.0,
}

let cachedConfig: FiscalConfig | null = null
let cacheTs = 0
const CACHE_TTL = 60_000

export async function loadFiscalConfig(): Promise<FiscalConfig> {
  if (cachedConfig && Date.now() - cacheTs < CACHE_TTL) return cachedConfig

  const { data } = await supabase
    .from('fiscal_config')
    .select('*')
    .limit(1)
    .maybeSingle()

  if (data) {
    cachedConfig = {
      id: data.id,
      regime_tributario: data.regime_tributario as RegimeTributario,
      iss_pct: Number(data.iss_pct),
      pis_pct: Number(data.pis_pct),
      cofins_pct: Number(data.cofins_pct),
      irpj_pct: Number(data.irpj_pct),
      csll_pct: Number(data.csll_pct),
      encargos_clt_pct: Number(data.encargos_clt_pct),
      margem_alerta_pct: Number(data.margem_alerta_pct),
      margem_boa_pct: Number(data.margem_boa_pct),
    }
    cacheTs = Date.now()
    return cachedConfig
  }
  return DEFAULT_FISCAL_CONFIG
}

export function invalidateFiscalConfigCache() {
  cachedConfig = null
  cacheTs = 0
}

export function calcFiscal(
  valorBruto: number,
  custoMateriais = 0,
  custoMaoObra = 0,
  issPct = 5,
  regime: RegimeTributario = 'lucro_presumido',
  config?: Partial<FiscalConfig>
): FiscalBreakdown {
  const round2 = (v: number) => Math.round(v * 100) / 100

  const cfg = { ...DEFAULT_FISCAL_CONFIG, ...config }

  let pisPct: number, cofinsPct: number, irpjPct: number, csllPct: number

  switch (regime) {
    case 'simples_nacional':
      pisPct = 0; cofinsPct = 0; irpjPct = 0; csllPct = 0
      break
    case 'lucro_real':
      pisPct = cfg.pis_pct / 100; cofinsPct = cfg.cofins_pct / 100
      irpjPct = 0.25; csllPct = 0.09
      break
    default:
      pisPct = cfg.pis_pct / 100; cofinsPct = cfg.cofins_pct / 100
      irpjPct = cfg.irpj_pct / 100; csllPct = cfg.csll_pct / 100
  }

  const pis    = round2(valorBruto * pisPct)
  const cofins = round2(valorBruto * cofinsPct)
  const iss    = round2(valorBruto * (issPct / 100))
  const irpj   = round2(valorBruto * irpjPct)
  const csll   = round2(valorBruto * csllPct)
  const totalImpostos = pis + cofins + iss + irpj + csll
  const totalImpostosPct = valorBruto > 0 ? round2((totalImpostos / valorBruto) * 100) : 0
  const lucroAntesOcustos = round2(valorBruto - totalImpostos)
  const lucroLiquido = round2(valorBruto - totalImpostos - custoMateriais - custoMaoObra)
  const margemLiquida = valorBruto > 0 ? round2((lucroLiquido / valorBruto) * 100) : 0

  return {
    valorBruto, pis, cofins, iss, irpj, csll,
    totalImpostos, totalImpostosPct,
    lucroAntesOcustos, custoMateriais, custoMaoObra,
    lucroLiquido, margemLiquida
  }
}

export const REGIME_LABELS: Record<RegimeTributario, string> = {
  lucro_presumido: 'Lucro Presumido',
  simples_nacional: 'Simples Nacional',
  lucro_real: 'Lucro Real',
}
