<template>
  <div class="crypto-chart">
    <!-- Chart Header -->
    <div class="chart-header">
      <div class="chart-title">
        <h3 class="coin-name">{{ coinData.name }} ({{ coinData.symbol }})</h3>
        <div class="price-info">
          <span class="current-price">${{ formatPrice(coinData.currentPrice) }}</span>
          <span class="price-change" :class="getPriceChangeClass(coinData.priceChange24h)">
            {{ coinData.priceChange24h > 0 ? '+' : '' }}{{ coinData.priceChange24h.toFixed(2) }}%
          </span>
        </div>
      </div>
      
      <!-- Timeframe Selector -->
      <div class="timeframe-selector">
        <button 
          v-for="timeframe in timeframes" 
          :key="timeframe.value"
          @click="selectedTimeframe = timeframe.value"
          :class="['timeframe-btn', { active: selectedTimeframe === timeframe.value }]"
        >
          {{ timeframe.label }}
        </button>
      </div>
    </div>

    <!-- Chart Controls -->
    <div class="chart-controls">
      <div class="chart-type-toggle">
        <button 
          @click="chartType = 'price'"
          :class="['toggle-btn', { active: chartType === 'price' }]"
        >
          📈 Prijs
        </button>
        <button 
          @click="chartType = 'volume'"
          :class="['toggle-btn', { active: chartType === 'volume' }]"
        >
          📊 Volume
        </button>
      </div>
      
      <div class="chart-info">
        <span class="market-cap">Market Cap: ${{ formatNumber(coinData.marketCap) }}</span>
        <span class="volume-24h">24h Volume: ${{ formatNumber(coinData.volume24h) }}</span>
      </div>
    </div>

    <!-- Main Chart Container -->
    <div class="chart-container" ref="chartContainer">
      <div class="chart-wrapper">
        <!-- Price Chart -->
        <svg 
          v-if="chartType === 'price'"
          class="price-chart" 
          :width="chartWidth" 
          :height="chartHeight"
          @mousemove="handleMouseMove"
          @mouseleave="hideTooltip"
        >
          <!-- Grid Lines -->
          <g class="grid-lines">
            <line 
              v-for="i in 5" 
              :key="`h-${i}`"
              :x1="padding.left" 
              :y1="padding.top + ((chartHeight - padding.top - padding.bottom) / 4) * (i - 1)"
              :x2="chartWidth - padding.right"
              :y2="padding.top + ((chartHeight - padding.top - padding.bottom) / 4) * (i - 1)"
              class="grid-line"
            />
            <line 
              v-for="i in 6" 
              :key="`v-${i}`"
              :x1="padding.left + ((chartWidth - padding.left - padding.right) / 5) * (i - 1)"
              :y1="padding.top"
              :x2="padding.left + ((chartWidth - padding.left - padding.right) / 5) * (i - 1)"
              :y2="chartHeight - padding.bottom"
              class="grid-line"
            />
          </g>

          <!-- Price Line -->
          <path 
            :d="pricePath" 
            class="price-line"
            fill="none"
            stroke="url(#priceGradient)"
            stroke-width="2"
          />

          <!-- Area Fill -->
          <path 
            :d="priceAreaPath" 
            fill="url(#areaGradient)"
            opacity="0.3"
          />

          <!-- Data Points -->
          <circle
            v-for="(point, index) in visiblePriceData"
            :key="`point-${index}`"
            :cx="getX(index)"
            :cy="getY(point.price)"
            r="3"
            class="data-point"
            @mouseenter="showTooltip($event, point, index)"
          />

          <!-- Gradients -->
          <defs>
            <linearGradient id="priceGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" style="stop-color:#00ff88;stop-opacity:1" />
              <stop offset="100%" style="stop-color:#00cc6a;stop-opacity:1" />
            </linearGradient>
            <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" style="stop-color:#00ff88;stop-opacity:0.3" />
              <stop offset="100%" style="stop-color:#00ff88;stop-opacity:0" />
            </linearGradient>
          </defs>

          <!-- Y-Axis Labels -->
          <g class="y-axis-labels">
            <text 
              v-for="(label, index) in priceLabels" 
              :key="`price-label-${index}`"
              :x="padding.left - 10" 
              :y="padding.top + ((chartHeight - padding.top - padding.bottom) / 4) * index + 5"
              class="axis-label"
              text-anchor="end"
            >
              ${{ label }}
            </text>
          </g>

          <!-- X-Axis Labels -->
          <g class="x-axis-labels">
            <text 
              v-for="(label, index) in timeLabels" 
              :key="`time-label-${index}`"
              :x="padding.left + ((chartWidth - padding.left - padding.right) / 5) * index"
              :y="chartHeight - padding.bottom + 20"
              class="axis-label"
              text-anchor="middle"
            >
              {{ label }}
            </text>
          </g>
        </svg>

        <!-- Volume Chart -->
        <svg 
          v-if="chartType === 'volume'"
          class="volume-chart" 
          :width="chartWidth" 
          :height="chartHeight"
        >
          <!-- Volume Bars -->
          <rect
            v-for="(point, index) in visibleVolumeData"
            :key="`volume-${index}`"
            :x="getX(index) - (barWidth / 2)"
            :y="getVolumeY(point.volume)"
            :width="barWidth"
            :height="chartHeight - padding.bottom - getVolumeY(point.volume)"
            class="volume-bar"
          />

          <!-- Y-Axis Labels -->
          <g class="y-axis-labels">
            <text 
              v-for="(label, index) in volumeLabels" 
              :key="`volume-label-${index}`"
              :x="padding.left - 10" 
              :y="padding.top + ((chartHeight - padding.top - padding.bottom) / 4) * index + 5"
              class="axis-label"
              text-anchor="end"
            >
              {{ formatNumber(label) }}
            </text>
          </g>
        </svg>
      </div>

      <!-- Tooltip -->
      <div 
        v-if="tooltip.visible" 
        class="chart-tooltip"
        :style="{ left: tooltip.x + 'px', top: tooltip.y + 'px' }"
      >
        <div class="tooltip-title">{{ tooltip.title }}</div>
        <div class="tooltip-price">Prijs: ${{ tooltip.price }}</div>
        <div class="tooltip-volume">Volume: ${{ formatNumber(tooltip.volume) }}</div>
        <div class="tooltip-time">{{ tooltip.time }}</div>
      </div>
    </div>

    <!-- Chart Stats -->
    <div class="chart-stats">
      <div class="stat-item">
        <span class="stat-label">24h High</span>
        <span class="stat-value">${{ formatPrice(stats.high24h) }}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">24h Low</span>
        <span class="stat-value">${{ formatPrice(stats.low24h) }}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">24h Range</span>
        <span class="stat-value">{{ ((stats.high24h - stats.low24h) / stats.low24h * 100).toFixed(1) }}%</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">Avg Volume</span>
        <span class="stat-value">${{ formatNumber(stats.avgVolume) }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'

// Props
interface CoinData {
  name: string
  symbol: string
  currentPrice: number
  priceChange24h: number
  marketCap: number
  volume24h: number
  priceHistory?: Array<{ timestamp: number; price: number; volume: number }>
}

const props = defineProps<{
  coinData: CoinData
}>()

// Reactive data
const selectedTimeframe = ref('1D')
const chartType = ref<'price' | 'volume'>('price')
const chartContainer = ref<HTMLElement>()
const chartWidth = ref(800)
const chartHeight = ref(400)

const padding = {
  top: 20,
  right: 20,
  bottom: 40,
  left: 60
}

const tooltip = ref({
  visible: false,
  x: 0,
  y: 0,
  title: '',
  price: '',
  volume: 0,
  time: ''
})

// Timeframe options
const timeframes = [
  { label: '1H', value: '1H' },
  { label: '4H', value: '4H' },
  { label: '1D', value: '1D' },
  { label: '1W', value: '1W' },
  { label: '1M', value: '1M' }
]

// Mock price data generator
const generateMockData = (timeframe: string) => {
  const now = Date.now()
  const intervals = {
    '1H': { count: 60, interval: 60 * 1000 },
    '4H': { count: 48, interval: 4 * 60 * 60 * 1000 },
    '1D': { count: 24, interval: 60 * 60 * 1000 },
    '1W': { count: 7, interval: 24 * 60 * 60 * 1000 },
    '1M': { count: 30, interval: 24 * 60 * 60 * 1000 }
  }
  
  const config = intervals[timeframe as keyof typeof intervals] || intervals['1D']
  const data = []
  
  for (let i = config.count - 1; i >= 0; i--) {
    const timestamp = now - (i * config.interval)
    const variation = (Math.random() - 0.5) * 0.1
    const price = props.coinData.currentPrice * (1 + variation)
    const volume = Math.random() * props.coinData.volume24h * 2
    
    data.push({ timestamp, price, volume })
  }
  
  return data
}

// Computed properties
const visiblePriceData = computed(() => {
  if (props.coinData.priceHistory) {
    return props.coinData.priceHistory
  }
  return generateMockData(selectedTimeframe.value)
})

const visibleVolumeData = computed(() => visiblePriceData.value)

const priceRange = computed(() => {
  const prices = visiblePriceData.value.map(d => d.price)
  return {
    min: Math.min(...prices),
    max: Math.max(...prices)
  }
})

const volumeRange = computed(() => {
  const volumes = visibleVolumeData.value.map(d => d.volume)
  return {
    min: 0,
    max: Math.max(...volumes)
  }
})

const barWidth = computed(() => {
  const availableWidth = chartWidth.value - padding.left - padding.right
  return Math.max(2, availableWidth / visibleVolumeData.value.length - 2)
})

const pricePath = computed(() => {
  if (visiblePriceData.value.length === 0) return ''
  
  let path = `M ${getX(0)} ${getY(visiblePriceData.value[0].price)}`
  
  for (let i = 1; i < visiblePriceData.value.length; i++) {
    path += ` L ${getX(i)} ${getY(visiblePriceData.value[i].price)}`
  }
  
  return path
})

const priceAreaPath = computed(() => {
  if (visiblePriceData.value.length === 0) return ''
  
  let path = `M ${getX(0)} ${chartHeight.value - padding.bottom}`
  path += ` L ${getX(0)} ${getY(visiblePriceData.value[0].price)}`
  
  for (let i = 1; i < visiblePriceData.value.length; i++) {
    path += ` L ${getX(i)} ${getY(visiblePriceData.value[i].price)}`
  }
  
  path += ` L ${getX(visiblePriceData.value.length - 1)} ${chartHeight.value - padding.bottom}`
  path += ' Z'
  
  return path
})

const priceLabels = computed(() => {
  const { min, max } = priceRange.value
  const step = (max - min) / 4
  return [
    formatPrice(max),
    formatPrice(max - step),
    formatPrice(max - 2 * step),
    formatPrice(max - 3 * step),
    formatPrice(min)
  ]
})

const volumeLabels = computed(() => {
  const { max } = volumeRange.value
  const step = max / 4
  return [max, max - step, max - 2 * step, max - 3 * step, 0]
})

const timeLabels = computed(() => {
  const dataLength = visiblePriceData.value.length
  const step = Math.floor(dataLength / 5)
  const labels = []
  
  for (let i = 0; i < 6; i++) {
    const index = Math.min(i * step, dataLength - 1)
    const point = visiblePriceData.value[index]
    if (point) {
      labels.push(formatTime(point.timestamp))
    }
  }
  
  return labels
})

const stats = computed(() => {
  const prices = visiblePriceData.value.map(d => d.price)
  const volumes = visibleVolumeData.value.map(d => d.volume)
  
  return {
    high24h: Math.max(...prices),
    low24h: Math.min(...prices),
    avgVolume: volumes.reduce((sum, vol) => sum + vol, 0) / volumes.length
  }
})

// Methods
const getX = (index: number): number => {
  const availableWidth = chartWidth.value - padding.left - padding.right
  return padding.left + (index / (visiblePriceData.value.length - 1)) * availableWidth
}

const getY = (price: number): number => {
  const { min, max } = priceRange.value
  const availableHeight = chartHeight.value - padding.top - padding.bottom
  const ratio = (price - min) / (max - min)
  return chartHeight.value - padding.bottom - (ratio * availableHeight)
}

const getVolumeY = (volume: number): number => {
  const { max } = volumeRange.value
  const availableHeight = chartHeight.value - padding.top - padding.bottom
  const ratio = volume / max
  return chartHeight.value - padding.bottom - (ratio * availableHeight)
}

const formatPrice = (price: number): string => {
  if (price < 0.001) return price.toFixed(6)
  if (price < 1) return price.toFixed(4)
  return price.toFixed(2)
}

const formatNumber = (num: number): string => {
  if (num >= 1000000000) return (num / 1000000000).toFixed(1) + 'B'
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
  return num.toFixed(0)
}

const formatTime = (timestamp: number): string => {
  const date = new Date(timestamp)
  
  if (selectedTimeframe.value === '1H' || selectedTimeframe.value === '4H') {
    return date.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })
  } else if (selectedTimeframe.value === '1D') {
    return date.toLocaleTimeString('nl-NL', { hour: '2-digit' }) + 'h'
  } else {
    return date.toLocaleDateString('nl-NL', { month: 'short', day: 'numeric' })
  }
}

