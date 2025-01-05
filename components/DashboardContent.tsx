
"use client"

import { useState, useEffect, useMemo, useCallback } from 'react'
import axios from '@/lib/axios'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, ReferenceLine, BarChart, Bar, Cell, PieChart, Pie, Sector, Treemap } from 'recharts'
import { ArrowDownIcon, ArrowUpIcon, DollarSign, Percent, InfoIcon, RefreshCcw } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { Calendar } from "@/components/ui/calendar"
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

// Type definitions
interface ChartDataPoint {
  date: string;
  pnl: number;
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

interface SortConfig {
  key: keyof StrategyMetrics;
  direction: 'asc' | 'desc';
}

interface DotProps {
  cx: number;
  cy: number;
  payload: {
    pnl: number;
  };
}

interface StrategyMetrics {
  strategy: string;
  totalPnL: number;
  tradeCount: number;
  winRatio: number;
  avgPnL: number;
}

interface ProfitMetrics {
  profitFactor: number;
  grossProfits: number;
  grossLosses: number;
  maxDrawdown: number;
  consistencyScore: number;
}

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

// Utility functions
const isNumber = (value: any): value is number => {
  return typeof value === 'number' && !isNaN(value);
};

const formatProfit = (amount: number | undefined | null): string => {
  if (!isNumber(amount)) return '$0.00';
  const absAmount = Math.abs(amount);
  const formattedAmount = absAmount.toFixed(2);
  return amount < 0 ? `-$${formattedAmount}` : `$${formattedAmount}`;
};

const calculateTotalPnL = (data: ChartDataPoint[]): number => {
  if (!data || data.length === 0) return 0;
  return data.reduce((sum, d) => sum + (isNumber(d.pnl) ? d.pnl : 0), 0);
};

// Component
export default function DashboardContent() {
  // State management
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
    const nextYearStart = new Date(nextYear, 0, 1)
    return today >= nextYearStart ? nextYear : today.getFullYear()
  })
  const [yearlyPnL, setYearlyPnL] = useState<YearlyPnL | null>(null)
  const [strategyMetrics, setStrategyMetrics] = useState<StrategyMetrics[]>([])
  const [showStrategyChart, setShowStrategyChart] = useState(true)
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: 'totalPnL',
    direction: 'desc'
  })
  const [profitMetrics, setProfitMetrics] = useState<ProfitMetrics>({
    profitFactor: 0,
    grossProfits: 0,
    grossLosses: 0,
    maxDrawdown: 0,
    consistencyScore: 0,
  })
  const [durationMetrics, setDurationMetrics] = useState<DurationMetrics>({
    averageDuration: 0,
    tradeDurations: []
  })
  const [errors, setErrors] = useState({
    chartData: null,
    tradeStats: null,
    profitMetrics: null,
    durationMetrics: null,
    strategyMetrics: null,
    yearlyPnL: null,
  })
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())

  // Memoized values
  const sortedStrategyMetrics = useMemo(() => {
    return [...strategyMetrics].sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];
      
      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [strategyMetrics, sortConfig.key, sortConfig.direction]);

  // API calls
  const fetchChartData = async () => {
    try {
      setIsLoading(true)
      setErrors(prev => ({ ...prev, chartData: null }))
      const response = await axios.get(`/api/trades/pnl-chart?timeFrame=${timeFrame}`)
      setChartData(response.data)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch chart data'
      setErrors(prev => ({ ...prev, chartData: message }))
      console.error('Error fetching chart data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Similar fetch functions for other data...
  // Note: I've kept only one sample fetch function for brevity, but you would maintain all the others
  // with similar clean structure

  // Effects
  useEffect(() => {
    fetchChartData()
  }, [timeFrame])

  // Return JSX
  return (
    <div className="container mx-auto p-2 sm:p-4 space-y-4 sm:space-y-6">
      {/* Header Section */}
      {/* ...rest of the component JSX... */}
    </div>
  )
}

// Helper Components
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
