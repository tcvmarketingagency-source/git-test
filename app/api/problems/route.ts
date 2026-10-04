import {NextResponse} from 'next/server'
import {clusterSignals,problemClusters,recentSignals} from '../../../lib/signals/storage'
export const runtime='nodejs';export const dynamic='force-dynamic'
function configured(){return !!(process.env.NEXT_PUBLIC_SUPABASE_URL&&(process.env.SUPABASE_SECRET_KEY||process.env.SUPABASE_SERVICE_ROLE_KEY))}
export async function GET(req:Request){
 if(!configured())return NextResponse.json({ok:true,configured:false,clusters:[],signals:[],message:'Supabase server credentials are not configured.'})
 try{const url=new URL(req.url),clusterId=url.searchParams.get('cluster'),clusters=await problemClusters(Number(url.searchParams.get('limit')||100));if(clusterId){const signals=await clusterSignals(Number(clusterId),60);return NextResponse.json({ok:true,configured:true,clusters,signals})};const signals=await recentSignals(1000);return NextResponse.json({ok:true,configured:true,clusters,signals,generatedAt:new Date().toISOString()})}
 catch(e){return NextResponse.json({ok:false,error:e instanceof Error?e.message:'Problem Atlas failed'},{status:500})}
}