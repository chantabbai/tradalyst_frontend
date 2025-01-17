
import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import { formatProfit } from './utils'
import { ChartDataPoint } from './types'

interface PnLChartCardProps {
  chartData: ChartDataPoint[]
  timeFrame: string
  setTimeFrame: (value: string) => void
  isLoading: boolean
}

export function PnLChartCard({ chartData, timeFrame, setTimeFrame, isLoading }: PnLChartCardProps) {
  const calculateTotalPnL = (data: ChartDataPoint[]): number => {
    if (!data || data.length === 0) return 0;
    return data.reduce((sum, d) => sum + (d.pnl || 0), 0);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-2 sm:space-y-0">
          <div className="flex flex-col">
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
          <Select value={timeFrame} onValueChange={setTimeFrame}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Select time frame" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1W">1 Week</SelectItem>
              <SelectItem value="1M">1 Month</SelectItem>
              <SelectItem value="3M">3 Months</SelectItem>
              <SelectItem value="6M">6 Months</SelectItem>
              <SelectItem value="YTD">YTD</SelectItem>
              <SelectItem value="ALL">All Time</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
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
              <LineChart 
                data={chartData}
                margin={{ top: 5, right: 30, left: 60, bottom: 25 }}
              >
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
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
                  formatter={(value: number) => [formatProfit(value), 'P/L']}
                  labelFormatter={(label) => new Date(label).toLocaleDateString()}
                />
                <Line 
                  type="monotone" 
                  dataKey="pnl" 
                  stroke="url(#colorGradient)"
                  strokeWidth={2}
                  dot={{ 
                    fill: (entry: any) => entry.pnl >= 0 ? '#16a34a' : '#dc2626',
                    stroke: (entry: any) => entry.pnl >= 0 ? '#16a34a' : '#dc2626'
                  }}
                />
                <defs>
                  <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#16a34a" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#dc2626" stopOpacity={0.8}/>
                  </linearGradient>
                </defs>
                <ReferenceLine y={0} stroke="#888888" strokeDasharray="3 3" />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
