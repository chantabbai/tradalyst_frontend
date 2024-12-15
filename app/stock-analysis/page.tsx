"use client"

import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { LineChart, Line, BarChart, Bar, ComposedChart, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Brush, ReferenceLine } from 'recharts'
import { ArrowUpIcon, ArrowDownIcon, MagnifyingGlassIcon } from "@heroicons/react/24/outline"
import { motion } from "framer-motion"
import Chart from 'chart.js/auto'
import axios from 'axios'
import { Sparklines, SparklinesLine, SparklinesBars } from 'react-sparklines'
import debounce from 'lodash/debounce'

// Types
interface ChartData {
  date: string;
  price: number;
  volume: number;
}

type StockData = {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  avgVolume: number;
  marketCap: number;
  beta: number;
  pe: number;
  eps: number;
  dayLow: number;
  dayHigh: number;
  yearLow: number;
  yearHigh: number;
  open: number;
  previousClose: number;
  changesPercentage: number;
  sharesOutstanding: number;
}

type HistoricalData = {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  adjClose: number;
  volume: number;
  unadjustedVolume: number;
  change: number;
  changePercent: number;
  vwap: number;
  label: string;
  changeOverTime: number;
}

type CompanyProfile = {
  companyName: string;
  image: string;
  sector: string;
  industry: string;
  description: string;
  isMarketOpen: boolean;
}

// Add this type definition after the existing types
type GrahamValuation = {
  grahamNumber: number;
  defensivePrice: number;
  growthPrice: number;
  currentPrice: number;
  eps: number;
  bookValue: number;
  marginOfSafety: number;
  isPotentialBuy: boolean;
  potentialUpside: number;
  lynchFairValue: number;
  lynchMarginOfSafety: number;
  buffettNumber: number;
  buffettMarginOfSafety: number;
  buffettPerShareValue: number;
  peRatio: number;
  roe: number;
  dividendYield: number;
  assumedGrowthRate: number;
  ownerEarnings: number;
  grahamMarginOfSafety: number;
  isGrahamBuy: boolean;
  isLynchBuy: boolean;
  isBuffettBuy: boolean;
}

// Add this type definition near the top with other types
type SearchResult = {
  symbol: string;
  name: string;
  currency: string;
  stockExchange: string;
  exchangeShortName: string;
}

const API_BASE_URL = 'http://localhost:8080/api/stocks';

type ChartInstance = Chart<"line", any, any>

// First, define the CustomTooltip component at the top level
interface CustomTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
}

// Add formatCurrency as a utility function at the top level
const formatCurrency = (value: number) => {
  if (value === undefined || value === null || isNaN(value)) return 'N/A';
  if (Math.abs(value) >= 1e9) {
    return `$${(value / 1e9).toFixed(2)}B`;
  } else if (Math.abs(value) >= 1e6) {
    return `$${(value / 1e6).toFixed(2)}M`;
  }
  return `$${value.toFixed(2)}`;
};

