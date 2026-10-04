import crypto from 'node:crypto'
function clamp(n:number){return Math.max(0,Math.min(100,Math.round(n)))}
function hash(v:string){return crypto.createHash('sha256').update(v).digest('hex').slice(0,16)}
function titleFor(cluster:any){const industry=cluster.industries?.[0]||'';const audience=cluster.audiences?.[0]||'teams';const base=cluster.name||'Emerging workflow problem';if(industry)return industry+' '+base+' for '+audience;return base+' for '+audience}
function text(v:any){return String(v||'').toLowerCase()}
function containsAny(v:string,terms:string[]){return terms.some(t=>v.includes(t))}
export function buildOpportunity(cluster:any,members:any[],events:any[],competitors:any[],evidence:any[],founderFit:number|null){
 const ids=new Set(members.map(m=>Number(m.signal_id))), memberEvidence=evidence.filter(e=>ids.has(Number(e.signal_id))), signalCount=Number(cluster.signal_count||members.length||0), sourceCount=new Set(memberEvidence.map(e=>e.source_domain)).size||Number(cluster.evidence_count||0)
 const demand=clamp(Number(cluster.demand_score||0)),pain=clamp(Number(cluster.pain_score||0)),momentumRaw=Number(cluster.momentum_score||0),momentum=clamp((momentumRaw+100)/2)
 const industry=cluster.industries?.[0]||null,audience=cluster.audiences?.[0]||null,evText=memberEvidence.map(e=>text((e.claim_text||'')+' '+(e.snippet||''))).join(' '),
 monetization=clamp(45+(containsAny(evText,['pricing','price','plan','cost','revenue','paid','customer','contract','budget','spend'])?25:0)+(audience?10:0)+(industry?8:0)),
 competitionPressure=clamp(Math.min(100,competitors.length*7+competitors.filter(c=>Number(c.change_score||0)>0).length*4)), competition=clamp(100-competitionPressure),
 distribution=clamp(48+(audience?18:0)+(industry?10:0)+(containsAny(evText,['sales','distribution','channel','partner','agency','self-serve','marketplace'])?18:0)),
 buildComplexity=clamp(62-(containsAny(evText,['manual','spreadsheet','workflow','automation','api','integration'])?18:0)-(containsAny(evText,['regulated','hardware','infrastructure','capital intensive'])?22:0)),
 evidenceQuality=clamp(memberEvidence.length?memberEvidence.reduce((a,e)=>a+Number(e.evidence_score||0),0)/memberEvidence.length:0),
 whyNow=events.filter(e=>(!industry||e.industries?.includes(industry))&&Number(e.momentum_score||0)>0).slice(0,3),whyNowText=whyNow.length?whyNow.map(e=>e.title+' ('+e.source_count+' sources)').join('; '):'Current momentum and recent supporting evidence indicate this problem deserves validation now.',
 marketGap=competition<55?'Competitive pressure is already visible; differentiation should focus on a narrow workflow and underserved audience.':'Evidence suggests room for a focused solution where existing tools leave workflow or audience gaps.',
 businessModel=monetization>=70?'SaaS subscription / usage-based automation':'B2B SaaS with paid workflow automation',
 availableScores=[demand,pain,momentum,monetization,competition,distribution,buildComplexity,evidenceQuality].filter(Number.isFinite),overall=clamp(availableScores.reduce((a,b)=>a+b,0)/(availableScores.length||1)),confidence=clamp((evidenceQuality*.55+clamp(signalCount/5)*25+clamp(sourceCount/10)*20))
 return {opportunity_key:'opp_'+hash(String(cluster.id)+'|'+String(titleFor(cluster))),title:titleFor(cluster),problem_cluster_id:cluster.id,summary:'An opportunity built around '+String(cluster.name||'a recurring problem').toLowerCase()+'.',target_audience:audience,industry,why_now:whyNowText,market_gap:marketGap,business_model:demand>=70&&pain>=70?businessModel:'Needs pricing validation',demand_score:demand,pain_score:pain,momentum_score:momentum,monetization_score:monetization,competition_score:competition,distribution_fit_score:distribution,founder_fit_score:founderFit,build_complexity_score:buildComplexity,evidence_quality_score:evidenceQuality,overall_score:overall,confidence,evidence_count:memberEvidence.length,source_count:sourceCount,radar_x:monetization,radar_y:demand,status:founderFit==null?'needs_founder_fit':overall>=75?'priority':'candidate',metadata:{source_signal_count:signalCount,market_events:whyNow.length,competitive_pressure:competitionPressure,founder_fit_configured:founderFit!==null}}
}
export function founderFitFromEnv(){const raw=process.env.VENTUREOS_FOUNDER_FIT_SCORE;if(!raw)return null;const n=Number(raw);return Number.isFinite(n)?clamp(n):null}
export function scoreRationales(o:any){return [
 {dimension:'demand',score:o.demand_score,rationale:'Derived from the problem cluster demand score and supporting signal volume.'},
 {dimension:'pain',score:o.pain_score,rationale:'Derived from normalized pain intensity across the problem cluster.'},
 {dimension:'momentum',score:o.momentum_score,rationale:'Normalized 0–100 representation of current cluster momentum.'},
 {dimension:'monetization',score:o.monetization_score,rationale:'Heuristic from pricing, customer, revenue and spend evidence.'},
 {dimension:'competition',score:o.competition_score,rationale:'Higher score means lower observed competitive pressure in the available market snapshot.'},
 {dimension:'distribution_fit',score:o.distribution_fit_score,rationale:'Estimated from audience, industry and distribution signals in the evidence set.'},
 {dimension:'build_complexity',score:o.build_complexity_score,rationale:'Higher score means lower estimated build complexity from workflow and implementation signals.'},
 {dimension:'evidence_quality',score:o.evidence_quality_score,rationale:'Average ranked evidence quality supporting the opportunity.'},
 {dimension:'founder_fit',score:o.founder_fit_score??0,rationale:o.founder_fit_score==null?'Founder fit is intentionally unscored until Founder Memory is configured in Phase 6.':'Configured founder-fit score.'}
]}