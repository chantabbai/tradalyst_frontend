"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  BarChart2,
  BookOpen,
  TrendingUp,
  Shield,
  LineChart,
  ClipboardCheck,
  Target,
  History,
  ArrowUp,
} from "lucide-react";
import { motion, useInView } from "framer-motion";

const features = [
  {
    icon: BookOpen,
    title: "Smart Trade Journal",
    description:
      "Track your trades with precision. Log entries, exits, and manage positions with our intuitive journal system. Perfect for both stock and options trading.",
  },
  {
    icon: BarChart2,
    title: "Performance Dashboard",
    description:
      "Visualize your trading performance with custom metrics, win rates, and profit analysis. Make data-driven decisions to improve your strategy.",
  },
  {
    icon: TrendingUp,
    title: "Stock Analysis Tools",
    description:
      "Comprehensive stock analysis with price tracking, technical indicators, financial metrics, and multiple valuation models. Includes detailed financial statements analysis and dividend tracking.",
  },
  {
    icon: Shield,
    title: "Secure & Private",
    description:
      "Your trading data is yours alone. We ensure complete privacy and security of your sensitive trading information.",
  },
  {
    icon: History,
    title: "Trade History",
    description:
      "Access your complete trading history with detailed logs of all entries, exits, and partial positions. Perfect for tax reporting and strategy refinement.",
  },
];

const benefits = [
  {
    stat: "3-in-1",
    title: "Trading Tools",
    description:
      "Stock Analysis, Journal, and Performance tracking in one platform",
    icon: BarChart2,
    metricLabel: "Integrated Tools",
  },
  {
    stat: "Wide",
    title: "Financial Metrics",
    description:
      "DCF, Graham, Lynch, Buffett valuations with key financial ratios",
    icon: TrendingUp,
    metricLabel: "Valuation Models",
  },
  {
    stat: "Full",
    title: "Data Control",
    description:
      "No third-party integrations - complete control and privacy of your trading data",
    icon: Shield,
    metricLabel: "Data Privacy",
  },
];

const keyFeatures = [
  {
    icon: Target,
    title: "Trade Management",
    points: [
      "Track entries and exits with precision",
      "Manage partial positions effortlessly",
      "Document your trading strategy",
      "Monitor open positions",
    ],
  },
  {
    icon: LineChart,
    title: "Performance Tracking",
    points: [
      "Calculate win rates and profit metrics",
      "Track performance over time",
      "Analyze trading patterns",
      "Identify areas for improvement",
    ],
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
      "Detailed financial statements analysis",
    ],
  },
];

const BackToTop: React.FC = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const toggleVisible = () => {
      if (typeof window !== "undefined") {
        setVisible(window.pageYOffset > 500);
      }
    };

    if (typeof window !== "undefined") {
      window.addEventListener("scroll", toggleVisible);
      return () => window.removeEventListener("scroll", toggleVisible);
    }
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return (
    <motion.button
      className="fixed bottom-8 right-8 p-4 rounded-full bg-background/80 border border-primary/20 shadow-lg backdrop-blur-sm z-50 group"
      initial={{ opacity: 0 }}
      animate={{ opacity: visible ? 1 : 0 }}
      whileHover={{ scale: 1.1 }}
      onClick={scrollToTop}
    >
      {/* Gradient background on hover */}
      <motion.div className="absolute inset-0 rounded-full bg-gradient-to-tr from-primary/20 to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      {/* Arrow icon with animation */}
      <motion.div
        className="relative text-primary"
        whileHover={{
          y: -2,
          transition: {
            repeat: Infinity,
            repeatType: "reverse",
            duration: 0.5,
          },
        }}
      >
        <ArrowUp className="w-5 h-5" />
      </motion.div>

      {/* Ripple effect */}
      <motion.div
        className="absolute inset-0 rounded-full border-2 border-primary/30"
        initial={{ scale: 1 }}
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0, 0.3],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
    </motion.button>
  );
};

