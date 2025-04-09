document.addEventListener('DOMContentLoaded', () => {
    const avatarInput = document.getElementById('avatar');
    const avatarPreview = document.getElementById('avatarPreview');
    const usernameInput = document.getElementById('username');
  
    usernameInput.addEventListener('input', async () => {
      const username = usernameInput.value.trim();
      if (!username) {
        avatarPreview.src = 'images/default-avatar.png';
        return;
      }
  
      try {
        const res = await fetch(`/get-avatar?username=${encodeURIComponent(username)}`);
        const data = await res.json();
        avatarPreview.src = data.avatar || 'images/default-avatar.png';
      } catch (err) {
        avatarPreview.src = 'images/default-avatar.png';
      }
    });
  });
  
  async function enterChat() {
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();
  
    if (!username || !password) {
      return alert('请输入用户名和密码');
    }
  
    try {
      const res = await fetch('/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
  
      const data = await res.json();
      if (!data.success) {
        return alert(data.error || '登录失败');
      }
  
      localStorage.setItem('username', data.username);
      localStorage.setItem('avatar', data.avatar || 'images/default-avatar.png');
      window.location.href = 'chat.html';
    } catch (err) {
      console.error(err);
      alert('登录出错');
    }
  }