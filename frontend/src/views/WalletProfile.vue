<template>
  <div class="wallet-profile" v-if="wallet">
    <!-- Header -->
    <div class="wallet-header">
      <button @click="goBack" class="back-btn">
        ← Terug
      </button>
      
      <div class="wallet-title-section">
        <div class="wallet-basic-info">
          <div class="wallet-avatar">
            <span class="wallet-icon">👛</span>
          </div>
          <div>
            <h1 class="wallet-address-title">{{ shortenAddress(wallet.address) }}</h1>
            <div class="wallet-tags">
              <span v-for="tag in wallet.tags" :key="tag" class="wallet-tag">
                {{ tag }}
              </span>
            </div>
          </div>
        </div>
        
        <div class="wallet-score-section">
          <div class="ai-score-display">
            <span class="score-label">AI Score</span>
            <span class="score-value" :class="getAiScoreClass(wallet.aiScore)">
              {{ wallet.aiScore }}/100
            </span>
          </div>
          
          <div class="risk-score-display">
            <span class="score-label">Risk Score</span>
            <span class="score-value" :class="getRiskScoreClass(wallet.riskScore)">
              {{ wallet.riskScore.toFixed(1) }}/10
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Key Stats -->
    <div class="wallet-stats-grid">
      <div class="stat-card card">
        <div class="stat-icon text-success">💰</div>
        <div class="stat-content">
          <h3 class="stat-value text-success">${{ formatNumber(wallet.totalProfit) }}</h3>
          <p class="stat-label">Totale Winst</p>
        </div>
      </div>
      
      <div class="stat-card card">
        <div class="stat-icon text-danger">📉</div>
        <div class="stat-content">
          <h3 class="stat-value text-danger">${{ formatNumber(wallet.totalLoss) }}</h3>
          <p class="stat-label">Totale Verlies</p>
        </div>
      </div>
      
      <div class="stat-card card">
        <div class="stat-icon">🎯</div>
        <div class="stat-content">
          <h3 class="stat-value">{{ wallet.winRate.toFixed(1) }}%</h3>
          <p class="stat-label">Win Rate</p>
        </div>
      </div>
      
      <div class="stat-card card">
        <div class="stat-icon">📈</div>
        <div class="stat-content">
          <h3 class="stat-value">{{ wallet.averageROI.toFixed(1) }}%</h3>
          <p class="stat-label">Gemiddelde ROI</p>
        </div>
      </div>
      
      <div class="stat-card card">
        <div class="stat-icon">🪙</div>
        <div class="stat-content">
          <h3 class="stat-value">{{ wallet.totalCoins }}</h3>
          <p class="stat-label">Totaal Coins</p>
        </div>
      </div>
      
      <div class="stat-card card">
        <div class="stat-icon">⚡</div>
        <div class="stat-content">
          <h3 class="stat-value">{{ wallet.earlyEntryCoins }}</h3>
          <p class="stat-label">Vroege Entries</p>
        </div>
      </div>
    </div>

    <!-- Activity Timeline -->
    <div class="activity-section card">
      <h3 class="section-title">📅 Activiteit</h3>
      <div class="activity-timeline">
        <div class="activity-item">
          <span class="activity-label">Eerste Activiteit:</span>
          <span class="activity-value">{{ formatDate(wallet.firstActivity) }}</span>
        </div>
        <div class="activity-item">
          <span class="activity-label">Laatste Activiteit:</span>
          <span class="activity-value">{{ formatDate(wallet.lastActivity) }}</span>
        </div>
        <div class="activity-item">
          <span class="activity-label">Actieve Periode:</span>
          <span class="activity-value">{{ getActivePeriod() }} dagen</span>
        </div>
      </div>
    </div>

    <!-- Main Content Grid -->
    <div class="main-content-grid">
      <!-- Transactions -->
      <div class="transactions-section card">
        <h3 class="section-title">💳 Recente Transacties</h3>
        <div class="transactions-container">
          <div v-if="wallet.transactions.length === 0" class="empty-state">
            <p>Geen transacties gevonden</p>
          </div>
          <div v-else class="transactions-list">
            <div v-for="transaction in wallet.transactions" :key="transaction.id" 
                 class="transaction-item">
              <div class="transaction-header">
                <div class="transaction-coin">
                  <span class="coin-name">{{ transaction.coinName }}</span>
                  <span class="coin-symbol">{{ transaction.coinSymbol }}</span>
                </div>
                <div class="transaction-type">
                  <span :class="['type-badge', `type-${transaction.type}`]">
                    {{ transaction.type.toUpperCase() }}
                  </span>
                </div>
              </div>
              
              <div class="transaction-details">
                <div class="transaction-amount">
                  <span class="amount-label">Hoeveelheid:</span>
                  <span class="amount-value">{{ formatNumber(transaction.amount) }}</span>
                </div>
                <div class="transaction-price">
                  <span class="price-label">Prijs:</span>
                  <span class="price-value">${{ formatPrice(transaction.price) }}</span>
                </div>
                <div class="transaction-date">
                  <span class="date-label">Datum:</span>
                  <span class="date-value">{{ formatDate(transaction.timestamp) }}</span>
                </div>
              </div>
              
              <div v-if="transaction.profitLoss" class="transaction-profit">
                <span class="profit-label">P&L:</span>
                <span :class="['profit-value', transaction.profitLoss >= 0 ? 'text-success' : 'text-danger']">
                  {{ transaction.profitLoss >= 0 ? '+' : '' }}${{ formatNumber(Math.abs(transaction.profitLoss)) }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Linked Wallets -->
      <div class="linked-wallets-section card">
        <h3 class="section-title">🔗 Gekoppelde Wallets</h3>
        <div class="linked-wallets-container">
          <div v-if="wallet.linkedWallets.length === 0" class="empty-state">
            <p>Geen gekoppelde wallets gevonden</p>
          </div>
          <div v-else class="linked-wallets-list">
            <div v-for="linkedAddress in wallet.linkedWallets" :key="linkedAddress" 
                 class="linked-wallet-item" @click="navigateToWallet(linkedAddress)">
              <div class="linked-wallet-icon">🔗</div>
              <div class="linked-wallet-info">
                <span class="linked-address">{{ shortenAddress(linkedAddress) }}</span>
                <span class="linked-status">Gekoppeld via transactie patroon</span>
              </div>
              <div class="linked-wallet-arrow">→</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Performance Chart -->
    <div class="performance-section card">
      <h3 class="section-title">📊 Performance Overzicht</h3>
      <div class="performance-chart">
        <div class="chart-placeholder">
          <div class="performance-bars">
            <div class="performance-bar profit-bar" :style="{ height: `${Math.min(wallet.totalProfit / 1000, 100)}%` }">
              <span class="bar-label">Winst</span>
            </div>
            <div class="performance-bar loss-bar" :style="{ height: `${Math.min(wallet.totalLoss / 1000, 100)}%` }">
              <span class="bar-label">Verlies</span>
            </div>
          </div>
          <div class="chart-legend">
            <div class="legend-item">
              <span class="legend-color profit-color"></span>
              <span>Totale Winst</span>
            </div>
            <div class="legend-item">
              <span class="legend-color loss-color"></span>
              <span>Totale Verlies</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Actions -->
    <div class="wallet-actions">
      <button @click="addToWatchlist" class="btn btn-primary">
        ⭐ Toevoegen aan Watchlist
      </button>
      <button @click="copyAddress" class="btn btn-secondary">
        📋 Kopieer Adres
      </button>
    </div>
  </div>

  <!-- Loading/Error States -->
  <div v-else class="loading-state">
    <div class="loading-spinner">🔄</div>
    <p>Wallet gegevens laden...</p>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useWalletStore } from '../store/wallet'
