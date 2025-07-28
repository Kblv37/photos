const photos = [
  { url: 'SAM_3246.jpg', uploadTime: new Date('2025-04-14') },
  { url: 'img_001.jpg', uploadTime: new Date('2024-04-27T13:17') },
  { url: 'SAM_3236.jpg', uploadTime: new Date('2025-04-14') },
  { url: 'SAM_3300.jpg', uploadTime: new Date('2025-07-08T13:57') },
  { url: 'SAM_3304.jpg', uploadTime: new Date('2025-07-09') },
  { url: 'SAM_0001.jpg', uploadTime: new Date('2025-07-10') },
  { url: 'SAM_0002.jpg', uploadTime: new Date('2025-07-10') },
  { url: 'SAM_0003.jpg', uploadTime: new Date('2025-07-10') }
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

function createPreview(photo, callback) {
  const img = new Image();
  img.src = photo.url;
  img.onload = () => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const scale = 0.25; // 25% от оригинала
    canvas.width = img.naturalWidth * scale;
    canvas.height = img.naturalHeight * scale;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    callback(canvas.toDataURL('image/jpeg', 0.6));
  };
}

// Функция форматирования даты в дд.мм.гггг
function formatDate(date) {
  const d = date.getDate().toString().padStart(2, '0');
  const m = (date.getMonth() + 1).toString().padStart(2, '0');
  const y = date.getFullYear();
  return `${d}.${m}.${y}`;
}


async function loadImageWithProgress(url, onProgress) {
  const response = await fetch(url);
  if (!response.body) throw new Error("Streaming не поддерживается");
  
  const contentLength = +response.headers.get("Content-Length");
  const reader = response.body.getReader();
  let received = 0;
  const chunks = [];

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    received += value.length;
    if (contentLength && onProgress) {
      onProgress(received / contentLength);
    }
  }

  const blob = new Blob(chunks);
  return URL.createObjectURL(blob);
}

async function renderPhotos(filter = '') {
  gallery.innerHTML = '';

  const filtered = photos
    .filter(p => {
      const dateObj = new Date(p.uploadTime);
      return !filter || formatDate(dateObj).startsWith(filter);
    })
    .sort((a, b) => new Date(b.uploadTime) - new Date(a.uploadTime));

  if (filtered.length === 0) {
    gallery.innerHTML = '<div class="empty-message">Ничего не найдено</div>';
    return;
  }

  // считаем количество колонок исходя из ширины галереи
  const galleryWidth = gallery.clientWidth;
  const columnWidth = 250 + 15; // ширина карточки + gap
  const columnCount = Math.max(1, Math.floor(galleryWidth / columnWidth));

  // создаём массив колонок
  const columns = Array.from({ length: columnCount }, () => []);

  // распределяем фото по колонкам слева направо
  filtered.forEach((photo, index) => {
    columns[index % columnCount].push(photo);
  });

  // рендерим построчно
  const rows = Math.ceil(filtered.length / columnCount);
  for (let row = 0; row < rows; row++) {
    const rowDiv = document.createElement('div');
    rowDiv.className = 'photo-row';
    for (let col = 0; col < columnCount; col++) {
      const photo = columns[col][row];
      if (photo) {
        const card = createCard(photo);
        rowDiv.appendChild(card.card);
        await loadPhoto(card);
      }
    }
    gallery.appendChild(rowDiv);
  }
}

function createCard(photo) {
  const dateObj = new Date(photo.uploadTime);
  const isoString = dateObj.toISOString();
  const hasTime = !isoString.endsWith('T00:00:00.000Z');
  const timeText = hasTime
    ? ` ${dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
    : '';

  const card = document.createElement('div');
  card.className = 'photo-card';
  card.innerHTML = `
    <div class="upload-time">Загрузка... ${formatDate(dateObj)}${timeText}</div>
    <div class="skeleton" style="aspect-ratio:4/3;"></div>
    <div class="progress-circle">
      <svg width="28" height="28">
        <circle r="12" cx="14" cy="14"></circle>
        <circle class="bar" r="12" cx="14" cy="14"></circle>
      </svg>
    </div>
  `;

  return { photo, card, dateObj, timeText };
}


async function loadPhoto({ photo, card, dateObj, timeText }) {
  return new Promise(resolve => {
    const infoBox = card.querySelector('.upload-time');
    const loader = card.querySelector('.bar');
    const progressCircle = card.querySelector('.progress-circle');
    const skeleton = card.querySelector('.skeleton');

    const radius = 12;
    const circumference = 2 * Math.PI * radius;
    loader.style.strokeDasharray = circumference;
    loader.style.strokeDashoffset = circumference;

    loadImageWithProgress(photo.url, progress => {
      const offset = circumference - progress * circumference;
      loader.style.strokeDashoffset = offset;
    }).then(objUrl => {
      const img = new Image();
      img.src = objUrl;
      img.alt = "Фото";
      img.className = "preview";
      img.loading = "lazy";
      img.dataset.full = photo.url;

      skeleton.replaceWith(img);

      img.onload = async () => {
        img.classList.add('loaded');
        progressCircle.remove();

        try {
          const response = await fetch(photo.url);
          const blob = await response.blob();
          const sizeMB = (blob.size / (1024 * 1024)).toFixed(1);
          infoBox.textContent =
            `${sizeMB} MB ${img.naturalWidth}x${img.naturalHeight} ${formatDate(dateObj)}${timeText}`;
        } catch {
          infoBox.textContent =
            `${img.naturalWidth}x${img.naturalHeight} ${formatDate(dateObj)}${timeText}`;
        }

        img.onclick = () => openModal(photo);
        
        resolve();
      };
    }).catch(() => {
      skeleton.style.background = "#999";
      progressCircle.remove();
      infoBox.textContent = `Ошибка загрузки ${formatDate(dateObj)}${timeText}`;
      resolve();
    });
  });
}


function openModal(photo) {
  currentPhoto = photo;
  modal.style.display = 'flex';
  modalImg.src = ""; 
  modalImg.classList.remove('loaded');

  const fullImg = new Image();
  fullImg.src = photo.url;
  fullImg.onload = () => {
    modalImg.src = fullImg.src;
    modalImg.classList.add('loaded');
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
