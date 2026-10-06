export type ListingStatus = 'draft' | 'published';

export interface Artwork {
  id: string;
  title: string;
  creatorName: string;
  category: string;
  description: string;
  assetKey: string;
  priceCredits: number;
  owned: boolean;
  favorite: boolean;
}

export interface Purchase {
  id: string;
  operationId: string;
  artworkId: string;
  priceCreditsSnapshot: number;
  createdAt: string;
}

export interface Listing {
  id: string;
  artworkId: string;
  priceCredits: number;
  description: string;
  status: ListingStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Activity {
  id: string;
  operationId: string;
  type: string;
  entityId: string;
  summarySnapshot: string;
  createdAt: string;
}

export interface CreditEntry {
  id: string;
  operationId: string;
  type: 'seed' | 'purchase';
  deltaCredits: number;
  purchaseId: string | null;
  createdAt: string;
}

export interface Snapshot {
  artworks: Artwork[];
  balance: number;
  listings: Listing[];
  activities: Activity[];
  ledger: CreditEntry[];
}
