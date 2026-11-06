import {spawn} from "node:child_process";
import {readdir} from "node:fs/promises";
if (!/_test$/.test(process.env.DB_NAME||"") || !["127.0.0.1","localhost","::1"].includes(process.env.DB_HOST||"127.0.0.1")) throw Error("Integration tests require a disposable local database ending _test");
if (process.env.DB_SOCKET) throw Error("Use the local test TCP connection, not a socket from another environment");
const port="3100",base="http://127.0.0.1:"+port;
const env={...process.env,FEDMOGA_APP_TEST_URL:base,FEDMOGA_RUN_DB_TESTS:"true",ALLOW_LIVE_PAYMENTS:"false"};
// No real SMTP configuration is inherited by the integration application.
const appEnv={...env,FEDMOGA_ENV:"staging",STAGING_EMAIL_SINK:"sink@example.com"};
for(const key of ["SMTP_HOST","SMTP_USER","SMTP_PASSWORD","SMTP_FROM"])delete appEnv[key];
const app=spawn(process.execPath,["node_modules/next/dist/bin/next","start","-p",port,"--hostname","127.0.0.1"],{env:appEnv,stdio:"inherit"});
try{
 let ready=false;
 for(let i=0;i<100;i++){if(app.exitCode!==null)throw Error("Test application stopped");try{const r=await fetch(base+"/api/health");if(r.ok){ready=true;break;}}catch{}await new Promise(r=>setTimeout(r,200));}
 if(!ready)throw Error("Test application did not become ready");
 const files=(await readdir("tests")).filter(f=>f.endsWith(".test.ts")).sort().map(f=>"tests/"+f);
 // Tests use explicit SMTP mocks. Remove inherited real credentials here as well.
 for(const key of ["SMTP_HOST","SMTP_USER","SMTP_PASSWORD","SMTP_FROM"])delete env[key];
 delete env.FEDMOGA_ENV;delete env.STAGING_EMAIL_SINK;
 const child=spawn(process.execPath,["--import","tsx","--test","--test-concurrency=1",...files],{env,stdio:"inherit"});
 process.exitCode=await new Promise((resolve,reject)=>{child.on("error",reject);child.on("exit",code=>resolve(code??1));});
}finally{app.kill("SIGTERM");}
