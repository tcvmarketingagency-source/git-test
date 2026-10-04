import {recentRuns} from '../../../../lib/research/storage'
export async function GET(){const runs=await recentRuns(20);return Response.json({ok:true,runs,configured:!!(process.env.SUPABASE_SECRET_KEY||process.env.SUPABASE_SERVICE_ROLE_KEY)},{headers:{'Cache-Control':'no-store'}})}
