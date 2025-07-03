import axios from 'axios'

const BASE_URL = 'http://localhost:3000/api'

const api = axios.create({
    baseURL: BASE_URL,
    timeout: 10000,
})

// Interface voor DexScreener coin
interface DexScreenerCoin {
    id?: string
    name?: string
    symbol?: string
    description?: string
    imageUrl?: string
    url?: string // DexScreener URL naar de coin pagina
    chainId?: string
    tokenAddress?: string
    [key: string]: any
}

// Interface voor Pump.fun token
interface PumpFunToken {
    name?: string
    symbol?: string
    description?: string
    image?: string
    mint?: string
    creator?: string
    market_cap?: number
    usd_market_cap?: number
    source: string
    receivedAt: string
    blockchain: string
    [key: string]: any
}

// Gecombineerde token interface
interface CombinedToken extends Partial<DexScreenerCoin>, Partial<PumpFunToken> {
    source: 'dexscreener' | 'pump.fun'
    blockchain: string
}

// Interface voor SSE berichten
interface SSEMessage {
    type: 'connected' | 'newToken'
    message?: string
    token?: PumpFunToken
}

// Real-time service voor Server-Sent Events
class RealTimeService {
    private eventSource: EventSource | null = null
    private listeners: Array<(token: PumpFunToken) => void> = []

    connect() {
        if (this.eventSource) {
            this.disconnect()
        }

        console.log('🔴 Connecting to real-time stream...')
        this.eventSource = new EventSource(`${BASE_URL}/stream`)

        this.eventSource.onopen = () => {
            console.log('✅ Real-time stream connected')
        }

        this.eventSource.onmessage = (event) => {
            try {
                const data: SSEMessage = JSON.parse(event.data)

                if (data.type === 'connected') {
                    console.log('🔗 SSE connection established:', data.message)
                } else if (data.type === 'newToken' && data.token) {
                    console.log('🚀 New token received via SSE:', data.token.name || data.token.symbol)
                    // Notify all listeners
                    this.listeners.forEach(listener => listener(data.token!))
                }
            } catch (error) {
                console.error('Error parsing SSE message:', error)
            }
        }

        this.eventSource.onerror = (error) => {
            console.error('❌ SSE connection error:', error)
            // Reconnect after 5 seconds
            setTimeout(() => {
                if (this.eventSource?.readyState === EventSource.CLOSED) {
                    this.connect()
                }
            }, 5000)
        }
    }

    disconnect() {
        if (this.eventSource) {
            this.eventSource.close()
            this.eventSource = null
            console.log('❌ Real-time stream disconnected')
        }
    }

    onNewToken(callback: (token: PumpFunToken) => void) {
        this.listeners.push(callback)

        // Return unsubscribe function
        return () => {
            const index = this.listeners.indexOf(callback)
            if (index > -1) {
                this.listeners.splice(index, 1)
            }
        }
    }

    isConnected(): boolean {
        return this.eventSource?.readyState === EventSource.OPEN
    }
}

// Singleton instance
const realTimeService = new RealTimeService()

export class ApiService {
    static async getLatestCoins(): Promise<DexScreenerCoin[]> {
        try {
            const response = await api.get('/latest-coins')
            return response.data
        } catch (error) {
            console.error('Error fetching latest coins:', error)
            throw new Error('Failed to fetch latest coins')
        }
    }

    static async getPumpFunTokens(): Promise<PumpFunToken[]> {
        try {
            const response = await api.get('/pump-fun-tokens')
            return response.data
        } catch (error) {
            console.error('Error fetching Pump.fun tokens:', error)
            throw new Error('Failed to fetch Pump.fun tokens')
        }
    }

    static async getAllTokens(): Promise<CombinedToken[]> {
        try {
            const response = await api.get('/all-tokens')
            return response.data
        } catch (error) {
            console.error('Error fetching all tokens:', error)
            throw new Error('Failed to fetch all tokens')
        }
    }

    static async getServerStatus(): Promise<{
        status: string
        pumpFunTokens: number
        sseClients: number
        uptime: number
        timestamp: string
    }> {
        try {
            const response = await api.get('/status')
            return response.data
        } catch (error) {
            console.error('Error fetching server status:', error)
            throw new Error('Failed to fetch server status')
        }
    }

    static async getCoinDetails(coinId: string) {
        try {
            // Voor nu mock data, later kun je een echte endpoint maken
            const response = await api.get(`/coin/${coinId}`)
            return response.data
        } catch (error) {
            console.error('Error fetching coin details:', error)
            throw new Error('Failed to fetch coin details')
        }
    }

    // Real-time service methods
    static connectRealTime() {
        realTimeService.connect()
    }

    static disconnectRealTime() {
        realTimeService.disconnect()
    }

    static onNewToken(callback: (token: PumpFunToken) => void) {
        return realTimeService.onNewToken(callback)
    }

    static isRealTimeConnected(): boolean {
        return realTimeService.isConnected()
    }
}

export default ApiService
export type { DexScreenerCoin, PumpFunToken, CombinedToken, SSEMessage } 