import {NextResponse} from 'next/server'
import {account,configured,setBudget} from '../../../../lib/cost/storage'
export const runtime='nodejs';export const dynamic='force-dynamic'
export async function GET(){if(!configured())return NextResponse.json({ok:true,configured:false,message:'Server data connection is not configured.'});return NextResponse.json({ok:true,configured:true,account:await account()})}
export async function POST(req:Request){if(!configured())return NextResponse.json({ok:true,configured:false,message:'Server data connection is not configured.'});try{return NextResponse.json({ok:true,configured:true,account:await setBudget(await req.json())})}catch(e){return NextResponse.json({ok:false,error:e instanceof Error?e.message:'Budget update failed'},{status:400})}}