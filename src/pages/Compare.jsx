import { useState } from 'react';
import { GitCompare, Plus, X, ArrowRight } from 'lucide-react';
import stockList from '../data/stockList';
import api from '../services/api';
import './Pages.css';

export default function Compare() {
    const [selected, setSelected] = useState([]);
    const [compareData, setCompareData] = useState([]);
    const [search, setSearch] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [loading, setLoading] = useState(false);

    const handleSearch = (q) => {
        setSearch(q);
        if (!q.trim()) { setSearchResults([]); return; }
        const filtered = stockList
            .filter(s => !selected.includes(s.symbol))
            .filter(s =>
                s.name.toLowerCase().includes(q.toLowerCase()) ||
                s.symbol.toLowerCase().includes(q.toLowerCase())
            )
            .slice(0, 5);
        setSearchResults(filtered);
    };

    const addStock = (stock) => {
        if (selected.length >= 4) return;
        setSelected(prev => [...prev, stock.symbol]);
        setSearch('');
        setSearchResults([]);
    };

    const removeStock = (symbol) => {
        setSelected(prev => prev.filter(s => s !== symbol));
        setCompareData(prev => prev.filter(d => d.symbol !== symbol));
    };

    const handleCompare = async () => {
        if (selected.length < 2) return;
        setLoading(true);
        try {
            const data = await Promise.all(
                selected.map(async (s) => {
                    const quote = await api.getQuote(s);
                    const analysis = await api.getAnalysis(s).catch(() => null);
                    return { ...quote, analysis };
                })
            );
            setCompareData(data);
        } catch (err) {
            console.error(err);
        }
        setLoading(false);
    };

    return (
        <div className="page-container fade-in">
            <div className="section-header">
                <div>
                    <h1 className="section-title">Compare Stocks</h1>
                    <p className="section-subtitle">Side-by-side stock comparison</p>
                </div>
            </div>

            {/* Stock Selection */}
            <div className="card" style={{ marginBottom: 'var(--space-lg)' }}>
                <div className="compare-selector">
                    <div className="compare-selected">
                        {selected.map(s => (
                            <div key={s} className="compare-chip">
                                <span>{s.replace('.NS', '')}</span>
                                <button onClick={() => removeStock(s)}><X size={14} /></button>
                            </div>
                        ))}
                        {selected.length < 4 && (
                            <div className="compare-search">
                                <input
                                    type="text"
                                    className="input"
                                    placeholder={selected.length === 0 ? 'Search stocks to compare...' : 'Add another stock...'}
                                    value={search}
                                    onChange={e => handleSearch(e.target.value)}
                                />
                                {searchResults.length > 0 && (
                                    <div className="compare-search-results">
                                        {searchResults.map(s => (
                                            <button key={s.symbol} className="search-result-item" onClick={() => addStock(s)}>
                                                <div className="result-info">
                                                    <span className="result-symbol">{s.symbol.replace('.NS', '')}</span>
                                                    <span className="result-name">{s.name}</span>
                                                </div>
                                                <Plus size={16} />
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                    {selected.length >= 2 && (
                        <button className="btn btn-primary" onClick={handleCompare} disabled={loading}>
                            {loading ? 'Loading...' : 'Compare'} <ArrowRight size={16} />
                        </button>
                    )}
                </div>
            </div>

            {/* Comparison Table */}
            {compareData.length >= 2 && (
                <div className="card slide-up">
                    <div className="table-container">
                        <table className="compare-table">
                            <thead>
                                <tr>
                                    <th>Metric</th>
                                    {compareData.map(d => (
                                        <th key={d.symbol}>{d.symbol.replace('.NS', '')}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                <CompareRow label="Price" data={compareData} field="price" format={v => '₹' + fmtNum(v)} />
                                <CompareRow label="Market Cap" data={compareData} field="marketCap" format={fmtMCap} />
                                <CompareRow label="Category" data={compareData} field="capCategory" />
                                <CompareRow label="PE Ratio" data={compareData} field="pe" format={v => v?.toFixed(2)} highlight="lower" />
                                <CompareRow label="PB Ratio" data={compareData} field="pb" format={v => v?.toFixed(2)} highlight="lower" />
                                <CompareRow label="Dividend Yield" data={compareData} field="dividendYield" format={v => v ? v.toFixed(2) + '%' : '—'} highlight="higher" />
                                <CompareRow label="ROE" data={compareData} field="roe" format={v => v ? v.toFixed(2) + '%' : '—'} highlight="higher" />
                                <CompareRow label="Debt/Equity" data={compareData} field="debtToEquity" format={v => v?.toFixed(1)} highlight="lower" />
                                <CompareRow label="Revenue Growth" data={compareData} field="revenueGrowth" format={v => v ? v.toFixed(1) + '%' : '—'} highlight="higher" />
                                <CompareRow label="Profit Margin" data={compareData} field="profitMargin" format={v => v ? v.toFixed(1) + '%' : '—'} highlight="higher" />
                                <CompareRow label="52W High" data={compareData} field="fiftyTwoWeekHigh" format={v => '₹' + fmtNum(v)} />
                                <CompareRow label="52W Low" data={compareData} field="fiftyTwoWeekLow" format={v => '₹' + fmtNum(v)} />
                                <CompareRow label="AI Score" data={compareData} field="analysis" format={v => v?.overallScore || '—'} highlight="higher" isNested="overallScore" />
                                <CompareRow label="Risk Level" data={compareData} field="analysis" format={v => v?.riskLabel || '—'} isNested="riskLabel" />
                                <CompareRow label="Suggestion" data={compareData} field="analysis" format={v => v?.investmentSuggestion || '—'} isNested="investmentSuggestion" />
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {selected.length < 2 && compareData.length === 0 && (
                <div className="empty-state card">
                    <GitCompare size={64} />
                    <h3>Select at least 2 stocks</h3>
                    <p>Choose up to 4 stocks to compare their fundamentals, valuation, and AI scores side by side.</p>
                </div>
            )}
        </div>
    );
}

function CompareRow({ label, data, field, format, highlight, isNested }) {
    const values = data.map(d => {
        const val = d[field];
        if (isNested && val) return val[isNested];
        return val;
    });

    let bestIdx = -1;
    if (highlight && values.some(v => typeof v === 'number')) {
        const numericVals = values.map(v => (typeof v === 'number' ? v : null));
        if (highlight === 'higher') {
            bestIdx = numericVals.indexOf(Math.max(...numericVals.filter(v => v !== null)));
        } else {
            const filtered = numericVals.filter(v => v !== null && v > 0);
            if (filtered.length) bestIdx = numericVals.indexOf(Math.min(...filtered));
        }
    }

    return (
        <tr>
            <td className="compare-label">{label}</td>
            {values.map((v, i) => (
                <td key={i} className={`mono ${i === bestIdx ? 'highlight-best' : ''}`}>
                    {format ? format(data[i][field]) : (v ?? '—')}
                </td>
            ))}
        </tr>
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
    return '₹' + fmtNum(c);
}
