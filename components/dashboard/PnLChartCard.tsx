import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, ReferenceLine, Cell } from 'recharts'
import { formatProfit } from './utils'
import { ChartDataPoint } from './types'

interface PnLChartCardProps {
  chartData: ChartDataPoint[]
  timeFrame: string
  setTimeFrame: (value: string) => void
  isLoading: boolean
}

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

export function PnLChartCard({ chartData, timeFrame, setTimeFrame, isLoading }: PnLChartCardProps) {
  const [showDaily, setShowDaily] = useState(true)
  const [showCumulative, setShowCumulative] = useState(true)

  const calculateTotalPnL = (data: ChartDataPoint[]): number => {
    if (!data || data.length === 0) return 0;
    return data[data.length - 1].cumulativePnL;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col space-y-2">
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
  )
}
