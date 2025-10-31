export interface ReasoningResult {
  result: string
}

export class ThomazReasoningEngine {
  async reason(input: string): Promise<ReasoningResult> {
    return { result: '' }
  }
}

export const reason = async (input: string): Promise<ReasoningResult> => ({ result: '' })
