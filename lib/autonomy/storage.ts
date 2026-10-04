import { ventureosConfigured, ventureosRequest } from '@/lib/tenant/rest'
const request = ventureosRequest
export const configured=()=>ventureosConfigured();
export async function policy(founderKey='primary'){
  const rows=await request('ventureos_autonomous_policies?select=*&founder_key=eq.'+encodeURIComponent(founderKey)+'&limit=1');
  return rows?.[0]??null;
}
export async function updatePolicy(founderKey:string,input:any){
  const rows=await request('ventureos_autonomous_policies?founder_key=eq.'+encodeURIComponent(founderKey),{method:'PATCH',headers:{Prefer:'return=representation'},body:JSON.stringify({
    enabled:Boolean(input.enabled),schedule_enabled:Boolean(input.schedule_enabled),cadence_hours:Math.max(1,Math.min(168,Number(input.cadence_hours||24))),
    minimum_opportunity_score:Math.max(0,Math.min(100,Number(input.minimum_opportunity_score??75))),
    max_products_per_run:Math.max(1,Math.min(5,Number(input.max_products_per_run||1))),
    require_approval_for_product:input.require_approval_for_product!==false,
    require_approval_for_execution:true,
    daily_budget_percent:Math.max(1,Math.min(100,Number(input.daily_budget_percent??25))),
    updated_at:new Date().toISOString()
  })});
  return rows?.[0]??null;
}
export async function activeRun(founderKey='primary'){
  const rows=await request('ventureos_autonomous_runs?select=*&founder_key=eq.'+encodeURIComponent(founderKey)+'&status=in.(queued,running,awaiting_approval)&order=created_at.desc&limit=1');
  return rows?.[0]??null;
}
export async function latestRun(founderKey='primary'){
  const rows=await request('ventureos_autonomous_runs?select=*&founder_key=eq.'+encodeURIComponent(founderKey)+'&order=created_at.desc&limit=1');
  return rows?.[0]??null;
}
export async function recentRuns(founderKey='primary',limit=20){
  return request('ventureos_autonomous_runs?select=*&founder_key=eq.'+encodeURIComponent(founderKey)+'&order=created_at.desc&limit='+Math.min(limit,50));
}
export async function runByKey(runKey:string){
  const rows=await request('ventureos_autonomous_runs?select=*&run_key=eq.'+encodeURIComponent(runKey)+'&limit=1');return rows?.[0]??null;
}
export async function createRun(row:any){
  return (await request('ventureos_autonomous_runs',{method:'POST',headers:{Prefer:'return=representation'},body:JSON.stringify(row)}))[0];
}
export async function updateRun(runKey:string,row:any){
  const rows=await request('ventureos_autonomous_runs?run_key=eq.'+encodeURIComponent(runKey),{method:'PATCH',headers:{Prefer:'return=representation'},body:JSON.stringify({...row,updated_at:new Date().toISOString()})});
  return rows?.[0]??null;
}
export async function steps(runKey:string){
  return request('ventureos_autonomous_steps?select=*&run_key=eq.'+encodeURIComponent(runKey)+'&order=order_index.asc');
}
export async function createSteps(rows:any[]){
  if(rows.length)await request('ventureos_autonomous_steps',{method:'POST',headers:{Prefer:'resolution=ignore-duplicates,return=minimal'},body:JSON.stringify(rows)});
}
export async function updateStep(runKey:string,stepKey:string,row:any){
  const rows=await request('ventureos_autonomous_steps?run_key=eq.'+encodeURIComponent(runKey)+'&step_key=eq.'+encodeURIComponent(stepKey),{method:'PATCH',headers:{Prefer:'return=representation'},body:JSON.stringify(row)});
  return rows?.[0]??null;
}
export async function event(row:any){
  const rows=await request('ventureos_autonomous_events',{method:'POST',headers:{Prefer:'return=representation'},body:JSON.stringify(row)});
  return rows?.[0]??null;
}
export async function events(limit=100){
  return request('ventureos_autonomous_events?select=*&order=created_at.desc&limit='+Math.min(limit,200));
}
export async function candidates(minScore=0,limit=10){
  return request('ventureos_opportunities?select=*&overall_score=gte.'+Number(minScore)+'&order=overall_score.desc,confidence.desc&limit='+Math.min(limit,50));
}
export async function opportunity(id:number){
  const rows=await request('ventureos_opportunities?select=*&id=eq.'+id+'&limit=1');return rows?.[0]??null;
}
export async function productsForOpportunity(id:number){
  return request('ventureos_products?select=*&opportunity_id=eq.'+id+'&order=created_at.desc&limit=5');
}
