const express = require('express');
const http = require('http');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const messages = []; // 聊天记录（内存中）
let userData = {};   // 用户头像映射（用户名 -> 头像URL）

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
