"use client"

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

type ValuationInputs = {
  revenue: number
  netIncome: number
  totalAssets: number
  totalLiabilities: number
  sharesOutstanding: number
  currentPrice: number
}

const initialInputs: ValuationInputs = {
  revenue: 0,
  netIncome: 0,
  totalAssets: 0,
  totalLiabilities: 0,
  sharesOutstanding: 0,
  currentPrice: 0,
}

export default function Valuation() {
  const [inputs, setInputs] = useState<ValuationInputs>(initialInputs)
  const [valuations, setValuations] = useState<{ [key: string]: number }>({})
  const { toast } = useToast()

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setInputs(prev => ({ ...prev, [name]: parseFloat(value) || 0 }))
  }

  const calculateValuations = () => {
    const { revenue, netIncome, totalAssets, totalLiabilities, sharesOutstanding, currentPrice } = inputs
    
    // Simple valuation models
    const peRatio = currentPrice / (netIncome / sharesOutstanding)
    const pbRatio = currentPrice / ((totalAssets - totalLiabilities) / sharesOutstanding)
    const psRatio = currentPrice / (revenue / sharesOutstanding)
    
    // Discounted Cash Flow (very simplified)
    const freeCashFlow = netIncome * 0.8 // Assuming 80% of net income is free cash flow
    const growthRate = 0.05 // Assuming 5% growth rate
    const discountRate = 0.1 // Assuming 10% discount rate
    const terminalValue = (freeCashFlow * (1 + growthRate)) / (discountRate - growthRate)
    const dcfValue = (freeCashFlow / (1 + discountRate)) + (terminalValue / Math.pow(1 + discountRate, 5))
    
    setValuations({
      'P/E Ratio': peRatio,
      'P/B Ratio': pbRatio,
      'P/S Ratio': psRatio,
      'DCF Value': dcfValue / sharesOutstanding,
    })

    toast({
      title: "Valuation Calculated",
      description: "Stock valuation has been updated based on the provided inputs.",
    })
  }

  const chartData = Object.entries(valuations).map(([key, value]) => ({
    name: key,
    value: value,
    currentPrice: inputs.currentPrice,
  }))

  return (
    <div className="container mx-auto p-4 space-y-6">
      <h1 className="text-3xl font-bold">Stock Valuation</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Financial Inputs</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(inputs).map(([key, value]) => (
                <div key={key}>
                  <Label htmlFor={key}>{key.charAt(0).toUpperCase() + key.slice(1)}</Label>
                  <Input
                    type="number"
                    id={key}
                    name={key}
                    value={value}
                    onChange={handleInputChange}
                  />
                </div>
              ))}
            </div>
            <Button type="button" onClick={calculateValuations}>Calculate Valuation</Button>
          </form>
        </CardContent>
      </Card>

      {Object.keys(valuations).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Valuation Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(valuations).map(([key, value]) => (
                <div key={key} className="flex justify-between">
                  <span>{key}:</span>
                  <span className="font-bold">{value.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {chartData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Valuation Comparison</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="value" fill="#8884d8" name="Calculated Value" />
                  <Bar dataKey="currentPrice" fill="#82ca9d" name="Current Price" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}