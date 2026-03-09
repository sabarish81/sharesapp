import { useState, useEffect } from 'react';
import { Newspaper, RefreshCw } from 'lucide-react';
import api from '../services/api';
import './Pages.css';

export default function News() {
    const [news, setNews] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadNews();
    }, []);

    async function loadNews() {
        setLoading(true);
        try {
            const data = await api.getMarketNews();
            setNews(data);
        } catch (err) {
            console.error(err);
        }
        setLoading(false);
    }

    return (
        <div className="page-container fade-in">
            <div className="section-header">
                <div>
                    <h1 className="section-title">Market News</h1>
                    <p className="section-subtitle">Latest news affecting the Indian stock market</p>
                </div>
                <button className="btn btn-secondary" onClick={loadNews} disabled={loading}>
                    <RefreshCw size={16} className={loading ? 'spin' : ''} />
                    Refresh
                </button>
            </div>

            <div className="card">
                {loading ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        {Array(6).fill(0).map((_, i) => (
                            <div key={i} className="skeleton" style={{ height: 60 }} />
                        ))}
                    </div>
                ) : news.length === 0 ? (
                    <div className="empty-state">
                        <Newspaper size={64} />
                        <h3>No News Available</h3>
                        <p>Unable to fetch market news right now. Please try again later.</p>
                    </div>
                ) : (
                    <div className="news-list">
                        {news.map((n, i) => (
                            <a key={i} href={n.link} target="_blank" rel="noopener noreferrer" className="news-item">
                                <div className={`news-sentiment ${n.sentiment}`} />
                                <div className="news-content">
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
    );
}
