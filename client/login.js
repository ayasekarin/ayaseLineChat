const avatarInput = document.getElementById('avatar');
const avatarPreview = document.getElementById('avatarPreview');

avatarInput.addEventListener('change', () => {
    const file = avatarInput.files[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/png'];
    const maxSize = 3 * 1024 * 1024;

    if (!allowedTypes.includes(file.type)) {
        alert('仅支持JPG和PNG格式');
        avatarInput.value = '';
        return;
    }

    if (file.size > maxSize) {
        alert('图片不能超过3MB');
        avatarInput.value = '';
        return;
    }

    const reader = new FileReader();
    reader.onload = () => {
        avatarPreview.src = reader.result;
    };
    reader.readAsDataURL(file);
});

async function enterChat() {
    const name = document.getElementById('username').value.trim();
    if (!name) return alert('请输入用户名');

    const file = avatarInput.files[0];

    if (file) {
        const formData = new FormData();
        formData.append('avatar', file);

        try {
            const res = await fetch('/upload-avatar', {
                method: 'POST',
                body: formData
            });
            const data = await res.json();
            if (!data.url) throw new Error('上传失败');

            localStorage.setItem('username', name);
            localStorage.setItem('avatar', data.url);
            window.location.href = 'chat.html';
        } catch (err) {
            alert('头像上传失败，请重试');
            console.error(err);
        }
    } else {
        localStorage.setItem('username', name);
        localStorage.setItem('avatar', 'images/default-avatar.png');
        window.location.href = 'chat.html';
    }
}
