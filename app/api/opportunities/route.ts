import {NextResponse} from 'next/server'
import {opportunities,opportunityById,opportunityEvidence,opportunityScores,runHistory} from '../../../lib/opportunities/storage'
export const runtime='nodejs';export const dynamic='force-dynamic'
const configured=()=>!!(process.env.NEXT_PUBLIC_SUPABASE_URL&&(process.env.SUPABASE_SECRET_KEY||process.env.SUPABASE_SERVICE_ROLE_KEY))
export async function GET(req:Request){
 if(!configured())return NextResponse.json({ok:true,configured:false,opportunities:[],message:'Supabase server credentials are not configured.'})
 try{const u=new URL(req.url),id=u.searchParams.get('id');if(id){const opportunity=await opportunityById(Number(id));if(!opportunity)return NextResponse.json({ok:false,error:'Opportunity not found'},{status:404});return NextResponse.json({ok:true,configured:true,opportunity,scores:await opportunityScores(Number(id)),evidence:await opportunityEvidence(Number(id))})}
 return NextResponse.json({ok:true,configured:true,opportunities:await opportunities(Number(u.searchParams.get('limit')||100)),runs:await runHistory(10),generatedAt:new Date().toISOString()})}
 catch(e){return NextResponse.json({ok:false,error:e instanceof Error?e.message:'Opportunity Radar failed'},{status:500})}
}