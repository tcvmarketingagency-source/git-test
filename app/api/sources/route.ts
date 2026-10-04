import {providerHealth} from '../../../lib/research/service'
import {recentRuns} from '../../../lib/research/storage'
export async function GET(){const runs=await recentRuns(10).catch(()=>[]);return Response.json({ok:true,providers:providerHealth(),runs,generatedAt:new Date().toISOString()},{headers:{'Cache-Control':'no-store'}})}
