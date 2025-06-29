<template>
  <div class="history-page">
    <!-- Header -->
    <div class="history-header">
      <h1 class="page-title">📈 Signaal Historie</h1>
      <p class="page-subtitle">Overzicht van alle gedetecteerde coins en hun performance</p>
    </div>

    <!-- Performance Stats -->
    <div class="performance-stats-grid">
      <div class="stat-card card">
        <div class="stat-icon">🎯</div>
        <div class="stat-content">
          <h3 class="stat-value">{{ performanceStats.totalSignals }}</h3>
          <p class="stat-label">Totale Signalen</p>
        </div>
      </div>
      <div class="stat-card card">
        <div class="stat-icon">✅</div>
        <div class="stat-content">
          <h3 class="stat-value">{{ performanceStats.successRate }}%</h3>
          <p class="stat-label">Succes Ratio</p>
        </div>
      </div>
      <div class="stat-card card">
        <div class="stat-icon">🔍</div>
        <div class="stat-content">
          <h3 class="stat-value">{{ performanceStats.accuracy }}%</h3>
          <p class="stat-label">AI Accuraatheid</p>
        </div>
      </div>
      <div class="stat-card card">
        <div class="stat-icon">💰</div>
        <div class="stat-content">
          <h3 class="stat-value">+{{ performanceStats.averageGain }}%</h3>
          <p class="stat-label">Gemiddelde Winst</p>
        </div>
      </div>
    </div>

    <!-- Performance Chart -->
    <div class="performance-chart-section card">
      <h3 class="section-title">📊 Performance Trend</h3>
      <div class="chart-container">
        <div class="chart-placeholder">
          <div class="trend-line">
            <div v-for="(point, index) in chartData" :key="index" 
                 class="data-point"
                 :style="{ 
                   left: `${(index / (chartData.length - 1)) * 100}%`,
                   bottom: `${point.value}%`
                 }">
            </div>
          </div>
          <div class="chart-labels">
            <span>Jan</span>
            <span>Feb</span>
            <span>Mar</span>
            <span>Apr</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Filters -->
    <div class="filters-section card">
      <h3 class="filters-title">🔍 Filters</h3>
      <div class="filters-grid">
        <div class="filter-group">
          <label class="filter-label">Periode</label>
          <select v-model="selectedPeriod" @change="updateFilter" class="filter-select">
            <option value="all">Alle tijd</option>
            <option value="30">Laatste 30 dagen</option>
            <option value="7">Laatste 7 dagen</option>
            <option value="1">Vandaag</option>
          </select>
        </div>
        
        <div class="filter-group">
          <label class="filter-label">Status</label>
          <select v-model="selectedStatus" @change="updateFilter" class="filter-select">
            <option value="all">Alle Status</option>
            <option value="success">Succesvol</option>
            <option value="failed">Gefaald</option>
            <option value="pending">In Behandeling</option>
          </select>
        </div>
        
        <div class="filter-group">
          <label class="filter-label">Blockchain</label>
          <select v-model="selectedBlockchain" @change="updateFilter" class="filter-select">
            <option value="all">Alle Blockchains</option>
            <option value="Ethereum">Ethereum</option>
            <option value="Solana">Solana</option>
            <option value="BTC">Bitcoin</option>
          </select>
        </div>
      </div>
    </div>

    <!-- History Table -->
    <div class="history-table-section card">
      <h3 class="section-title">📋 Signaal Historie</h3>
      <div class="table-container">
        <table class="history-table">
          <thead>
            <tr>
              <th>Datum</th>
              <th>Coin</th>
              <th>Blockchain</th>
              <th>AI Score</th>
              <th>Prijs (Start)</th>
              <th>Huidige Prijs</th>
              <th>Verandering</th>
              <th>Status</th>
              <th>Acties</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="signal in filteredSignals" :key="signal.id" class="signal-row">
              <td class="date-cell">{{ formatDate(signal.detectedAt) }}</td>
              <td class="coin-cell">
                <div class="coin-info">
                  <span class="coin-logo">{{ signal.coinLogo }}</span>
                  <div>
                    <span class="coin-name">{{ signal.coinName }}</span>
                    <span class="coin-symbol">{{ signal.coinSymbol }}</span>
                  </div>
                </div>
              </td>
              <td>
                <span class="blockchain-badge" :class="`blockchain-${signal.blockchain.toLowerCase()}`">
                  {{ signal.blockchain }}
                </span>
              </td>
              <td>
                <span class="ai-score-badge" :class="getAiScoreClass(signal.aiScore)">
                  {{ signal.aiScore }}
                </span>
              </td>
              <td class="price-cell">${{ formatPrice(signal.initialPrice) }}</td>
              <td class="price-cell">${{ formatPrice(signal.currentPrice) }}</td>
              <td class="change-cell">
                <span :class="getPriceChangeClass(signal.priceChange)">
                  {{ signal.priceChange > 0 ? '+' : '' }}{{ signal.priceChange.toFixed(1) }}%
                </span>
              </td>
              <td class="status-cell">
                <span :class="['status-badge', `status-${signal.status}`]">
                  {{ getStatusText(signal.status) }}
                </span>
              </td>
              <td class="actions-cell">
                <button @click="viewCoinDetail(signal.coinId)" class="action-btn view-btn">
                  👁️ Bekijk
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      
      <!-- Empty State -->
      <div v-if="filteredSignals.length === 0" class="empty-state">
        <div class="empty-icon">📊</div>
        <h3>Geen signalen gevonden</h3>
        <p>Pas je filters aan om meer resultaten te krijgen.</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

