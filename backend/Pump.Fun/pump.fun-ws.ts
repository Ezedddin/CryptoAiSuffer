import WebSocket from 'ws';
import { EventEmitter } from 'events';

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
}

// Shared token storage
let pumpFunTokens: EnrichedPumpFunToken[] = [];

// Event emitter voor communicatie met REST API
const tokenEmitter = new EventEmitter();

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
    });

    ws.on('message', (data: WebSocket.Data) => {
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

                // Voeg timestamp toe en sla op
                const enrichedToken: EnrichedPumpFunToken = {
                    ...token,
                    source: 'pump.fun',
                    receivedAt: new Date().toISOString(),
                    blockchain: 'Solana' // Pump.fun is Solana-based
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

                const enrichedToken: EnrichedPumpFunToken = {
                    ...token,
                    source: 'pump.fun',
                    receivedAt: new Date().toISOString(),
                    blockchain: 'Solana'
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

                const enrichedToken: EnrichedPumpFunToken = {
                    ...token,
                    source: 'pump.fun',
                    receivedAt: new Date().toISOString(),
                    blockchain: 'Solana'
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
