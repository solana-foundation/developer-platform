export interface CreateAirdropRequest {
  address: string;
  amount: number;
}

export interface AirdropResponse {
  signature: string;
  slot: number;
}

export interface AirdropHistoryItem {
  id: string;
  signature: string;
  recipient: string;
  amount: string;
  status: string;
  createdAt: string;
  explorerUrl: string;
}

export interface AirdropHistoryResponse {
  airdrops: AirdropHistoryItem[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}
