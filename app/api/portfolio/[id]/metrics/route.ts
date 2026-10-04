import {NextResponse} from 'next/server'
import {recordProductMetric} from '../../../../../lib/portfolio/engine'
import {configured} from '../../../../../lib/portfolio/storage'
export const runtime='nodejs';export const dynamic='force-dynamic'
export async function POST(req:Request,{params}:{params:Promise<{id:string}>}){if(!configured())return NextResponse.json({ok:true,configured:false,message:'Server data connection is not configured.'});try{const {id}=await params;const metric=await recordProductMetric(Number(id),await req.json());return NextResponse.json({ok:true,metric})}catch(e){return NextResponse.json({ok:false,error:e instanceof Error?e.message:'Metric write failed'},{status:400})}}