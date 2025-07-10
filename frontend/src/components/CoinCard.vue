<script setup lang="ts">
import { useRouter } from 'vue-router'
import type { Coin } from '../store/coin'

interface Props {
  coin: Coin
}

const props = defineProps<Props>()
const router = useRouter()

const navigateToCoin = () => {
  router.push(`/coin/${props.coin.id}`)
}

const formatPrice = (price: number): string => {
  if (price < 0.001) {
    return price.toFixed(6)
  } else if (price < 1) {
    return price.toFixed(4)
  } else {
    return price.toFixed(2)
  }
}

const formatNumber = (num: number): string => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M'
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K'
  }
  return num.toString()
}

const formatDate = (dateString: string): string => {
  const date = new Date(dateString)
  return date.toLocaleDateString('nl-NL')
}

const getAiScoreClass = (score: number): string => {
  if (score >= 80) return 'score-high'
  if (score >= 60) return 'score-medium'
  return 'score-low'
}

const getPriceChangeClass = (change: number): string => {
  return change >= 0 ? 'text-success' : 'text-danger'
}
</script>

<template>
  <div class="coin-card card" @click="navigateToCoin">
    <div class="coin-header">
      <div class="coin-info">
        <!-- <span class="coin-logo">{{ coin.logo }}</span> -->
        <div>
          <h3 class="coin-name">{{ coin.name }}</h3>
          <span class="coin-symbol">{{ coin.symbol }}</span>
        </div>
      </div>
      <div class="ai-score">
        <span class="ai-score-label">AI Score</span>
        <span class="ai-score-value" :class="getAiScoreClass(coin.aiScore)">
          {{ coin.aiScore }}
        </span>
      </div>
    </div>

    <div class="coin-stats">
      <div class="stat">
        <span class="stat-label">Prijs</span>
        <span class="stat-value">${{ formatPrice(coin.currentPrice) }}</span>
      </div>
      <!-- Toon 24h change voor DexScreener tokens -->
      <div class="stat" v-if="!coin.externalUrl || !coin.externalUrl.includes('pump.fun')">
        <span class="stat-label">24h</span>
        <span class="stat-value" :class="getPriceChangeClass(coin.priceChange24h)">
          {{ coin.priceChange24h > 0 ? '+' : '' }}{{ coin.priceChange24h.toFixed(1) }}%
        </span>
      </div>
      <!-- Voor Pump.fun tokens, toon 1m change -->
      <div class="stat" v-if="coin.externalUrl && coin.externalUrl.includes('pump.fun')">
        <span class="stat-label">1m</span>
        <span class="stat-value" :class="getPriceChangeClass(coin.priceChangePerMinute || 0)">
          {{ (coin.priceChangePerMinute || 0) > 0 ? '+' : '' }}{{ (coin.priceChangePerMinute || 0).toFixed(1) }}%
        </span>
      </div>
    </div>

    <div class="coin-details">
      <div class="detail">
        <span class="detail-label">Blockchain:</span>
        <span class="blockchain-badge" :class="`blockchain-${coin.blockchain.toLowerCase()}`">
          {{ coin.blockchain }}
        </span>
      </div>
      <div class="detail">
        <span class="detail-label">Launch:</span>
        <span class="detail-value">{{ formatDate(coin.launchDate) }}</span>
      </div>
      <div class="detail">
        <span class="detail-label">Market Cap:</span>
        <span class="detail-value">${{ formatNumber(coin.marketCap) }}</span>
      </div>
    </div>

    <div class="coin-footer">
      <!-- Toon holders alleen voor DexScreener tokens (Pump.fun heeft geen holder data) -->
      <div class="holders-count" v-if="!coin.externalUrl || !coin.externalUrl.includes('pump.fun')">
        👥 {{ formatNumber(coin.holders) }} holders
      </div>
      <!-- Voor Pump.fun tokens, toon volume info (als beschikbaar) -->
      <div class="volume-info" v-if="coin.externalUrl && coin.externalUrl.includes('pump.fun')">
        <span class="volume-label">Volume: N/A</span>
      </div>
      <div class="footer-actions">
        <div class="new-launch-badge" v-if="coin.isNewLaunch">
          ✨ NIEUW
        </div>
        <!-- Pump.fun button - alleen tonen als het een Pump.fun token is -->
        <a 
          v-if="coin.externalUrl && coin.externalUrl.includes('pump.fun')" 
          :href="coin.externalUrl" 
          target="_blank" 
          rel="noopener noreferrer"
          class="pump-fun-button"
          @click.stop
        >
          🚀 Pump.fun
        </a>
      </div>
    </div>
  </div>
</template>

<style scoped>
.coin-card {
  cursor: pointer;
  transition: all 0.3s ease;
  min-height: 280px;
  display: flex;
  flex-direction: column;
}

.coin-card:hover {
  transform: translateY(-2px);
  border-color: #00ff88;
  box-shadow: 0 8px 25px rgba(0, 255, 136, 0.15);
}

.coin-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
}

.coin-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.coin-logo {
  font-size: 32px;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #2a2a2a;
  border-radius: 12px;
}

.coin-name {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 4px;
  color: #fff;
}

.coin-symbol {
  font-size: 14px;
  color: #888;
  font-weight: 500;
}

.ai-score {
  text-align: right;
}

.ai-score-label {
  display: block;
  font-size: 12px;
  color: #666;
  margin-bottom: 4px;
}

.ai-score-value {
  font-size: 20px;
  font-weight: 700;
  padding: 4px 8px;
  border-radius: 6px;
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

.coin-stats {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
  margin-bottom: 20px;
  padding: 15px;
  background-color: #0f0f0f;
  border-radius: 8px;
}

.stat {
  text-align: center;
}

.stat-label {
  display: block;
  font-size: 12px;
  color: #666;
  margin-bottom: 4px;
}

.stat-value {
  font-size: 16px;
  font-weight: 600;
}

.coin-details {
  flex: 1;
  margin-bottom: 15px;
}

.detail {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.detail-label {
  font-size: 13px;
  color: #888;
}

.detail-value {
  font-size: 13px;
  color: #fff;
  font-weight: 500;
}

.blockchain-badge {
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
}

.blockchain-ethereum {
  background-color: rgba(98, 126, 234, 0.2);
  color: #627eea;
}

.blockchain-solana {
  background-color: rgba(220, 31, 255, 0.2);
  color: #dc1fff;
}

.blockchain-btc {
  background-color: rgba(247, 147, 26, 0.2);
  color: #f7931a;
}

.coin-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 15px;
  border-top: 1px solid #2a2a2a;
}

.holders-count {
  font-size: 12px;
  color: #666;
}

.volume-info {
  font-size: 12px;
  color: #666;
}

.volume-label {
  font-style: italic;
  opacity: 0.7;
}

.footer-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

.new-launch-badge {
  background: linear-gradient(45deg, #00ff88, #00cc6a);
  color: #000;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
}

.pump-fun-button {
  background: linear-gradient(45deg, #dc1fff, #a855f7);
  color: #fff;
  padding: 6px 12px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
  text-decoration: none;
  transition: all 0.3s ease;
  border: none;
  cursor: pointer;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.pump-fun-button:hover {
  background: linear-gradient(45deg, #a855f7, #dc1fff);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(220, 31, 255, 0.3);
}
</style>
