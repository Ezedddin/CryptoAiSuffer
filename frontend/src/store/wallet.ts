import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface WalletTransaction {
    id: string
    coinName: string
    coinSymbol: string
    type: 'buy' | 'sell'
    amount: number
    price: number
    timestamp: string
    profitLoss?: number
}

export interface WalletProfile {
    address: string
    totalProfit: number
    totalLoss: number
    winRate: number
    totalCoins: number
    earlyEntryCoins: number
    averageROI: number
    linkedWallets: string[]
    riskScore: number
    aiScore: number
    tags: string[]
    firstActivity: string
    lastActivity: string
    transactions: WalletTransaction[]
}

export const useWalletStore = defineStore('wallet', () => {
    const wallets = ref<WalletProfile[]>([
        {
            address: '0x1234...5678',
            totalProfit: 45000,
            totalLoss: 8000,
            winRate: 85.5,
            totalCoins: 12,
            earlyEntryCoins: 8,
            averageROI: 156.7,
            linkedWallets: ['0xabcd...1234', '0xefgh...5678'],
            riskScore: 7.8,
            aiScore: 92,
            tags: ['Insider', 'Early Adopter', 'High ROI'],
            firstActivity: '2023-08-15T09:30:00Z',
            lastActivity: '2024-01-15T14:22:00Z',
            transactions: [
                {
                    id: '1',
                    coinName: 'SafeMoon Pro',
                    coinSymbol: 'SMPRO',
                    type: 'buy',
                    amount: 150000,
                    price: 0.0001,
                    timestamp: '2024-01-15T10:30:00Z'
                },
                {
                    id: '2',
                    coinName: 'CryptoGem',
                    coinSymbol: 'CGEM',
                    type: 'buy',
                    amount: 50000,
                    price: 0.0025,
                    timestamp: '2024-01-14T15:45:00Z'
                }
            ]
        },
        {
            address: '0x9876...5432',
            totalProfit: 12000,
            totalLoss: 3500,
            winRate: 67.3,
            totalCoins: 8,
            earlyEntryCoins: 5,
            averageROI: 89.2,
            linkedWallets: ['0x1111...2222'],
            riskScore: 6.2,
            aiScore: 78,
            tags: ['Regular Trader', 'Medium Risk'],
            firstActivity: '2023-11-20T12:15:00Z',
            lastActivity: '2024-01-14T18:30:00Z',
            transactions: [
                {
                    id: '3',
                    coinName: 'MoonShot',
                    coinSymbol: 'MOON',
                    type: 'buy',
                    amount: 25000,
                    price: 0.0015,
                    timestamp: '2024-01-13T16:20:00Z'
                }
            ]
        }
    ])

    const selectedWallet = ref<WalletProfile | null>(null)
    const searchQuery = ref('')
    const minAiScore = ref(0)
    const maxRiskScore = ref(10)

    const filteredWallets = computed(() => {
        return wallets.value.filter(wallet => {
            const matchesSearch = wallet.address.toLowerCase().includes(searchQuery.value.toLowerCase())
            const matchesAiScore = wallet.aiScore >= minAiScore.value
            const matchesRiskScore = wallet.riskScore <= maxRiskScore.value

            return matchesSearch && matchesAiScore && matchesRiskScore
        })
    })

    const topPerformingWallets = computed(() => {
        return wallets.value
            .sort((a, b) => b.aiScore - a.aiScore)
            .slice(0, 10)
    })

    const insiderWallets = computed(() => {
        return wallets.value.filter(wallet =>
            wallet.tags.includes('Insider') || wallet.earlyEntryCoins / wallet.totalCoins > 0.6
        )
    })

    function getWalletByAddress(address: string): WalletProfile | null {
        return wallets.value.find(wallet => wallet.address === address) || null
    }

    function setSelectedWallet(address: string) {
        selectedWallet.value = getWalletByAddress(address)
    }

    function updateSearchQuery(query: string) {
        searchQuery.value = query
    }

    function updateAiScoreFilter(score: number) {
        minAiScore.value = score
    }

    function updateRiskScoreFilter(score: number) {
        maxRiskScore.value = score
    }

    function addWalletToWatch(address: string) {
        // Mock implementation - in real app this would save to backend
        console.log(`Added wallet ${address} to watchlist`)
    }

    function getWalletStats() {
        const totalWallets = wallets.value.length
        const totalProfit = wallets.value.reduce((sum, wallet) => sum + wallet.totalProfit, 0)
        const avgAiScore = wallets.value.reduce((sum, wallet) => sum + wallet.aiScore, 0) / totalWallets
        const insiderCount = insiderWallets.value.length

        return {
            totalWallets,
            totalProfit,
            avgAiScore: Math.round(avgAiScore * 10) / 10,
            insiderCount,
            insiderPercentage: Math.round((insiderCount / totalWallets) * 100 * 10) / 10
        }
    }

    return {
        wallets,
        selectedWallet,
        searchQuery,
        minAiScore,
        maxRiskScore,
        filteredWallets,
        topPerformingWallets,
        insiderWallets,
        getWalletByAddress,
        setSelectedWallet,
        updateSearchQuery,
        updateAiScoreFilter,
        updateRiskScoreFilter,
        addWalletToWatch,
        getWalletStats
    }
})
