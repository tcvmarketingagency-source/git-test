import type { ResearchRun } from './types'
import { ventureosRequest, ventureosConfigured } from '@/lib/tenant/rest'

export async function persistResearch(run: ResearchRun) {
  if (!ventureosConfigured()) return { persisted: false }
  await ventureosRequest('ventureos_research_runs', {
    method: 'POST',
    headers: { Prefer: 'return=minimal' },
    body: JSON.stringify({
      run_id: run.id, query: run.query, mode: run.mode, status: run.status,
      started_at: run.startedAt, completed_at: run.completedAt,
      providers: run.providers, error: run.error ?? null
    })
  })
  if (run.sources.length) {
    await ventureosRequest('ventureos_research_sources', {
      method: 'POST',
      headers: { Prefer: 'return=minimal' },
      body: JSON.stringify(run.sources.map((s) => ({
        run_id: run.id, provider: s.provider, url: s.url, title: s.title ?? null,
        snippet: s.snippet ?? null, content: s.content ?? null,
        published_at: s.publishedAt ?? null, score: s.score ?? null, raw_json: s.raw ?? null
      })))
    })
  }
  return { persisted: true }
}

export async function recentRuns(limit = 20) {
  if (!ventureosConfigured()) return []
  return ventureosRequest('ventureos_research_runs?select=*&order=started_at.desc&limit=' + Math.min(limit, 50))
}
