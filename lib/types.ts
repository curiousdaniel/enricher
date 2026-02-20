export interface LotData {
  lotNumber: string;
  title: string;
  description: string;
  sequenceNumber: string;
  featured: string;
  noCcPayment: string;
  taxPremiumOnly: string;
  premium: string;
  taxCode: string;
  category: string;
  videos: string;
  quantity: string;
  incrementScheme: string;
  flatIncrement: string;
  startingBid: string;
  reservePrice: string;
  consignor: string;
  mappingCountry: string;
  mappingAddress: string;
  mappingCity: string;
  mappingState: string;
  mappingZip: string;
  locationId: string;
  live: string;
  newLotNumber: string;
  buyNowPrice: string;
  // Added by app:
  imageBase64?: string;
  imageMimeType?: string;
}

export type LotStatus =
  | 'pending'
  | 'processing'
  | 'enriched'
  | 'error'
  | 'edited'
  | 'pushed';

export interface EnrichedLot {
  original: LotData;
  enrichedTitle: string;
  enrichedDescription: string;
  status: LotStatus;
  error?: string;
  amItemId?: string;
}
