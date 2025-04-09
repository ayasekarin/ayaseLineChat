document.addEventListener('DOMContentLoaded', () => {
    const avatarInput = document.getElementById('avatar');
    const avatarPreview = document.getElementById('avatarPreview');
    let uploadedAvatar = 'images/default-avatar.png';
  
    avatarInput.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;
  
      const allowedTypes = ['image/jpeg', 'image/png'];
      const maxSize = 3 * 1024 * 1024;
  
      if (!allowedTypes.includes(file.type)) {
        alert('仅支持 JPG 和 PNG 格式');
        avatarInput.value = '';
        return;
      }
  
      if (file.size > maxSize) {
        alert('图片不能超过 3MB');
        avatarInput.value = '';
        return;
      }
  
      const formData = new FormData();
      formData.append('avatar', file);
  
      try {
        const res = await fetch('/upload-avatar', {
          method: 'POST',
          body: formData
        });
  
        const data = await res.json();
        uploadedAvatar = data.url || 'images/default-avatar.png';
        avatarPreview.src = uploadedAvatar;
      } catch (err) {
        console.error(err);
        alert('头像上传失败');
      }
    });
  
    document.getElementById('registerBtn').addEventListener('click', async () => {
      const username = document.getElementById('username').value.trim();
      const password = document.getElementById('password').value.trim();
  
      if (!username || !password) {
        return alert('用户名和密码不能为空');
      }
  
      try {
        const res = await fetch('/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password, avatar: uploadedAvatar })
        });
  
        const data = await res.json();
        if (!data.success) {
          return alert(data.error || '注册失败');
        }
  
        alert('✅ 注册成功，请登录');
        window.location.href = 'login.html';
      } catch (err) {
        console.error(err);
        alert('注册出错');
      }
    });
  });