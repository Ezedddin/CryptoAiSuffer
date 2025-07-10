import axios from "axios";

// Interface voor DexScreener token
export interface DexScreenerToken {
    id?: string;
    name?: string;
    symbol?: string;
    description?: string;
    imageUrl?: string;
    [key: string]: unknown;
}

export class DexScreenerService {
    private static instance: DexScreenerService;

    private constructor() {}

    public static getInstance(): DexScreenerService {
        if (!DexScreenerService.instance) {
            DexScreenerService.instance = new DexScreenerService();
        }
        return DexScreenerService.instance;
    }

    /**
     * Haalt de nieuwste coins op van DexScreener
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

    /**
     * Haalt DexScreener tokens op met source en blockchain info
     */
    async getDexScreenerTokensWithMetadata(): Promise<Array<DexScreenerToken & { source: string; blockchain: string }>> {
        const maxRetries = 3;
        let lastError: any;

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                const response = await axios.get("https://api.dexscreener.com/token-profiles/latest/v1", {
                    timeout: 10000, // 10 second timeout
                    headers: {
                        'User-Agent': 'AI-Coin-Sniffer/1.0'
                    }
                });
                
                console.log(`✅ DexScreener data opgehaald (poging ${attempt})`);
                return response.data.map((token: DexScreenerToken) => ({
                    ...token,
                    source: 'dexscreener',
                    blockchain: 'Multi' // DexScreener heeft multiple blockchains
                }));
            } catch (error) {
                lastError = error;
                console.error(`⚠️ DexScreener poging ${attempt} mislukt:`, error instanceof Error ? error.message : String(error));
                
                if (attempt < maxRetries) {
                    const delay = attempt * 2000; // Exponential backoff: 2s, 4s, 6s
                    console.log(`🔄 Opnieuw proberen over ${delay}ms...`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
            }
        }

        console.error("❌ Alle DexScreener pogingen mislukt, gebruik lege array");
        return [];
    }
} 