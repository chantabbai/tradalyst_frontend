export interface TradeStats {
  total: number;
  open: number;
  closed: number;
  winRatio: number;
  avgProfit: number;
  biggestWin: number;
  biggestLoss: number;
}

export interface ProfitMetrics {
  profitFactor: number;
  grossProfits: number;
  grossLosses: number;
  maxDrawdown: number;
  consistencyScore: number;
}

export interface DurationMetrics {
  averageDuration: number;
  tradeDurations: Array<{
    tradeId: string;
    symbol: string;
    daysHeld: number;
    entryDate: string;
    exitDate: string;
  }>;
}

export interface ChartDataPoint {
  date: string;
  dailyPnL: number;
  cumulativePnL: number;
}

export interface StrategyMetrics {
  strategy: string;
  totalPnL: number;
  tradeCount: number;
  winRatio: number;
  avgPnL: number;
}

export interface YearlyPnL {
  year: number;
  totalPnL: number;
}
