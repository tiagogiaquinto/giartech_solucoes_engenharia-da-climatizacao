import { fetchCepData, fetchCnpjData } from './externalApis'

export const testCepApi = async () => {
  console.log('🧪 Testando API de CEP (ViaCEP)...')

  try {
    const testCep = '01310100'
    console.log(`📍 Buscando CEP: ${testCep}`)

    const result = await fetchCepData(testCep)

    if (result) {
      console.log('✅ API de CEP funcionando!')
      console.log('📦 Dados retornados:', {
        logradouro: result.logradouro,
        bairro: result.bairro,
        cidade: result.localidade,
        uf: result.uf
      })
      return true
    }
  } catch (error) {
    console.error('❌ Erro na API de CEP:', error)
    return false
  }
}

export const testCnpjApi = async () => {
  console.log('🧪 Testando API de CNPJ (CNPJ.ws)...')

  try {
    const testCnpj = '00000000000191'
    console.log(`🏢 Buscando CNPJ: ${testCnpj}`)

    const result = await fetchCnpjData(testCnpj)

    if (result) {
      console.log('✅ API de CNPJ funcionando!')
      console.log('📦 Dados retornados:', {
        razao_social: result.razao_social,
        nome_fantasia: result.nome_fantasia,
        municipio: result.municipio,
        uf: result.uf
      })
      return true
    }
  } catch (error) {
    console.error('❌ Erro na API de CNPJ:', error)
    return false
  }
}

export const testAllApis = async () => {
  console.log('🚀 Iniciando testes de APIs externas...\n')

  const cepResult = await testCepApi()
  console.log('\n')
  const cnpjResult = await testCnpjApi()

  console.log('\n📊 Resumo dos testes:')
  console.log(`CEP: ${cepResult ? '✅' : '❌'}`)
  console.log(`CNPJ: ${cnpjResult ? '✅' : '❌'}`)

  if (cepResult && cnpjResult) {
    console.log('\n🎉 Todas as APIs estão funcionando!')
  } else {
    console.log('\n⚠️ Algumas APIs apresentaram problemas')
  }

  return { cep: cepResult, cnpj: cnpjResult }
}
