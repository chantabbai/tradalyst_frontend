
import { memo } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { ArrowUpIcon, ArrowDownIcon } from "lucide-react"

interface TradeStats {
  total: number;
  open: number;
  closed: number;
  winRatio: number;
}

const TradeStatisticsCard = memo(({ stats }: { stats: TradeStats }) => {
  return (
    <Card className="col-span-1">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Trade Statistics</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="text-center p-4 bg-secondary/20 rounded-lg relative overflow-hidden">
            <div className="relative z-10">
              <div className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-blue-400">
                {stats.total}
              </div>
              <div className="text-sm font-medium text-muted-foreground mt-1">Total Trades</div>
              <div className="text-xs text-muted-foreground mt-0.5">
                All Time Trading Activity
              </div>
            </div>
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_50%_120%,#3b82f6,transparent)]" />
          </div>
          
          <div className="space-y-2">
            <div className="h-2 w-full bg-secondary/20 rounded-full overflow-hidden mt-2">
              <div 
                className="h-full bg-gradient-to-r from-green-500 to-blue-500"
                style={{ 
                  width: `${(stats.closed / stats.total) * 100}%`,
                  transition: 'width 0.3s ease-in-out'
                }}
              />
            </div>

            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="relative p-3 bg-gradient-to-br from-green-500/10 to-green-500/5 rounded-lg border border-green-500/10">
                <div className="absolute top-3 right-3">
                  <ArrowUpIcon className="h-4 w-4 text-green-500" />
                </div>
                <div className="space-y-2">
                  <div className="text-sm font-medium text-muted-foreground">Open</div>
                  <div className="text-2xl font-bold text-green-600">
                    {stats.open}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Active Positions
                  </div>
                  <div className="text-sm font-medium text-green-600/80">
                    {((stats.open / stats.total) * 100).toFixed(1)}% of Total
                  </div>
                </div>
              </div>

              <div className="relative p-3 bg-gradient-to-br from-blue-500/10 to-blue-500/5 rounded-lg border border-blue-500/10">
                <div className="absolute top-3 right-3">
                  <ArrowDownIcon className="h-4 w-4 text-blue-500" />
                </div>
                <div className="space-y-2">
                  <div className="text-sm font-medium text-muted-foreground">Closed</div>
                  <div className="text-2xl font-bold text-blue-600">
                    {stats.closed}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Closed Trade
                  </div>
                  <div className="text-sm font-medium text-blue-600/80">
                    {((stats.closed / stats.total) * 100).toFixed(1)}% of Total
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
})

TradeStatisticsCard.displayName = 'TradeStatisticsCard'

export default TradeStatisticsCard
