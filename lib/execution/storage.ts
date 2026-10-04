import { ventureosConfigured, ventureosRequest } from '@/lib/tenant/rest'
const request = ventureosRequest
export const configured=()=>ventureosConfigured()
export async function product(productId:number){const rows=await request('ventureos_products?select=*&id=eq.'+productId+'&limit=1');return rows?.[0]??null}
export async function latestRun(productId:number){const rows=await request('ventureos_execution_runs?select=*&product_id=eq.'+productId+'&order=created_at.desc&limit=1');return rows?.[0]??null}
export async function runByKey(runKey:string){const rows=await request('ventureos_execution_runs?select=*&run_key=eq.'+encodeURIComponent(runKey)+'&limit=1');return rows?.[0]??null}
export async function runs(productId:number,limit=20){return request('ventureos_execution_runs?select=*&product_id=eq.'+productId+'&order=created_at.desc&limit='+Math.min(limit,100))}
export async function steps(runKey:string){return request('ventureos_execution_steps?select=*&run_key=eq.'+encodeURIComponent(runKey)+'&order=order_index.asc')}
export async function artifacts(runKey:string){return request('ventureos_execution_artifacts?select=*&run_key=eq.'+encodeURIComponent(runKey)+'&order=created_at.asc')}
export async function createRun(row:Record<string,unknown>){return(await request('ventureos_execution_runs',{method:'POST',headers:{Prefer:'return=representation'},body:JSON.stringify(row)}))[0]}
export async function updateRun(runKey:string,row:Record<string,unknown>){const rows=await request('ventureos_execution_runs?run_key=eq.'+encodeURIComponent(runKey),{method:'PATCH',headers:{Prefer:'return=representation'},body:JSON.stringify(row)});return rows?.[0]??null}
export async function createSteps(rows:Record<string,unknown>[]){if(!rows.length)return;await request('ventureos_execution_steps?on_conflict=run_key,step_key',{method:'POST',headers:{Prefer:'resolution=merge-duplicates,return=minimal'},body:JSON.stringify(rows)})}
export async function step(runKey:string,stepKey:string){const rows=await request('ventureos_execution_steps?run_key=eq.'+encodeURIComponent(runKey)+'&step_key=eq.'+encodeURIComponent(stepKey)+'&limit=1');return rows?.[0]??null}
export async function updateStep(runKey:string,stepKey:string,row:Record<string,unknown>){const rows=await request('ventureos_execution_steps?run_key=eq.'+encodeURIComponent(runKey)+'&step_key=eq.'+encodeURIComponent(stepKey),{method:'PATCH',headers:{Prefer:'return=representation'},body:JSON.stringify(row)});return rows?.[0]??null}
export async function createArtifacts(rows:Record<string,unknown>[]){if(rows.length)await request('ventureos_execution_artifacts?on_conflict=run_key,artifact_type,path,content_hash',{method:'POST',headers:{Prefer:'resolution=ignore-duplicates,return=minimal'},body:JSON.stringify(rows)})}
export async function patchProduct(productId:number,row:Record<string,unknown>){const rows=await request('ventureos_products?id=eq.'+productId,{method:'PATCH',headers:{Prefer:'return=representation'},body:JSON.stringify({...row,updated_at:new Date().toISOString()})});return rows?.[0]??null}
