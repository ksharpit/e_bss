// MQTT Client - subscribes to battery telemetry from ESP32 stations
import mqtt from 'mqtt';

const BROKER_URL = process.env.MQTT_BROKER || 'mqtt://localhost:1883';
const TOPIC_TELEMETRY = 'electica/battery/+/telemetry';
const TOPIC_STATUS = 'electica/battery/+/status';

// Scaling factors (update once BMS datasheet is available)
const SCALE = {
  soc: 1000,       // raw / 1000 = percentage
  soh: 1000,       // raw / 1000 = percentage
  current: 1,      // TBD from datasheet
  temp: 1000,      // raw / 1000 = degrees C
  cycle: 1,        // TBD from datasheet
  cap: 1,          // TBD from datasheet
};

// Device ID -> battery ID cache (avoid DB lookup on every message)
const deviceMap = new Map();

let mqttClient = null;

export function initMqtt(pool) {
  mqttClient = mqtt.connect(BROKER_URL, {
    clientId: `electica-server-${Date.now()}`,
    clean: true,
    reconnectPeriod: 5000,
  });

  mqttClient.on('connect', () => {
    console.log(`MQTT connected to ${BROKER_URL}`);
    mqttClient.subscribe(TOPIC_TELEMETRY, { qos: 1 });
    mqttClient.subscribe(TOPIC_STATUS, { qos: 1 });
    console.log(`MQTT subscribed to ${TOPIC_TELEMETRY}, ${TOPIC_STATUS}`);

    // Pre-load device map
    loadDeviceMap(pool);
  });

  mqttClient.on('message', (topic, message) => {
    try {
      const parts = topic.split('/');
      // topic format: electica/battery/{deviceId}/telemetry|status
      const deviceId = parseInt(parts[2], 10);
      const type = parts[3];

      if (type === 'telemetry') {
        handleTelemetry(pool, deviceId, JSON.parse(message.toString()));
      } else if (type === 'status') {
        handleStatus(pool, deviceId, message.toString());
      }
    } catch (err) {
      console.error('MQTT message error:', err.message);
    }
  });

  mqttClient.on('error', (err) => {
    console.error('MQTT error:', err.message);
  });

  mqttClient.on('reconnect', () => {
    console.log('MQTT reconnecting...');
  });
}

// Load device_id -> battery_id mapping from DB
async function loadDeviceMap(pool) {
  try {
    const { rows } = await pool.query('SELECT id, device_id FROM batteries WHERE device_id IS NOT NULL');
    deviceMap.clear();
    for (const row of rows) {
      deviceMap.set(row.device_id, row.id);
    }
    console.log(`MQTT device map loaded: ${deviceMap.size} batteries`);
  } catch (err) {
    console.error('Failed to load device map:', err.message);
  }
}

// Refresh device map (called when a new battery is onboarded)
export async function refreshDeviceMap(pool) {
  await loadDeviceMap(pool);
}

// Handle incoming telemetry from BMS
async function handleTelemetry(pool, deviceId, data) {
  const batteryId = deviceMap.get(deviceId);

  // Scale raw values
  const soc = data.Telemetry?.Soc != null ? data.Telemetry.Soc / SCALE.soc : null;
  const soh = data.Telemetry?.Soh != null ? data.Telemetry.Soh / SCALE.soh : null;
  const voltage = data.Telemetry?.Volt ?? null;
  const currentDraw = data.Telemetry?.Curr != null ? data.Telemetry.Curr / SCALE.current : null;
  const cycleCount = data.Telemetry?.Cycle != null ? Math.round(data.Telemetry.Cycle / SCALE.cycle) : null;
  const capAvailable = data.Telemetry?.Cap_avail ?? null;
  const capInitial = data.Telemetry?.Cap_init ?? null;
  const podTemp = data.Telemetry?.Pod_temp != null ? data.Telemetry.Pod_temp / SCALE.temp : null;
  const cellVoltages = data.cells_v || null;
  const ntcTemps = data.Ntc_temp ? data.Ntc_temp.map(t => t / SCALE.temp) : null;
  const pduTemps = data.Pdu_temp ? data.Pdu_temp.map(t => t / SCALE.temp) : null;

  const now = new Date();

  try {
    // Insert telemetry into hypertable
    await pool.query(`
      INSERT INTO battery_telemetry (time, device_id, battery_id, voltage, current_draw, soc, soh, cycle_count, cap_available, cap_initial, pod_temp, cell_voltages, ntc_temps, pdu_temps)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
    `, [now, deviceId, batteryId, voltage, currentDraw, soc, soh, cycleCount, capAvailable, capInitial, podTemp, cellVoltages, ntcTemps, pduTemps]);

    // Update battery record with latest values
    if (batteryId) {
      await pool.query(`
        UPDATE batteries SET
          soc = COALESCE($1, soc),
          health = COALESCE($2, health),
          voltage = COALESCE($3, voltage),
          current_draw = COALESCE($4, current_draw),
          cycle_count = COALESCE($5, cycle_count),
          temperature = COALESCE($6, temperature),
          last_telemetry = $7
        WHERE id = $8
      `, [soc, soh, voltage, currentDraw, cycleCount, podTemp, now, batteryId]);
    }
  } catch (err) {
    console.error(`Telemetry insert error (device ${deviceId}):`, err.message);
  }
}

// Handle battery online/offline status
async function handleStatus(pool, deviceId, status) {
  const batteryId = deviceMap.get(deviceId);
  if (!batteryId) return;

  console.log(`Battery ${batteryId} (device ${deviceId}): ${status}`);

  // Could auto-set fault status on disconnect, etc.
  // For now just log it
}

export { mqttClient };
