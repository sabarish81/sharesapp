import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, Trash2, TrendingUp, TrendingDown, RefreshCw } from 'lucide-react';
import { useApp } from '../context/AppContext';
import api from '../services/api';
import './Pages.css';

export default function Watchlist() {
    const { watchlist, removeFromWatchlist } = useApp();
    const [liveData, setLiveData] = useState({});
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        if (watchlist.length > 0) refreshPrices();
    }, [watchlist.length]);

    async function refreshPrices() {
        setLoading(true);
        const data = {};
        await Promise.all(
            watchlist.map(async (s) => {
                try {
                    const quote = await api.getQuote(s.symbol);
                    data[s.symbol] = quote;
                } catch {
                    // ignore failed
                }
            })
        );
        setLiveData(data);
        setLoading(false);
    }

    if (watchlist.length === 0) {
        return (
            <div className="page-container fade-in">
                <div className="section-header">
                    <div>
                        <h1 className="section-title">Watchlist</h1>
                        <p className="section-subtitle">Track your favorite stocks</p>
                    </div>
                </div>
                <div className="empty-state card">
                    <Star size={64} />
                    <h3>Your watchlist is empty</h3>
                    <p>Search for stocks and add them to your watchlist to track their performance.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="page-container fade-in">
            <div className="section-header">
                <div>
                    <h1 className="section-title">Watchlist</h1>
                    <p className="section-subtitle">{watchlist.length} stock{watchlist.length !== 1 ? 's' : ''} tracked</p>
                </div>
                <button className="btn btn-secondary" onClick={refreshPrices} disabled={loading}>
                    <RefreshCw size={16} className={loading ? 'spin' : ''} />
                    Refresh
                </button>
            </div>

            <div className="card">
                <div className="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Symbol</th>
                                <th>Name</th>
                                <th>Price</th>
                                <th>Change</th>
                                <th>Market Cap</th>
                                <th>PE Ratio</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {watchlist.map(s => {
                                const live = liveData[s.symbol];
                                const isUp = (live?.changePercent || 0) >= 0;
                                return (
                                    <tr key={s.symbol} onClick={() => navigate(`/stock/${encodeURIComponent(s.symbol)}`)} style={{ cursor: 'pointer' }}>
                                        <td><span className="stock-symbol-cell">{s.symbol.replace('.NS', '').replace('.BO', '')}</span></td>
                                        <td>{live?.name || s.name || s.symbol}</td>
                                        <td className="mono">{live ? '₹' + fmtNum(live.price) : '...'}</td>
                                        <td>
                                            {live ? (
                                                <span className={`stat-change ${isUp ? 'positive' : 'negative'}`}>
                                                    {isUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                                                    {isUp ? '+' : ''}{live.changePercent?.toFixed(2)}%
                                                </span>
                                            ) : '...'}
                                        </td>
                                        <td className="mono">{live ? fmtMCap(live.marketCap) : '...'}</td>
                                        <td className="mono">{live?.pe?.toFixed(2) || '—'}</td>
                                        <td>
                                            <button
                                                className="btn-icon"
                                                onClick={(e) => { e.stopPropagation(); removeFromWatchlist(s.symbol); }}
                                                title="Remove from watchlist"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

function fmtNum(n) {
    if (!n && n !== 0) return '—';
    return n.toLocaleString('en-IN', { maximumFractionDigits: 2 });
}

function fmtMCap(c) {
    if (!c) return '—';
    if (c >= 10000000000000) return '₹' + (c / 10000000000000).toFixed(2) + ' L Cr';
    if (c >= 100000000000) return '₹' + (c / 100000000000).toFixed(2) + 'K Cr';
    if (c >= 10000000) return '₹' + (c / 10000000).toFixed(0) + ' Cr';
    return '₹' + fmtNum(c);
}
