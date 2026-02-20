import type { LotData } from './types';

// Maps raw CSV row keys to LotData fields
const CSV_TO_LOT: Record<string, keyof LotData> = {
  'Lot #': 'lotNumber',
  Title: 'title',
  'Sequence #': 'sequenceNumber',
  Featured: 'featured',
  'No Cc Payment': 'noCcPayment',
  'Tax Premium Only': 'taxPremiumOnly',
  Premium: 'premium',
  'Tax Code': 'taxCode',
  Category: 'category',
  Videos: 'videos',
  Description: 'description',
  Quantity: 'quantity',
  'Increment Scheme': 'incrementScheme',
  'Flat Increment': 'flatIncrement',
  'Starting Bid': 'startingBid',
  'Reserve Price': 'reservePrice',
  Consignor: 'consignor',
  'Mapping Country': 'mappingCountry',
  'Mapping Address': 'mappingAddress',
  'Mapping City': 'mappingCity',
  'Mapping State': 'mappingState',
  'Mapping Zip': 'mappingZip',
  'Location ID': 'locationId',
  Live: 'live',
  'New Lot #': 'newLotNumber',
  'Buy Now Price': 'buyNowPrice',
};

export function parseCSVRow(row: Record<string, string>): LotData {
  const lot: Record<string, string> = {};
  for (const [csvKey, lotKey] of Object.entries(CSV_TO_LOT)) {
    lot[lotKey] = String(row[csvKey] ?? '').trim();
  }
  // Ensure required fields exist
  return {
    lotNumber: lot.lotNumber ?? '',
    title: lot.title ?? '',
    description: lot.description ?? '',
    sequenceNumber: lot.sequenceNumber ?? '',
    featured: lot.featured ?? '',
    noCcPayment: lot.noCcPayment ?? '',
    taxPremiumOnly: lot.taxPremiumOnly ?? '',
    premium: lot.premium ?? '',
    taxCode: lot.taxCode ?? '',
    category: lot.category ?? '',
    videos: lot.videos ?? '',
    quantity: lot.quantity ?? '',
    incrementScheme: lot.incrementScheme ?? '',
    flatIncrement: lot.flatIncrement ?? '',
    startingBid: lot.startingBid ?? '',
    reservePrice: lot.reservePrice ?? '',
    consignor: lot.consignor ?? '',
    mappingCountry: lot.mappingCountry ?? '',
    mappingAddress: lot.mappingAddress ?? '',
    mappingCity: lot.mappingCity ?? '',
    mappingState: lot.mappingState ?? '',
    mappingZip: lot.mappingZip ?? '',
    locationId: lot.locationId ?? '',
    live: lot.live ?? '',
    newLotNumber: lot.newLotNumber ?? '',
    buyNowPrice: lot.buyNowPrice ?? '',
  };
}
