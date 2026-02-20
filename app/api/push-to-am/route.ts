import { NextRequest, NextResponse } from 'next/server';
import {
  getItemsByAuction,
  patchItem,
  AMItem,
} from '@/lib/amApi';

interface PushLot {
  lotNumber: string;
  enrichedTitle: string;
  enrichedDescription: string;
}

interface PushRequest {
  auctionId: string;
  lots: PushLot[];
}

export async function POST(req: NextRequest) {
  try {
    const body: PushRequest = await req.json();
    const { auctionId, lots } = body;

    if (!auctionId || !lots?.length) {
      return NextResponse.json(
        { error: 'Missing auctionId or lots' },
        { status: 400 }
      );
    }

    let items: AMItem[];
    try {
      items = await getItemsByAuction(auctionId);
    } catch (fetchErr) {
      const msg = fetchErr instanceof Error ? fetchErr.message : String(fetchErr);
      if (msg.includes('HTTP 404') || msg.includes('No items found')) {
        return NextResponse.json({
          error:
            'This auction has no items in AuctionMethod yet. Add lots to the catalog in AuctionMethod first, then try pushing again.',
        }, { status: 404 });
      }
      throw fetchErr;
    }

    const lotNumberToItem = new Map<number, AMItem>();
    for (const item of items) {
      const lotNum = parseInt(String(item.lot_number ?? '').trim(), 10);
      if (!Number.isNaN(lotNum)) lotNumberToItem.set(lotNum, item);
    }

    const results: { lotNumber: string; success: boolean; error?: string }[] =
      [];

    for (const lot of lots) {
      const lotNum = parseInt(String(lot.lotNumber).trim(), 10);
      const item = lotNumberToItem.get(lotNum);
      if (!item) {
        results.push({
          lotNumber: lot.lotNumber,
          success: false,
          error: `Item not found for lot #${lot.lotNumber}`,
        });
        continue;
      }

      const itemId = String(item.id);
      try {
        await patchItem(auctionId, itemId, {
          title: lot.enrichedTitle,
          description: lot.enrichedDescription,
        });
        results.push({ lotNumber: lot.lotNumber, success: true });
      } catch (err) {
        results.push({
          lotNumber: lot.lotNumber,
          success: false,
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }

    return NextResponse.json({ results });
  } catch (err) {
    console.error('Push to AM error:', err);
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : 'Push to AuctionMethod failed',
      },
      { status: 500 }
    );
  }
}
