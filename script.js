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
    const response = await fetch(photo.url);
    const blob = await response.blob();
    const sizeMB = (blob.size / (1024 * 1024)).toFixed(1); // округляем до 0.1 MB

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
  } catch {
    return { ...photo, sizeMB: null, resolution: null };
  }
}

// Функция форматирования даты в дд.мм.гггг
function formatDate(date) {
  const d = date.getDate().toString().padStart(2, '0');
  const m = (date.getMonth() + 1).toString().padStart(2, '0');
  const y = date.getFullYear();
  return `${d}.${m}.${y}`;
}

filtered.forEach(p => {
  const dateObj = new Date(p.uploadTime);
  const isoString = dateObj.toISOString();
  const hasTime = !isoString.endsWith('T00:00:00.000Z');
  const timeText = hasTime
    ? ` ${dateObj.toLocaleTimeString([], { hour: '2-digit', minute:'2-digit' })}`
    : '';

  let infoText = '';
  if (p.sizeMB && p.resolution) {
    infoText = `${p.sizeMB} MB ${p.resolution} `;
  }

  const card = document.createElement('div');
  card.className = 'photo-card';
  card.innerHTML = `
    <div class="upload-time">${infoText}${formatDate(dateObj)}${timeText}</div>
    <img 
      src="${p.url.replace('.jpg', '-small.jpg')}" 
      data-full="${p.url}" 
      alt="Фото"
      class="preview"
      loading="lazy"
    >
  `;

  const img = card.querySelector('img');
  img.onload = () => img.classList.add('loaded');

  card.onclick = () => openModal(p);
  gallery.appendChild(card);
});

function openModal(photo) {
  modal.style.display = 'flex';

  // Сначала маленькая версия
  modalImg.src = photo.url.replace('.jpg', '-small.jpg');

  // Потом подгружаем оригинал
  const fullImg = new Image();
  fullImg.src = photo.url;
  fullImg.onload = () => {
    modalImg.src = photo.url;
  };
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
