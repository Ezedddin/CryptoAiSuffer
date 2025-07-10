import { DexScreenerService } from '../DexScreen/dexscreener.service.js';
import { PumpFunService } from '../Pump.Fun/pump.fun.service.js';
import { PriceService } from './price.service.js';
import { PriceHistoryService } from './price-history.service.js';
import { SSEService } from './sse.service.js';

export class TokenService {
    private static instance: TokenService;
    private dexScreenerService: DexScreenerService;
    private pumpFunService: PumpFunService;
    private priceService: PriceService;
    private priceHistoryService: PriceHistoryService;
    private dexScreenerTokensCache: any[] = [];
    private lastDexScreenerUpdate: number = 0;
    private readonly DEXSCREENER_CACHE_DURATION = 1 * 60 * 1000; // 5 minuten

    private constructor() {
        this.dexScreenerService = DexScreenerService.getInstance();
        this.pumpFunService = PumpFunService.getInstance();
        this.priceService = PriceService.getInstance();
        this.priceHistoryService = PriceHistoryService.getInstance();
        
        // Luister naar token updates en stuur naar SSE clients
        const tokenEmitter = this.pumpFunService.getTokenEmitter();
        tokenEmitter.on('tokensUpdated', (tokens) => {
            const sseService = SSEService.getInstance();
            sseService.broadcastTokensUpdated(tokens);
        });
    }

    public static getInstance(): TokenService {
        if (!TokenService.instance) {
            TokenService.instance = new TokenService();
        }
        return TokenService.instance;
    }

    /**
     * Start alle services
     */
    startServices(): void {
        this.pumpFunService.startWebSocket();
        
        // Start timer voor DexScreener prijs updates (elke 5 minuten)
        setInterval(() => {
            this.updateDexScreenerPrices();
        }, 5 * 60 * 1000);
    }

    /**
     * Update DexScreener prijzen elke minuut met echte API data
     */
    private async updateDexScreenerPrices(): Promise<void> {
        try {
            const now = Date.now();
            
            // Alleen updaten als cache verouderd is
            if (now - this.lastDexScreenerUpdate < this.DEXSCREENER_CACHE_DURATION) {
                return;
            }

            // Haal nieuwe DexScreener data op (dit zal automatisch nieuwe API calls maken)
            const newTokens = await this.dexScreenerService.getDexScreenerTokensWithMetadata();
            
            // Update cache
            this.dexScreenerTokensCache = newTokens;
            this.lastDexScreenerUpdate = now;
            
            // Stuur updates naar SSE clients
            const sseService = SSEService.getInstance();
            sseService.broadcastTokensUpdated(newTokens);
            
            console.log(`🔄 DexScreener prijzen bijgewerkt voor ${newTokens.length} tokens`);
            
        } catch (error) {
            console.error("Fout bij updaten DexScreener prijzen:", error instanceof Error ? error.message : String(error));
        }
    }

    /**
     * Haalt alle tokens op van alle bronnen met prijzen
     */
    async getAllTokens(): Promise<Array<any & { price?: number; priceChange24h?: number; priceChangePerMinute?: number }>> {
        try {
            // Haal DexScreener data op (gebruik cache als beschikbaar)
            let dexScreenerTokens = this.dexScreenerTokensCache;
            const now = Date.now();
            
            if (now - this.lastDexScreenerUpdate >= this.DEXSCREENER_CACHE_DURATION) {
                dexScreenerTokens = await this.dexScreenerService.getDexScreenerTokensWithMetadata();
                this.dexScreenerTokensCache = dexScreenerTokens;
                this.lastDexScreenerUpdate = now;
            }

            // Haal Pump.fun tokens op
            const pumpFunTokens = this.pumpFunService.getTokensWithMetadata();

            // Haal SOL prijs één keer op voor alle tokens
            const solPrice = await this.priceService.getSolPrice();
            
            // Voeg prijzen toe aan Pump.fun tokens (gebruik WebSocket data als beschikbaar)
            const pumpFunTokensWithPrices = await Promise.all(
                pumpFunTokens.map(async (token) => {
                    let price = token.price || 0;
                    let priceChangePerMinute = token.priceChangePerMinute || 0;

                    // Als WebSocket data geen prijs heeft, bereken dan opnieuw
                    if (!price && token.marketCapSol && token.mint) {
                        const totalSupply = token.vTokensInBondingCurve || 1000000000;
                        price = this.priceService.calculatePriceFromMarketCapSolSync(token.marketCapSol, totalSupply, solPrice);
                        
                        // Voeg prijs toe aan geschiedenis
                        this.priceHistoryService.addPricePoint(token.mint, price);
                        
                        // Bereken prijsverandering per minuut
                        priceChangePerMinute = this.priceHistoryService.calculatePriceChangePerMinute(token.mint);
                    }

                    return {
                        ...token,
                        price,
                        priceChangePerMinute
                    };
                })
            );

            // Combineer alle tokens
            const allTokens = [
                ...pumpFunTokensWithPrices,
                ...dexScreenerTokens
            ];

            console.log(`📊 Serving ${allTokens.length} combined tokens (${pumpFunTokensWithPrices.length} Pump.fun + ${dexScreenerTokens.length} DexScreener)`);
            return allTokens;
        } catch (error) {
            console.error("Fout bij ophalen van gecombineerde tokens:", error instanceof Error ? error.message : String(error));
            throw new Error("Fout bij ophalen van tokens.");
        }
    }

    /**
     * Haalt alleen DexScreener tokens op
     */
    async getDexScreenerTokens(): Promise<any[]> {
        return await this.dexScreenerService.getDexScreenerTokensWithMetadata();
    }

    /**
     * Haalt alleen Pump.fun tokens op
     */
    getPumpFunTokens(): any[] {
        return this.pumpFunService.getTokens();
    }

    /**
     * Haalt token details op
     */
    async getTokenDetails(chainId: string, tokenAddress: string): Promise<{ dexId: string; pair: any }> {
        return await this.dexScreenerService.getTokenDetails(chainId, tokenAddress);
    }

    /**
     * Haalt service status op
     */
    getStatus(): any {
        return {
            pumpFunTokens: this.pumpFunService.getTokenCount(),
            pumpFunWebSocketStarted: true, // We weten dat deze gestart is
            dexScreenerTokens: this.dexScreenerTokensCache.length,
            lastDexScreenerUpdate: new Date(this.lastDexScreenerUpdate).toISOString(),
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Haalt de token emitter op voor real-time updates
     */
    getTokenEmitter() {
        return this.pumpFunService.getTokenEmitter();
    }
} 