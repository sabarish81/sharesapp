import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { Search, Sun, Moon, Bell } from 'lucide-react';
import stockList from '../../data/stockList';
import './Layout.css';

export default function Header() {
    const { theme, toggleTheme } = useApp();
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [showResults, setShowResults] = useState(false);
    const [selectedIdx, setSelectedIdx] = useState(-1);
    const navigate = useNavigate();
    const inputRef = useRef(null);
    const resultsRef = useRef(null);

    useEffect(() => {
        if (!query.trim()) {
            setResults([]);
            setShowResults(false);
            return;
        }
        const q = query.toLowerCase();
        const filtered = stockList.filter(s =>
            s.name.toLowerCase().includes(q) ||
            s.symbol.toLowerCase().includes(q) ||
            s.sector.toLowerCase().includes(q)
        ).slice(0, 8);
        setResults(filtered);
        setShowResults(filtered.length > 0);
        setSelectedIdx(-1);
    }, [query]);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (resultsRef.current && !resultsRef.current.contains(e.target) &&
                inputRef.current && !inputRef.current.contains(e.target)) {
                setShowResults(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleKeyDown = (e) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedIdx(prev => Math.min(prev + 1, results.length - 1));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIdx(prev => Math.max(prev - 1, -1));
        } else if (e.key === 'Enter' && selectedIdx >= 0) {
            const stock = results[selectedIdx];
            navigateToStock(stock.symbol);
        } else if (e.key === 'Escape') {
            setShowResults(false);
            inputRef.current?.blur();
        }
    };

    const navigateToStock = (symbol) => {
        setQuery('');
        setShowResults(false);
        navigate(`/stock/${encodeURIComponent(symbol)}`);
    };

    // Global keyboard shortcut: Ctrl+K to focus search
    useEffect(() => {
        const handleGlobalKey = (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                inputRef.current?.focus();
            }
        };
        document.addEventListener('keydown', handleGlobalKey);
        return () => document.removeEventListener('keydown', handleGlobalKey);
    }, []);

    return (
        <header className="header">
            <div className="header-search">
                <Search size={18} className="search-icon" />
                <input
                    ref={inputRef}
                    type="text"
                    className="search-input"
                    placeholder="Search stocks... (Ctrl+K)"
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onFocus={() => results.length > 0 && setShowResults(true)}
                />
                {showResults && (
                    <div className="search-results" ref={resultsRef}>
                        {results.map((stock, i) => (
                            <button
                                key={stock.symbol}
                                className={`search-result-item ${i === selectedIdx ? 'selected' : ''}`}
                                onClick={() => navigateToStock(stock.symbol)}
                                onMouseEnter={() => setSelectedIdx(i)}
                            >
                                <div className="result-info">
                                    <span className="result-symbol">{stock.symbol.replace('.NS', '')}</span>
                                    <span className="result-name">{stock.name}</span>
                                </div>
                                <span className="result-sector">{stock.sector}</span>
                            </button>
                        ))}
                    </div>
                )}
            </div>

            <div className="header-actions">
                <button className="btn-icon" onClick={toggleTheme} title={theme === 'dark' ? 'Light mode' : 'Dark mode'}>
                    {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                </button>
                <button className="btn-icon" title="Notifications">
                    <Bell size={20} />
                </button>
            </div>
        </header>
    );
}