const getPriceChangeClass = (change: number): string => {
  return change >= 0 ? 'positive' : 'negative'
}

const handleMouseMove = (event: MouseEvent) => {
  const rect = chartContainer.value?.getBoundingClientRect()
  if (!rect) return
  
  const x = event.clientX - rect.left
  const dataIndex = Math.round((x - padding.left) / (chartWidth.value - padding.left - padding.right) * (visiblePriceData.value.length - 1))
  
  if (dataIndex >= 0 && dataIndex < visiblePriceData.value.length) {
    const point = visiblePriceData.value[dataIndex]
    showTooltip(event, point, dataIndex)
  }
}

const showTooltip = (event: MouseEvent, point: { timestamp: number; price: number; volume: number }, index: number) => {
  const rect = chartContainer.value?.getBoundingClientRect()
  if (!rect) return
  
  tooltip.value = {
    visible: true,
    x: event.clientX - rect.left + 10,
    y: event.clientY - rect.top - 10,
    title: props.coinData.name,
    price: formatPrice(point.price),
    volume: point.volume,
    time: new Date(point.timestamp).toLocaleString('nl-NL')
  }
}

const hideTooltip = () => {
  tooltip.value.visible = false
}

const updateChartSize = () => {
  nextTick(() => {
    if (chartContainer.value) {
      const rect = chartContainer.value.getBoundingClientRect()
      chartWidth.value = Math.max(400, rect.width)
      chartHeight.value = 400
    }
  })
}

