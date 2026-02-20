import { NextResponse } from 'next/server';
import { getToken, getAuctions, clearToken } from '@/lib/amApi';

export async function GET() {
  const steps: { step: string; status: 'ok' | 'error'; message?: string }[] = [];

  try {
    steps.push({ step: 'Environment variables', status: 'ok' });
    if (!process.env.AM_DOMAIN || !process.env.AM_EMAIL || !process.env.AM_PASSWORD) {
      steps[0] = {
        step: 'Environment variables',
        status: 'error',
        message: 'Missing AM_DOMAIN, AM_EMAIL, or AM_PASSWORD',
      };
      return NextResponse.json({ success: false, steps });
    }
    steps[0] = {
      step: 'Environment variables',
      status: 'ok',
      message: `AM_DOMAIN=${process.env.AM_DOMAIN}`,
    };

    steps.push({ step: 'Authentication', status: 'ok' });
    try {
      const token = await getToken();
      if (!token) throw new Error('No token received');
      steps[1] = { step: 'Authentication', status: 'ok', message: 'Token received' };
    } catch (authErr) {
      clearToken();
      let errMsg = authErr instanceof Error ? authErr.message : String(authErr);
      const cause = authErr instanceof Error ? (authErr.cause as Error) : null;
      if (cause?.message) errMsg += ` (cause: ${cause.message})`;
      steps[1] = {
        step: 'Authentication',
        status: 'error',
        message: `${errMsg} — URL: https://${process.env.AM_DOMAIN}/amapi/auth`,
      };
      return NextResponse.json({ success: false, steps });
    }

    steps.push({ step: 'Fetch auctions', status: 'ok' });
    try {
      const data = await getAuctions(5);
      const count = data.auctions?.length ?? 0;
      steps[2] = {
        step: 'Fetch auctions',
        status: 'ok',
        message: `Found ${count} auction(s)`,
      };
    } catch (fetchErr) {
      steps[2] = {
        step: 'Fetch auctions',
        status: 'error',
        message: fetchErr instanceof Error ? fetchErr.message : String(fetchErr),
      };
      return NextResponse.json({ success: false, steps });
    }

    return NextResponse.json({ success: true, steps });
  } catch (err) {
    steps.push({
      step: 'Unexpected error',
      status: 'error',
      message: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json({ success: false, steps }, { status: 500 });
  }
}
