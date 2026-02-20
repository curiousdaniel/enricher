const AM_BASE = `https://${process.env.AM_DOMAIN}/amapi`;

let cachedToken: string | null = null;

export async function getToken(): Promise<string> {
  if (cachedToken) return cachedToken;

  const res = await fetch(`${AM_BASE}/auth`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: process.env.AM_EMAIL,
      password: process.env.AM_PASSWORD,
    }),
  });
  const data = await res.json();
  if (data.status !== 'success') throw new Error('AM auth failed');
  const token: string = data.token;
  if (!token) throw new Error('AM auth failed: no token');
  cachedToken = token;
  return token;
}

export function clearToken(): void {
  cachedToken = null;
}

export async function patchItem(
  auctionId: string,
  itemId: string,
  fields: object
): Promise<unknown> {
  const token = await getToken();
  const res = await fetch(
    `${AM_BASE}/admin/items/auction/${auctionId}/item/${itemId}`,
    {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(fields),
    }
  );
  if (res.status === 401) {
    clearToken();
    throw new Error('Token expired');
  }
  return res.json();
}

export interface AMItem {
  id: string | number;
  lot_number?: string;
  [key: string]: unknown;
}

export interface AMItemsResponse {
  items?: AMItem[];
  [key: string]: unknown;
}

export async function getItemsByAuction(
  auctionId: string
): Promise<AMItemsResponse> {
  const token = await getToken();
  const res = await fetch(
    `${AM_BASE}/admin/items?auction=${auctionId}&limit=500&offset=0`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  if (res.status === 401) {
    clearToken();
    throw new Error('Token expired');
  }
  if (!res.ok) throw new Error(`AM items fetch failed: ${res.status}`);
  return res.json();
}

export interface AMAuction {
  id: number;
  title: string;
  starts?: string;
  ends?: string;
  status: string;
  city?: string;
  state?: string;
  [key: string]: unknown;
}

export interface AMAuctionsResponse {
  auctions?: AMAuction[];
  [key: string]: unknown;
}

export async function getAuctions(
  limit: number = 20
): Promise<AMAuctionsResponse> {
  const token = await getToken();
  const res = await fetch(
    `${AM_BASE}/admin/auctions?offset=0&limit=${limit}`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  if (!res.ok) throw new Error(`AM auctions fetch failed: ${res.status}`);
  return res.json();
}
