import express from "express";
import axios from "axios";
import cors from "cors";
import dotenv from "dotenv";
import { startPumpFunWebSocket, getPumpFunTokens, getPumpFunTokenCount, getTokenEmitter } from './pump.fun-ws';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

// Interface voor DexScreener token
interface DexScreenerToken {
    id?: string;
    name?: string;
    symbol?: string;
    description?: string;
    imageUrl?: string;
    [key: string]: unknown;
}

// Array om SSE clients bij te houden
const sseClients: Array<{ id: string; res: express.Response }> = [];

// Start Pump.fun WebSocket service
startPumpFunWebSocket();

// Luister naar nieuwe tokens en stuur naar SSE clients
const tokenEmitter = getTokenEmitter();
tokenEmitter.on('newToken', (token) => {
    console.log(`📡 Broadcasting new token to ${sseClients.length} SSE clients`);

    // Stuur naar alle verbonden SSE clients
    sseClients.forEach(client => {
        try {
            client.res.write(`data: ${JSON.stringify({ type: 'newToken', token })}\n\n`);
        } catch (error) {
            console.error('Error sending SSE message:', error);
        }
    });
});

// Server-Sent Events endpoint voor real-time updates
app.get('/api/stream', (req, res) => {
    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Cache-Control'
    });

    const clientId = Date.now().toString();
    const client = { id: clientId, res };
    sseClients.push(client);

    console.log(`✅ New SSE client connected: ${clientId}. Total clients: ${sseClients.length}`);

    // Stuur initial bericht
    res.write(`data: ${JSON.stringify({ type: 'connected', message: 'Real-time stream connected' })}\n\n`);

    // Cleanup bij disconnect
    req.on('close', () => {
        const index = sseClients.findIndex(c => c.id === clientId);
        if (index !== -1) {
            sseClients.splice(index, 1);
            console.log(`❌ SSE client disconnected: ${clientId}. Remaining clients: ${sseClients.length}`);
        }
    });
});

// Bestaande DexScreener endpoint
app.get("/api/latest-coins", async (req, res) => {
    try {
        const response = await axios.get("https://api.dexscreener.com/token-profiles/latest/v1");
        const coins = response.data; // dit is de structuur zoals de API het geeft

        // Debug: log de eerste coin om de structuur te zien
        if (coins && coins.length > 0) {
            console.log("Sample coin data structure:", JSON.stringify(coins[0], null, 2));
        }

        res.json(coins);
    } catch (error) {
        console.error("Fout bij ophalen van Dexscreener:", error instanceof Error ? error.message : String(error));
        res.status(500).json({ message: "Fout bij ophalen van coins." });
    }
});

// Nieuwe Pump.fun tokens endpoint
app.get("/api/pump-fun-tokens", (req, res) => {
    const tokens = getPumpFunTokens();
    console.log(`📊 Serving ${tokens.length} Pump.fun tokens`);
    res.json(tokens);
});

// Gecombineerde endpoint voor alle tokens
app.get("/api/all-tokens", async (req, res) => {
    try {
        // Haal DexScreener data op
        let dexScreenerTokens: Array<DexScreenerToken & { source: string; blockchain: string }> = [];
        try {
            const response = await axios.get("https://api.dexscreener.com/token-profiles/latest/v1");
            dexScreenerTokens = response.data.map((token: DexScreenerToken) => ({
                ...token,
                source: 'dexscreener',
                blockchain: 'Multi' // DexScreener heeft multiple blockchains
            }));
        } catch (dexError) {
            console.error("⚠️ Kon DexScreener data niet ophalen:", dexError);
        }

        // Haal Pump.fun tokens op
        const pumpFunTokens = getPumpFunTokens();

        // Combineer alle tokens
        const allTokens = [
            ...pumpFunTokens,
            ...dexScreenerTokens
        ];

        console.log(`📊 Serving ${allTokens.length} combined tokens (${pumpFunTokens.length} Pump.fun + ${dexScreenerTokens.length} DexScreener)`);
        res.json(allTokens);
    } catch (error) {
        console.error("Fout bij ophalen van gecombineerde tokens:", error instanceof Error ? error.message : String(error));
        res.status(500).json({ message: "Fout bij ophalen van tokens." });
    }
});

app.get("/api/coin-details/:chainId/:tokenAddress", async (req, res) => {
    const { chainId, tokenAddress } = req.params;
    try {
        const response = await axios.get(`https://api.dexscreener.com/token-pairs/v1/${chainId}/${tokenAddress}`);
        const pairs = response.data;

        // pak eerste pair (soms heeft een token meerdere pairs op verschillende DEXen)
        if (pairs.length > 0) {
            const dexId = pairs[0].dexId;
            res.json({ dexId, pair: pairs[0] });
        } else {
            res.status(404).json({ message: "Geen pairs gevonden voor deze token" });
        }
    } catch (error) {
        console.error("Fout bij ophalen dexId:", error instanceof Error ? error.message : String(error));
        res.status(500).json({ message: "Fout bij ophalen details." });
    }
});

// Status endpoint
app.get("/api/status", (req, res) => {
    const pumpFunCount = getPumpFunTokenCount();
    res.json({
        status: 'running',
        pumpFunTokens: pumpFunCount,
        sseClients: sseClients.length,
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
    });
});

app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📡 Pump.fun WebSocket integration started`);
    console.log(`🔴 Server-Sent Events available at /api/stream`);
});
