import { NextRequest, NextResponse } from 'next/server';
import {
  getItemsByAuction,
  patchItem,
  AMItem,
  AMItemsResponse,
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

    const data: AMItemsResponse = await getItemsByAuction(auctionId);
    const items: AMItem[] = data.items ?? [];

    const lotToItem = new Map<string, AMItem>();
    for (const item of items) {
      const lotNum = String(item.lot_number ?? '').trim();
      if (lotNum) lotToItem.set(lotNum, item);
    }

    const results: { lotNumber: string; success: boolean; error?: string }[] =
      [];

    for (const lot of lots) {
      const item = lotToItem.get(lot.lotNumber) ?? lotToItem.get(String(lot.lotNumber));
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
