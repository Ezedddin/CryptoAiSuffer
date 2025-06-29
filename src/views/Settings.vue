<template>
  <div class="settings-page">
    <div class="settings-header">
      <h1 class="page-title">⚙️ Instellingen</h1>
      <p class="page-subtitle">Configureer je AI Coin Sniffer dashboard</p>
    </div>

    <!-- Settings Categories -->
    <div class="settings-container">
      <!-- API Configuration -->
      <div class="settings-section card">
        <h3 class="section-title">🔌 API Configuratie</h3>
        <div class="settings-grid">
          <div class="setting-item">
            <label class="setting-label">Ethereum API Key</label>
            <input 
              v-model="settings.ethApiKey"
              type="password" 
              placeholder="Voer je Etherscan API key in..."
              class="setting-input"
            />
            <p class="setting-description">Voor Ethereum blockchain data</p>
          </div>
          
          <div class="setting-item">
            <label class="setting-label">Solana RPC Endpoint</label>
            <input 
              v-model="settings.solanaRpc"
              type="url" 
              placeholder="https://api.mainnet-beta.solana.com"
              class="setting-input"
            />
            <p class="setting-description">RPC endpoint voor Solana data</p>
          </div>
          
          <div class="setting-item">
            <label class="setting-label">Bitcoin API Provider</label>
            <select v-model="settings.btcProvider" class="setting-select">
              <option value="blockstream">Blockstream API</option>
              <option value="blockchain.info">Blockchain.info</option>
              <option value="btc.com">BTC.com</option>
            </select>
            <p class="setting-description">Bitcoin data provider</p>
          </div>
        </div>
      </div>

      <!-- AI Model Settings -->
      <div class="settings-section card">
        <h3 class="section-title">🤖 AI Model Instellingen</h3>
        <div class="settings-grid">
          <div class="setting-item">
            <label class="setting-label">AI Model</label>
            <select v-model="settings.aiModel" class="setting-select">
              <option value="advanced">Geavanceerd Model (Aanbevolen)</option>
              <option value="standard">Standaard Model</option>
              <option value="lightweight">Lichtgewicht Model</option>
            </select>
            <p class="setting-description">Kies je AI model voor wallet analyse</p>
          </div>
          
          <div class="setting-item">
            <label class="setting-label">Minimum AI Score Threshold: {{ settings.minAiThreshold }}</label>
            <input 
              v-model="settings.minAiThreshold"
              type="range" 
              min="0" 
              max="100" 
              class="setting-range"
            />
            <p class="setting-description">Minimum AI score voor signalen</p>
          </div>
          
          <div class="setting-item">
            <label class="setting-label">Risk Score Weighting</label>
            <input 
              v-model="settings.riskWeighting"
              type="range" 
              min="0" 
              max="1" 
              step="0.1" 
              class="setting-range"
            />
            <p class="setting-description">Gewicht van risk score in AI berekening ({{ settings.riskWeighting }})</p>
          </div>
        </div>
      </div>

      <!-- Notification Settings -->
      <div class="settings-section card">
        <h3 class="section-title">🔔 Notificatie Instellingen</h3>
        <div class="settings-grid">
          <div class="setting-item">
            <div class="setting-toggle">
              <label class="toggle-label">
                <input 
                  type="checkbox" 
                  v-model="settings.emailNotifications"
                  class="toggle-input"
                />
                <span class="toggle-slider"></span>
                E-mail Notificaties
              </label>
            </div>
            <p class="setting-description">Ontvang e-mail alerts voor hoge AI scores</p>
          </div>
          
          <div class="setting-item" v-if="settings.emailNotifications">
            <label class="setting-label">E-mail Adres</label>
            <input 
              v-model="settings.emailAddress"
              type="email" 
              placeholder="jouw@email.com"
              class="setting-input"
            />
          </div>
          
          <div class="setting-item">
            <div class="setting-toggle">
              <label class="toggle-label">
                <input 
                  type="checkbox" 
                  v-model="settings.pushNotifications"
                  class="toggle-input"
                />
                <span class="toggle-slider"></span>
                Push Notificaties
              </label>
            </div>
            <p class="setting-description">Browser notificaties voor nieuwe signalen</p>
          </div>
          
          <div class="setting-item">
            <div class="setting-toggle">
              <label class="toggle-label">
                <input 
                  type="checkbox" 
                  v-model="settings.soundAlerts"
                  class="toggle-input"
                />
                <span class="toggle-slider"></span>
                Geluid Alerts
              </label>
            </div>
            <p class="setting-description">Geluid afspelen bij nieuwe detecties</p>
          </div>
        </div>
      </div>

      <!-- Trading Preferences -->
      <div class="settings-section card">
        <h3 class="section-title">💰 Trading Voorkeuren</h3>
        <div class="settings-grid">
          <div class="setting-item">
            <label class="setting-label">Preferred Blockchains</label>
            <div class="checkbox-group">
              <label class="checkbox-label">
                <input type="checkbox" v-model="settings.enabledBlockchains" value="Ethereum" />
                <span class="checkbox-custom"></span>
                Ethereum
              </label>
              <label class="checkbox-label">
                <input type="checkbox" v-model="settings.enabledBlockchains" value="Solana" />
                <span class="checkbox-custom"></span>
                Solana
              </label>
              <label class="checkbox-label">
                <input type="checkbox" v-model="settings.enabledBlockchains" value="BTC" />
                <span class="checkbox-custom"></span>
                Bitcoin
              </label>
            </div>
          </div>
          
          <div class="setting-item">
            <label class="setting-label">Maximum Risk Level: {{ settings.maxRiskLevel }}</label>
            <input 
              v-model="settings.maxRiskLevel"
              type="range" 
              min="1" 
              max="10" 
              class="setting-range"
            />
            <p class="setting-description">Maximaal risico niveau voor signals</p>
          </div>
          
          <div class="setting-item">
            <label class="setting-label">Minimum Market Cap</label>
            <select v-model="settings.minMarketCap" class="setting-select">
              <option value="0">Geen minimum</option>
              <option value="10000">$10K+</option>
              <option value="100000">$100K+</option>
              <option value="1000000">$1M+</option>
              <option value="10000000">$10M+</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Display Settings -->
      <div class="settings-section card">
        <h3 class="section-title">🎨 Weergave Instellingen</h3>
        <div class="settings-grid">
          <div class="setting-item">
            <label class="setting-label">Thema</label>
            <select v-model="settings.theme" class="setting-select">
              <option value="dark">Donker (Aanbevolen)</option>
              <option value="light">Licht</option>
              <option value="auto">Automatisch</option>
            </select>
          </div>
          
          <div class="setting-item">
            <label class="setting-label">Currency Display</label>
            <select v-model="settings.currency" class="setting-select">
              <option value="usd">USD ($)</option>
              <option value="eur">EUR (€)</option>
              <option value="btc">BTC (₿)</option>
            </select>
          </div>
          
          <div class="setting-item">
            <label class="setting-label">Refresh Rate</label>
            <select v-model="settings.refreshRate" class="setting-select">
              <option value="5">5 seconden</option>
              <option value="10">10 seconden</option>
              <option value="30">30 seconden</option>
              <option value="60">1 minuut</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Data & Privacy -->
      <div class="settings-section card">
        <h3 class="section-title">🔒 Data & Privacy</h3>
        <div class="settings-grid">
          <div class="setting-item">
            <div class="setting-toggle">
              <label class="toggle-label">
                <input 
                  type="checkbox" 
                  v-model="settings.dataCollection"
                  class="toggle-input"
                />
                <span class="toggle-slider"></span>
                Analytics Data Verzameling
              </label>
            </div>
            <p class="setting-description">Help ons de app te verbeteren door anonieme gebruiksdata</p>
          </div>
          
          <div class="setting-item">
            <div class="setting-toggle">
              <label class="toggle-label">
                <input 
                  type="checkbox" 
                  v-model="settings.cacheData"
                  class="toggle-input"
                />
                <span class="toggle-slider"></span>
                Data Caching
              </label>
            </div>
            <p class="setting-description">Cache data lokaal voor snellere laadtijden</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Action Buttons -->
    <div class="settings-actions">
      <button @click="saveSettings" class="btn btn-primary">
        💾 Instellingen Opslaan
      </button>
      <button @click="resetSettings" class="btn btn-secondary">
        🔄 Standaard Herstellen
      </button>
      <button @click="exportSettings" class="btn btn-secondary">
        📤 Exporteren
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

