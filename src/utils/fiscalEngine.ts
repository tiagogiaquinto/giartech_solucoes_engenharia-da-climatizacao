export type RegimeTributario = 'lucro_presumido' | 'simples_nacional' | 'lucro_real'

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

const RATES: Record<RegimeTributario, {
  pis: number; cofins: number; irpj: number; csll: number
}> = {
  lucro_presumido: { pis: 0.0065, cofins: 0.03, irpj: 0.32 * 0.15, csll: 0.32 * 0.09 },
  simples_nacional: { pis: 0,      cofins: 0,    irpj: 0,             csll: 0 },
  lucro_real:       { pis: 0.0065, cofins: 0.03, irpj: 0.25,          csll: 0.09 },
}

export function calcFiscal(
  valorBruto: number,
  custoMateriais = 0,
  custoMaoObra = 0,
  issPct = 5,
  regime: RegimeTributario = 'lucro_presumido'
): FiscalBreakdown {
  const r = RATES[regime]
  const round2 = (v: number) => Math.round(v * 100) / 100

  const pis    = round2(valorBruto * r.pis)
  const cofins = round2(valorBruto * r.cofins)
  const iss    = round2(valorBruto * (issPct / 100))
  const irpj   = round2(valorBruto * r.irpj)
  const csll   = round2(valorBruto * r.csll)
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
