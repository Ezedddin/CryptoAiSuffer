import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import ApiService, { type CombinedToken, type PumpFunToken } from '../services/api'

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
    externalUrl?: string // Echte URL naar DexScreener of Pump.fun
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
    const coins = ref<Coin[]>([])
    const isLoading = ref(false)
    const error = ref<string | null>(null)
    const isRealTimeConnected = ref(false)

    // Fallback mock data
    const mockCoins: Coin[] = [
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
            isNewLaunch: true,
            externalUrl: 'https://dexscreener.com/ethereum/safemoonpro'
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
            isNewLaunch: true,
            externalUrl: 'https://pump.fun/coin/cgem'
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
            isNewLaunch: true,
            externalUrl: 'https://dexscreener.com/bitcoin/moonshot'
        }
    ]

    // Initialize with mock data
    coins.value = mockCoins

    const selectedCoin = ref<CoinDetail | null>(null)
    const searchQuery = ref('')
    const selectedBlockchain = ref<string>('all')
    const minAiScore = ref(0)

    // Helper functions for data transformation
    const shortenAddress = (address: string): string => {
        if (!address) return ''
        if (address.length <= 10) return address
        return `${address.slice(0, 6)}...${address.slice(-4)}`
    }

    const getCleanCoinName = (token: CombinedToken | PumpFunToken, index: number): string => {
        // Voor Pump.fun tokens
        if (token.source === 'pump.fun') {
            if (token.name && token.name.length < 50 && !token.name.startsWith('0x')) {
                return token.name
            }
            if (token.symbol && token.symbol.length < 20) {
                return token.symbol
            }
            if (token.description && token.description.length < 50 && !token.description.startsWith('0x')) {
                return token.description
            }
            return `Pump Token ${index + 1}`
        }

        // Voor DexScreener tokens
        if ('name' in token && token.name && token.name.length < 50 && !token.name.startsWith('0x')) {
            return token.name
        }
        if (token.symbol && token.symbol.length < 20) {
            return token.symbol
        }
        if (token.description && token.description.length < 50 && !token.description.startsWith('0x')) {
            return token.description
        }
        // If description is too long or looks like an address, use shortened version or fallback
        if (token.description && token.description.startsWith('0x')) {
            return `Token ${shortenAddress(token.description)}`
        }
        return `Token ${index + 1}`
    }

    const transformTokenToCoin = (token: CombinedToken | PumpFunToken, index: number): Coin => {
        // Gebruik de URL uit de API response
        let externalUrl = ''
        if (token.source === 'pump.fun') {
            // Voor Pump.fun tokens, gebruik de externalUrl uit de API response
            externalUrl = ('externalUrl' in token && token.externalUrl) ? token.externalUrl : ''
        } else if (token.source === 'dexscreener') {
            // Voor DexScreener tokens, gebruik de echte URL uit de API
            externalUrl = ('url' in token && token.url) ? token.url : ''
        }

        return {
            id: ('id' in token ? token.id : '') || ('mint' in token ? token.mint : '') || index.toString(),
            name: getCleanCoinName(token, index),
            symbol: token.symbol || 'UNK',
            logo: ('imageUrl' in token ? token.imageUrl : '') || ('image' in token ? token.image : '') || (token.source === 'pump.fun' ? '🚀' : '🪙'),
            launchDate: token.receivedAt ? token.receivedAt.split('T')[0] : new Date().toISOString().split('T')[0],
            currentPrice: token.price || (token.source === 'pump.fun' && 'usd_market_cap' in token && token.usd_market_cap
                ? token.usd_market_cap / 1000000 // Rough price estimation
                : Math.random() * 0.01),
            priceChange24h: token.priceChange24h || (Math.random() - 0.5) * 200, // Echte prijs verandering of mock
            aiScore: Math.floor(Math.random() * 100), // Mock AI score
            blockchain: token.blockchain === 'Multi'
                ? (['BTC', 'Solana', 'Ethereum'][Math.floor(Math.random() * 3)] as 'BTC' | 'Solana' | 'Ethereum')
                : (token.blockchain as 'BTC' | 'Solana' | 'Ethereum') || 'Solana',
            description: token.description || `New ${token.source === 'pump.fun' ? 'Pump.fun' : 'DexScreener'} token`,
            totalSupply: Math.floor(Math.random() * 1000000000),
            marketCap: ('market_cap' in token ? token.market_cap : 0) || ('usd_market_cap' in token ? token.usd_market_cap : 0) || Math.floor(Math.random() * 10000000),
            volume24h: Math.floor(Math.random() * 1000000),
            holders: Math.floor(Math.random() * 10000),
            isNewLaunch: true,
            externalUrl: externalUrl
        }
    }

    // Real-time token handler
    const handleNewToken = (token: PumpFunToken) => {
        console.log('🔥 Adding new real-time token to store:', token.name || token.symbol)

        // Transform to Coin interface
        const newCoin = transformTokenToCoin(token, coins.value.length)

        // Add to beginning of array (newest first)
        coins.value.unshift(newCoin)

        // Keep only last 200 coins to prevent memory issues
        if (coins.value.length > 200) {
            coins.value = coins.value.slice(0, 200)
        }

        console.log(`💎 Total coins in store: ${coins.value.length}`)
    }

    // Setup real-time connection
    const setupRealTime = () => {
        console.log('🔗 Setting up real-time connection...')

        // Connect to SSE stream
        ApiService.connectRealTime()

        // Listen for new tokens
        const unsubscribe = ApiService.onNewToken(handleNewToken)

        // Update connection status
        isRealTimeConnected.value = ApiService.isRealTimeConnected()

        // Cleanup function
        return unsubscribe
    }

    // API function to fetch latest coins
    async function fetchLatestCoins() {
        isLoading.value = true
        error.value = null

        try {
            const allTokens = await ApiService.getAllTokens()

            // Debug: log de eerste token om de structuur te zien
            if (allTokens && allTokens.length > 0) {
                console.log("Frontend: Sample token data:", allTokens[0])
                console.log("Frontend: Token sources:", allTokens.map(t => t.source).slice(0, 5))
            }

            // Transform token data to our Coin interface
            coins.value = allTokens.map((token: CombinedToken, index: number) => transformTokenToCoin(token, index))

            console.log(`✅ Loaded ${coins.value.length} tokens (${allTokens.filter(t => t.source === 'pump.fun').length} Pump.fun + ${allTokens.filter(t => t.source === 'dexscreener').length} DexScreener)`)
        } catch (err) {
            error.value = 'Failed to fetch tokens. Using mock data instead.'
            console.error('Error fetching tokens:', err)
            // Keep mock data on error
            coins.value = mockCoins
        } finally {
            isLoading.value = false
        }
    }

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

    // Cleanup function
    const cleanup = () => {
        ApiService.disconnectRealTime()
        isRealTimeConnected.value = false
    }

    return {
        coins,
        selectedCoin,
        searchQuery,
        selectedBlockchain,
        minAiScore,
        isLoading,
        error,
        isRealTimeConnected,
        filteredCoins,
        newLaunches,
        topPerformers,
        getCoinById,
        setSelectedCoin,
        updateSearchQuery,
        updateBlockchainFilter,
        updateAiScoreFilter,
        fetchLatestCoins,
        setupRealTime,
        cleanup
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
