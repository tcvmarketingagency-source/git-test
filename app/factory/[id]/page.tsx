'use client'
import {useEffect,useMemo,useState} from 'react'
import {ArrowLeft,CheckCircle2,ChevronDown,ChevronRight,Code2,Database,ExternalLink,FileText,Layers3,Loader2,Network,Sparkles,Target,Workflow} from 'lucide-react'

const labels:any={prd:'PRD',feature_map:'Feature Map',ux_map:'UX Map',architecture:'Architecture',schema:'Database Schema',api_spec:'API Specification',mvp_plan:'MVP Plan',analytics_plan:'Analytics Plan',economics:'Economics & Pricing',validation_plan:'Validation Plan',pricing_hypothesis:'Pricing Hypothesis'}
function Block({value}:any):any{
 if(value===null||value===undefined)return <span className="p7-json-null">—</span>
 if(typeof value!=='object')return <span className="p7-json-value">{String(value)}</span>
 if(Array.isArray(value))return <div className="p7-json-array">{value.map((v:any,i:number)=><div className="p7-json-row" key={i}><span className="p7-json-index">{i+1}</span><Block value={v}/></div>)}</div>
 return <div className="p7-json-object">{Object.entries(value).map(([k,v])=><div className="p7-json-field" key={k}><span className="p7-json-key">{k.replace(/_/g,' ')}</span><Block value={v}/></div>)}</div>
}
function Status({value}:{value:string}){return <span className={'p7-status '+(value||'ideas')}>{String(value||'ideas').replace(/_/g,' ')}</span>}
export default function ProductDetail({params}:{params:Promise<{id:string}>}){
 const [id,setId]=useState(''),[data,setData]=useState<any>(null),[busy,setBusy]=useState(true),[tab,setTab]=useState('prd'),[open,setOpen]=useState<any>(null),[error,setError]=useState('')
 useEffect(()=>{params.then((x)=>setId(x.id))},[params])
 const load=async()=>{if(!id)return;setBusy(true);setError('');try{const r=await fetch('/api/products?id='+id,{cache:'no-store'});const j=await r.json();if(!j.ok)throw new Error(j.error||'Unable to load product');setData(j)}catch(e){setError(e instanceof Error?e.message:String(e))}finally{setBusy(false)}}
 useEffect(()=>{load()},[id])
 const artifact=data?.artifacts?.find((a:any)=>a.artifact_type===tab)||data?.artifacts?.[0]
 const features=data?.features||[],p=data?.product
 const artifacts=data?.artifacts||[]
 const mvp=p?.mvp_plan?.milestones||[]
 const ready=Math.min(100,Math.round((features.filter((f:any)=>f.phase==='MVP').length?features.filter((f:any)=>f.status==='done').length/features.filter((f:any)=>f.phase==='MVP').length:0)*100))
 if(busy)return <main className="phase7-shell"><div className="p7-panel p7-empty large"><Loader2 size={24} className="spin"/><b>Loading product specification…</b><span>Retrieving Product Architect artifacts and feature backlog.</span></div></main>
 if(error||!p)return <main className="phase7-shell"><div className="p7-alert"><div><b>Product could not be loaded</b><span>{error||'Product not found.'}</span></div></div></main>
 return <main className="phase7-shell">
  <div className="p7-detail-nav"><button className="p7-btn" onClick={()=>window.location.href='/factory'}><ArrowLeft size={13}/> Product Factory</button><span className="p7-detail-id">PRODUCT #{String(p.id).padStart(3,'0')}</span><Status value={p.status}/><button className="p7-btn" onClick={load}><Loader2 size={12} className={busy?'spin':''}/> Refresh</button></div>
  <section className="p7-detail-hero"><div><div className="eyebrow">PRODUCT ARCHITECT / BUILD-READY SPEC</div><h1>{p.name}</h1><p>{p.thesis}</p><div className="p7-detail-tags"><span>{p.target_customer}</span><span>{p.business_model}</span><span>{p.pricing_hypothesis}</span>{p.metadata?.opportunity_title&&<span>Origin: {p.metadata.opportunity_title}</span>}</div></div><div className="p7-build-state"><small>PRODUCT FACTORY OUTPUT</small><b>{artifacts.length}</b><span>structured artifacts</span></div></section>

  <section className="p7-overview-grid">
   <div className="p7-panel"><div className="p7-head"><div><b>Product thesis</b><span>Opportunity carried into a focused, buildable product hypothesis.</span></div><Target size={15}/></div><div className="p7-thesis-grid"><article><label>PROBLEM</label><p>{p.problem_statement}</p></article><article><label>TARGET CUSTOMER</label><p>{p.target_customer}</p></article><article><label>POSITIONING</label><p>{p.positioning}</p></article><article><label>PRICING HYPOTHESIS</label><p>{p.pricing_hypothesis}</p></article></div></div>
   <div className="p7-panel"><div className="p7-head"><div><b>MVP readiness</b><span>Feature completion against the current generated MVP surface.</span></div><Sparkles size={15}/></div><div className="p7-build-state" style={{border:0,padding:'15px 17px'}}><small>READINESS</small><b>{ready}%</b><i style={{display:'block',height:5,borderRadius:99,background:'#171c23',overflow:'hidden'}}><em style={{display:'block',height:'100%',width:ready+'%',background:'linear-gradient(90deg,#5de1ff,#a0f0d0)'}}/></i><span style={{marginTop:8}}>{features.length} features generated · {mvp.length} milestones</span></div></div>
  </section>

  <section className="p7-detail-layout">
   <aside className="p7-artifacts-panel"><div className="p7-head"><div><b>Build artifacts</b><span>{artifacts.length} structured deliverables</span></div><FileText size={15}/></div><div className="p7-artifact-tabs">{artifacts.map((a:any)=><button key={a.artifact_type} className={a.artifact_type===tab?'active':''} onClick={()=>setTab(a.artifact_type)}><span>{labels[a.artifact_type]||a.title}</span><ChevronRight size={11}/></button>)}</div></aside>
   <div className="p7-artifact-main">
    <div className="p7-panel"><div className="p7-head"><div><b>{labels[artifact?.artifact_type]||artifact?.title||'Artifact'}</b><span>Generated by Product Architect · version {artifact?.version||1}</span></div><Layers3 size={15}/></div><div className="p7-artifact-content">{artifact?<Block value={artifact.content}/>:<div className="p7-empty small"><span>No artifact content available.</span></div>}</div></div>
    <div className="p7-panel"><div className="p7-head"><div><b>Feature backlog</b><span>Priority-ranked implementation surface with acceptance criteria.</span></div><Code2 size={15}/></div><div className="p7-features">{features.map((f:any)=><button key={f.id} onClick={()=>setOpen(open===f.id?null:f.id)} className={'p7-feature '+(open===f.id?'open':'')}><div className="p7-feature-top"><span>{f.priority}</span><b>{f.title}</b><small>{f.phase}</small><ChevronDown size={13}/></div>{open===f.id&&<div className="p7-feature-body"><p>{f.description}</p><div><label>Dependencies</label><span>{(f.dependencies||[]).length?f.dependencies.join(' · '):'None'}</span></div><div><label>Acceptance criteria</label><ul>{(f.acceptance_criteria||[]).map((x:string,i:number)=><li key={i}>{x}</li>)}</ul></div></div>}</button>)}</div></div>
   </div>
  </section>

  <section className="p7-bottom-grid">
   <div className="p7-panel"><div className="p7-head"><div><b>Architecture snapshot</b><span>System boundary before execution begins.</span></div><Network size={15}/></div><div className="p7-mini-cards">{Object.entries(p.architecture||{}).map(([k,v]:any)=><div key={k}><span>{k.replace(/_/g,' ')}</span><b>{Array.isArray(v)?v.join(' · '):String(v)}</b></div>)}</div></div>
   <div className="p7-panel"><div className="p7-head"><div><b>Traceability</b><span>Factory output stays tied to the originating opportunity.</span></div><Database size={15}/></div><div className="p7-trace"><div><span>Origin opportunity</span><b>{p.metadata?.opportunity_title||'Linked opportunity'}</b></div><div><span>Opportunity score</span><b>{p.metadata?.opportunity_score??'—'}</b></div><div><span>Created</span><b>{new Date(p.created_at).toLocaleString()}</b></div><div><span>Product Factory status</span><b>{p.status}</b></div><a href={p.opportunity_id?'/opportunities/'+p.opportunity_id:'#'}><Workflow size={11}/> Open source opportunity <ChevronRight size={11}/></a></div></div>
  </section>
  <footer style={{display:'flex',justifyContent:'space-between',gap:12,marginTop:14,color:'#535e69',fontSize:7}}><span>VentureOS Phase 7 · Product Factory</span><span>Evidence-first · structured · auditable</span></footer>
 </main>
}
