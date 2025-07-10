import WebSocket from 'ws';
import { EventEmitter } from 'events';
import { PriceService } from '../services/price.service.js';
import { PriceHistoryService } from '../services/price-history.service.js';

// Interface voor Pump.fun token data
interface PumpFunToken {
    signature?: string;
    mint?: string;
    traderPublicKey?: string;
    txType?: string;
    initialBuy?: number;
    solAmount?: number;
    bondingCurveKey?: string;
    vTokensInBondingCurve?: number;
    vSolInBondingCurve?: number;
    marketCapSol?: number;
    name?: string;
    symbol?: string;
    uri?: string;
    pool?: string;
    [key: string]: unknown;
}

interface EnrichedPumpFunToken extends PumpFunToken {
    source: string;
    receivedAt: string;
    blockchain: string;
    price?: number;
    priceChangePerMinute?: number;
}

// Shared token storage
let pumpFunTokens: EnrichedPumpFunToken[] = [];

// Event emitter voor communicatie met REST API
const tokenEmitter = new EventEmitter();

// Services voor prijsberekening
const priceService = PriceService.getInstance();
const priceHistoryService = PriceHistoryService.getInstance();

// Helper functie om beschrijving te genereren voor Pump.fun tokens
const generatePumpFunDescription = (token: PumpFunToken): string => {
    if (token.name && token.symbol) {
        return `${token.name} (${token.symbol}) - New Pump.fun token on Solana`;
    } else if (token.name) {
        return `${token.name} - New Pump.fun token on Solana`;
    } else if (token.symbol) {
        return `${token.symbol} - New Pump.fun token on Solana`;
    } else {
        return 'New Pump.fun token on Solana';
    }
};

// Timer voor periodieke prijs updates
let priceUpdateTimer: NodeJS.Timeout | null = null;

// Functie om prijzen van bestaande tokens periodiek bij te werken
const updateExistingTokenPrices = async () => {
    try {
        const solPrice = await priceService.getSolPrice();
        
        // Update prijzen van bestaande tokens
        for (let i = 0; i < pumpFunTokens.length; i++) {
            const token = pumpFunTokens[i];
            
            if (token.marketCapSol && token.mint) {
                // Simuleer kleine prijsveranderingen (random walk)
                const priceVariation = (Math.random() - 0.5) * 0.1; // ±5% variatie
                const adjustedMarketCapSol = token.marketCapSol * (1 + priceVariation);
                
                // Bereken nieuwe prijs
                const totalSupply = token.vTokensInBondingCurve || 1000000000;
                const newPrice = priceService.calculatePriceFromMarketCapSolSync(adjustedMarketCapSol, totalSupply, solPrice);
                
                // Bereken nieuwe market cap in USD
                const newMarketCapUSD = adjustedMarketCapSol * solPrice;
                
                // Voeg nieuwe prijs toe aan geschiedenis
                priceHistoryService.addPricePoint(token.mint, newPrice);
                
                // Bereken prijsverandering per minuut
                const priceChangePerMinute = priceHistoryService.calculatePriceChangePerMinute(token.mint);
                
                // Update token met nieuwe prijs, prijsverandering en market cap
                pumpFunTokens[i] = {
                    ...token,
                    price: newPrice,
                    priceChangePerMinute,
                    marketCap: newMarketCapUSD
                };
                
                console.log(`🔄 Token ${token.name} prijs bijgewerkt: $${newPrice.toFixed(8)} (${priceChangePerMinute.toFixed(2)}%), MarketCap: $${newMarketCapUSD.toFixed(2)}`);
            }
        }
        
        // Emit event voor alle bijgewerkte tokens
        if (pumpFunTokens.length > 0) {
            tokenEmitter.emit('tokensUpdated', pumpFunTokens);
        }
        
    } catch (error) {
        console.error("❌ Fout bij bijwerken van token prijzen:", error);
    }
};

