<template>
  <div class="dashboard">
    <!-- Dashboard Header -->
    <div class="dashboard-header">
      <h1 class="page-title">🚀 Crypto AI Dashboard</h1>
      <p class="page-subtitle">Ontdek nieuwe crypto launches en insider activiteit</p>
    </div>

    <!-- Stats Cards -->
    <div class="stats-grid">
      <div class="stat-card card">
        <div class="stat-icon">📊</div>
        <div class="stat-content">
          <h3 class="stat-value">{{ stats.totalCoins }}</h3>
          <p class="stat-label">Nieuwe Launches</p>
        </div>
      </div>
      <div class="stat-card card">
        <div class="stat-icon">🎯</div>
        <div class="stat-content">
          <h3 class="stat-value">{{ stats.highAiScoreCoins }}</h3>
          <p class="stat-label">Hoge AI Score</p>
        </div>
      </div>
      <div class="stat-card card">
        <div class="stat-icon">📈</div>
        <div class="stat-content">
          <h3 class="stat-value">${{ formatNumber(stats.totalMarketCap) }}</h3>
          <p class="stat-label">Totale Market Cap</p>
        </div>
      </div>
      <div class="stat-card card">
        <div class="stat-icon">🔥</div>
        <div class="stat-content">
          <h3 class="stat-value">{{ stats.trendingCoins }}</h3>
          <p class="stat-label">Trending Vandaag</p>
        </div>
      </div>
    </div>

    <!-- Filters -->
    <div class="filters-section card">
      <h3 class="filters-title">🔍 Filters</h3>
      <div class="filters-grid">
        <div class="filter-group">
          <label class="filter-label">Zoeken</label>
          <input 
            v-model="searchQuery"
            @input="updateSearch"
            type="text" 
            placeholder="Zoek op naam of symbol..." 
            class="filter-input"
          />
        </div>
        
        <div class="filter-group">
          <label class="filter-label">Blockchain</label>
          <select 
            v-model="selectedBlockchain"
            @change="updateBlockchain"
            class="filter-select"
          >
            <option value="all">Alle Blockchains</option>
            <option value="Ethereum">Ethereum</option>
            <option value="Solana">Solana</option>
            <option value="BTC">Bitcoin</option>
          </select>
        </div>
        
        <div class="filter-group">
          <label class="filter-label">Min AI Score: {{ minAiScore }}</label>
          <input 
            v-model="minAiScore"
            @input="updateAiScore"
            type="range" 
            min="0" 
            max="100" 
            class="filter-range"
          />
        </div>
        
        <div class="filter-group">
          <label class="filter-label">Sorteer op</label>
          <select 
            v-model="sortBy"
            @change="updateSort"
            class="filter-select"
          >
            <option value="aiScore">AI Score</option>
            <option value="priceChangePerMinute">1m Verandering</option>
            <option value="marketCap">Market Cap</option>
            <option value="launchDate">Launch Datum</option>
          </select>
        </div>
      </div>
    </div>

    <!-- API Status -->
    <div v-if="coinStore.error" class="error-banner card">
      <div class="error-icon">⚠️</div>
      <div class="error-content">
        <h3>API Fout</h3>
        <p>{{ coinStore.error }}</p>
        <button @click="coinStore.fetchLatestCoins()" class="retry-btn">
          🔄 Opnieuw Proberen
        </button>
      </div>
    </div>

    <!-- Results Header -->
    <div class="results-header">
      <h2 class="results-title">
        📋 Nieuwe Launches ({{ filteredCoins.length }})
        <span v-if="coinStore.isLoading" class="loading-spinner">⏳</span>
      </h2>
      <div class="view-toggle">
        <button 
          @click="coinStore.fetchLatestCoins()" 
          class="refresh-btn"
          :disabled="coinStore.isLoading"
        >
          🔄 Ververs
        </button>
        <button 
          @click="viewMode = 'grid'"
          :class="['view-btn', { active: viewMode === 'grid' }]"
        >
          🔲 Grid
        </button>
        <button 
          @click="viewMode = 'list'"
          :class="['view-btn', { active: viewMode === 'list' }]"
        >
          📋 Lijst
        </button>
      </div>
    </div>

    <!-- Coins Grid/List -->
    <div v-if="filteredCoins.length > 0" :class="['coins-container', viewMode]">
      <CoinCard 
        v-for="coin in sortedCoins" 
        :key="coin.id" 
        :coin="coin"
        :class="{ 'list-item': viewMode === 'list' }"
      />
    </div>

    <!-- Empty State -->
    <div v-else class="empty-state card">
      <div class="empty-icon">🔍</div>
      <h3>Geen coins gevonden</h3>
      <p>Probeer je filters aan te passen om meer resultaten te krijgen.</p>
    </div>

    <!-- Top Performers Section -->
    <div class="top-performers-section">
      <h2 class="section-title">🏆 Top Performers (1m)</h2>
      <div class="top-performers-grid">
        <div 
          v-for="coin in topPerformers" 
          :key="coin.id"
          class="top-performer-item card"
          @click="navigateToCoin(coin.id)"
        >
          <!-- <span class="performer-logo">{{ coin.logo }}</span> -->
          <div class="performer-info">
            <span class="performer-name">{{ coin.name }}</span>
            <span class="performer-change text-success">
              +{{ (coin.priceChangePerMinute || 0).toFixed(1) }}%
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useCoinStore } from '../store/coin'
import CoinCard from '../components/CoinCard.vue'

