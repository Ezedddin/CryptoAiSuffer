interface PricePoint {
    price: number;
    timestamp: number;
}

interface TokenPriceHistory {
    [mint: string]: PricePoint[];
}

export class PriceHistoryService {
    private static instance: PriceHistoryService;
    private priceHistory: TokenPriceHistory = {};
    private maxHistoryPoints = 60; // Bewaar laatste 60 minuten

    private constructor() {}

    public static getInstance(): PriceHistoryService {
        if (!PriceHistoryService.instance) {
            PriceHistoryService.instance = new PriceHistoryService();
        }
        return PriceHistoryService.instance;
    }

    /**
     * Voeg een nieuwe prijs toe aan de geschiedenis
     */
    addPricePoint(mint: string, price: number): void {
        const now = Date.now();
        
        if (!this.priceHistory[mint]) {
            this.priceHistory[mint] = [];
        }

        // Voeg nieuwe prijs toe
        this.priceHistory[mint].push({
            price,
            timestamp: now
        });

        // Bewaar alleen laatste 60 punten
        if (this.priceHistory[mint].length > this.maxHistoryPoints) {
            this.priceHistory[mint] = this.priceHistory[mint].slice(-this.maxHistoryPoints);
        }

        console.log(`📈 Prijsgeschiedenis bijgewerkt voor ${mint}: $${price.toFixed(8)}`);
    }

    /**
     * Bereken prijsverandering per minuut
     */
    calculatePriceChangePerMinute(mint: string): number {
        const history = this.priceHistory[mint];
        if (!history || history.length < 2) {
            return 0; // Niet genoeg data
        }

        const now = Date.now();
        const oneMinuteAgo = now - (60 * 1000); // 60 seconden geleden

        // Zoek prijs van 1 minuut geleden
        const currentPrice = history[history.length - 1].price;
        const oneMinuteAgoPrice = this.getPriceAtTime(mint, oneMinuteAgo);

        if (oneMinuteAgoPrice === null) {
            return 0; // Geen data van 1 minuut geleden
        }

        // Bereken percentage verandering
        const priceChange = ((currentPrice - oneMinuteAgoPrice) / oneMinuteAgoPrice) * 100;
        
        console.log(`📊 Prijsverandering per minuut voor ${mint}: ${priceChange.toFixed(2)}% (${oneMinuteAgoPrice.toFixed(8)} → ${currentPrice.toFixed(8)})`);
        
        return priceChange;
    }

    /**
     * Haal prijs op van een specifiek tijdstip
     */
    private getPriceAtTime(mint: string, timestamp: number): number | null {
        const history = this.priceHistory[mint];
        if (!history || history.length === 0) {
            return null;
        }

        // Zoek het dichtstbijzijnde prijspunt
        let closestPrice = history[0];
        let minDifference = Math.abs(history[0].timestamp - timestamp);

        for (const point of history) {
            const difference = Math.abs(point.timestamp - timestamp);
            if (difference < minDifference) {
                minDifference = difference;
                closestPrice = point;
            }
        }

        // Alleen gebruiken als het binnen 2 minuten is
        if (minDifference <= 2 * 60 * 1000) {
            return closestPrice.price;
        }

        return null;
    }

    /**
     * Haal alle prijsgeschiedenis op voor een token
     */
    getPriceHistory(mint: string): PricePoint[] {
        return this.priceHistory[mint] || [];
    }

    /**
     * Verwijder oude prijsgeschiedenis (cleanup)
     */
    cleanup(): void {
        const now = Date.now();
        const oneHourAgo = now - (60 * 60 * 1000);

        for (const mint in this.priceHistory) {
            this.priceHistory[mint] = this.priceHistory[mint].filter(
                point => point.timestamp > oneHourAgo
            );
        }
    }

    /**
     * Haal statistieken op
     */
    getStats(): { totalTokens: number; totalDataPoints: number } {
        let totalDataPoints = 0;
        for (const mint in this.priceHistory) {
            totalDataPoints += this.priceHistory[mint].length;
        }

        return {
            totalTokens: Object.keys(this.priceHistory).length,
            totalDataPoints
        };
    }
} 