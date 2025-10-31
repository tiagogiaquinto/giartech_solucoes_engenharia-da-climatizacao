export const getProviders = async () => ({ data: [] })
export const updateProvider = async (id: string, data: any) => ({ success: true })

export default class AIProvidersService {
  static async getProviders() {
    return { data: [] }
  }
  static async updateProvider(id: string, data: any) {
    return { success: true }
  }
}
