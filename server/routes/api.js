import express from 'express';
import { getQuote, getChart, searchStocks, getIndices, getTrending, getNews } from '../services/stockService.js';
import { analyzeStock } from '../services/aiService.js';

const router = express.Router();

// Search stocks
router.get('/search', async (req, res) => {
    try {
        const { q } = req.query;
        if (!q) return res.json([]);
        const results = await searchStocks(q);
        res.json(results);
    } catch (err) {
        res.status(500).json({ message: 'Search failed', error: err.message });
    }
});

// Get quote with fundamentals
router.get('/quote/:symbol', async (req, res) => {
    try {
        const data = await getQuote(req.params.symbol);
        res.json(data);
    } catch (err) {
        res.status(500).json({ message: 'Quote not found', error: err.message });
    }
});

// Get chart data
router.get('/chart/:symbol', async (req, res) => {
    try {
        const range = req.query.range || '1mo';
        const data = await getChart(req.params.symbol, range);
        res.json(data);
    } catch (err) {
        res.status(500).json({ message: 'Chart data unavailable', error: err.message });
    }
});

// Market indices
router.get('/market/indices', async (req, res) => {
    try {
        const data = await getIndices();
        res.json(data);
    } catch (err) {
        res.status(500).json({ message: 'Indices unavailable', error: err.message });
    }
});

// Trending stocks
router.get('/market/trending', async (req, res) => {
    try {
        const data = await getTrending();
        res.json(data);
    } catch (err) {
        res.status(500).json({ message: 'Trending data unavailable', error: err.message });
    }
});

// Stock news
router.get('/news/:symbol', async (req, res) => {
    try {
        const news = await getNews(req.params.symbol);
        res.json(news);
    } catch (err) {
        res.status(500).json({ message: 'News unavailable', error: err.message });
    }
});

// Market news
router.get('/market/news', async (req, res) => {
    try {
        const news = await getNews(null);
        res.json(news);
    } catch (err) {
        res.status(500).json({ message: 'Market news unavailable', error: err.message });
    }
});

// AI analysis
router.get('/analysis/:symbol', async (req, res) => {
    try {
        const quote = await getQuote(req.params.symbol);
        const analysis = analyzeStock(quote);
        res.json(analysis);
    } catch (err) {
        res.status(500).json({ message: 'Analysis failed', error: err.message });
    }
});

export default router;