const router = useRouter()
const coinStore = useCoinStore()

// Reactive data
const searchQuery = ref('')
const selectedBlockchain = ref('all')
const minAiScore = ref(0)
const sortBy = ref('aiScore')
const viewMode = ref('grid')

// Real-time connection cleanup
let realTimeCleanup: (() => void) | null = null

// Computed properties
const filteredCoins = computed(() => coinStore.filteredCoins)
const topPerformers = computed(() => coinStore.topPerformers)

const sortedCoins = computed(() => {
  const coins = [...filteredCoins.value]
  
  return coins.sort((a, b) => {
    switch (sortBy.value) {
      case 'aiScore':
        return b.aiScore - a.aiScore
      case 'priceChangePerMinute':
        return (b.priceChangePerMinute || 0) - (a.priceChangePerMinute || 0)
      case 'marketCap':
        return b.marketCap - a.marketCap
      case 'launchDate':
        return new Date(b.launchDate).getTime() - new Date(a.launchDate).getTime()
      default:
        return 0
    }
  })
})

const stats = computed(() => ({
  totalCoins: filteredCoins.value.length,
  highAiScoreCoins: filteredCoins.value.filter((coin: any) => coin.aiScore >= 80).length,
  totalMarketCap: filteredCoins.value.reduce((sum: number, coin: any) => sum + coin.marketCap, 0),
  trendingCoins: filteredCoins.value.filter((coin: any) => (coin.priceChangePerMinute || 0) > 5).length
}))

// Event handlers
const updateSearch = () => {
  coinStore.updateSearchQuery(searchQuery.value)
}

const updateBlockchain = () => {
  coinStore.updateBlockchainFilter(selectedBlockchain.value)
}

const updateAiScore = () => {
  coinStore.updateAiScoreFilter(minAiScore.value)
}

const updateSort = () => {
  // Sorting is handled by computed property
}

const navigateToCoin = (coinId: string) => {
  router.push(`/coin/${coinId}`)
}

const formatNumber = (num: number): string => {
  if (num >= 1000000000) return (num / 1000000000).toFixed(1) + 'B'
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M' 
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
  return num.toString()
}

// Lifecycle hooks
onMounted(async () => {
  console.log('🚀 Dashboard mounted, initializing...')
  
  // Load initial data
  await coinStore.fetchLatestCoins()
  
  // Setup real-time connection
  realTimeCleanup = coinStore.setupRealTime()
  
  console.log('✅ Dashboard initialized with real-time updates')
})

onUnmounted(() => {
  console.log('🔌 Dashboard unmounting, cleaning up...')
  
  // Cleanup real-time connection
  if (realTimeCleanup) {
    realTimeCleanup()
  }
  coinStore.cleanup()
})
</script>

<style scoped>
.dashboard {
  max-width: 1400px;
  margin: 0 auto;
}

.dashboard-header {
  text-align: center;
  margin-bottom: 40px;
}

