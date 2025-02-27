"use client"

import { useState, useEffect, useMemo, useCallback } from 'react'
import axios from '@/lib/axios'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, ReferenceLine, BarChart, Bar, Cell, PieChart, Pie, Sector, Treemap, ComposedChart } from 'recharts'
import { ArrowDownIcon, ArrowUpIcon, DollarSign, Percent, InfoIcon, RefreshCcw } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { Calendar } from "@/components/ui/calendar"
import { TradeStatisticsCard } from './dashboard/TradeStatisticsCard'
import { PerformanceMetricsCard } from './dashboard/PerformanceMetricsCard'
import { PnLChartCard } from './dashboard/PnLChartCard'
import { PnLCalendarCard } from './dashboard/PnLCalendarCard'
import { TradingAnalyticsCard } from './dashboard/TradingAnalyticsCard'
import { StrategyAnalysisCard } from './dashboard/StrategyAnalysisCard'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { AutoSizer } from 'react-virtualized'
import VirtualizedTable from 'react-virtualized/dist/es/Table'
import debounce from 'lodash/debounce'
import { Button } from "@/components/ui/button"

interface ChartDataPoint {
  date: string;
  dailyPnL: number;
  cumulativePnL: number;
}

// Dummy data for the chart
const data = [
  { date: '2023-01-01', dailyPnL: 1000, cumulativePnL: 1000 },
  { date: '2023-02-01', dailyPnL: 1500, cumulativePnL: 2500 },
  { date: '2023-03-01', dailyPnL: 1200, cumulativePnL: 3700 },
  { date: '2023-04-01', dailyPnL: 1800, cumulativePnL: 5500 },
  { date: '2023-05-01', dailyPnL: 2200, cumulativePnL: 7700 },
  { date: '2023-06-01', dailyPnL: 2000, cumulativePnL: 9700 },
]

// Dummy performance metrics
const performanceMetrics = {
  totalTrades: 150,
  winRatio: 0.65,
  avgProfit: 120,
  biggestWin: 5000,
  biggestLoss: -2000,
  riskRewardRatio: 1.5,
}

interface TradeStats {
  total: number;
  open: number;
  closed: number;
  winRatio: number;
  avgProfit: number;
  biggestWin: number;
  biggestLoss: number;
}

interface YearlyPnL {
  year: number;
  totalPnL: number;
}

// Add at the top of the file with other interfaces
interface SortConfig {
  key: keyof StrategyMetrics;
  direction: 'asc' | 'desc';
}

interface DotProps {
  cx: number;
  cy: number;
  payload: {
    dailyPnL: number;
    cumulativePnL: number;
  };
}

// Update the StrategyMetrics interface to include all sortable fields
interface StrategyMetrics {
  strategy: string;
  totalPnL: number;
  tradeCount: number;
  winRatio: number;
  avgPnL: number;
}

// Add to existing interfaces at the top
interface ProfitMetrics {
  profitFactor: number;
  grossProfits: number;
  grossLosses: number;
  maxDrawdown: number;
  consistencyScore: number;
}

// Add to existing interfaces at the top
interface DurationMetrics {
  averageDuration: number;
  tradeDurations: Array<{
    tradeId: string;
    symbol: string;
    daysHeld: number;
    entryDate: string;
    exitDate: string;
  }>;
}

// Add these type guards at the top of the file, after the interfaces
const isNumber = (value: any): value is number => {
  return typeof value === 'number' && !isNaN(value);
};

// Update the formatProfit function to handle undefined/null values
function formatProfit(amount: number | undefined | null): string {
  if (!isNumber(amount)) return '$0.00';
  const absAmount = Math.abs(amount);
  const formattedAmount = absAmount.toFixed(2);
  return amount < 0 ? `-$${formattedAmount}` : `$${formattedAmount}`;
}

// Update the calculateTotalPnL function to handle empty arrays
const calculateTotalPnL = (data: ChartDataPoint[]): number => {
  if (!data || data.length === 0) return 0;
  return data[data.length - 1].cumulativePnL;
};

interface TimeFrameOption {
  value: string
  label: string
}

const timeFrameOptions: TimeFrameOption[] = [
  { value: '1W', label: '1W' },
  { value: '1M', label: '1M' },
  { value: '3M', label: '3M' },
  { value: '6M', label: '6M' },
  { value: 'YTD', label: 'YTD' },
  { value: 'ALL', label: 'ALL' },
]

