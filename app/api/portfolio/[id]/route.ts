
import {NextResponse} from 'next/server'
import {portfolioDetail} from '../../../../lib/portfolio/engine'
import {configured} from '../../../../lib/portfolio/storage'
export const runtime='nodejs';export const dynamic='force-dynamic'
export async function GET(_req:Request,{params}:{params:Promise<{id:string}>}){if(!configured())return NextResponse.json({ok:true,configured:false,product:null,history:[],metrics:[]});try{const {id}=await params;const result=await portfolioDetail(Number(id));if(!result)return NextResponse.json({ok:false,error:'Product not found'},{status:404});return NextResponse.json({ok:true,...result})}catch(e){return NextResponse.json({ok:false,error:e instanceof Error?e.message:'Portfolio detail failed'},{status:500})}}
