function db(){const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=(process.env.SUPABASE_SECRET_KEY||process.env.SUPABASE_SERVICE_ROLE_KEY);if(!url||!key)return null;return{url:url.replace(/\/$/,''),key}}
async function request(path:string,init:RequestInit={}){const d=db();if(!d)throw new Error('Supabase server credentials are not configured');const r=await fetch(d.url+'/rest/v1/'+path,{...init,headers:{apikey:d.key,Authorization:'Bearer '+d.key,'Content-Type':'application/json',...(init.headers||{})},cache:'no-store'});if(!r.ok)throw new Error('Supabase '+r.status+': '+await r.text());return r.status===204?null:r.json()}
export async function researchSources(limit=200){return request('ventureos_research_sources?select=*&order=created_at.desc&limit='+Math.min(limit,500))}
export async function signalByHash(hash:string){const rows=await request('ventureos_signals?select=*&content_hash=eq.'+encodeURIComponent(hash)+'&limit=1');return rows?.[0]??null}
export async function insertSignal(row:Record<string,unknown>){const [r]=await request('ventureos_signals',{method:'POST',headers:{Prefer:'return=representation'},body:JSON.stringify(row)});return r}
export async function updateSignal(id:number,patch:Record<string,unknown>){const [r]=await request('ventureos_signals?id=eq.'+id,{method:'PATCH',headers:{Prefer:'return=representation'},body:JSON.stringify(patch)});return r}
export async function upsertEntity(name:string,domain:string|null,signalId:number){
 if(!domain)return null
 const existing=(await request('ventureos_entities?select=*&canonical_domain=eq.'+encodeURIComponent(domain)+'&limit=1'))?.[0]
 if(existing){await request('ventureos_entities?id=eq.'+existing.id,{method:'PATCH',body:JSON.stringify({signal_count:Number(existing.signal_count||0)+1,last_seen_at:new Date().toISOString()})});await request('ventureos_signal_entities',{method:'POST',headers:{Prefer:'resolution=ignore-duplicates,return=minimal'},body:JSON.stringify({signal_id:signalId,entity_id:existing.id,relation:'mentions'})});return existing}
 const created=(await request('ventureos_entities',{method:'POST',headers:{Prefer:'return=representation'},body:JSON.stringify({canonical_name:name||domain,canonical_domain:domain,signal_count:1})}))[0]
 await request('ventureos_signal_entities',{method:'POST',headers:{Prefer:'return=minimal'},body:JSON.stringify({signal_id:signalId,entity_id:created.id,relation:'mentions'})});return created
}
export async function findCluster(clusterKey:string){const rows=await request('ventureos_problem_clusters?select=*&cluster_key=eq.'+encodeURIComponent(clusterKey)+'&limit=1');return rows?.[0]??null}
export async function upsertCluster(row:Record<string,unknown>){
 const existing=await findCluster(String(row.cluster_key))
 if(existing){const [r]=await request('ventureos_problem_clusters?id=eq.'+existing.id,{method:'PATCH',headers:{Prefer:'return=representation'},body:JSON.stringify(row)});return r}
 return (await request('ventureos_problem_clusters',{method:'POST',headers:{Prefer:'return=representation'},body:JSON.stringify(row)}))[0]
}
export async function upsertMembership(clusterId:number,signalId:number,similarity=1){await request('ventureos_problem_cluster_members',{method:'POST',headers:{Prefer:'resolution=ignore-duplicates,return=minimal'},body:JSON.stringify({cluster_id:clusterId,signal_id:signalId,similarity})})}
export async function createProcessingRun(runId:string,sourceRunId:string|null){return (await request('ventureos_signal_processing_runs',{method:'POST',headers:{Prefer:'return=representation'},body:JSON.stringify({run_id:runId,source_run_id:sourceRunId,status:'running'})}))[0]}
export async function finishProcessingRun(runId:string,patch:Record<string,unknown>){await request('ventureos_signal_processing_runs?run_id=eq.'+encodeURIComponent(runId),{method:'PATCH',body:JSON.stringify({...patch,status:patch.error?'partial':'completed',completed_at:new Date().toISOString()})})}
export async function recentSignals(limit=500){return request('ventureos_signals?select=*&order=last_seen_at.desc&limit='+Math.min(limit,1000))}
export async function problemClusters(limit=100){return request('ventureos_problem_clusters?select=*&order=momentum_score.desc&limit='+Math.min(limit,200))}
export async function clusterSignals(clusterId:number,limit=50){return request('ventureos_problem_cluster_members?select=similarity,signal:ventureos_signals(*)&cluster_id=eq.'+clusterId+'&order=assigned_at.desc&limit='+Math.min(limit,100))}
export async function signalStats(){return request('ventureos_signals?select=signal_type,industry,audience,momentum_score,created_at&order=created_at.desc&limit=1000')}