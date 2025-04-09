const socket = io();

const username = localStorage.getItem('username');
const avatar = localStorage.getItem('avatar') || 'images/default-avatar.png';

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

function formatTime() {
  const now = new Date();
  return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function createMessageItem(msg) {
  const item = document.createElement('li');
  item.classList.add('message-item');

  const avatar = msg.avatar || 'images/default-avatar.png';
  const user = msg.user || '匿名';
  const time = formatTime();

  item.innerHTML = `
    <img src="${avatar}" class="message-avatar" />
    <div class="message-content">
      <div class="message-header">
        <span class="message-user">${user}</span>
        <span class="message-time">${time}</span>
      </div>
      <div class="message-text">${msg.text}</div>
    </div>
  `;
  return item;
}

socket.on('chat message', function (msg) {
  const item = createMessageItem(msg);
  messages.appendChild(item);
  messages.scrollTop = messages.scrollHeight;
});

socket.on('chat history', function (history) {
  messages.innerHTML = '';
  history.forEach(msg => {
    const item = createMessageItem(msg);
    messages.appendChild(item);
  });
  messages.scrollTop = messages.scrollHeight;
});

const fileInput = document.getElementById('fileInput');

fileInput.addEventListener('change', async () => {
  const file = fileInput.files[0];
  if (!file) return;

  const formData = new FormData();
  formData.append('file', file);

  try {
    const res = await fetch('/upload-file', {
      method: 'POST',
      body: formData
    });
    const data = await res.json();

    if (!data.url) {
      alert('上传失败');
      return;
    }

    socket.emit('chat message', `📎 <a href="${data.url}" download="${data.name}" target="_blank">${data.name}</a>`);
  } catch (err) {
    alert('上传失败');
    console.error(err);
  }
});
