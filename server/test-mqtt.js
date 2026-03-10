// MQTT Test Script - Simulates ESP32 BMS telemetry (matches actual firmware format)
// Usage: node server/test-mqtt.js [broker_url] [device_id]
// Example: node server/test-mqtt.js mqtt://localhost:1883 ESP32_BMS_01

import mqtt from 'mqtt';

const BROKER = process.argv[2] || 'mqtt://localhost:1883';
const DEVICE_ID = process.argv[3] || 'ESP32_BMS_01';
const INTERVAL = 5000; // 5 seconds

// Publish topic matches ESP32 firmware
const TOPIC = 'esp32/data';

const client = mqtt.connect(BROKER);

client.on('connect', () => {
  console.log(`Connected to ${BROKER}`);
  console.log(`Simulating ESP32 BMS telemetry for Device ID: ${DEVICE_ID}`);
  console.log(`Publishing every ${INTERVAL/1000}s to: ${TOPIC}`);
  console.log('Press Ctrl+C to stop\n');

  setInterval(() => {
    // Simulate realistic BMS data matching actual ESP32 firmware output
    // All values are pre-scaled (firmware does the math before publishing)
    const baseSoc = 70 + Math.random() * 20; // 70-90%
    const baseVolt = 3.2 + (baseSoc / 100) * 1.0; // ~3.9-4.2V per cell

    const payload = {
      ts: Math.floor(Date.now() / 1000),
      device_id: DEVICE_ID,
      telemetry: {
        pack_v: parseFloat((baseVolt * 16).toFixed(2)),              // pack voltage in V (already scaled)
        pack_i: parseFloat((-2.5 + Math.random() * 5).toFixed(2)),   // current in A (already scaled)
        soc: Math.round(baseSoc),                                     // percentage directly (85 = 85%)
        soh: Math.round(92 + Math.random() * 6),                     // percentage directly (98 = 98%)
        cycle: Math.round(128 + Math.random() * 10),                 // cycle count (integer)
        cap_avail: Math.round(30 + Math.random() * 10),              // Ah (integer, already scaled)
        cap_init: 48,                                                  // Ah (integer)
        pod_temp: Math.round(28 + Math.random() * 8),                // degrees C (integer, already scaled)
      },
      cells_v: Array.from({ length: 16 }, () =>
        parseFloat((baseVolt + (Math.random() - 0.5) * 0.05).toFixed(3)) // V per cell (already /1000 in firmware)
      ),
      ntc_temp: Array.from({ length: 6 }, () =>
        Math.round(30 + Math.random() * 5)                            // degrees C (integer)
      ),
      pdu_temp: Array.from({ length: 4 }, () =>
        Math.round(32 + Math.random() * 6)                            // degrees C (integer)
      ),
    };

    client.publish(TOPIC, JSON.stringify(payload));

    const t = payload.telemetry;
    console.log(`[${new Date().toLocaleTimeString()}] SOC: ${t.soc}% | Volt: ${t.pack_v}V | Temp: ${t.pod_temp}C | Current: ${t.pack_i}A`);
  }, INTERVAL);
});

client.on('error', (err) => {
  console.error('MQTT connection error:', err.message);
  console.error(`Make sure Mosquitto is running at ${BROKER}`);
  process.exit(1);
});
