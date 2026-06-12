// const express = require('express');
// const sqlite3 = require('sqlite3').verbose();
// const cors = require('cors');

// const app = express();
// app.use(cors());
// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));
// // Підключення до бази даних
// const db = new sqlite3.Database('./sensors.db');
// let API_RS = 0;
// let API_R0 = 0;

// // Додавання нового пристрою (з фронтенду)
// app.post('/api/devices', (req, res) => {
//   const { code, name, type, subtype, unit } = req.body;
  
//   if (type === 'sensor') {
//     db.run('INSERT INTO sensors (code, name, type, subtype, unit) VALUES (?, ?, ?, ?, ?)',
//       [code, name, type, subtype, unit],
//       function(err) {
//         if (err) return res.status(400).json({ error: err.message });
//         res.json({ id: this.lastID });
//       }
//     );
//   } else if (type === 'pump') {
//     db.run('INSERT INTO pumps (code, name, status) VALUES (?, ?, ?)',
//       [code, name, 'off'],
//       function(err) {
//         if (err) return res.status(400).json({ error: err.message });
//         res.json({ id: this.lastID });
//       }
//     );
//   }
// });

// // Отримання всіх пристроїв
// app.get('/api/devices', (req, res) => {  
//   db.all('SELECT * FROM sensors', (err, sensors) => {
//     if (err) {
//       console.error('Помилка sensors:', err);
//       return res.status(500).json({ error: err.message });
//     }
    
//     db.all('SELECT * FROM pumps', (err, pumps) => {
//       if (err) {
//         console.error('Помилка pumps:', err);
//         return res.status(500).json({ error: err.message });
//       }
      
//       const pumpsWithType = pumps.map(p => ({ ...p, type: 'pump' }));
//       res.json([...sensors, ...pumpsWithType]);
//     });
//   });
// });

// // Отримання останніх даних для всіх датчиків
// app.get('/api/sensors/latest', (req, res) => {
// //    SELECT *
// // FROM sensor_data s1
// // WHERE timestamp = (
// //     SELECT MAX(timestamp)
// //     FROM sensor_data s2
// //     WHERE s2.sensor_code = s1.sensor_code
// // )
// // AND sensor_code IN ('00T01', '00T02');

//   const query = `
// SELECT s.*
// FROM sensor_data s
// JOIN (
//     SELECT sensor_code, MAX(id) AS last_id
//     FROM sensor_data
//     GROUP BY sensor_code
// ) AS last_records
// ON s.id = last_records.last_id;
//   `;
//   db.all(query, (err, rows) => {
    
//     if (err) {
//       console.error('Database error:', err.message);
//       return res.status(500).json({ error: err.message });
//     }
//     // Якщо rows = undefined або null, повертаємо []
    
//     res.json(rows || []);
//   });
// });

// // Прийом даних від ESP8266
// app.post('/api/sensors/data', (req, res) => {
//     const data = req.body;
//   Object.keys(data).forEach((d) => {
//       db.run('INSERT INTO sensor_data (sensor_code, value) VALUES (?, ?)',
//       [data[d]?.code, data[d]?.value],
//       function(err) {
//         if(err) return console.log(err);
//         console.log(data[d]?.code, data[d]?.value);
        
//       }
//     );
//   });
//   res.json({ received: true });
// });

// app.post('/api/sensors/mq', (req, res) => {
//   const { rs, r0 } = req.body;

//   console.log("Rs:", rs);
//   console.log("R0:", r0);
//   API_R0 = r0;
//   API_RS = rs;

//   res.json({ "RS": rs, "R0": r0 });
// });
// app.get('/api/sensors/mq/api', (req, res) => {
//   console.log({ "RS": API_RS, "R0": API_R0 });
  
