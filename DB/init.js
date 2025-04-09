const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://ayasechatdb_user:4PKLCyMIH9rJD5zzODtMssX6AcxmzUzG@dpg-cvqhs4je5dus73faqkrg-a.singapore-postgres.render.com/ayasechatdb',
  ssl: { rejectUnauthorized: false }
});

// (async () => {
//   try {
//     await pool.query(`
//       CREATE TABLE users (
//         id SERIAL PRIMARY KEY,
//         username VARCHAR(50) NOT NULL UNIQUE,
//         password VARCHAR(100) NOT NULL,
//         created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
//       )
//     `);
//     console.log('✅ 用户表创建成功');
//   } catch (err) {
//     console.error('❌ 出错:', err);
//   } finally {
//     await pool.end();
//   }
// })();

(async (req, res) => {
  try {
    await pool.query(`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS avatar TEXT DEFAULT 'images/default-avatar.png';
    `);
    console.log('✅ avatar 字段已添加');
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
})();
