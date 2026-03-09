import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import apiRoutes from './routes/api.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:3000'],
    methods: ['GET'],
}));

app.use(express.json());

// API Routes
app.use('/api', apiRoutes);

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve frontend static files in production
const distPath = path.join(__dirname, '../dist');
app.use(express.static(distPath));

// Catch-all route to serve index.html for React Router
app.get(/.*/, (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
});

// Start server
app.listen(PORT, () => {
    console.log(`\n🚀 SharesApp API Server running on http://localhost:${PORT}`);
    console.log(`📊 Endpoints:`);
    console.log(`   GET /api/search?q=<query>`);
    console.log(`   GET /api/quote/<symbol>`);
    console.log(`   GET /api/chart/<symbol>?range=<range>`);
    console.log(`   GET /api/market/indices`);
    console.log(`   GET /api/market/trending`);
    console.log(`   GET /api/news/<symbol>`);
    console.log(`   GET /api/market/news`);
    console.log(`   GET /api/analysis/<symbol>\n`);
});
