import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { db } from './db/index';

const app = express();

// 1. Core Security Headers (Helmet)
// Disables X-Powered-By, enables strict HSTS, and forces clickjacking protection
app.use(helmet());

// 2. Cross-Origin Resource Sharing (CORS)
// Strictly binds API access to the approved frontend domain
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// 3. API Rate Limiting (DDoS Protection)
// Restricts each IP to 100 requests per 15-minute window for standard REST endpoints
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 100, 
  message: { error: 'Too many requests from this IP, please try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', apiLimiter);

// 4. Payload Parsing
app.use(express.json({ limit: '1mb' })); // Restricts JSON body size to prevent payload exhaustion
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// 5. REST API Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/inventory', (req, res) => {
  try {
    const items = db.prepare('SELECT sku, name, price, stock_level FROM inventory').all();
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: 'Database query failed' });
  }
});

// Export the hardened Express instance for server.ts to wrap with Socket.io
export default app;
