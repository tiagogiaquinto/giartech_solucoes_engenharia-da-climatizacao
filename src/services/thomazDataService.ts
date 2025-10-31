export interface DataQueryResult {
  data: any[]
}

export const getData = async (): Promise<DataQueryResult> => ({ data: [] })
