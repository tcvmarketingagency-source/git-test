import {NextResponse} from 'next/server'
import {configured} from '../../../../lib/execution/storage'
import {runNextStep} from '../../../../lib/execution/engine'
export const runtime='nodejs';export const dynamic='force-dynamic'
export async function POST(req:Request){if(!configured())return NextResponse.json({ok:true,configured:false,message:'Server data connection is not configured.'});try{const body=await req.json();if(!body.run_key)return NextResponse.json({ok:false,error:'run_key is required'},{status:400});return NextResponse.json({ok:true,configured:true,...await runNextStep(String(body.run_key),body.step_key?String(body.step_key):undefined)})}catch(e){return NextResponse.json({ok:false,error:e instanceof Error?e.message:'Execution step failed'},{status:409})}}