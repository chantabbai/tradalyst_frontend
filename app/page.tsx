"use client"

import Link from 'next/link'
import { Button } from "@/components/ui/button"
import { 
  BarChart2, BookOpen, TrendingUp, 
  Shield, LineChart, ClipboardCheck, 
  Target, History, Database, ArrowRight, ChevronDown 
} from 'lucide-react'
import { motion } from "framer-motion"

const features = [
  {
    icon: BookOpen,
    title: "Smart Trade Journal",
    description: "Track your trades with precision. Log entries, exits, and manage positions with our intuitive journal system. Perfect for both stock and options trading."
  },
  {
    icon: BarChart2,
    title: "Performance Dashboard",
    description: "Visualize your trading performance with custom metrics, win rates, and profit analysis. Make data-driven decisions to improve your strategy."
  },
  {
    icon: TrendingUp,
    title: "Stock Analysis Tools",
    description: "Comprehensive stock analysis with price tracking, technical indicators, financial metrics, and multiple valuation models. Includes detailed financial statements analysis and dividend tracking."
  },
  {
    icon: Shield,
    title: "Secure & Private",
    description: "Your trading data is yours alone. We ensure complete privacy and security of your sensitive trading information."
  },
  {
    icon: History,
    title: "Trade History",
    description: "Access your complete trading history with detailed logs of all entries, exits, and partial positions. Perfect for tax reporting and strategy refinement."
  }
]

const benefits = [
  {
    stat: "3-in-1",
    title: "Trading Tools",
    description: "Stock Analysis, Journal, and Performance tracking in one platform",
    icon: BarChart2,
    metricLabel: "Integrated Tools"
  },
  {
    stat: "Wide",
    title: "Financial Metrics",
    description: "DCF, Graham, Lynch, Buffett valuations with key financial ratios",
    icon: TrendingUp,
    metricLabel: "Valuation Models"
  },
  {
    stat: "Full",
    title: "Data Control",
    description: "No third-party integrations - complete control and privacy of your trading data",
    icon: Shield,
    metricLabel: "Data Privacy"
  }
]

