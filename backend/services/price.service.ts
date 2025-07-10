import axios from 'axios';

export interface TokenPrice {
    symbol: string;
    price: number;
    priceChange24h: number;
    marketCap: number;
    volume24h: number;
    lastUpdated: string;
}

export class PriceService {
    private static instance: PriceService;
    private priceCache: Map<string, TokenPrice> = new Map();
    private cacheTimeout = 30000; // 30 seconden cache
    private solPriceCache: { price: number; timestamp: number } | null = null;
    private solPriceCacheTimeout = 60000; // 1 minuut cache voor SOL prijs

    private constructor() {}

    public static getInstance(): PriceService {
        if (!PriceService.instance) {
            PriceService.instance = new PriceService();
        }
        return PriceService.instance;
    }



    /**
     * Haalt de prijs op voor een DexScreener token
     */
    async getDexScreenerPrice(pairAddress: string): Promise<TokenPrice | null> {
        try {
            const response = await axios.get(`https://api.dexscreener.com/latest/dex/pairs/${pairAddress}`, {
                timeout: 5000,
                headers: {
                    'User-Agent': 'AI-Coin-Sniffer/1.0'
                }
            });

            if (response.data && response.data.pairs && response.data.pairs.length > 0) {
                const pair = response.data.pairs[0];
                const priceData: TokenPrice = {
                    symbol: pair.baseToken.symbol,
                    price: parseFloat(pair.priceUsd) || 0,
                    priceChange24h: parseFloat(pair.priceChange.h24) || 0,
                    marketCap: parseFloat(pair.marketCap) || 0,
                    volume24h: parseFloat(pair.volume.h24) || 0,
                    lastUpdated: new Date().toISOString()
                };

                // Cache de prijs
                this.priceCache.set(pairAddress, priceData);
                return priceData;
            }
        } catch (error) {
            console.error(`⚠️ Kon DexScreener prijs niet ophalen voor ${pairAddress}:`, error instanceof Error ? error.message : String(error));
        }

        return null;
    }

    /**
     * Haalt gecachte prijs op of null als niet beschikbaar
     */
    getCachedPrice(tokenId: string): TokenPrice | null {
        const cached = this.priceCache.get(tokenId);
        if (cached) {
            const now = Date.now();
            const lastUpdated = new Date(cached.lastUpdated).getTime();
            if (now - lastUpdated < this.cacheTimeout) {
                return cached;
            }
        }
        return null;
    }

    /**
     * Haalt de huidige SOL prijs op via CoinGecko API (gecached)
     */
    async getSolPrice(): Promise<number> {
        // Check cache eerst
        if (this.solPriceCache) {
            const now = Date.now();
            if (now - this.solPriceCache.timestamp < this.solPriceCacheTimeout) {
                console.log(`💱 Gebruik gecachte SOL prijs: $${this.solPriceCache.price} USD`);
                return this.solPriceCache.price;
            }
        }

        try {
            const response = await axios.get('https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd', {
                timeout: 5000,
                headers: {
                    'User-Agent': 'AI-Coin-Sniffer/1.0'
                }
            });
            
            if (response.data && response.data.solana && response.data.solana.usd) {
                const solPrice = response.data.solana.usd;
                
                // Cache de SOL prijs
                this.solPriceCache = {
                    price: solPrice,
                    timestamp: Date.now()
                };
                
                console.log(`💱 Huidige SOL prijs: $${solPrice} USD`);
                return solPrice;
            }
        } catch (error) {
            console.error('⚠️ Kon SOL prijs niet ophalen van CoinGecko:', error instanceof Error ? error.message : String(error));
        }
        
        // Fallback: gebruik gemiddelde SOL prijs als API faalt
        console.log('⚠️ Gebruik fallback SOL prijs: $150 USD');
        return 150;
    }

    /**
     * Bereken token prijs: (marketCapSol × SOL_prijs_USD) ÷ totale_supply
     */
    async calculatePriceFromMarketCapSol(marketCapSol: number, totalSupply: number): Promise<number> {
        if (!totalSupply || totalSupply === 0) return 0;
        
        // Haal de huidige SOL prijs op
        const solPriceUSD = await this.getSolPrice();
        
        // Bereken market cap in USD: marketCapSol × SOL_prijs_USD
        const marketCapUSD = marketCapSol * solPriceUSD;
        
        // Bereken prijs per token: market cap USD ÷ totale supply
        const pricePerToken = marketCapUSD / totalSupply;
        
        console.log(`💰 Token prijs berekening:`);
        console.log(`   Market Cap: ${marketCapSol} SOL × $${solPriceUSD} = $${marketCapUSD.toFixed(2)} USD`);
        console.log(`   Prijs per token: $${marketCapUSD.toFixed(2)} ÷ ${totalSupply.toLocaleString()} = $${pricePerToken.toFixed(8)} USD`);
        
        return pricePerToken;
    }

    /**
     * Bereken token prijs synchronously (met gegeven SOL prijs)
     */
    calculatePriceFromMarketCapSolSync(marketCapSol: number, totalSupply: number, solPriceUSD: number): number {
        if (!totalSupply || totalSupply === 0) return 0;
        
        // Bereken market cap in USD: marketCapSol × SOL_prijs_USD
        const marketCapUSD = marketCapSol * solPriceUSD;
        
        // Bereken prijs per token: market cap USD ÷ totale supply
        const pricePerToken = marketCapUSD / totalSupply;
        
        console.log(`💰 Token prijs berekening (sync):`);
        console.log(`   Market Cap: ${marketCapSol} SOL × $${solPriceUSD} = $${marketCapUSD.toFixed(2)} USD`);
        console.log(`   Prijs per token: $${marketCapUSD.toFixed(2)} ÷ ${totalSupply.toLocaleString()} = $${pricePerToken.toFixed(8)} USD`);
        
        return pricePerToken;
    }
} 