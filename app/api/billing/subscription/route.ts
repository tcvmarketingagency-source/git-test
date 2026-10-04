import {NextResponse} from 'next/server'
import {configured,subscription} from '../../../../lib/cost/storage'
export const runtime='nodejs';export const dynamic='force-dynamic'
export async function GET(){if(!configured())return NextResponse.json({ok:true,configured:false,message:'Server data connection is not configured.'});const provider=process.env.RAZORPAY_KEY_ID?'razorpay':process.env.STRIPE_SECRET_KEY?'stripe':null;return NextResponse.json({ok:true,configured:true,payment_provider:provider,subscription:await subscription(),gateway_ready:Boolean(provider)})}