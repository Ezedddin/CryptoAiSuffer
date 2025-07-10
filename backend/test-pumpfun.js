import WebSocket from 'ws';

console.log("🧪 Testing Pump.fun WebSocket API...");

const ws = new WebSocket('wss://pumpportal.fun/api/data');

ws.on('open', function open() {
    console.log("✅ WebSocket verbonden!");
    
    // Subscribe to new token events
    const payload = {
        method: "subscribeNewToken"
    };
    
    console.log("📡 Sending subscription:", JSON.stringify(payload));
    ws.send(JSON.stringify(payload));
    
    // Also try to subscribe to some token trades to see if we get any data
    setTimeout(() => {
        const tradePayload = {
            method: "subscribeTokenTrade",
            keys: ["91WNez8D22NwBssQbkzjy4s2ipFrzpmn5hfvWVe2aY5p"] // Example token
        };
        console.log("📡 Sending trade subscription:", JSON.stringify(tradePayload));
        ws.send(JSON.stringify(tradePayload));
    }, 2000);
});

ws.on('message', function message(data) {
    console.log("📨 Received message:");
    console.log("Raw data:", data.toString());
    
    try {
        const parsed = JSON.parse(data.toString());
        console.log("Parsed data:", JSON.stringify(parsed, null, 2));
    } catch (e) {
        console.log("Could not parse as JSON");
    }
});

ws.on('error', function error(err) {
    console.error("❌ WebSocket error:", err);
});

ws.on('close', function close(code, reason) {
    console.log(`⚠️ WebSocket closed: ${code} - ${reason}`);
});

// Keep the script running for 30 seconds
setTimeout(() => {
    console.log("⏰ Test completed, closing connection...");
    ws.close();
    process.exit(0);
}, 30000); 