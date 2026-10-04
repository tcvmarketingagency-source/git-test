import {NextResponse} from 'next/server'
import {processMarketIntelligence} from '../../../../lib/market/processor'
export const runtime='nodejs';export const maxDuration=60
export async function POST(req:Request){try{const body=await req.json().catch(()=>({}));const result=await processMarketIntelligence(Number(body.limit||1000));return NextResponse.json({ok:true,phase:4,result})}catch(e){return NextResponse.json({ok:false,error:e instanceof Error?e.message:'Market processing failed'},{status:500})}}