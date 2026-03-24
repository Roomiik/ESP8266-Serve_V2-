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
const { Pool } = require('pg');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Підключення до PostgreSQL через змінну середовища DATABASE_URL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false } // необхідно для Render
});

console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'set' : 'not set');

// Змінні для датчиків MQ (залишаємо як є)
let API_RS = 0;
let API_R0 = 0;

// Функція створення таблиць (якщо вони не існують)
async function createTables() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS sensors (
      id SERIAL PRIMARY KEY,
      code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      subtype TEXT,
      unit TEXT
    )
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS sensor_data (
      id SERIAL PRIMARY KEY,
      sensor_code TEXT REFERENCES sensors(code) ON DELETE CASCADE,
      value REAL NOT NULL,
      timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS pumps (
      id SERIAL PRIMARY KEY,
      code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      status TEXT DEFAULT 'off'
    )
  `);
  console.log('Tables created/verified');
}
createTables().catch(console.error);

// ========== API маршрути ==========

// Додавання нового пристрою (з фронтенду)
app.post('/api/devices', async (req, res) => {
  const { code, name, type, subtype, unit } = req.body;
  try {
    if (type === 'sensor') {
      const result = await pool.query(
        'INSERT INTO sensors (code, name, type, subtype, unit) VALUES ($1, $2, $3, $4, $5) RETURNING id',
        [code, name, type, subtype, unit]
      );
      res.json({ id: result.rows[0].id });
    } else if (type === 'pump') {
      const result = await pool.query(
        'INSERT INTO pumps (code, name, status) VALUES ($1, $2, $3) RETURNING id',
        [code, name, 'off']
      );
      res.json({ id: result.rows[0].id });
    } else {
      res.status(400).json({ error: 'Invalid device type' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Отримання всіх пристроїв
app.get('/api/devices', async (req, res) => {
  try {
    const sensors = await pool.query('SELECT * FROM sensors');
    const pumps = await pool.query('SELECT * FROM pumps');
    const pumpsWithType = pumps.rows.map(p => ({ ...p, type: 'pump' }));
    res.json([...sensors.rows, ...pumpsWithType]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Отримання останніх даних для всіх датчиків
app.get('/api/sensors/latest', async (req, res) => {
  try {
    // Використовуємо той самий запит, що був у SQLite, адаптований до PostgreSQL
    const query = `
      SELECT s.*
      FROM sensor_data s
      JOIN (
          SELECT sensor_code, MAX(id) AS last_id
          FROM sensor_data
          GROUP BY sensor_code
      ) AS last_records
      ON s.id = last_records.last_id
    `;
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Прийом даних від ESP8266
app.post('/api/sensors/data', async (req, res) => {
  const data = req.body;
  try {
    for (const key of Object.keys(data)) {
      const { code, value } = data[key];
      if (code && value !== undefined) {
        await pool.query(
          'INSERT INTO sensor_data (sensor_code, value) VALUES ($1, $2)',
          [code, value]
        );
        console.log(`Inserted: ${code} = ${value}`);
      }
    }
    res.json({ received: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/sensors/mq', (req, res) => {
  const { rs, r0 } = req.body;
  console.log("Rs:", rs);
  console.log("R0:", r0);
  API_R0 = r0;
  API_RS = rs;
  res.json({ RS: rs, R0: r0 });
});

app.get('/api/sensors/mq/api', (req, res) => {
  console.log({ RS: API_RS, R0: API_R0 });
  res.json({ RS: API_RS, R0: API_R0 });
});

// Керування насосом (зміна статусу)
app.post('/api/pumps/:code/toggle', async (req, res) => {
  const { code } = req.params;
  try {
    const pump = await pool.query('SELECT status FROM pumps WHERE code = $1', [code]);
    if (pump.rows.length === 0) {
      return res.status(404).json({ error: 'Pump not found' });
    }
    const newStatus = pump.rows[0].status === 'on' ? 'off' : 'on';
    await pool.query('UPDATE pumps SET status = $1 WHERE code = $2', [newStatus, code]);
    res.json({ code, status: newStatus });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Видалення датчика (виправлено)
app.post('/api/devices/del/', async (req, res) => {
  const { code } = req.body;
  try {
    const result = await pool.query('DELETE FROM sensors WHERE code = $1 RETURNING id', [code]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Sensor not found' });
    }
    res.json({ status: 'ok' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Історія датчика
app.get('/api/sensors/:code/history', async (req, res) => {
  const { code } = req.params;
  try {
    const result = await pool.query(
      'SELECT value, timestamp FROM sensor_data WHERE sensor_code = $1 ORDER BY timestamp ASC',
      [code]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Запуск сервера
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
