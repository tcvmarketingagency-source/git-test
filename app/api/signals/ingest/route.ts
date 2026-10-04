import {NextResponse} from 'next/server'
import {ingestSignals} from '../../../../lib/signals/processor'
export const runtime='nodejs';export const maxDuration=60
export async function POST(req:Request){
 try{const body=await req.json().catch(()=>({}));const result=await ingestSignals({limit:Number(body.limit||100),sourceRunId:body.sourceRunId});return NextResponse.json({ok:true,phase:3,result})}
 catch(e){return NextResponse.json({ok:false,error:e instanceof Error?e.message:'Signal ingestion failed'},{status:500})}
}
