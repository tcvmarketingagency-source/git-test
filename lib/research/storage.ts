import type {ResearchRun} from './types'
function db(){const url=process.env.NEXT_PUBLIC_SUPABASE_URL;const key=(process.env.SUPABASE_SECRET_KEY||process.env.SUPABASE_SERVICE_ROLE_KEY);if(!url||!key)return null;return{url:url.replace(/\/$/,''),key}}
async function post(path:string,body:unknown){const d=db();if(!d)return false;const r=await fetch(`${d.url}/rest/v1/${path}`,{method:'POST',
  headers:{apikey:d.key,Authorization:`Bearer ${d.key}`,'Content-Type':'application/json',Prefer:'return=minimal'},body:JSON.stringify(body),cache:'no-store'})
  if(!r.ok)throw new Error(`Supabase ${r.status}`);return true}
export async function persistResearch(run:ResearchRun){
  if(!db())return{persisted:false}
  await post('ventureos_research_runs',{run_id:run.id,query:run.query,mode:run.mode,status:run.status,
    started_at:run.startedAt,completed_at:run.completedAt,providers:run.providers,error:run.error??null})
  if(run.sources.length)await post('ventureos_research_sources',run.sources.map(s=>({run_id:run.id,provider:s.provider,url:s.url,title:s.title??null,
    snippet:s.snippet??null,content:s.content??null,published_at:s.publishedAt??null,score:s.score??null,raw_json:s.raw??null})))
  return{persisted:true}
}
export async function recentRuns(limit=20){
  const d=db();if(!d)return[]
  const r=await fetch(`${d.url}/rest/v1/ventureos_research_runs?select=*&order=started_at.desc&limit=${Math.min(limit,50)}`,
    {headers:{apikey:d.key,Authorization:`Bearer ${d.key}`},cache:'no-store'})
  if(!r.ok)throw new Error(`Supabase ${r.status}`);return await r.json()
}
