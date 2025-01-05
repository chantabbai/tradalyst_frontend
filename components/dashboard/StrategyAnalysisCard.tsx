
"use client"

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { formatProfit } from './utils'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Cell, RechartsTooltip } from 'recharts'

interface StrategyMetrics {
  strategy: string;
  totalPnL: number;
  tradeCount: number;
  winRatio: number;
  avgPnL: number;
}

interface StrategyAnalysisCardProps {
  strategyMetrics: StrategyMetrics[];
  sortConfig: {
    key: keyof StrategyMetrics;
    direction: 'asc' | 'desc';
  };
}

export function StrategyAnalysisCard({ strategyMetrics, sortConfig }: StrategyAnalysisCardProps) {
  const [showStrategyChart, setShowStrategyChart] = useState(true)

  const sortedStrategyMetrics = [...strategyMetrics].sort((a, b) => {
    const aValue = a[sortConfig.key];
    const bValue = b[sortConfig.key];
    
    if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-2 sm:space-y-0">
          <CardTitle className="text-base sm:text-lg font-semibold">Strategy P/L Analysis</CardTitle>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Table</span>
            <Switch
              checked={showStrategyChart}
              onCheckedChange={setShowStrategyChart}
            />
            <span className="text-sm font-medium">Chart</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          {showStrategyChart ? (
            <div className="h-[300px] sm:h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart 
                  data={strategyMetrics.slice(0, 10)}
                  margin={{ top: 5, right: 30, left: 80, bottom: 65 }}
                >
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis 
                    dataKey="strategy" 
                    angle={-45}
                    textAnchor="end"
                    height={80}
                    interval={0}
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis 
                    tickFormatter={(value) => formatProfit(value)}
                  />
                  <RechartsTooltip
                    formatter={(value: number, name: string) => [
                      formatProfit(value),
                      name === 'totalPnL' ? 'Total P/L' : name
                    ]}
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      borderRadius: '6px',
                      padding: '8px',
                      border: '1px solid #e5e7eb',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }}
                    cursor={{ fill: 'transparent' }}
                  />
                  <Bar 
                    dataKey="totalPnL" 
                    name="Total P/L"
                  >
                    {strategyMetrics.slice(0, 10).map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`}
                        fill={entry.totalPnL >= 0 ? '#16a34a' : '#dc2626'}
                        fillOpacity={0.8}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              {strategyMetrics.length > 10 && (
                <div className="text-sm text-muted-foreground text-center mt-2">
                  * Showing top 10 strategies by P/L. See table view for complete list.
                </div>
              )}
            </div>
          ) : (
            <div className="h-[400px] w-full overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="font-medium">Strategy</TableHead>
                    <TableHead className="font-medium text-right">Total P/L</TableHead>
                    <TableHead className="font-medium text-right">Trade Count</TableHead>
                    <TableHead className="font-medium text-right">Win Rate</TableHead>
                    <TableHead className="font-medium text-right">Avg P/L</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedStrategyMetrics.map((strategy, index) => (
                    <TableRow 
                      key={index}
                      className="hover:bg-muted/50 transition-colors"
                    >
                      <TableCell className="font-medium">{strategy.strategy}</TableCell>
                      <TableCell className={`text-right ${
                        strategy.totalPnL >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {formatProfit(strategy.totalPnL)}
                      </TableCell>
                      <TableCell className="text-right">
                        {strategy.tradeCount}
                      </TableCell>
                      <TableCell className="text-right">
                        {(strategy.winRatio * 100).toFixed(2)}%
                      </TableCell>
                      <TableCell className={`text-right ${
                        strategy.avgPnL >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {formatProfit(strategy.avgPnL)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
