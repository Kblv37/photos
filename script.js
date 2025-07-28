const grid = document.querySelector('.grid');
const loadMoreButton = document.getElementById('load-more');
const modal = document.getElementById('modal');
const modalImage = document.getElementById('modal-image');
const downloadLink = document.getElementById('download-link');
const closeButton = document.querySelector('.close');

let imagesLoaded = 0;
let allImages = [];
const imagesPerLoad = 12;


// Функция для форматирования даты
function formatDate(date) {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0'); // Месяцы начинаются с 0
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${day}.${month}.${year} ${hours}:${minutes}`;
}



// Функция для создания элемента изображения
function createImageElement(imageUrl, uploadTime) {
    const gridItem = document.createElement('div');
    gridItem.classList.add('grid-item');

    const img = document.createElement('img');
    img.src = imageUrl;
    img.alt = 'Фотография';

    // Время загрузки
    const uploadTimeElement = document.createElement('span');
    uploadTimeElement.classList.add('upload-time');
    uploadTimeElement.textContent = formatDate(uploadTime); // Используем функцию форматирования
    gridItem.appendChild(uploadTimeElement);


    // Обработчик клика для открытия модального окна
    img.addEventListener('click', () => {
        modalImage.src = imageUrl;
        downloadLink.href = imageUrl;
        modal.style.display = 'block';
    });

    gridItem.appendChild(img);

    return gridItem;
}



// Функция для загрузки изображений
function loadImages(amount) {
    const fragment = document.createDocumentFragment();
    for (let i = imagesLoaded; i < Math.min(imagesLoaded + amount, allImages.length); i++) {
        const image = allImages[i];
        const gridItem = createImageElement(image.url, image.uploadTime);
        fragment.appendChild(gridItem);
    }

    grid.appendChild(fragment);
    imagesLoaded = Math.min(imagesLoaded + amount, allImages.length);

    if (imagesLoaded === allImages.length) {
        loadMoreButton.style.display = 'none';
    } else {
        loadMoreButton.style.display = 'block';
    }
}


// Массив с данными об изображениях (замени своими)
allImages = [
    { url: 'SAM_3246.jpg', uploadTime: new Date() },
];

// Загружаем первые изображения при загрузке страницы
loadImages(imagesPerLoad);


// Обработчик клика на кнопку "Загрузить еще"
loadMoreButton.addEventListener('click', () => {
    loadImages(imagesPerLoad);
});

// Закрытие модального окна
closeButton.addEventListener('click', () => {
    modal.style.display = 'none';
});

// Закрытие модального окна при клике вне модального окна
window.addEventListener('click', (event) => {
    if (event.target == modal) {
        modal.style.display = 'none';
    }
});
