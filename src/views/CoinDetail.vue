<template>
  <div class="coin-detail" v-if="coin">
    <!-- Header -->
    <div class="coin-header">
      <button @click="goBack" class="back-btn">
        ← Terug naar Dashboard
      </button>
      
      <div class="coin-title-section">
        <div class="coin-basic-info">
          <!-- <span class="coin-logo-large">{{ coin.logo }}</span> -->
          <div>
            <h1 class="coin-name-large">{{ coin.name }}</h1>
            <span class="coin-symbol-large">{{ coin.symbol }}</span>
            <span class="blockchain-badge-large" :class="`blockchain-${coin.blockchain.toLowerCase()}`">
              {{ coin.blockchain }}
            </span>
          </div>
        </div>
        
        <div class="coin-price-section">
          <div class="current-price">
            <span class="price-label">Huidige Prijs</span>
            <span class="price-value">${{ formatPrice(coin.currentPrice) }}</span>
            <span class="price-change" :class="getPriceChangeClass(coin.priceChange24h)">
              {{ coin.priceChange24h > 0 ? '+' : '' }}{{ coin.priceChange24h.toFixed(1) }}%
            </span>
          </div>
          
          <div class="ai-score-large">
            <span class="ai-label">AI Score</span>
            <span class="ai-value" :class="getAiScoreClass(coin.aiScore)">
              {{ coin.aiScore }}/100
            </span>
          </div>
          
          <!-- External Link Button -->
          <div class="external-link-section" v-if="coin.externalUrl">
            <a 
              :href="coin.externalUrl" 
              target="_blank" 
              rel="noopener noreferrer"
              class="external-link-btn"
            >
              <span class="link-icon">{{ getExternalIcon(coin) }}</span>
              <span class="link-text">Bekijk op {{ getExternalPlatform(coin) }}</span>
              <span class="external-arrow">↗️</span>
            </a>
          </div>
        </div>
      </div>
    </div>

    <!-- Key Stats -->
    <div class="stats-overview">
      <div class="stat-item card">
        <div class="stat-icon">💰</div>
        <div class="stat-content">
          <span class="stat-label">Market Cap</span>
          <span class="stat-value">${{ formatNumber(coin.marketCap) }}</span>
        </div>
      </div>
      <div class="stat-item card">
        <div class="stat-icon">📊</div>
        <div class="stat-content">
          <span class="stat-label">Volume 24h</span>
          <span class="stat-value">${{ formatNumber(coin.volume24h) }}</span>
        </div>
      </div>
      <div class="stat-item card">
        <div class="stat-icon">👥</div>
        <div class="stat-content">
          <span class="stat-label">Holders</span>
          <span class="stat-value">{{ formatNumber(coin.holders) }}</span>
        </div>
      </div>
      <div class="stat-item card">
        <div class="stat-icon">🎯</div>
        <div class="stat-content">
          <span class="stat-label">Total Supply</span>
          <span class="stat-value">{{ formatNumber(coin.totalSupply) }}</span>
        </div>
      </div>
    </div>

    <!-- Main Content Grid -->
    <div class="main-content-grid">
      <!-- Price Chart -->
      <div class="chart-section card">
        <CryptoChart 
          v-if="coin"
          :coin-data="{
            name: coin.name,
            symbol: coin.symbol,
            currentPrice: coin.currentPrice,
            priceChange24h: coin.priceChange24h,
            marketCap: coin.marketCap,
            volume24h: coin.volume24h,
            priceHistory: coin.priceHistory?.map(p => ({
              timestamp: new Date(p.timestamp).getTime(),
              price: p.price,
              volume: Math.random() * (coin?.volume24h || 1000000)
            }))
          }"
        />
      </div>

      <!-- AI Analysis -->
      <div class="ai-analysis-section card">
        <h3 class="section-title">🤖 AI Analyse</h3>
        <div class="ai-analysis-content">
          <div class="ai-prediction">
            <span class="prediction-label">Voorspelling:</span>
            <span class="prediction-value">{{ coin.aiAnalysis.prediction }}</span>
          </div>
          
          <div class="confidence-meter">
            <span class="confidence-label">Vertrouwen: {{ coin.aiAnalysis.confidence }}%</span>
            <div class="confidence-bar">
              <div class="confidence-fill" :style="{ width: `${coin.aiAnalysis.confidence}%` }"></div>
            </div>
          </div>
          
          <div class="ai-reasons">
            <h4>Redenen:</h4>
            <ul class="reasons-list">
              <li v-for="reason in coin.aiAnalysis.reasons" :key="reason" class="reason-item">
                ✓ {{ reason }}
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <!-- Wallet Analysis -->
    <div class="wallet-analysis-section card">
      <h3 class="section-title">👛 Wallet Analyse</h3>
      <div class="wallet-analysis-header">
        <div class="analysis-stats">
          <div class="analysis-stat">
            <span class="stat-number">{{ coin.walletAnalysis.length }}</span>
            <span class="stat-text">Significante Kopers</span>
          </div>
          <div class="analysis-stat">
            <span class="stat-number">{{ insiderCount }}</span>
            <span class="stat-text">Insider Wallets</span>
          </div>
          <div class="analysis-stat">
            <span class="stat-number">{{ averageAiScore }}</span>
            <span class="stat-text">Gem. AI Score</span>
          </div>
        </div>
      </div>
      
      <div class="wallet-table-container">
        <table class="wallet-table">
          <thead>
            <tr>
              <th>Wallet Address</th>
              <th>AI Score</th>
              <th>Gekocht</th>
              <th>Winstgevende Coins</th>
              <th>Totale Winst</th>
              <th>Status</th>
              <th>Acties</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="wallet in coin.walletAnalysis" :key="wallet.address" class="wallet-row">
              <td class="wallet-address">
                <span class="address-short">{{ shortenAddress(wallet.address) }}</span>
              </td>
              <td>
                <span class="ai-score-badge" :class="getAiScoreClass(wallet.aiScore)">
                  {{ wallet.aiScore }}
                </span>
              </td>
              <td class="purchase-amount">
                ${{ formatNumber(wallet.totalPurchase) }}
              </td>
              <td>{{ wallet.profitableCoins }}</td>
              <td class="profit-amount text-success">
                ${{ formatNumber(wallet.totalProfit) }}
              </td>
              <td>
                <span v-if="wallet.isInsider" class="insider-badge">🔥 Insider</span>
                <span v-else class="regular-badge">📊 Regulier</span>
              </td>
              <td>
                <button @click="navigateToWallet(wallet.address)" class="view-wallet-btn">
                  Bekijk Wallet
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Coin Description -->
    <div class="coin-description card">
      <h3 class="section-title">📖 Over {{ coin.name }}</h3>
      <p class="description-text">{{ coin.description }}</p>
    </div>
  </div>

  <!-- Loading/Error States -->
  <div v-else class="loading-state">
    <div class="loading-spinner">🔄</div>
    <p>Coin gegevens laden...</p>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useCoinStore } from '../store/coin'
