import {runResearch} from '../../../../lib/research/service'
import {persistResearch} from '../../../../lib/research/storage'
export async function POST(req:Request){
  const secret=process.env.RESEARCH_RUN_SECRET
  if(secret&&req.headers.get('authorization')!==`Bearer ${secret}`)return Response.json({ok:false,error:'Unauthorized'},{status:401})
  const body=await req.json().catch(()=>({})) as {query?:string;mode?:'normal'|'deep'|'max';maxResults?:number}
  if(!body.query?.trim())return Response.json({ok:false,error:'query is required'},{status:400})
  const run=await runResearch({query:body.query.trim(),mode:body.mode??'normal',maxResults:body.maxResults??8})
  const storage=await persistResearch(run);return Response.json({ok:true,run,storage},{headers:{'Cache-Control':'no-store'}})
}
