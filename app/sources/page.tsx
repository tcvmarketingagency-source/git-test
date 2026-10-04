'use client'
import {useEffect,useState} from 'react'
import {AlertTriangle,CheckCircle2,Clock3,Database,Gauge,RefreshCw,Server} from 'lucide-react'
type Provider={provider:string;configured:boolean;status:string}
type Run={run_id:string;query:string;mode:string;status:string;started_at:string;providers:string[];error:string|null}
export default function Sources(){
 const [providers,setProviders]=useState<Provider[]>([]),[runs,setRuns]=useState<Run[]>([]),[loading,setLoading]=useState(true)
 const load=async()=>{setLoading(true);try{const r=await fetch('/api/sources',{cache:'no-store'}),j=await r.json();setProviders(j.providers||[]);setRuns(j.runs||[])}finally{setLoading(false)}}
 useEffect(()=>{load()},[])
 return <div className="phase2-shell"><div className="phase2-top"><div><div className="eyebrow">VENTUREOS / PHASE 2</div><h1>Sources & provider health</h1><p>Research ingestion control plane for Tavily, Firecrawl and Exa.</p></div><button onClick={load} disabled={loading} className="p2-btn"><RefreshCw size={14} className={loading?'spin':''}/> Refresh</button></div>
 <div className="p2-source-grid">{providers.map(p=><div className="p2-card" key={p.provider}><div className="p2-card-top"><b>{p.provider}</b><span className={p.configured?'p2-ready':'p2-missing'}>{p.configured?<CheckCircle2 size={12}/>:<AlertTriangle size={12}/>} {p.configured?'READY':'KEY NEEDED'}</span></div><p>{p.provider==='tavily'?'Discovery and current-web search signals.':p.provider==='firecrawl'?'Extraction and scrape layer.':'Semantic and deep research layer.'}</p><div className="p2-row"><span><Server size={12}/> Adapter</span><b>Server-side</b></div><div className="p2-row"><span><Gauge size={12}/> Status</span><b>{p.status}</b></div></div>)}</div>
 <div className="p2-card p2-history"><div className="p2-history-head"><div><b>Research job history</b><span>Persisted runs from Supabase appear here.</span></div><Database size={16}/></div>{runs.length?runs.map(r=><div className="p2-job" key={r.run_id}><div><b>{r.query}</b><span><Clock3 size={10}/> {new Date(r.started_at).toLocaleString()}</span></div><em className={'p2-status '+r.status}>{r.status}</em><span>{r.providers.join(' · ')||'—'}</span></div>):<div className="p2-empty"><Database size={20}/><b>No persisted research runs yet</b><span>Set the Supabase service key and run the first research job.</span></div>}</div>
 </div>
}