//   res.json({ "RS": API_RS, "R0": API_R0 });
// });
// // Керування насосом (зміна статусу)
// app.post('/api/pumps/:code/toggle', (req, res) => {
//   const { code } = req.params;
//   console.log(code);
  
  
//   db.get('SELECT status FROM pumps WHERE code = ?', [code], (err, row) => {
//     if (err) return res.status(500).json({ error: err.message });
//     if (!row) return res.status(404).json({ error: 'Pump not found' });
    
//     const newStatus = row.status === 'on' ? 'off' : 'on';
//     db.run('UPDATE pumps SET status = ? WHERE code = ?', [newStatus, code], function(err) {
//       if (err) return res.status(500).json({ error: err.message });
//       res.json({ code, status: newStatus });
//     });
//   });
// });

// app.post('/api/devices/del/', (req, res) => {
//   const { code } = req.body;
//   console.log(code);
  
//   db.get('DELETE FROM sensors WHERE code = ?', [code], (err, row) => {
//     if (err) return res.status(500).json({ error: err.message });
//     if (!row) return res.status(404).json({ error: 'Pump not found' });
//     res.status({"status": "ok"})
//   });
// });

// app.get('/api/sensors/:code/history', (req, res) => {
//   const { code } = req.params;
//   const query = `SELECT value, timestamp FROM sensor_data WHERE sensor_code = ? ORDER BY timestamp ASC`;
//   // const query = `UPDATE sensors SET code = REPLACE(code, 'Т', 'T') WHERE code LIKE '%Т%';`;
//   db.all(query, [code], (err, rows) => {
//     if (err) return res.status(500).json({ error: err.message });
//     res.json(rows);
//   });
// });

// // Для безпеки – додамо простий ключ (змініть на свій)
// const ADMIN_SECRET = 'my_secret_key_123'; // змініть на випадковий рядок

// app.post('/api/admin/sql', (req, res) => {
//   const { query, secret } = req.body;
//   if (secret !== ADMIN_SECRET) {
//     return res.status(403).json({ error: 'Невірний ключ доступу' });
//   }

//   // Забороняємо небезпечні операції
//   const forbidden = ['DROP', 'DELETE FROM', 'UPDATE', 'INSERT', 'ALTER', 'CREATE', 'PRAGMA', 'TRUNCATE '];
//   const upperQuery = query.toUpperCase();
//   /*if (forbidden.some(cmd => upperQuery.includes(cmd))) {
//     return res.status(400).json({ error: 'Операція заборонена в цьому інтерфейсі' });
//   }

//   // Дозволяємо тільки SELECT
//   if (!upperQuery.trim().startsWith('SELECT')) {
//     return res.status(400).json({ error: 'Дозволені лише SELECT запити' });
//   }*/

//   console.log(query);
//   db.all(query, (err, rows) => {
//     if (err) {
//       console.error('SQL error:', err.message);
//       return res.status(500).json({ error: err.message });
//     }
//     console.log(rows);
//     res.json(rows);
//   });
// });

// app.listen(3000, () => console.log('Server running on port 3000'));

const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ========== Сховище в пам'яті ==========

// Датчики: { [code]: { id, code, name, type, subtype, unit } }
const sensors = {};

// Насоси: { [code]: { id, code, name, status } }
const pumps = {};

// Дані датчиків: { [sensor_code]: [ { id, sensor_code, value, timestamp } ] }
const sensorData = {};

// Лічильник ID
let nextId = 1;
const newId = () => nextId++;

// Змінні для датчиків MQ
let API_RS = 0;
let API_R0 = 0;

// ========== API маршрути ==========

