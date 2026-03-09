import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Compass, TrendingUp, Gem, DollarSign, Shield, Zap } from 'lucide-react';
import stockList from '../data/stockList';
import './Pages.css';

const CATEGORIES = [
    { id: 'growing', label: 'Top Growing', icon: TrendingUp, color: 'var(--green)', description: 'Stocks with strong revenue and profit growth' },
    { id: 'undervalued', label: 'Undervalued', icon: Gem, color: 'var(--blue)', description: 'Potentially undervalued stocks with low PE ratios' },
    { id: 'dividend', label: 'High Dividend', icon: DollarSign, color: 'var(--amber)', description: 'Stocks with above-average dividend yields' },
    { id: 'fundamentals', label: 'Strong Fundamentals', icon: Shield, color: 'var(--primary)', description: 'Companies with solid financials and low debt' },
    { id: 'momentum', label: 'High Momentum', icon: Zap, color: 'var(--red)', description: 'Stocks showing strong price momentum' },
];

// Curated lists based on general market knowledge
const CURATED_STOCKS = {
    growing: ['TCS.NS', 'INFY.NS', 'BHARTIARTL.NS', 'TITAN.NS', 'BAJFINANCE.NS', 'ZOMATO.NS', 'TRENT.NS', 'HAL.NS', 'PERSISTENT.NS', 'APOLLOHOSP.NS'],
    undervalued: ['ITC.NS', 'COALINDIA.NS', 'ONGC.NS', 'BPCL.NS', 'IOC.NS', 'BANKBARODA.NS', 'PNB.NS', 'SBIN.NS', 'VEDL.NS', 'TATASTEEL.NS'],
    dividend: ['ITC.NS', 'COALINDIA.NS', 'POWERGRID.NS', 'HINDUNILVR.NS', 'HEROMOTOCO.NS', 'BPCL.NS', 'IOC.NS', 'VEDL.NS', 'NTPC.NS', 'BAJAJ-AUTO.NS'],
    fundamentals: ['RELIANCE.NS', 'TCS.NS', 'HDFCBANK.NS', 'NESTLEIND.NS', 'ASIANPAINT.NS', 'PIDILITIND.NS', 'BRITANNIA.NS', 'DABUR.NS', 'GODREJCP.NS', 'HAVELLS.NS'],
    momentum: ['TATAMOTORS.NS', 'ADANIENT.NS', 'JSWSTEEL.NS', 'HINDALCO.NS', 'BAJFINANCE.NS', 'M&M.NS', 'BEL.NS', 'HAL.NS', 'IRCTC.NS', 'DLF.NS'],
};

export default function Discover() {
    const [activeCategory, setActiveCategory] = useState('growing');
    const navigate = useNavigate();

    const category = CATEGORIES.find(c => c.id === activeCategory);
    const stocks = CURATED_STOCKS[activeCategory].map(symbol =>
        stockList.find(s => s.symbol === symbol)
    ).filter(Boolean);

    return (
        <div className="page-container fade-in">
            <div className="section-header">
                <div>
                    <h1 className="section-title">Discover Stocks</h1>
                    <p className="section-subtitle">Smart stock discovery based on different strategies</p>
                </div>
            </div>

            {/* Category Cards */}
            <div className="grid grid-5" style={{ marginBottom: 'var(--space-lg)' }}>
                {CATEGORIES.map(cat => (
                    <button
                        key={cat.id}
                        className={`discover-category-card ${activeCategory === cat.id ? 'active' : ''}`}
                        onClick={() => setActiveCategory(cat.id)}
                    >
                        <cat.icon size={24} style={{ color: cat.color }} />
                        <span className="discover-cat-label">{cat.label}</span>
                    </button>
                ))}
            </div>

            {/* Category Description */}
            <div className="card" style={{ marginBottom: 'var(--space-lg)' }}>
                <div className="discover-cat-header">
                    <category.icon size={24} style={{ color: category.color }} />
                    <div>
                        <h2 className="discover-cat-title">{category.label} Stocks</h2>
                        <p className="discover-cat-desc">{category.description}</p>
                    </div>
                </div>
            </div>

            {/* Stock Grid */}
            <div className="grid grid-2">
                {stocks.map(stock => (
                    <button
                        key={stock.symbol}
                        className="discover-stock-card card"
                        onClick={() => navigate(`/stock/${encodeURIComponent(stock.symbol)}`)}
                    >
                        <div className="discover-stock-header">
                            <div>
                                <span className="stock-symbol-cell">{stock.symbol.replace('.NS', '')}</span>
                                <span className="discover-stock-name">{stock.name}</span>
                            </div>
                        </div>
                        <div className="discover-stock-meta">
                            <span className="badge badge-primary">{stock.sector}</span>
                            <span className="badge badge-blue">{stock.industry}</span>
                        </div>
                    </button>
                ))}
            </div>

            <div className="disclaimer" style={{ marginTop: 'var(--space-lg)' }}>
                <strong>⚠️ Note</strong>
                These lists are curated for educational purposes and do not constitute investment recommendations.
                Always do your own research before investing.
            </div>
        </div>
    );
}