interface AppSettings {
  // API Settings
  ethApiKey: string
  solanaRpc: string
  btcProvider: string
  
  // AI Settings
  aiModel: string
  minAiThreshold: number
  riskWeighting: number
  
  // Notifications
  emailNotifications: boolean
  emailAddress: string
  pushNotifications: boolean
  soundAlerts: boolean
  
  // Trading
  enabledBlockchains: string[]
  maxRiskLevel: number
  minMarketCap: number
  
  // Display
  theme: string
  currency: string
  refreshRate: number
  
  // Privacy
  dataCollection: boolean
  cacheData: boolean
}

const settings = ref<AppSettings>({
  // API Settings
  ethApiKey: '',
  solanaRpc: 'https://api.mainnet-beta.solana.com',
  btcProvider: 'blockstream',
  
  // AI Settings
  aiModel: 'advanced',
  minAiThreshold: 70,
  riskWeighting: 0.3,
  
  // Notifications
  emailNotifications: false,
  emailAddress: '',
  pushNotifications: true,
  soundAlerts: true,
  
  // Trading
  enabledBlockchains: ['Ethereum', 'Solana'],
  maxRiskLevel: 7,
  minMarketCap: 100000,
  
  // Display
  theme: 'dark',
  currency: 'usd',
  refreshRate: 10,
  
  // Privacy
  dataCollection: true,
  cacheData: true
})

const saveSettings = () => {
  // Save to localStorage or backend
  localStorage.setItem('ai-coin-sniffer-settings', JSON.stringify(settings.value))
  alert('✅ Instellingen opgeslagen!')
}

