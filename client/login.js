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
        localStorage.setItem('avatar', reader.result);
    };
    reader.readAsDataURL(file);
});

function enterChat() {
    const name = document.getElementById('username').value.trim();
    if (!name) return alert('ユーザー名を入力してください');

    localStorage.setItem('username', name);
    window.location.href = 'chat.html';
}
