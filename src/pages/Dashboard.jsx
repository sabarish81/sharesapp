import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, TrendingDown, Activity, BarChart3 } from 'lucide-react';
import api from '../services/api';
import './Pages.css';

export default function Dashboard() {
    const [indices, setIndices] = useState([]);
    const [trending, setTrending] = useState([]);
    const [news, setNews] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        loadDashboard();
    }, []);

    async function loadDashboard() {
        setLoading(true);
        try {
            const [idx, trend, mktNews] = await Promise.all([
                api.getIndices().catch(() => []),
                api.getTrending().catch(() => []),
                api.getMarketNews().catch(() => []),
            ]);
            setIndices(idx);
            setTrending(trend);
            setNews(mktNews);
        } catch (err) {
            console.error(err);
        }
        setLoading(false);
    }

    const gainers = trending.filter(s => s.changePercent > 0).slice(0, 5);
    const losers = trending.filter(s => s.changePercent < 0).sort((a, b) => a.changePercent - b.changePercent).slice(0, 5);

    return (
        <div className="page-container fade-in">
            <div className="section-header">
                <div>
                    <h1 className="section-title">Market Overview</h1>
                    <p className="section-subtitle">Indian Stock Market Dashboard</p>
                </div>
            </div>

            {/* Indices */}
            <div className="grid grid-3" style={{ marginBottom: 'var(--space-lg)' }}>
                {loading ? (
                    Array(3).fill(0).map((_, i) => (
                        <div key={i} className="stat-card">
                            <div className="skeleton" style={{ width: '60%', height: 16 }} />
                            <div className="skeleton" style={{ width: '80%', height: 32 }} />
                            <div className="skeleton" style={{ width: '40%', height: 16 }} />
                        </div>
                    ))
                ) : indices.map((idx, i) => (
                    <div key={i} className="stat-card index-card">
                        <span className="stat-label">{idx.name}</span>
                        <span className="stat-value">{formatNumber(idx.price)}</span>
                        <span className={`stat-change ${idx.change >= 0 ? 'positive' : 'negative'}`}>
                            {idx.change >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                            {idx.change >= 0 ? '+' : ''}{idx.change?.toFixed(2)} ({idx.changePercent?.toFixed(2)}%)
                        </span>
                    </div>
                ))}
            </div>

            {/* Two column: Gainers & Losers */}
            <div className="grid grid-2" style={{ marginBottom: 'var(--space-lg)' }}>
                {/* Top Gainers */}
                <div className="card">
                    <div className="card-header">
                        <span className="card-title"><TrendingUp size={16} style={{ color: 'var(--green)' }} /> Top Gainers</span>
                    </div>
                    {loading ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            {Array(5).fill(0).map((_, i) => <div key={i} className="skeleton" style={{ height: 40 }} />)}
                        </div>
                    ) : gainers.length === 0 ? (
                        <p className="no-data">No data available</p>
                    ) : (
                        <div className="stock-list">
                            {gainers.map(s => (
                                <button key={s.symbol} className="stock-list-item" onClick={() => navigate(`/stock/${encodeURIComponent(s.symbol)}`)}>
                                    <div className="stock-list-info">
                                        <span className="stock-list-symbol">{s.symbol.replace('.NS', '')}</span>
                                        <span className="stock-list-name">{s.name}</span>
                                    </div>
                                    <div className="stock-list-price">
                                        <span className="stock-list-value">₹{formatNumber(s.price)}</span>
                                        <span className="stat-change positive">+{s.changePercent?.toFixed(2)}%</span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Top Losers */}
                <div className="card">
                    <div className="card-header">
                        <span className="card-title"><TrendingDown size={16} style={{ color: 'var(--red)' }} /> Top Losers</span>
                    </div>
                    {loading ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            {Array(5).fill(0).map((_, i) => <div key={i} className="skeleton" style={{ height: 40 }} />)}
                        </div>
                    ) : losers.length === 0 ? (
                        <p className="no-data">No data available</p>
                    ) : (
                        <div className="stock-list">
                            {losers.map(s => (
                                <button key={s.symbol} className="stock-list-item" onClick={() => navigate(`/stock/${encodeURIComponent(s.symbol)}`)}>
                                    <div className="stock-list-info">
                                        <span className="stock-list-symbol">{s.symbol.replace('.NS', '')}</span>
                                        <span className="stock-list-name">{s.name}</span>
                                    </div>
                                    <div className="stock-list-price">
                                        <span className="stock-list-value">₹{formatNumber(s.price)}</span>
                                        <span className="stat-change negative">{s.changePercent?.toFixed(2)}%</span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Most Active */}
            <div className="card" style={{ marginBottom: 'var(--space-lg)' }}>
                <div className="card-header">
                    <span className="card-title"><Activity size={16} /> Most Active Stocks</span>
                </div>
                {loading ? (
                    <div className="skeleton" style={{ height: 200 }} />
                ) : (
                    <div className="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Symbol</th>
                                    <th>Name</th>
                                    <th>Price</th>
                                    <th>Change</th>
                                    <th>Volume</th>
                                    <th>Market Cap</th>
                                </tr>
                            </thead>
                            <tbody>
                                {trending.slice(0, 10).map(s => (
                                    <tr key={s.symbol} onClick={() => navigate(`/stock/${encodeURIComponent(s.symbol)}`)} style={{ cursor: 'pointer' }}>
                                        <td><span className="stock-symbol-cell">{s.symbol.replace('.NS', '')}</span></td>
                                        <td>{s.name}</td>
                                        <td className="mono">₹{formatNumber(s.price)}</td>
                                        <td>
                                            <span className={`stat-change ${s.changePercent >= 0 ? 'positive' : 'negative'}`}>
                                                {s.changePercent >= 0 ? '+' : ''}{s.changePercent?.toFixed(2)}%
                                            </span>
                                        </td>
                                        <td className="mono">{formatVolume(s.volume)}</td>
                                        <td className="mono">{formatMarketCap(s.marketCap)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Market News */}
            {news.length > 0 && (
                <div className="card">
                    <div className="card-header">
                        <span className="card-title"><BarChart3 size={16} /> Market News</span>
                    </div>
                    <div className="news-list">
                        {news.slice(0, 6).map((n, i) => (
                            <a key={i} href={n.link} target="_blank" rel="noopener noreferrer" className="news-item">
                                <div className={`news-sentiment ${n.sentiment}`} />
                                <div>
                                    <div className="news-title">{n.title}</div>
                                    <div className="news-meta">{n.publisher} • {formatTime(n.publishedAt)}</div>
                                </div>
                            </a>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

function formatNumber(num) {
    if (!num && num !== 0) return '—';
    return num.toLocaleString('en-IN', { maximumFractionDigits: 2 });
}

function formatVolume(vol) {
    if (!vol) return '—';
    if (vol >= 10000000) return (vol / 10000000).toFixed(2) + ' Cr';
    if (vol >= 100000) return (vol / 100000).toFixed(2) + ' L';
    if (vol >= 1000) return (vol / 1000).toFixed(1) + ' K';
    return vol.toString();
}

function formatMarketCap(cap) {
    if (!cap) return '—';
    if (cap >= 10000000000000) return '₹' + (cap / 10000000000000).toFixed(2) + ' L Cr';
    if (cap >= 100000000000) return '₹' + (cap / 100000000000).toFixed(2) + ' K Cr';
    if (cap >= 10000000) return '₹' + (cap / 10000000).toFixed(0) + ' Cr';
    return '₹' + formatNumber(cap);
}

function formatTime(ts) {
    if (!ts) return '';
    const date = new Date(ts * 1000);
    const now = new Date();
    const diff = (now - date) / 1000 / 60;
    if (diff < 60) return `${Math.floor(diff)}m ago`;
    if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}