const resetSettings = () => {
  if (confirm('Weet je zeker dat je alle instellingen wilt resetten?')) {
    // Reset to defaults
    settings.value = {
      ethApiKey: '',
      solanaRpc: 'https://api.mainnet-beta.solana.com',
      btcProvider: 'blockstream',
      aiModel: 'advanced',
      minAiThreshold: 70,
      riskWeighting: 0.3,
      emailNotifications: false,
      emailAddress: '',
      pushNotifications: true,
      soundAlerts: true,
      enabledBlockchains: ['Ethereum', 'Solana'],
      maxRiskLevel: 7,
      minMarketCap: 100000,
      theme: 'dark',
      currency: 'usd',
      refreshRate: 10,
      dataCollection: true,
      cacheData: true
    }
    alert('🔄 Instellingen gereset naar standaard waardes!')
  }
}

const exportSettings = () => {
  const dataStr = JSON.stringify(settings.value, null, 2)
  const dataBlob = new Blob([dataStr], { type: 'application/json' })
  const url = URL.createObjectURL(dataBlob)
  const link = document.createElement('a')
  link.href = url
  link.download = 'ai-coin-sniffer-settings.json'
  link.click()
  URL.revokeObjectURL(url)
}

onMounted(() => {
  // Load settings from localStorage
  const savedSettings = localStorage.getItem('ai-coin-sniffer-settings')
  if (savedSettings) {
    try {
      const parsed = JSON.parse(savedSettings)
      settings.value = { ...settings.value, ...parsed }
    } catch (error) {
      console.error('Error loading settings:', error)
    }
  }
})
</script>

<style scoped>
.settings-page {
  max-width: 1000px;
  margin: 0 auto;
}

.settings-header {
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

.settings-container {
  display: flex;
  flex-direction: column;
  gap: 30px;
  margin-bottom: 40px;
}

.settings-section {
  padding: 30px;
}

.section-title {
  font-size: 1.4rem;
  font-weight: 600;
  margin-bottom: 25px;
  color: #fff;
}

.settings-grid {
  display: flex;
  flex-direction: column;
  gap: 25px;
}

.setting-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.setting-label {
  font-size: 16px;
  font-weight: 500;
  color: #fff;
  margin-bottom: 5px;
}

.setting-input,
.setting-select {
  padding: 12px 15px;
  background-color: #0f0f0f;
  border: 1px solid #2a2a2a;
  border-radius: 8px;
  color: #fff;
  font-size: 14px;
  outline: none;
  transition: border-color 0.3s ease;
}

.setting-input:focus,
.setting-select:focus {
  border-color: #00ff88;
}

.setting-range {
  -webkit-appearance: none;
  appearance: none;
  height: 8px;
  background: #2a2a2a;
  border-radius: 4px;
  outline: none;
  margin: 10px 0;
}

.setting-range::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 20px;
  height: 20px;
  background: #00ff88;
  border-radius: 50%;
  cursor: pointer;
}

.setting-range::-moz-range-thumb {
  width: 20px;
  height: 20px;
  background: #00ff88;
  border-radius: 50%;
  cursor: pointer;
  border: none;
}

.setting-description {
  font-size: 13px;
  color: #888;
  margin-top: 5px;
}

/* Toggle Switch */
.setting-toggle {
  margin: 10px 0;
}

.toggle-label {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  font-size: 16px;
  color: #fff;
}

.toggle-input {
  display: none;
}

.toggle-slider {
  position: relative;
  width: 50px;
  height: 26px;
  background-color: #2a2a2a;
  border-radius: 13px;
  transition: background-color 0.3s ease;
}

.toggle-slider::before {
  content: '';
  position: absolute;
  top: 2px;
  left: 2px;
  width: 22px;
  height: 22px;
  background-color: #fff;
  border-radius: 50%;
  transition: transform 0.3s ease;
}

.toggle-input:checked + .toggle-slider {
  background-color: #00ff88;
}

.toggle-input:checked + .toggle-slider::before {
  transform: translateX(24px);
}

/* Checkbox Group */
.checkbox-group {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 10px;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  font-size: 14px;
  color: #fff;
}

.checkbox-label input[type="checkbox"] {
  display: none;
}

.checkbox-custom {
  width: 18px;
  height: 18px;
  border: 2px solid #2a2a2a;
  border-radius: 4px;
  position: relative;
  transition: all 0.3s ease;
}

.checkbox-label input[type="checkbox"]:checked + .checkbox-custom {
  background-color: #00ff88;
  border-color: #00ff88;
}

.checkbox-label input[type="checkbox"]:checked + .checkbox-custom::after {
  content: '✓';
  position: absolute;
  top: -2px;
  left: 2px;
  color: #000;
  font-size: 12px;
  font-weight: bold;
}

/* Action Buttons */
.settings-actions {
  display: flex;
  gap: 15px;
  justify-content: center;
  padding: 30px 0;
}

/* Responsive */
@media (max-width: 768px) {
  .page-title {
    font-size: 2rem;
  }
  
  .settings-section {
    padding: 20px;
  }
  
  .settings-actions {
    flex-direction: column;
    align-items: center;
  }
  
  .checkbox-group {
    flex-direction: row;
    flex-wrap: wrap;
  }
}
</style>

