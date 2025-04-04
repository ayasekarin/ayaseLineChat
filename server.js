const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('client'));  // 前端页面文件夹

io.on('connection', (socket) => {
  console.log('有用户连接：', socket.id);

  socket.on('chat message', (msg) => {
    io.emit('chat message', msg);
  });

  socket.on('disconnect', () => {
    console.log('用户断开连接：', socket.id);
  });
});

server.listen(3000, () => {
  console.log('服务器正在运行：http://localhost:3000');
});
