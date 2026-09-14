const {spawn}=require('node:child_process');
const env={...process.env,NEXT_PUBLIC_SUPABASE_URL:'https://dna-test.supabase.co',NEXT_PUBLIC_SUPABASE_ANON_KEY:'test-publishable-key',NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:'test-publishable-key',TEST_ORIGIN:'http://127.0.0.1:3001'};
const server=spawn(process.execPath,['node_modules/next/dist/bin/next','dev','--hostname','127.0.0.1','--port','3001'],{env});server.stderr.pipe(process.stderr);let started=false;
server.stdout.on('data',d=>{if(d.toString().includes('Ready')&&!started){started=true;const test=spawn(process.execPath,['tests/flow.cjs'],{env,stdio:'inherit'});test.on('exit',code=>{server.kill('SIGTERM');process.exitCode=code;});}});
setTimeout(()=>{if(!started){server.kill();process.exitCode=1;console.error('Server did not start')}},15000).unref();
