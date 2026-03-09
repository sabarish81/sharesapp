import YahooFinance from 'yahoo-finance2';

// Create instance (required in v3)
const yf = new YahooFinance();

// Cache for API responses
const cache = new Map();
const CACHE_TTL = 60000; // 1 minute

function getCached(key) {
    const entry = cache.get(key);
    if (entry && Date.now() - entry.time < CACHE_TTL) return entry.data;
    return null;
}

function setCache(key, data) {
    cache.set(key, { data, time: Date.now() });
}


export async function getQuote(symbol) {
    const cacheKey = `quote:${symbol}`;
    const cached = getCached(cacheKey);
    if (cached) return cached;

    try {
        const [quote, summary] = await Promise.all([
            yf.quote(symbol),
            yf.quoteSummary(symbol, {
                modules: ['price', 'summaryDetail', 'defaultKeyStatistics', 'financialData', 'majorHoldersBreakdown', 'earningsTrend']
            }).catch(() => null)
        ]);

        const data = formatQuoteData(quote, summary);
        setCache(cacheKey, data);
        return data;
    } catch (err) {
        console.error(`Error fetching quote for ${symbol}:`, err.message);
        throw err;
    }
}

function formatQuoteData(quote, summary) {
    const price = summary?.price || {};
    const detail = summary?.summaryDetail || {};
    const stats = summary?.defaultKeyStatistics || {};
    const financial = summary?.financialData || {};
    const holders = summary?.majorHoldersBreakdown || {};

    const marketCap = quote.marketCap || 0;
    let capCategory = 'Small Cap';
    if (marketCap > 500000000000) capCategory = 'Large Cap'; // 50,000 Cr+
    else if (marketCap > 50000000000) capCategory = 'Mid Cap'; // 5,000 Cr+

    return {
        symbol: quote.symbol,
        name: quote.shortName || quote.longName || quote.symbol,
        exchange: quote.exchange,
        currency: quote.currency || 'INR',
        price: quote.regularMarketPrice,
        previousClose: quote.regularMarketPreviousClose,
        open: quote.regularMarketOpen,
        dayHigh: quote.regularMarketDayHigh,
        dayLow: quote.regularMarketDayLow,
        change: quote.regularMarketChange,
        changePercent: quote.regularMarketChangePercent,
        volume: quote.regularMarketVolume,
        avgVolume: quote.averageDailyVolume3Month,
        marketCap: quote.marketCap,
        capCategory,

        // Ratios
        pe: detail.trailingPE || quote.trailingPE,
        forwardPe: detail.forwardPE || quote.forwardPE,
        pb: detail.priceToBook || stats.priceToBook,
        dividendYield: detail.dividendYield ? detail.dividendYield * 100 : null,
        dividendRate: detail.dividendRate,

        // 52 Week
        fiftyTwoWeekHigh: quote.fiftyTwoWeekHigh,
        fiftyTwoWeekLow: quote.fiftyTwoWeekLow,
        fiftyDayAvg: quote.fiftyDayAverage,
        twoHundredDayAvg: quote.twoHundredDayAverage,

        // Fundamentals
        roe: financial.returnOnEquity ? financial.returnOnEquity * 100 : null,
        roce: null, // Not directly available from Yahoo
        debtToEquity: financial.debtToEquity,
        currentRatio: financial.currentRatio,
        revenueGrowth: financial.revenueGrowth ? financial.revenueGrowth * 100 : null,
        earningsGrowth: financial.earningsGrowth ? financial.earningsGrowth * 100 : null,
        profitMargin: financial.profitMargins ? financial.profitMargins * 100 : null,
        operatingMargin: financial.operatingMargins ? financial.operatingMargins * 100 : null,
        freeCashflow: financial.freeCashflow,
        totalRevenue: financial.totalRevenue,
        totalDebt: financial.totalDebt,
        totalCash: financial.totalCash,
        ebitda: financial.ebitda,

        // Holdings
        promoterHolding: holders.insidersPercentHeld ? holders.insidersPercentHeld * 100 : null,
        institutionalHolding: holders.institutionsPercentHeld ? holders.institutionsPercentHeld * 100 : null,

        // Beta
        beta: stats.beta,

        // Sector
        sector: price.sector || null,
        industry: price.industry || null,
    };
}

export async function getChart(symbol, range = '1mo') {
    const cacheKey = `chart:${symbol}:${range}`;
    const cached = getCached(cacheKey);
    if (cached) return cached;

    const intervalMap = {
        '1d': '5m',
        '5d': '15m',
        '1mo': '1d',
        '3mo': '1d',
        '6mo': '1wk',
        '1y': '1wk',
        '5y': '1mo',
        'max': '1mo',
    };

    try {
        const result = await yf.chart(symbol, {
            period1: getStartDate(range),
            interval: intervalMap[range] || '1d',
        });

        const data = result.quotes.map(q => ({
            time: Math.floor(new Date(q.date).getTime() / 1000),
            open: q.open,
            high: q.high,
            low: q.low,
            close: q.close,
            volume: q.volume,
        })).filter(q => q.close !== null && q.close !== undefined);

        setCache(cacheKey, data);
        return data;
    } catch (err) {
        console.error(`Error fetching chart for ${symbol}:`, err.message);
        throw err;
    }
}

