/**
 * Test: validates Cognito login using the exact same SDK approach as auth.config.ts
 * Run: node scripts/test-cognito-login.mjs
 */
import { createHmac } from 'crypto';
import { readFileSync } from 'fs';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

// Load env
const env = readFileSync('/home/ubuntu/repos/spac-website/.env.local', 'utf8');
for (const line of env.split('\n')) {
  const m = line.match(/^([^#=\s]+)=(.*)$/);
  if (m) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
}

const clientId     = process.env.AUTH_COGNITO_ID;
const clientSecret = process.env.AUTH_COGNITO_SECRET;
const issuer       = process.env.AUTH_COGNITO_ISSUER;
const email        = 'partainzey@gmail.com';
const password     = 'SpacLogin2026!';

const region = issuer.match(/cognito-idp\.([\w-]+)\.amazonaws\.com/)?.[1];
const secretHash = createHmac('sha256', clientSecret).update(email + clientId).digest('base64');

console.log('client_id:  ', clientId);
console.log('region:     ', region);
console.log('secret_hash:', secretHash);
console.log('---');

const {
  CognitoIdentityProviderClient,
  InitiateAuthCommand,
} = require('@aws-sdk/client-cognito-identity-provider');

const client = new CognitoIdentityProviderClient({ region });

try {
  const result = await client.send(new InitiateAuthCommand({
    AuthFlow: 'USER_PASSWORD_AUTH',
    ClientId: clientId,
    AuthParameters: {
      USERNAME: email,
      PASSWORD: password,
      SECRET_HASH: secretHash,
    },
  }));

  if (result.ChallengeName) {
    console.error('❌ Challenge required:', result.ChallengeName);
    process.exit(1);
  }

  const idToken = result.AuthenticationResult?.IdToken;
  if (!idToken) { console.error('❌ No IdToken'); process.exit(1); }

  const segment = idToken.split('.')[1];
  const padded = segment + '='.repeat((4 - segment.length % 4) % 4);
  const payload = JSON.parse(Buffer.from(padded, 'base64').toString('utf8'));

  console.log('✅ AUTH SUCCESS');
  console.log('sub:            ', payload.sub);
  console.log('email:          ', payload.email);
  console.log('cognito:groups: ', payload['cognito:groups'] ?? []);
  console.log('role would be:  ', (payload['cognito:groups'] ?? []).includes('admins') ? 'ADMIN' : 'MEMBER');
} catch (e) {
  console.error('❌ SDK error:', e.name, '-', e.message);
  process.exit(1);
}