import type { CoinDetail } from '../store/coin'
import CryptoChart from '../components/CryptoChart.vue'

const route = useRoute()
const router = useRouter()
const coinStore = useCoinStore()

const coin = ref<CoinDetail | null>(null)

const insiderCount = computed(() => {
  return coin.value?.walletAnalysis.filter(w => w.isInsider).length || 0
})

const averageAiScore = computed(() => {
  if (!coin.value?.walletAnalysis.length) return 0
  const sum = coin.value.walletAnalysis.reduce((acc, w) => acc + w.aiScore, 0)
  return Math.round(sum / coin.value.walletAnalysis.length)
})

const formatPrice = (price: number): string => {
  if (price < 0.001) return price.toFixed(6)
  if (price < 1) return price.toFixed(4)
  return price.toFixed(2)
}

const formatNumber = (num: number): string => {
  if (num >= 1000000000) return (num / 1000000000).toFixed(1) + 'B'
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
  return num.toString()
}

const getAiScoreClass = (score: number): string => {
  if (score >= 80) return 'score-high'
  if (score >= 60) return 'score-medium'
  return 'score-low'
}

const getPriceChangeClass = (change: number): string => {
  return change >= 0 ? 'text-success' : 'text-danger'
}



const shortenAddress = (address: string): string => {
  if (!address) return ''
  if (address.length <= 10) return address
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

const goBack = () => {
  router.push('/')
}

const navigateToWallet = (address: string) => {
  router.push(`/wallet/${address}`)
}

// External link functions
const getExternalIcon = (coinData: CoinDetail): string => {
  // Check of de URL pump.fun bevat
  if (coinData.externalUrl?.includes('pump.fun')) {
    return '🚀' // Pump.fun icon
  }
  return '🔍' // DexScreener icon
}

const getExternalPlatform = (coinData: CoinDetail): string => {
  // Check of de URL pump.fun bevat
  if (coinData.externalUrl?.includes('pump.fun')) {
    return 'Pump.fun'
  }
  return 'DexScreener'
}

onMounted(() => {
  const coinId = route.params.id as string
  coin.value = coinStore.getCoinById(coinId)
  
  if (coin.value) {
    coinStore.setSelectedCoin(coinId)
  }
})
</script>

<style scoped>
.coin-detail {
  max-width: 1400px;
  margin: 0 auto;
}

.coin-header {
  margin-bottom: 30px;
}

.back-btn {
  background: none;
  border: 1px solid #2a2a2a;
  color: #888;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  margin-bottom: 20px;
  transition: all 0.3s ease;
}

.back-btn:hover {
  border-color: #00ff88;
  color: #00ff88;
}

.coin-title-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 30px;
}

