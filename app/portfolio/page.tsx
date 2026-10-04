
'use client'
import {useEffect,useMemo,useState} from 'react'
import {Archive,ArrowRight,BarChart3,Box,CheckCircle2,ChevronRight,CircleDollarSign,ExternalLink,Factory,FlaskConical,History,Loader2,PauseCircle,PlayCircle,RefreshCw,Rocket,Skull,Target,Users,Workflow,Zap} from 'lucide-react'

const STATES=[['ideas','Ideas',Factory],['validation','Validation',FlaskConical],['mvp','MVP',Target],['building','Building',Workflow],['beta','Beta',Rocket],['live','Live',CheckCircle2],['paused','Paused',PauseCircle],['archived','Archived',Archive],['killed','Killed',Skull]] as const
const ACTIVE=new Set(['mvp','building','beta','live'])
function money(n:any){return '₹'+Number(n||0).toLocaleString('en-IN',{maximumFractionDigits:0})}
function Status({value}:{value:string}){return <span className={'p8-status '+value}>{value}</span>}
export default function Portfolio(){
 const [data,setData]=useState<any>({}),[loading,setLoading]=useState(true),[filter,setFilter]=useState('all'),[search,setSearch]=useState(''),[busy,setBusy]=useState<number|null>(null),[error,setError]=useState('')
 const load=async()=>{setLoading(true);setError('');try{const r=await fetch('/api/portfolio',{cache:'no-store'});const j=await r.json();setData(j);if(!j.ok)throw new Error(j.error||'Portfolio failed')}catch(e){setError(e instanceof Error?e.message:String(e))}finally{setLoading(false)}}
 useEffect(()=>{load()},[])
 const products=data.products||[],counts=data.counts||{}
 const visible=useMemo(()=>products.filter((p:any)=>(filter==='all'||p.status===filter)&&(!search||[p.name,p.business_model,p.current_phase].join(' ').toLowerCase().includes(search.toLowerCase()))),[products,filter,search])
 return <main className="p8-shell">
  <header className="p8-top"><div><div className="p8-eyebrow">VENTUREOS / PHASE 8 / PRODUCT PORTFOLIO</div><h1>Product Portfolio</h1><p>One lifecycle view for every product born from VentureOS — from raw idea to live revenue and, when necessary, the graveyard.</p></div><div className="p8-actions"><button className="p8-btn" onClick={load} disabled={loading}><RefreshCw size={14} className={loading?'spin':''}/> Refresh</button><a className="p8-primary" href="/factory"><Factory size={14}/> Product Factory <ArrowRight size={13}/></a></div></header>
  {error&&<div className="p8-banner"><Zap size={15}/><div><b>Portfolio could not load</b><span>{error}</span></div></div>}
  {!data.configured&&<div className="p8-banner"><Zap size={15}/><div><b>Portfolio is in configuration mode</b><span>{data.message||'Connect server-side Supabase credentials to load lifecycle data.'}</span></div></div>}
  <section className="p8-kpis">
   <div className="p8-kpi"><span>Total products</span><b>{counts.total||0}</b><small>Across every lifecycle state</small><Box size={15}/></div>
   <div className="p8-kpi"><span>Active products</span><b>{counts.active||0}</b><small>MVP → Live</small><Workflow size={15}/></div>
   <div className="p8-kpi"><span>Customers</span><b>{counts.customers||0}</b><small>Portfolio-wide</small><Users size={15}/></div>
   <div className="p8-kpi"><span>MRR</span><b>{money(counts.revenue)}</b><small>Tracked product revenue</small><CircleDollarSign size={15}/></div>
   <div className="p8-kpi"><span>API cost</span><b>{money(counts.api_cost)}</b><small>Tracked product COGS</small><BarChart3 size={15}/></div>
  </section>
  <section className="p8-lifecycle"><div className="p8-section-head"><div><b>Lifecycle</b><span>State-machine view of the portfolio.</span></div><span>{counts.total||0} products</span></div><div className="p8-state-rail"><button className={filter==='all'?'active':''} onClick={()=>setFilter('all')}><strong>{counts.total||0}</strong><span>All</span></button>{STATES.map(([key,label,Icon])=><button key={key} className={filter===key?'active':''} onClick={()=>setFilter(key)}><Icon size={13}/><strong>{counts[key]||0}</strong><span>{label}</span></button>)}</div></section>
  <section className="p8-toolbar"><div className="p8-search"><input value={search} onChange={(e:any)=>setSearch(e.target.value)} placeholder="Search product, model or phase…"/></div><div className="p8-viewnote">{visible.length} shown</div></section>
  {loading?<div className="p8-panel p8-empty"><Loader2 className="spin" size={22}/><strong>Loading portfolio intelligence…</strong><span>Reading lifecycle state, product metrics and links.</span></div>:
   !visible.length?<div className="p8-panel p8-empty"><Factory size={26}/><strong>{products.length?'No products match this filter':'Portfolio is empty'}</strong><span>{products.length?'Try another lifecycle state or search term.':'Generate the first build-ready product in Product Factory; it will enter the Ideas state automatically.'}</span><a className="p8-primary" href="/factory"><Factory size={13}/> Open Product Factory</a></div>:
   <section className="p8-products">{visible.map((p:any)=><article className="p8-card" key={p.id}><div className="p8-card-top"><div className="p8-product-id">PRODUCT #{String(p.id).padStart(3,'0')}</div><Status value={p.status}/></div><a className="p8-card-title" href={'/portfolio/'+p.id}>{p.name}<ChevronRight size={15}/></a><p className="p8-card-thesis">{p.thesis||p.problem_statement||'No product thesis recorded yet.'}</p><div className="p8-progress"><div><span>{p.current_phase||'Research'}</span><b>{Math.round(p.progress||0)}%</b></div><i><em style={{width:Math.min(100,Math.max(0,Number(p.progress||0)))+'%'}}/></i></div><div className="p8-metrics"><div><span>Customers</span><b>{Number(p.customer_count||0)}</b></div><div><span>MRR</span><b>{money(p.mrr)}</b></div><div><span>API cost</span><b>{money(p.api_cost)}</b></div><div><span>Gross margin</span><b>{money(p.gross_margin)}</b></div></div><div className="p8-links">{p.repository_url?<a href={p.repository_url} target="_blank" rel="noreferrer"><Workflow size={11}/> Repo</a>:<span><Workflow size={11}/> Repo pending</span>}{p.deployment_url?<a href={p.deployment_url} target="_blank" rel="noreferrer"><ExternalLink size={11}/> Deployment</a>:<span><ExternalLink size={11}/> Deployment pending</span>}</div><div className="p8-card-bottom"><span>{p.next_milestone||'Next milestone not set'}</span><a href={'/portfolio/'+p.id}>Open lifecycle <ArrowRight size={11}/></a></div></article>)}</section>}
  <footer className="p8-footer"><span>VentureOS Phase 8 · Product Portfolio</span><span>Lifecycle state machine + metrics + history</span></footer>
 </main>
}
