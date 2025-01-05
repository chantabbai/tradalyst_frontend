
"use client"

import { InfoIcon } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { formatProfit } from "./utils"
import { isNumber } from "./utils"

interface TradingAnalyticsCardProps {
  profitMetrics: {
    profitFactor: number;
    grossProfits: number;
    grossLosses: number;
    maxDrawdown: number;
    consistencyScore: number;
  };
  durationMetrics: {
    averageDuration: number;
    tradeDurations: Array<{
      tradeId: string;
      symbol: string;
      daysHeld: number;
      entryDate: string;
      exitDate: string;
    }>;
  };
}

export function TradingAnalyticsCard({ profitMetrics, durationMetrics }: TradingAnalyticsCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center gap-2">
          <span className="text-lg font-semibold">Trading Analytics</span>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <InfoIcon className="h-4 w-4 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent className="max-w-sm p-4">
                <div className="space-y-3 text-sm">
                  <p className="font-medium">
                    <span className="text-primary">Consistency Score:</span> 
                    <span className="text-muted-foreground">Combined measure of win ratio (40%), profit factor (30%), and trade frequency (30%). Shows overall trading system stability.</span>
                  </p>
                  <p className="font-medium">
                    <span className="text-primary">Profit Factor:</span> 
                    <span className="text-muted-foreground">Ratio of gross profits to gross losses. Measures trading system efficiency.</span>
                  </p>
                  <div className="pl-4 text-muted-foreground">
                    <p>• Red (&lt;1.0): Losing system</p>
                    <p>• Yellow (1.0-1.5): Marginally profitable</p>
                    <p>• Green (&gt;1.5): Profitable system</p>
                  </div>
                  <p className="font-medium">
                    <span className="text-primary">Average Duration:</span> 
                    <span className="text-muted-foreground">Average holding period of trades. Indicates trading style (day trading, swing trading, etc.).</span>
                  </p>
                  <p className="font-medium">
                    <span className="text-primary">Maximum Drawdown:</span> 
                    <span className="text-muted-foreground">Largest peak-to-trough decline in account value. Key risk management metric.</span>
                  </p>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="text-xs text-muted-foreground">Consistency Score</div>
            <div className={`text-lg font-semibold ${
              (isNumber(profitMetrics?.consistencyScore) && profitMetrics.consistencyScore >= 70) ? 'text-green-600' :
              (isNumber(profitMetrics?.consistencyScore) && profitMetrics.consistencyScore >= 50) ? 'text-yellow-600' :
              'text-red-600'
            }`}>
              {isNumber(profitMetrics?.consistencyScore) 
                ? `${profitMetrics.consistencyScore.toFixed(1)}%` 
                : '0.0%'}
            </div>
            <div className="w-full bg-secondary/20 rounded-full h-1.5">
              <div 
                className={`h-1.5 rounded-full transition-all ${
                  (isNumber(profitMetrics?.consistencyScore) && profitMetrics.consistencyScore >= 70) ? 'bg-green-500' :
                  (isNumber(profitMetrics?.consistencyScore) && profitMetrics.consistencyScore >= 50) ? 'bg-yellow-500' :
                  'bg-red-500'
                }`}
                style={{ width: `${profitMetrics?.consistencyScore ?? 0}%` }}
              />
            </div>
          </div>

          <div className="pt-2 border-t space-y-2">
            <div className="text-xs text-muted-foreground">Profit Factor</div>
            <div className={`text-lg font-semibold ${
              isNumber(profitMetrics?.profitFactor) && profitMetrics.profitFactor >= 1.5 ? 'text-green-600' :
              isNumber(profitMetrics?.profitFactor) && profitMetrics.profitFactor >= 1 ? 'text-yellow-600' :
              'text-red-600'
            }`}>
              {isNumber(profitMetrics?.profitFactor) 
                ? profitMetrics.profitFactor.toFixed(2) 
                : '0.00'}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="text-xs text-muted-foreground">
                <span className="block">Gross Profit</span>
                <span className="text-green-600 font-medium">
                  {formatProfit(profitMetrics.grossProfits)}
                </span>
              </div>
              <div className="text-xs text-muted-foreground">
                <span className="block">Gross Loss</span>
                <span className="text-red-600 font-medium">
                  {formatProfit(profitMetrics.grossLosses)}
                </span>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t space-y-2">
            <div className="text-xs text-muted-foreground">Average Trade Duration</div>
            <div className="text-lg font-semibold">
              {isNumber(durationMetrics?.averageDuration) 
                ? `${Math.round(durationMetrics.averageDuration)} days`
                : '0 days'}
            </div>
          </div>

          <div className="pt-2 border-t space-y-2">
            <div className="text-xs text-muted-foreground">Maximum Drawdown</div>
            <div className="text-lg font-semibold text-red-600">
              {formatProfit(profitMetrics?.maxDrawdown)}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