.coin-basic-info {
  display: flex;
  align-items: center;
  gap: 20px;
}

.coin-logo-large {
  font-size: 4rem;
  width: 80px;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #2a2a2a;
  border-radius: 20px;
}

.coin-name-large {
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 8px;
  color: #fff;
}

.coin-symbol-large {
  font-size: 1.2rem;
  color: #888;
  margin-right: 15px;
}

.blockchain-badge-large {
  padding: 6px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
}

.coin-price-section {
  text-align: right;
}

.current-price {
  margin-bottom: 15px;
}

.price-label {
  display: block;
  font-size: 14px;
  color: #888;
  margin-bottom: 5px;
}

.price-value {
  font-size: 2rem;
  font-weight: 700;
  color: #fff;
  margin-right: 10px;
}

.price-change {
  font-size: 1.2rem;
  font-weight: 600;
}

.ai-score-large {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.ai-label {
  font-size: 14px;
  color: #888;
  margin-bottom: 5px;
}

.ai-value {
  font-size: 1.5rem;
  font-weight: 700;
  padding: 8px 16px;
  border-radius: 8px;
}

.external-link-section {
  margin-top: 15px;
}

.external-link-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  background: linear-gradient(135deg, #00ff88, #00cc6a);
  color: #000;
  text-decoration: none;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.9rem;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(0, 255, 136, 0.3);
}

.external-link-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 255, 136, 0.4);
  background: linear-gradient(135deg, #00cc6a, #00aa55);
}

.external-link-btn:active {
  transform: translateY(0);
}

.link-icon {
  font-size: 1.1rem;
}

.link-text {
  white-space: nowrap;
}

.external-arrow {
  font-size: 0.9rem;
  opacity: 0.8;
}

.stats-overview {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 20px;
}

.stat-icon {
  font-size: 2rem;
  width: 50px;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #2a2a2a;
  border-radius: 10px;
}

.stat-content {
  display: flex;
  flex-direction: column;
}

.stat-label {
  font-size: 14px;
  color: #888;
  margin-bottom: 5px;
}

.stat-value {
  font-size: 1.3rem;
  font-weight: 600;
  color: #fff;
}

