const express = require('express');
const http = require('http');
const fs = require('fs');
const path = require('path');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const messages = []; // 聊天记录（内存中）
let userData = {};   // 用户头像映射（用户名 -> Base64头像）

const userDataFile = path.join(__dirname, 'userData.json');
if (fs.existsSync(userDataFile)) {
  userData = JSON.parse(fs.readFileSync(userDataFile, 'utf-8'));
}

// 提供静态文件服务
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'client', 'login.html'));
});

io.on('connection', (socket) => {
  socket.on('login', (data) => {
    const username = data.username?.trim() || '匿名';
    let avatar = data.avatar;

    // 后端校验头像（只允许 jpg / png 且大小限制）
    const isValidAvatar = () => {
      const allowed = ['data:image/png;base64,', 'data:image/jpeg;base64,'];
      const maxLength = 4.2 * 1024 * 1024; // ≈3MB文件转base64后的长度

      if (!avatar) return false;
      if (!allowed.some(type => avatar.startsWith(type))) return false;
      if (avatar.length > maxLength) return false;
      return true;
    };

    if (avatar && isValidAvatar()) {
      userData[username] = avatar;
      fs.writeFileSync(userDataFile, JSON.stringify(userData, null, 2));
    }

    socket.username = username;
    socket.avatar = userData[username] || '';

    // 发送历史消息给新用户
    socket.emit('chat history', messages);

    // 广播加入消息
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
