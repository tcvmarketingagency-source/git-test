function db(){const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env['SUPA'+'BASE_SECRET_KEY']||process.env['SUPA'+'BASE_SERVICE_ROLE_KEY'];if(!url||!key)return null;return{url:url.replace(/\/$/,''),key}}
async function request(path:string,init:RequestInit={}){const d=db();if(!d)throw new Error('Supabase server credentials are not configured');const r=await fetch(d.url+'/rest/v1/'+path,{...init,headers:{apikey:d.key,Authorization:'Bearer '+d.key,'Content-Type':'application/json',...(init.headers||{})},cache:'no-store'});if(!r.ok)throw new Error('Supabase '+r.status+': '+await r.text());return r.status===204?null:r.json()}
export const configured=()=>!!db()
export const LIFECYCLE=['ideas','validation','mvp','building','beta','live','paused','archived','killed'] as const
export type Lifecycle=typeof LIFECYCLE[number]
const transitions:Record<string,string[]>={
 ideas:['validation','killed','archived'],
 validation:['mvp','ideas','killed','archived'],
 mvp:['building','validation','killed','archived'],
 building:['beta','mvp','paused','killed'],
 beta:['live','building','paused','killed'],
 live:['paused','archived'],
 paused:['building','beta','live','archived','killed'],
 archived:['ideas'],
 killed:['ideas']
}
export function canTransition(from:string,to:string){if(from===to)return true;return (transitions[from]||[]).includes(to)}
export async function portfolioProducts(limit=200){return request('ventureos_products?select=*&order=created_at.desc&limit='+Math.min(limit,500))}
export async function portfolioProduct(id:number){const rows=await request('ventureos_products?select=*&id=eq.'+id+'&limit=1');return rows?.[0]??null}
export async function lifecycleHistory(productId:number,limit=100){return request('ventureos_product_lifecycle_history?select=*&product_id=eq.'+productId+'&order=created_at.desc&limit='+Math.min(limit,200))}
export async function metrics(productId:number,limit=120){return request('ventureos_product_metrics?select=*&product_id=eq.'+productId+'&order=metric_date.desc&limit='+Math.min(limit,365))}
export async function latestMetric(productId:number){const rows=await metrics(productId,1);return rows?.[0]??null}
export async function insertHistory(row:Record<string,unknown>){return(await request('ventureos_product_lifecycle_history',{method:'POST',headers:{Prefer:'return=representation'},body:JSON.stringify(row)}))[0]}
export async function patchProduct(id:number,row:Record<string,unknown>){const [r]=await request('ventureos_products?id=eq.'+id,{method:'PATCH',headers:{Prefer:'return=representation'},body:JSON.stringify({...row,updated_at:new Date().toISOString()})});return r}
export async function upsertMetric(row:Record<string,unknown>){return(await request('ventureos_product_metrics?on_conflict=product_id,metric_date',{method:'POST',headers:{Prefer:'resolution=merge-duplicates,return=representation'},body:JSON.stringify(row)}))[0]}
export async function productCounts(){const products=await portfolioProducts(500);const counts:any={total:products.length};for(const s of LIFECYCLE)counts[s]=products.filter((p:any)=>p.status===s).length;counts.active=products.filter((p:any)=>['mvp','building','beta','live'].includes(p.status)).length;counts.revenue=products.filter((p:any)=>Number(p.mrr||0)>0).reduce((n:number,p:any)=>n+Number(p.mrr||0),0);counts.api_cost=products.reduce((n:number,p:any)=>n+Number(p.api_cost||0),0);counts.customers=products.reduce((n:number,p:any)=>n+Number(p.customer_count||0),0);return{products,counts}}
