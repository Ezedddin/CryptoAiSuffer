import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface Coin {
    id: string
    name: string
    symbol: string
    logo: string
    launchDate: string
    currentPrice: number
    priceChange24h: number
    aiScore: number
    blockchain: 'BTC' | 'Solana' | 'Ethereum'
    description: string
    totalSupply: number
    marketCap: number
    volume24h: number
    holders: number
    isNewLaunch: boolean
}

export interface WalletAnalysis {
    address: string
    totalPurchase: number
    aiScore: number
    profitableCoins: number
    totalProfit: number
    isInsider: boolean
    firstPurchaseDate: string
}

export interface CoinDetail extends Coin {
    priceHistory: Array<{ timestamp: number; price: number }>
    walletAnalysis: WalletAnalysis[]
    aiAnalysis: {
        prediction: string
        confidence: number
        reasons: string[]
    }
}

export const useCoinStore = defineStore('coin', () => {
    const coins = ref<Coin[]>([
        {
            id: '1',
            name: 'SafeMoon Pro',
            symbol: 'SMPRO',
            logo: '🚀',
            launchDate: '2024-01-15',
            currentPrice: 0.00045,
            priceChange24h: 125.5,
            aiScore: 85,
            blockchain: 'Ethereum',
            description: 'Next generation DeFi token with advanced tokenomics',
            totalSupply: 1000000000,
            marketCap: 450000,
            volume24h: 85000,
            holders: 1250,
            isNewLaunch: true
        },
        {
            id: '2',
            name: 'CryptoGem',
            symbol: 'CGEM',
            logo: '💎',
            launchDate: '2024-01-14',
            currentPrice: 0.0078,
            priceChange24h: 67.8,
            aiScore: 72,
            blockchain: 'Solana',
            description: 'Community-driven meme coin with utility features',
            totalSupply: 500000000,
            marketCap: 3900000,
            volume24h: 267000,
            holders: 3450,
            isNewLaunch: true
        },
        {
            id: '3',
            name: 'MoonShot',
            symbol: 'MOON',
            logo: '🌙',
            launchDate: '2024-01-13',
            currentPrice: 0.00234,
            priceChange24h: -12.3,
            aiScore: 58,
            blockchain: 'BTC',
            description: 'Bitcoin-based experimental token',
            totalSupply: 21000000,
            marketCap: 49140,
            volume24h: 12000,
            holders: 890,
            isNewLaunch: true
        }
    ])

    const selectedCoin = ref<CoinDetail | null>(null)
    const searchQuery = ref('')
    const selectedBlockchain = ref<string>('all')
    const minAiScore = ref(0)

    const filteredCoins = computed(() => {
        return coins.value.filter(coin => {
            const matchesSearch = coin.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
                coin.symbol.toLowerCase().includes(searchQuery.value.toLowerCase())
            const matchesBlockchain = selectedBlockchain.value === 'all' ||
                coin.blockchain === selectedBlockchain.value
            const matchesAiScore = coin.aiScore >= minAiScore.value

            return matchesSearch && matchesBlockchain && matchesAiScore
        })
    })

    const newLaunches = computed(() => {
        return coins.value.filter(coin => coin.isNewLaunch)
    })

    const topPerformers = computed(() => {
        return coins.value
            .filter(coin => coin.priceChange24h > 0)
            .sort((a, b) => b.priceChange24h - a.priceChange24h)
            .slice(0, 5)
    })

    function getCoinById(id: string): CoinDetail | null {
        const coin = coins.value.find(c => c.id === id)
        if (!coin) return null

        // Mock detailed data
        return {
            ...coin,
            priceHistory: generateMockPriceHistory(coin.currentPrice),
            walletAnalysis: generateMockWalletAnalysis(),
            aiAnalysis: {
                prediction: 'Bullish potential based on wallet analysis',
                confidence: coin.aiScore,
                reasons: [
                    'High percentage of profitable wallets detected',
                    'Early insider activity identified',
                    'Strong community engagement metrics',
                    'Low sell pressure from top holders'
                ]
            }
        }
    }

    function setSelectedCoin(coinId: string) {
        selectedCoin.value = getCoinById(coinId)
    }

    function updateSearchQuery(query: string) {
        searchQuery.value = query
    }

    function updateBlockchainFilter(blockchain: string) {
        selectedBlockchain.value = blockchain
    }

    function updateAiScoreFilter(score: number) {
        minAiScore.value = score
    }

    return {
        coins,
        selectedCoin,
        searchQuery,
        selectedBlockchain,
        minAiScore,
        filteredCoins,
        newLaunches,
        topPerformers,
        getCoinById,
        setSelectedCoin,
        updateSearchQuery,
        updateBlockchainFilter,
        updateAiScoreFilter
    }
})

function generateMockPriceHistory(currentPrice: number) {
    const history = []
    const now = Date.now()
    const oneHour = 3600000

    for (let i = 24; i >= 0; i--) {
        const timestamp = now - (i * oneHour)
        const variation = (Math.random() - 0.5) * 0.2
        const price = currentPrice * (1 + variation)
        history.push({ timestamp, price })
    }

    return history
}

function generateMockWalletAnalysis(): WalletAnalysis[] {
    return [
        {
            address: '0x1234...5678',
            totalPurchase: 15000,
            aiScore: 92,
            profitableCoins: 8,
            totalProfit: 45000,
            isInsider: true,
            firstPurchaseDate: '2024-01-15T10:30:00Z'
        },
        {
            address: '0x9876...5432',
            totalPurchase: 8500,
            aiScore: 78,
            profitableCoins: 5,
            totalProfit: 12000,
            isInsider: false,
            firstPurchaseDate: '2024-01-15T11:45:00Z'
        },
        {
            address: '0xabcd...efgh',
            totalPurchase: 25000,
            aiScore: 95,
            profitableCoins: 12,
            totalProfit: 89000,
            isInsider: true,
            firstPurchaseDate: '2024-01-15T09:15:00Z'
        }
    ]
}
