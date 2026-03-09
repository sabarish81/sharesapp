import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
    Star, StarOff, TrendingUp, TrendingDown, Shield,
    Target, AlertTriangle, ChevronUp, ChevronDown,
    BarChart3, Brain, Newspaper, Award, XCircle
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import PriceChart from '../components/Charts/PriceChart';
import api from '../services/api';
import './Pages.css';

export default function StockDetail() {
    const { symbol } = useParams();
    const decodedSymbol = decodeURIComponent(symbol);
    const { isInWatchlist, addToWatchlist, removeFromWatchlist } = useApp();

    const [quote, setQuote] = useState(null);
    const [chartData, setChartData] = useState([]);
    const [chartRange, setChartRange] = useState('1mo');
    const [analysis, setAnalysis] = useState(null);
    const [news, setNews] = useState([]);
    const [activeTab, setActiveTab] = useState('overview');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadStock();
    }, [decodedSymbol]);

    useEffect(() => {
        loadChart();
    }, [decodedSymbol, chartRange]);

    async function loadStock() {
        setLoading(true);
        try {
            const [q, a, n] = await Promise.all([
                api.getQuote(decodedSymbol).catch(() => null),
                api.getAnalysis(decodedSymbol).catch(() => null),
                api.getNews(decodedSymbol).catch(() => []),
            ]);
            setQuote(q);
            setAnalysis(a);
            setNews(n);
        } catch (err) {
            console.error(err);
        }
        setLoading(false);
    }

    async function loadChart() {
        try {
            const data = await api.getChart(decodedSymbol, chartRange);
            setChartData(data);
        } catch (err) {
            console.error(err);
            setChartData([]);
        }
    }

    const handleWatchlistToggle = () => {
        if (isInWatchlist(decodedSymbol)) {
            removeFromWatchlist(decodedSymbol);
        } else {
            addToWatchlist({ symbol: decodedSymbol, name: quote?.name });
        }
    };

    if (loading) {
        return (
            <div className="page-container">
                <div className="stock-detail-skeleton">
                    <div className="skeleton" style={{ width: '40%', height: 32, marginBottom: 16 }} />
                    <div className="skeleton" style={{ width: '25%', height: 48, marginBottom: 8 }} />
                    <div className="skeleton" style={{ width: '15%', height: 24, marginBottom: 32 }} />
                    <div className="skeleton" style={{ width: '100%', height: 400, marginBottom: 24 }} />
                    <div className="grid grid-4">
                        {Array(8).fill(0).map((_, i) => <div key={i} className="skeleton" style={{ height: 80 }} />)}
                    </div>
                </div>
            </div>
        );
    }

    if (!quote) {
        return (
            <div className="page-container">
                <div className="empty-state">
                    <AlertTriangle size={64} />
                    <h3>Stock Not Found</h3>
                    <p>Unable to load data for {decodedSymbol}. Please try again.</p>
                </div>
            </div>
        );
    }

    const isUp = (quote.change || 0) >= 0;

    return (
        <div className="page-container fade-in">
            {/* Header */}
            <div className="stock-detail-header">
                <div className="stock-detail-title">
                    <div>
                        <div className="stock-name-row">
                            <h1>{quote.name}</h1>
                            <span className={`badge ${quote.capCategory === 'Large Cap' ? 'badge-blue' : quote.capCategory === 'Mid Cap' ? 'badge-amber' : 'badge-primary'}`}>
                                {quote.capCategory}
                            </span>
                            {quote.sector && <span className="badge badge-primary">{quote.sector}</span>}
                        </div>
                        <span className="stock-symbol-tag">{decodedSymbol.replace('.NS', '').replace('.BO', '')} · NSE</span>
                    </div>
                    <button className="btn btn-secondary" onClick={handleWatchlistToggle}>
                        {isInWatchlist(decodedSymbol) ? <StarOff size={18} /> : <Star size={18} />}
                        {isInWatchlist(decodedSymbol) ? 'Remove' : 'Watchlist'}
                    </button>
                </div>

                <div className="price-display">
                    <span className="price-current">₹{formatNumber(quote.price)}</span>
                    <span className={`price-change ${isUp ? 'up' : 'down'}`}>
                        {isUp ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                        {isUp ? '+' : ''}{quote.change?.toFixed(2)} ({isUp ? '+' : ''}{quote.changePercent?.toFixed(2)}%)
                    </span>
                </div>
            </div>

            {/* Tabs */}
            <div className="tabs" style={{ marginBottom: 'var(--space-lg)' }}>
                {['overview', 'fundamentals', 'ai-insights', 'news'].map(tab => (
                    <button
                        key={tab}
                        className={`tab ${activeTab === tab ? 'active' : ''}`}
                        onClick={() => setActiveTab(tab)}
                    >
                        {tab === 'overview' && <BarChart3 size={14} />}
                        {tab === 'fundamentals' && <Target size={14} />}
                        {tab === 'ai-insights' && <Brain size={14} />}
                        {tab === 'news' && <Newspaper size={14} />}
                        {' '}{tab.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </button>
                ))}
            </div>

            {/* Overview Tab */}
            {activeTab === 'overview' && (
                <div className="slide-up">
                    {/* Price Chart */}
                    <div className="card" style={{ marginBottom: 'var(--space-lg)' }}>
                        <PriceChart
                            data={chartData}
                            onRangeChange={setChartRange}
                            activeRange={chartRange}
                        />
                    </div>

                    {/* Key Metrics */}
                    <div className="grid grid-4" style={{ marginBottom: 'var(--space-lg)' }}>
                        <MetricCard label="Market Cap" value={formatMarketCap(quote.marketCap)} />
                        <MetricCard label="PE Ratio" value={quote.pe?.toFixed(2)} />
                        <MetricCard label="PB Ratio" value={quote.pb?.toFixed(2)} />
                        <MetricCard label="Dividend Yield" value={quote.dividendYield ? quote.dividendYield.toFixed(2) + '%' : '—'} />
                        <MetricCard label="52W High" value={'₹' + formatNumber(quote.fiftyTwoWeekHigh)} />
                        <MetricCard label="52W Low" value={'₹' + formatNumber(quote.fiftyTwoWeekLow)} />
                        <MetricCard label="Volume" value={formatVolume(quote.volume)} />
                        <MetricCard label="Avg Volume" value={formatVolume(quote.avgVolume)} />
                        <MetricCard label="Open" value={'₹' + formatNumber(quote.open)} />
                        <MetricCard label="Prev Close" value={'₹' + formatNumber(quote.previousClose)} />
                        <MetricCard label="Day High" value={'₹' + formatNumber(quote.dayHigh)} />
                        <MetricCard label="Day Low" value={'₹' + formatNumber(quote.dayLow)} />
                    </div>

                    {/* 52 Week Range */}
                    <div className="card" style={{ marginBottom: 'var(--space-lg)' }}>
                        <div className="card-title" style={{ marginBottom: 'var(--space-md)' }}>52 Week Range</div>
                        <div className="range-bar-container">
                            <span className="range-label">₹{formatNumber(quote.fiftyTwoWeekLow)}</span>
                            <div className="range-bar">
                                <div className="range-fill" style={{
                                    width: `${((quote.price - quote.fiftyTwoWeekLow) / (quote.fiftyTwoWeekHigh - quote.fiftyTwoWeekLow) * 100)}%`
                                }}>
                                    <div className="range-marker" />
                                </div>
                            </div>
                            <span className="range-label">₹{formatNumber(quote.fiftyTwoWeekHigh)}</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Fundamentals Tab */}
            {activeTab === 'fundamentals' && (
                <div className="slide-up">
                    <div className="grid grid-2" style={{ marginBottom: 'var(--space-lg)' }}>
                        {/* Profitability */}
                        <div className="card">
                            <div className="card-header">
                                <span className="card-title">Profitability</span>
                            </div>
                            <div className="metric-list">
                                <MetricRow label="Return on Equity (ROE)" value={formatPercent(quote.roe)} good={quote.roe > 15} />
                                <MetricRow label="Profit Margin" value={formatPercent(quote.profitMargin)} good={quote.profitMargin > 15} />
                                <MetricRow label="Operating Margin" value={formatPercent(quote.operatingMargin)} good={quote.operatingMargin > 15} />
                                <MetricRow label="Revenue Growth" value={formatPercent(quote.revenueGrowth)} good={quote.revenueGrowth > 10} />
                                <MetricRow label="Earnings Growth" value={formatPercent(quote.earningsGrowth)} good={quote.earningsGrowth > 10} />
                            </div>
                        </div>

                        {/* Financial Health */}
                        <div className="card">
                            <div className="card-header">
                                <span className="card-title">Financial Health</span>
                            </div>
                            <div className="metric-list">
                                <MetricRow label="Debt to Equity" value={quote.debtToEquity?.toFixed(1)} good={quote.debtToEquity < 50} />
                                <MetricRow label="Current Ratio" value={quote.currentRatio?.toFixed(2)} good={quote.currentRatio > 1.5} />
                                <MetricRow label="Free Cash Flow" value={formatLargeNumber(quote.freeCashflow)} good={quote.freeCashflow > 0} />
                                <MetricRow label="Total Revenue" value={formatLargeNumber(quote.totalRevenue)} />
                                <MetricRow label="EBITDA" value={formatLargeNumber(quote.ebitda)} good={quote.ebitda > 0} />
                            </div>
                        </div>
                    </div>

                    {/* Holdings */}
                    <div className="card" style={{ marginBottom: 'var(--space-lg)' }}>
                        <div className="card-header">
                            <span className="card-title">Shareholding Pattern</span>
                        </div>
                        <div className="grid grid-3">
                            <div className="holding-item">
                                <div className="holding-bar">
                                    <div className="holding-fill" style={{ width: `${quote.promoterHolding || 0}%`, background: 'var(--primary)' }} />
                                </div>
                                <div className="holding-info">
                                    <span className="holding-label">Promoter</span>
                                    <span className="holding-value">{quote.promoterHolding?.toFixed(1) || '—'}%</span>
                                </div>
                            </div>
                            <div className="holding-item">
                                <div className="holding-bar">
                                    <div className="holding-fill" style={{ width: `${quote.institutionalHolding || 0}%`, background: 'var(--green)' }} />
                                </div>
                                <div className="holding-info">
                                    <span className="holding-label">Institutional</span>
                                    <span className="holding-value">{quote.institutionalHolding?.toFixed(1) || '—'}%</span>
                                </div>
                            </div>
                            <div className="holding-item">
                                <div className="holding-bar">
                                    <div className="holding-fill" style={{
                                        width: `${Math.max(0, 100 - (quote.promoterHolding || 0) - (quote.institutionalHolding || 0))}%`,
                                        background: 'var(--amber)'
                                    }} />
                                </div>
                                <div className="holding-info">
                                    <span className="holding-label">Public</span>
                                    <span className="holding-value">
                                        {(100 - (quote.promoterHolding || 0) - (quote.institutionalHolding || 0)).toFixed(1)}%
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Additional Metrics */}
                    <div className="grid grid-4">
                        <MetricCard label="Beta" value={quote.beta?.toFixed(2)} />
                        <MetricCard label="50-Day Avg" value={'₹' + formatNumber(quote.fiftyDayAvg)} />
                        <MetricCard label="200-Day Avg" value={'₹' + formatNumber(quote.twoHundredDayAvg)} />
                        <MetricCard label="Forward PE" value={quote.forwardPe?.toFixed(2)} />
                    </div>
                </div>
            )}

            {/* AI Insights Tab */}
            {activeTab === 'ai-insights' && analysis && (
                <div className="slide-up">
                    {/* Score & Suggestion */}
                    <div className="grid grid-3" style={{ marginBottom: 'var(--space-lg)' }}>
                        <div className="card ai-score-card">
                            <div className="ai-score-circle">
                                <svg viewBox="0 0 100 100" width="120" height="120">
                                    <circle cx="50" cy="50" r="42" fill="none" stroke="var(--bg-tertiary)" strokeWidth="8" />
                                    <circle cx="50" cy="50" r="42" fill="none"
                                        stroke={analysis.overallScore >= 70 ? 'var(--green)' : analysis.overallScore >= 40 ? 'var(--amber)' : 'var(--red)'}
                                        strokeWidth="8" strokeLinecap="round"
                                        strokeDasharray={`${analysis.overallScore * 2.64} 264`}
                                        transform="rotate(-90 50 50)" />
                                </svg>
                                <div className="ai-score-value">{analysis.overallScore}</div>
                            </div>
                            <span className="ai-score-label">Overall Score</span>
                        </div>

                        <div className="card">
                            <div className="card-header">
                                <span className="card-title"><Shield size={16} /> Risk Level</span>
                            </div>
                            <div className={`risk-badge ${analysis.riskLevel}`}>
                                {analysis.riskLabel}
                            </div>
                            <div className="risk-meter" style={{ marginTop: 12 }}>
                                {[1, 2, 3, 4, 5].map(i => (
                                    <div key={i} className={`risk-bar ${analysis.riskLevel === 'low' && i <= 2 ? 'green' :
                                            analysis.riskLevel === 'medium' && i <= 3 ? 'amber' :
                                                analysis.riskLevel === 'high' && i <= 5 ? 'red' : ''
                                        }`} />
                                ))}
                            </div>
                            <p className="trend-label" style={{ marginTop: 12 }}>
                                Current Trend: <strong>{analysis.trend}</strong>
                            </p>
                        </div>

                        <div className="card">
                            <div className="card-header">
                                <span className="card-title"><Target size={16} /> Investment Horizon</span>
                            </div>
                            <div className="investment-suggestion">{analysis.investmentSuggestion}</div>
                            <p className="investment-detail">{analysis.investmentDetail}</p>
                        </div>
                    </div>

                    {/* Sentiment */}
                    <div className="card" style={{ marginBottom: 'var(--space-lg)' }}>
                        <div className="card-header">
                            <span className="card-title">Public Sentiment</span>
                        </div>
                        <div className="sentiment-display">
                            <div className="sentiment-labels">
                                <span className="sentiment-bullish">🟢 Bullish {analysis.sentiment.bullish}%</span>
                                <span className="sentiment-bearish">🔴 Bearish {analysis.sentiment.bearish}%</span>
                            </div>
                            <div className="sentiment-bar">
                                <div className="bullish" style={{ width: `${analysis.sentiment.bullish}%` }} />
                                <div className="bearish" style={{ width: `${analysis.sentiment.bearish}%` }} />
                            </div>
                        </div>
                    </div>

                    {/* Strengths & Weaknesses */}
                    <div className="grid grid-2" style={{ marginBottom: 'var(--space-lg)' }}>
                        <div className="card">
                            <div className="card-header">
                                <span className="card-title" style={{ color: 'var(--green)' }}>
                                    <Award size={16} /> Strengths
                                </span>
                            </div>
                            {analysis.strengths.map((s, i) => (
                                <div key={i} className="insight-item strength">
                                    <div className="icon">✓</div>
                                    <span>{s}</span>
                                </div>
                            ))}
                            {analysis.strengths.length === 0 && <p className="no-data">No significant strengths identified</p>}
                        </div>
                        <div className="card">
                            <div className="card-header">
                                <span className="card-title" style={{ color: 'var(--red)' }}>
                                    <XCircle size={16} /> Weaknesses
                                </span>
                            </div>
                            {analysis.weaknesses.map((w, i) => (
                                <div key={i} className="insight-item weakness">
                                    <div className="icon">!</div>
                                    <span>{w}</span>
                                </div>
                            ))}
                            {analysis.weaknesses.length === 0 && <p className="no-data">No significant weaknesses identified</p>}
                        </div>
                    </div>

                    {/* Disclaimer */}
                    <div className="disclaimer">
                        <strong>⚠️ Disclaimer</strong>
                        {analysis.disclaimer}
                    </div>
                </div>
            )}

            {/* News Tab */}
            {activeTab === 'news' && (
                <div className="slide-up">
                    <div className="card">
                        {news.length === 0 ? (
                            <div className="empty-state">
                                <Newspaper size={48} />
                                <h3>No Recent News</h3>
                                <p>No news articles found for this stock.</p>
                            </div>
                        ) : (
                            <div className="news-list">
                                {news.map((n, i) => (
                                    <a key={i} href={n.link} target="_blank" rel="noopener noreferrer" className="news-item">
                                        <div className={`news-sentiment ${n.sentiment}`} />
                                        <div>
                                            <div className="news-title">{n.title}</div>
                                            <div className="news-meta">
                                                {n.publisher}
                                                <span className={`badge badge-${n.sentiment === 'positive' ? 'green' : n.sentiment === 'negative' ? 'red' : 'primary'}`} style={{ marginLeft: 8 }}>
                                                    {n.sentiment}
                                                </span>
                                            </div>
                                        </div>
                                    </a>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

function MetricCard({ label, value }) {
    return (
        <div className="stat-card">
            <span className="stat-label">{label}</span>
            <span className="stat-value" style={{ fontSize: '1.1rem' }}>{value || '—'}</span>
        </div>
    );
}

function MetricRow({ label, value, good }) {
    return (
        <div className="metric-row">
            <span className="metric-label">{label}</span>
            <span className={`metric-value ${good === true ? 'good' : good === false ? 'bad' : ''}`}>
                {value || '—'}
            </span>
        </div>
    );
}

function formatNumber(num) {
    if (!num && num !== 0) return '—';
    return num.toLocaleString('en-IN', { maximumFractionDigits: 2 });
}

function formatPercent(val) {
    if (val === null || val === undefined) return '—';
    return val.toFixed(2) + '%';
}

function formatVolume(vol) {
    if (!vol) return '—';
    if (vol >= 10000000) return (vol / 10000000).toFixed(2) + ' Cr';
    if (vol >= 100000) return (vol / 100000).toFixed(2) + ' L';
    if (vol >= 1000) return (vol / 1000).toFixed(1) + 'K';
    return vol.toString();
}

function formatMarketCap(cap) {
    if (!cap) return '—';
    if (cap >= 10000000000000) return '₹' + (cap / 10000000000000).toFixed(2) + ' L Cr';
    if (cap >= 100000000000) return '₹' + (cap / 100000000000).toFixed(2) + 'K Cr';
    if (cap >= 10000000) return '₹' + (cap / 10000000).toFixed(0) + ' Cr';
    return '₹' + formatNumber(cap);
}

function formatLargeNumber(num) {
    if (!num && num !== 0) return '—';
    const abs = Math.abs(num);
    const sign = num < 0 ? '-' : '';
    if (abs >= 10000000000000) return sign + '₹' + (abs / 10000000000000).toFixed(2) + ' L Cr';
    if (abs >= 100000000000) return sign + '₹' + (abs / 100000000000).toFixed(2) + 'K Cr';
    if (abs >= 10000000) return sign + '₹' + (abs / 10000000).toFixed(0) + ' Cr';
    if (abs >= 100000) return sign + '₹' + (abs / 100000).toFixed(1) + ' L';
    return sign + '₹' + formatNumber(abs);
}