import type { WalletProfile } from '../store/wallet'

const route = useRoute()
const router = useRouter()
const walletStore = useWalletStore()

const wallet = ref<WalletProfile | null>(null)

const formatNumber = (num: number): string => {
  if (num >= 1000000000) return (num / 1000000000).toFixed(1) + 'B'
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
  return num.toString()
}

const formatPrice = (price: number): string => {
  if (price < 0.001) return price.toFixed(6)
  if (price < 1) return price.toFixed(4)
  return price.toFixed(2)
}

const formatDate = (dateString: string): string => {
  const date = new Date(dateString)
  return date.toLocaleDateString('nl-NL', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const shortenAddress = (address: string): string => {
  if (!address) return ''
  if (address.length <= 10) return address
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

const getAiScoreClass = (score: number): string => {
  if (score >= 80) return 'score-high'
  if (score >= 60) return 'score-medium'
  return 'score-low'
}

const getRiskScoreClass = (score: number): string => {
  if (score <= 3) return 'risk-low'
  if (score <= 7) return 'risk-medium'
  return 'risk-high'
}

const getActivePeriod = (): number => {
  if (!wallet.value) return 0
  const first = new Date(wallet.value.firstActivity)
  const last = new Date(wallet.value.lastActivity)
  return Math.ceil((last.getTime() - first.getTime()) / (1000 * 60 * 60 * 24))
}

const goBack = () => {
  router.go(-1)
}

const navigateToWallet = (address: string) => {
  router.push(`/wallet/${address}`)
}

const addToWatchlist = () => {
  if (wallet.value) {
    walletStore.addWalletToWatch(wallet.value.address)
    // Show success notification
    alert('Wallet toegevoegd aan watchlist!')
  }
}

const copyAddress = () => {
  if (wallet.value) {
    navigator.clipboard.writeText(wallet.value.address)
    alert('Adres gekopieerd naar klembord!')
  }
}

onMounted(() => {
  const address = route.params.address as string
  wallet.value = walletStore.getWalletByAddress(address)
  
  if (wallet.value) {
    walletStore.setSelectedWallet(address)
  }
})
</script>

<style scoped>
.wallet-profile {
  max-width: 1400px;
  margin: 0 auto;
}

.wallet-header {
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

.wallet-title-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 30px;
}

.wallet-basic-info {
  display: flex;
  align-items: center;
  gap: 20px;
}

.wallet-avatar {
  width: 80px;
  height: 80px;
  background: linear-gradient(135deg, #00ff88, #00cc6a);
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.wallet-icon {
  font-size: 2rem;
  color: #000;
}

.wallet-address-title {
  font-size: 1.8rem;
  font-weight: 700;
  margin-bottom: 10px;
  color: #fff;
  font-family: monospace;
  word-break: break-all;
}

.wallet-tags {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.wallet-tag {
  background-color: #2a2a2a;
  color: #00ff88;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
}

.wallet-score-section {
  display: flex;
  gap: 30px;
}

.ai-score-display,
.risk-score-display {
  text-align: center;
}

.score-label {
  display: block;
  font-size: 14px;
  color: #888;
  margin-bottom: 8px;
}

.score-value {
  font-size: 1.5rem;
  font-weight: 700;
  padding: 8px 16px;
  border-radius: 8px;
}

.score-high {
  background-color: rgba(0, 255, 136, 0.2);
  color: #00ff88;
}

.score-medium {
  background-color: rgba(255, 165, 2, 0.2);
  color: #ffa502;
}

.score-low {
  background-color: rgba(255, 71, 87, 0.2);
  color: #ff4757;
}

.risk-low {
  background-color: rgba(0, 255, 136, 0.2);
  color: #00ff88;
}

.risk-medium {
  background-color: rgba(255, 165, 2, 0.2);
  color: #ffa502;
}

.risk-high {
  background-color: rgba(255, 71, 87, 0.2);
  color: #ff4757;
}

.wallet-stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
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
  font-size: 1.5rem;
  width: 50px;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #2a2a2a;
  border-radius: 10px;
}

.stat-content {
  flex: 1;
}

.stat-value {
  font-size: 1.3rem;
  font-weight: 700;
  margin-bottom: 5px;
  color: #fff;
}

.stat-label {
  color: #888;
  font-size: 0.9rem;
}

.activity-section {
  margin-bottom: 30px;
  padding: 25px;
}

.section-title {
  font-size: 1.3rem;
  font-weight: 600;
  margin-bottom: 20px;
  color: #fff;
}

.activity-timeline {
  display: flex;
  gap: 30px;
}

.activity-item {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.activity-label {
  font-size: 14px;
  color: #888;
}

.activity-value {
  font-size: 16px;
  font-weight: 600;
  color: #fff;
}

.main-content-grid {
  display: grid;
  grid-template-columns: 1fr 300px;
  gap: 30px;
  margin-bottom: 30px;
}

.transactions-section,
.linked-wallets-section {
  padding: 25px;
}

.transactions-container,
.linked-wallets-container {
  max-height: 400px;
  overflow-y: auto;
}

.empty-state {
  text-align: center;
  padding: 40px;
  color: #888;
}

.transactions-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.transaction-item {
  background-color: #0f0f0f;
  border-radius: 8px;
  padding: 15px;
  border: 1px solid #2a2a2a;
  transition: border-color 0.3s ease;
}

.transaction-item:hover {
  border-color: #00ff88;
}

.transaction-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.coin-name {
  font-weight: 600;
  color: #fff;
  margin-right: 8px;
}

.coin-symbol {
  color: #888;
  font-size: 14px;
}

.type-badge {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
}

.type-buy {
  background-color: rgba(0, 255, 136, 0.2);
  color: #00ff88;
}

.type-sell {
  background-color: rgba(255, 71, 87, 0.2);
  color: #ff4757;
}

.transaction-details {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 10px;
  margin-bottom: 10px;
  font-size: 14px;
}

.amount-label,
.price-label,
.date-label,
.profit-label {
  color: #888;
  margin-right: 5px;
}

.amount-value,
.price-value,
.date-value,
.profit-value {
  color: #fff;
  font-weight: 500;
}

.transaction-profit {
  padding-top: 10px;
  border-top: 1px solid #2a2a2a;
  font-size: 14px;
}

.linked-wallets-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.linked-wallet-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background-color: #0f0f0f;
  border-radius: 8px;
  border: 1px solid #2a2a2a;
  cursor: pointer;
  transition: all 0.3s ease;
}

.linked-wallet-item:hover {
  border-color: #00ff88;
  background-color: #1a1a1a;
}

.linked-wallet-icon {
  font-size: 1.2rem;
  color: #00ff88;
}

.linked-wallet-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.linked-address {
  font-family: monospace;
  font-size: 13px;
  color: #fff;
}

.linked-status {
  font-size: 11px;
  color: #888;
}

.linked-wallet-arrow {
  color: #888;
  font-size: 1.2rem;
}

.performance-section {
  margin-bottom: 30px;
  padding: 25px;
}

.performance-chart {
  height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.chart-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.performance-bars {
  display: flex;
  align-items: end;
  gap: 40px;
  height: 120px;
  margin-bottom: 20px;
}

.performance-bar {
  width: 60px;
  border-radius: 4px;
  position: relative;
  display: flex;
  align-items: end;
  justify-content: center;
  min-height: 20px;
}

.profit-bar {
  background: linear-gradient(to top, #00ff88, #00cc6a);
}

.loss-bar {
  background: linear-gradient(to top, #ff4757, #ff3838);
}

.bar-label {
  position: absolute;
  bottom: -20px;
  font-size: 12px;
  color: #888;
}

.chart-legend {
  display: flex;
  gap: 20px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #888;
}

.legend-color {
  width: 12px;
  height: 12px;
  border-radius: 2px;
}

.profit-color {
  background-color: #00ff88;
}

.loss-color {
  background-color: #ff4757;
}

.wallet-actions {
  display: flex;
  gap: 15px;
  justify-content: center;
  margin-top: 30px;
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
  .wallet-title-section {
    flex-direction: column;
    align-items: flex-start;
    gap: 20px;
  }
  
  .wallet-score-section {
    flex-direction: column;
    gap: 15px;
  }
  
  .wallet-stats-grid {
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 15px;
  }
  
  .activity-timeline {
    flex-direction: column;
    gap: 15px;
  }
  
  .main-content-grid {
    grid-template-columns: 1fr;
    gap: 20px;
  }
  
  .transaction-details {
    grid-template-columns: 1fr;
    gap: 5px;
  }
  
  .wallet-actions {
    flex-direction: column;
  }
}
</style>

