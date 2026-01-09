import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
}

interface SearchParams {
  keywords: string[]
  location: string
  radius: number
  businessType?: string
  maxResults?: number
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    const { searchParams } = new URL(req.url)
    const campaignId = searchParams.get('campaignId')

    if (!campaignId) {
      return new Response(
        JSON.stringify({ error: 'Campaign ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { data: config } = await supabase
      .from('lead_capture_config')
      .select('google_maps_api_key')
      .single()

    if (!config?.google_maps_api_key) {
      return new Response(
        JSON.stringify({ error: 'Google Maps API key not configured' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { data: campaign } = await supabase
      .from('lead_capture_campaigns')
      .select('*')
      .eq('id', campaignId)
      .single()

    if (!campaign) {
      return new Response(
        JSON.stringify({ error: 'Campaign not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const keywords = campaign.search_keywords || []
    const location = campaign.search_region || 'Brasil'
    const radius = (campaign.search_radius_km || 10) * 1000

    const leads: any[] = []

    for (const keyword of keywords) {
      const searchQuery = `${keyword} em ${location}`
      
      const placesUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(searchQuery)}&radius=${radius}&key=${config.google_maps_api_key}`
      
      const placesResponse = await fetch(placesUrl)
      const placesData = await placesResponse.json()

      if (placesData.status === 'OK' && placesData.results) {
        for (const place of placesData.results.slice(0, 20)) {
          const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place.place_id}&fields=name,formatted_phone_number,website,formatted_address,rating,user_ratings_total,business_status&key=${config.google_maps_api_key}`
          
          const detailsResponse = await fetch(detailsUrl)
          const detailsData = await detailsResponse.json()

          if (detailsData.status === 'OK' && detailsData.result) {
            const details = detailsData.result
            
            const addressParts = details.formatted_address?.split(', ') || []
            const cep = addressParts.find((part: string) => /\d{5}-\d{3}/.test(part)) || ''
            const state = addressParts[addressParts.length - 2]?.split(' - ')[1] || ''
            const city = addressParts[addressParts.length - 2]?.split(' - ')[0] || ''

            const leadData = {
              campaign_id: campaignId,
              company_name: details.name || place.name,
              phone: details.formatted_phone_number || '',
              address: details.formatted_address || '',
              cep: cep,
              city: city,
              state: state,
              business_type: keyword,
              google_place_id: place.place_id,
              google_rating: details.rating || 0,
              google_reviews_count: details.user_ratings_total || 0,
              website: details.website || '',
              source: 'google_maps',
              status: 'novo',
              priority: 'média',
              metadata: {
                business_status: details.business_status,
                search_keyword: keyword,
                location: place.geometry?.location
              },
              captured_at: new Date().toISOString()
            }

            const { data: existing } = await supabase
              .from('captured_leads')
              .select('id')
              .eq('google_place_id', place.place_id)
              .single()

            if (!existing) {
              const { data: inserted, error } = await supabase
                .from('captured_leads')
                .insert(leadData)
                .select()
                .single()

              if (!error && inserted) {
                leads.push(inserted)
              }
            }
          }

          await new Promise(resolve => setTimeout(resolve, 100))
        }
      }
    }

    await supabase
      .from('lead_capture_campaigns')
      .update({ last_capture_at: new Date().toISOString() })
      .eq('id', campaignId)

    return new Response(
      JSON.stringify({ 
        success: true, 
        leads_captured: leads.length,
        leads: leads 
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error: any) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})