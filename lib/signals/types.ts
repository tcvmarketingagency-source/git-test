export type SignalRecord={
  id:number
  sourceRunId:string|null; sourceUrl:string; canonicalUrl:string; contentHash:string
  title:string; normalizedText:string; signalType:string; industry:string|null; audience:string|null
  entityName:string|null; entityDomain:string|null; painIntensity:number; demandScore:number; urgencyScore:number
  classificationConfidence:number; momentumScore:number; occurrenceCount:number; firstSeenAt:string; lastSeenAt:string
  metadata:Record<string,unknown>
}
export type ProblemCluster={
  id:number; clusterKey:string; name:string; description:string; signalCount:number; evidenceCount:number
  momentumScore:number; painScore:number; demandScore:number; confidence:number; industries:string[]; audiences:string[]
  status:string; firstDetectedAt:string; lastUpdatedAt:string
}