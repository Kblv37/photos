const photos = [
  { url: 'SAM_3246.jpg', uploadTime: new Date('2025-04-14') },
  { url: 'SAM_3236.JPG', uploadTime: new Date('2024-04-27T08:17') }
];

const gallery = document.getElementById('gallery');
const modal = document.getElementById('modal');
const modalImg = document.getElementById('modalImg');
const downloadBtn = document.getElementById('downloadBtn');
const closeBtn = document.getElementById('closeBtn');
const searchDate = document.getElementById('searchDate');
const resetBtn = document.getElementById('resetBtn');
let currentPhoto = null;

// Функция получения информации о фото
async function getPhotoInfo(photo) {
  try {
    // Загружаем файл
    const response = await fetch(photo.url);
    const blob = await response.blob();

    // Получаем размер
    const sizeMB = (blob.size / (1024 * 1024)).toFixed(2);

    // Получаем разрешение
    const img = new Image();
    const imgURL = URL.createObjectURL(blob);

    return new Promise((resolve) => {
      img.onload = () => {
        const resolution = `${img.naturalWidth}x${img.naturalHeight}`;
        URL.revokeObjectURL(imgURL);
        resolve({ ...photo, sizeMB, resolution });
      };
      img.src = imgURL;
    });
  } catch (err) {
    console.error('Ошибка при получении информации:', err);
    return { ...photo, sizeMB: '—', resolution: '—' };
  }
}

// Функция форматирования даты в дд.мм.гггг
function formatDate(date) {
  const d = date.getDate().toString().padStart(2, '0');
  const m = (date.getMonth() + 1).toString().padStart(2, '0');
  const y = date.getFullYear();
  return `${d}.${m}.${y}`;
}

async function renderPhotos(filter = '') {
  gallery.innerHTML = '';

  // Сначала достаём инфо для всех фото
  const detailedPhotos = await Promise.all(photos.map(getPhotoInfo));

  const filtered = detailedPhotos
    .filter(p => {
      const dateObj = new Date(p.uploadTime);
      return !filter || formatDate(dateObj).startsWith(filter);
    })
    .sort((a, b) => new Date(b.uploadTime) - new Date(a.uploadTime));

  if (filtered.length === 0) {
    gallery.innerHTML = '<div class="empty-message">Ничего не найдено</div>';
    return;
  }

  filtered.forEach(p => {
    const dateObj = new Date(p.uploadTime);
    const isoString = dateObj.toISOString();
    const hasTime = !isoString.endsWith('T00:00:00.000Z');
    const timeText = hasTime
      ? ` ${dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
      : '';

    const card = document.createElement('div');
    card.className = 'photo-card';
    card.innerHTML = `
      <div class="upload-time">
        [${p.sizeMB} MB | ${p.resolution}] ${formatDate(dateObj)}${timeText}
      </div>
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