// Lifecycle
onMounted(() => {
  updateChartSize()
  window.addEventListener('resize', updateChartSize)
})

onUnmounted(() => {
  window.removeEventListener('resize', updateChartSize)
})
</script>

<style scoped>
.crypto-chart {
  background: linear-gradient(135deg, #1a1a1a, #2a2a2a);
  border: 1px solid #333;
  border-radius: 12px;
  padding: 20px;
  color: #fff;
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 15px;
}

.chart-title {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.coin-name {
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0;
  color: #fff;
}

.price-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.current-price {
  font-size: 1.3rem;
  font-weight: 600;
  color: #00ff88;
}

.price-change {
  font-size: 1rem;
  font-weight: 600;
  padding: 4px 8px;
  border-radius: 4px;
}

.price-change.positive {
  color: #00ff88;
  background: rgba(0, 255, 136, 0.1);
}

.price-change.negative {
  color: #ff4757;
  background: rgba(255, 71, 87, 0.1);
}

.timeframe-selector {
  display: flex;
  gap: 8px;
  background: #333;
  border-radius: 8px;
  padding: 4px;
}

.timeframe-btn {
  padding: 8px 16px;
  border: none;
  background: transparent;
  color: #888;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 500;
  transition: all 0.3s ease;
}

.timeframe-btn:hover {
  color: #fff;
  background: rgba(255, 255, 255, 0.1);
}

.timeframe-btn.active {
  background: #00ff88;
  color: #000;
}

.chart-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 15px;
}

.chart-type-toggle {
  display: flex;
  gap: 8px;
  background: #333;
  border-radius: 8px;
  padding: 4px;
}

.toggle-btn {
  padding: 8px 16px;
  border: none;
  background: transparent;
  color: #888;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.3s ease;
}

.toggle-btn:hover {
  color: #fff;
  background: rgba(255, 255, 255, 0.1);
}

.toggle-btn.active {
  background: #00ff88;
  color: #000;
}

.chart-info {
  display: flex;
  gap: 20px;
  font-size: 0.9rem;
  color: #888;
}

.chart-container {
  position: relative;
  background: #111;
  border-radius: 8px;
  padding: 10px;
  margin-bottom: 20px;
  overflow: hidden;
}

.chart-wrapper {
  width: 100%;
  display: flex;
  justify-content: center;
}

.price-chart,
.volume-chart {
  background: transparent;
}

.grid-line {
  stroke: #333;
  stroke-width: 1;
  opacity: 0.5;
}

.price-line {
  stroke-width: 3;
  filter: drop-shadow(0 0 4px rgba(0, 255, 136, 0.3));
}

.data-point {
  fill: #00ff88;
  stroke: #fff;
  stroke-width: 2;
  opacity: 0;
  transition: opacity 0.3s ease;
  cursor: pointer;
}

.data-point:hover {
  opacity: 1;
  r: 5;
}

.volume-bar {
  fill: #00ff88;
  opacity: 0.6;
  transition: opacity 0.3s ease;
}

.volume-bar:hover {
  opacity: 1;
}

.axis-label {
  fill: #888;
  font-size: 12px;
  font-family: 'Inter', sans-serif;
}

.chart-tooltip {
  position: absolute;
  background: rgba(0, 0, 0, 0.9);
  border: 1px solid #00ff88;
  border-radius: 8px;
  padding: 12px;
  pointer-events: none;
  z-index: 1000;
  min-width: 180px;
}

.tooltip-title {
  font-weight: 600;
  color: #00ff88;
  margin-bottom: 8px;
}

.tooltip-price,
.tooltip-volume,
.tooltip-time {
  font-size: 0.9rem;
  margin-bottom: 4px;
  color: #ccc;
}

.chart-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 16px;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: rgba(0, 255, 136, 0.05);
  border: 1px solid rgba(0, 255, 136, 0.1);
  border-radius: 8px;
}

.stat-label {
  font-size: 0.9rem;
  color: #888;
}

.stat-value {
  font-weight: 600;
  color: #00ff88;
}

@media (max-width: 768px) {
  .chart-header,
  .chart-controls {
    flex-direction: column;
    align-items: stretch;
  }
  
  .timeframe-selector,
  .chart-type-toggle {
    justify-content: center;
  }
  
  .chart-info {
    justify-content: space-around;
    flex-wrap: wrap;
  }
  
  .chart-stats {
    grid-template-columns: 1fr 1fr;
  }
}
</style> 