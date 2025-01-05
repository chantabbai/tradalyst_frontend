
"use client"

import { ArrowDownIcon, ArrowUpIcon, InfoIcon } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { TradeStats } from "./types"
import { formatProfit } from "./utils"

interface PerformanceMetricsCardProps {
  tradeStats: TradeStats;
}

export function PerformanceMetricsCard({ tradeStats }: PerformanceMetricsCardProps) {
  return (
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

        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 rounded-lg bg-green-500/10">
            <span className="text-muted-foreground flex items-center gap-2 mb-2">
              <ArrowUpIcon className="h-4 w-4 text-green-500" />
              Best Trade
            </span>
            <span className="text-xl font-bold text-green-600 block">
              {tradeStats.biggestWin ? formatProfit(tradeStats.biggestWin) : '-'}
            </span>
          </div>

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
  )
}
