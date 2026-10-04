import { ventureosConfigured, ventureosRequest } from '@/lib/tenant/rest'
const request = ventureosRequest
export const configured=()=>ventureosConfigured()
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