export default function HomePage() {
  const featuresRef = useRef(null);
  const benefitsRef = useRef(null);
  const ctaRef = useRef(null);

  const featuresInView = useInView(featuresRef, { once: true });
  const benefitsInView = useInView(benefitsRef, { once: true });
  const ctaInView = useInView(ctaRef, { once: true });

  const [scrollProgress, setScrollProgress] = useState(0);
  const [y, setY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      if (typeof window !== "undefined") {
        const totalScroll =
          document.documentElement.scrollHeight - window.innerHeight;
        const currentProgress = window.scrollY;
        setScrollProgress((currentProgress / totalScroll) * 100);
        setY(window.scrollY);
      }
    };

    if (typeof window !== "undefined") {
      window.addEventListener("scroll", handleScroll);
      return () => window.removeEventListener("scroll", handleScroll);
    }
  }, []);

  return (
    <div className="flex flex-col min-h-screen">
      <motion.div
        className="fixed top-0 left-0 right-0 h-1 bg-primary/30 z-50"
        style={{
          scaleX: scrollProgress / 100,
          transformOrigin: "0%",
        }}
      />
      {/* Hero Section */}
      <section className="min-h-[75vh] py-8 md:py-12 px-4 flex items-center justify-center bg-background/50 relative overflow-hidden backdrop-blur-3xl">
        {/* Modern gradient background */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:60px_60px]" />
          <motion.div
            className="absolute -top-[25%] left-[50%] h-[300px] sm:h-[400px] md:h-[600px] w-[300px] sm:w-[400px] md:w-[600px] rounded-full bg-gradient-to-r from-primary/20 to-purple-500/20 blur-[60px] sm:blur-[90px] md:blur-[120px]"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.2, 0.3],
              x: [0, 25, 0],
              y: [0, -15, 0],
            }}
            transition={{
              duration: 10,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
          <motion.div
            className="absolute -bottom-[25%] left-[25%] h-[300px] sm:h-[400px] md:h-[600px] w-[300px] sm:w-[400px] md:w-[600px] rounded-full bg-gradient-to-r from-blue-500/20 to-primary/20 blur-[60px] sm:blur-[90px] md:blur-[120px]"
            animate={{
              scale: [1.2, 1, 1.2],
              opacity: [0.2, 0.3, 0.2],
              x: [0, -25, 0],
              y: [0, 15, 0],
            }}
            transition={{
              duration: 10,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        </div>

        <motion.div className="max-w-4xl mx-auto space-y-8 relative z-10">
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
                      background:
                        "linear-gradient(to right, var(--primary), transparent)",
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
              Your one-stop platform to analyze stocks, journal trades, and
              reflect on performance
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

            {/* Modern CTA buttons - Static positioning */}
            <motion.div
              className="flex flex-col sm:flex-row justify-center gap-2 sm:gap-4 px-4 sm:px-0 pt-6 sm:pt-8 mb-24 sm:mb-32 w-full sm:w-auto"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.5 }}
            >
              <Link href="/auth/register" className="w-full sm:w-auto">
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full"
                >
                  <Button
                    size="lg"
                    className="w-full sm:w-auto px-6 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary relative group overflow-hidden"
                  >
                    <span className="relative z-10">Get Started</span>

                    {/* Pulsing ring effect */}
                    <motion.div
                      className="absolute inset-0 rounded-lg border-2 border-white/30"
                      initial={{ scale: 1 }}
                      animate={{
                        scale: [1, 1.1, 1],
                        opacity: [0.3, 0, 0.3],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                    />

                    {/* Floating particles */}
                    {[...Array(3)].map((_, i) => (
                      <motion.div
                        key={i}
                        className="absolute w-1 h-1 rounded-full bg-white/40"
                        initial={{
                          x: 0,
                          y: 20,
                          opacity: 0,
                        }}
                        animate={{
                          x: [-20, 20],
                          y: [-20, -40],
                          opacity: [0, 1, 0],
                        }}
                        transition={{
                          duration: 2,
                          delay: i * 0.3,
                          repeat: Infinity,
                          ease: "easeOut",
                        }}
                        style={{
                          left: `${50 + i * 20}%`,
                        }}
                      />
                    ))}

                    {/* Gradient shine effect */}
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                      initial={{ x: "-100%", opacity: 0 }}
                      animate={{
                        x: ["100%", "-100%"],
                        opacity: [0, 0.5, 0],
                      }}
                      transition={{
                        duration: 3,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                    />
                  </Button>
                </motion.div>
              </Link>
              <Link href="/auth/login" className="w-full sm:w-auto">
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full"
                >
                  <Button
                    variant="outline"
                    size="lg"
                    className="w-full sm:w-auto px-6 border-primary/20 hover:bg-primary/5 relative"
                  >
                    Sign In
                  </Button>
                </motion.div>
              </Link>
            </motion.div>
          </motion.div>
        </motion.div>
      </section>

      {/* Core Features Overview */}
      <section
        className="py-8 px-4 bg-background/50 relative z-40 backdrop-blur-sm"
        ref={featuresRef}
      >
        <motion.div
          className="max-w-6xl mx-auto"
          initial={{ opacity: 0 }}
          animate={featuresInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.5 }}
        >
          <motion.div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 px-4">
            {[
              {
                title: "Trade Journal",
                description: "Track trades & positions",
                icon: BookOpen,
              },
              {
                title: "Stock Analysis",
                description: "Valuation & Financial Metrics",
                icon: TrendingUp,
              },
              {
                title: "Performance",
                description: "Track your trading metrics",
                icon: BarChart2,
              },
            ].map((item, index) => (
              <motion.div
                key={item.title}
                className="relative overflow-hidden"
                initial={{ opacity: 0, y: 50 }}
                animate={featuresInView ? { opacity: 1, y: 0 } : {}}
                transition={{
                  delay: index * 0.2,
                  duration: 0.5,
                  type: "spring",
                  stiffness: 100,
                }}
                whileHover={{
                  y: -5,
                  transition: { duration: 0.2 },
                }}
              >
                <div className="p-8 rounded-lg border border-primary/10 bg-background/60 backdrop-blur-sm relative group">
                  {/* Add hover effect to gradient background */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100"
                    initial={{ rotate: 0 }}
                    whileHover={{ rotate: 6 }}
                    transition={{ duration: 0.3 }}
                  />

                  {/* Content */}
                  <div className="relative z-10">
                    <motion.div
                      className="flex flex-col items-center text-center"
                      whileHover={{ scale: 1.02 }}
                      transition={{ duration: 0.2 }}
                    >
                      <motion.div
                        className="mb-4 p-3 rounded-full bg-primary/10"
                        whileHover={{
                          scale: 1.1,
                          rotate: [0, 5, -5, 0],
                        }}
                        transition={{ duration: 0.3 }}
                      >
                        <item.icon className="w-8 h-8 text-primary" />
                      </motion.div>
                      <h3 className="text-xl font-semibold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-gray-100 dark:to-gray-300">
                        {item.title}
                      </h3>
                      <p className="text-muted-foreground/80">
                        {item.description}
                      </p>
                    </motion.div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
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
      <section className="py-12 md:py-20 px-4 bg-muted/50" ref={benefitsRef}>
        <motion.div
          className="max-w-6xl mx-auto"
          initial={{ opacity: 0, y: 50 }}
          animate={benefitsInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
        >
          <motion.h2
            className="text-2xl md:text-3xl font-bold text-center mb-8 md:mb-12"
            initial={{ opacity: 0, y: 20 }}
            animate={benefitsInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            Why Choose Tradalyst?
          </motion.h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-8 px-4">
            {benefits.map((benefit, index) => (
              <motion.div
                key={benefit.title}
                className="relative group"
                initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
                animate={benefitsInView ? { opacity: 1, x: 0 } : {}}
                transition={{
                  delay: index * 0.2,
                  duration: 0.5,
                  type: "spring",
                  stiffness: 100,
                }}
                whileHover={{
                  y: -5,
                  scale: 1.02,
                  transition: { duration: 0.2 },
                }}
              >
                <div className="absolute -inset-0.5 bg-gradient-to-r from-primary to-purple-600 rounded-lg blur opacity-0 group-hover:opacity-30 transition duration-300" />
                <div className="bg-background rounded-lg p-6 border border-primary/20 relative">
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
                          <svg className="w-full h-full" viewBox="0 0 48 24">
                            <motion.path
                              initial={{ pathLength: 0 }}
                              animate={{ pathLength: 1 }}
                              transition={{
                                duration: 2,
                                repeat: Infinity,
                                ease: "easeInOut",
                              }}
                              d="M0 12 C12 12, 12 2, 24 2 S36 12, 48 12"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                            />
                          </svg>
                        </motion.div>
                      </div>
                    </div>
                    <h3 className="text-lg font-semibold mt-2">
                      {benefit.title}
                    </h3>
                  </div>

                  {/* Description */}
                  <p className="text-sm text-muted-foreground">
                    {benefit.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* CTA Section */}
      <section className="py-12 md:py-20 px-4 bg-background" ref={ctaRef}>
        <motion.div
          className="max-w-3xl mx-auto text-center space-y-4 md:space-y-6 px-4"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={ctaInView ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 0.5 }}
        >
          <motion.h2
            className="text-2xl md:text-3xl font-bold"
            animate={{
              scale: [1, 1.02, 1],
              transition: {
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              },
            }}
          >
            Ready to Level Up Your Trading?
          </motion.h2>
          <motion.p
            className="text-lg md:text-xl text-muted-foreground"
            initial={{ opacity: 0, y: 20 }}
            animate={ctaInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            Join traders who are taking control of their trading journey
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={ctaInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.4, duration: 0.5 }}
          >
            <Link href="/auth/register" className="inline-block mt-4">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  size="lg"
                  className="px-6 md:px-8 py-2 md:py-3 text-sm md:text-base relative overflow-hidden group"
                >
                  <motion.span
                    className="absolute inset-0 bg-primary/20"
                    initial={{ x: "-100%" }}
                    whileHover={{ x: "100%" }}
                    transition={{ duration: 0.5 }}
                  />
                  <span className="relative z-10">Get Started</span>
                </Button>
              </motion.div>
            </Link>
          </motion.div>
        </motion.div>
      </section>

      <BackToTop />
    </div>
  );
}
