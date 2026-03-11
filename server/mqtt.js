// MQTT Client - subscribes to battery telemetry from ESP32 stations
import mqtt from 'mqtt';

const BROKER_URL = process.env.MQTT_BROKER || 'mqtt://localhost:1883';

// Topics the ESP32 firmware publishes to
const TOPIC_ESP32_DATA = 'esp32/data';       // from initial firmware
const TOPIC_ESP32_ET = 'ET/MS/T';            // from MQTT team firmware
const TOPIC_TELEMETRY = 'electica/battery/+/telemetry';
const TOPIC_STATUS = 'electica/battery/+/status';

// ACK topic for ESP32 confirmation (server -> ESP32)
const TOPIC_ESP32_ACK_PREFIX = 'esp32/ack';
const TOPIC_ESP32_ER = 'ER/CM/R';            // ESP32 command topic

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
    mqttClient.subscribe(TOPIC_ESP32_DATA, { qos: 1 });
    mqttClient.subscribe(TOPIC_ESP32_ET, { qos: 1 });
    mqttClient.subscribe(TOPIC_TELEMETRY, { qos: 1 });
    mqttClient.subscribe(TOPIC_STATUS, { qos: 1 });
    console.log(`MQTT subscribed to: ${TOPIC_ESP32_DATA}, ${TOPIC_ESP32_ET}, ${TOPIC_TELEMETRY}, ${TOPIC_STATUS}`);

    // Pre-load device map
    loadDeviceMap(pool);
  });

  mqttClient.on('message', (topic, message) => {
    try {
      const data = JSON.parse(message.toString());

      if (topic === TOPIC_ESP32_DATA || topic === TOPIC_ESP32_ET) {
        // ESP32 firmware format: { ts, device_id, telemetry, cells_v, ntc_temp, pdu_temp }
        const deviceId = String(data.device_id || data.DI || '');
        if (!deviceId) {
          console.warn(`MQTT: message on ${topic} missing device_id`);
          return;
        }
        console.log(`MQTT [${topic}] device=${deviceId} format=${data.telemetry ? 'ESP32' : 'Legacy'} raw_keys=${Object.keys(data).join(',')}`);
        const normalized = normalizePayload(data);
        handleTelemetry(pool, deviceId, normalized);
      } else {
        // Per-device topic: electica/battery/{deviceId}/telemetry|status
        const parts = topic.split('/');
        const deviceId = String(parts[2]);
        const type = parts[3];

        if (type === 'telemetry') {
          const normalized = normalizePayload(data);
          handleTelemetry(pool, deviceId, normalized);
        } else if (type === 'status') {
          handleStatus(pool, deviceId, message.toString());
        }
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

// Normalize payload: handle both ESP32 firmware format and legacy format
// ESP32 firmware (actual):  { ts, device_id, telemetry: { pack_v, pack_i, soc, soh, cycle, cap_avail, cap_init, pod_temp }, cells_v, ntc_temp, pdu_temp }
//   - All values are pre-scaled in firmware (SOC=85 means 85%, temps in C, voltage in V)
// Legacy/test format:       { TS, DI, Telemetry: { Volt, Curr, Soc, Soh, Cycle, Cap_avail, Cap_init, Pod_temp }, cells_v, Ntc_temp, Pdu_temp }
//   - Some values need /1000 scaling (Soc, Soh, temps)
function normalizePayload(data) {
  // Detect format: if 'telemetry' key exists (lowercase) it's ESP32 firmware format
  const isESP32 = data.telemetry != null;

  if (isESP32) {
    const t = data.telemetry;
    return {
      voltage: t.pack_v ?? null,
      currentDraw: t.pack_i ?? null,
      soc: t.soc ?? null,
      soh: t.soh ?? null,
      cycleCount: t.cycle ?? null,
      capAvailable: t.cap_avail ?? null,
      capInitial: t.cap_init ?? null,
      podTemp: t.pod_temp ?? null,
      cellVoltages: data.cells_v || null,
      ntcTemps: data.ntc_temp || null,
      pduTemps: data.pdu_temp || null,
    };
  }

  // Legacy format (uppercase keys)
  // Some devices send raw values needing scaling (SOC=6818 -> 68.18%), others send pre-scaled (SOC=100 -> 100%)
  // Auto-detect: if value > 100, it needs scaling. If <= 100, it's already in the right range.
  const t = data.Telemetry || {};

  // SOC: raw values like 6818 need /100, pre-scaled values like 100 don't
  const soc = t.Soc != null ? (t.Soc > 100 ? t.Soc / 100 : t.Soc) : null;
  // SOH: raw values like 25600 need /1000, pre-scaled values like 100 don't
  const soh = t.Soh != null ? (t.Soh > 100 ? t.Soh / 1000 : t.Soh) : null;
  // Pod_temp: raw values like 8448 need /1000, pre-scaled values like 34 don't
  const podTemp = t.Pod_temp != null ? (t.Pod_temp > 200 ? t.Pod_temp / 1000 : t.Pod_temp) : null;
  // Pdu_temp: raw values like [438,438] need /1000, pre-scaled like [35,35] don't
  const pduTemps = data.Pdu_temp
    ? data.Pdu_temp.map(v => v > 200 ? v / 1000 : v)
    : null;
  // Ntc_temp: same logic
  const ntcTemps = data.Ntc_temp
    ? data.Ntc_temp.map(v => v > 200 ? v / 1000 : v)
    : null;

  return {
    voltage: t.Volt ?? null,
    currentDraw: t.Curr ?? null,
    soc,
    soh,
    cycleCount: t.Cycle != null ? Math.round(t.Cycle) : null,
    capAvailable: t.Cap_avail ?? null,
    capInitial: t.Cap_init ?? null,
    podTemp,
    cellVoltages: data.cells_v || null,
    ntcTemps,
    pduTemps,
  };
}

// Load device_id -> battery_id mapping from DB
async function loadDeviceMap(pool) {
  try {
    const { rows } = await pool.query('SELECT id, device_id FROM batteries WHERE device_id IS NOT NULL');
    deviceMap.clear();
    for (const row of rows) {
      deviceMap.set(String(row.device_id), row.id);
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

// Auto-discover: create battery record for unknown device IDs
async function autoDiscoverBattery(pool, deviceId, data) {
  // Generate next BAT-XXXX ID
  const { rows } = await pool.query(
    `SELECT id FROM batteries ORDER BY id DESC LIMIT 1`
  );
  let nextNum = 1;
  if (rows.length > 0) {
    const match = rows[0].id.match(/BAT-(\d+)/);
    if (match) nextNum = parseInt(match[1], 10) + 1;
  }
  const batteryId = `BAT-${String(nextNum).padStart(4, '0')}`;

  const capInit = data.capInitial ?? null;

  await pool.query(`
    INSERT INTO batteries (id, device_id, status, soc, health, cycle_count, temperature, voltage, cap_initial)
    VALUES ($1, $2, 'stock', 0, 100, 0, 0, 0, $3)
    ON CONFLICT (device_id) DO NOTHING
  `, [batteryId, deviceId, capInit]);

  // Update cache
  deviceMap.set(deviceId, batteryId);
  console.log(`Auto-discovered battery: ${batteryId} (device ${deviceId})`);
  return batteryId;
}

// Handle incoming telemetry (already normalized)
async function handleTelemetry(pool, deviceId, data) {
  let batteryId = deviceMap.get(deviceId);

  // Auto-discover unknown devices
  if (!batteryId) {
    try {
      batteryId = await autoDiscoverBattery(pool, deviceId, data);
    } catch (err) {
      console.error(`Auto-discover failed (device ${deviceId}):`, err.message);
    }
  }

  const { voltage, currentDraw, soc, soh, cycleCount, capAvailable, capInitial, podTemp, cellVoltages, ntcTemps, pduTemps } = data;
  const now = new Date();

  // Skip empty/zero readings (BMS not ready, communication gap)
  // A valid reading must have at least voltage > 0 or soc > 0
  const hasData = (voltage && voltage > 0) || (soc && soc > 0);
  if (!hasData) {
    console.log(`MQTT: skipping empty reading from device ${deviceId} (voltage=${voltage}, soc=${soc})`);
    return;
  }

  try {
    // Insert telemetry into hypertable
    await pool.query(`
      INSERT INTO battery_telemetry (time, device_id, battery_id, voltage, current_draw, soc, soh, cycle_count, cap_available, cap_initial, pod_temp, cell_voltages, ntc_temps, pdu_temps)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
    `, [now, deviceId, batteryId, voltage, currentDraw, soc, soh, cycleCount, capAvailable, capInitial, podTemp, cellVoltages, ntcTemps, pduTemps]);

    // Update battery record with latest non-zero values only
    // Use NULLIF to avoid overwriting good values with 0
    if (batteryId) {
      try {
        await pool.query(`
          UPDATE batteries SET
            soc = COALESCE(NULLIF($1::numeric, 0), soc),
            health = COALESCE(NULLIF($2::numeric, 0), health),
            voltage = COALESCE(NULLIF($3::numeric, 0), voltage),
            current_draw = COALESCE($4, current_draw),
            cycle_count = COALESCE(NULLIF($5::integer, 0), cycle_count),
            temperature = COALESCE(NULLIF($6::numeric, 0), temperature),
            last_telemetry = $7
          WHERE id = $8
        `, [soc, soh, voltage, currentDraw, cycleCount, podTemp, now, batteryId]);
      } catch (updateErr) {
        console.error(`Battery update error (${batteryId}):`, updateErr.message);
      }
    }

    // Send ACK back to ESP32 so it knows data was received
    if (mqttClient && mqttClient.connected) {
      const ack = JSON.stringify({
        status: 'ok',
        device_id: deviceId,
        battery_id: batteryId,
        time: now.toISOString(),
      });
      mqttClient.publish(`${TOPIC_ESP32_ACK_PREFIX}/${deviceId}`, ack);
      mqttClient.publish(TOPIC_ESP32_ER, ack);  // also send to ESP32 command topic
    }
  } catch (err) {
    console.error(`Telemetry insert error (device ${deviceId}):`, err.message);
  }
}

// Handle battery online/offline status
async function handleStatus(pool, deviceId, status) {
  const batteryId = deviceMap.get(String(deviceId));
  if (!batteryId) return;

  console.log(`Battery ${batteryId} (device ${deviceId}): ${status}`);
}

export { mqttClient };
