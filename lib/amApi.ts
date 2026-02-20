const AM_BASE = `https://${process.env.AM_DOMAIN ?? ''}/amapi`;

let cachedToken: string | null = null;

function formatFetchError(err: unknown): string {
  if (!(err instanceof Error)) return String(err);
  let msg = err.message;
  const cause = err.cause as Error & { code?: string } | undefined;
  if (cause?.message) msg += ` — ${cause.message}`;
  if (cause?.code) msg += ` (${cause.code})`;
  return msg;
}

export async function getToken(): Promise<string> {
  if (!process.env.AM_DOMAIN || !process.env.AM_EMAIL || !process.env.AM_PASSWORD) {
    throw new Error('AuctionMethod credentials missing — set AM_DOMAIN, AM_EMAIL, and AM_PASSWORD in environment');
  }
  if (cachedToken) return cachedToken;

  let res: Response;
  try {
    res = await fetch(`${AM_BASE}/auth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: process.env.AM_EMAIL,
        password: process.env.AM_PASSWORD,
      }),
    });
  } catch (fetchErr) {
    const msg = formatFetchError(fetchErr);
    throw new Error(`Network error: ${msg}. The server may be unreachable, or there may be a firewall/DNS issue.`);
  }

  const data = await res.json();
  if (data.status !== 'success') {
    throw new Error('AuctionMethod auth failed — check AM_EMAIL, AM_PASSWORD, and AM_DOMAIN');
  }
  const token: string = data.token;
  if (!token) throw new Error('AuctionMethod auth failed: no token');
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
  if (res.status === 401) {
    clearToken();
    throw new Error('AuctionMethod auth failed — check AM_EMAIL, AM_PASSWORD, and AM_DOMAIN');
  }
  if (!res.ok) throw new Error(`AM auctions fetch failed: ${res.status}`);
  return res.json();
}