const keyFeatures = [
  {
    icon: Target,
    title: "Trade Management",
    points: [
      "Track entries and exits with precision",
      "Manage partial positions effortlessly",
      "Document your trading strategy",
      "Monitor open positions"
    ]
  },
  {
    icon: LineChart,
    title: "Performance Tracking",
    points: [
      "Calculate win rates and profit metrics",
      "Track performance over time",
      "Analyze trading patterns",
      "Identify areas for improvement"
    ]
  },
  {
    icon: ClipboardCheck,
    title: "Analysis Tools",
    points: [
      "Stock price tracking with technical indicators",
      "Comprehensive financial metrics and valuation analysis",
      "Interactive charts with multiple timeframes",
      "Dividend analysis and history tracking",
      "Graham, Lynch, and Buffett valuation models",
      "Detailed financial statements analysis"
    ]
  }
]

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="min-h-[75vh] py-12 px-4 flex items-center justify-center bg-background/50 relative overflow-hidden backdrop-blur-3xl">
        {/* Modern gradient background */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:60px_60px]" />
          <motion.div
            className="absolute -top-[25%] left-[50%] h-[600px] w-[600px] rounded-full bg-gradient-to-r from-primary/20 to-purple-500/20 blur-[120px]"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.2, 0.3],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "linear"
            }}
          />
          <motion.div
            className="absolute -bottom-[25%] left-[25%] h-[600px] w-[600px] rounded-full bg-gradient-to-r from-blue-500/20 to-primary/20 blur-[120px]"
            animate={{
              scale: [1.2, 1, 1.2],
              opacity: [0.2, 0.3, 0.2],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "linear"
            }}
          />
        </div>

        <div className="max-w-4xl mx-auto space-y-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-8 text-center"
          >
            {/* Modern heading with gradient text */}
            <motion.div 
              className="relative"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight leading-none">
                <span className="block mb-3 bg-clip-text text-transparent bg-gradient-to-r from-gray-900/80 to-gray-600 dark:from-gray-100 dark:to-gray-400">
                  Analyze Deeper.
                </span>
                <span className="relative inline-block">
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/80">
                    Trade Smarter
                  </span>
                  <motion.div
                    className="absolute -bottom-2 left-0 w-full h-[2px]"
                    style={{
                      background: 'linear-gradient(to right, var(--primary), transparent)'
                    }}
                    initial={{ scaleX: 0, opacity: 0 }}
                    animate={{ scaleX: 1, opacity: 1 }}
                    transition={{ delay: 0.8, duration: 0.6 }}
                  />
                </span>
              </h1>
            </motion.div>

            {/* Refined description */}
            <motion.p 
              className="text-base md:text-lg text-muted-foreground/90 max-w-xl mx-auto leading-relaxed font-medium"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
            >
              Your one-stop platform to analyze stocks, journal trades, and reflect on performance
            </motion.p>

            {/* Modern tagline */}
            <motion.p 
              className="text-sm md:text-base font-medium text-primary/90 tracking-wider"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.5 }}
            >
              Where data drives trading decisions
            </motion.p>

            {/* Modern CTA buttons */}
            <motion.div 
              className="flex flex-col sm:flex-row justify-center gap-4 pt-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.5 }}
            >
              <Link href="/auth/register">
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button 
                    size="lg" 
                    className="w-full sm:w-auto px-8 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary"
                  >
                    Get Started
                    <motion.div
                      className="inline-block ml-2"
                      initial={{ x: 0 }}
                      whileHover={{ x: 5 }}
                    >
                      <ArrowRight className="w-4 h-4" />
                    </motion.div>
                  </Button>
                </motion.div>
              </Link>
              <Link href="/auth/login">
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button 
                    variant="outline" 
                    size="lg"
                    className="w-full sm:w-auto border-primary/20 hover:bg-primary/5"
                  >
                    Sign In
                  </Button>
                </motion.div>
              </Link>
            </motion.div>

            {/* Modern scroll indicator */}
            <motion.div 
              className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2, duration: 0.5 }}
            >
              <motion.div
                animate={{ y: [0, 8, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                className="text-primary/60 hover:text-primary/80 transition-colors"
              >
                <ChevronDown className="w-6 h-6" />
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Core Features Overview */}
      <section className="py-8 px-4 bg-background/50 relative z-20 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto">
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-3 gap-6 -mt-32"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {[
              {
                title: 'Trade Journal',
                description: 'Track trades & positions',
                icon: BookOpen
              },
              {
                title: 'Stock Analysis',
                description: 'Valuation & Financial Metrics',
                icon: TrendingUp
              },
              {
                title: 'Performance',
                description: 'Track your trading metrics',
                icon: BarChart2
              }
            ].map((item, index) => (
              <motion.div
                key={item.title}
                className="relative overflow-hidden"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.2, duration: 0.5 }}
                whileHover={{ y: -5 }}
              >
                <div className="p-8 rounded-lg border border-primary/10 bg-background/60 backdrop-blur-sm relative">
                  {/* Gradient background */}
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent" />
                  
                  {/* Content */}
                  <div className="relative z-10">
                    <div className="flex flex-col items-center text-center">
                      <div className="mb-4 p-3 rounded-full bg-primary/10">
                        <item.icon className="w-8 h-8 text-primary" />
                      </div>
                      <h3 className="text-xl font-semibold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-gray-100 dark:to-gray-300">
                        {item.title}
                      </h3>
                      <p className="text-muted-foreground/80">
                        {item.description}
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Key Features Grid */}
      <section className="py-20 px-4 bg-muted/50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">
            Everything You Need to Succeed
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="p-6 bg-background rounded-lg shadow-sm hover:shadow-md transition-shadow"
              >
                <feature.icon className="w-12 h-12 text-primary mb-4" />
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 px-4 bg-muted/50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">
            Why Choose Tradalyst?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {benefits.map((benefit) => (
              <motion.div 
                key={benefit.title} 
                className="relative"
                whileHover={{ y: -5 }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                {/* Trading Terminal Style Card */}
                <div className="bg-background rounded-lg p-6 border border-primary/20">
                  {/* Header with Icon */}
                  <div className="flex items-center justify-between mb-4">
                    <benefit.icon className="w-6 h-6 text-primary" />
                    <div className="text-xs text-muted-foreground px-2 py-1 bg-muted rounded">
                      {benefit.metricLabel}
                    </div>
                  </div>
                  
                  {/* Metric Display */}
                  <div className="mb-4">
                    <div className="text-3xl font-bold text-primary flex items-baseline gap-2">
                      {benefit.stat}
                      <div className="flex items-center text-sm text-muted-foreground">
                        <motion.div
                          className="w-16 h-8"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                        >
                          <svg className="w-full h-full">
                            <motion.path
                              d={`M 0,20 Q 8,${Math.random() * 20} 16,${Math.random() * 20} T 32,${Math.random() * 20} T 48,${Math.random() * 20}`}
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              initial={{ pathLength: 0 }}
                              animate={{ pathLength: 1 }}
                              transition={{ duration: 2, repeat: Infinity }}
                            />
                          </svg>
                        </motion.div>
                      </div>
                    </div>
                    <h3 className="text-lg font-semibold mt-2">{benefit.title}</h3>
                  </div>

                  {/* Description */}
                  <p className="text-sm text-muted-foreground">{benefit.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-background">
        <div className="max-w-3xl mx-auto text-center space-y-6">
          <h2 className="text-3xl font-bold">Ready to Level Up Your Trading?</h2>
          <p className="text-xl text-muted-foreground">
            Join traders who are taking control of their trading journey
          </p>
          <Link href="/auth/register">
            <Button size="lg" className="mt-4 px-8">Get Started</Button>
          </Link>
        </div>
      </section>
    </div>
  )
}
