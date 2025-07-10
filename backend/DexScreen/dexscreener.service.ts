import axios from "axios";

// Interface voor DexScreener token profiel
export interface DexScreenerTokenProfile {
    url: string;
    chainId: string;
    tokenAddress: string;
    icon?: string;
    header?: string;
    description: string;
    links?: Array<{
        type: string;
        label: string;
        url: string;
    }>;
}

// Interface voor DexScreener pair data (echte trading data)
export interface DexScreenerPair {
    chainId: string;
    dexId: string;
    url: string;
    pairAddress: string;
    baseToken: {
        address: string;
        name: string;
        symbol: string;
    };
    quoteToken: {
        address: string;
        name: string;
        symbol: string;
    };
    priceNative: string;
    priceUsd: string;
    volume: {
        [key: string]: number;
    };
    priceChange: {
        [key: string]: number;
    };
    liquidity: {
        usd: number;
        base: number;
        quote: number;
    };
    fdv: number;
    marketCap: number;
    pairCreatedAt: number;
    info?: {
        imageUrl?: string;
        websites?: Array<{ url: string }>;
        socials?: Array<{ platform: string; handle: string }>;
    };
    boosts?: {
        active: number;
    };
}

// Interface voor gecombineerde token data
export interface DexScreenerToken {
    id?: string;
    name?: string;
    symbol?: string;
    description?: string;
    imageUrl?: string;
    url?: string;
    chainId?: string;
    tokenAddress?: string;
    price?: number;
    priceChange24h?: number;
    volume24h?: number;
    marketCap?: number;
    liquidity?: number;
    [key: string]: unknown;
}

export class DexScreenerService {
    private static instance: DexScreenerService;
    private tokenProfiles: DexScreenerTokenProfile[] = [];
    private tradingData: Map<string, DexScreenerPair> = new Map();

    private constructor() {}

    public static getInstance(): DexScreenerService {
        if (!DexScreenerService.instance) {
            DexScreenerService.instance = new DexScreenerService();
        }
        return DexScreenerService.instance;
    }

    /**
     * Haalt token profielen op van DexScreener
     */
    async getTokenProfiles(): Promise<DexScreenerTokenProfile[]> {
        try {
            const response = await axios.get("https://api.dexscreener.com/token-profiles/latest/v1", {
                timeout: 10000,
                headers: {
                    'User-Agent': 'AI-Coin-Sniffer/1.0'
                }
            });

            this.tokenProfiles = response.data;
            console.log(`✅ ${this.tokenProfiles.length} DexScreener token profielen opgehaald`);
            return this.tokenProfiles;

        } catch (error) {
            console.error("Fout bij ophalen van token profielen:", error instanceof Error ? error.message : String(error));
            return [];
        }
    }

    /**
     * Haalt trading data op voor een specifieke token
     */
    async getTradingDataForToken(tokenAddress: string, chainId: string): Promise<DexScreenerPair | null> {
        try {
            const response = await axios.get(`https://api.dexscreener.com/token-pairs/v1/${chainId}/${tokenAddress}`, {
                timeout: 5000,
                headers: {
                    'User-Agent': 'AI-Coin-Sniffer/1.0'
                }
            });

            if (response.data && response.data.length > 0) {
                // Pak de pair met de hoogste volume
                const bestPair = response.data.reduce((best: DexScreenerPair, current: DexScreenerPair) => {
                    const bestVolume = best.volume?.h24 || 0;
                    const currentVolume = current.volume?.h24 || 0;
                    return currentVolume > bestVolume ? current : best;
                });

                return bestPair;
            }

            return null;

        } catch (error) {
            console.error(`Fout bij ophalen trading data voor ${tokenAddress}:`, error instanceof Error ? error.message : String(error));
            return null;
        }
    }

