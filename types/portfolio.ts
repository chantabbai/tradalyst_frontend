
export interface Position {
  symbol: string;
  quantity: number;
  averagePrice: number;
  currentPrice: number;
  marketValue: number;
  unrealizedPnL: number;
  unrealizedPnLPercentage: number;
  allocation: number;
  sector: string;
  beta: number;
}

export interface PortfolioSummary {
  totalValue: number;
  cashBalance: number;
  dayChange: number;
  dayChangePercent: number;
  totalPositions: number;
  sectorAllocation: {
    sector: string;
    percentage: number;
    value: number;
  }[];
}