// Reactive data
const selectedPeriod = ref('all')
const selectedStatus = ref('all')
const selectedBlockchain = ref('all')

// Mock signal data
interface SignalHistory {
  id: string
  detectedAt: string
  coinId: string
  coinName: string
  coinSymbol: string
  coinLogo: string
  blockchain: 'Ethereum' | 'Solana' | 'BTC'
  aiScore: number
  initialPrice: number
  currentPrice: number
  priceChange: number
  status: 'success' | 'failed' | 'pending'
}

const signals = ref<SignalHistory[]>([
  {
    id: '1',
    detectedAt: '2024-01-15T10:30:00Z',
    coinId: '1',
    coinName: 'SafeMoon Pro',
    coinSymbol: 'SMPRO',
    coinLogo: '🚀',
    blockchain: 'Ethereum',
    aiScore: 85,
    initialPrice: 0.00045,
    currentPrice: 0.00089,
    priceChange: 97.8,
    status: 'success'
  },
  {
    id: '2',
    detectedAt: '2024-01-14T15:20:00Z',
    coinId: '2',
    coinName: 'CryptoGem',
    coinSymbol: 'CGEM',
    coinLogo: '💎',
    blockchain: 'Solana',
    aiScore: 72,
    initialPrice: 0.0078,
    currentPrice: 0.0156,
    priceChange: 100,
    status: 'success'
  },
  {
    id: '3',
    detectedAt: '2024-01-13T09:15:00Z',
    coinId: '3',
    coinName: 'MoonShot',
    coinSymbol: 'MOON',
    coinLogo: '🌙',
    blockchain: 'BTC',
    aiScore: 58,
    initialPrice: 0.00234,
    currentPrice: 0.00198,
    priceChange: -15.4,
    status: 'failed'
  },
  {
    id: '4',
    detectedAt: '2024-01-12T14:45:00Z',
    coinId: '4',
    coinName: 'DefiKing',
    coinSymbol: 'DKING',
    coinLogo: '👑',
    blockchain: 'Ethereum',
    aiScore: 91,
    initialPrice: 0.0125,
    currentPrice: 0.0189,
    priceChange: 51.2,
    status: 'success'
  },
  {
    id: '5',
    detectedAt: '2024-01-11T11:30:00Z',
    coinId: '5',
    coinName: 'MetaToken',
    coinSymbol: 'META',
    coinLogo: '🔮',
    blockchain: 'Solana',
    aiScore: 67,
    initialPrice: 0.0089,
    currentPrice: 0.0089,
    priceChange: 0,
    status: 'pending'
  }
])

// Chart data for performance trend
const chartData = ref([
  { label: 'Jan', value: 20 },
  { label: 'Feb', value: 45 },
  { label: 'Mar', value: 65 },
  { label: 'Apr', value: 78 }
])

// Computed properties
const filteredSignals = computed(() => {
  return signals.value.filter(signal => {
    const matchesPeriod = selectedPeriod.value === 'all' || 
      (selectedPeriod.value === '1' && isWithinDays(signal.detectedAt, 1)) ||
      (selectedPeriod.value === '7' && isWithinDays(signal.detectedAt, 7)) ||
      (selectedPeriod.value === '30' && isWithinDays(signal.detectedAt, 30))
    
    const matchesStatus = selectedStatus.value === 'all' || signal.status === selectedStatus.value
    const matchesBlockchain = selectedBlockchain.value === 'all' || signal.blockchain === selectedBlockchain.value
    
    return matchesPeriod && matchesStatus && matchesBlockchain
  })
})

const performanceStats = computed(() => {
  const total = signals.value.length
  const successful = signals.value.filter(s => s.status === 'success').length
  const totalGain = signals.value.reduce((sum, s) => sum + (s.status === 'success' ? s.priceChange : 0), 0)
  
  return {
    totalSignals: total,
    successRate: total > 0 ? Math.round((successful / total) * 100) : 0,
    accuracy: 87, // Mock accuracy
    averageGain: successful > 0 ? Math.round(totalGain / successful) : 0
  }
})

