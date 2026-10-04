
import {NextResponse} from 'next/server'
import {configured} from '../../../lib/execution/storage'
import {executionOverview} from '../../../lib/execution/engine'
export const runtime='nodejs';export const dynamic='force-dynamic'
export async function GET(req:Request){if(!configured())return NextResponse.json({ok:true,configured:false,product:null,run:null,steps:[],artifacts:[],providers:[]});const id=Number(new URL(req.url).searchParams.get('product_id'));if(!Number.isFinite(id))return NextResponse.json({ok:false,error:'product_id is required'},{status:400});try{return NextResponse.json({ok:true,configured:true,...await executionOverview(id)})}catch(e){const message=e instanceof Error?e.message:'Execution overview failed';const status=message==='Product not found'?404:500;return NextResponse.json({ok:false,error:message},{status})}}