    /**
     * Haalt populaire tokens op met echte trading data
     */
    async getPopularTokens(): Promise<DexScreenerPair[]> {
        try {
            // Zoek naar populaire tokens
            const popularQueries = ['SOL', 'ETH', 'BTC', 'USDC', 'USDT', 'JUP', 'BONK', 'WIF'];
            const allPairs: DexScreenerPair[] = [];

            for (const query of popularQueries) {
                try {
                    const response = await axios.get(`https://api.dexscreener.com/latest/dex/search?q=${encodeURIComponent(query)}`, {
                        timeout: 5000,
                        headers: {
                            'User-Agent': 'AI-Coin-Sniffer/1.0'
                        }
                    });

                    if (response.data && response.data.pairs) {
                        // Filter op tokens met goede volume en liquidity
                        const filteredPairs = response.data.pairs.filter((pair: DexScreenerPair) => 
                            pair.volume && 
                            pair.volume.h24 > 50000 && // Min $50k volume
                            pair.liquidity && 
                            pair.liquidity.usd > 100000 // Min $100k liquidity
                        );

                        allPairs.push(...filteredPairs.slice(0, 3)); // Max 3 per query
                    }

                    // Rate limiting: wacht 500ms tussen requests
                    await new Promise(resolve => setTimeout(resolve, 500));

                } catch (error) {
                    console.error(`Fout bij zoeken naar ${query}:`, error instanceof Error ? error.message : String(error));
                }
            }

            console.log(`✅ ${allPairs.length} populaire DexScreener tokens opgehaald`);
            return allPairs;

        } catch (error) {
            console.error("Fout bij ophalen van populaire tokens:", error instanceof Error ? error.message : String(error));
            return [];
        }
    }

    /**
     * Haalt DexScreener tokens op met complete metadata
     */
    async getDexScreenerTokensWithMetadata(): Promise<Array<DexScreenerToken & { source: string; blockchain: string }>> {
        const maxRetries = 3;
        let lastError: any;

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                // Haal token profielen op
                const profiles = await this.getTokenProfiles();
                
                // Haal populaire tokens op voor trading data
                const popularTokens = await this.getPopularTokens();
                
                // Maak een map van trading data voor snelle lookup
                const tradingDataMap = new Map<string, DexScreenerPair>();
                popularTokens.forEach(pair => {
                    const key = `${pair.chainId}-${pair.baseToken.address}`;
                    tradingDataMap.set(key, pair);
                });

                // Combineer profielen met trading data
                const enrichedTokens = await Promise.all(
                    profiles.slice(0, 20).map(async (profile: DexScreenerTokenProfile) => {
                        try {
                            // Probeer trading data op te halen voor dit profiel
                            const tradingData = await this.getTradingDataForToken(profile.tokenAddress, profile.chainId);
                            
                            // Als geen directe trading data, zoek in populaire tokens
                            let bestTradingData = tradingData;
                            if (!bestTradingData) {
                                const key = `${profile.chainId}-${profile.tokenAddress}`;
                                bestTradingData = tradingDataMap.get(key) || null;
                            }

                            // Genereer een goede naam
                            const name = this.generateTokenName(profile, bestTradingData);

                            return {
                                id: profile.tokenAddress,
                                name: name,
                                symbol: bestTradingData?.baseToken.symbol || 'UNK',
                                description: profile.description || `Token on ${profile.chainId}`,
                                imageUrl: bestTradingData?.info?.imageUrl || profile.icon || '',
                                url: profile.url || bestTradingData?.url || `https://dexscreener.com/${profile.chainId}/${profile.tokenAddress}`,
                                chainId: profile.chainId,
                                tokenAddress: profile.tokenAddress,
                                price: bestTradingData ? parseFloat(bestTradingData.priceUsd) : 0,
                                priceChange24h: bestTradingData?.priceChange?.h24 || 0,
                                volume24h: bestTradingData?.volume?.h24 || 0,
                                marketCap: bestTradingData?.marketCap || 0,
                                liquidity: bestTradingData?.liquidity?.usd || 0,
                                source: 'dexscreener',
                                blockchain: this.mapChainIdToBlockchain(profile.chainId)
                            };

                        } catch (error) {
                            console.error(`Fout bij verwerken van profiel ${profile.tokenAddress}:`, error);
                            
                            // Fallback naar basis profiel data
                            return {
                                id: profile.tokenAddress,
                                name: this.generateTokenName(profile, null),
                                symbol: 'UNK',
                                description: profile.description || `Token on ${profile.chainId}`,
                                imageUrl: profile.icon || '',
                                url: profile.url || `https://dexscreener.com/${profile.chainId}/${profile.tokenAddress}`,
                                chainId: profile.chainId,
                                tokenAddress: profile.tokenAddress,
                                price: 0,
                                priceChange24h: 0,
                                volume24h: 0,
                                marketCap: 0,
                                liquidity: 0,
                                source: 'dexscreener',
                                blockchain: this.mapChainIdToBlockchain(profile.chainId)
                            };
                        }
                    })
                );

                console.log(`✅ ${enrichedTokens.length} DexScreener tokens verrijkt met trading data`);
                return enrichedTokens;

            } catch (error) {
                lastError = error;
                console.error(`⚠️ DexScreener poging ${attempt} mislukt:`, error instanceof Error ? error.message : String(error));
                
                if (attempt < maxRetries) {
                    const delay = attempt * 2000;
                    console.log(`🔄 Opnieuw proberen over ${delay}ms...`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
            }
        }

        console.error("❌ Alle DexScreener pogingen mislukt, gebruik lege array");
        return [];
    }

