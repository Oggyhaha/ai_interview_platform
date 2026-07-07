import Vapi from '@vapi-ai/web'

const token = process.env.NEXT_PUBLIC_VAPI_WEB_TOKEN;

if (!token) {
  console.error('[PREPYOU] ✗ NEXT_PUBLIC_VAPI_WEB_TOKEN is undefined at Vapi SDK init time! Calls will fail. Check Vercel env vars and redeploy.');
} else {
  console.log(`[PREPYOU] ✓ Vapi SDK initialized with token: ${token.slice(0, 8)}…`);
}

export const vapi = new Vapi(token!);