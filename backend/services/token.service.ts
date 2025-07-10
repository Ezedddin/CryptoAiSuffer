import { DexScreenerService } from '../DexScreen/dexscreener.service.js';
import { PumpFunService } from '../Pump.Fun/pump.fun.service.js';
import { PriceService } from './price.service.js';
import { PriceHistoryService } from './price-history.service.js';

export class TokenService {
    private static instance: TokenService;
    private dexScreenerService: DexScreenerService;
    private pumpFunService: PumpFunService;
    private priceService: PriceService;
    private priceHistoryService: PriceHistoryService;

    private constructor() {
        this.dexScreenerService = DexScreenerService.getInstance();
        this.pumpFunService = PumpFunService.getInstance();
        this.priceService = PriceService.getInstance();
        this.priceHistoryService = PriceHistoryService.getInstance();
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
    }

    /**
     * Haalt alle tokens op van alle bronnen met prijzen
     */
    async getAllTokens(): Promise<Array<any & { price?: number; priceChange24h?: number }>> {
        try {
            // Haal DexScreener data op
            const dexScreenerTokens = await this.dexScreenerService.getDexScreenerTokensWithMetadata();

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
        return await this.dexScreenerService.getLatestCoins();
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