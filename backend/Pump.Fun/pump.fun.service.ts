import { startPumpFunWebSocket, getPumpFunTokens, getPumpFunTokenCount, getTokenEmitter } from './pump.fun-ws.js';

export class PumpFunService {
    private static instance: PumpFunService;
    private isWebSocketStarted: boolean = false;

    private constructor() {}

    public static getInstance(): PumpFunService {
        if (!PumpFunService.instance) {
            PumpFunService.instance = new PumpFunService();
        }
        return PumpFunService.instance;
    }

    /**
     * Start de Pump.fun WebSocket service
     */
    startWebSocket(): void {
        if (!this.isWebSocketStarted) {
            startPumpFunWebSocket();
            this.isWebSocketStarted = true;
            console.log('📡 Pump.fun WebSocket service gestart');
        }
    }

    /**
     * Haalt alle Pump.fun tokens op
     */
    getTokens(): any[] {
        return getPumpFunTokens();
    }

    /**
     * Haalt het aantal Pump.fun tokens op
     */
    getTokenCount(): number {
        return getPumpFunTokenCount();
    }

    /**
     * Haalt de token emitter op voor real-time updates
     */
    getTokenEmitter() {
        return getTokenEmitter();
    }

    /**
     * Genereert een link naar een Pump.fun token
     */
    generateTokenLink(mint: string): string | null {
        if (!mint) return null;
        return `https://pump.fun/coin/${mint}`;
    }

    /**
     * Haalt Pump.fun tokens op met metadata en links
     */
    getTokensWithMetadata(): Array<any & { source: string; blockchain: string; url: string | null }> {
        const tokens = getPumpFunTokens();
        return tokens.map(token => ({
            ...token,
            source: 'pump.fun',
            blockchain: 'Solana', // Pump.fun is Solana-gebaseerd
            url: token.mint ? this.generateTokenLink(token.mint) : null
        }));
    }
} 