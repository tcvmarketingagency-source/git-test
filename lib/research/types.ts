export type ProviderName = 'tavily' | 'firecrawl' | 'exa'
export type ResearchMode = 'normal' | 'deep' | 'max'
export type ResearchRequest = { query:string; maxResults?:number; mode?:ResearchMode }
export type ResearchSource = {
  provider:ProviderName; url:string; title?:string; snippet?:string; content?:string
  publishedAt?:string|null; score?:number|null; raw?:unknown
}
export type ResearchRun = {
  id:string; query:string; mode:ResearchMode; startedAt:string; completedAt:string
  status:'completed'|'partial'|'failed'; providers:ProviderName[]; sources:ResearchSource[]; error?:string
}
export type ProviderHealth = {
  provider:ProviderName; configured:boolean; status:'ready'|'missing_key'
}

