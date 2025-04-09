const express = require('express');
const http = require('http');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const { Server } = require('socket.io');
const bcrypt = require('bcrypt');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const messages = [];
let userData = {};

const userDataFile = path.join(__dirname, 'userData.json');
if (fs.existsSync(userDataFile)) {
  userData = JSON.parse(fs.readFileSync(userDataFile, 'utf-8'));
}

app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));

// 静态资源
app.use(express.static(path.join(__dirname, 'client')));
app.use('/avatars', express.static(path.join(__dirname, 'public', 'avatars')));

// 路由：主页
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'client', 'login.html'));
});

// 设置 multer 用于处理头像上传
const storage = multer.diskStorage({
  destination: path.join(__dirname, 'public', 'avatars'),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, name + ext);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 3 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png'];
    cb(null, allowed.includes(file.mimetype));
  }
});

// 头像上传接口
app.post('/upload-avatar', upload.single('avatar'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: '无效的图片文件' });
  }

  const url = '/avatars/' + req.file.filename;
  return res.json({ url });
});

// socket.io 逻辑
io.on('connection', (socket) => {
  socket.on('login', (data) => {
    const username = data.username?.trim() || '匿名';
    const avatar = data.avatar;

    // 更新或设置头像URL
    if (avatar && typeof avatar === 'string') {
      userData[username] = avatar;
      fs.writeFileSync(userDataFile, JSON.stringify(userData, null, 2));
    }

    socket.username = username;
    socket.avatar = userData[username] || 'images/default-avatar.png';

    socket.emit('chat history', messages);

    socket.broadcast.emit('chat message', {
      user: '系统',
      text: `${username} 加入了聊天室`,
      avatar: ''
    });
  });

  socket.on('chat message', (text) => {
    const message = {
      user: socket.username,
      text,
      avatar: socket.avatar || ''
    };
    messages.push(message);
    if (messages.length > 100) messages.shift();

    io.emit('chat message', message);
  });

  socket.on('disconnect', () => {
    if (socket.username) {
      io.emit('chat message', {
        user: '系统',
        text: `${socket.username} 离开了聊天室`,
        avatar: ''
      });
    }
  });
});

server.listen(3000, () => {
  console.log('🚀 服务器已启动：http://localhost:3000');
});

// 增加：文件上传配置
const fileStorage = multer.diskStorage({
  destination: path.join(__dirname, 'public', 'uploads'),
  filename: (req, file, cb) => {
    const name = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, name + path.extname(file.originalname));
  }
});

const uploadFile = multer({ storage: fileStorage });

// 静态访问上传文件
app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads')));

// 增加：文件上传接口
app.post('/upload-file', uploadFile.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: '上传失败' });
  }
  const fileUrl = `/uploads/${req.file.filename}`;
  const originalName = req.file.originalname;
  return res.json({ url: fileUrl, name: originalName });
});

const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // connectionString: 'postgresql://ayasechatdb_user:4PKLCyMIH9rJD5zzODtMssX6AcxmzUzG@dpg-cvqhs4je5dus73faqkrg-a.singapore-postgres.render.com/ayasechatdb',
  ssl: { rejectUnauthorized: false }
});

app.post('/register', async (req, res) => {
  const { username, password, avatar } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: '用户名和密码不能为空' });
  }

  try {
    const hash = await bcrypt.hash(password, 10);
    await pool.query(
      'INSERT INTO users (username, password, avatar) VALUES ($1, $2, $3)',
      [username, hash, avatar || 'images/default-avatar.png']
    );
    res.json({ success: true });
  } catch (err) {
    if (err.code === '23505') {
      res.status(400).json({ error: '用户名已存在' });
    } else {
      console.error(err);
      res.status(500).json({ error: '注册失败' });
    }
  }
});

app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const result = await pool.query(
      'SELECT * FROM users WHERE username = $1',
      [username]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ error: '用户不存在' });
    }

    const user = result.rows[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(400).json({ error: '密码错误' });
    }

    res.json({ success: true, username: user.username, avatar: user.avatar });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '登录失败' });
  }
});

app.get('/get-avatar', async (req, res) => {
  const { username } = req.query;

  if (!username) return res.status(400).json({ error: '用户名缺失' });

  try {
    const result = await pool.query(
      'SELECT avatar FROM users WHERE username = $1',
      [username]
    );

    if (result.rows.length === 0) {
      return res.json({ avatar: 'images/default-avatar.png' });
    }

    res.json({ avatar: result.rows[0].avatar });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '查询失败' });
  }
});
