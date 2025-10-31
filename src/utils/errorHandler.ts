export const handleSupabaseError = (error: any) => {
  console.error('Supabase error:', error)
  return error
}
