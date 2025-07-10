import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import apiRoutes from "./routes/api.routes.js";
import { TokenService } from "./services/token.service.js";
import { SSEService } from "./services/sse.service.js";
import { PriceHistoryService } from "./services/price-history.service.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

// Initialiseer services
const tokenService = TokenService.getInstance();
const sseService = SSEService.getInstance();
const priceHistoryService = PriceHistoryService.getInstance();

// Start alle services
tokenService.startServices();

// Start cleanup timer voor prijsgeschiedenis (elke 10 minuten)
setInterval(() => {
    priceHistoryService.cleanup();
    const stats = priceHistoryService.getStats();
    console.log(`🧹 Prijsgeschiedenis cleanup: ${stats.totalTokens} tokens, ${stats.totalDataPoints} datapunten`);
}, 10 * 60 * 1000);

// Luister naar nieuwe tokens en stuur naar SSE clients
const tokenEmitter = tokenService.getTokenEmitter();
tokenEmitter.on('newToken', (token) => {
    sseService.broadcastNewToken(token);
});

// API routes
app.use('/api', apiRoutes);

app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📡 Pump.fun WebSocket integration started`);
    console.log(`🔴 Server-Sent Events available at /api/stream`);
});
