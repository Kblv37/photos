const photos = [
  { url: 'SAM_3246.jpg', uploadTime: new Date('2025-04-14') }
];

const gallery = document.getElementById('gallery');
const modal = document.getElementById('modal');
const modalImg = document.getElementById('modalImg');
const downloadBtn = document.getElementById('downloadBtn');
const closeBtn = document.getElementById('closeBtn');
const searchDate = document.getElementById('searchDate');
const resetBtn = document.getElementById('resetBtn');
let currentPhoto = null;

// Функция форматирования даты в дд.мм.гггг
function formatDate(date) {
  const d = date.getDate().toString().padStart(2, '0');
  const m = (date.getMonth() + 1).toString().padStart(2, '0');
  const y = date.getFullYear();
  return `${d}.${m}.${y}`;
}

function renderPhotos(filter = '') {
  gallery.innerHTML = '';

  const filtered = photos
    .filter(p => !filter || formatDate(p.uploadTime).startsWith(filter))
    .sort((a, b) => b.uploadTime - a.uploadTime);

  if (filtered.length === 0) {
    gallery.innerHTML = '<div class="empty-message">Ничего не найдено</div>';
    return;
  }

  filtered.forEach(p => {
    // Проверяем, была ли указана только дата без времени
    const isoString = p.uploadTime.toISOString();

    // Если строка оканчивается на T00:00:00.000Z → считаем, что время не задано
    const hasTime = !isoString.endsWith('T00:00:00.000Z');

    const dateText = formatDate(p.uploadTime);
    const timeText = hasTime 
      ? ` ${p.uploadTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`
      : '';

    const card = document.createElement('div');
    card.className = 'photo-card';
    card.innerHTML = `
      <div class="upload-time">${dateText}${timeText}</div>
      <img src="${p.url}" alt="Фото">
    `;
    card.onclick = () => openModal(p);
    gallery.appendChild(card);
  });
}

function openModal(photo) {
  modal.style.display = 'flex';
  modalImg.src = photo.url;
  currentPhoto = photo;
}

// Функция для скачивания изображения
function downloadImage(url, filename) {
  fetch(url, { mode: 'cors' })
    .then(response => {
      if (!response.ok) throw new Error('Ошибка загрузки');
      return response.blob();
    })
    .then(blob => {
      const a = document.createElement('a');
      const objectUrl = window.URL.createObjectURL(blob);
      a.href = objectUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(objectUrl);
    })
    .catch(error => {
      console.error('Ошибка при скачивании:', error);
      alert('Не удалось скачать изображение.');
    });
}

downloadBtn.onclick = () => {
  if (!currentPhoto) return;
  const filename = currentPhoto.url.split('/').pop();
  downloadImage(currentPhoto.url, filename);
};

closeBtn.onclick = () => {
  modal.style.display = 'none';
};

searchDate.addEventListener('input', e => {
  renderPhotos(e.target.value);
});

resetBtn.onclick = () => {
  searchDate.value = '';
  renderPhotos();
};

renderPhotos();