.page-title {
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 10px;
  background: linear-gradient(45deg, #00ff88, #00cc6a);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.page-subtitle {
  font-size: 1.1rem;
  color: #888;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 20px;
}

.stat-icon {
  font-size: 2rem;
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #2a2a2a;
  border-radius: 12px;
}

.stat-value {
  font-size: 1.8rem;
  font-weight: 700;
  color: #00ff88;
  margin-bottom: 5px;
}

.stat-label {
  color: #888;
  font-size: 0.9rem;
}

.filters-section {
  margin-bottom: 30px;
  padding: 25px;
}

.filters-title {
  font-size: 1.2rem;
  font-weight: 600;
  margin-bottom: 20px;
  color: #fff;
}

.filters-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.filter-label {
  font-size: 0.9rem;
  color: #888;
  font-weight: 500;
}

.filter-input,
.filter-select {
  padding: 10px 12px;
  background-color: #0f0f0f;
  border: 1px solid #2a2a2a;
  border-radius: 6px;
  color: #fff;
}

/* API Status Styles */
.error-banner {
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 20px;
  padding: 20px;
  background-color: #2a1f1f;
  border: 1px solid #ff4444;
}

.error-icon {
  font-size: 1.5rem;
}

.error-content h3 {
  color: #ff6666;
  margin-bottom: 5px;
}

.error-content p {
  color: #ffaaaa;
  margin-bottom: 10px;
}

.retry-btn, .refresh-btn {
  background-color: #00ff88;
  color: #000;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s;
}

.retry-btn:hover, .refresh-btn:hover {
  background-color: #00cc6a;
}

.refresh-btn:disabled {
  background-color: #666;
  cursor: not-allowed;
}

.loading-spinner {
  animation: spin 1s linear infinite;
  display: inline-block;
  margin-left: 10px;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.filter-input,
.filter-select {
  font-size: 0.9rem;
  outline: none;
  transition: border-color 0.3s ease;
}

.filter-input:focus,
.filter-select:focus {
  border-color: #00ff88;
}

.filter-range {
  -webkit-appearance: none;
  appearance: none;
  height: 6px;
  background: #2a2a2a;
  border-radius: 3px;
  outline: none;
}

.filter-range::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 18px;
  height: 18px;
  background: #00ff88;
  border-radius: 50%;
  cursor: pointer;
}

.results-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 25px;
}

.results-title {
  font-size: 1.4rem;
  font-weight: 600;
  color: #fff;
}

.view-toggle {
  display: flex;
  gap: 5px;
}

.view-btn {
  padding: 8px 15px;
  background-color: #2a2a2a;
  border: none;
  border-radius: 6px;
  color: #888;
  cursor: pointer;
  font-size: 0.85rem;
  transition: all 0.3s ease;
}

.view-btn.active,
.view-btn:hover {
  background-color: #00ff88;
  color: #000;
}

.coins-container.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 20px;
  margin-bottom: 40px;
}

.coins-container.list {
  display: flex;
  flex-direction: column;
  gap: 15px;
  margin-bottom: 40px;
}

.coins-container.list .coin-card {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  min-height: auto;
  padding: 20px;
}

.empty-state {
  text-align: center;
  padding: 60px 40px;
  margin-bottom: 40px;
}

.empty-icon {
  font-size: 3rem;
  margin-bottom: 20px;
}

.empty-state h3 {
  font-size: 1.3rem;
  margin-bottom: 10px;
  color: #fff;
}

.empty-state p {
  color: #888;
}

.top-performers-section {
  margin-top: 40px;
}

.section-title {
  font-size: 1.4rem;
  font-weight: 600;
  margin-bottom: 20px;
  color: #fff;
}

.top-performers-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 15px;
}

.top-performer-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 15px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.top-performer-item:hover {
  border-color: #00ff88;
  transform: translateY(-2px);
}

.performer-logo {
  font-size: 1.5rem;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #2a2a2a;
  border-radius: 10px;
}

.performer-info {
  flex: 1;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.performer-name {
  font-weight: 600;
  color: #fff;
}

.performer-change {
  font-weight: 600;
}

@media (max-width: 768px) {
  .page-title {
    font-size: 2rem;
  }
  
  .stats-grid {
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 15px;
  }
  
  .filters-grid {
    grid-template-columns: 1fr;
  }
  
  .results-header {
    flex-direction: column;
    gap: 15px;
    align-items: flex-start;
  }
  
  .coins-container.grid {
    grid-template-columns: 1fr;
  }
}
</style>
