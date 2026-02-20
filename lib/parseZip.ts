import JSZip from 'jszip';
import Papa from 'papaparse';
import type { LotData } from './types';
import { parseCSVRow } from './parseCSV';

export async function parseAuctionZip(file: File): Promise<{ lots: LotData[] }> {
  const zip = await JSZip.loadAsync(file);

  // Find the CSV (look for "Items List.csv" or any .csv)
  const csvFiles = zip.file(/\.csv$/i);
  const csvFile = zip.file(/Items List\.csv$/i)[0] ?? csvFiles[0];
  if (!csvFile) throw new Error('No CSV file found in zip');

  const csvText = await csvFile.async('text');
  const cleanCSV = csvText.replace(/^\uFEFF/, '');
  const { data } = Papa.parse(cleanCSV, { header: true, skipEmptyLines: true });

  // Find lead images folder - match "Lead Images/1.JPG" or "Lead Images/123.jpg" etc
  const imageFiles = zip.file(/Lead Images\/[^/]+\.(jpg|jpeg|png)$/i);
  const imageMap: Record<string, { base64: string; mimeType: string }> = {};

  for (const imgFile of imageFiles) {
    const name = imgFile.name;
    const lotNum = name.split('/').pop()?.replace(/\.[^.]+$/, '') ?? '';
    if (!lotNum) continue;
    const base64 = await imgFile.async('base64');
    const ext = name.split('.').pop()?.toLowerCase() ?? '';
    const mimeType = ext === 'png' ? 'image/png' : 'image/jpeg';
    imageMap[lotNum] = { base64, mimeType };
  }

  const lots: LotData[] = (data as Record<string, string>[]).map((row) => {
    const lot = parseCSVRow(row);
    const imageData = imageMap[lot.lotNumber];
    if (imageData) {
      lot.imageBase64 = imageData.base64;
      lot.imageMimeType = imageData.mimeType;
    }
    return lot;
  });

  return { lots };
}
