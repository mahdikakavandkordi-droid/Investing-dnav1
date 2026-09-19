import {NextResponse} from 'next/server';

export const dynamic='force-dynamic';

export function GET(){
 return NextResponse.json({
  git_commit_sha:process.env.VERCEL_GIT_COMMIT_SHA||process.env.GITHUB_SHA||null,
  git_commit_ref:process.env.VERCEL_GIT_COMMIT_REF||process.env.GITHUB_REF_NAME||null
 },{headers:{'Cache-Control':'no-store, max-age=0'}});
}
