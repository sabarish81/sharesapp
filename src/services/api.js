const API_BASE = 'http://localhost:3001/api';

async function fetchAPI(endpoint) {
    try {
        const res = await fetch(`${API_BASE}${endpoint}`);
        if (!res.ok) {
            const error = await res.json().catch(() => ({ message: 'Request failed' }));
            throw new Error(error.message || `HTTP ${res.status}`);
        }
        return await res.json();
    } catch (err) {
        console.error(`API Error [${endpoint}]:`, err);
        throw err;
    }
}

export const api = {
    // Search stocks
    searchStocks: (query) => fetchAPI(`/search?q=${encodeURIComponent(query)}`),

    // Get stock quote with fundamentals
    getQuote: (symbol) => fetchAPI(`/quote/${encodeURIComponent(symbol)}`),

    // Get historical chart data
    getChart: (symbol, range = '1mo') => fetchAPI(`/chart/${encodeURIComponent(symbol)}?range=${range}`),

    // Get market indices
    getIndices: () => fetchAPI('/market/indices'),

    // Get trending / most active stocks
    getTrending: () => fetchAPI('/market/trending'),

    // Get stock news
    getNews: (symbol) => fetchAPI(`/news/${encodeURIComponent(symbol)}`),

    // Get market news
    getMarketNews: () => fetchAPI('/market/news'),

    // Get AI analysis
    getAnalysis: (symbol) => fetchAPI(`/analysis/${encodeURIComponent(symbol)}`),
};

export default api;
