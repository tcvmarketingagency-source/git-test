import {runResearch} from '../../../../lib/research/service'
import {persistResearch} from '../../../../lib/research/storage'
export const maxDuration=60
export async function GET(req:Request){
  const secret=process.env.CRON_SECRET
  if(!secret||req.headers.get('authorization')!==`Bearer ${secret}`)return new Response('Unauthorized',{status:401})
  const query=process.env.VENTUREOS_DAILY_QUERY??'What changed in AI, SaaS, automation, SMB software and emerging business problems in the last 24 hours? Focus on new demand signals, workflow pain, competitor changes and product opportunities.'
  const run=await runResearch({query,mode:'deep',maxResults:10});const storage=await persistResearch(run)
  return Response.json({ok:true,runId:run.id,status:run.status,sources:run.sources.length,storage})
}
