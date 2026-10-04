
function db(){const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env['SUPA'+'BASE_SECRET_KEY']||process.env['SUPA'+'BASE_SERVICE_ROLE_KEY'];if(!url||!key)return null;return{url:url.replace(/\/$/,''),key}}
async function request(path:string,init:RequestInit={}){const d=db();if(!d)throw new Error('Supabase server credentials are not configured');const r=await fetch(d.url+'/rest/v1/'+path,{...init,headers:{apikey:d.key,Authorization:'Bearer '+d.key,'Content-Type':'application/json',...(init.headers||{})},cache:'no-store'});if(!r.ok)throw new Error('Supabase '+r.status+': '+await r.text());return r.status===204?null:r.json()}
export const configured=()=>!!db()
export async function opportunityById(id:number){const rows=await request('ventureos_opportunities?select=*&id=eq.'+id+'&limit=1');return rows?.[0]??null}
export async function createRun(row:Record<string,unknown>){return(await request('ventureos_product_generation_runs',{method:'POST',headers:{Prefer:'return=representation'},body:JSON.stringify(row)}))[0]}
export async function finishRun(runId:string,patch:Record<string,unknown>){await request('ventureos_product_generation_runs?run_id=eq.'+encodeURIComponent(runId),{method:'PATCH',body:JSON.stringify({...patch,status:patch.error?'partial':'completed',completed_at:new Date().toISOString()})})}
export async function createProduct(row:Record<string,unknown>){return(await request('ventureos_products',{method:'POST',headers:{Prefer:'return=representation'},body:JSON.stringify(row)}))[0]}
export async function listProducts(limit=100){return request('ventureos_products?select=*&order=created_at.desc&limit='+Math.min(limit,200))}
export async function productById(id:number){const rows=await request('ventureos_products?select=*&id=eq.'+id+'&limit=1');return rows?.[0]??null}
export async function productByOpportunity(id:number){const rows=await request('ventureos_products?select=*&opportunity_id=eq.'+id+'&order=created_at.desc&limit=1');return rows?.[0]??null}
export async function createArtifacts(rows:Record<string,unknown>[]){if(rows.length)await request('ventureos_product_artifacts?on_conflict=product_id,artifact_type,version',{method:'POST',headers:{Prefer:'resolution=merge-duplicates,return=minimal'},body:JSON.stringify(rows)})}
export async function artifactList(productId:number){return request('ventureos_product_artifacts?select=*&product_id=eq.'+productId+'&order=artifact_type.asc,version.desc')}
export async function createFeatures(rows:Record<string,unknown>[]){if(rows.length)await request('ventureos_product_features?on_conflict=product_id,feature_key',{method:'POST',headers:{Prefer:'resolution=merge-duplicates,return=minimal'},body:JSON.stringify(rows)})}
export async function featureList(productId:number){return request('ventureos_product_features?select=*&product_id=eq.'+productId+'&order=phase.asc,priority.asc,created_at.asc')}
export async function updateProduct(id:number,row:Record<string,unknown>){const [r]=await request('ventureos_products?id=eq.'+id,{method:'PATCH',headers:{Prefer:'return=representation'},body:JSON.stringify({...row,updated_at:new Date().toISOString()})});return r}