    /**
     * Genereert een goede token naam
     */
    private generateTokenName(profile: DexScreenerTokenProfile, tradingData: DexScreenerPair | null): string {
        // Probeer eerst trading data naam
        if (tradingData?.baseToken.name && tradingData.baseToken.name.length < 50) {
            return tradingData.baseToken.name;
        }

        // Probeer profiel beschrijving
        if (profile.description && profile.description.length < 50 && !profile.description.startsWith('0x')) {
            return profile.description;
        }

        // Genereer naam op basis van chain en adres
        const shortAddress = profile.tokenAddress.slice(0, 6) + '...' + profile.tokenAddress.slice(-4);
        return `${this.mapChainIdToBlockchain(profile.chainId)} Token ${shortAddress}`;
    }

    /**
     * Mapt chain ID naar blockchain naam
     */
    private mapChainIdToBlockchain(chainId: string): string {
        const chainMap: { [key: string]: string } = {
            'solana': 'Solana',
            'ethereum': 'Ethereum',
            'bsc': 'BSC',
            'polygon': 'Polygon',
            'arbitrum': 'Arbitrum',
            'avalanche': 'Avalanche',
            'optimism': 'Optimism',
            'base': 'Base'
        };

        return chainMap[chainId.toLowerCase()] || 'Multi';
    }

    /**
     * Haalt de nieuwste coins op van DexScreener (token profielen)
     */
    async getLatestCoins(): Promise<DexScreenerToken[]> {
        try {
            const response = await axios.get("https://api.dexscreener.com/token-profiles/latest/v1");
            const coins = response.data;

            // Debug: log de eerste coin om de structuur te zien
            if (coins && coins.length > 0) {
                console.log("Sample coin data structure:", JSON.stringify(coins[0], null, 2));
            }

            return coins;
        } catch (error) {
            console.error("Fout bij ophalen van Dexscreener:", error instanceof Error ? error.message : String(error));
            throw new Error("Fout bij ophalen van coins.");
        }
    }

    /**
     * Haalt token details op voor een specifieke chain en token address
     */
    async getTokenDetails(chainId: string, tokenAddress: string): Promise<{ dexId: string; pair: any }> {
        try {
            const response = await axios.get(`https://api.dexscreener.com/token-pairs/v1/${chainId}/${tokenAddress}`);
            const pairs = response.data;

            // Pak eerste pair (soms heeft een token meerdere pairs op verschillende DEXen)
            if (pairs.length > 0) {
                const dexId = pairs[0].dexId;
                return { dexId, pair: pairs[0] };
            } else {
                throw new Error("Geen pairs gevonden voor deze token");
            }
        } catch (error) {
            console.error("Fout bij ophalen dexId:", error instanceof Error ? error.message : String(error));
            throw new Error("Fout bij ophalen details.");
        }
    }
} 