function getStartDate(range) {
    const now = new Date();
    switch (range) {
        case '1d': return new Date(now - 24 * 60 * 60 * 1000);
        case '5d': return new Date(now - 5 * 24 * 60 * 60 * 1000);
        case '1mo': return new Date(now - 30 * 24 * 60 * 60 * 1000);
        case '3mo': return new Date(now - 90 * 24 * 60 * 60 * 1000);
        case '6mo': return new Date(now - 180 * 24 * 60 * 60 * 1000);
        case '1y': return new Date(now - 365 * 24 * 60 * 60 * 1000);
        case '5y': return new Date(now - 5 * 365 * 24 * 60 * 60 * 1000);
        case 'max': return new Date('2000-01-01');
        default: return new Date(now - 30 * 24 * 60 * 60 * 1000);
    }
}

export async function searchStocks(query) {
    try {
        const result = await yf.search(query);
        return result.quotes
            .filter(q => q.exchDisp === 'NSE' || q.exchDisp === 'NSI' || q.exchDisp === 'BSE' ||
                (q.symbol && (q.symbol.endsWith('.NS') || q.symbol.endsWith('.BO'))))
            .map(q => ({
                symbol: q.symbol,
                name: q.shortname || q.longname || q.symbol,
                exchange: q.exchDisp,
                type: q.quoteType,
            }))
            .slice(0, 10);
    } catch (err) {
        console.error('Search error:', err.message);
        return [];
    }
}

export async function getIndices() {
    const cacheKey = 'indices';
    const cached = getCached(cacheKey);
    if (cached) return cached;

    try {
        const symbols = ['^NSEI', '^BSESN', '^NSEBANK'];
        const quotes = await Promise.all(symbols.map(s => yf.quote(s).catch(() => null)));

        const data = [
            { name: 'NIFTY 50', symbol: '^NSEI', ...formatIndex(quotes[0]) },
            { name: 'SENSEX', symbol: '^BSESN', ...formatIndex(quotes[1]) },
            { name: 'BANK NIFTY', symbol: '^NSEBANK', ...formatIndex(quotes[2]) },
        ];

        setCache(cacheKey, data);
        return data;
    } catch (err) {
        console.error('Indices error:', err.message);
        throw err;
    }
}

function formatIndex(quote) {
    if (!quote) return { price: 0, change: 0, changePercent: 0 };
    return {
        price: quote.regularMarketPrice,
        change: quote.regularMarketChange,
        changePercent: quote.regularMarketChangePercent,
        dayHigh: quote.regularMarketDayHigh,
        dayLow: quote.regularMarketDayLow,
        open: quote.regularMarketOpen,
        previousClose: quote.regularMarketPreviousClose,
    };
}

export async function getTrending() {
    const cacheKey = 'trending';
    const cached = getCached(cacheKey);
    if (cached) return cached;

    const trendingSymbols = [
        'RELIANCE.NS', 'TCS.NS', 'HDFCBANK.NS', 'INFY.NS', 'ICICIBANK.NS',
        'BHARTIARTL.NS', 'SBIN.NS', 'ITC.NS', 'TATAMOTORS.NS', 'LT.NS',
        'BAJFINANCE.NS', 'WIPRO.NS', 'ADANIENT.NS', 'SUNPHARMA.NS', 'TITAN.NS',
        'MARUTI.NS', 'HCLTECH.NS', 'KOTAKBANK.NS', 'AXISBANK.NS', 'NTPC.NS'
    ];

    try {
        const quotes = await Promise.all(
            trendingSymbols.map(s => yf.quote(s).catch(() => null))
        );

        const data = quotes
            .filter(Boolean)
            .map(q => ({
                symbol: q.symbol,
                name: q.shortName || q.longName || q.symbol,
                price: q.regularMarketPrice,
                change: q.regularMarketChange,
                changePercent: q.regularMarketChangePercent,
                volume: q.regularMarketVolume,
                marketCap: q.marketCap,
            }))
            .sort((a, b) => Math.abs(b.changePercent) - Math.abs(a.changePercent));

        setCache(cacheKey, data);
        return data;
    } catch (err) {
        console.error('Trending error:', err.message);
        throw err;
    }
}

export async function getNews(symbol) {
    const cacheKey = `news:${symbol || 'market'}`;
    const cached = getCached(cacheKey);
    if (cached) return cached;

    try {
        let result;
        if (symbol) {
            result = await yf.search(symbol.replace('.NS', '').replace('.BO', ''));
        } else {
            result = await yf.search('India stock market');
        }

        const news = (result.news || []).map(item => ({
            title: item.title,
            link: item.link,
            publisher: item.publisher,
            publishedAt: item.providerPublishTime,
            thumbnail: item.thumbnail?.resolutions?.[0]?.url || null,
            sentiment: analyzeSentiment(item.title),
        }));

        setCache(cacheKey, news);
        return news;
    } catch (err) {
        console.error('News error:', err.message);
        return [];
    }
}

function analyzeSentiment(title) {
    if (!title) return 'neutral';
    const lower = title.toLowerCase();
    const positiveWords = ['surge', 'jump', 'gain', 'rise', 'rally', 'high', 'profit', 'growth', 'boom', 'record', 'bullish', 'strong', 'upgrade', 'beat', 'outperform'];
    const negativeWords = ['fall', 'drop', 'crash', 'decline', 'loss', 'low', 'bear', 'weak', 'downgrade', 'miss', 'sell', 'cut', 'warning', 'risk', 'debt'];

    const posScore = positiveWords.filter(w => lower.includes(w)).length;
    const negScore = negativeWords.filter(w => lower.includes(w)).length;

    if (posScore > negScore) return 'positive';
    if (negScore > posScore) return 'negative';
    return 'neutral';
}
