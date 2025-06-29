import WebSocket from 'ws';
import { EventEmitter } from 'events';

// Interface voor Pump.fun token data
interface PumpFunToken {
    name?: string;
    symbol?: string;
    description?: string;
    image?: string;
    createdTimestamp?: number;
    mint?: string;
    bonding_curve?: string;
    associated_bonding_curve?: string;
    creator?: string;
    market_cap?: number;
    reply_count?: number;
    last_reply?: number;
    nsfw?: boolean;
    market_id?: string;
    inverted?: boolean;
    is_currently_live?: boolean;
    king_of_the_hill_timestamp?: number;
    show_name?: boolean;
    king_of_the_hill_timestamp_pretty?: string;
    usd_market_cap?: number;
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
        ws.send(JSON.stringify({
            method: "subscribeNewToken"
        }));
    });

    ws.on('message', (data: WebSocket.Data) => {
        try {
            const msg = JSON.parse(data.toString());

            if (msg.method === "newToken") {
                const token: PumpFunToken = msg.data;
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
            }
        } catch (error) {
            console.error("❌ Fout bij verwerken WebSocket bericht:", error);
        }
    });

    ws.on('error', (err: Error) => {
        console.error("❌ WebSocket fout:", err.message);
        // Probeer opnieuw na 5 seconden
        setTimeout(connectPumpFunWebSocket, 5000);
    });

    ws.on('close', () => {
        console.log("⚠️ WebSocket verbinding gesloten, opnieuw proberen in 5 seconden...");
        setTimeout(connectPumpFunWebSocket, 5000);
    });
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
