import { NextResponse } from 'next/server';
import { getAuctions } from '@/lib/amApi';

export async function GET() {
  try {
    const data = await getAuctions(20);
    const auctions = (data.auctions || []).map((a: { id: number; title: string; starts?: string; ends?: string; status: string; city?: string; state?: string }) => ({
      id: a.id,
      title: a.title,
      startDate: a.starts ?? '',
      endDate: a.ends ?? '',
      status: a.status ?? '',
      city: a.city ?? '',
      state: a.state ?? '',
    }));
    return NextResponse.json({ auctions });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to fetch auctions';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
