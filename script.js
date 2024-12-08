const canvas = document.getElementById('memeCanvas');
const ctx = canvas.getContext('2d');
const memeText = document.getElementById('memeText');
const uploadImage = document.getElementById('uploadImage');
const resetButton = document.getElementById('resetButton');
const downloadButton = document.getElementById('downloadButton');
const scaleSlider = document.getElementById('scaleSlider');
const scaleValue = document.getElementById('scaleValue');

const baseImage = new Image();
baseImage.src = 'base.jpg';

let uploadedImage = null;
let uploadedImageX = 30;
let uploadedImageY = 1000;
let uploadedImageWidth = 0;
let uploadedImageHeight = 0;
let isDragging = false;
let dragStartX = 0;
let dragStartY = 0;
let imageScale = 2; // Initial scale factor

// Text bounding box dimensions
const TEXT_AREA_START_X = 20;
const TEXT_AREA_START_Y = 700;
const TEXT_AREA_END_X = 660;
const TEXT_AREA_END_Y = 950;
const TEXT_AREA_WIDTH = TEXT_AREA_END_X - TEXT_AREA_START_X;
const TEXT_AREA_HEIGHT = TEXT_AREA_END_Y - TEXT_AREA_START_Y;

function wrapTextToArea(text, fontSize, areaWidth) {
    const words = text.split(' ');
    const lines = [];
    let currentLine = '';

    ctx.font = `${fontSize}px Arial`;

    words.forEach((word) => {
        const testLine = currentLine + word + ' ';
        const testWidth = ctx.measureText(testLine).width;
        if (testWidth > areaWidth && currentLine !== '') {
            lines.push(currentLine);
            currentLine = word + ' ';
        } else {
            currentLine = testLine;
        }
    });

    if (currentLine) {
        lines.push(currentLine);
    }

    return lines;
}

function fitTextToArea(text, initialFontSize, areaWidth, areaHeight) {
    let fontSize = initialFontSize;
    let lines;
    let lineHeight;

    do {
        ctx.font = `${fontSize}px Arial`;
        lines = wrapTextToArea(text, fontSize, areaWidth);
        lineHeight = fontSize + 10;
        if (lines.length * lineHeight <= areaHeight) {
            break;
        }
        fontSize--;
    } while (fontSize > 10);

    return { fontSize, lines };
}

function drawMeme() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw base image
    ctx.drawImage(baseImage, 0, 0, canvas.width, canvas.height);

    // Draw uploaded image
    if (uploadedImage) {
        const scaledWidth = uploadedImageWidth * imageScale;
        const scaledHeight = uploadedImageHeight * imageScale;
        ctx.drawImage(uploadedImage, uploadedImageX, uploadedImageY, scaledWidth, scaledHeight);
    }

    // Draw text within the bounding area
    const text = memeText.value;
    const { fontSize, lines } = fitTextToArea(text, 48, TEXT_AREA_WIDTH, TEXT_AREA_HEIGHT);

    const lineHeight = fontSize + 10;
    const totalTextHeight = lines.length * lineHeight;
    let startY = TEXT_AREA_START_Y + (TEXT_AREA_HEIGHT - totalTextHeight) / 2;

    lines.forEach((line) => {
        const textX = TEXT_AREA_START_X + TEXT_AREA_WIDTH / 2;

        // Draw shadow (text outline)
        ctx.font = `${fontSize}px Arial`;
        ctx.lineWidth = 8; // Thickness of the outline
        ctx.strokeStyle = 'black';
        ctx.textAlign = 'center';
        ctx.strokeText(line, textX, startY);

        // Draw main text
        ctx.fillStyle = 'white';
        ctx.fillText(line, textX, startY);

        startY += lineHeight;
    });
}

function isMouseOnImage(x, y) {
    const scaledWidth = uploadedImageWidth * imageScale;
    const scaledHeight = uploadedImageHeight * imageScale;
    return (
        x >= uploadedImageX &&
        x <= uploadedImageX + scaledWidth &&
        y >= uploadedImageY &&
        y <= uploadedImageY + scaledHeight
    );
}

function handleDragStart(x, y) {
    if (uploadedImage && isMouseOnImage(x, y)) {
        isDragging = true;
        dragStartX = x - uploadedImageX;
        dragStartY = y - uploadedImageY;
    }
}

function handleDragMove(x, y) {
    if (isDragging) {
        uploadedImageX = x - dragStartX;
        uploadedImageY = y - dragStartY;
        drawMeme();
    }
}

function handleDragEnd() {
    isDragging = false;
}

baseImage.onload = drawMeme;

memeText.addEventListener('input', drawMeme);

uploadImage.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = () => {
            uploadedImage = new Image();
            uploadedImage.onload = () => {
                const aspectRatio = uploadedImage.width / uploadedImage.height;
                uploadedImageWidth = 200; // Default width
                uploadedImageHeight = uploadedImageWidth / aspectRatio;
                drawMeme();
            };
            uploadedImage.src = reader.result;
        };
        reader.readAsDataURL(file);
    }
});

scaleSlider.addEventListener('input', (e) => {
    imageScale = e.target.value;
    drawMeme();
});

canvas.addEventListener('mousedown', (e) => {
    const rect = canvas.getBoundingClientRect();
    const mouseX = (e.clientX - rect.left) * (canvas.width / rect.width);
    const mouseY = (e.clientY - rect.top) * (canvas.width / rect.width);
    handleDragStart(mouseX, mouseY);
});

canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    const mouseX = (e.clientX - rect.left) * (canvas.width / rect.width);
    const mouseY = (e.clientY - rect.top) * (canvas.width / rect.width);
    handleDragMove(mouseX, mouseY);
});

canvas.addEventListener('mouseup', handleDragEnd);
canvas.addEventListener('mouseleave', handleDragEnd);

// Add touch events for mobile devices
canvas.addEventListener('touchstart', (e) => {
    e.preventDefault(); // Prevent scrolling while interacting
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    const touchX = (touch.clientX - rect.left) * (canvas.width / rect.width);
    const touchY = (touch.clientY - rect.top) * (canvas.height / rect.height);
    handleDragStart(touchX, touchY);
});

canvas.addEventListener('touchmove', (e) => {
    e.preventDefault(); // Prevent scrolling while dragging
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    const touchX = (touch.clientX - rect.left) * (canvas.width / rect.width);
    const touchY = (touch.clientY - rect.top) * (canvas.height / rect.height);
    handleDragMove(touchX, touchY);
});

canvas.addEventListener('touchend', handleDragEnd);
canvas.addEventListener('touchcancel', handleDragEnd);

resetButton.addEventListener('click', () => {
    memeText.value = '';
    uploadedImage = null;
    uploadedImageX = 30;
    uploadedImageY = 1000;
    uploadedImageWidth = 0;
    uploadedImageHeight = 0;
    imageScale = 2;
    scaleSlider.value = 2;
    drawMeme();
});

downloadButton.addEventListener('click', () => {
    const link = document.createElement('a');
    link.download = '$CHANT-meme.jpg';
    link.href = canvas.toDataURL('image/jpeg');
    link.click();
});