// WebSocket connectie functie
const connectPumpFunWebSocket = (): void => {
    console.log("🔌 Verbinden met Pump.fun WebSocket...");
    const ws = new WebSocket("wss://pumpportal.fun/api/data");

    ws.on('open', () => {
        console.log("✅ WebSocket verbonden met Pump.fun");

        // Subscribe op nieuwe token creaties
        const subscribePayload = {
            method: "subscribeNewToken"
        };
        
        console.log("📡 Sturen subscription payload:", JSON.stringify(subscribePayload));
        ws.send(JSON.stringify(subscribePayload));
        
        console.log("✅ Subscription verzonden voor nieuwe tokens");
        
        // Start timer voor periodieke prijs updates (elke 30 seconden)
        if (!priceUpdateTimer) {
            priceUpdateTimer = setInterval(updateExistingTokenPrices, 30 * 1000);
            console.log("⏰ Prijs update timer gestart (elke 30 seconden)");
        }
    });

    ws.on('message', async (data: WebSocket.Data) => {
        try {
            const rawData = data.toString();
            console.log("📨 Raw WebSocket data ontvangen:", rawData);
            
            const msg = JSON.parse(rawData);
            console.log("📨 Parsed WebSocket message:", JSON.stringify(msg, null, 2));

            // Check voor status berichten
            if (msg.message && (msg.message.includes("Successfully subscribed") || msg.message.includes("subscribed"))) {
                console.log("ℹ️ Status bericht ontvangen:", msg.message);
                return;
            }

            // Check voor nieuwe token creaties (txType: "create")
            if (msg.txType === "create" && msg.mint && msg.name) {
                const token: PumpFunToken = msg;
                console.log("🚀 Nieuwe token gevonden op Pump.fun:", token.name || token.symbol || 'Unnamed Token');

                // Bereken prijs en prijsverandering
                let price = 0;
                let priceChangePerMinute = 0;
                let solPrice = 0;

                if (token.marketCapSol && token.mint) {
                    // Haal SOL prijs op
                    solPrice = await priceService.getSolPrice();
                    
                    // Bereken token prijs
                    const totalSupply = token.vTokensInBondingCurve || 1000000000;
                    price = priceService.calculatePriceFromMarketCapSolSync(token.marketCapSol, totalSupply, solPrice);
                    
                    // Voeg prijs toe aan geschiedenis
                    priceHistoryService.addPricePoint(token.mint, price);
                    
                    // Bereken prijsverandering per minuut
                    priceChangePerMinute = priceHistoryService.calculatePriceChangePerMinute(token.mint);
                    console.log(`📊 Prijsverandering per minuut voor ${token.mint}: ${priceChangePerMinute.toFixed(2)}%`);
                }

                // Bereken market cap in USD
                const marketCapUSD = token.marketCapSol && solPrice ? token.marketCapSol * solPrice : 0;
                
                // Genereer beschrijving voor Pump.fun tokens
                const description = generatePumpFunDescription(token);

                // Voeg timestamp toe en sla op
                const enrichedToken: EnrichedPumpFunToken = {
                    ...token,
                    source: 'pump.fun',
                    receivedAt: new Date().toISOString(),
                    blockchain: 'Solana', // Pump.fun is Solana-based
                    price,
                    priceChangePerMinute,
                    marketCap: marketCapUSD,
                    description
                };

                // Voeg toe aan begin van array (nieuwste eerst)
                pumpFunTokens.unshift(enrichedToken);

                // Houd alleen laatste 100 tokens
                if (pumpFunTokens.length > 100) {
                    pumpFunTokens = pumpFunTokens.slice(0, 100);
                }

                // Emit event dat er een nieuwe token is
                tokenEmitter.emit('newToken', enrichedToken);

                console.log(`📊 Total tokens stored: ${pumpFunTokens.length}`);
            } else if (msg.method === "newToken" && msg.data) {
                // Oude format (voor het geval dat)
                const token: PumpFunToken = msg.data;
                console.log("🚀 Nieuwe token gevonden (oude format):", token.name || token.symbol || 'Unnamed Token');

                // Bereken prijs en prijsverandering
                let price = 0;
                let priceChangePerMinute = 0;
                let solPrice = 0;

                if (token.marketCapSol && token.mint) {
                    // Haal SOL prijs op
                    solPrice = await priceService.getSolPrice();
                    
                    // Bereken token prijs
                    const totalSupply = token.vTokensInBondingCurve || 1000000000;
                    price = priceService.calculatePriceFromMarketCapSolSync(token.marketCapSol, totalSupply, solPrice);
                    
                    // Voeg prijs toe aan geschiedenis
                    priceHistoryService.addPricePoint(token.mint, price);
                    
                    // Bereken prijsverandering per minuut
                    priceChangePerMinute = priceHistoryService.calculatePriceChangePerMinute(token.mint);
                    console.log(`📊 Prijsverandering per minuut voor ${token.mint}: ${priceChangePerMinute.toFixed(2)}%`);
                }

                // Bereken market cap in USD
                const marketCapUSD = token.marketCapSol && solPrice ? token.marketCapSol * solPrice : 0;

                const enrichedToken: EnrichedPumpFunToken = {
                    ...token,
                    source: 'pump.fun',
                    receivedAt: new Date().toISOString(),
                    blockchain: 'Solana',
                    price,
                    priceChangePerMinute,
                    marketCap: marketCapUSD
                };

                pumpFunTokens.unshift(enrichedToken);
                if (pumpFunTokens.length > 100) {
                    pumpFunTokens = pumpFunTokens.slice(0, 100);
                }

                tokenEmitter.emit('newToken', enrichedToken);
                console.log(`📊 Total tokens stored: ${pumpFunTokens.length}`);
            } else if (msg.type === "newToken" || msg.event === "newToken") {
                // Alternatieve response format
                const token: PumpFunToken = msg.data || msg.token || msg;
                console.log("🚀 Nieuwe token gevonden (alternatief format):", token.name || token.symbol || 'Unnamed Token');

                // Bereken prijs en prijsverandering
                let price = 0;
                let priceChangePerMinute = 0;
                let solPrice = 0;

                if (token.marketCapSol && token.mint) {
                    // Haal SOL prijs op
                    solPrice = await priceService.getSolPrice();
                    
                    // Bereken token prijs
                    const totalSupply = token.vTokensInBondingCurve || 1000000000;
                    price = priceService.calculatePriceFromMarketCapSolSync(token.marketCapSol, totalSupply, solPrice);
                    
                    // Voeg prijs toe aan geschiedenis
                    priceHistoryService.addPricePoint(token.mint, price);
                    
                    // Bereken prijsverandering per minuut
                    priceChangePerMinute = priceHistoryService.calculatePriceChangePerMinute(token.mint);
                    console.log(`📊 Prijsverandering per minuut voor ${token.mint}: ${priceChangePerMinute.toFixed(2)}%`);
                }

                // Bereken market cap in USD
                const marketCapUSD = token.marketCapSol && solPrice ? token.marketCapSol * solPrice : 0;

                // Genereer beschrijving voor Pump.fun tokens
                const description = generatePumpFunDescription(token);

                const enrichedToken: EnrichedPumpFunToken = {
                    ...token,
                    source: 'pump.fun',
                    receivedAt: new Date().toISOString(),
                    blockchain: 'Solana',
                    price,
                    priceChangePerMinute,
                    marketCap: marketCapUSD,
                    description
                };

                pumpFunTokens.unshift(enrichedToken);
                if (pumpFunTokens.length > 100) {
                    pumpFunTokens = pumpFunTokens.slice(0, 100);
                }

                tokenEmitter.emit('newToken', enrichedToken);
                console.log(`📊 Total tokens stored: ${pumpFunTokens.length}`);
            } else {
                console.log("❓ Onbekend bericht format (geen nieuwe token):", msg);
            }
        } catch (error) {
            console.error("❌ Fout bij verwerken WebSocket bericht:", error);
            console.error("Raw data was:", data.toString());
        }
    });

    ws.on('error', (err: Error) => {
        console.error("❌ WebSocket fout:", err.message);
        console.error("Error details:", err);
        // Probeer opnieuw na 5 seconden
        setTimeout(connectPumpFunWebSocket, 5000);
    });

    ws.on('close', (code: number, reason: Buffer) => {
        console.log(`⚠️ WebSocket verbinding gesloten (code: ${code}, reason: ${reason.toString()})`);
        
        // Stop prijs update timer
        if (priceUpdateTimer) {
            clearInterval(priceUpdateTimer);
            priceUpdateTimer = null;
            console.log("⏰ Prijs update timer gestopt");
        }
        
        console.log("🔄 Opnieuw proberen in 5 seconden...");
        setTimeout(connectPumpFunWebSocket, 5000);
    });

    // Ping/Pong voor connection health
    setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
            console.log("💓 Sending ping...");
            ws.ping();
        }
    }, 30000); // Elke 30 seconden
};

// Functie om alle tokens op te halen
export const getPumpFunTokens = (): EnrichedPumpFunToken[] => {
    return pumpFunTokens;
};

// Functie om token count op te halen
export const getPumpFunTokenCount = (): number => {
    return pumpFunTokens.length;
};

// Export event emitter voor externe listeners
export const getTokenEmitter = (): EventEmitter => {
    return tokenEmitter;
};

// Start WebSocket connectie
export const startPumpFunWebSocket = (): void => {
    console.log("🚀 Starting Pump.fun WebSocket service...");
    connectPumpFunWebSocket();
};

// Export types
export type { PumpFunToken, EnrichedPumpFunToken };
