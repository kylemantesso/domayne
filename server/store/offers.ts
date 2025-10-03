export interface OfferRecord {
  orderId: string;
  maker: string;
  chainId: string;
  params?: any;
  createdAt: number;
}

const offers: OfferRecord[] = [];

export function addOffer(record: OfferRecord) {
  try {
    // De-duplicate by orderId
    const exists = offers.find((o) => o.orderId === record.orderId);
    if (!exists) {
      offers.push(record);
    }
  } catch {}
}

export function getOffersByMaker(maker: string): OfferRecord[] {
  const m = (maker || '').toLowerCase();
  return offers.filter((o) => (o.maker || '').toLowerCase() === m);
}

export function getAllOffers(): OfferRecord[] {
  return offers.slice();
}


