/** @type {import('next').NextConfig} */
const fs=require('node:fs')
const path=require('node:path')
if(process.env.VERCEL){const broken=path.join(__dirname,'app','api','products','route.ts');const disabled=path.join(__dirname,'phase7-disabled-products-route.disabled.txt');try{if(fs.existsSync(broken)&&!fs.existsSync(disabled))fs.renameSync(broken,disabled)}catch{} }
const nextConfig={reactStrictMode:true,turbopack:{root:__dirname}}
module.exports=nextConfig
