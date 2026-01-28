import { useState, useEffect, useCallback } from 'react';
import { MarketNews } from '@/types/trading';

// Generate simulated market news
const generateNews = (): MarketNews[] => {
  const newsTemplates = [
    {
      title: 'Reliance Industries announces major expansion in retail sector',
      summary: 'Reliance Retail plans to open 500 new stores across India in the next fiscal year, marking one of the largest retail expansions in the country.',
      source: 'Economic Times',
      stockSymbol: 'RELIANCE',
      sentiment: 'positive' as const,
    },
    {
      title: 'TCS wins $2 billion deal with major European bank',
      summary: 'Tata Consultancy Services bags one of its largest deals with a leading European financial institution for digital transformation.',
      source: 'Business Standard',
      stockSymbol: 'TCS',
      sentiment: 'positive' as const,
    },
    {
      title: 'Infosys faces class action lawsuit in US',
      summary: 'Investors file class action against Infosys citing alleged violations of securities laws related to whistleblower complaints.',
      source: 'Reuters',
      stockSymbol: 'INFY',
      sentiment: 'negative' as const,
    },
    {
      title: 'HDFC Bank maintains steady growth in Q3 results',
      summary: 'India\'s largest private lender reports 18% growth in net profit, beating analyst expectations on strong loan book expansion.',
      source: 'Moneycontrol',
      stockSymbol: 'HDFC',
      sentiment: 'positive' as const,
    },
    {
      title: 'RBI raises concerns over banking sector NPAs',
      summary: 'Reserve Bank of India warns about rising non-performing assets in the banking sector, urging banks to strengthen credit monitoring.',
      source: 'Mint',
      stockSymbol: 'ICICI',
      sentiment: 'negative' as const,
    },
    {
      title: 'Wipro announces strategic acquisition in cloud services',
      summary: 'Wipro acquires a UK-based cloud consulting firm for $300 million to strengthen its cloud transformation capabilities.',
      source: 'Bloomberg',
      stockSymbol: 'WIPRO',
      sentiment: 'positive' as const,
    },
    {
      title: 'Global steel prices decline amid demand concerns',
      summary: 'Steel prices fall 8% globally as China\'s construction sector slowdown impacts demand forecasts for major producers.',
      source: 'Financial Times',
      stockSymbol: 'TATASTEEL',
      sentiment: 'negative' as const,
    },
    {
      title: 'Bharti Airtel 5G rollout accelerates across metros',
      summary: 'Airtel expands its 5G network to cover 10 additional cities, bringing the total coverage to 40 major urban centers.',
      source: 'ET Telecom',
      stockSymbol: 'BHARTIARTL',
      sentiment: 'positive' as const,
    },
    {
      title: 'Markets rally on positive global cues',
      summary: 'Indian benchmark indices gain over 1% as US Federal Reserve signals potential pause in interest rate hikes.',
      source: 'CNBC-TV18',
      sentiment: 'positive' as const,
    },
    {
      title: 'IT sector faces headwinds amid global recession fears',
      summary: 'Analysts downgrade IT sector outlook citing client spending cuts and delayed deal closures in key markets.',
      source: 'Hindu Business Line',
      sentiment: 'negative' as const,
    },
    {
      title: 'FIIs continue buying spree in Indian equities',
      summary: 'Foreign institutional investors pump in ₹15,000 crore in Indian markets in January, signaling strong confidence.',
      source: 'Business Today',
      sentiment: 'positive' as const,
    },
    {
      title: 'Government announces PLI scheme expansion',
      summary: 'Production Linked Incentive scheme expanded to include more sectors, boosting manufacturing outlook for India.',
      source: 'India Today',
      sentiment: 'neutral' as const,
    },
  ];

  return newsTemplates.map((template, index) => ({
    id: `news-${index}`,
    ...template,
    publishedAt: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000),
  }));
};

export const useMarketNews = () => {
  const [news, setNews] = useState<MarketNews[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNews = useCallback(async () => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    return generateNews();
  }, []);

  useEffect(() => {
    const loadNews = async () => {
      setLoading(true);
      const newsData = await fetchNews();
      setNews(newsData.sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime()));
      setLoading(false);
    };

    loadNews();

    // Refresh news periodically
    const interval = setInterval(loadNews, 60000);
    return () => clearInterval(interval);
  }, [fetchNews]);

  const getNewsByStock = useCallback((symbol: string) => {
    return news.filter(n => n.stockSymbol === symbol);
  }, [news]);

  return {
    news,
    loading,
    getNewsByStock,
    refreshNews: fetchNews,
  };
};
