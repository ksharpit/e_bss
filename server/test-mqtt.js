// MQTT Test Script - Simulates BMS telemetry from ESP32
// Usage: node server/test-mqtt.js [broker_url] [device_id]
// Example: node server/test-mqtt.js mqtt://localhost:1883 1

import mqtt from 'mqtt';

const BROKER = process.argv[2] || 'mqtt://localhost:1883';
const DEVICE_ID = parseInt(process.argv[3] || '1', 10);
const INTERVAL = 5000; // 5 seconds

const client = mqtt.connect(BROKER);

client.on('connect', () => {
  console.log(`Connected to ${BROKER}`);
  console.log(`Simulating BMS telemetry for Device ID: ${DEVICE_ID}`);
  console.log(`Publishing every ${INTERVAL/1000}s to: electica/battery/${DEVICE_ID}/telemetry`);
  console.log('Press Ctrl+C to stop\n');

  // Publish status: online
  client.publish(`electica/battery/${DEVICE_ID}/status`, 'online');

  setInterval(() => {
    // Simulate realistic BMS data (raw values as ESP32 would send)
    const baseSoc = 70 + Math.random() * 20; // 70-90%
    const baseVolt = 3.2 + (baseSoc / 100) * 1.0; // ~3.9-4.2V per cell

    const payload = {
      TS: Math.floor(Date.now() / 1000),
      DI: DEVICE_ID,
      Telemetry: {
        Volt: parseFloat((baseVolt * 16).toFixed(2)),           // 16S pack voltage
        Curr: parseFloat((-2.5 + Math.random() * 5).toFixed(3)), // -2.5 to 2.5A
        Soc: Math.round(baseSoc * 1000),                        // raw (divide by 1000)
        Soh: Math.round((92 + Math.random() * 6) * 1000),       // 92-98% raw
        Cycle: Math.round(128 + Math.random() * 10),
        Cap_avail: parseFloat((40 + Math.random() * 5).toFixed(1)),
        Cap_init: 48,
        Pod_temp: Math.round((28 + Math.random() * 8) * 1000),  // 28-36C raw
      },
      cells_v: Array.from({ length: 16 }, () =>
        parseFloat((baseVolt + (Math.random() - 0.5) * 0.05).toFixed(3))
      ),
      Ntc_temp: Array.from({ length: 6 }, () =>
        Math.round((30 + Math.random() * 5) * 1000)             // 30-35C raw
      ),
      Pdu_temp: Array.from({ length: 4 }, () =>
        Math.round((32 + Math.random() * 6) * 1000)             // 32-38C raw
      ),
    };

    const topic = `electica/battery/${DEVICE_ID}/telemetry`;
    client.publish(topic, JSON.stringify(payload));

    console.log(`[${new Date().toLocaleTimeString()}] SOC: ${(payload.Telemetry.Soc/1000).toFixed(1)}% | Volt: ${payload.Telemetry.Volt}V | Temp: ${(payload.Telemetry.Pod_temp/1000).toFixed(1)}C | Current: ${payload.Telemetry.Curr}A`);
  }, INTERVAL);
});

client.on('error', (err) => {
  console.error('MQTT connection error:', err.message);
  console.error(`Make sure Mosquitto is running at ${BROKER}`);
  process.exit(1);
});
