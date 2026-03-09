import { createContext, useContext, useState, useEffect } from 'react';

const AppContext = createContext();

export function AppProvider({ children }) {
    const [theme, setTheme] = useState(() => {
        return localStorage.getItem('sharesapp-theme') || 'dark';
    });

    const [watchlist, setWatchlist] = useState(() => {
        try {
            const saved = localStorage.getItem('sharesapp-watchlist');
            return saved ? JSON.parse(saved) : [];
        } catch {
            return [];
        }
    });

    const [alerts, setAlerts] = useState(() => {
        try {
            const saved = localStorage.getItem('sharesapp-alerts');
            return saved ? JSON.parse(saved) : [];
        } catch {
            return [];
        }
    });

    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

    // Persist theme
    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('sharesapp-theme', theme);
    }, [theme]);

    // Persist watchlist
    useEffect(() => {
        localStorage.setItem('sharesapp-watchlist', JSON.stringify(watchlist));
    }, [watchlist]);

    // Persist alerts
    useEffect(() => {
        localStorage.setItem('sharesapp-alerts', JSON.stringify(alerts));
    }, [alerts]);

    const toggleTheme = () => {
        setTheme(prev => prev === 'dark' ? 'light' : 'dark');
    };

    const addToWatchlist = (stock) => {
        setWatchlist(prev => {
            if (prev.find(s => s.symbol === stock.symbol)) return prev;
            return [...prev, { ...stock, addedAt: Date.now() }];
        });
    };

    const removeFromWatchlist = (symbol) => {
        setWatchlist(prev => prev.filter(s => s.symbol !== symbol));
    };

    const isInWatchlist = (symbol) => {
        return watchlist.some(s => s.symbol === symbol);
    };

    const addAlert = (alert) => {
        setAlerts(prev => [...prev, { ...alert, id: Date.now(), createdAt: Date.now() }]);
    };

    const removeAlert = (id) => {
        setAlerts(prev => prev.filter(a => a.id !== id));
    };

    const toggleSidebar = () => {
        setSidebarCollapsed(prev => !prev);
    };

    return (
        <AppContext.Provider value={{
            theme,
            toggleTheme,
            watchlist,
            addToWatchlist,
            removeFromWatchlist,
            isInWatchlist,
            alerts,
            addAlert,
            removeAlert,
            sidebarCollapsed,
            toggleSidebar,
        }}>
            {children}
        </AppContext.Provider>
    );
}

export function useApp() {
    const context = useContext(AppContext);
    if (!context) throw new Error('useApp must be used within AppProvider');
    return context;
}

export default AppContext;
