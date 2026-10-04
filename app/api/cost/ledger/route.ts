import {NextResponse} from 'next/server'
import {configured,transactions,usage} from '../../../../lib/cost/storage'
export const runtime='nodejs';export const dynamic='force-dynamic'
export async function GET(){if(!configured())return NextResponse.json({ok:true,configured:false,transactions:[],usage:[],message:'Server data connection is not configured.'});try{return NextResponse.json({ok:true,configured:true,transactions:await transactions(250),usage:await usage(500)})}catch(e){return NextResponse.json({ok:false,error:e instanceof Error?e.message:'Ledger read failed'},{status:500})}}