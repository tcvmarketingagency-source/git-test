
'use client'
import {useEffect,useMemo,useState} from 'react'
import {ArrowRight,Box,CheckCircle2,Cloud,Code2,Database,ExternalLink,Factory,GitBranch,Loader2,RefreshCw,Rocket,Search,ShieldCheck,TriangleAlert,Workflow} from 'lucide-react'

function pretty(v:string){return String(v||'').replace(/_/g,' ').replace(/\b\w/g,function(s){return s.toUpperCase()})}
export default function Execution(){
 const [products,setProducts]=useState<any[]>([]),[states,setStates]=useState<Record<number,any>>({}),[providers,setProviders]=useState<Record<string,any>>({}),[loading,setLoading]=useState(true),[error,setError]=useState('')
 const load=async()=>{
  setLoading(true);setError('')
  try{
   const [productsResponse,providersResponse]=await Promise.all([fetch('/api/products',{cache:'no-store'}),fetch('/api/execution/providers',{cache:'no-store'})])
   const j=await productsResponse.json(),providerPayload=await providersResponse.json()
   if(!j.ok)throw new Error(j.error||'Products unavailable')
   if(providerPayload?.providers)setProviders(providerPayload.providers)
   const list=j.products||[];setProducts(list)
   const entries=await Promise.all(list.slice(0,50).map(async function(p:any){const x=await fetch('/api/execution?product_id='+p.id,{cache:'no-store'}).then(function(z){return z.json()});return [p.id,x]}))
   const next:any={};entries.forEach(function(e:any){next[e[0]]=e[1]});setStates(next)
  }catch(e){setError(e instanceof Error?e.message:String(e))}
  finally{setLoading(false)}
 }
 useEffect(()=>{load()},[])
 const counts=useMemo(()=>{const base:any={total:products.length,not_started:0,queued:0,running:0,repository_ready:0,deployment_queued:0,completed:0,failed:0};products.forEach(function(p:any){const s=states[p.id]?.product?.execution_status||p.execution_status||'not_started';base[s]=(base[s]||0)+1});return base},[products,states])
 return <main className="p10-shell">
  <header className="p10-top"><div><div className="p10-eyebrow">VENTUREOS / PHASE 10 / EXECUTION LAYER</div><h1>Execution Control Center</h1><p>Turn a build-ready Product Factory output into an auditable execution run: scaffold → GitHub → Figma → Supabase → Vercel → verification.</p></div><div className="p10-actions"><button className="p10-btn" onClick={load} disabled={loading}><RefreshCw size={14} className={loading?'p10-spin':''}/> Refresh</button><a className="p10-primary" href="/factory"><Factory size={14}/> Product Factory <ArrowRight size={12}/></a></div></header>
  {error&&<div className="p10-banner danger"><TriangleAlert size={15}/><div><b>Execution data unavailable</b><span>{error}</span></div></div>}
  <section className="p10-grid">
   <div className="p10-kpi"><span>Products</span><b>{counts.total}</b><small>Eligible factory outputs</small></div>
   <div className="p10-kpi"><span>Queued</span><b>{counts.queued||0}</b><small>Ready to execute</small></div>
   <div className="p10-kpi"><span>Running</span><b>{counts.running||0}</b><small>Active execution</small></div>
   <div className="p10-kpi"><span>Repository ready</span><b>{counts.repository_ready||0}</b><small>GitHub provisioned</small></div>
   <div className="p10-kpi"><span>Live / completed</span><b>{(counts.completed||0)}</b><small>Execution completed</small></div>
  </section>
  <section className="p10-panel" style={{marginBottom:13}}>
   <div className="p10-head"><div><b>Integration readiness</b><span>Live connection status is derived from server-side credentials.</span></div><ShieldCheck size={15}/></div>
   <div className="p10-provider-grid">{['github','figma','supabase','vercel','build_agent'].map(function(k){const found=providers[k];return <div className="p10-provider" key={k}><div className="p10-provider-top"><b>{found?.label||pretty(k)}</b><i className={'p10-dot '+(found?.configured?'on':'')}/></div><span>{found?.configured?'Configured':'Needs server configuration'} · {found?.hint||'Environment secret'}</span></div>})}</div>
  </section>
  <section className="p10-panel">
   <div className="p10-head"><div><b>Products ready for execution</b><span>Each product opens its own execution workspace and step history.</span></div><Workflow size={15}/></div>
   {loading?<div className="p10-empty"><Loader2 size={24} className="p10-spin"/><strong>Loading execution portfolio…</strong><span>Reading Product Factory outputs and execution state.</span></div>:
    products.length?<div className="p10-products">{products.map(function(p:any){const st=states[p.id],run=st?.run,status=st?.product?.execution_status||p.execution_status||'not_started';return <article className="p10-product" key={p.id}><div className="p10-product-top"><span className="p10-id">PRODUCT #{String(p.id).padStart(3,'0')}</span><span className="p10-status">{pretty(status)}</span></div><h3>{p.name}</h3><p>{p.thesis||'No thesis recorded.'}</p><div className="p10-product-meta"><div><span>Factory state</span><b>{pretty(p.status)}</b></div><div><span>Execution steps</span><b>{st?.steps?.filter((x:any)=>x.status==='completed').length||0}/{st?.steps?.length||7}</b></div><div><span>Run</span><b>{run?.status?pretty(run.status):'Not started'}</b></div></div><div className="p10-product-bottom"><span>{p.repository_url?'GitHub connected':'Repository pending'}</span><a href={'/execution/'+p.id}>Open workspace <ArrowRight size={11}/></a></div></article>})}</div>:
    <div className="p10-empty"><Box size={25}/><strong>No Product Factory outputs yet</strong><span>Generate a product specification first. Phase 10 executes only build-ready products; it does not invent product requirements.</span><a className="p10-primary" href="/factory"><Factory size={13}/> Open Product Factory</a></div>}
  </section>
  <footer className="p10-footer"><span>VentureOS Phase 10 · Execution Layer</span><span>Auditable · idempotent · provider-aware</span></footer>
 </main>
}