import crypto from 'node:crypto'
import type {ResearchSource} from '../research/types'
import type {SignalRecord} from './types'

const painPatterns:[RegExp,string,number][]= [
 [/\b(manual|spreadsheet|excel|copy[- ]paste)\b/i,'Manual workflow',86],
 [/\b(reporting|reports|dashboarding)\b/i,'Reporting',78],
 [/\b(follow[- ]?up|followup|reminder|chasing)\b/i,'Follow-up',84],
 [/\b(lead|prospect|pipeline|sales outreach)\b/i,'Lead operations',82],
 [/\b(support|ticket|customer service)\b/i,'Customer support',76],
 [/\b(integration|integrate|sync|data silos?)\b/i,'Integration friction',74],
 [/\b(compliance|audit|regulation)\b/i,'Compliance work',81],
 [/\b(pricing|cost|expense|spend)\b/i,'Cost pressure',72],
 [/\b(hiring|recruit|talent|staffing)\b/i,'Hiring friction',71],
 [/\b(workflow|process|operations?)\b/i,'Operational friction',70]
]
const industryPatterns:[RegExp,string][]= [
 [/\b(ai|artificial intelligence|machine learning|llm|agentic)\b/i,'AI'],
 [/\b(saas|software|devtool|developer)\b/i,'SaaS'],
 [/\b(health|clinic|hospital|medical)\b/i,'Healthcare'],
 [/\b(fintech|bank|finance|payment)\b/i,'Finance'],
 [/\b(ecommerce|e-commerce|retail|shopify)\b/i,'E-commerce'],
 [/\b(education|school|university|student)\b/i,'Education'],
 [/\b(marketing|agency|advertising|seo)\b/i,'Marketing']
]
const audiencePatterns:[RegExp,string][]= [
 [/\b(smb|small business|small businesses|startup|founder)\b/i,'SMB / Startup'],
 [/\b(enterprise|large company|corporate)\b/i,'Enterprise'],
 [/\b(agency|agencies)\b/i,'Agency'],
 [/\b(developer|engineering|technical team)\b/i,'Technical teams'],
 [/\b(sales|revenue|account executive)\b/i,'Sales teams']
]
function canonicalUrl(url:string){try{const u=new URL(url);u.hash='';['utm_source','utm_medium','utm_campaign','utm_term','utm_content','ref'].forEach(k=>u.searchParams.delete(k));u.pathname=u.pathname.replace(/\/+$/,'')||'/';return u.toString().toLowerCase()}catch{return url.trim().replace(/\/+$/,'').toLowerCase()}}
function normalizeText(title:string,snippet:string,content?:string){return (title+' '+snippet+' '+(content||'')).replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim().slice(0,12000)}
function hash(v:string){return crypto.createHash('sha256').update(v).digest('hex')}
function domain(url:string){try{return new URL(url).hostname.replace(/^www\./,'').toLowerCase()}catch{return null}}
function firstMatch<T>(pairs:[RegExp,T][],text:string){for(const [re,val] of pairs)if(re.test(text))return val;return null}
function classify(text:string){
 let pain='Operational friction', painIntensity=60
 for(const [re,label,score] of painPatterns){if(re.test(text)){pain=label;painIntensity=score;break}}
 const industry=firstMatch(industryPatterns,text), audience=firstMatch(audiencePatterns,text)
 const signalType=/\b(funding|acquisition|pricing|launch|shutdown|hiring|regulation|policy|market shift|trend)\b/i.test(text)?'market_change':'problem_signal'
 const demand=Math.min(99,Math.round(painIntensity*0.72+(audience?12:0)+(industry?8:0)))
 const urgency=Math.min(99,Math.round(painIntensity*0.68+(signalType==='market_change'?14:0)))
 const confidence=Math.min(99,Math.round((painIntensity+demand+urgency)/3))
 return {pain,painIntensity,industry,audience,signalType,demand,urgency,confidence}
}
export function normalizeSource(source:ResearchSource,sourceRunId?:string){
 const canonical=canonicalUrl(source.url), text=normalizeText(source.title||'',source.snippet||'',source.content), c=classify(text)
 return {sourceRunId:sourceRunId||null,sourceUrl:source.url,canonicalUrl:canonical,contentHash:hash(canonical+'|'+text.toLowerCase().slice(0,5000)),
  title:(source.title||canonical).trim().slice(0,500),normalizedText:text,signalType:c.signalType,industry:c.industry,audience:c.audience,
  entityName:domain(canonical),entityDomain:domain(canonical),painIntensity:c.painIntensity,demandScore:c.demand,urgencyScore:c.urgency,
  classificationConfidence:c.confidence,metadata:{provider:source.provider,publishedAt:source.publishedAt||null,sourceScore:source.score||null,painTag:c.pain}
 }
}
export function clusterKey(signal:Pick<SignalRecord,'signalType'|'industry'|'metadata'>){return (signal.signalType+'|'+(signal.industry||'General')+'|'+String(signal.metadata?.painTag||'Operational friction')).toLowerCase()}
export function clusterName(signal:Pick<SignalRecord,'metadata'|'industry'|'audience'>){return String(signal.metadata?.painTag||'Operational friction')+(signal.industry?' in '+signal.industry:'')}
export function clusterDescription(signal:Pick<SignalRecord,'metadata'|'industry'|'audience'>){return 'Recurring '+String(signal.metadata?.painTag||'operational friction').toLowerCase()+' signals'+(signal.audience?' affecting '+signal.audience.toLowerCase():'')+(signal.industry?' across '+signal.industry.toLowerCase():'')+'.'}
export function momentum(current:number,previous:number){if(previous===0)return current>0?100:0;return Math.max(-100,Math.min(100,Math.round(((current-previous)/previous)*100)))}