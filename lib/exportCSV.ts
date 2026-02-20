import Papa from 'papaparse';
import type { EnrichedLot } from './types';

const CSV_COLUMNS = [
  'Lot #',
  'Title',
  'Sequence #',
  'Featured',
  'No Cc Payment',
  'Tax Premium Only',
  'Premium',
  'Tax Code',
  'Category',
  'Videos',
  'Description',
  'Quantity',
  'Increment Scheme',
  'Flat Increment',
  'Starting Bid',
  'Reserve Price',
  'Consignor',
  'Mapping Country',
  'Mapping Address',
  'Mapping City',
  'Mapping State',
  'Mapping Zip',
  'Location ID',
  'Live',
  'New Lot #',
  'Buy Now Price',
] as const;

const LOT_TO_CSV: Record<string, string> = {
  lotNumber: 'Lot #',
  title: 'Title',
  sequenceNumber: 'Sequence #',
  featured: 'Featured',
  noCcPayment: 'No Cc Payment',
  taxPremiumOnly: 'Tax Premium Only',
  premium: 'Premium',
  taxCode: 'Tax Code',
  category: 'Category',
  videos: 'Videos',
  description: 'Description',
  quantity: 'Quantity',
  incrementScheme: 'Increment Scheme',
  flatIncrement: 'Flat Increment',
  startingBid: 'Starting Bid',
  reservePrice: 'Reserve Price',
  consignor: 'Consignor',
  mappingCountry: 'Mapping Country',
  mappingAddress: 'Mapping Address',
  mappingCity: 'Mapping City',
  mappingState: 'Mapping State',
  mappingZip: 'Mapping Zip',
  locationId: 'Location ID',
  live: 'Live',
  newLotNumber: 'New Lot #',
  buyNowPrice: 'Buy Now Price',
};

export function exportEnrichedCSV(lots: EnrichedLot[]): string {
  const rows = lots.map((el) => {
    const o = el.original as unknown as Record<string, string>;
    const row: Record<string, string> = {};
    for (const [lotKey, csvKey] of Object.entries(LOT_TO_CSV)) {
      const val = o[lotKey];
      if (lotKey === 'title') {
        row[csvKey] = el.enrichedTitle ?? val ?? '';
      } else if (lotKey === 'description') {
        row[csvKey] = el.enrichedDescription ?? val ?? '';
      } else {
        row[csvKey] = val ?? '';
      }
    }
    return row;
  });

  return Papa.unparse(rows, { columns: [...CSV_COLUMNS] });
}
