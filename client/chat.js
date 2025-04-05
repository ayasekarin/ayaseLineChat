const socket = io();

const username = localStorage.getItem('username');
const avatar = localStorage.getItem('avatar');

if (!username) {
  alert('请先登录');
  location.href = 'login.html';
}

socket.emit('login', { username, avatar });

const form = document.getElementById('form');
const input = document.getElementById('input');
const messages = document.getElementById('messages');

form.addEventListener('submit', function (e) {
  e.preventDefault();
  if (input.value) {
    socket.emit('chat message', input.value);
    input.value = '';
  }
});

socket.on('chat message', function (msg) {
  const item = document.createElement('li');
  const avatar = msg.avatar || 'images/default-avatar.png';
  const user = msg.user || '匿名';

  item.innerHTML = `
    <img src="${avatar}" alt="avatar">
    <div><strong>${user}：</strong> ${msg.text}</div>
  `;
  messages.appendChild(item);
  messages.scrollTop = messages.scrollHeight;
});

socket.on('chat history', function (history) {
  messages.innerHTML = '';
  history.forEach(msg => {
    const item = document.createElement('li');
    const avatar = msg.avatar || 'images/default-avatar.png';
    const user = msg.user || '匿名';

    item.innerHTML = `
      <img src="${avatar}" alt="avatar">
      <div><strong>${user}：</strong> ${msg.text}</div>
    `;
    messages.appendChild(item);
  });
  messages.scrollTop = messages.scrollHeight;
});