.main-content-grid {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 30px;
  margin-bottom: 30px;
}

.chart-section,
.ai-analysis-section {
  padding: 25px;
}

.section-title {
  font-size: 1.3rem;
  font-weight: 600;
  margin-bottom: 20px;
  color: #fff;
}

.chart-container {
  height: 300px;
  position: relative;
}

.chart-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.chart-mock {
  display: flex;
  align-items: end;
  gap: 2px;
  height: 200px;
  margin-bottom: 20px;
}

.chart-bar {
  width: 8px;
  background: linear-gradient(to top, #00ff88, #00cc6a);
  border-radius: 2px;
  opacity: 0.8;
}

.chart-note {
  color: #888;
  font-size: 14px;
}

.ai-analysis-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.ai-prediction {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.prediction-label {
  font-size: 14px;
  color: #888;
}

.prediction-value {
  font-size: 1.1rem;
  font-weight: 600;
  color: #00ff88;
}

.confidence-meter {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.confidence-label {
  font-size: 14px;
  color: #888;
}

.confidence-bar {
  width: 100%;
  height: 8px;
  background-color: #2a2a2a;
  border-radius: 4px;
  overflow: hidden;
}

.confidence-fill {
  height: 100%;
  background: linear-gradient(to right, #00ff88, #00cc6a);
  transition: width 0.3s ease;
}

.ai-reasons h4 {
  color: #fff;
  margin-bottom: 10px;
  font-size: 16px;
}

.reasons-list {
  list-style: none;
  padding: 0;
}

.reason-item {
  padding: 8px 0;
  color: #ccc;
  font-size: 14px;
  border-bottom: 1px solid #2a2a2a;
}

.reason-item:last-child {
  border-bottom: none;
}

.wallet-analysis-section {
  margin-bottom: 30px;
  padding: 25px;
}

.wallet-analysis-header {
  margin-bottom: 25px;
}

.analysis-stats {
  display: flex;
  gap: 40px;
}

.analysis-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.stat-number {
  font-size: 1.8rem;
  font-weight: 700;
  color: #00ff88;
}

.stat-text {
  font-size: 14px;
  color: #888;
  margin-top: 5px;
}

.wallet-table-container {
  overflow-x: auto;
}

.wallet-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 20px;
}

.wallet-table th,
.wallet-table td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #2a2a2a;
}

.wallet-table th {
  background-color: #1a1a1a;
  color: #888;
  font-weight: 600;
  font-size: 14px;
}

.wallet-row:hover {
  background-color: #1a1a1a;
}

.wallet-address {
  font-family: monospace;
  font-size: 13px;
}

.address-short {
  color: #00ff88;
}

.ai-score-badge {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
}

.purchase-amount,
.profit-amount {
  font-weight: 600;
}

.insider-badge {
  background-color: rgba(255, 71, 87, 0.2);
  color: #ff4757;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
}

.regular-badge {
  background-color: rgba(136, 136, 136, 0.2);
  color: #888;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
}

.view-wallet-btn {
  background-color: #00ff88;
  color: #000;
  border: none;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.view-wallet-btn:hover {
  background-color: #00cc6a;
}

.coin-description {
  padding: 25px;
}

.description-text {
  font-size: 16px;
  line-height: 1.6;
  color: #ccc;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 400px;
  gap: 20px;
}

.loading-spinner {
  font-size: 3rem;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* Responsive */
@media (max-width: 768px) {
  .coin-title-section {
    flex-direction: column;
    align-items: flex-start;
    gap: 20px;
  }
  
  .coin-price-section {
    text-align: left;
  }
  
  .external-link-btn {
    width: 100%;
    justify-content: center;
    padding: 14px 20px;
    font-size: 1rem;
  }
  
  .main-content-grid {
    grid-template-columns: 1fr;
    gap: 20px;
  }
  
  .analysis-stats {
    flex-direction: column;
    gap: 20px;
  }
  
  .wallet-table-container {
    font-size: 14px;
  }
}
</style>