// Додавання нового пристрою (з фронтенду)
app.post('/api/devices', (req, res) => {
  const { code, name, type, subtype, unit } = req.body;
  try {
    if (type === 'sensor') {
      if (sensors[code]) {
        return res.status(400).json({ error: 'Sensor with this code already exists' });
      }
      const id = newId();
      sensors[code] = { id, code, name, type, subtype, unit };
      sensorData[code] = [];
      res.json({ id });
    } else if (type === 'pump') {
      if (pumps[code]) {
        return res.status(400).json({ error: 'Pump with this code already exists' });
      }
      const id = newId();
      pumps[code] = { id, code, name, status: 'off' };
      res.json({ id });
    } else {
      res.status(400).json({ error: 'Invalid device type' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Отримання всіх пристроїв
app.get('/api/devices', (req, res) => {
  try {
    const allSensors = Object.values(sensors);
    const allPumps = Object.values(pumps).map(p => ({ ...p, type: 'pump' }));
    res.json([...allSensors, ...allPumps]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Отримання останніх даних для всіх датчиків
app.get('/api/sensors/latest', (req, res) => {
  try {
    const latest = Object.entries(sensorData)
      .map(([code, records]) => {
        if (records.length === 0) return null;
        return records[records.length - 1]; // останній запис
      })
      .filter(Boolean);
    res.json(latest);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Максимальна кількість записів на датчик
const MAX_RECORDS_PER_SENSOR = 5000;
setInterval(() => {console.log(`sensorData: ${sensorData}`)}, 5000);
// Прийом даних від ESP8266
app.post('/api/sensors/data', (req, res) => {
  const data = req.body;
  try {
    for (const key of Object.keys(data)) {
      const { code, value } = data[key];
      if (code && value !== undefined) {
        if (!sensorData[code]) {
          sensorData[code] = [];
        }

        const record = {
          id: newId(),
          sensor_code: code,
          value,
          timestamp: new Date().toISOString()
        };
        sensorData[code].push(record);
        console.log(record);

        // Якщо записів більше ніж MAX_RECORDS_PER_SENSOR — видаляємо найстаріші
        if (sensorData[code].length > MAX_RECORDS_PER_SENSOR) {
          const excess = sensorData[code].length - MAX_RECORDS_PER_SENSOR;
          sensorData[code].splice(0, excess);
          console.log(`[${code}] Trimmed ${excess} old record(s), keeping last ${MAX_RECORDS_PER_SENSOR}`);
        }

        console.log(`Inserted: ${code} = ${value} (total: ${sensorData[code].length})`);
      }
      console.log("undefined");
    }
    res.json({ received: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// MQ датчик — зберегти RS/R0
app.post('/api/sensors/mq', (req, res) => {
  const { rs, r0 } = req.body;
  console.log("Rs:", rs);
  console.log("R0:", r0);
  API_R0 = r0;
  API_RS = rs;
  res.json({ RS: rs, R0: r0 });
});

// MQ датчик — отримати RS/R0
app.get('/api/sensors/mq/api', (req, res) => {
  console.log({ RS: API_RS, R0: API_R0 });
  res.json({ RS: API_RS, R0: API_R0 });
});

// Керування насосом (зміна статусу)
app.post('/api/pumps/:code/toggle', (req, res) => {
  const { code } = req.params;
  try {
    if (!pumps[code]) {
      return res.status(404).json({ error: 'Pump not found' });
    }
    pumps[code].status = pumps[code].status === 'on' ? 'off' : 'on';
    res.json({ code, status: pumps[code].status });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Видалення датчика
app.post('/api/devices/del/', (req, res) => {
  const { code } = req.body;
  try {
    if (!sensors[code]) {
      return res.status(404).json({ error: 'Sensor not found' });
    }
    delete sensors[code];
    delete sensorData[code];
    res.json({ status: 'ok' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Історія датчика
app.get('/api/sensors/:code/history', (req, res) => {
  const { code } = req.params;
  try {
    const history = sensorData[code];
    if (!history) {
      return res.status(404).json({ error: 'Sensor not found' });
    }
    // Повертаємо відсортовано за часом (вже в порядку вставки, але на всяк)
    const sorted = [...history].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    res.json(sorted.map(r => ({ value: r.value, timestamp: r.timestamp })));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Запуск сервера
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

