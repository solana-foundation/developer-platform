export interface CreateAirdropRequest {
  address: string;
  amount: number;
}

export interface AirdropResponse {
  signature: string;
  slot: number;
}
