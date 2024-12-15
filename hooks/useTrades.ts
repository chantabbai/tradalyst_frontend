import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'

export type Trade = {
  id: string
  date: string
  symbol: string
  action: 'buy' | 'sell'
  quantity: number
  price: number
  type: 'stock' | 'option'
  optionType?: 'call' | 'put'
  strategy: string
  notes: string
  exitDate?: string
  exitPrice?: number
  profit?: number
  profitPercentage?: number
}

// Dummy data for each user
const dummyData: { [key: string]: Trade[] } = {
  user1: [
    {
      id: '1',
      date: '2023-05-01',
      symbol: 'AAPL',
      action: 'buy',
      quantity: 10,
      price: 150,
      type: 'stock',
      strategy: 'Long-term hold',
      notes: 'Bullish on Apple\'s new product line'
    },
    {
      id: '2',
      date: '2023-05-15',
      symbol: 'GOOGL',
      action: 'buy',
      quantity: 5,
      price: 2500,
      type: 'stock',
      strategy: 'Earnings play',
      notes: 'Expecting strong Q2 results'
    }
  ],
  user2: [
    {
      id: '1',
      date: '2023-06-01',
      symbol: 'TSLA',
      action: 'buy',
      quantity: 20,
      price: 200,
      type: 'stock',
      strategy: 'Momentum trade',
      notes: 'Following upward trend'
    },
    {
      id: '2',
      date: '2023-06-10',
      symbol: 'AMZN',
      action: 'sell',
      quantity: 15,
      price: 130,
      type: 'stock',
      strategy: 'Profit taking',
      notes: 'Reached price target'
    }
  ],
  user3: [
    {
      id: '1',
      date: '2023-07-01',
      symbol: 'MSFT',
      action: 'buy',
      quantity: 30,
      price: 300,
      type: 'stock',
      strategy: 'Value investing',
      notes: 'Undervalued based on fundamentals'
    },
    {
      id: '2',
      date: '2023-07-15',
      symbol: 'NVDA',
      action: 'buy',
      quantity: 8,
      price: 400,
      type: 'stock',
      strategy: 'Sector rotation',
      notes: 'Bullish on AI and chip demand'
    }
  ]
}

export function useTrades() {
  const [trades, setTrades] = useState<Trade[]>([])
  const { user } = useAuth()

  useEffect(() => {
    if (user) {
      const savedTrades = localStorage.getItem(`trades_${user.id}`)
      if (savedTrades) {
        setTrades(JSON.parse(savedTrades))
      } else {
        // If no saved trades, use dummy data or empty array for new users
        const initialTrades = dummyData[user.id] || []
        setTrades(initialTrades)
        localStorage.setItem(`trades_${user.id}`, JSON.stringify(initialTrades))
      }
    } else {
      setTrades([])
    }
  }, [user])

  const saveTrades = (updatedTrades: Trade[]) => {
    setTrades(updatedTrades)
    if (user) {
      localStorage.setItem(`trades_${user.id}`, JSON.stringify(updatedTrades))
    }
  }

  return { trades, saveTrades }
}