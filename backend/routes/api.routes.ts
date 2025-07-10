import express from "express";
import { TokenService } from "../services/token.service.js";
import { SSEService } from "../services/sse.service.js";

const router = express.Router();
const tokenService = TokenService.getInstance();
const sseService = SSEService.getInstance();

// Server-Sent Events endpoint voor real-time updates
router.get('/stream', (req, res) => {
    sseService.addClient(req, res);
});

// DexScreener endpoints
router.get("/latest-coins", async (req, res) => {
    try {
        const coins = await tokenService.getDexScreenerTokens();
        res.json(coins);
    } catch (error) {
        console.error("Fout bij ophalen van Dexscreener:", error instanceof Error ? error.message : String(error));
        res.status(500).json({ message: "Fout bij ophalen van coins." });
    }
});

// Pump.fun endpoints
router.get("/pump-fun-tokens", (req, res) => {
    const tokens = tokenService.getPumpFunTokens();
    console.log(`📊 Serving ${tokens.length} Pump.fun tokens`);
    res.json(tokens);
});

// Gecombineerde endpoints
router.get("/all-tokens", async (req, res) => {
    try {
        const allTokens = await tokenService.getAllTokens();
        res.json(allTokens);
    } catch (error) {
        console.error("Fout bij ophalen van gecombineerde tokens:", error instanceof Error ? error.message : String(error));
        res.status(500).json({ message: "Fout bij ophalen van tokens." });
    }
});

// Token details endpoint
router.get("/coin-details/:chainId/:tokenAddress", async (req, res) => {
    const { chainId, tokenAddress } = req.params;
    try {
        const details = await tokenService.getTokenDetails(chainId, tokenAddress);
        res.json(details);
    } catch (error) {
        console.error("Fout bij ophalen token details:", error instanceof Error ? error.message : String(error));
        res.status(500).json({ message: "Fout bij ophalen details." });
    }
});

// Status endpoint
router.get("/status", (req, res) => {
    const status = tokenService.getStatus();
    res.json({
        status: 'running',
        ...status,
        sseClients: sseService.getClientCount(),
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
    });
});

export default router; 