export default function DashboardContent() {
  const [timeFrame, setTimeFrame] = useState('6M')
  const [chartData, setChartData] = useState<ChartDataPoint[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [tradeStats, setTradeStats] = useState<TradeStats>({
    total: 0,
    open: 0,
    closed: 0,
    winRatio: 0,
    avgProfit: 0,
    biggestWin: 0,
    biggestLoss: 0
  })
  const [viewMode, setViewMode] = useState<'month' | 'day'>('month')
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [selectedYear, setSelectedYear] = useState<number>(() => {
    const today = new Date()
    const nextYear = today.getFullYear() + 1
    const nextYearStart = new Date(nextYear, 0, 1) // January 1st of next year
    
    // If we're past January 1st of next year, show that year, otherwise show current year
    return today >= nextYearStart ? nextYear : today.getFullYear()
  })
  const [yearlyPnL, setYearlyPnL] = useState<YearlyPnL | null>(null);
  const [strategyMetrics, setStrategyMetrics] = useState<StrategyMetrics[]>([])
  const [showStrategyChart, setShowStrategyChart] = useState(true)
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: 'totalPnL',
    direction: 'desc'
  });
  const [profitMetrics, setProfitMetrics] = useState<ProfitMetrics>({
    profitFactor: 0,
    grossProfits: 0,
    grossLosses: 0,
    maxDrawdown: 0,
    consistencyScore: 0,
  });
  const [durationMetrics, setDurationMetrics] = useState<DurationMetrics>({
    averageDuration: 0,
    tradeDurations: []
  });

  // Add error states at the top with other states
  const [errors, setErrors] = useState<{
    chartData: string | null;
    tradeStats: string | null;
    profitMetrics: string | null;
    durationMetrics: string | null;
    strategyMetrics: string | null;
    yearlyPnL: string | null;
  }>({
    chartData: null,
    tradeStats: null,
    profitMetrics: null,
    durationMetrics: null,
    strategyMetrics: null,
    yearlyPnL: null,
  });

  // Keep lastUpdated state
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // Add state for visibility
  const [showDaily, setShowDaily] = useState(true)
  const [showCumulative, setShowCumulative] = useState(true)

  // Memoize sorted strategy metrics
  const sortedStrategyMetrics = useMemo(() => {
    return [...strategyMetrics].sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];
      
      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [strategyMetrics, sortConfig.key, sortConfig.direction]);

  // Memoize chart components to prevent unnecessary re-renders
  const PnLChart = useMemo(() => (
    <ResponsiveContainer width="100%" height="100%">
      <ComposedChart 
        data={chartData}
        margin={{ top: 5, right: 30, left: 60, bottom: 25 }}
      >
        <XAxis 
          dataKey="date" 
          tickFormatter={(date) => {
            const dateObj = new Date(date);
            return dateObj.toLocaleDateString(undefined, {
              year: 'numeric',
              month: 'short',
              day: 'numeric'
            });
          }}
          angle={-45}
          textAnchor="end"
          height={60}
          interval={'preserveStartEnd'}
          minTickGap={30}
          stroke="#888888"
        />
        <YAxis 
          tickFormatter={(value) => formatProfit(value)}
          domain={['dataMin - 100', 'dataMax + 100']}
          stroke="#888888"
        />
        <RechartsTooltip
          formatter={(value: number, name: string) => [
            <div className="space-y-1">
              <div className={name === 'dailyPnL' ? 
                (value >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400') :
                'text-indigo-600 dark:text-indigo-400'
              }>
                {name === 'dailyPnL' ? 'Daily P/L: ' : 'Cumulative P/L: '}{formatProfit(value)}
              </div>
            </div>, 
            ''
          ]}
          labelFormatter={(label) => (
            <div className="font-medium border-b pb-1 mb-1 border-border">
              {new Date(label).toLocaleDateString(undefined, {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </div>
          )}
          contentStyle={{
            backgroundColor: 'hsl(var(--background))',
            borderRadius: '6px',
            padding: '8px',
            border: '1px solid hsl(var(--border))',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            color: 'hsl(var(--foreground))'
          }}
        />
        {showDaily && (
          <Bar
            dataKey="dailyPnL"
            name="dailyPnL"
            fill="url(#colorGradient)"
            radius={[4, 4, 0, 0]}
          >
            {chartData.map((entry, index) => (
              <Cell 
                key={`cell-${index}`}
                fill={entry.dailyPnL >= 0 ? '#16a34a' : '#dc2626'}
                fillOpacity={0.8}
              />
            ))}
          </Bar>
        )}
        {showCumulative && (
          <Line 
            type="monotone" 
            dataKey="cumulativePnL"
            stroke="#eab308"
            strokeWidth={3.5}
            name="cumulativePnL"
            dot={(props: any) => {
              const dailyPnL = props.payload.dailyPnL;
              return (
                <circle
                  cx={props.cx}
                  cy={props.cy}
                  r={4}
                  fill={dailyPnL >= 0 ? '#16a34a' : '#dc2626'}
                  strokeWidth={0}
                />
              );
            }}
            activeDot={(props: any) => {
              const dailyPnL = props.payload.dailyPnL;
              return (
                <circle
                  cx={props.cx}
                  cy={props.cy}
                  r={6}
                  fill={dailyPnL >= 0 ? '#16a34a' : '#dc2626'}
                  stroke="#fff"
                  strokeWidth={2}
                />
              );
            }}
          />
        )}
        <defs>
          <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#16a34a" stopOpacity={0.8}/>
            <stop offset="95%" stopColor="#dc2626" stopOpacity={0.8}/>
          </linearGradient>
        </defs>
        <ReferenceLine 
          y={0} 
          stroke="#888888" 
          strokeWidth={1.5}
        />
      </ComposedChart>
    </ResponsiveContainer>
  ), [chartData, timeFrame, showDaily, showCumulative]);

  // Batch API calls
  const fetchInitialData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [
        chartResponse,
        statsResponse,
        profitResponse,
        durationResponse,
        strategyResponse
      ] = await Promise.all([
        fetchChartData(),
        fetchTradeStats(),
        fetchProfitMetrics(),
        fetchDurationMetrics(),
        fetchStrategyMetrics()
      ]);
      
      // Data is already set in individual fetch functions
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching initial data:', error);
      setIsLoading(false);
    }
  }, []);

  // Use the batched fetch on mount
  useEffect(() => {
    fetchInitialData();
  }, []);

  // Add debouncing for frequent updates
  const debouncedRefresh = useCallback(
    debounce(() => {
      refreshData();
    }, 300),
    []
  );

  // Extract fetch functions outside useEffects but inside the component
  const fetchChartData = async () => {
    try {
      setIsLoading(true)
      setErrors(prev => ({ ...prev, chartData: null }));
      const response = await axios.get(`/api/trades/pnl-chart?timeFrame=${timeFrame}`)
      setChartData(response.data)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch chart data';
      setErrors(prev => ({ ...prev, chartData: message }));
      console.error('Error fetching chart data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchTradeStats = async () => {
    try {
      setErrors(prev => ({ ...prev, tradeStats: null }));
      const response = await axios.get('/api/trades/count')
      setTradeStats(response.data)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch trade statistics';
      setErrors(prev => ({ ...prev, tradeStats: message }));
      console.error('Error fetching trade statistics:', error)
    }
  }

  const fetchProfitMetrics = async () => {
    try {
      setErrors(prev => ({ ...prev, profitMetrics: null }));
      const response = await axios.get('/api/trades/profit-metrics');
      setProfitMetrics(response.data);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch profit metrics';
      setErrors(prev => ({ ...prev, profitMetrics: message }));
      console.error('Error fetching profit metrics:', error);
    }
  }

  const fetchDurationMetrics = async () => {
    try {
      setErrors(prev => ({ ...prev, durationMetrics: null }));
      const response = await axios.get('/api/trades/duration-metrics');
      setDurationMetrics(response.data);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch duration metrics';
      setErrors(prev => ({ ...prev, durationMetrics: message }));
      console.error('Error fetching duration metrics:', error);
    }
  }

  const fetchStrategyMetrics = async () => {
    try {
      setErrors(prev => ({ ...prev, strategyMetrics: null }));
      const response = await axios.get('/api/trades/strategy-pnl')
      setStrategyMetrics(response.data)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch strategy metrics';
      setErrors(prev => ({ ...prev, strategyMetrics: message }));
      console.error('Error fetching strategy metrics:', error)
    }
  }

  const fetchYearlyPnL = async () => {
    try {
      setErrors(prev => ({ ...prev, yearlyPnL: null }));
      const response = await axios.get(`/api/trades/yearly-pnl?year=${selectedYear}`);
      setYearlyPnL(response.data);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch yearly P/L';
      setErrors(prev => ({ ...prev, yearlyPnL: message }));
      console.error('Error fetching yearly P/L:', error);
    }
  }

  // Update useEffects to use these functions
  useEffect(() => {
    fetchChartData();
  }, [timeFrame]);

  useEffect(() => {
    fetchTradeStats();
  }, []);

  useEffect(() => {
    fetchProfitMetrics();
  }, []);

  useEffect(() => {
    fetchDurationMetrics();
  }, []);

  useEffect(() => {
    fetchStrategyMetrics();
  }, []);

  useEffect(() => {
    if (viewMode === 'month') {
      fetchYearlyPnL();
    }
  }, [selectedYear, viewMode]);

  // Now the refresh function can access these functions
  const refreshData = async () => {
    try {
      setLastUpdated(new Date());
      await Promise.all([
        fetchChartData(),
        fetchTradeStats(),
        fetchProfitMetrics(),
        fetchDurationMetrics(),
        fetchStrategyMetrics(),
        viewMode === 'month' && fetchYearlyPnL(),
      ].filter(Boolean));
    } catch (error) {
      console.error('Error refreshing data:', error);
    }
  };

  const toggleSortDirection = (direction: 'asc' | 'desc'): 'asc' | 'desc' => {
    return direction === 'asc' ? 'desc' : 'asc';
  };

  const getSortIcon = (direction: 'asc' | 'desc') => {
    return direction === 'asc' ? 
      <ArrowUpIcon className="inline ml-1 h-4 w-4" /> : 
      <ArrowDownIcon className="inline ml-1 h-4 w-4" />;
  };

  return (
    <div className="container mx-auto p-2 sm:p-4 space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
        <h1 className="text-xl sm:text-2xl font-semibold">Trading Dashboard</h1>
        <div className="flex items-center gap-4 text-sm">
          <div className="text-muted-foreground">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </div>
          <button
            onClick={refreshData}
            className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
          >
            <RefreshCcw className="h-4 w-4" /> {/* Add RefreshCcw icon from lucide-react */}
            Refresh now
          </button>
        </div>
      </div>
      
      {/* Metrics Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {/* Trade Counts Card */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Trade Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Total Trades with Trend Indicator */}
              <div className="text-center p-4 bg-secondary/20 rounded-lg relative overflow-hidden">
                <div className="relative z-10">
                  <div className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-blue-400">
                    {tradeStats.total}
                  </div>
                  <div className="text-sm font-medium text-muted-foreground mt-1">Total Trades</div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    All Time Trading Activity
                  </div>
                </div>
                <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_50%_120%,#3b82f6,transparent)]" />
              </div>
              
              {/* Trade Distribution */}
              <div className="space-y-2">
                {/* Progress Bar */}
                <div className="h-2 w-full bg-secondary/20 rounded-full overflow-hidden mt-2">
                  <div 
                    className="h-full bg-gradient-to-r from-green-500 to-blue-500"
                    style={{ 
                      width: `${(tradeStats.closed / tradeStats.total) * 100}%`,
                      transition: 'width 0.3s ease-in-out'
                    }}
                  />
                </div>

                {/* Open and Closed Trades Grid */}
                <div className="grid grid-cols-2 gap-4 mt-4">
                  {/* Open Trades */}
                  <div className="relative p-3 bg-gradient-to-br from-green-500/10 to-green-500/5 rounded-lg border border-green-500/10">
                    <div className="absolute top-3 right-3">
                      <ArrowUpIcon className="h-4 w-4 text-green-500" />
                    </div>
                    <div className="space-y-2">
                      <div className="text-sm font-medium text-muted-foreground">Open</div>
                      <div className="text-2xl font-bold text-green-600">
                        {tradeStats.open}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Active Positions
                      </div>
                      <div className="text-sm font-medium text-green-600/80">
                        {((tradeStats.open / tradeStats.total) * 100).toFixed(1)}% of Total
                      </div>
                    </div>
                  </div>

                  {/* Closed Trades */}
                  <div className="relative p-3 bg-gradient-to-br from-blue-500/10 to-blue-500/5 rounded-lg border border-blue-500/10">
                    <div className="absolute top-3 right-3">
                      <ArrowDownIcon className="h-4 w-4 text-blue-500" />
                    </div>
                    <div className="space-y-2">
                      <div className="text-sm font-medium text-muted-foreground">Closed</div>
                      <div className="text-2xl font-bold text-blue-600">
                        {tradeStats.closed}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Closed Trade
                      </div>
                      <div className="text-sm font-medium text-blue-600/80">
                        {((tradeStats.closed / tradeStats.total) * 100).toFixed(1)}% of Total
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Performance Metrics Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg font-semibold">Performance Metrics</CardTitle>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <InfoIcon className="h-4 w-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-sm p-4">
                    <div className="space-y-3 text-sm">
                      <p className="font-medium">
                        <span className="text-primary">Win Ratio:</span> 
                        <span className="text-muted-foreground">Shows your success rate in trading.</span>
                      </p>
                      <div className="pl-4 text-muted-foreground">
                        <p>• Red (&lt;50%): Need improvement in strategy</p>
                        <p>• Yellow (50-70%): Consistent performance</p>
                        <p>• Green (&gt;70%): Excellent performance</p>
                      </div>
                      <p className="font-medium">
                        <span className="text-primary">Avg. Profit/Trade:</span> 
                        <span className="text-muted-foreground">Your average profit or loss per closed trade. 
                          Calculated from {tradeStats.closed} closed trades. 
                          A positive number indicates overall profitable trading.</span>
                      </p>
                      <p className="font-medium">
                        <span className="text-primary">Best Trade:</span> 
                        <span className="text-muted-foreground">Your most profitable trade.</span>
                      </p>
                      <p className="font-medium">
                        <span className="text-primary">Worst Trade:</span> 
                        <span className="text-muted-foreground">Your largest losing trade.</span>
                      </p>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Win Ratio */}
            <div className="p-3 rounded-lg bg-secondary/10">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Win Ratio</span>
                <span className="text-lg font-semibold">
                  {`${(tradeStats.winRatio * 100).toFixed(2)}%`}
                </span>
              </div>
              <div className="w-full bg-secondary/20 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all ${
                    tradeStats.winRatio >= 0.7 ? 'bg-green-500' :
                    tradeStats.winRatio >= 0.5 ? 'bg-yellow-500' :
                    'bg-red-500'
                  }`}
                  style={{ width: `${(tradeStats.winRatio * 100)}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>Poor (&lt;50%)</span>
                <span>Average (50-70%)</span>
                <span>Good (&gt;70%)</span>
              </div>
            </div>

            {/* Average Profit */}
            <div className="p-3 rounded-lg bg-secondary/10">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Avg. Profit/Trade</span>
                <span className="text-lg font-semibold">
                  {formatProfit(tradeStats.avgProfit)}
                </span>
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                Based on {tradeStats.closed} closed trades
              </div>
            </div>

            {/* Best/Worst Trade Section */}
            <div className="grid grid-cols-2 gap-4">
              {/* Best Trade */}
              <div className="p-3 rounded-lg bg-green-500/10">
                <span className="text-muted-foreground flex items-center gap-2 mb-2">
                  <ArrowUpIcon className="h-4 w-4 text-green-500" />
                  Best Trade
                </span>
                <span className="text-xl font-bold text-green-600 block">
                  {tradeStats.biggestWin ? formatProfit(tradeStats.biggestWin) : '-'}
                </span>
              </div>

              {/* Worst Trade */}
              <div className="p-3 rounded-lg bg-red-500/10">
                <span className="text-muted-foreground flex items-center gap-2 mb-2">
                  <ArrowDownIcon className="h-4 w-4 text-red-500" />
                  Worst Trade
                </span>
                <span className="text-xl font-bold text-red-600 block">
                  {tradeStats.biggestLoss < 0 ? formatProfit(tradeStats.biggestLoss) : '-'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Trading Analytics Card */}
        <TradingAnalyticsCard
          profitMetrics={profitMetrics}
          durationMetrics={durationMetrics}
        />
      </div>

      {/* Main Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
        {/* P/L Chart Card */}
        <Card>
          <CardHeader>
            <div className="flex flex-col space-y-2">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-2 sm:space-y-0">
                <CardTitle className="text-base sm:text-lg font-semibold">Profit/Loss Chart</CardTitle>
                {chartData.length > 0 && (
                  <div className="text-sm mt-1">
                    <span className="text-muted-foreground">Total P/L: </span>
                    <span className={`font-medium ${
                      calculateTotalPnL(chartData) >= 0 
                        ? 'text-green-600' 
                        : 'text-red-600'
                    }`}>
                      {formatProfit(calculateTotalPnL(chartData))}
                    </span>
                  </div>
                )}
              </div>
              <div className="inline-flex items-center bg-background border rounded-lg p-0.5 shadow-sm">
                {timeFrameOptions.map((option, index) => (
                  <Button
                    key={option.value}
                    variant="ghost"
                    size="sm"
                    className={`
                      px-3 py-1.5 h-8 text-sm font-medium transition-all
                      ${timeFrame === option.value 
                        ? 'bg-primary text-primary-foreground shadow-sm' 
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                      }
                      ${index === 0 ? 'rounded-l-md' : ''}
                      ${index === timeFrameOptions.length - 1 ? 'rounded-r-md' : ''}
                      ${index !== 0 ? '-ml-px' : ''}
                    `}
                    onClick={() => setTimeFrame(option.value)}
                  >
                    {option.label}
                  </Button>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="h-[250px] sm:h-[300px]">
                {isLoading ? (
                  <div className="h-full flex items-center justify-center">
                    <span className="text-muted-foreground">Loading...</span>
                  </div>
                ) : chartData.length === 0 ? (
                  <div className="h-full flex items-center justify-center">
                    <span className="text-muted-foreground">
                      No closed trades found for the selected time period
                    </span>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart 
                      data={chartData}
                      margin={{ top: 5, right: 30, left: 60, bottom: 25 }}
                    >
                      <XAxis 
                        dataKey="date" 
                        tickFormatter={(date) => {
                          const dateObj = new Date(date.split('T')[0] + 'T00:00:00');
                          return dateObj.toLocaleDateString(undefined, {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          });
                        }}
                        angle={-45}
                        textAnchor="end"
                        height={60}
                        interval={'preserveStartEnd'}
                        minTickGap={30}
                        stroke="#888888"
                      />
                      <YAxis 
                        tickFormatter={(value) => formatProfit(value)}
                        domain={['dataMin - 100', 'dataMax + 100']}
                        stroke="#888888"
                      />
                      <RechartsTooltip
                        formatter={(value: number, name: string) => [
                          <div className="space-y-1">
                            <div className={name === 'dailyPnL' ? 
                              (value >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400') :
                              'text-indigo-600 dark:text-indigo-400'
                            }>
                              {name === 'dailyPnL' ? 'Daily P/L: ' : 'Cumulative P/L: '}{formatProfit(value)}
                            </div>
                          </div>, 
                          ''
                        ]}
                        labelFormatter={(label) => (
                          <div className="font-medium border-b pb-1 mb-1 border-border">
                            {new Date(label.split('T')[0] + 'T00:00:00').toLocaleDateString(undefined, {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </div>
                        )}
                        contentStyle={{
                          backgroundColor: 'hsl(var(--background))',
                          borderRadius: '6px',
                          padding: '8px',
                          border: '1px solid hsl(var(--border))',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                          color: 'hsl(var(--foreground))'
                        }}
                      />
                      {showDaily && (
                        <Bar
                          dataKey="dailyPnL"
                          name="dailyPnL"
                          fill="url(#colorGradient)"
                          radius={[4, 4, 0, 0]}
                        >
                          {chartData.map((entry, index) => (
                            <Cell 
                              key={`cell-${index}`}
                              fill={entry.dailyPnL >= 0 ? '#16a34a' : '#dc2626'}
                              fillOpacity={0.8}
                            />
                          ))}
                        </Bar>
                      )}
                      {showCumulative && (
                        <Line 
                          type="monotone" 
                          dataKey="cumulativePnL"
                          stroke="#eab308"
                          strokeWidth={3.5}
                          name="cumulativePnL"
                          dot={(props: any) => {
                            const dailyPnL = props.payload.dailyPnL;
                            return (
                              <circle
                                cx={props.cx}
                                cy={props.cy}
                                r={4}
                                fill={dailyPnL >= 0 ? '#16a34a' : '#dc2626'}
                                strokeWidth={0}
                              />
                            );
                          }}
                          activeDot={(props: any) => {
                            const dailyPnL = props.payload.dailyPnL;
                            return (
                              <circle
                                cx={props.cx}
                                cy={props.cy}
                                r={6}
                                fill={dailyPnL >= 0 ? '#16a34a' : '#dc2626'}
                                stroke="#fff"
                                strokeWidth={2}
                              />
                            );
                          }}
                        />
                      )}
                      <defs>
                        <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#16a34a" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#dc2626" stopOpacity={0.8}/>
                        </linearGradient>
                      </defs>
                      <ReferenceLine 
                        y={0} 
                        stroke="#888888" 
                        strokeWidth={1.5}
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                )}
              </div>
              <div className="flex items-center justify-center gap-6 text-sm pt-2">
                <div 
                  className="flex items-center gap-2 cursor-pointer"
                  onClick={() => setShowDaily(!showDaily)}
                >
                  <div 
                    className={`w-3 h-3 rounded ${showDaily ? 'bg-green-600' : 'bg-gray-300'}`}
                  />
                  <span className={`${showDaily ? 'text-foreground' : 'text-muted-foreground'} ${!showDaily ? 'line-through' : ''}`}>
                    Daily P/L
                  </span>
                </div>
                <div 
                  className="flex items-center gap-2 cursor-pointer"
                  onClick={() => setShowCumulative(!showCumulative)}
                >
                  <div 
                    className={`w-3 h-3 rounded ${showCumulative ? 'bg-yellow-500' : 'bg-gray-300'}`}
                  />
                  <span className={`${showCumulative ? 'text-foreground' : 'text-muted-foreground'} ${!showCumulative ? 'line-through' : ''}`}>
                    Cumulative P/L
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Calendar View Card */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-2 sm:space-y-0">
              <CardTitle className="text-base sm:text-lg font-semibold">P/L Calendar</CardTitle>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Daily</span>
                  <Switch
                    checked={viewMode === 'month'}
                    onCheckedChange={(checked) => setViewMode(checked ? 'month' : 'day')}
                  />
                  <span className="text-sm font-medium">Monthly</span>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {viewMode === 'day' ? (
                <div className="h-[400px] border rounded-lg overflow-hidden"> {/* Increased from 380px to 400px */}
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => date && setSelectedDate(date)}
                    className="w-full h-full"
                    components={{
                      Head: ({ children }: { children: React.ReactNode }) => (
                        <div className="flex w-full">
                          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                            <div key={day} className="w-[14.28%] text-center text-xs font-medium text-muted-foreground py-2">
                              {day}
                            </div>
                          ))}
                        </div>
                      ),
                      Day: ({ date, ...props }) => {
                        const profit = chartData.find(d => d.date === date.toISOString().split('T')[0])?.dailyPnL
                        const isToday = date.toDateString() === new Date().toDateString()
                        const isSelected = date.toDateString() === selectedDate?.toDateString()
                        const isCurrentMonth = date.getMonth() === selectedDate.getMonth()
                        const isPastDate = date < new Date(new Date().setHours(0, 0, 0, 0))
                        const isWeekend = date.getDay() === 0 || date.getDay() === 6
                        
                        // Calculate intensity for daily profits/losses
                        const maxProfit = Math.max(...chartData.map(d => d.dailyPnL))
                        const maxLoss = Math.abs(Math.min(...chartData.map(d => d.dailyPnL)))
                        const intensity = profit !== undefined
                          ? profit > 0 
                            ? (profit / maxProfit) * 0.4
                            : (Math.abs(profit) / maxLoss) * 0.4
                          : 0
                        
                        return (
                          <div 
                            {...props}
                            className={`relative p-2 text-center transition-colors min-h-[48px] h-[48px] border-b border-r flex flex-col justify-center gap-1
                              ${!isCurrentMonth ? 'opacity-40' : ''}
                              ${isToday ? 'ring-1 ring-primary' : ''}
                              ${isSelected ? 'ring-2 ring-primary' : ''}
                            `}
                            style={{
                              backgroundColor: profit !== undefined
                                ? profit > 0 
                                  ? `rgba(34, 197, 94, ${intensity})`
                                  : `rgba(239, 68, 68, ${intensity})`
                                : isWeekend 
                                  ? 'var(--gray-500)' // Darker background for weekends in dark mode
                                  : 'var(--background)',
                              opacity: !isCurrentMonth ? 0.4 : isWeekend ? 0.8 : 1
                            }}
                          >
                            <div className={`text-sm font-medium flex items-center justify-center gap-1
                              ${!isCurrentMonth ? 'text-muted-foreground' : ''}
                              ${profit !== undefined 
                                ? profit > 0 
                                  ? 'text-green-700 dark:text-green-300' 
                                  : 'text-red-700 dark:text-red-300'
                                : isWeekend
                                  ? 'text-muted-foreground dark:text-muted-foreground/70'
                                  : ''
                              }
                            `}>
                              {date.toLocaleDateString(undefined, { day: 'numeric' })}
                              {profit !== undefined && (
                                profit > 0 
                                  ? <ArrowUpIcon className="h-3 w-3 text-green-600" />
                                  : <ArrowDownIcon className="h-3 w-3 text-red-600" />
                              )}
                            </div>
                            {profit !== undefined ? (
                              <div className="text-xs leading-tight">
                                <span className={profit > 0 ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}>
                                  {formatProfit(profit)}
                                </span>
                              </div>
                            ) : (
                              !isWeekend && isPastDate && (
                                <div className="text-xs leading-tight text-muted-foreground">
                                  No trades
                                </div>
                              )
                            )}
                          </div>
                        )
                      },
                    }}
                    classNames={{
                      months: "space-y-4",
                      month: "space-y-4",
                      caption: "flex justify-center pt-1 pb-2 relative items-center",
                      caption_label: "text-sm font-medium", // Reduced from text-base to text-sm
                      nav: "space-x-1 flex items-center",
                      nav_button: "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100",
                      nav_button_previous: "absolute left-1",
                      nav_button_next: "absolute right-1",
                      table: "w-full border-collapse border",
                      head_row: "flex mb-1",
                      head_cell: "w-[14.28%] text-muted-foreground text-sm py-1",
                      row: "flex w-full",
                      cell: "w-[14.28%] text-center text-sm relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md",
                      day: "h-full w-full p-0 font-normal",
                      day_range_end: "day-range-end",
                      day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                      day_outside: "day-outside opacity-50",
                      day_disabled: "text-muted-foreground opacity-50",
                      day_hidden: "invisible",
                    }}
                  />
                </div>
              ) : (
                <>
                  <div className="flex justify-between items-center mb-4">
                    <div className="text-lg font-semibold">
                      {yearlyPnL ? (
                        <span>
                          <span className="text-foreground">{selectedYear} Total: </span>
                          <span className={yearlyPnL.totalPnL >= 0 ? 'text-green-600' : 'text-red-600'}>
                            {formatProfit(yearlyPnL.totalPnL)}
                          </span>
                        </span>
                      ) : (
                        <span className="text-muted-foreground">
                          {selectedYear} Total: N/A
                        </span>
                      )}
                    </div>
                    <Select 
                      value={selectedYear.toString()} 
                      onValueChange={(value) => setSelectedYear(Number(value))}
                    >
                      <SelectTrigger className="w-[120px]">
                        <SelectValue placeholder="Select year" />
                      </SelectTrigger>
                      <SelectContent>
                        {(() => {
                          const today = new Date()
                          const currentYear = today.getFullYear()
                          const nextYear = currentYear + 1
                          const nextYearStart = new Date(nextYear, 0, 1)
                          
                          // Determine the most recent year to show
                          const mostRecentYear = today >= nextYearStart ? nextYear : currentYear
                          
                          // Generate array of years (most recent year and 4 previous years)
                          return Array.from(
                            { length: 5 },
                            (_, i) => mostRecentYear - i
                          ).map(year => (
                            <SelectItem key={year} value={year.toString()}>
                              {year}
                            </SelectItem>
                          ))
                        })()}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                    {Array.from({ length: 12 }, (_, i) => {
                      const monthDate = new Date(selectedYear, i)
                      const monthlyProfit = chartData
                        .filter(d => {
                          const tradeDate = new Date(d.date)
                          return tradeDate.getMonth() === i && 
                                 tradeDate.getFullYear() === selectedYear
                        })
                        .reduce((sum, d) => sum + (isNumber(d.dailyPnL) ? d.dailyPnL : 0), 0)
                      
                      // Calculate intensity based on profit/loss amount
                      const maxProfit = Math.max(...chartData.map(d => d.dailyPnL))
                      const maxLoss = Math.abs(Math.min(...chartData.map(d => d.dailyPnL)))
                      const intensity = monthlyProfit > 0 
                        ? (monthlyProfit / maxProfit) * 0.4 // 40% max intensity for green
                        : (Math.abs(monthlyProfit) / maxLoss) * 0.4 // 40% max intensity for red
                      
                      return (
                        <div 
                          key={i}
                          className={`p-3 rounded-lg text-center hover:brightness-95 transition-all border shadow-sm
                            ${monthlyProfit > 0 
                              ? 'border-green-200 dark:border-green-900' 
                              : monthlyProfit < 0 
                                ? 'border-red-200 dark:border-red-900' 
                                : 'border-secondary'
                            }
                          `}
                          style={{
                            backgroundColor: monthlyProfit > 0 
                              ? `rgba(34, 197, 94, ${intensity})` 
                              : monthlyProfit < 0 
                                ? `rgba(239, 68, 68, ${intensity})`
                                : 'var(--secondary)',
                          }}
                        >
                          <div className="flex items-center justify-center gap-1 mb-2">
                            <div className="text-sm font-medium">
                              {monthDate.toLocaleString('default', { month: 'short' })}
                            </div>
                            {monthlyProfit !== 0 && (
                              monthlyProfit > 0 
                                ? <ArrowUpIcon className="h-4 w-4 text-green-600" />
                                : <ArrowDownIcon className="h-4 w-4 text-red-600" />
                            )}
                          </div>
                          <div className={`text-sm font-medium ${
                            monthlyProfit > 0 
                              ? 'text-green-700 dark:text-green-300' 
                              : monthlyProfit < 0 
                                ? 'text-red-700 dark:text-red-300' 
                                : 'text-muted-foreground'
                          }`}>
                            {monthlyProfit !== 0 ? formatProfit(monthlyProfit) : '-'}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Strategy P/L Analysis Card */}
      <StrategyAnalysisCard 
        strategyMetrics={strategyMetrics}
        sortConfig={sortConfig}
      />
    </div>
  )
}

function MetricCard({ 
  title, 
  value, 
  icon, 
  valueClassName = ''
}: { 
  title: React.ReactNode, 
  value: React.ReactNode, 
  icon: React.ReactNode,
  valueClassName?: string 
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg font-semibold">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-semibold ${valueClassName}`}>{value}</div>
      </CardContent>
    </Card>
  )
}
