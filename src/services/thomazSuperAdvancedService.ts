export interface ThomazConversationResult {
  response: string
}

export const sendMessage = async (message: string): Promise<ThomazConversationResult> => ({ response: '' })

class ThomazSuperAdvancedService {
  static async sendMessage(message: string): Promise<ThomazConversationResult> {
    return { response: '' }
  }
}

export { ThomazSuperAdvancedService }
export default ThomazSuperAdvancedService