// Helper functions
const isWithinDays = (dateString: string, days: number): boolean => {
  const date = new Date(dateString)
  const now = new Date()
  const diffTime = Math.abs(now.getTime() - date.getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return diffDays <= days
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

const formatPrice = (price: number): string => {
  if (price < 0.001) return price.toFixed(6)
  if (price < 1) return price.toFixed(4)
  return price.toFixed(2)
}

const getAiScoreClass = (score: number): string => {
  if (score >= 80) return 'score-high'
  if (score >= 60) return 'score-medium'
  return 'score-low'
}

const getPriceChangeClass = (change: number): string => {
  return change >= 0 ? 'text-success' : 'text-danger'
}

const getStatusText = (status: string): string => {
  switch (status) {
    case 'success': return 'Succesvol'
    case 'failed': return 'Gefaald'
    case 'pending': return 'In Behandeling'
    default: return status
  }
}

const updateFilter = () => {
  // Filtering is handled by computed property
}

const viewCoinDetail = (coinId: string) => {
  router.push(`/coin/${coinId}`)
}

onMounted(() => {
  console.log('History page loaded with', signals.value.length, 'signals')
})
</script>

<style scoped>
.history-page {
  max-width: 1400px;
  margin: 0 auto;
  padding: 20px;
}

.history-header {
  margin-bottom: 30px;
}

.page-title {
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 8px;
  color: #fff;
}

.page-subtitle {
  color: #888;
  font-size: 1.1rem;
}

.performance-stats-grid {
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
  font-size: 2rem;
  padding: 12px;
  background: linear-gradient(135deg, #00ff88, #00cc6a);
  border-radius: 12px;
  color: #000;
}

.stat-content {
  flex: 1;
}

.stat-value {
  font-size: 1.8rem;
  font-weight: 700;
  margin-bottom: 4px;
  color: #00ff88;
}

.stat-label {
  color: #888;
  font-size: 0.9rem;
}

.performance-chart-section {
  margin-bottom: 30px;
  padding: 25px;
}

.section-title {
  font-size: 1.3rem;
  font-weight: 600;
  margin-bottom: 20px;
  color: #fff;
}

.chart-container {
  height: 200px;
  position: relative;
}

.chart-placeholder {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #1a1a1a, #2a2a2a);
  border-radius: 8px;
  position: relative;
  overflow: hidden;
}

.trend-line {
  position: absolute;
  top: 20px;
  left: 20px;
  right: 20px;
  bottom: 40px;
}

.data-point {
  position: absolute;
  width: 8px;
  height: 8px;
  background: #00ff88;
  border-radius: 50%;
  transform: translate(-50%, 50%);
}

.chart-labels {
  position: absolute;
  bottom: 10px;
  left: 20px;
  right: 20px;
  display: flex;
  justify-content: space-between;
  color: #888;
  font-size: 0.8rem;
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
  font-weight: 500;
  color: #ccc;
}

.filter-select {
  background: #2a2a2a;
  border: 1px solid #444;
  border-radius: 6px;
  padding: 10px 12px;
  color: #fff;
  font-size: 0.9rem;
}

.filter-select:focus {
  outline: none;
  border-color: #00ff88;
}

.history-table-section {
  padding: 25px;
}

.table-container {
  overflow-x: auto;
}

.history-table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 20px;
}

.history-table th {
  background: #2a2a2a;
  color: #ccc;
  font-weight: 600;
  font-size: 0.9rem;
  padding: 15px 12px;
  text-align: left;
  border-bottom: 2px solid #444;
}

.history-table td {
  padding: 15px 12px;
  border-bottom: 1px solid #333;
  color: #fff;
}

.signal-row:hover {
  background: rgba(0, 255, 136, 0.05);
}

.coin-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.coin-logo {
  font-size: 1.5rem;
}

.coin-name {
  font-weight: 600;
  display: block;
}

.coin-symbol {
  font-size: 0.8rem;
  color: #888;
}

.blockchain-badge {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: 500;
}

.blockchain-ethereum {
  background: rgba(98, 126, 234, 0.2);
  color: #627eea;
}

.blockchain-solana {
  background: rgba(220, 31, 255, 0.2);
  color: #dc1fff;
}

.blockchain-btc {
  background: rgba(247, 147, 26, 0.2);
  color: #f7931a;
}

.ai-score-badge {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 4px;
  font-weight: 600;
  font-size: 0.8rem;
}

.score-high {
  background: rgba(0, 255, 136, 0.2);
  color: #00ff88;
}

.score-medium {
  background: rgba(255, 193, 7, 0.2);
  color: #ffc107;
}

.score-low {
  background: rgba(220, 53, 69, 0.2);
  color: #dc3545;
}

.text-success {
  color: #00ff88;
  font-weight: 600;
}

.text-danger {
  color: #ff4757;
  font-weight: 600;
}

.status-badge {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: 500;
}

.status-success {
  background: rgba(0, 255, 136, 0.2);
  color: #00ff88;
}

.status-failed {
  background: rgba(255, 71, 87, 0.2);
  color: #ff4757;
}

.status-pending {
  background: rgba(255, 193, 7, 0.2);
  color: #ffc107;
}

.action-btn {
  background: #00ff88;
  color: #000;
  border: none;
  padding: 6px 12px;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.action-btn:hover {
  background: #00cc6a;
  transform: translateY(-1px);
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #888;
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: 20px;
}

.empty-state h3 {
  font-size: 1.5rem;
  margin-bottom: 10px;
  color: #fff;
}

.card {
  background: linear-gradient(135deg, #1a1a1a, #2a2a2a);
  border: 1px solid #333;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
}
</style>
