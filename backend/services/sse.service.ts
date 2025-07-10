import express from "express";

export class SSEService {
    private static instance: SSEService;
    private sseClients: Array<{ id: string; res: express.Response }> = [];

    private constructor() {}

    public static getInstance(): SSEService {
        if (!SSEService.instance) {
            SSEService.instance = new SSEService();
        }
        return SSEService.instance;
    }

    /**
     * Voegt een nieuwe SSE client toe
     */
    addClient(req: express.Request, res: express.Response): void {
        res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Cache-Control'
        });

        const clientId = Date.now().toString();
        const client = { id: clientId, res };
        this.sseClients.push(client);

        console.log(`✅ New SSE client connected: ${clientId}. Total clients: ${this.sseClients.length}`);

        // Stuur initial bericht
        res.write(`data: ${JSON.stringify({ type: 'connected', message: 'Real-time stream connected' })}\n\n`);

        // Cleanup bij disconnect
        req.on('close', () => {
            this.removeClient(clientId);
        });
    }

    /**
     * Verwijdert een SSE client
     */
    private removeClient(clientId: string): void {
        const index = this.sseClients.findIndex(c => c.id === clientId);
        if (index !== -1) {
            this.sseClients.splice(index, 1);
            console.log(`❌ SSE client disconnected: ${clientId}. Remaining clients: ${this.sseClients.length}`);
        }
    }

    /**
     * Stuurt een bericht naar alle verbonden SSE clients
     */
    broadcastToAll(data: any): void {
        console.log(`📡 Broadcasting message to ${this.sseClients.length} SSE clients`);

        this.sseClients.forEach(client => {
            try {
                client.res.write(`data: ${JSON.stringify(data)}\n\n`);
            } catch (error) {
                console.error('Error sending SSE message:', error);
                // Verwijder client als er een fout optreedt
                this.removeClient(client.id);
            }
        });
    }

    /**
     * Stuurt een nieuw token bericht naar alle clients
     */
    broadcastNewToken(token: any): void {
        this.broadcastToAll({ type: 'newToken', token });
    }

    /**
     * Stuurt bijgewerkte tokens naar alle clients
     */
    broadcastTokensUpdated(tokens: any[]): void {
        this.broadcastToAll({ type: 'tokensUpdated', tokens });
    }

    /**
     * Haalt het aantal verbonden clients op
     */
    getClientCount(): number {
        return this.sseClients.length;
    }
} 