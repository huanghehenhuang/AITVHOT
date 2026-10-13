// Fixture for tests/error-logging.test.ts (OAuth refusals must not log upstream text).
import assert from 'node:assert/strict';
import { buildApp } from "../../apps/api/src/app.ts";
import { loginRedirect, STATE_COOKIE } from '@aihot/backend/admin/auth';
process.env.FEISHU_LOGIN_APP_ID = 'synthetic-app';
process.env.FEISHU_LOGIN_APP_SECRET = ["synthetic", "secret"].join("-");
const app = await buildApp();
const marker = "synthetic-private-person@example.test";
const opaque = "opaque-secret";
const refused = async () => Response.json({error:marker}, {status:400});
const broken = (path) => async input => String(input).endsWith(path)
  ? new Response(opaque, {status:502}) : Response.json({access_token:["synthetic","token"].join("-")});
for (const upstream of [refused, broken('/token'), broken('/userinfo')]) {
  globalThis.fetch = upstream;
  const redirect = loginRedirect('/admin');
  const state = new URL(redirect.url).searchParams.get('state');
  const response = await app.inject({url:'/api/auth/callback?'+new URLSearchParams({state,code:'synthetic'}),
    headers:{cookie:STATE_COOKIE+'='+encodeURIComponent(redirect.stateCookie)}});
  assert.equal(response.statusCode,403);
  assert.ok(!response.body.includes(marker) && !response.body.includes(opaque));
}
await app.close();
