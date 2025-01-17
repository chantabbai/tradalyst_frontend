
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Calendar } from "@/components/ui/calendar"
import { ArrowUpIcon, ArrowDownIcon } from "lucide-react"
import { formatProfit } from './utils'
import { ChartDataPoint } from './types'

interface PnLCalendarCardProps {
  viewMode: 'month' | 'day'
  setViewMode: (mode: 'month' | 'day') => void
  selectedDate: Date
  setSelectedDate: (date: Date) => void
  selectedYear: number
  setSelectedYear: (year: number) => void
  yearlyPnL: { year: number; totalPnL: number } | null
  chartData: ChartDataPoint[]
}

export function PnLCalendarCard({
  viewMode,
  setViewMode,
  selectedDate,
  setSelectedDate,
  selectedYear,
  setSelectedYear,
  yearlyPnL,
  chartData
}: PnLCalendarCardProps) {
  return (
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
            <div className="h-[400px] border rounded-lg overflow-hidden">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
                className="w-full h-full"
                components={{
                  Day: ({ date, ...props }) => {
                    const profit = chartData.find(d => d.date === date.toISOString().split('T')[0])?.pnl
                    const isToday = date.toDateString() === new Date().toDateString()
                    const isSelected = date.toDateString() === selectedDate?.toDateString()
                    const isCurrentMonth = date.getMonth() === selectedDate.getMonth()
                    const isPastDate = date < new Date(new Date().setHours(0, 0, 0, 0))
                    const isWeekend = date.getDay() === 0 || date.getDay() === 6
                    
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
                              ? `rgba(34, 197, 94, ${Math.min(Math.abs(profit) / 1000, 0.4)})`
                              : `rgba(239, 68, 68, ${Math.min(Math.abs(profit) / 1000, 0.4)})`
                            : isWeekend 
                              ? 'var(--gray-500)'
                              : 'var(--background)',
                          opacity: !isCurrentMonth ? 0.4 : isWeekend ? 0.8 : 1
                        }}
                      >
                        <div className="text-sm font-medium">
                          {date.getDate()}
                        </div>
                        {profit !== undefined && (
                          <div className="text-xs">
                            <span className={profit > 0 ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}>
                              {formatProfit(profit)}
                            </span>
                          </div>
                        )}
                      </div>
                    )
                  },
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
                    {Array.from(
                      { length: 5 },
                      (_, i) => new Date().getFullYear() - i
                    ).map(year => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
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
                    .reduce((sum, d) => sum + d.pnl, 0)
                  
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
                          ? `rgba(34, 197, 94, ${Math.min(Math.abs(monthlyProfit) / 10000, 0.4)})` 
                          : monthlyProfit < 0 
                            ? `rgba(239, 68, 68, ${Math.min(Math.abs(monthlyProfit) / 10000, 0.4)})`
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
  )
}