// Define CustomTooltip component using the formatCurrency function
const CustomTooltip = ({ active, payload, label, activeTab }: any) => {
  const formatLargeNumber = (value: number) => {
    if (value === null || value === undefined || isNaN(value)) return 'N/A';
    if (Math.abs(value) >= 1e9) {
      return `$${(value / 1e9).toFixed(2)}B`;
    } else if (Math.abs(value) >= 1e6) {
      return `$${(value / 1e6).toFixed(2)}M`;
    } else if (Math.abs(value) >= 1e3) {
      return `$${(value / 1e3).toFixed(2)}K`;
    }
    return `$${value.toFixed(2)}`;
  };

  if (active && payload && payload.length) {
    return (
      <div className="bg-card border rounded-lg shadow-lg p-3 transition-all">
        <div className="text-sm font-medium mb-2 text-foreground">
          Year: {label}
        </div>
        <div className="space-y-1">
          {payload.map((entry: any, index: number) => (
            <div 
              key={`item-${index}`}
              className="flex items-center justify-between gap-4"
            >
              <div className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-sm text-muted-foreground">
                  {entry.name}:
                </span>
              </div>
              <span className="text-sm font-medium">
                {formatLargeNumber(entry.value)}
              </span>
            </div>
          ))}
          {activeTab === 'income' && payload[0]?.payload && (
            <>
              <div className="mt-2 pt-2 border-t border-border">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">EPS:</span>
                  <span className="font-medium">${payload[0].payload.eps?.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">EPS (Diluted):</span>
                  <span className="font-medium">${payload[0].payload.epsdiluted?.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">EBITDA Ratio:</span>
                  <span className="font-medium">{(payload[0].payload.ebitdaratio * 100).toFixed(1)}%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Operating Margin:</span>
                  <span className="font-medium">{(payload[0].payload.operatingIncomeRatio * 100).toFixed(1)}%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Net Margin:</span>
                  <span className="font-medium">{(payload[0].payload.netIncomeRatio * 100).toFixed(1)}%</span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }
  return null;
};

// Add interface for chart data item
interface ChartDataItem {
  year: number;
  revenue: number;
  costOfRevenue: number;
  grossProfit: number;
  operatingIncome: number;
  netIncome: number;
  researchAndDevelopmentExpenses: number;
  sellingGeneralAndAdministrativeExpenses: number;
  operatingExpenses: number;
  [key: string]: number; // For dynamic access
}

// Add formatYAxis function
const formatYAxis = (value: number) => {
  if (value === 0) return '0';
  if (Math.abs(value) >= 1e9) {
    return `${(value / 1e9).toFixed(1)}B`;
  } else if (Math.abs(value) >= 1e6) {
    return `${(value / 1e6).toFixed(1)}M`;
  } else if (Math.abs(value) >= 1e3) {
    return `${(value / 1e3).toFixed(1)}K`;
  }
  return value.toFixed(2);
};

// Add this function at the top level to get user-friendly error messages
const getFriendlyErrorMessage = (error: any, symbol: string) => {
  if (!navigator.onLine) {
    return "Please check your internet connection and try again.";
  }

  if (error?.response?.status === 404) {
    return `Stock symbol "${symbol}" not found. Please check the symbol and try again.`;
  }

  if (error?.response?.status === 429) {
    return "Too many requests. Please wait a moment and try again.";
  }

  if (error?.response?.status >= 500) {
    return "Our servers are experiencing issues. Please try again later.";
  }

  return "Unable to fetch stock data. Please try again later.";
};

export default function StockAnalysis() {
  // Change initial state to empty string
  const [symbol, setSymbol] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Remove this useEffect
  // useEffect(() => {
  //   fetchAllData();
  // }, []);

  // Stock data states
  const [stockData, setStockData] = useState<StockData | null>(null)
  const [historicalData, setHistoricalData] = useState<HistoricalData[]>([])
  const [companyProfile, setCompanyProfile] = useState<CompanyProfile | null>(null)
  const [technicalIndicators, setTechnicalIndicators] = useState<any>(null)

  // Financial data states
  const [financialData, setFinancialData] = useState<any[]>([])
  const [metricsData, setMetricsData] = useState<any>(null)
  const [ratiosData, setRatiosData] = useState<any>(null)
  const [ttmRatiosData, setTtmRatiosData] = useState<any>(null)
  const [growthData, setGrowthData] = useState<any>(null)
  const [dcfData, setDcfData] = useState<any>(null)
  const [ratingData, setRatingData] = useState<any>(null)

  // Chart refs
  const chartRef = useRef<HTMLCanvasElement | null>(null)
  const chartInstance = useRef<Chart | null>(null)

  const API_KEY = 'AuEy4ycpahHFSznuhOsvat73PTKrflhv'
  const BASE_URL = 'https://financialmodelingprep.com/api/v3'

  // Add valuationData state
  const [valuationData, setValuationData] = useState<any>(null);

  // Add these inside the StockAnalysis component
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Add dividendData state near other states at the top of the component
  const [dividendData, setDividendData] = useState<any>(null);
  
  // Add useEffect to fetch dividend data when symbol changes
  useEffect(() => {
    async function fetchDividendData() {
      if (!stockData?.symbol) return;
      
      try {
        const response = await fetch(`${API_BASE_URL}/dividends/${stockData.symbol}`);
        if (response.ok) {
          const data = await response.json();
          setDividendData(data);
        }
      } catch (error) {
        console.error('Error fetching dividend data:', error);
      }
    }

    fetchDividendData();
  }, [stockData?.symbol]);

  // Add the fetchWithDelay function
  async function fetchWithDelay(url: string) {
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`API call failed: ${response.status}`)
    }
    return response.json()
  }

  // Add the fetchAllData function
  async function fetchAllData() {
    if (!symbol) return;
    setIsLoading(true);
    setError(null);

    try {
      // First check if the symbol exists
      const response = await fetch(`${API_BASE_URL}/quote/${symbol}`);
      if (!response.ok) {
        const errorMessage = getFriendlyErrorMessage(response, symbol);
        setError(errorMessage);
        setIsLoading(false);
        return;
      }

      // Fetch basic and free endpoints
      const [
        quoteResponse,
        profileResponse,
        historyResponse,  // This is the historical price data
        dcfResponse,
        metricsResponse,
        ratiosResponse,
        ratioTtmResponse
      ] = await Promise.all([
        fetch(`${API_BASE_URL}/quote/${symbol}`),
        fetch(`${API_BASE_URL}/profile/${symbol}`),
        fetch(`https://financialmodelingprep.com/api/v3/historical-price-full/${symbol}?apikey=${API_KEY}`), // Updated endpoint
        fetch(`${API_BASE_URL}/dcf/${symbol}`),
        fetch(`${API_BASE_URL}/key-metrics-ttm/${symbol}?limit=1`),
        fetch(`${API_BASE_URL}/ratios/${symbol}?limit=1`),
        fetch(`${API_BASE_URL}/ratios-ttm/${symbol}?limit=1`)
      ]);

      // Process basic data
      const [quoteData, profileData, historyData] = await Promise.all([
        quoteResponse.json(),
        profileResponse.json(),
        historyResponse.json()
      ]);

      // Update basic stock data
      setStockData(quoteData);
      setCompanyProfile(profileData);

      // Process historical data
      if (historyData && historyData.historical) {
        const sortedHistoricalData = [...historyData.historical].sort(
          (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
        );
        setHistoricalData(sortedHistoricalData); // Store all historical data
        calculateTechnicalIndicators(sortedHistoricalData.map(item => item.close));
      }

      // Process valuation data
      const valuationData: any = {};
      
      if (dcfResponse.ok) {
        const dcfData = await dcfResponse.json();
        console.log('DCF Response:', dcfData);
        valuationData.dcf = dcfData;
      }

      if (metricsResponse.ok) {
        const metricsData = await metricsResponse.json();
        console.log('Metrics Response:', metricsData);
        valuationData.metrics = metricsData;
      }

      if (ratiosResponse.ok) {
        const ratiosData = await ratiosResponse.json();
        console.log('Ratios Response:', ratiosData);
        valuationData.ratios = ratiosData;
      }

      // Fix: Use ratioTtmResponse instead of ratiosResponse
      if (ratioTtmResponse.ok) {
        const ttmRatiosData = await ratioTtmResponse.json();
        console.log('Ratios TTM Response:', ttmRatiosData);
        valuationData.ttmRatios = ttmRatiosData;
      }
      

      // Set valuation data
      if (Object.keys(valuationData).length > 0) {
        setValuationData(valuationData);
      } else {
        console.warn('No valuation data available');
        setValuationData(null);
      }

    } catch (error) {
      console.error('Error fetching data:', error);
      const errorMessage = getFriendlyErrorMessage(error, symbol);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }

  // Add the updateChart function
  function updateChart(historicalData: any[]) {
    if (!chartRef.current) return

    // Destroy existing chart if it exists
    if (chartInstance.current) {
      chartInstance.current.destroy()
    }

    const ctx = chartRef.current.getContext('2d')
    if (!ctx) return

    const chartData = historicalData
      .slice(0, 90)
      .reverse()
      .map(item => ({
        date: item.date,
        price: item.close,
        volume: item.volume
      }))

    chartInstance.current = new Chart(ctx, {
      type: 'line',
      data: {
        labels: chartData.map(item => new Date(item.date).toLocaleDateString()),
        datasets: [
          {
            label: 'Price',
            data: chartData.map(item => item.price),
            borderColor: '#3b82f6',
            yAxisID: 'y',
            type: 'line'
          },
          {
            label: 'Volume',
            data: chartData.map(item => item.volume),
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            yAxisID: 'y1',
            type: 'bar'
          }
        ]
      },
      options: {
        responsive: true,
        interaction: {
          mode: 'index',
          intersect: false
        },
        scales: {
          y: {
            type: 'linear',
            display: true,
            position: 'left',
            title: {
              display: true,
              text: 'Price ($)'
            }
          },
          y1: {
            type: 'linear',
            display: true,
            position: 'right',
            grid: {
              drawOnChartArea: false
            },
            title: {
              display: true,
              text: 'Volume'
            }
          }
        }
      }
    })
  }

  // Add cleanup effect
  useEffect(() => {
    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy()
      }
    }
  }, [])

  const calculateTechnicalIndicators = (prices: number[]) => {
    // Calculate RSI
    const calculateRSI = (prices: number[], periods = 14) => {
      const changes = prices.slice(1).map((price, i) => price - prices[i]);
      const gains = changes.map(change => change > 0 ? change : 0);
      const losses = changes.map(change => change < 0 ? -change : 0);
      
      const avgGain = gains.slice(0, periods).reduce((a, b) => a + b) / periods;
      const avgLoss = losses.slice(0, periods).reduce((a, b) => a + b) / periods;
      
      return avgLoss === 0 ? 100 : 100 - (100 / (1 + (avgGain / avgLoss)));
    };

    const sma20 = prices.slice(-20).reduce((a, b) => a + b) / 20;
    const sma50 = prices.slice(-50).reduce((a, b) => a + b) / 50;
    const rsi = calculateRSI(prices);

    setTechnicalIndicators({ rsi, sma20, sma50 });
  };

  // Add the search function
  const searchStocks = useCallback(
    debounce(async (query: string) => {
      if (!query || query.length < 2) {
        setSearchResults([]);
        return;
      }

      setIsSearching(true);
      try {
        const response = await fetch(`${API_BASE_URL}/search?query=${query}&limit=10`);
        if (response.ok) {
          const data = await response.json();
          // Ensure we're setting the correct type of data
          setSearchResults(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        console.error('Error searching stocks:', error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300),
    []
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-7xl mx-auto space-y-8"
      >
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
            Stock Analysis Dashboard
          </h1>
          
          {/* Search Section */}
          <div className="w-full md:w-auto">
            <div className="relative flex-1 md:w-80">
              <Input
                placeholder="Enter stock symbol (e.g., AAPL)"
                value={symbol}
                onChange={(e) => {
                  const value = e.target.value.toUpperCase();
                  setSymbol(value);
                  searchStocks(value);
                }}
                onKeyDown={async (e) => {
                  if (e.key === 'Enter') {
                    if (!symbol.trim()) {
                      setError("Please enter a stock symbol");
                      return;
                    }
                    
                    setSearchResults([]); // Clear any search results
                    setIsLoading(true);
                    try {
                      // First validate the symbol
                      const validateResponse = await fetch(`${API_BASE_URL}/search?query=${symbol}&limit=1`);
                      const searchResults = await validateResponse.json();
                      
                      // Check if the exact symbol exists
                      const exactMatch = Array.isArray(searchResults) && 
                        searchResults.some(result => result.symbol.toUpperCase() === symbol.toUpperCase());
                      
                      if (!exactMatch) {
                        setError(`"${symbol}" is not a valid stock symbol. Please check and try again.`);
                        setIsLoading(false);
                        return;
                      }

                      setError(null);
                      await fetchAllData(); // Only proceed with data fetch if symbol is valid
                    } catch (error) {
                      setError("Unable to validate symbol. Please try again later.");
                    } finally {
                      setIsLoading(false);
                    }
                  }
                }}
                className="pl-10 pr-4 py-2 w-full"
              />
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              
              {/* Error Message - Positioned right below search box */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: 0 }}
                  animate={{ opacity: 1, y: 4 }}
                  className="absolute top-full left-0 right-0 mt-1 bg-red-50 border-l-4 border-red-500 p-3 rounded-md shadow-md z-50"
                >
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-red-700">
                        {error}
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
              
              {/* Search Results Dropdown */}
              {searchResults.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700">
                  {searchResults.map((result: SearchResult) => (
                    <div
                      key={result.symbol}
                      className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer flex flex-col"
                      onClick={async () => {
                        setSymbol(result.symbol);
                        setSearchResults([]);
                        await fetchAllData(); // Wait for fetchAllData to complete
                      }}
                    >
                      <span className="font-medium">{result.symbol}</span>
                      <span className="text-sm text-gray-500 dark:text-gray-400">{result.name}</span>
                      <span className="text-xs text-gray-400 dark:text-gray-500">{result.exchangeShortName}</span>
                    </div>
                  ))}
                </div>
              )}
              
              {isSearching && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-500 border-t-transparent"></div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Add this right after the Header section and before the Company Profile section */}
        {!stockData && !isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center space-y-6 py-12"
          >
            <div className="max-w-3xl mx-auto space-y-4">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                Welcome to Stock Analysis Dashboard
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-300">
                Get comprehensive insights into any publicly traded company with detailed financial analysis, 
                valuation metrics, and historical performance data.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
                <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                  <h3 className="font-semibold text-lg mb-2">Financial Analysis</h3>
                  <p className="text-sm text-gray-500">Income statements, balance sheets, and cash flow analysis</p>
                </div>
                <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                  <h3 className="font-semibold text-lg mb-2">Valuation Metrics</h3>
                  <p className="text-sm text-gray-500">Key ratios, multiples, and intrinsic value estimates</p>
                </div>
                <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                  <h3 className="font-semibold text-lg mb-2">Dividend Analysis</h3>
                  <p className="text-sm text-gray-500">Historical dividends, yields, and payout trends</p>
                </div>
              </div>
              <p className="text-sm text-gray-500 mt-8">
                Start by entering a stock symbol in the search box above
              </p>
            </div>
          </motion.div>
        )}

        {/* Company Profile */}
        {companyProfile && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="overflow-hidden border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="flex-shrink-0">
                    <img
                      src={companyProfile.image}
                      alt={companyProfile.companyName}
                      className="w-24 h-24 object-contain rounded-lg bg-white p-2 shadow-sm"
                    />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                      {companyProfile.companyName}
                    </h2>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                        {companyProfile.sector}
                      </span>
                      <span className="px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
                        {companyProfile.industry}
                      </span>
                    </div>
                    <p className="mt-4 text-gray-600 dark:text-gray-300 line-clamp-3">
                      {companyProfile.description}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Tabs Section */}
        {stockData && (
          <Tabs defaultValue="price" className="space-y-6">
            <TabsList className="bg-white dark:bg-gray-800 p-1 rounded-lg shadow-sm">
              <TabsTrigger value="price" className="rounded-md px-6 py-2">
                Price & Trading
              </TabsTrigger>
              <TabsTrigger value="valuation" className="rounded-md px-6 py-2">
                Valuation
              </TabsTrigger>
              <TabsTrigger value="financials" className="rounded-md px-6 py-2">
                Financials
              </TabsTrigger>
              {/* Only show Dividends tab if dividend data exists */}
              {dividendData?.metrics?.currentDividend && (
                <TabsTrigger value="dividends" className="rounded-md px-6 py-2">
                  Dividends
                </TabsTrigger>
              )}
            </TabsList>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <TabsContent value="price">
                <PriceTab
                  historicalData={historicalData}
                  technicalIndicators={technicalIndicators}
                  stockData={stockData}
                />
              </TabsContent>

              <TabsContent value="valuation">
                <ValuationTab
                  stockData={stockData}
                  financialData={financialData}
                  valuationData={valuationData}
                />
              </TabsContent>

              <TabsContent value="financials">
                <FinancialsTab stockData={stockData} financialData={financialData} />
              </TabsContent>

              {/* Only render Dividends tab content if dividend data exists */}
              {dividendData?.metrics?.currentDividend && (
                <TabsContent value="dividends">
                  <DividendsTab 
                    stockData={stockData}
                  />
                </TabsContent>
              )}
            </motion.div>
          </Tabs>
        )}
      </motion.div>
    </div>
  )
}

// Tab components remain the same but with enhanced styling...

interface PriceTabProps {
  historicalData: HistoricalData[];
  technicalIndicators: any;
  stockData: StockData | null;
}

function PriceTab({ historicalData, technicalIndicators, stockData }: PriceTabProps) {
  const [timeRange, setTimeRange] = useState(90);
  const [hideVolume, setHideVolume] = useState(false);

  // Calculate SMA 200
  const sma200 = useMemo(() => {
    if (historicalData.length < 200) return null;
    const last200Days = historicalData.slice(-200);
    const sum = last200Days.reduce((acc, day) => acc + day.close, 0);
    return sum / 200;
  }, [historicalData]);

  // Process chart data
  const chartData = historicalData
    .slice(timeRange === 0 ? 0 : -timeRange)
    .map(item => ({
      date: new Date(item.date).toLocaleDateString(),
      price: item.close,
      volume: item.volume,
      vwap: item.vwap,
      change: item.change,
      changePercent: item.changePercent,
      high: item.high,
      low: item.low,
      open: item.open
    }));

  // Get latest data point
  const latestData = historicalData[historicalData.length - 1];

  return (
    <div className="space-y-6">
      {/* Price Chart Card */}
      <Card className="overflow-hidden border-0 shadow-lg">
        <CardHeader className="border-b">
          <div className="flex justify-between items-center">
            <CardTitle>Price History</CardTitle>
            {/* Time Range Selector */}
            <div className="flex flex-wrap gap-2">
              <Button
                variant={timeRange === 30 ? "default" : "outline"}
                onClick={() => setTimeRange(30)}
                className="text-sm hover:bg-primary/90 dark:hover:bg-primary/80"
                size="sm"
              >
                1M
              </Button>
              <Button
                variant={timeRange === 90 ? "default" : "outline"}
                onClick={() => setTimeRange(90)}
                className="text-sm hover:bg-primary/90 dark:hover:bg-primary/80"
                size="sm"
              >
                3M
              </Button>
              <Button
                variant={timeRange === 180 ? "default" : "outline"}
                onClick={() => setTimeRange(180)}
                className="text-sm hover:bg-primary/90 dark:hover:bg-primary/80"
                size="sm"
              >
                6M
              </Button>
              <Button
                variant={timeRange === 365 ? "default" : "outline"}
                onClick={() => setTimeRange(365)}
                className="text-sm hover:bg-primary/90 dark:hover:bg-primary/80"
                size="sm"
              >
                1Y
              </Button>
              <Button
                variant={timeRange === 730 ? "default" : "outline"}
                onClick={() => setTimeRange(730)}
                className="text-sm hover:bg-primary/90 dark:hover:bg-primary/80"
                size="sm"
              >
                2Y
              </Button>
              <Button
                variant={timeRange === 1825 ? "default" : "outline"}
                onClick={() => setTimeRange(1825)}
                className="text-sm hover:bg-primary/90 dark:hover:bg-primary/80"
                size="sm"
              >
                5Y
              </Button>
              <Button
                variant={timeRange === 0 ? "default" : "outline"}
                onClick={() => setTimeRange(0)}
                className="text-sm hover:bg-primary/90 dark:hover:bg-primary/80"
                size="sm"
              >
                MAX
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="h-[500px]"> {/* Increased height for better visibility */}
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                <CartesianGrid 
                  strokeDasharray="3 3" 
                  stroke="rgba(156, 163, 175, 0.2)" 
                  vertical={false} 
                />
                <XAxis 
                  dataKey="date"
                  tickFormatter={(date) => {
                    const d = new Date(date);
                    return `${d.getMonth() + 1}/${d.getDate()}`;
                  }}
                  stroke="#9ca3af"
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={{ stroke: '#e5e7eb' }}
                  minTickGap={30}
                />
                <YAxis 
                  yAxisId="price"
                  domain={['auto', 'auto']}
                  orientation="left"
                  stroke="#9ca3af"
                  tickFormatter={(value) => `$${value.toFixed(0)}`}
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={{ stroke: '#e5e7eb' }}
                  width={80}
                />
                <YAxis 
                  yAxisId="volume"
                  orientation="right"
                  domain={['auto', 'auto']}
                  stroke="#9ca3af"
                  tickFormatter={(value) => {
                    if (Math.abs(value) >= 1e9) {
                      return `$${(value / 1e9).toFixed(1)}B`;
                    } else if (Math.abs(value) >= 1e6) {
                      return `$${(value / 1e6).toFixed(1)}M`;
                    } else if (Math.abs(value) >= 1e3) {
                      return `$${(value / 1e3).toFixed(1)}K`;
                    }
                    return `$${value.toFixed(1)}`;
                  }}
                  tick={{ 
                    fontSize: 12,
                    fill: '#374151',
                    fontWeight: 600
                  }}
                  tickLine={false}
                  axisLine={{ stroke: '#e5e7eb' }}
                  width={80}
                  label={{ 
                    value: 'Volume', 
                    angle: 90, 
                    position: 'right',
                    offset: 15,
                    style: {
                      textAnchor: 'middle',
                      fill: hideVolume ? '#9CA3AF' : '#374151',
                      fontSize: 12,
                      fontWeight: 600,
                      textDecoration: hideVolume ? 'line-through' : 'none'
                    }
                  }}
                  hide={hideVolume}
                />
                <Tooltip 
                  content={<CustomTooltip />}
                  wrapperStyle={{ outline: 'none' }}
                  cursor={{ 
                    stroke: 'rgba(156, 163, 175, 0.2)',
                    strokeWidth: 1,
                    strokeDasharray: '5 5'
                  }}
                />
                <Legend 
                  verticalAlign="top"
                  height={36}
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{ paddingTop: '10px' }}
                  onClick={(e) => {
                    if (e.dataKey === 'volume') {
                      setHideVolume(!hideVolume);
                    }
                  }}
                  formatter={(value, entry: any) => (
                    <span style={{ 
                      color: entry.dataKey === 'volume' && hideVolume ? '#9CA3AF' : '#374151',
                      textDecoration: entry.dataKey === 'volume' && hideVolume ? 'line-through' : 'none',
                      cursor: 'pointer'
                    }}>
                      {value}
                    </span>
                  )}
                />
                <Line
                  type="monotone"
                  dataKey="price"
                  name="Price"
                  stroke="#2563eb"
                  yAxisId="price"
                  dot={false}
                  strokeWidth={2}
                  activeDot={{ r: 6, stroke: '#2563eb', strokeWidth: 2, fill: 'white' }}
                />
                <Bar
                  dataKey="volume"
                  name="Volume"
                  yAxisId="volume"
                  fill="rgba(37, 99, 235, 0.3)"
                  stroke="rgba(37, 99, 235, 0.6)"
                  strokeWidth={2}
                  radius={[2, 2, 0, 0]}
                  hide={hideVolume}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Price Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Current Price Card */}
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <h3 className="text-sm font-medium text-gray-500">Current Price</h3>
            <div className="mt-2 space-y-2">
              <div>
                {/* Price, Change, and Sparkline Section */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold">${latestData.close.toFixed(2)}</p>
                    <div className={`flex items-center text-sm font-medium ${
                      latestData.change >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      <span className="font-medium">
                        {latestData.change >= 0 ? '+' : ''}{latestData.changePercent.toFixed(2)}%
                      </span>
                      <span className="text-xs mx-2">•</span>
                      <span className="font-medium">
                        {latestData.change >= 0 ? '+' : ''}${Math.abs(latestData.change).toFixed(2)}
                      </span>
                      <span className="text-xs ml-2">Today</span>
                    </div>
                  </div>
                  {/* Sparkline aligned with price */}
                  <div className="h-12 w-24 mt-1">
                    <Sparklines data={historicalData.slice(-30).map(d => d.close)} margin={2}>
                      <SparklinesLine 
                        color={latestData.change >= 0 ? "#16a34a" : "#dc2626"} 
                        style={{ strokeWidth: 1.5, fill: "none" }}
                      />
                    </Sparklines>
                  </div>
                </div>

                {/* Trading Range Section */}
                <div className="pt-3 mt-2 border-t border-gray-100 dark:border-gray-800 space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-xs text-gray-500">Open</span>
                    <span className="text-xs font-medium">${latestData.open.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-gray-500">High</span>
                    <span className="text-xs font-medium">${latestData.high.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-gray-500">Low</span>
                    <span className="text-xs font-medium">${latestData.low.toFixed(2)}</span>
                  </div>
                  {/* VWAP Section */}
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <span className="text-xs text-gray-500">VWAP</span>
                      <span className="text-xs ml-1 text-gray-400">(Vol. Wtd. Avg.)</span>
                    </div>
                    <div className="flex items-center">
                      <span className={`text-xs font-medium ${
                        latestData.close > latestData.vwap 
                          ? 'text-green-500' 
                          : latestData.close < latestData.vwap 
                          ? 'text-red-500' 
                          : 'text-gray-500'
                      }`}>
                        ${latestData.vwap.toFixed(2)}
                        <span className="text-[10px] ml-1 opacity-75">
                          ({latestData.close > latestData.vwap 
                            ? '↑' 
                            : latestData.close < latestData.vwap 
                            ? '↓' 
                            : '='})
                        </span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 2. Market Overview Card - Key company metrics */}
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <h3 className="text-sm font-medium text-gray-500">Market Overview</h3>
            <div className="mt-2 space-y-2">
              {/* Market Cap */}
              <div className="flex justify-between items-center">
                <div>
                  <span className="text-xs text-gray-500">Market Cap</span>
                  <div className="h-6 w-20">
                    <Sparklines data={historicalData.slice(-30).map(d => d.close * d.volume)}>
                      <SparklinesLine color="#2563eb" />
                    </Sparklines>
                  </div>
                </div>
                <span className="text-sm font-medium">
                  {stockData?.marketCap ? (
                    stockData.marketCap >= 1_000_000_000_000
                      ? `$${(stockData.marketCap / 1_000_000_000_000).toFixed(2)}T`
                      : stockData.marketCap >= 1_000_000_000
                      ? `$${(stockData.marketCap / 1_000_000_000).toFixed(2)}B`
                      : `$${(stockData.marketCap / 1_000_000).toFixed(2)}M`
                  ) : 'N/A'}
                </span>
              </div>

              {/* Shares Outstanding */}
              <div className="flex justify-between items-center">
                <div>
                  <span className="text-xs text-gray-500">Shares Outstanding</span>
                  <div className="h-6 w-20">
                    <Sparklines data={historicalData.slice(-30).map(d => d.volume)}>
                      <SparklinesLine color="#2563eb" />
                    </Sparklines>
                  </div>
                </div>
                <span className="text-sm font-medium">
                  {stockData?.sharesOutstanding 
                    ? `${(stockData.sharesOutstanding / 1_000_000).toFixed(2)}M`
                    : 'N/A'}
                </span>
              </div>

              {/* P/E Ratio */}
              <div className="flex justify-between items-center">
                <div>
                  <span className="text-xs text-gray-500">P/E Ratio</span>
                  <div className="h-6 w-20">
                    <Sparklines data={historicalData.slice(-30).map(d => d.close / (stockData?.eps || 1))}>
                      <SparklinesLine color="#2563eb" />
                    </Sparklines>
                  </div>
                </div>
                <span className="text-sm font-medium">
                  {stockData?.pe ? stockData.pe.toFixed(2) : 'N/A'}
                </span>
              </div>

              {/* EPS */}
              <div className="flex justify-between items-center">
                <div>
                  <span className="text-xs text-gray-500">EPS</span>
                  <div className="h-6 w-20">
                    <Sparklines data={historicalData.slice(-30).map(d => stockData?.eps || 0)}>
                      <SparklinesLine color="#2563eb" />
                    </Sparklines>
                  </div>
                </div>
                <span className="text-sm font-medium">
                  {stockData?.eps ? `$${stockData.eps.toFixed(2)}` : 'N/A'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 3. Moving Averages Card - Technical indicators */}
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <h3 className="text-sm font-medium text-gray-500">Moving Averages</h3>
            <div className="mt-2 space-y-2">
              <div className="flex justify-between items-center">
                <div>
                  <span className="text-xs text-gray-500">SMA 20</span>
                  <div className="h-6 w-20">
                    <Sparklines data={historicalData.slice(-30).map(d => d.close)}>
                      <SparklinesLine color={stockData?.price > technicalIndicators?.sma20 ? "#16a34a" : "#dc2626"} />
                    </Sparklines>
                  </div>
                  <p className={`text-xs mt-0.5 ${
                    (stockData?.price || 0) > (technicalIndicators?.sma20 || 0) ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {(stockData?.price || 0) > (technicalIndicators?.sma20 || 0) ? 'Bullish Short-Term' : 'Bearish Short-Term'}
                  </p>
                </div>
                <span className={`text-sm font-medium ${
                  (stockData?.price || 0) > (technicalIndicators?.sma20 || 0) ? 'text-green-600' : 'text-red-600'
                }`}>${technicalIndicators?.sma20.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <div>
                  <span className="text-xs text-gray-500">SMA 50</span>
                  <div className="h-6 w-20">
                    <Sparklines data={historicalData.slice(-30).map(d => d.close)}>
                      <SparklinesLine color={stockData?.price > technicalIndicators?.sma50 ? "#16a34a" : "#dc2626"} />
                    </Sparklines>
                  </div>
                  <p className={`text-xs mt-0.5 ${
                    (stockData?.price || 0) > (technicalIndicators?.sma50 || 0) ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {(stockData?.price || 0) > (technicalIndicators?.sma50 || 0) ? 'Bullish Medium-Term' : 'Bearish Medium-Term'}
                  </p>
                </div>
                <span className={`text-sm font-medium ${
                  (stockData?.price || 0) > (technicalIndicators?.sma50 || 0) ? 'text-green-600' : 'text-red-600'
                }`}>${technicalIndicators?.sma50.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <div>
                  <span className="text-xs text-gray-500">SMA 200</span>
                  <div className="h-6 w-20">
                    <Sparklines data={historicalData.slice(-30).map(d => d.close)}>
                      <SparklinesLine color={stockData?.price > (sma200 || 0) ? "#16a34a" : "#dc2626"} />
                    </Sparklines>
                  </div>
                  <p className={`text-xs mt-0.5 ${
                    (stockData?.price || 0) > (sma200 || 0) ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {(stockData?.price || 0) > (sma200 || 0) ? 'Bullish Long-Term' : 'Bearish Long-Term'}
                  </p>
                </div>
                <span className={`text-sm font-medium ${
                  (stockData?.price || 0) > (sma200 || 0) ? 'text-green-600' : 'text-red-600'
                }`}>${sma200?.toFixed(2) || 'N/A'}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 4. Volume Card - Trading activity */}
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <h3 className="text-sm font-medium text-gray-500">Volume</h3>
            <div className="mt-2 space-y-2">
              <div>
                <p className="text-2xl font-bold">
                  {formatLargeNumber(stockData?.volume || 0)}  {/* 44,991,117 from quote endpoint */}
                </p>
                <p className={`text-xs ${
                  (stockData?.volume || 0) > (stockData?.avgVolume || 0) ? 'text-green-600' : 'text-red-600'
                }`}>
                  {(stockData?.volume || 0) > (stockData?.avgVolume || 0) ? 'Above' : 'Below'} Average Volume
                  <span className="text-xs ml-1 text-gray-400">
                    ({formatLargeNumber(stockData?.avgVolume || 0)})  {/* 48,832,289 from quote endpoint */}
                  </span>
                </p>
                {/* Volume trend sparkline */}
                <div className="h-8 my-1">
                  <Sparklines data={historicalData.slice(-30).map(d => d.volume)} height={20}>
                    <SparklinesBars style={{ fill: "rgba(37, 99, 235, 0.3)", strokeWidth: 2 }} />
                  </Sparklines>
                </div>
              </div>
              <div className="pt-2 border-t border-gray-100 dark:border-gray-800 space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500">Avg Volume</span>
                  <span className="text-sm font-medium">
                    {formatLargeNumber(stockData?.avgVolume || 0)}  {/* 48,832,289 from quote endpoint */}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Add this helper function at the top level
const formatLargeNumber = (value: number) => {
  if (value === undefined || value === null || isNaN(value)) return 'N/A';
  if (value >= 1_000_000_000) {
    return `${(value / 1_000_000_000).toFixed(2)}B`;
  } else if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(2)}M`;
  } else if (value >= 1_000) {
    return `${(value / 1_000).toFixed(2)}K`;
  }
  return value.toLocaleString();
};

interface ValuationTabProps {
  stockData: StockData | null;
  financialData: any[];
  valuationData: any;
}

function ValuationTab({ stockData, financialData, valuationData }: ValuationTabProps) {
  const [grahamValuation, setGrahamValuation] = useState<GrahamValuation | null>(null);
  const [dividendData, setDividendData] = useState<any>(null);
  
  // Add useEffect for fetching dividend data
  useEffect(() => {
    async function fetchDividendData() {
      if (!stockData?.symbol) return;
      
      try {
        const response = await fetch(`http://localhost:8080/api/stocks/dividends/${stockData.symbol}`);
        if (response.ok) {
          const data = await response.json();
          setDividendData(data);
        }
      } catch (error) {
        console.error('Error fetching dividend data:', error);
      }
    }

    fetchDividendData();
  }, [stockData?.symbol]);

  if (!stockData || !valuationData) return null;

  const metrics = valuationData.metrics || {};
  const ratios = valuationData.ratios || {};
  const ttmRatios = valuationData.ttmRatios || {};
  // Now add the useEffect after ratios is defined
  useEffect(() => {
    console.log('ValuationData:', valuationData);
    console.log('Ratios:', ratios);
    console.log('Ratios TTM:', ttmRatios);
    console.log('P/B Ratio:', ratios.priceToBookRatioTTM);
    console.log('All TTM Ratios:', valuationData.ratios);
  }, [valuationData, ratios]);

  useEffect(() => {
    const fetchGrahamValuation = async () => {
      if (!stockData?.symbol) return;
      try {
        console.log('Fetching Graham valuation for:', stockData.symbol);
        const response = await axios.get(`${API_BASE_URL}/graham-valuation/${stockData.symbol}`);
        console.log('Graham valuation response:', response.data);
        if (response.data) {
          setGrahamValuation(response.data);
        }
      } catch (error) {
        console.error('Error fetching Graham valuation:', error);
      }
    };

    fetchGrahamValuation();
  }, [stockData?.symbol]);

  const formatValue = (value: any, isPercentage = false) => {
    if (value === undefined || value === null || isNaN(value)) return 'N/A';
    if (isPercentage) {
      return `${value >= 0 ? '' : '-'}${Math.abs(value).toFixed(2)}%`;
    }
    return value >= 0 ? value.toFixed(2) : `-${Math.abs(value).toFixed(2)}`;
  };

  const formatCurrency = (value: any) => {
    if (value === undefined || value === null || isNaN(value)) return 'N/A';
    const absValue = Math.abs(value);
    const sign = value < 0 ? '-' : '';
    
    if (absValue >= 1e9) {
      return `${sign}$${(absValue / 1e9).toFixed(2)}B`;
    } else if (absValue >= 1e6) {
      return `${sign}$${(absValue / 1e6).toFixed(2)}M`;
    } else if (absValue === 0) {
      return '$0.00';
    }
    return `${sign}$${absValue.toFixed(2)}`;
  };

  const dcfValue = valuationData.dcf?.dcf;
  const currentPrice = stockData.price;
  const percentageFromFairValue = dcfValue && currentPrice
    ? ((currentPrice - dcfValue) / currentPrice) * 100
    : null;

  return (
    <div className="space-y-6">
      {grahamValuation && (
        <>
          {/* 1. Intrinsic Value Analysis Card */}
          <Card>
            <CardHeader>
              <CardTitle>Intrinsic Value Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Current Price</h3>
                  <p className="text-2xl font-bold">{formatCurrency(grahamValuation.currentPrice)}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">DCF Value</h3>
                  <p className="text-2xl font-bold">
                    {dcfValue > 0 ? formatCurrency(dcfValue) : 'N/A'}
                  </p>
                  {dcfValue > 0 && currentPrice > 0 && (
                    <p className={`text-xs mt-1 ${currentPrice > dcfValue ? 'text-red-500' : 'text-green-500'}`}>
                      {Math.abs(percentageFromFairValue || 0).toFixed(2)}% {currentPrice > dcfValue ? 'overvalued' : 'undervalued'}
                    </p>
                  )}
                  {(dcfValue <= 0 || currentPrice <= 0) && (
                    <p className="text-xs mt-1 text-gray-500">Insufficient data for DCF valuation</p>
                  )}
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Graham Number</h3>
                  <p className="text-2xl font-bold">
                    {grahamValuation.grahamNumber > 0 ? formatCurrency(grahamValuation.grahamNumber) : 'N/A'}
                  </p>
                  {grahamValuation.grahamNumber > 0 && grahamValuation.currentPrice > 0 && (
                    <p className={`text-xs mt-1 ${grahamValuation.currentPrice > grahamValuation.grahamNumber ? 'text-red-500' : 'text-green-500'}`}>
                      {Math.abs(grahamValuation.grahamMarginOfSafety || 0).toFixed(2)}% {grahamValuation.currentPrice > grahamValuation.grahamNumber ? 'overvalued' : 'undervalued'}
                    </p>
                  )}
                  {(grahamValuation.grahamNumber <= 0 || grahamValuation.currentPrice <= 0) && (
                    <p className="text-xs mt-1 text-gray-500">Negative earnings or book value</p>
                  )}
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Lynch Value</h3>
                  <p className="text-2xl font-bold">
                    {grahamValuation.lynchFairValue > 0 ? formatCurrency(grahamValuation.lynchFairValue) : 'N/A'}
                  </p>
                  {grahamValuation.lynchFairValue > 0 && grahamValuation.currentPrice > 0 && (
                    <p className={`text-xs mt-1 ${grahamValuation.currentPrice > grahamValuation.lynchFairValue ? 'text-red-500' : 'text-green-500'}`}>
                      {Math.abs(grahamValuation.lynchMarginOfSafety).toFixed(2)}% {grahamValuation.currentPrice > grahamValuation.lynchFairValue ? 'overvalued' : 'undervalued'}
                    </p>
                  )}
                  {(grahamValuation.lynchFairValue <= 0 || grahamValuation.currentPrice <= 0) && (
                    <p className="text-xs mt-1 text-gray-500">Negative growth rate or earnings</p>
                  )}
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Buffett Value</h3>
                  <p className="text-2xl font-bold">
                    {grahamValuation.buffettPerShareValue > 0 ? formatCurrency(grahamValuation.buffettPerShareValue) : 'N/A'}
                  </p>
                  {grahamValuation.buffettPerShareValue > 0 && grahamValuation.currentPrice > 0 && (
                    <p className={`text-xs mt-1 ${grahamValuation.currentPrice > grahamValuation.buffettPerShareValue ? 'text-red-500' : 'text-green-500'}`}>
                      {Math.abs(grahamValuation.buffettMarginOfSafety).toFixed(2)}% {grahamValuation.currentPrice > grahamValuation.buffettPerShareValue ? 'overvalued' : 'undervalued'}
                    </p>
                  )}
                  {(grahamValuation.buffettPerShareValue <= 0 || grahamValuation.currentPrice <= 0) && (
                    <p className="text-xs mt-1 text-gray-500">Negative owner earnings</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 2. Key Financial Ratios Card - Core valuation ratios */}
          <Card>
            <CardHeader>
              <CardTitle>Key Financial Ratios (TTM)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {/* Profitability Metrics */}
                <div>
                  <h3 className="text-sm font-medium text-gray-500">EPS</h3>
                  <p className="text-2xl font-bold">{formatCurrency(stockData?.eps)}</p>
                  <p className={`text-xs mt-1 ${
                    stockData?.eps < 0 ? 'text-red-500' :
                    stockData?.eps > 0 ? 'text-green-500' : 'text-yellow-500'
                  }`}>
                    {stockData?.eps < 0 ? 'Loss making' :
                     stockData?.eps > 0 ? 'Profitable' : 'Break-even'}
                  </p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500">ROE</h3>
                  <p className="text-2xl font-bold">{formatValue(ttmRatios.returnOnEquityTTM, true)}</p>
                  <p className={`text-xs mt-1 ${
                    ttmRatios.returnOnEquityTTM < 0 ? 'text-red-500' :
                    ttmRatios.returnOnEquityTTM > 15 ? 'text-green-500' : 
                    ttmRatios.returnOnEquityTTM > 10 ? 'text-yellow-500' : 'text-red-500'
                  }`}>
                    {ttmRatios.returnOnEquityTTM < 0 ? 'Negative Returns' :
                     ttmRatios.returnOnEquityTTM > 15 ? 'Strong Returns' : 
                     ttmRatios.returnOnEquityTTM > 10 ? 'Good Returns' : 'Poor Returns'}
                  </p>
                </div>

                {/* Valuation Metrics */}
                <div>
                  <h3 className="text-sm font-medium text-gray-500">P/E Ratio</h3>
                  <p className="text-2xl font-bold">{formatValue(stockData.pe)}</p>
                  <p className={`text-xs mt-1 ${
                    ttmRatios.peRatioTTM < 0 ? 'text-red-500' : 
                    ttmRatios.peRatioTTM < 15 ? 'text-green-500' : 
                    ttmRatios.peRatioTTM < 25 ? 'text-yellow-500' : 'text-red-500'
                  }`}>
                    {ttmRatios.peRatioTTM < 0 ? 'Negative Earnings' : 
                     ttmRatios.peRatioTTM < 15 ? 'Potentially Undervalued' : 
                     ttmRatios.peRatioTTM < 25 ? 'Fairly Valued' : 'Potentially Overvalued'}
                  </p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500">PEG Ratio</h3>
                  <p className="text-2xl font-bold">{formatValue(ttmRatios.priceEarningsToGrowthRatioTTM)}</p>
                  <p className={`text-xs mt-1 ${
                    ttmRatios.priceEarningsToGrowthRatioTTM < 0 ? 'text-red-500' :
                    ttmRatios.priceEarningsToGrowthRatioTTM < 1 ? 'text-green-500' : 
                    ttmRatios.priceEarningsToGrowthRatioTTM < 2 ? 'text-yellow-500' : 'text-red-500'
                  }`}>
                    {ttmRatios.priceEarningsToGrowthRatioTTM < 0 ? 'Negative Growth Rate' :
                     ttmRatios.priceEarningsToGrowthRatioTTM < 1 ? 'Undervalued Growth' : 
                     ttmRatios.priceEarningsToGrowthRatioTTM < 2 ? 'Fair Growth Value' : 'Expensive Growth'}
                  </p>
                </div>

                {/* Asset-Based Valuation */}
                <div>
                  <h3 className="text-sm font-medium text-gray-500">P/B Ratio</h3>
                  <p className="text-2xl font-bold">{formatValue(ttmRatios.priceToBookRatioTTM)}</p>
                  <p className={`text-xs mt-1 ${
                    ttmRatios.priceToBookRatioTTM < 0 ? 'text-red-500' :
                    ttmRatios.priceToBookRatioTTM < 1 ? 'text-green-500' : 
                    ttmRatios.priceToBookRatioTTM < 3 ? 'text-yellow-500' : 'text-red-500'
                  }`}>
                    {ttmRatios.priceToBookRatioTTM < 0 ? 'Negative Book Value' :
                     ttmRatios.priceToBookRatioTTM < 1 ? 'Potentially Undervalued' : 
                     ttmRatios.priceToBookRatioTTM < 3 ? 'Fairly Valued' : 'Potentially Overvalued'}
                  </p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500">P/S Ratio</h3>
                  <p className="text-2xl font-bold">{formatValue(ttmRatios.priceToSalesRatioTTM)}</p>
                  <p className={`text-xs mt-1 ${
                    ttmRatios.priceToSalesRatioTTM < 0 ? 'text-red-500' :
                    ttmRatios.priceToSalesRatioTTM < 2 ? 'text-green-500' : 
                    ttmRatios.priceToSalesRatioTTM < 4 ? 'text-yellow-500' : 'text-red-500'
                  }`}>
                    {ttmRatios.priceToSalesRatioTTM < 0 ? 'Negative Sales' :
                     ttmRatios.priceToSalesRatioTTM < 2 ? 'Potentially Undervalued' : 
                     ttmRatios.priceToSalesRatioTTM < 4 ? 'Fairly Valued' : 'Potentially Overvalued'}
                  </p>
                </div>

                {/* Enterprise Value Metrics */}
                <div>
                  <h3 className="text-sm font-medium text-gray-500">EV/EBITDA</h3>
                  <p className="text-2xl font-bold">{formatValue(ttmRatios.enterpriseValueMultipleTTM)}</p>
                  <p className={`text-xs mt-1 ${
                    ttmRatios.enterpriseValueMultipleTTM < 0 ? 'text-red-500' :
                    ttmRatios.enterpriseValueMultipleTTM < 10 ? 'text-green-500' : 
                    ttmRatios.enterpriseValueMultipleTTM < 15 ? 'text-yellow-500' : 'text-red-500'
                  }`}>
                    {ttmRatios.enterpriseValueMultipleTTM < 0 ? 'Negative EBITDA' :
                     ttmRatios.enterpriseValueMultipleTTM < 10 ? 'Potentially Cheap' : 
                     ttmRatios.enterpriseValueMultipleTTM < 15 ? 'Fairly Valued' : 'Potentially Expensive'}
                  </p>
                </div>

                {/* Financial Health Metrics */}
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Current Ratio</h3>
                  <p className="text-2xl font-bold">{formatValue(ttmRatios.currentRatioTTM)}</p>
                  <p className={`text-xs mt-1 ${
                    ttmRatios.currentRatioTTM < 0 ? 'text-red-500' :
                    ttmRatios.currentRatioTTM > 2 ? 'text-green-500' : 
                    ttmRatios.currentRatioTTM > 1 ? 'text-yellow-500' : 'text-red-500'
                  }`}>
                    {ttmRatios.currentRatioTTM < 0 ? 'Negative Working Capital' :
                     ttmRatios.currentRatioTTM > 2 ? 'Strong Liquidity' : 
                     ttmRatios.currentRatioTTM > 1 ? 'Adequate Liquidity' : 'Weak Liquidity'}
                  </p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500">Debt Ratio</h3>
                  <p className="text-2xl font-bold">{formatValue(ttmRatios.debtRatioTTM)}</p>
                  <p className={`text-xs mt-1 ${
                    ttmRatios.debtRatioTTM < 0 ? 'text-red-500' :
                    ttmRatios.debtRatioTTM < 0.4 ? 'text-green-500' : 
                    ttmRatios.debtRatioTTM < 0.6 ? 'text-yellow-500' : 'text-red-500'
                  }`}>
                    {ttmRatios.debtRatioTTM < 0 ? 'Negative Assets' :
                     ttmRatios.debtRatioTTM < 0.4 ? 'Conservative Financing' : 
                     ttmRatios.debtRatioTTM < 0.6 ? 'Moderate Leverage' : 'High Leverage'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 3. Per Share Metrics Card - Fundamental per share values */}
          <Card>
            <CardHeader>
              <CardTitle>Per Share Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Revenue Per Share</h3>
                  <p className="text-2xl font-bold">{formatCurrency(metrics.raw?.revenuePerShareTTM)}</p>
                  <p className={`text-xs mt-1 ${
                    metrics.raw?.revenuePerShareTTM > metrics.raw?.bookValuePerShareTTM * 2 ? 'text-green-500' : 
                    metrics.raw?.revenuePerShareTTM > metrics.raw?.bookValuePerShareTTM ? 'text-yellow-500' : 'text-red-500
                  }`}>
                    {metrics.raw?.revenuePerShareTTM > metrics.raw?.bookValuePerShareTTM * 2 ? 'Strong revenue generation' : 
                     metrics.raw?.revenuePerShareTTM > metrics.raw?.bookValuePerShareTTM ? 'Moderate revenue generation' : 'Low revenue generation'}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Net Income Per Share</h3>
                  <p className="text-2xl font-bold">{formatCurrency(metrics.raw?.netIncomePerShareTTM)}</p>
                  <p className={`text-xs mt-1 ${
                    metrics.raw?.netIncomePerShareTTM > 0 ? 'text-green-500' : 'text-red-500
                  }`}>
                    {metrics.raw?.netIncomePerShareTTM > 0 ? 'Profitable' : 'Loss making'}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Operating Cash Flow Per Share</h3>
                  <p className="text-2xl font-bold">{formatCurrency(metrics.raw?.operatingCashFlowPerShareTTM)}</p>
                  <p className={`text-xs mt-1 ${
                    metrics.raw?.operatingCashFlowPerShareTTM > 0 ? 'text-green-500' : 'text-red-500
                  }`}>
                    {metrics.raw?.operatingCashFlowPerShareTTM > 0 ? 'Positive operations' : 'Negative operations'}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Free Cash Flow Per Share</h3>
                  <p className="text-2xl font-bold">{formatCurrency(metrics.raw?.freeCashFlowPerShareTTM)}</p>
                  <p className={`text-xs mt-1 ${
                    metrics.raw?.freeCashFlowPerShareTTM > 0 ? 'text-green-500' : 
                    metrics.raw?.freeCashFlowPerShareTTM === 0 ? 'text-yellow-500' : 'text-red-500'
                  }`}>
                    {metrics.raw?.freeCashFlowPerShareTTM > 0 ? 'Positive cash generation' : 
                     metrics.raw?.freeCashFlowPerShareTTM === 0 ? 'Break-even cash flow' : 'Negative cash generation'}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Book Value Per Share</h3>
                  <p className="text-2xl font-bold">{formatCurrency(metrics.raw?.bookValuePerShareTTM)}</p>
                  <p className={`text-xs mt-1 ${
                    metrics.raw?.bookValuePerShareTTM > currentPrice ? 'text-green-500' : 
                    metrics.raw?.bookValuePerShareTTM > currentPrice * 0.5 ? 'text-yellow-500' : 'text-red-500'
                  }`}>
                    {metrics.raw?.bookValuePerShareTTM > currentPrice ? 'Above market price' : 
                     metrics.raw?.bookValuePerShareTTM > currentPrice * 0.5 ? 'Moderate asset backing' : 'Low asset backing'}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Tangible Book Value Per Share</h3>
                  <p className="text-2xl font-bold">{formatCurrency(metrics.raw?.tangibleBookValuePerShareTTM)}</p>
                  <p className={`text-xs mt-1 ${
                    metrics.raw?.tangibleBookValuePerShareTTM > currentPrice ? 'text-green-500' : 
                    metrics.raw?.tangibleBookValuePerShareTTM > currentPrice * 0.5 ? 'text-yellow-500' : 'text-red-500'
                  }`}>
                    {metrics.raw?.tangibleBookValuePerShareTTM > currentPrice ? 'Strong tangible assets' : 
                     metrics.raw?.tangibleBookValuePerShareTTM > currentPrice * 0.5 ? 'Moderate tangible assets' : 'Low tangible assets'}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Cash Per Share</h3>
                  <p className="text-2xl font-bold">{formatCurrency(metrics.raw?.cashPerShareTTM)}</p>
                  <p className={`text-xs mt-1 ${
                    metrics.raw?.cashPerShareTTM > currentPrice * 0.2 ? 'text-green-500' : 
                    metrics.raw?.cashPerShareTTM > currentPrice * 0.1 ? 'text-yellow-500' : 'text-red-500'
                  }`}>
                    {metrics.raw?.cashPerShareTTM > currentPrice * 0.2 ? 'Strong cash position' : 
                     metrics.raw?.cashPerShareTTM > currentPrice * 0.1 ? 'Adequate cash position' : 'Low cash position'}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">CapEx Per Share</h3>
                  <p className="text-2xl font-bold">{formatCurrency(metrics.raw?.capexPerShareTTM)}</p>
                  <p className={`text-xs mt-1 ${
                    metrics.raw?.capexPerShareTTM > metrics.raw?.operatingCashFlowPerShareTTM * 0.5 ? 'text-yellow-500' : 
                    metrics.raw?.capexPerShareTTM > metrics.raw?.operatingCashFlowPerShareTTM * 0.2 ? 'text-green-500' : 'text-gray-500'
                  }`}>
                    {metrics.raw?.capexPerShareTTM > metrics.raw?.operatingCashFlowPerShareTTM * 0.5 ? 'High investment' : 
                     metrics.raw?.capexPerShareTTM > metrics.raw?.operatingCashFlowPerShareTTM * 0.2 ? 'Moderate investment' : 'Low investment'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 4. Profitability & Returns Card - Performance metrics */}
          <Card>
            <CardHeader>
              <CardTitle>Profitability & Returns</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Return on Equity (ROE)</h3>
                  <p className="text-2xl font-bold">{formatValue(metrics.raw?.roeTTM * 100, true)}</p>
                  <p className={`text-xs mt-1 ${
                    (metrics.raw?.roeTTM || 0) > 0.15 ? 'text-green-500' : 
                    (metrics.raw?.roeTTM || 0) > 0.10 ? 'text-yellow-500' : 'text-red-500'
                  }`}>
                    {(metrics.raw?.roeTTM || 0) > 0.15 ? 'Strong profit from shareholder money' : 
                     (metrics.raw?.roeTTM || 0) > 0.10 ? 'Good profit from shareholder money' : 'Low profit from shareholder money'}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Return on Invested Capital (ROIC)</h3>
                  <p className="text-2xl font-bold">{formatValue(metrics.raw?.roicTTM * 100, true)}</p>
                  <p className={`text-xs mt-1 ${
                    (metrics.raw?.roicTTM || 0) > 0.12 ? 'text-green-500' : 
                    (metrics.raw?.roicTTM || 0) > 0.08 ? 'text-yellow-500' : 'text-red-500'
                  }`}>
                    {(metrics.raw?.roicTTM || 0) > 0.12 ? 'Excellent return on investments' : 
                     (metrics.raw?.roicTTM || 0) > 0.08 ? 'Fair return on investments' : 'Poor return on investments'}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Return on Assets (ROA)</h3>
                  <p className="text-2xl font-bold">{formatValue(metrics.raw?.returnOnTangibleAssetsTTM * 100, true)}</p>
                  <p className={`text-xs mt-1 ${
                    (metrics.raw?.returnOnTangibleAssetsTTM || 0) > 0.10 ? 'text-green-500' : 
                    (metrics.raw?.returnOnTangibleAssetsTTM || 0) > 0.05 ? 'text-yellow-500' : 'text-red-500'
                  }`}>
                    {(metrics.raw?.returnOnTangibleAssetsTTM || 0) > 0.10 ? 'Efficient asset utilization' : 
                     (metrics.raw?.returnOnTangibleAssetsTTM || 0) > 0.05 ? 'Moderate asset utilization' : 'Poor asset utilization'}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Gross Profit Margin</h3>
                  <p className="text-2xl font-bold">{formatValue(ttmRatios.grossProfitMarginTTM * 100, true)}</p>
                  <p className={`text-xs mt-1 ${
                    (ttmRatios.grossProfitMarginTTM || 0) > 0.40 ? 'text-green-500' : 
                    (ttmRatios.grossProfitMarginTTM || 0) > 0.25 ? 'text-yellow-500' : 'text-red-500'
                  }`}>
                    {(ttmRatios.grossProfitMarginTTM || 0) > 0.40 ? 'Strong pricing power' : 
                     (ttmRatios.grossProfitMarginTTM || 0) > 0.25 ? 'Moderate pricing power' : 'Weak pricing power'}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Operating Margin</h3>
                  <p className="text-2xl font-bold">{formatValue(ttmRatios.operatingProfitMarginTTM * 100, true)}</p>
                  <p className={`text-xs mt-1 ${
                    (ttmRatios.operatingProfitMarginTTM || 0) > 0.25 ? 'text-green-500' : 
                    (ttmRatios.operatingProfitMarginTTM || 0) > 0.15 ? 'text-yellow-500' : 'text-red-500'
                  }`}>
                    {(ttmRatios.operatingProfitMarginTTM || 0) > 0.25 ? 'High operational efficiency' : 
                     (ttmRatios.operatingProfitMarginTTM || 0) > 0.15 ? 'Decent operational efficiency' : 'Low operational efficiency'}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Net Profit Margin</h3>
                  <p className="text-2xl font-bold">{formatValue(ttmRatios.netProfitMarginTTM * 100, true)}</p>
                  <p className={`text-xs mt-1 ${
                    (ttmRatios.netProfitMarginTTM || 0) > 0.20 ? 'text-green-500' : 
                    (ttmRatios.netProfitMarginTTM || 0) > 0.10 ? 'text-yellow-500' : 'text-red-500'
                  }`}>
                    {(ttmRatios.netProfitMarginTTM || 0) > 0.20 ? 'High bottom-line efficiency' : 
                     (ttmRatios.netProfitMarginTTM || 0) > 0.10 ? 'Moderate bottom-line efficiency' : 'Low bottom-line efficiency'}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Income Quality</h3>
                  <p className="text-2xl font-bold">{formatValue(metrics.raw?.incomeQualityTTM, true)}</p>
                  <p className={`text-xs mt-1 ${
                    (metrics.raw?.incomeQualityTTM || 0) > 1.2 ? 'text-green-500' : 
                    (metrics.raw?.incomeQualityTTM || 0) > 0.8 ? 'text-yellow-500' : 'text-red-500'
                  }`}>
                    {(metrics.raw?.incomeQualityTTM || 0) > 1.2 ? 'High earnings quality' : 
                     (metrics.raw?.incomeQualityTTM || 0) > 0.8 ? 'Fair earnings quality' : 'Poor earnings quality'}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Free Cash Flow Yield</h3>
                  <p className="text-2xl font-bold">{formatValue(metrics.raw?.freeCashFlowYieldTTM * 100, true)}</p>
                  <p className={`text-xs mt-1 ${
                    (metrics.raw?.freeCashFlowYieldTTM || 0) > 0.05 ? 'text-green-500' : 
                    (metrics.raw?.freeCashFlowYieldTTM || 0) > 0.02 ? 'text-yellow-500' : 'text-red-500'
                  }`}>
                    {(metrics.raw?.freeCashFlowYieldTTM || 0) > 0.05 ? 'Strong cash generation' : 
                     (metrics.raw?.freeCashFlowYieldTTM || 0) > 0.02 ? 'Moderate cash generation' : 'Weak cash generation'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

interface FinancialsTabProps {
  stockData: StockData | null;
  financialData: any[];
}

function FinancialsTab({ stockData, financialData }: { stockData: any, financialData: any }) {
  const [isLoading, setIsLoading] = useState(false);
  const [fullFinancials, setFullFinancials] = useState<any>(null);
  const [selectedMetric, setSelectedMetric] = useState<string>('all');
  const [activeTab, setActiveTab] = useState('income');

  useEffect(() => {
    async function fetchFinancialData() {
      if (!stockData?.symbol) return;
      
      setIsLoading(true);
      try {
        console.log('Fetching financial data for:', stockData.symbol);
        const response = await fetch(`${API_BASE_URL}/financials/${stockData.symbol}`);
        console.log('Financial API Response status:', response.status);
        
        if (response.ok) {
          const data = await response.json();
          console.log('Financial Data:', data);
          setFullFinancials(data);
        } else {
          console.error('Failed to fetch financials:', await response.text());
        }
      } catch (error) {
        console.error('Error fetching financial data:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchFinancialData();
  }, [stockData?.symbol]);  // Added dependency array and removed extra function call

  // Update the chart data processing
  const chartData = useMemo(() => {
    if (!fullFinancials) return [];
    
    switch (activeTab) {
      case 'income':
        console.log('Processing income statement data:', fullFinancials.income);
        return fullFinancials.income?.map((item: any) => ({
          year: new Date(item.date).getFullYear(),
          revenue: item.revenue,
          costOfRevenue: item.costOfRevenue,
          grossProfit: item.grossProfit,
          operatingIncome: item.operatingIncome,
          netIncome: item.netIncome,
          ebitda: item.ebitda,
          operatingExpenses: item.operatingExpenses,
          researchAndDevelopmentExpenses: item.researchAndDevelopmentExpenses,
          eps: item.eps,
          epsdiluted: item.epsdiluted,
          ebitdaratio: item.ebitdaratio,
          operatingIncomeRatio: item.operatingIncomeRatio,
          netIncomeRatio: item.netIncomeRatio
        })).sort((a: any, b: any) => a.year - b.year);

      case 'balance':
        console.log('Processing balance sheet data:', fullFinancials.balance);
        return fullFinancials.balance?.map((item: any) => ({
          year: new Date(item.date).getFullYear(),
          totalCurrentAssets: item.totalCurrentAssets,
          totalNonCurrentAssets: item.totalNonCurrentAssets,
          totalAssets: item.totalAssets,
          totalCurrentLiabilities: item.totalCurrentLiabilities,
          totalNonCurrentLiabilities: item.totalNonCurrentLiabilities,
          totalLiabilities: item.totalLiabilities,
          totalStockholdersEquity: item.totalStockholdersEquity,
          totalDebt: item.totalDebt
        })).sort((a: any, b: any) => a.year - b.year);

      case 'cashflow':
        console.log('Processing cash flow data:', fullFinancials.cashFlow);
        return fullFinancials.cashFlow?.map((item: any) => ({
          year: new Date(item.date).getFullYear(),
          operatingCashFlow: item.operatingCashFlow,
          netIncome: item.netIncome,
          depreciationAndAmortization: item.depreciationAndAmortization,
          capitalExpenditure: item.capitalExpenditure,
          netCashUsedForInvestingActivites: item.netCashUsedForInvestingActivites,
          netCashUsedProvidedByFinancingActivities: item.netCashUsedProvidedByFinancingActivities,
          freeCashFlow: item.freeCashFlow,
          netChangeInCash: item.netChangeInCash,
          // Add missing properties from API
          investmentsInPropertyPlantAndEquipment: item.investmentsInPropertyPlantAndEquipment,
          purchasesOfInvestments: item.purchasesOfInvestments,
          salesMaturitiesOfInvestments: item.salesMaturitiesOfInvestments,
          debtRepayment: item.debtRepayment,
          commonStockRepurchased: item.commonStockRepurchased,
          dividendsPaid: item.dividendsPaid
        })).sort((a: any, b: any) => a.year - b.year);

      default:
        return [];
    }
  }, [fullFinancials, activeTab]); // Add activeTab as dependency

  console.log('Rendered Chart Data:', chartData);

  // Add a helper function to format years for display
  const getYearRange = (data: any[]) => {
    if (!data || data.length === 0) return '';
    const years = data.length;
    return `Financial Statements (${years} Year${years > 1 ? 's' : ''})`;
  };

  // Filter data based on selected metric
  const getChartData = () => {
    if (selectedMetric === 'all') return chartData;
    return chartData.map((item: ChartDataItem) => ({
      year: item.year,
      [selectedMetric]: item[selectedMetric as keyof ChartDataItem]
    }));
  };

  // Handle legend click
  const handleLegendClick = (dataKey: string) => {
    setExcludedMetrics(prev => {
      const newExcluded = new Set(prev);
      if (newExcluded.has(dataKey)) {
        newExcluded.delete(dataKey);
      } else {
        newExcluded.add(dataKey);
      }
      return newExcluded;
    });
  };

  // Custom Legend with strike-through
  const CustomLegend = (props: any) => {
    const { payload } = props;
    return (
      <div className="flex justify-center gap-4 mt-2">
        {payload.map((entry: any, index: number) => (
          <div
            key={`item-${index}`}
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => handleLegendClick(entry.dataKey)}
          >
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: entry.color }}
            />
            <span 
              className={`text-sm ${excludedMetrics.has(entry.dataKey) ? 'line-through opacity-50' : ''}`}
            >
              {entry.value}
            </span>
          </div>
        ))}
      </div>
    );
  };

  // Inside FinancialsTab component, add this new component for metric cards
  const MetricCards = ({ data }: { data: any[] }) => {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Revenue Card */}
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <h3 className="text-sm font-medium text-gray-500">Revenue</h3>
            <div className="mt-2">
              <div className="h-24">
                <ResponsiveContainer width="100%" height="100%">
                  {data && data.length > 0 ? (
                    <BarChart data={data} margin={{ top: 15, right: 5, left: 5, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(156, 163, 175, 0.2)" vertical={false} />
                      <XAxis 
                        dataKey="year"
                        tick={{ fontSize: 10 }}
                        tickLine={false}
                        axisLine={{ stroke: '#e5e7eb' }}
                      />
                      <YAxis 
                        tick={{ fontSize: 10 }}
                        tickLine={false}
                        axisLine={{ stroke: '#e5e7eb' }} 
                        tickFormatter={(value) => {
                          const absValue = Math.abs(value);
                          if (absValue >= 1e9 || absValue <= -1e9) {
                            return `$${(value / 1e9).toFixed(1)}B`;
                          } else if (absValue >= 1e6 || absValue <= -1e6) {
                            return `$${(value / 1e6).toFixed(1)}M`;
                          } else if (absValue >= 1e3 || absValue <= -1e3) {
                            return `$${(value / 1e3).toFixed(1)}K`;
                          }
                          return `$${value.toFixed(1)}`;
                        }}
                        domain={[(dataMin: number) => {
                          // Check if there are any negative values in the data
                          const hasNegativeValues = data.some(item => item.revenue < 0);
                          if (!hasNegativeValues) {
                            return 0; // Start from 0 if no negative values
                          }
                          // If there are negative values, use the symmetric range logic
                          const maxAbsValue = Math.max(
                            Math.abs(Math.min(...data.map(d => d.revenue))),
                            Math.abs(Math.max(...data.map(d => d.revenue)))
                          );
                          return -maxAbsValue;
                        }, (dataMax: number) => {
                          const maxValue = Math.max(...data.map(d => d.revenue));
                          const roundedMax = Math.ceil(maxValue);
                          return roundedMax + (roundedMax < 10 ? 2 : Math.ceil(roundedMax * 0.2));
                        }]}
                      />
                      {(() => {
                        // Check if there are any negative values in the data
                        const hasNegativeValues = data.some(item => item.revenue < 0);
                        return hasNegativeValues ? <ReferenceLine y={0} stroke="#e5e7eb" /> : null;
                      })()}
                      <Bar 
                        dataKey="revenue"
                        fill="rgba(136, 132, 216, 0.3)"
                        stroke="rgba(136, 132, 216, 0.6)"
                        label={<CustomLabel fill="#8884d8" />}
                      />
                    </BarChart>
                  ) : (
                    <NoDataDisplay />
                  )}
                </ResponsiveContainer>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {data && data.length > 1 
                  ? `YoY Growth: ${((data[data.length - 1]?.revenue / data[data.length - 2]?.revenue - 1) * 100).toFixed(2)}%`
                  : 'YoY Growth: N/A'
                }
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Net Income Card */}
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <h3 className="text-sm font-medium text-gray-500">Net Income</h3>
            <div className="mt-2">
              <div className="h-24">
                <ResponsiveContainer width="100%" height="100%">
                  {data && data.length > 0 ? (
                    <BarChart data={data} margin={{ top: 15, right: 5, left: 5, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(156, 163, 175, 0.2)" vertical={false} />
                      <XAxis 
                        dataKey="year"
                        tick={{ fontSize: 10 }}
                        tickLine={false}
                        axisLine={{ stroke: '#e5e7eb' }}
                      />
                      <YAxis 
                        tick={{ fontSize: 10 }}
                        tickLine={false}
                        axisLine={{ stroke: '#e5e7eb' }} 
                        tickFormatter={(value) => {
                          const absValue = Math.abs(value);
                          if (absValue >= 1e9 || absValue <= -1e9) {
                            return `$${(value / 1e9).toFixed(1)}B`;
                          } else if (absValue >= 1e6 || absValue <= -1e6) {
                            return `$${(value / 1e6).toFixed(1)}M`;
                          } else if (absValue >= 1e3 || absValue <= -1e3) {
                            return `$${(value / 1e3).toFixed(1)}K`;
                          }
                          return `$${value.toFixed(1)}`;
                        }}
                        domain={[(dataMin: number) => {
                          // Check if there are any negative values in the data
                          const hasNegativeValues = data.some(item => item.netIncome < 0);
                          if (!hasNegativeValues) {
                            return 0; // Start from 0 if no negative values
                          }
                          // If there are negative values, use the symmetric range logic
                          const maxAbsValue = Math.max(
                            Math.abs(Math.min(...data.map(d => d.netIncome))),
                            Math.abs(Math.max(...data.map(d => d.netIncome)))
                          );
                          return -maxAbsValue;
                        }, (dataMax: number) => {
                          const maxValue = Math.max(...data.map(d => d.netIncome));
                          const roundedMax = Math.ceil(maxValue);
                          return roundedMax + (roundedMax < 10 ? 2 : Math.ceil(roundedMax * 0.2));
                        }]}
                      />
                      {(() => {
                        // Check if there are any negative values in the data
                        const hasNegativeValues = data.some(item => item.netIncome < 0);
                        return hasNegativeValues ? <ReferenceLine y={0} stroke="#e5e7eb" /> : null;
                      })()}
                      <Bar 
                        dataKey="netIncome"
                        fill="rgba(130, 202, 157, 0.3)"  // #82ca9d
                        stroke="rgba(130, 202, 157, 0.6)"
                        label={<CustomLabel fill="#82ca9d" />}
                      />
                    </BarChart>
                  ) : (
                    <NoDataDisplay />
                  )}
                </ResponsiveContainer>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {data && data.length > 1 
                  ? `YoY Growth: ${((data[data.length - 1]?.netIncome / data[data.length - 2]?.netIncome - 1) * 100).toFixed(2)}%`
                  : 'YoY Growth: N/A'
                }
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Operating Income Card */}
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <h3 className="text-sm font-medium text-gray-500">Operating Income</h3>
            <div className="mt-2">
              <div className="h-24">  {/* Increased from h-20 to h-24 */}
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data} margin={{ top: 15, right: 5, left: 5, bottom: 5 }}>  {/* Increased top margin */}
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(156, 163, 175, 0.2)" vertical={false} />
                    <XAxis 
                      dataKey="year"
                      tick={{ fontSize: 10 }}
                      tickLine={false}
                      axisLine={{ stroke: '#e5e7eb' }}
                    />
                    <YAxis 
                      tick={{ fontSize: 10 }}
                      tickLine={false}
                      axisLine={{ stroke: '#e5e7eb' }} 
                      tickFormatter={(value) => {
                        const absValue = Math.abs(value);
                        if (absValue >= 1e9 || absValue <= -1e9) {
                          return `$${(value / 1e9).toFixed(1)}B`;
                        } else if (absValue >= 1e6 || absValue <= -1e6) {
                          return `$${(value / 1e6).toFixed(1)}M`;
                        } else if (absValue >= 1e3 || absValue <= -1e3) {
                          return `$${(value / 1e3).toFixed(1)}K`;
                        }
                        return `$${value.toFixed(1)}`;
                      }}
                      domain={[(dataMin: number) => {
                        // Check if there are any negative values in the data
                        const hasNegativeValues = data.some(item => item.operatingIncome < 0);
                        if (!hasNegativeValues) {
                          return 0; // Start from 0 if no negative values
                        }
                        // If there are negative values, use the symmetric range logic
                        const maxAbsValue = Math.max(
                          Math.abs(Math.min(...data.map(d => d.operatingIncome))),
                          Math.abs(Math.max(...data.map(d => d.operatingIncome)))
                        );
                        return -maxAbsValue;
                      }, (dataMax: number) => {
                        const maxValue = Math.max(...data.map(d => d.operatingIncome));
                        const roundedMax = Math.ceil(maxValue);
                        return roundedMax + (roundedMax < 10 ? 2 : Math.ceil(roundedMax * 0.2));
                      }]}
                    />
                    {(() => {
                      // Check if there are any negative values in the data
                      const hasNegativeValues = data.some(item => item.operatingIncome < 0);
                      return hasNegativeValues ? <ReferenceLine y={0} stroke="#e5e7eb" /> : null;
                    })()}
                    <Bar 
                      dataKey="operatingIncome" // or whatever metric
                      fill="rgba(255, 198, 88, 0.3)" 
                      stroke="rgba(255, 198, 88, 0.6)"
                      label={<CustomLabel fill="#f59e0b" />}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {data && data.length > 1 
                  ? `YoY Growth: ${((data[data.length - 1]?.operatingIncome / data[data.length - 2]?.operatingIncome - 1) * 100).toFixed(2)}%`
                  : 'YoY Growth: N/A'
                }
              </p>
            </div>
          </CardContent>
        </Card>

        {/* EPS Card */}
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <h3 className="text-sm font-medium text-gray-500">Earnings Per Share (Basic)</h3>
            <div className="mt-2">
              <div className="h-24">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data} margin={{ top: 15, right: 5, left: 5, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(156, 163, 175, 0.2)" vertical={false} />
                    <XAxis 
                      dataKey="year"
                      tick={{ fontSize: 10 }}
                      tickLine={false}
                      axisLine={{ stroke: '#e5e7eb' }}
                    />
                    <YAxis 
                      tick={{ fontSize: 10 }}
                      tickLine={false}
                      axisLine={{ stroke: '#e5e7eb' }} 
                      tickFormatter={(value) => `$${value.toFixed(2)}`}
                      domain={[(dataMin: number) => {
                        // Check if there are any negative values in the data
                        const hasNegativeValues = data.some(item => item.eps < 0);
                        if (!hasNegativeValues) {
                          return 0; // Start from 0 if no negative values
                        }
                        // If there are negative values, use the symmetric range logic
                        const maxAbsValue = Math.max(
                          Math.abs(Math.min(...data.map(d => d.eps))),
                          Math.abs(Math.max(...data.map(d => d.eps)))
                        );
                        return -maxAbsValue;
                      }, (dataMax: number) => {
                        const maxValue = Math.max(...data.map(d => d.eps));
                        const roundedMax = Math.ceil(maxValue);
                        return roundedMax + (roundedMax < 10 ? 2 : Math.ceil(roundedMax * 0.2));
                      }]}
                    />
                    {(() => {
                      // Check if there are any negative values in the data
                      const hasNegativeValues = data.some(item => item.eps < 0);
                      return hasNegativeValues ? <ReferenceLine y={0} stroke="#e5e7eb" /> : null;
                    })()}
                    <Bar 
                      dataKey="eps"
                      fill="rgba(255, 128, 66, 0.3)"
                      stroke="rgba(255, 128, 66, 0.6)"
                      label={<CustomLabel fill="#ff8042" />}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {data && data.length > 1 
                  ? `YoY Growth: ${((data[data.length - 1]?.eps / data[data.length - 2]?.eps - 1) * 100).toFixed(2)}%`
                  : 'YoY Growth: N/A'
                }
              </p>
            </div>
          </CardContent>
        </Card>

        {/* EPS Diluted Card */}
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <h3 className="text-sm font-medium text-gray-500">EPS (Diluted)</h3>
            <div className="mt-2">
              <div className="h-24">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data} margin={{ top: 15, right: 5, left: 5, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(156, 163, 175, 0.2)" vertical={false} />
                    <XAxis 
                      dataKey="year"
                      tick={{ fontSize: 10 }}
                      tickLine={false}
                      axisLine={{ stroke: '#e5e7eb' }}
                    />
                    <YAxis 
                      tick={{ fontSize: 10 }}
                      tickLine={false}
                      axisLine={{ stroke: '#e5e7eb' }} 
                      tickFormatter={(value) => `$${value.toFixed(2)}`}
                      domain={[(dataMin: number) => {
                        // Check if there are any negative values in the data
                        const hasNegativeValues = data.some(item => item.epsdiluted < 0);
                        if (!hasNegativeValues) {
                          return 0; // Start from 0 if no negative values
                        }
                        // If there are negative values, use the symmetric range logic
                        const maxAbsValue = Math.max(
                          Math.abs(Math.min(...data.map(d => d.epsdiluted))),
                          Math.abs(Math.max(...data.map(d => d.epsdiluted)))
                        );
                        return -maxAbsValue;
                      }, (dataMax: number) => {
                        const maxValue = Math.max(...data.map(d => d.epsdiluted));
                        const roundedMax = Math.ceil(maxValue);
                        return roundedMax + (roundedMax < 10 ? 2 : Math.ceil(roundedMax * 0.2));
                      }]}
                    />
                    {(() => {
                      // Check if there are any negative values in the data
                      const hasNegativeValues = data.some(item => item.epsdiluted < 0);
                      return hasNegativeValues ? <ReferenceLine y={0} stroke="#e5e7eb" /> : null;
                    })()}
                    <Bar 
                      dataKey="epsdiluted"
                      fill="rgba(99, 102, 241, 0.3)"
                      stroke="rgba(99, 102, 241, 0.6)"
                      label={<CustomLabel fill="#6366f1" />}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {data && data.length > 1 
                  ? `YoY Growth: ${((data[data.length - 1]?.epsdiluted / data[data.length - 2]?.epsdiluted - 1) * 100).toFixed(2)}%`
                  : 'YoY Growth: N/A'
                }
              </p>
            </div>
          </CardContent>
        </Card>
        {/* Cost of Revenue Card */}
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <h3 className="text-sm font-medium text-gray-500">Cost of Revenue</h3>
            <div className="mt-2">
              <div className="h-24">  {/* Increased from h-20 to h-24 */}
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data} margin={{ top: 15, right: 5, left: 5, bottom: 5 }}>  {/* Increased top margin */}
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(156, 163, 175, 0.2)" vertical={false} />
                    <XAxis 
                      dataKey="year"
                      tick={{ fontSize: 10 }}
                      tickLine={false}
                      axisLine={{ stroke: '#e5e7eb' }}
                    />
                    <YAxis 
                      tick={{ fontSize: 10 }}
                      tickLine={false}
                      axisLine={{ stroke: '#e5e7eb' }} 
                      tickFormatter={(value) => {
                        const absValue = Math.abs(value);
                        if (absValue >=1e9 || absValue <= -1e9) {
                          return `$${(value / 1e9).toFixed(1)}B`;
                        } else if (absValue >= 1e6 || absValue <= -1e6) {
                          return `$${(value / 1e6).toFixed(1)}M`;
                        } else if (absValue >= 1e3 || absValue <= -1e3) {
                          return `$${(value / 1e3).toFixed(1)}K`;
                        }
                        return `$${value.toFixed(1)}`;
                      }}
                      domain={[(dataMin: number) => {
                        // Check if there are any negative values in the data
                        const hasNegativeValues = data.some(item => item.costOfRevenue < 0);
                        if (!hasNegativeValues) {
                          return 0; // Start from 0 if no negative values
                        }
                        // If there are negative values, use the symmetric range logic
                        const maxAbsValue = Math.max(
                          Math.abs(Math.min(...data.map(d => d.costOfRevenue))),
                            Math.abs(Math.max(...data.map(d => d.costOfRevenue)))
                          );
                          return -maxAbsValue;
                        }, (dataMax: number) => {
                          const maxValue = Math.max(...data.map(d => d.costOfRevenue));
                          const roundedMax = Math.ceil(maxValue);
                          return roundedMax + (roundedMax < 10 ? 2 : Math.ceil(roundedMax * 0.2));
                        }]}
                    />
                    {(() => {
                      // Check if there are any negative values in the data
                      const hasNegativeValues = data.some(item => item.costOfRevenue < 0);
                      return hasNegativeValues ? <ReferenceLine y={0} stroke="#e5e7eb" /> : null;
                    })()}
                    <Bar 
                      dataKey="costOfRevenue" // or whatever metric
                      fill="rgba(217, 70, 239, 0.3)" 
                      stroke="rgba(217, 70, 239, 0.6)"
                      label={<CustomLabel fill="#9b4dca" />}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {data && data.length >1 
                  ? `YoY Growth: ${((data[data.length - 1]?.costOfRevenue / data[data.length - 2]?.costOfRevenue - 1) * 100).toFixed(2)}%`
                  : 'YoY Growth: N/A'
                }
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Gross Profit Card */}
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <h3 className="text-sm font-medium text-gray-500">Gross Profit</h3>
            <div className="mt-2">
              <div className="h-24">  {/* Increased from h-20 to h-24 */}
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data} margin={{ top: 15, right: 5, left: 5, bottom: 5 }}>  {/* Increased top margin */}
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(156, 163, 175, 0.2)" vertical={false} />
                    <XAxis 
                      dataKey="year"
                      tick={{ fontSize: 10 }}
                      tickLine={false}
                      axisLine={{ stroke: '#e5e7eb' }}
                    />
                    <YAxis 
                      tick={{ fontSize: 10 }}
                      tickLine={false}
                      axisLine={{ stroke: '#e5e7eb' }} 
                      tickFormatter={(value) => {
                        const absValue = Math.abs(value);
                        if (absValue >=1e9 || absValue <= -1e9) {
                          return `$${(value / 1e9).toFixed(1)}B`;
                        } else if (absValue >= 1e6 || absValue <= -1e6) {
                          return `$${(value / 1e6).toFixed(1)}M`;
                        } else if (absValue >= 1e3 || absValue <= -1e3) {
                          return `$${(value / 1e3).toFixed(1)}K`;
                        }
                        return `$${value.toFixed(1)}`;
                      }}
                      domain={[(dataMin: number) => {
                        // Check if there are any negative values in the data
                        const hasNegativeValues = data.some(item => item.grossProfit < 0);
                        if (!hasNegativeValues) {
                          return 0; // Start from 0 if no negative values
                        }
                        // If there are negative values, use the symmetric range logic
                        const maxAbsValue = Math.max(
                          Math.abs(Math.min(...data.map(d => d.grossProfit))),
                          Math.abs(Math.max(...data.map(d => d.grossProfit)))
                        );
                        return -maxAbsValue;
                      }, (dataMax: number) => {
                        const maxValue = Math.max(...data.map(d => d.grossProfit));
                        const roundedMax = Math.ceil(maxValue);
                        return roundedMax + (roundedMax < 10 ? 2 : Math.ceil(roundedMax * 0.2));
                      }]}
                    />
                    {(() => {
                      // Check if there are any negative values in the data
                      const hasNegativeValues = data.some(item => item.grossProfit < 0);
                      return hasNegativeValues ? <ReferenceLine y={0} stroke="#e5e7eb" /> : null;
                    })()}
                    <Bar 
                      dataKey="grossProfit" // or whatever metric
                      fill="rgba(20, 184, 166, 0.3)" 
                      stroke="rgba(20, 184, 166, 0.6)"
                      label={<CustomLabel fill="#15a37b" />}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {data && data.length >1 
                  ? `YoY Growth: ${((data[data.length - 1]?.grossProfit / data[data.length - 2]?.grossProfit - 1) * 100).toFixed(2)}%`
                  : 'YoY Growth: N/A'
                }
              </p>
            </div>
          </CardContent>
        </Card>

        {/* EBITDA Card */}
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <h3 className="text-sm font-medium text-gray-500">EBITDA</h3>
            <div className="mt-2">
              <div className="h-24">  {/* Increased from h-20 to h-24 */}
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data} margin={{ top: 15, right: 5, left: 5, bottom: 5 }}>  {/* Increased top margin */}
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(156, 163, 175, 0.2)" vertical={false} />
                    <XAxis 
                      dataKey="year"
                      tick={{ fontSize: 10 }}
                      tickLine={false}
                      axisLine={{ stroke: '#e5e7eb' }}
                    />
                    <YAxis 
                      tick={{ fontSize: 10 }}
                      tickLine={false}
                      axisLine={{ stroke: '#e5e7eb' }} 
                      tickFormatter={(value) => {
                        const absValue = Math.abs(value);
                        if (absValue >=1e9 || absValue <= -1e9) {
                          return `$${(value / 1e9).toFixed(1)}B`;
                        } else if (absValue >= 1e6 || absValue <= -1e6) {
                          return `$${(value / 1e6).toFixed(1)}M`;
                        } else if (absValue >= 1e3 || absValue <= -1e3) {
                          return `$${(value / 1e3).toFixed(1)}K`;
                        }
                        return `$${value.toFixed(1)}`;
                      }}
                      domain={[(dataMin: number) => {
                        // Check if there are any negative values in the data
                        const hasNegativeValues = data.some(item => item.ebitda < 0);
                        if (!hasNegativeValues) {
                          return 0; // Start from 0 if no negative values
                        }
                        // If there are negative values, use the symmetric range logic
                        const maxAbsValue = Math.max(
                          Math.abs(Math.min(...data.map(d => d.ebitda))),
                          Math.abs(Math.max(...data.map(d => d.ebitda)))
                        );
                        return -maxAbsValue;
                      }, (dataMax: number) => {
                        const maxValue = Math.max(...data.map(d => d.ebitda));
                        const roundedMax = Math.ceil(maxValue);
                        return roundedMax + (roundedMax < 10 ? 2 : Math.ceil(roundedMax * 0.2));
                      }]}
                    />
                    {(() => {
                      // Check if there are any negative values in the data
                      const hasNegativeValues = data.some(item => item.ebitda < 0);
                      return hasNegativeValues ? <ReferenceLine y={0} stroke="#e5e7eb" /> : null;
                    })()}
                    <Bar 
                      dataKey="ebitda" // or whatever metric
                      fill="rgba(244, 63, 94, 0.3)" 
                      stroke="rgba(244, 63, 94, 0.6)"
                      label={<CustomLabel fill="#e11d48" />}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {data && data.length >1 
                  ? `YoY Growth: ${((data[data.length - 1]?.ebitda / data[data.length - 2]?.ebitda - 1) * 100).toFixed(2)}%`
                  : 'YoY Growth: N/A'
                }
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Operating Expenses Card */}
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <h3 className="text-sm font-medium text-gray-500">Operating Expenses</h3>
            <div className="mt-2">
              <div className="h-24">  {/* Increased from h-20 to h-24 */}
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data} margin={{ top: 15, right: 5, left: 5, bottom: 5 }}>  {/* Increased top margin */}
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(156, 163, 175, 0.2)" vertical={false} />
                    <XAxis 
                      dataKey="year"
                      tick={{ fontSize: 10 }}
                      tickLine={false}
                      axisLine={{ stroke: '#e5e7eb' }}
                    />
                    <YAxis 
                      tick={{ fontSize: 10 }}
                      tickLine={false}
                      axisLine={{ stroke: '#e5e7eb' }} 
                      tickFormatter={(value) => {
                        const absValue = Math.abs(value);
                        if (absValue >=1e9 || absValue <= -1e9) {
                          return `$${(value / 1e9).toFixed(1)}B`;
                        } else if (absValue >= 1e6 || absValue <= -1e6) {
                          return `$${(value / 1e6).toFixed(1)}M`;
                        } else if (absValue >= 1e3 || absValue <= -1e3) {
                          return `$${(value / 1e3).toFixed(1)}K`;
                        }
                        return `$${value.toFixed(1)}`;
                      }}
                      domain={[(dataMin: number) => {
                        // Check if there are any negative values in the data
                        const hasNegativeValues = data.some(item => item.operatingExpenses < 0);
                        if (!hasNegativeValues) {
                          return 0; // Start from 0 if no negative values
                        }
                        // If there are negative values, use the symmetric range logic
                        const maxAbsValue = Math.max(
                          Math.abs(Math.min(...data.map(d => d.operatingExpenses))),
                          Math.abs(Math.max(...data.map(d => d.operatingExpenses)))
                        );
                        return -maxAbsValue;
                      }, (dataMax: number) => {
                        const maxValue = Math.max(...data.map(d => d.operatingExpenses));
                        const roundedMax = Math.ceil(maxValue);
                        return roundedMax + (roundedMax < 10 ? 2 : Math.ceil(roundedMax * 0.2));
                      }]}
                    />
                    {(() => {
                      // Check if there are any negative values in the data
                      const hasNegativeValues = data.some(item => item.operatingExpenses < 0);
                      return hasNegativeValues ? <ReferenceLine y={0} stroke="#e5e7eb" /> : null;
                    })()}
                    <Bar 
                      dataKey="operatingExpenses" // or whatever metric
                      fill="rgba(14, 165, 233, 0.3)" 
                      stroke="rgba(14, 165, 233, 0.6)"
                      label={<CustomLabel fill="#3b82f6" />}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {data && data.length > 1 
                  ? `YoY Growth: ${((data[data.length - 1]?.operatingExpenses / data[data.length - 2]?.operatingExpenses - 1) * 100).toFixed(2)}%`
                  : 'YoY Growth: N/A'
                }
              </p>
            </div>
          </CardContent>
        </Card>

        {/* R&D Expenses Card */}
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <h3 className="text-sm font-medium text-gray-500">R&D Expenses</h3>
            <div className="mt-2">
              <div className="h-24">  {/* Increased from h-20 to h-24 */}
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data} margin={{ top: 15, right: 5, left: 5, bottom: 5 }}>  {/* Increased top margin */}
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(156, 163, 175, 0.2)" vertical={false} />
                    <XAxis 
                      dataKey="year"
                      tick={{ fontSize: 10 }}
                      tickLine={false}
                      axisLine={{ stroke: '#e5e7eb' }}
                    />
                    <YAxis 
                      tick={{ fontSize: 10 }}
                      tickLine={false}
                      axisLine={{ stroke: '#e5e7eb' }} 
                      tickFormatter={(value) => {
                        const absValue = Math.abs(value);
                        if (absValue >=1e9 || absValue <= -1e9) {
                          return `$${(value / 1e9).toFixed(1)}B`;
                        } else if (absValue >= 1e6 || absValue <= -1e6) {
                          return `$${(value / 1e6).toFixed(1)}M`;
                        } else if (absValue >= 1e3 || absValue <= -1e3) {
                          return `$${(value / 1e3).toFixed(1)}K`;
                        }
                        return `$${value.toFixed(1)}`;
                      }}
                      domain={[(dataMin: number) => {
                        // Check if there are any negative values in the data
                        const hasNegativeValues = data.some(item => item.researchAndDevelopmentExpenses < 0);
                        if (!hasNegativeValues) {
                          return 0; // Start from 0 if no negative values
                        }
                        // If there are negative values, use the symmetric range logic
                        const maxAbsValue = Math.max(
                          Math.abs(Math.min(...data.map(d => d.researchAndDevelopmentExpenses))),
                          Math.abs(Math.max(...data.map(d => d.researchAndDevelopmentExpenses)))
                        );
                        return -maxAbsValue;
                      }, (dataMax: number) => {
                        const maxValue = Math.max(...data.map(d => d.researchAndDevelopmentExpenses));
                        const roundedMax = Math.ceil(maxValue);
                        return roundedMax + (roundedMax < 10 ? 2 : Math.ceil(roundedMax * 0.2));
                      }]}
                    />
                    {(() => {
                      // Check if there are any negative values in the data
                      const hasNegativeValues = data.some(item => item.researchAndDevelopmentExpenses < 0);
                      return hasNegativeValues ? <ReferenceLine y={0} stroke="#e5e7eb" /> : null;
                    })()}
                    <Bar 
                      dataKey="researchAndDevelopmentExpenses" // or whatever metric
                      fill="rgba(8, 145, 178, 0.3)" 
                      stroke="rgba(8, 145, 178, 0.6)"
                      label={<CustomLabel fill="#0ea5e9" />}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {data && data.length > 1 
                  ? `YoY Growth: ${((data[data.length - 1]?.researchAndDevelopmentExpenses / data[data.length - 2]?.researchAndDevelopmentExpenses - 1) * 100).toFixed(2)}%`
                  : 'YoY Growth: N/A'
                }
              </p>
            </div>
          </CardContent>
        </Card>

        
      </div>
  
  );
};

  return (
    <div className="space-y-6">
      {/* Add subtabs and view toggle */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex space-x-2">
          <button
            onClick={() => setActiveTab('income')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'income'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Income Statement
          </button>
          <button
            onClick={() => setActiveTab('balance')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'balance'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Balance Sheet
          </button>
          <button
            onClick={() => setActiveTab('cashflow')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'cashflow'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Cash Flow
          </button>
        </div>
      </div>

      {activeTab === 'income' && chartData.length > 0 && (
        <MetricCards data={chartData} />
      )}
      {activeTab === 'balance' && chartData.length > 0 && (
        <BalanceMetricCards data={chartData} />
      )}
      {activeTab === 'cashflow' && chartData.length > 0 && (
        <CashFlowMetricCards data={chartData} />
      )}
    </div>
  );
}

function DividendsTab({ stockData }: { stockData: any }) {
  const [dividendData, setDividendData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'chart' | 'table'>('chart');
  const [chartType, setChartType] = useState<'bar' | 'line'>('line');

  useEffect(() => {
    async function fetchDividendData() {
      if (!stockData?.symbol) return;
      
      setIsLoading(true);
      try {
        console.log('Fetching dividend data for:', stockData.symbol);
        const response = await fetch(`http://localhost:8080/api/stocks/dividends/${stockData.symbol}`);
        console.log('Dividend API Response status:', response.status);
        
        if (response.ok) {
          const data = await response.json();
          console.log('Dividend Data:', data);
          setDividendData(data);
        } else {
          console.error('Failed to fetch dividends:', await response.text());
        }
      } catch (error) {
        console.error('Error fetching dividend data:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchDividendData(); // Call it once here
  }, [stockData?.symbol]); // Only depend on stockData.symbol

  const chartData = useMemo(() => {
    console.log('Processing dividend data:', dividendData);
    if (!dividendData?.historical) return [];
    
    const processedData = dividendData.historical
      .map((item: any) => ({
        date: new Date(item.date).getFullYear(),
        dividend: item.dividend,
        adjDividend: item.adjDividend
      }))
      .sort((a: any, b: any) => a.date - b.date);
    
    console.log('Processed chart data:', processedData);
    return processedData;
  }, [dividendData]);

  console.log('Current view mode:', viewMode);
  console.log('Current chart type:', chartType);
  console.log('Is loading:', isLoading);
  console.log('Rendered chart data:', chartData);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <div className="flex items-center justify-center space-x-2">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500" />
            <span>Loading dividend data...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Metrics Card */}
      <Card>
        <CardHeader>
          <CardTitle>Dividend Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-lg bg-muted">
              <div className="text-sm text-muted-foreground">Current Dividend</div>
              <div className="text-2xl font-bold">${dividendData?.metrics?.currentDividend?.toFixed(2)}</div>
            </div>
            <div className="p-4 rounded-lg bg-muted">
              <div className="text-sm text-muted-foreground">Annual Dividend</div>
              <div className="text-2xl font-bold">${dividendData?.metrics?.annualDividend?.toFixed(2)}</div>
            </div>
            <div className="p-4 rounded-lg bg-muted">
              <div className="text-sm text-muted-foreground">Dividend Growth</div>
              <div className="text-2xl font-bold">{dividendData?.metrics?.dividendGrowth?.toFixed(1)}%</div>
            </div>
            <div className="p-4 rounded-lg bg-muted">
              <div className="text-sm text-muted-foreground">Frequency</div>
              <div className="text-2xl font-bold">{dividendData?.metrics?.frequency}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Chart/Table Card */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Dividend History</CardTitle>
            <div className="flex items-center gap-4">
              {viewMode === 'chart' && (
                <select
                  className="border rounded p-1"
                  value={chartType}
                  onChange={(e) => setChartType(e.target.value as 'bar' | 'line')}
                >
                  <option value="bar">Bar Chart</option>
                  <option value="line">Line Chart</option>
                </select>
              )}
              <div className="flex items-center gap-2">
                <span className={`text-sm ${viewMode === 'chart' ? 'text-foreground' : 'text-muted-foreground'}`}>Chart</span>
                <div
                  className="relative inline-flex h-6 w-11 items-center rounded-full cursor-pointer transition-colors"
                  onClick={() => setViewMode(viewMode === 'chart' ? 'table' : 'chart')}
                  style={{ backgroundColor: viewMode === 'chart' ? 'hsl(142.1 76.2% 36.3%)' : 'hsl(215.4 16.3% 46.9%)' }}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full transition-transform ${
                      viewMode === 'chart' ? 'translate-x-6' : 'translate-x-1'
                    }`}
                    style={{ backgroundColor: 'hsl(var(--card))' }}
                  />
                </div>
                <span className={`text-sm ${viewMode === 'table' ? 'text-foreground' : 'text-muted-foreground'}`}>Table</span>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {viewMode === 'chart' ? (
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                {chartType === 'bar' ? (
                  <BarChart 
                    data={chartData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                    style={{ backgroundColor: 'hsl(var(--background))' }}
                  >
                    <XAxis 
                      dataKey="date"
                      axisLine={false}
                      tickLine={false}
                      stroke="hsl(var(--foreground))"
                      tick={{ fontSize: 12 }}
                      tickMargin={10}
                    />
                    <YAxis 
                      axisLine={false}
                      tickLine={false}
                      stroke="hsl(var(--foreground))"
                      tickFormatter={(value) => `$${value.toFixed(2)}`}
                      tick={{ fontSize: 12 }}
                      tickMargin={10}
                      domain={[
                        (dataMin: number) => {
                          if (!chartData || chartData.length === 0) return 0;
                          
                          // Get all dividend values
                          const dividendValues = chartData.flatMap(d => [d.dividend, d.adjDividend]);
                          const minValue = Math.min(...dividendValues);
                          const maxValue = Math.max(...dividendValues);
                          
                          // If all values are positive, start from 0
                          if (minValue >= 0) return 0;
                          
                          // Otherwise, make room for negative values
                          const padding = Math.abs(maxValue - minValue) * 0.1;
                          return minValue - padding;
                        },
                        (dataMax: number) => {
                          if (!chartData || chartData.length === 0) return 5;
                          
                          // Get all dividend values
                          const dividendValues = chartData.flatMap(d => [d.dividend, d.adjDividend]);
                          const maxValue = Math.max(...dividendValues);
                          
                          // Add 10% padding to the top
                          const padding = Math.abs(maxValue) * 0.1;
                          return maxValue + padding;
                        }
                      ]}
                    />
                    <Tooltip 
                      formatter={(value) => [`$${Number(value).toFixed(2)}`, 'Dividend']}
                      contentStyle={{
                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        backdropFilter: 'blur(8px)',
                        borderRadius: '8px',
                        padding: '12px',
                        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                      }}
                      cursor={{ fill: 'transparent' }}
                      labelStyle={{ marginBottom: '8px', fontWeight: 500 }}
                    />
                    <Legend 
                      verticalAlign="top"
                      height={36}
                      wrapperStyle={{ paddingTop: '10px' }}
                    />
                    <CartesianGrid 
                      strokeDasharray="3 3" 
                      stroke="hsl(var(--border))"
                      opacity={0.2}
                    />
                    <Bar 
                      dataKey="dividend" 
                      name="Regular Dividend (As Paid)" 
                      fill="#8884d8" 
                      radius={[4, 4, 0, 0]}
                      maxBarSize={40}
                    />
                    <Bar 
                      dataKey="adjDividend" 
                      name="Split-Adjusted Dividend" 
                      fill="#82ca9d" 
                      radius={[4, 4, 0, 0]}
                      maxBarSize={40}
                    />
                  </BarChart>
                ) : (
                  <LineChart 
                    data={chartData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                    style={{ backgroundColor: 'hsl(var(--background))' }}
                  >
                    <XAxis 
                      dataKey="date"
                      axisLine={false}
                      tickLine={false}
                      stroke="hsl(var(--foreground))"
                      tick={{ fontSize: 12 }}
                      tickMargin={10}
                    />
                    <YAxis 
                      axisLine={false}
                      tickLine={false}
                      stroke="hsl(var(--foreground))"
                      tickFormatter={(value) => `$${value.toFixed(2)}`}
                      tick={{ fontSize: 12 }}
                      tickMargin={10}
                      domain={[
                        (dataMin: number) => {
                          if (!chartData || chartData.length === 0) return 0;
                          
                          // Get all dividend values
                          const dividendValues = chartData.flatMap(d => [d.dividend, d.adjDividend]);
                          const minValue = Math.min(...dividendValues);
                          const maxValue = Math.max(...dividendValues);
                          
                          // If all values are positive, start from 0
                          if (minValue >= 0) return 0;
                          
                          // Otherwise, make room for negative values
                          const padding = Math.abs(maxValue - minValue) * 0.1;
                          return minValue - padding;
                        },
                        (dataMax: number) => {
                          if (!chartData || chartData.length === 0) return 5;
                          
                          // Get all dividend values
                          const dividendValues = chartData.flatMap(d => [d.dividend, d.adjDividend]);
                          const maxValue = Math.max(...dividendValues);
                          
                          // Add 10% padding to the top
                          const padding = Math.abs(maxValue) * 0.1;
                          return maxValue + padding;
                        }
                      ]}
                    />
                    <Tooltip 
                      formatter={(value) => [`$${Number(value).toFixed(2)}`, 'Dividend']}
                      contentStyle={{
                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        backdropFilter: 'blur(8px)',
                        borderRadius: '8px',
                        padding: '12px',
                        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                      }}
                      cursor={{ stroke: 'hsl(var(--foreground))', strokeWidth: 1 }}
                      labelStyle={{ marginBottom: '8px', fontWeight: 500 }}
                    />
                    <Legend 
                      verticalAlign="top"
                      height={36}
                      wrapperStyle={{ paddingTop: '10px' }}
                    />
                    <CartesianGrid 
                      strokeDasharray="3 3" 
                      stroke="hsl(var(--border))"
                      opacity={0.2}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="dividend" 
                      name="Regular Dividend (As Paid)" 
                      stroke="#8884d8"
                      strokeWidth={2}
                      dot={{ r: 3, strokeWidth: 2 }}
                      activeDot={{ r: 5, strokeWidth: 0 }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="adjDividend" 
                      name="Split-Adjusted Dividend" 
                      stroke="#82ca9d"
                      strokeWidth={2}
                      dot={{ r: 3, strokeWidth: 2 }}
                      activeDot={{ r: 5, strokeWidth: 0 }}
                    />
                  </LineChart>
                )}
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr>
                    <th className="text-left p-3 border-b border-border bg-muted font-medium text-muted-foreground">Date</th>
                    <th className="text-right p-3 border-b border-border bg-muted font-medium text-muted-foreground">Dividend</th>
                    <th className="text-right p-3 border-b border-border bg-muted font-medium text-muted-foreground">Adjusted Dividend</th>
                    <th className="text-right p-3 border-b border-border bg-muted font-medium text-muted-foreground">Payment Date</th>
                    <th className="text-right p-3 border-b border-border bg-muted font-medium text-muted-foreground">Record Date</th>
                  </tr>
                </thead>
                <tbody>
                  {dividendData?.historical?.map((item: any) => (
                    <tr key={item.date} className="hover:bg-accent/50 transition-colors">
                      <td className="p-3 border-b border-border">{item.date}</td>
                      <td className="text-right p-3 border-b border-border font-mono">${item.dividend.toFixed(2)}</td>
                      <td className="text-right p-3 border-b border-border font-mono">${item.adjDividend.toFixed(2)}</td>
                      <td className="text-right p-3 border-b border-border">{item.paymentDate}</td>
                      <td className="text-right p-3 border-b border-border">{item.recordDate}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Update BalanceMetricCards component to include all cards
const BalanceMetricCards = ({ data }: { data: any[] }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      {/* Total Assets Card */}
      <Card className="border-0 shadow-md">
        <CardContent className="p-4">
          <h3 className="text-sm font-medium text-gray-500">Total Assets</h3>
          <div className="mt-2">
            <div className="h-24">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} margin={{ top: 15, right: 5, left: 5, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(156, 163, 175, 0.2)" vertical={false} />
                  <XAxis 
                    dataKey="year"
                    tick={{ fontSize: 10 }}
                    tickLine={false}
                    axisLine={{ stroke: '#e5e7eb' }}
                  />
                  <YAxis 
                    tick={{ fontSize: 10 }}
                    tickLine={false}
                    axisLine={{ stroke: '#e5e7eb' }} 
                    tickFormatter={(value) => {
                      const absValue = Math.abs(value);
                      if (absValue >= 1e9 || absValue <= -1e9) {
                        return `$${(value / 1e9).toFixed(1)}B`;
                      } else if (absValue >= 1e6 || absValue <= -1e6) {
                        return `$${(value / 1e6).toFixed(1)}M`;
                      } else if (absValue >= 1e3 || absValue <= -1e3) {
                        return `$${(value / 1e3).toFixed(1)}K`;
                      }
                      return `$${value.toFixed(1)}`;
                    }}
                    domain={[(dataMin: number) => {
                      // Check if there are any negative values in the data
                      const hasNegativeValues = data.some(item => item.totalAssets < 0);
                      if (!hasNegativeValues) {
                        return 0; // Start from 0 if no negative values
                      }
                      // If there are negative values, use the symmetric range logic
                      const maxAbsValue = Math.max(
                        Math.abs(Math.min(...data.map(d => d.totalAssets))),
                        Math.abs(Math.max(...data.map(d => d.totalAssets)))
                      );
                      return -maxAbsValue;
                    }, (dataMax: number) => {
                      const maxValue = Math.max(...data.map(d => d.totalAssets));
                      const roundedMax = Math.ceil(maxValue);
                      return roundedMax + (roundedMax < 10 ? 2 : Math.ceil(roundedMax * 0.2));
                    }]}
                  />
                  {(() => {
                    // Check if there are any negative values in the data
                    const hasNegativeValues = data.some(item => item.totalAssets < 0);
                    return hasNegativeValues ? <ReferenceLine y={0} stroke="#e5e7eb" /> : null;
                  })()}
                  <Bar 
                    dataKey="totalAssets"
                    fill="rgba(136, 132, 216, 0.3)"  // #8884d8
                    stroke="rgba(136, 132, 216, 0.6)"
                    label={<CustomLabel fill="#8884d8" />}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {data && data.length > 1 
                ? `YoY Growth: ${((data[data.length - 1]?.totalAssets / data[data.length - 2]?.totalAssets - 1) * 100).toFixed(2)}%`
                : 'YoY Growth: N/A'
              }
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Total Liabilities Card */}
      <Card className="border-0 shadow-md">
        <CardContent className="p-4">
          <h3 className="text-sm font-medium text-gray-500">Total Liabilities</h3>
          <div className="mt-2">
            <div className="h-24">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} margin={{ top: 15, right: 5, left: 5, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(156, 163, 175, 0.2)" vertical={false} />
                  <XAxis 
                    dataKey="year"
                    tick={{ fontSize: 10 }}
                    tickLine={false}
                    axisLine={{ stroke: '#e5e7eb' }}
                  />
                  <YAxis 
                    tick={{ fontSize: 10 }}
                    tickLine={false}
                    axisLine={{ stroke: '#e5e7eb' }} 
                    tickFormatter={(value) => {
                      const absValue = Math.abs(value);
                      if (absValue >= 1e9 || absValue <= -1e9) {
                        return `$${(value / 1e9).toFixed(1)}B`;
                      } else if (absValue >= 1e6 || absValue <= -1e6) {
                        return `$${(value / 1e6).toFixed(1)}M`;
                      } else if (absValue >= 1e3 || absValue <= -1e3) {
                        return `$${(value / 1e3).toFixed(1)}K`;
                      }
                      return `$${value.toFixed(1)}`;
                    }}
                    domain={[(dataMin: number) => {
                      // Check if there are any negative values in the data
                      const hasNegativeValues = data.some(item => item.totalLiabilities < 0);
                      if (!hasNegativeValues) {
                        return 0; // Start from 0 if no negative values
                      }
                      // If there are negative values, use the symmetric range logic
                      const maxAbsValue = Math.max(
                        Math.abs(Math.min(...data.map(d => d.totalLiabilities))),
                        Math.abs(Math.max(...data.map(d => d.totalLiabilities)))
                      );
                      return -maxAbsValue;
                    }, (dataMax: number) => {
                      const maxValue = Math.max(...data.map(d => d.totalLiabilities));
                      const roundedMax = Math.ceil(maxValue);
                      return roundedMax + (roundedMax < 10 ? 2 : Math.ceil(roundedMax * 0.2));
                    }]}
                  />
                  {(() => {
                    // Check if there are any negative values in the data
                    const hasNegativeValues = data.some(item => item.totalLiabilities < 0);
                    return hasNegativeValues ? <ReferenceLine y={0} stroke="#e5e7eb" /> : null;
                  })()}
                  <Bar 
                    dataKey="totalLiabilities"
                    fill="rgba(130, 202, 157, 0.3)"  // #82ca9d
                    stroke="rgba(130, 202, 157, 0.6)"
                    label={<CustomLabel fill="#82ca9d" />}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {data && data.length > 1 
                ? `YoY Growth: ${((data[data.length - 1]?.totalLiabilities / data[data.length - 2]?.totalLiabilities - 1) * 100).toFixed(2)}%`
                : 'YoY Growth: N/A'
              }
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Total Stockholders Equity Card */}
      <Card className="border-0 shadow-md">
        <CardContent className="p-4">
          <h3 className="text-sm font-medium text-gray-500">Stockholders Equity</h3>
          <div className="mt-2">
            <div className="h-24">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} margin={{ top: 15, right: 5, left: 5, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(156, 163, 175, 0.2)" vertical={false} />
                  <XAxis 
                    dataKey="year"
                    tick={{ fontSize: 10 }}
                    tickLine={false}
                    axisLine={{ stroke: '#e5e7eb' }}
                  />
                  <YAxis 
                    tick={{ fontSize: 10 }}
                    tickLine={false}
                    axisLine={{ stroke: '#e5e7eb' }} 
                    tickFormatter={(value) => {
                      const absValue = Math.abs(value);
                      if (absValue >= 1e9 || absValue <= -1e9) {
                        return `$${(value / 1e9).toFixed(1)}B`;
                      } else if (absValue >= 1e6 || absValue <= -1e6) {
                        return `$${(value / 1e6).toFixed(1)}M`;
                      } else if (absValue >= 1e3 || absValue <= -1e3) {
                        return `$${(value / 1e3).toFixed(1)}K`;
                      }
                      return `$${value.toFixed(1)}`;
                    }}
                    domain={[(dataMin: number) => {
                      // Check if there are any negative values in the data
                      const hasNegativeValues = data.some(item => item.totalStockholdersEquity < 0);
                      if (!hasNegativeValues) {
                        return 0; // Start from 0 if no negative values
                      }
                      // If there are negative values, use the symmetric range logic
                      const maxAbsValue = Math.max(
                        Math.abs(Math.min(...data.map(d => d.totalStockholdersEquity))),
                        Math.abs(Math.max(...data.map(d => d.totalStockholdersEquity)))
                      );
                      return -maxAbsValue;
                    }, (dataMax: number) => {
                      const maxValue = Math.max(...data.map(d => d.totalStockholdersEquity));
                      const roundedMax = Math.ceil(maxValue);
                      return roundedMax + (roundedMax < 10 ? 2 : Math.ceil(roundedMax * 0.2));
                    }]}
                  />
                  {(() => {
                    // Check if there are any negative values in the data
                    const hasNegativeValues = data.some(item => item.totalStockholdersEquity < 0);
                    return hasNegativeValues ? <ReferenceLine y={0} stroke="#e5e7eb" /> : null;
                  })()}
                  <Bar 
                    dataKey="totalStockholdersEquity"
                    fill="rgba(255, 198, 88, 0.3)"  // #ffc658
                    stroke="rgba(255, 198, 88, 0.6)"
                    label={<CustomLabel fill="#ffc658" />}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {data && data.length > 1 
                ? `YoY Growth: ${((data[data.length - 1]?.totalStockholdersEquity / data[data.length - 2]?.totalStockholdersEquity - 1) * 100).toFixed(2)}%`
                : 'YoY Growth: N/A'
              }
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Current Assets Card */}
      <Card className="border-0 shadow-md">
        <CardContent className="p-4">
          <h3 className="text-sm font-medium text-gray-500">Current Assets</h3>
          <div className="mt-2">
            <div className="h-24">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} margin={{ top: 15, right: 5, left: 5, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(156, 163, 175, 0.2)" vertical={false} />
                  <XAxis 
                    dataKey="year"
                    tick={{ fontSize: 10 }}
                    tickLine={false}
                    axisLine={{ stroke: '#e5e7eb' }}
                  />
                  <YAxis 
                    tick={{ fontSize: 10 }}
                    tickLine={false}
                    axisLine={{ stroke: '#e5e7eb' }} 
                    tickFormatter={(value) => {
                      const absValue = Math.abs(value);
                      if (absValue >= 1e9 || absValue <= -1e9) {
                        return `$${(value / 1e9).toFixed(1)}B`;
                      } else if (absValue >= 1e6 || absValue <= -1e6) {
                        return `$${(value / 1e6).toFixed(1)}M`;
                      } else if (absValue >= 1e3 || absValue <= -1e3) {
                        return `$${(value / 1e3).toFixed(1)}K`;
                      }
                      return `$${value.toFixed(1)}`;
                    }}
                    domain={[(dataMin: number) => {
                      // Check if there are any negative values in the data
                      const hasNegativeValues = data.some(item => item.totalCurrentAssets < 0);
                      if (!hasNegativeValues) {
                        return 0; // Start from 0 if no negative values
                      }
                      // If there are negative values, use the symmetric range logic
                      const maxAbsValue = Math.max(
                        Math.abs(Math.min(...data.map(d => d.totalCurrentAssets))),
                        Math.abs(Math.max(...data.map(d => d.totalCurrentAssets)))
                      );
                      return -maxAbsValue;
                    }, (dataMax: number) => {
                      const maxValue = Math.max(...data.map(d => d.totalCurrentAssets));
                      const roundedMax = Math.ceil(maxValue);
                      return roundedMax + (roundedMax < 10 ? 2 : Math.ceil(roundedMax * 0.2));
                    }]}
                  />
                  {(() => {
                    // Check if there are any negative values in the data
                    const hasNegativeValues = data.some(item => item.totalCurrentAssets < 0);
                    return hasNegativeValues ? <ReferenceLine y={0} stroke="#e5e7eb" /> : null;
                  })()}
                  <Bar 
                    dataKey="totalCurrentAssets"
                    fill="rgba(255, 128, 66, 0.3)"  // #ff8042
                    stroke="rgba(255, 128, 66, 0.6)"
                    label={<CustomLabel fill="#ff8042" />}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {data && data.length > 1 
                ? `YoY Growth: ${((data[data.length - 1]?.totalCurrentAssets / data[data.length - 2]?.totalCurrentAssets - 1) * 100).toFixed(2)}%`
                : 'YoY Growth: N/A'
              }
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Current Liabilities Card */}
      <Card className="border-0 shadow-md">
        <CardContent className="p-4">
          <h3 className="text-sm font-medium text-gray-500">Current Liabilities</h3>
          <div className="mt-2">
            <div className="h-24">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} margin={{ top: 15, right: 5, left: 5, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(156, 163, 175, 0.2)" vertical={false} />
                  <XAxis 
                    dataKey="year"
                    tick={{ fontSize: 10 }}
                    tickLine={false}
                    axisLine={{ stroke: '#e5e7eb' }}
                  />
                  <YAxis 
                    tick={{ fontSize: 10 }}
                    tickLine={false}
                    axisLine={{ stroke: '#e5e7eb' }} 
                    tickFormatter={(value) => {
                      const absValue = Math.abs(value);
                      if (absValue >= 1e9 || absValue <= -1e9) {
                        return `$${(value / 1e9).toFixed(1)}B`;
                      } else if (absValue >= 1e6 || absValue <= -1e6) {
                        return `$${(value / 1e6).toFixed(1)}M`;
                      } else if (absValue >= 1e3 || absValue <= -1e3) {
                        return `$${(value / 1e3).toFixed(1)}K`;
                      }
                      return `$${value.toFixed(1)}`;
                    }}
                    domain={[(dataMin: number) => {
                      // Check if there are any negative values in the data
                      const hasNegativeValues = data.some(item => item.totalCurrentLiabilities < 0);
                      if (!hasNegativeValues) {
                        return 0; // Start from 0 if no negative values
                      }
                      // If there are negative values, use the symmetric range logic
                      const maxAbsValue = Math.max(
                        Math.abs(Math.min(...data.map(d => d.totalCurrentLiabilities))),
                        Math.abs(Math.max(...data.map(d => d.totalCurrentLiabilities)))
                      );
                      return -maxAbsValue;
                    }, (dataMax: number) => {
                      const maxValue = Math.max(...data.map(d => d.totalCurrentLiabilities));
                      const roundedMax = Math.ceil(maxValue);
                      return roundedMax + (roundedMax < 10 ? 2 : Math.ceil(roundedMax * 0.2));
                    }]}
                  />
                  {(() => {
                    // Check if there are any negative values in the data
                    const hasNegativeValues = data.some(item => item.totalCurrentLiabilities < 0);
                    return hasNegativeValues ? <ReferenceLine y={0} stroke="#e5e7eb" /> : null;
                  })()}
                  <Bar 
                    dataKey="totalCurrentLiabilities"
                    fill="rgba(217, 70, 239, 0.3)"  // #d946ef
                    stroke="rgba(217, 70, 239, 0.6)"
                    label={<CustomLabel fill="#d946ef" />}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {data && data.length > 1 
                ? `YoY Growth: ${((data[data.length - 1]?.totalCurrentLiabilities / data[data.length - 2]?.totalCurrentLiabilities - 1) * 100).toFixed(2)}%`
                : 'YoY Growth: N/A'
              }
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Total Debt Card */}
      <Card className="border-0 shadow-md">
        <CardContent className="p-4">
          <h3 className="text-sm font-medium text-gray-500">Total Debt</h3>
          <div className="mt-2">
            <div className="h-24">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} margin={{ top: 15, right: 5, left: 5, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(156, 163, 175, 0.2)" vertical={false} />
                  <XAxis 
                    dataKey="year"
                    tick={{ fontSize: 10 }}
                    tickLine={false}
                    axisLine={{ stroke: '#e5e7eb' }}
                  />
                  <YAxis 
                    tick={{ fontSize: 10 }}
                    tickLine={false}
                    axisLine={{ stroke: '#e5e7eb' }} 
                    tickFormatter={(value) => {
                      const absValue = Math.abs(value);
                      if (absValue >= 1e9 || absValue <= -1e9) {
                        return `$${(value / 1e9).toFixed(1)}B`;
                      } else if (absValue >= 1e6 || absValue <= -1e6) {
                        return `$${(value / 1e6).toFixed(1)}M`;
                      } else if (absValue >= 1e3 || absValue <= -1e3) {
                        return `$${(value / 1e3).toFixed(1)}K`;
                      }
                      return `$${value.toFixed(1)}`;
                    }}
                    domain={[(dataMin: number) => {
                      // Check if there are any negative values in the data
                      const hasNegativeValues = data.some(item => item.totalDebt < 0);
                      if (!hasNegativeValues) {
                        return 0; // Start from 0 if no negative values
                      }
                      // If there are negative values, use the symmetric range logic
                      const maxAbsValue = Math.max(
                        Math.abs(Math.min(...data.map(d => d.totalDebt))),
                        Math.abs(Math.max(...data.map(d => d.totalDebt)))
                      );
                      return -maxAbsValue;
                    }, (dataMax: number) => {
                      const maxValue = Math.max(...data.map(d => d.totalDebt));
                      const roundedMax = Math.ceil(maxValue);
                      return roundedMax + (roundedMax < 10 ? 2 : Math.ceil(roundedMax * 0.2));
                    }]}
                  />
                  {(() => {
                    // Check if there are any negative values in the data
                    const hasNegativeValues = data.some(item => item.totalDebt < 0);
                    return hasNegativeValues ? <ReferenceLine y={0} stroke="#e5e7eb" /> : null;
                  })()}
                  <Bar 
                    dataKey="totalDebt"
                    fill="rgba(20, 184, 166, 0.3)"  // #14b8a6
                    stroke="rgba(20, 184, 166, 0.6)"
                    label={<CustomLabel fill="#14b8a6" />}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {data && data.length > 1 
                ? `YoY Growth: ${((data[data.length - 1]?.totalDebt / data[data.length - 2]?.totalDebt - 1) * 100).toFixed(2)}%`
                : 'YoY Growth: N/A'
              }
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Add Non-Current Assets Card */}
      <Card className="border-0 shadow-md">
        <CardContent className="p-4">
          <h3 className="text-sm font-medium text-gray-500">Non-Current Assets</h3>
          <div className="mt-2">
            <div className="h-24">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} margin={{ top: 15, right: 5, left: 5, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(156, 163, 175, 0.2)" vertical={false} />
                  <XAxis 
                    dataKey="year"
                    tick={{ fontSize: 10 }}
                    tickLine={false}
                    axisLine={{ stroke: '#e5e7eb' }}
                  />
                  <YAxis 
                    tick={{ fontSize: 10 }}
                    tickLine={false}
                    axisLine={{ stroke: '#e5e7eb' }} 
                    tickFormatter={(value) => {
                      const absValue = Math.abs(value);
                      if (absValue >= 1e9 || absValue <= -1e9) {
                        return `$${(value / 1e9).toFixed(1)}B`;
                      } else if (absValue >= 1e6 || absValue <= -1e6) {
                        return `$${(value / 1e6).toFixed(1)}M`;
                      } else if (absValue >= 1e3 || absValue <= -1e3) {
                        return `$${(value / 1e3).toFixed(1)}K`;
                      }
                      return `$${value.toFixed(1)}`;
                    }}
                    domain={[(dataMin: number) => {
                      // Check if there are any negative values in the data
                      const hasNegativeValues = data.some(item => item.totalNonCurrentAssets < 0);
                      if (!hasNegativeValues) {
                        return 0; // Start from 0 if no negative values
                      }
                      // If there are negative values, use the symmetric range logic
                      const maxAbsValue = Math.max(
                        Math.abs(Math.min(...data.map(d => d.totalNonCurrentAssets))),
                        Math.abs(Math.max(...data.map(d => d.totalNonCurrentAssets)))
                      );
                      return -maxAbsValue;
                    }, (dataMax: number) => {
                      const maxValue = Math.max(...data.map(d => d.totalNonCurrentAssets));
                      const roundedMax = Math.ceil(maxValue);
                      return roundedMax + (roundedMax < 10 ? 2 : Math.ceil(roundedMax * 0.2));
                    }]}
                  />
                  {(() => {
                    // Check if there are any negative values in the data
                    const hasNegativeValues = data.some(item => item.totalCurrentAssets < 0);
                    return hasNegativeValues ? <ReferenceLine y={0} stroke="#e5e7eb" /> : null;
                  })()}
                  <Bar 
                    dataKey="totalNonCurrentAssets"
                    fill="rgba(244, 63, 94, 0.3)"  // #f43f5e
                    stroke="rgba(244, 63, 94, 0.6)"
                    label={<CustomLabel fill="#f43f5e" />}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {data && data.length > 1 
                ? `YoY Growth: ${((data[data.length - 1]?.totalNonCurrentAssets / data[data.length - 2]?.totalNonCurrentAssets - 1) * 100).toFixed(2)}%`
                : 'YoY Growth: N/A'
              }
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Add Non-Current Liabilities Card */}
      <Card className="border-0 shadow-md">
        <CardContent className="p-4">
          <h3 className="text-sm font-medium text-gray-500">Non-Current Liabilities</h3>
          <div className="mt-2">
            <div className="h-24">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} margin={{ top: 15, right: 5, left: 5, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(156, 163, 175, 0.2)" vertical={false} />
                  <XAxis 
                    dataKey="year"
                    tick={{ fontSize: 10 }}
                    tickLine={false}
                    axisLine={{ stroke: '#e5e7eb' }}
                  />
                  <YAxis 
                    tick={{ fontSize: 10 }}
                    tickLine={false}
                    axisLine={{ stroke: '#e5e7eb' }} 
                    tickFormatter={(value) => {
                      const absValue = Math.abs(value);
                      if (absValue >= 1e9 || absValue <= -1e9) {
                        return `$${(value / 1e9).toFixed(1)}B`;
                      } else if (absValue >= 1e6 || absValue <= -1e6) {
                        return `$${(value / 1e6).toFixed(1)}M`;
                      } else if (absValue >= 1e3 || absValue <= -1e3) {
                        return `$${(value / 1e3).toFixed(1)}K`;
                      }
                      return `$${value.toFixed(1)}`;
                    }}
                    domain={[(dataMin: number) => {
                      // Check if there are any negative values in the data
                      const hasNegativeValues = data.some(item => item.totalNonCurrentLiabilities < 0);
                      if (!hasNegativeValues) {
                        return 0; // Start from 0 if no negative values
                      }
                      // If there are negative values, use the symmetric range logic
                      const maxAbsValue = Math.max(
                        Math.abs(Math.min(...data.map(d => d.totalNonCurrentLiabilities))),
                        Math.abs(Math.max(...data.map(d => d.totalNonCurrentLiabilities)))
                      );
                      return -maxAbsValue;
                    }, (dataMax: number) => {
                      const maxValue = Math.max(...data.map(d => d.totalNonCurrentLiabilities));
                      const roundedMax = Math.ceil(maxValue);
                      return roundedMax + (roundedMax < 10 ? 2 : Math.ceil(roundedMax * 0.2));
                    }]}
                  />
                  {(() => {
                    // Check if there are any negative values in the data
                    const hasNegativeValues = data.some(item => item.totalNonCurrentLiabilities < 0);
                    return hasNegativeValues ? <ReferenceLine y={0} stroke="#e5e7eb" /> : null;
                  })()}
                  <Bar 
                    dataKey="totalNonCurrentLiabilities"
                    fill="rgba(14, 165, 233, 0.3)"  // #0ea5e9
                    stroke="rgba(14, 165, 233, 0.6)"
                    label={<CustomLabel fill="#0ea5e9" />}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {data && data.length > 1 
                ? `YoY Growth: ${((data[data.length - 1]?.totalNonCurrentLiabilities / data[data.length - 2]?.totalNonCurrentLiabilities - 1) * 100).toFixed(2)}%`
                : 'YoY Growth: N/A'
              }
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Add CashFlowMetricCards component
const CashFlowMetricCards = ({ data }: { data: any[] }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      {/* Operating Cash Flow Card */}
      <Card className="border-0 shadow-md">
        <CardContent className="p-4">
          <h3 className="text-sm font-medium text-gray-500">Operating Cash Flow</h3>
          <div className="mt-2">
            <div className="h-24">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} margin={{ top: 15, right: 5, left: 5, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(156, 163, 175, 0.2)" vertical={false} />
                  <XAxis 
                    dataKey="year"
                    tick={{ fontSize: 10 }}
                    tickLine={false}
                    axisLine={{ stroke: '#e5e7eb' }}
                  />
                  <YAxis 
                    tick={{ fontSize: 10 }}
                    tickLine={false}
                    axisLine={{ stroke: '#e5e7eb' }} 
                    tickFormatter={(value) => {
                      const absValue = Math.abs(value);
                      if (absValue >= 1e9 || absValue <= -1e9) {
                        return `$${(value / 1e9).toFixed(1)}B`;
                      } else if (absValue >= 1e6 || absValue <= -1e6) {
                        return `$${(value / 1e6).toFixed(1)}M`;
                      } else if (absValue >= 1e3 || absValue <= -1e3) {
                        return `$${(value / 1e3).toFixed(1)}K`;
                      }
                      return `$${value.toFixed(1)}`;
                    }}
                    domain={[(dataMin: number) => {
                      // Check if there are any negative values in the data
                      const hasNegativeValues = data.some(item => item.operatingCashFlow < 0);
                      if (!hasNegativeValues) {
                        return 0; // Start from 0 if no negative values
                      }
                      // If there are negative values, use the symmetric range logic
                      const maxAbsValue = Math.max(
                        Math.abs(Math.min(...data.map(d => d.operatingCashFlow))),
                        Math.abs(Math.max(...data.map(d => d.operatingCashFlow)))
                      );
                      return -maxAbsValue;
                    }, (dataMax: number) => {
                      const maxValue = Math.max(...data.map(d => d.operatingCashFlow));
                      const roundedMax = Math.ceil(maxValue);
                      return roundedMax + (roundedMax < 10 ? 2 : Math.ceil(roundedMax * 0.2));
                    }]}
                  />
                  <Bar 
                    dataKey="operatingCashFlow"
                    fill="rgba(136, 132, 216, 0.3)"  // #8884d8
                    stroke="rgba(136, 132, 216, 0.6)"
                    label={<CustomLabel fill="#8884d8" />}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {data && data.length >1 
                ? `YoY Growth: ${((data[data.length - 1]?.operatingCashFlow / data[data.length - 2]?.operatingCashFlow - 1) * 100).toFixed(2)}%`
                : 'YoY Growth: N/A'
              }
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Free Cash Flow Card */}
      <Card className="border-0 shadow-md">
        <CardContent className="p-4">
          <h3 className="text-sm font-medium text-gray-500">Free Cash Flow</h3>
          <div className="mt-2">
            <div className="h-24">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} margin={{ top: 15, right: 5, left: 5, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(156, 163, 175, 0.2)" vertical={false} />
                  <XAxis 
                    dataKey="year"
                    tick={{ fontSize: 10 }}
                    tickLine={false}
                    axisLine={{ stroke: '#e5e7eb' }}
                  />
                  <YAxis 
                    tick={{ fontSize: 10 }}
                    tickLine={false}
                    axisLine={{ stroke: '#e5e7eb' }} 
                    tickFormatter={(value) => {
                      const absValue = Math.abs(value);
                      if (absValue >=1e9 || absValue <= -1e9) {
                        return `$${(value / 1e9).toFixed(1)}B`;
                      } else if (absValue >= 1e6 || absValue <= -1e6) {
                        return `$${(value / 1e6).toFixed(1)}M`;
                      } else if (absValue >= 1e3 || absValue <= -1e3) {
                        return `$${(value / 1e3).toFixed(1)}K`;
                      }
                      return `$${value.toFixed(1)}`;
                    }}
                    domain={[(dataMin: number) => {
                      // Check if there are any negative values in the data
                      const hasNegativeValues = data.some(item => item.freeCashFlow < 0);
                      if (!hasNegativeValues) {
                        return 0; // Start from 0 if no negative values
                      }
                      // If there are negative values, use the symmetric range logic
                      const maxAbsValue = Math.max(
                        Math.abs(Math.min(...data.map(d => d.freeCashFlow))),
                        Math.abs(Math.max(...data.map(d => d.freeCashFlow)))
                      );
                      return -maxAbsValue;
                    }, (dataMax: number) => {
                      const maxValue = Math.max(...data.map(d => d.freeCashFlow));
                      const roundedMax = Math.ceil(maxValue);
                      return roundedMax + (roundedMax < 10 ? 2 : Math.ceil(roundedMax * 0.2));
                    }]}
                  />
                  <Bar 
                    dataKey="freeCashFlow"
                    fill="rgba(130, 202, 157, 0.3)"  // #82ca9d
                    stroke="rgba(130, 202, 157, 0.6)"
                    label={<CustomLabel fill="#82ca9d" />}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {data && data.length >1 
                ? `YoY Growth: ${((data[data.length - 1]?.freeCashFlow / data[data.length - 2]?.freeCashFlow - 1) *100).toFixed(2)}%`
                : 'YoY Growth: N/A'
              }
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Capital Expenditure Card */}
      <Card className="border-0 shadow-md">
        <CardContent className="p-4">
          <h3 className="text-sm font-medium text-gray-500">Capital Expenditure</h3>
          <div className="mt-2">
            <div className="h-24">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} margin={{ top: 15, right: 5, left: 5, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(156, 163, 175, 0.2)" vertical={false} />
                  <XAxis 
                    dataKey="year"
                    tick={{ fontSize: 10 }}
                    tickLine={false}
                    axisLine={{ stroke: '#e5e7eb' }}
                  />
                  <YAxis 
                    tick={{ fontSize: 10 }}
                    tickLine={false}
                    axisLine={{ stroke: '#e5e7eb' }} 
                    tickFormatter={(value) => {
                      const absValue = Math.abs(value);
                      if (absValue >=1e9 || absValue <= -1e9) {
                        return `$${(value / 1e9).toFixed(1)}B`;
                      } else if (absValue >= 1e6 || absValue <= -1e6) {
                        return `$${(value / 1e6).toFixed(1)}M`;
                      } else if (absValue >= 1e3 || absValue <= -1e3) {
                        return `$${(value / 1e3).toFixed(1)}K`;
                      }
                      return `$${value.toFixed(1)}`;
                    }}
                    domain={[(dataMin: number) => {
                      // Check if there are any negative values in the data
                      const hasNegativeValues = data.some(item => item.capitalExpenditure < 0);
                      if (!hasNegativeValues) {
                        return 0; // Start from 0 if no negative values
                      }
                      // If there are negative values, use the symmetric range logic
                      const maxAbsValue = Math.max(
                        Math.abs(Math.min(...data.map(d => d.capitalExpenditure))),
                        Math.abs(Math.max(...data.map(d => d.capitalExpenditure)))
                      );
                      return -maxAbsValue;
                    }, (dataMax: number) => {
                      const maxValue = Math.max(...data.map(d => d.capitalExpenditure));
                      const roundedMax = Math.ceil(maxValue);
                      return roundedMax + (roundedMax < 10 ? 2 : Math.ceil(roundedMax * 0.2));
                    }]}
                  />
                  <Bar 
                    dataKey="capitalExpenditure"
                    fill="rgba(255, 198, 88, 0.3)"  // #ffc658
                    stroke="rgba(255, 198, 88, 0.6)"
                    label={<CustomLabel fill="#ffc658" />}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {data && data.length >1 
                ? `YoY Growth: ${((data[data.length - 1]?.capitalExpenditure / data[data.length - 2]?.capitalExpenditure - 1) *100).toFixed(2)}%`
                : 'YoY Growth: N/A'
              }
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Net Investing Cash Flow Card */}
      <Card className="border-0 shadow-md">
        <CardContent className="p-4">
          <h3 className="text-sm font-medium text-gray-500">Net Investing Cash Flow</h3>
          <div className="mt-2">
            <div className="h-24">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} margin={{ top: 15, right: 5, left: 5, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(156, 163, 175, 0.2)" vertical={false} />
                  <XAxis 
                    dataKey="year"
                    tick={{ fontSize: 10 }}
                    tickLine={false}
                    axisLine={{ stroke: '#e5e7eb' }}
                  />
                  <YAxis 
                    tick={{ fontSize: 10 }}
                    tickLine={false}
                    axisLine={{ stroke: '#e5e7eb' }} 
                    tickFormatter={(value) => {
                      const absValue = Math.abs(value);
                      if (absValue >=1e9 || absValue <= -1e9) {
                        return `$${(value / 1e9).toFixed(1)}B`;
                      } else if (absValue >= 1e6 || absValue <= -1e6) {
                        return `$${(value / 1e6).toFixed(1)}M`;
                      } else if (absValue >= 1e3 || absValue <= -1e3) {
                        return `$${(value / 1e3).toFixed(1)}K`;
                      }
                      return `$${value.toFixed(1)}`;
                    }}
                    domain={[(dataMin: number) => {
                      // Check if there are any negative values in the data
                      const hasNegativeValues = data.some(item => item.netCashUsedForInvestingActivites < 0);
                      if (!hasNegativeValues) {
                        return 0; // Start from 0 if no negative values
                      }
                      // If there are negative values, use the symmetric range logic
                      const maxAbsValue = Math.max(
                        Math.abs(Math.min(...data.map(d => d.netCashUsedForInvestingActivites))),
                        Math.abs(Math.max(...data.map(d => d.netCashUsedForInvestingActivites)))
                      );
                      return -maxAbsValue;
                    }, (dataMax: number) => {
                      const maxValue = Math.max(...data.map(d => d.netCashUsedForInvestingActivites));
                      const roundedMax = Math.ceil(maxValue);
                      return roundedMax + (roundedMax < 10 ? 2 : Math.ceil(roundedMax * 0.2));
                    }]}
                  />
                  {/* Add ReferenceLine at y=0 */}
                  <ReferenceLine y={0} stroke="#e5e7eb" />
                  <Bar 
                    dataKey="netCashUsedForInvestingActivites"
                    fill="rgba(255, 128, 66, 0.3)"
                    stroke="rgba(255, 128, 66, 0.6)"
                    label={<CustomLabel fill="#ff8042" />}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {data && data.length > 1 
                ? `YoY Growth: ${((data[data.length - 1]?.netCashUsedForInvestingActivites / data[data.length - 2]?.netCashUsedForInvestingActivites - 1) * 100).toFixed(2)}%`
                : 'YoY Growth: N/A'
              }
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Net Financing Cash Flow Card */}
      <Card className="border-0 shadow-md">
        <CardContent className="p-4">
          <h3 className="text-sm font-medium text-gray-500">Net Financing Cash Flow</h3>
          <div className="mt-2">
            <div className="h-24">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} margin={{ top: 15, right: 5, left: 5, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(156, 163, 175, 0.2)" vertical={false} />
                  <XAxis 
                    dataKey="year"
                    tick={{ fontSize: 10 }}
                    tickLine={false}
                    axisLine={{ stroke: '#e5e7eb' }}
                  />
                  <YAxis 
                    tick={{ fontSize: 10 }}
                    tickLine={false}
                    axisLine={{ stroke: '#e5e7eb' }} 
                    tickFormatter={(value) => {
                      const absValue = Math.abs(value);
                      if (absValue >= 1e9 || absValue <= -1e9) {
                        return `$${(value / 1e9).toFixed(1)}B`;
                      } else if (absValue >= 1e6 || absValue <= -1e6) {
                        return `$${(value / 1e6).toFixed(1)}M`;
                      } else if (absValue >= 1e3 || absValue <= -1e3) {
                        return `$${(value / 1e3).toFixed(1)}K`;
                      }
                      return `$${value.toFixed(1)}`;
                    }}
                    domain={[(dataMin: number) => {
                      // Check if there are any negative values in the data
                      const hasNegativeValues = data.some(item => item.netCashUsedProvidedByFinancingActivities < 0);
                      if (!hasNegativeValues) {
                        return 0; // Start from 0 if no negative values
                      }
                      // If there are negative values, use the symmetric range logic
                      const maxAbsValue = Math.max(
                        Math.abs(Math.min(...data.map(d => d.netCashUsedProvidedByFinancingActivities))),
                        Math.abs(Math.max(...data.map(d => d.netCashUsedProvidedByFinancingActivities)))
                      );
                      return -maxAbsValue;
                    }, (dataMax: number) => {
                      const maxValue = Math.max(...data.map(d => d.netCashUsedProvidedByFinancingActivities));
                      const roundedMax = Math.ceil(maxValue);
                      return roundedMax + (roundedMax < 10 ? 2 : Math.ceil(roundedMax * 0.2));
                    }]}
                  />
                  <Bar 
                    dataKey="netCashUsedProvidedByFinancingActivities"
                    fill="rgba(217, 70, 239, 0.3)"  // #d946ef
                    stroke="rgba(217, 70, 239, 0.6)"
                    label={<CustomLabel fill="#d946ef" />}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {data && data.length > 1 
                ? `YoY Growth: ${((data[data.length - 1]?.netCashUsedProvidedByFinancingActivities / data[data.length - 2]?.netCashUsedProvidedByFinancingActivities - 1) * 100).toFixed(2)}%`
                : 'YoY Growth: N/A'
              }
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Net Change in Cash Card */}
      <Card className="border-0 shadow-md">
        <CardContent className="p-4">
          <h3 className="text-sm font-medium text-gray-500">Net Change in Cash</h3>
          <div className="mt-2">
            <div className="h-24">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} margin={{ top: 15, right: 5, left: 5, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(156, 163, 175, 0.2)" vertical={false} />
                  <XAxis 
                    dataKey="year"
                    tick={{ fontSize: 10 }}
                    tickLine={false}
                    axisLine={{ stroke: '#e5e7eb' }}
                  />
                  <YAxis 
                    tick={{ fontSize: 10 }}
                    tickLine={false}
                    axisLine={{ stroke: '#e5e7eb' }} 
                    tickFormatter={(value) => {
                      const absValue = Math.abs(value);
                      if (absValue >= 1e9 || absValue <= -1e9) {
                        return `$${(value / 1e9).toFixed(1)}B`;
                      } else if (absValue >= 1e6 || absValue <= -1e6) {
                        return `$${(value / 1e6).toFixed(1)}M`;
                      } else if (absValue >= 1e3 || absValue <= -1e3) {
                        return `$${(value / 1e3).toFixed(1)}K`;
                      }
                      return `$${value.toFixed(1)}`;
                    }}
                    domain={[(dataMin: number) => {
                      // Check if there are any negative values in the data
                      const hasNegativeValues = data.some(item => item.netChangeInCash < 0);
                      if (!hasNegativeValues) {
                        return 0; // Start from 0 if no negative values
                      }
                      // If there are negative values, use the symmetric range logic
                      const maxAbsValue = Math.max(
                        Math.abs(Math.min(...data.map(d => d.netChangeInCash))),
                        Math.abs(Math.max(...data.map(d => d.netChangeInCash)))
                      );
                      return -maxAbsValue;
                    }, (dataMax: number) => {
                      const maxValue = Math.max(...data.map(d => d.netChangeInCash));
                      const roundedMax = Math.ceil(maxValue);
                      return roundedMax + (roundedMax < 10 ? 2 : Math.ceil(roundedMax * 0.2));
                    }]}
                  />
                  <Bar 
                    dataKey="netChangeInCash"
                    fill="rgba(14, 165, 233, 0.3)"  // #0ea5e9
                    stroke="rgba(14, 165, 233, 0.6)"
                    label={<CustomLabel fill="#0ea5e9" />}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {data && data.length > 1 
                ? `YoY Growth: ${((data[data.length - 1]?.netChangeInCash / data[data.length - 2]?.netChangeInCash - 1) * 100).toFixed(2)}%`
                : 'YoY Growth: N/A'
              }
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Depreciation & Amortization Card */}
      <Card className="border-0 shadow-md">
        <CardContent className="p-4">
          <h3 className="text-sm font-medium text-gray-500">Depreciation & Amortization</h3>
          <div className="mt-2">
            <div className="h-24">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} margin={{ top: 15, right: 5, left: 5, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(156, 163, 175, 0.2)" vertical={false} />
                  <XAxis 
                    dataKey="year"
                    tick={{ fontSize: 10 }}
                    tickLine={false}
                    axisLine={{ stroke: '#e5e7eb' }}
                  />
                  <YAxis 
                    tick={{ fontSize: 10 }}
                    tickLine={false}
                    axisLine={{ stroke: '#e5e7eb' }} 
                    tickFormatter={(value) => {
                      const absValue = Math.abs(value);
                      if (absValue >= 1e9 || absValue <= -1e9) {
                        return `$${(value / 1e9).toFixed(1)}B`;
                      } else if (absValue >= 1e6 || absValue <= -1e6) {
                        return `$${(value / 1e6).toFixed(1)}M`;
                      } else if (absValue >= 1e3 || absValue <= -1e3) {
                        return `$${(value / 1e3).toFixed(1)}K`;
                      }
                      return `$${value.toFixed(1)}`;
                    }}
                    domain={[(dataMin: number) => {
                      // Check if there are any negative values in the data
                      const hasNegativeValues = data.some(item => item.depreciationAndAmortization < 0);
                      if (!hasNegativeValues) {
                        return 0; // Start from 0 if no negative values
                      }
                      // If there are negative values, use the symmetric range logic
                      const maxAbsValue = Math.max(
                        Math.abs(Math.min(...data.map(d => d.depreciationAndAmortization))),
                        Math.abs(Math.max(...data.map(d => d.depreciationAndAmortization)))
                      );
                      return -maxAbsValue;
                    }, (dataMax: number) => {
                      const maxValue = Math.max(...data.map(d => d.depreciationAndAmortization));
                      const roundedMax = Math.ceil(maxValue);
                      return roundedMax + (roundedMax < 10 ? 2 : Math.ceil(roundedMax * 0.2));
                    }]}
                  />
                  <Bar 
                    dataKey="depreciationAndAmortization"
                    fill="rgba(255, 198, 88, 0.3)"  // #ffc658 - matching main chart color
                    stroke="rgba(255, 198, 88, 0.6)"
                    label={<CustomLabel fill="#ffc658" />}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {data && data.length > 1 
                ? `YoY Growth: ${((data[data.length - 1]?.depreciationAndAmortization / data[data.length - 2]?.depreciationAndAmortization - 1) * 100).toFixed(2)}%`
                : 'YoY Growth: N/A'
              }
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Update the CustomLabel component
const CustomLabel = (props: any) => {
  const { x, y, width, height, value, fill } = props;
  const labelY = value < 0 ? y + height + 16 : y - 8;
  
  // Format the value consistently with Y-axis
  const formattedValue = (() => {
    const absValue = Math.abs(value);
    if (absValue >= 1e9 || absValue <= -1e9) {
      return `$${(value / 1e9).toFixed(1)}B`;
    } else if (absValue >= 1e6 || absValue <= -1e6) {
      return `$${(value / 1e6).toFixed(1)}M`;
    } else if (absValue >= 1e3 || absValue <= -1e3) {
      return `$${(value / 1e3).toFixed(1)}K`;
    }
    return `$${value.toFixed(1)}`;
  })();
  
  return (
    <text 
      x={x + width / 2} 
      y={labelY}
      fill={fill || "#374151"}
      textAnchor="middle"
      fontSize={10}
    >
      {formattedValue}
    </text>
  );
};

// Add a NoDataDisplay component at the top level
const NoDataDisplay = () => (
  <div className="flex items-center justify-center h-full">
    <span className="text-gray-500 text-sm">No data available</span>
  </div>
);