export class TokenBalanceDto {
  mint: string;
  balance: string;
  decimals: number;
  tokenAccount: string;

  constructor(
    mint: string,
    balance: string,
    decimals: number,
    tokenAccount: string,
  ) {
    this.mint = mint;
    this.balance = balance;
    this.decimals = decimals;
    this.tokenAccount = tokenAccount;
  }
}

export class TokenBalancesResponseDto {
  address: string;
  balances: TokenBalanceDto[];

  constructor(address: string, balances: TokenBalanceDto[]) {
    this.address = address;
    this.balances = balances;
  }
}
