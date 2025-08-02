// ========== Constants ==========
const canvas = document.getElementById('editorCanvas');
const ctx = canvas.getContext('2d');
const frameOverlay = document.getElementById('frameOverlay');
const canvasContainer = document.getElementById('canvasContainer');
const photoInput = document.getElementById('photoInput');
const downloadBtn = document.getElementById('downloadBtn');
const resetBtn = document.getElementById('resetBtn');
const telegramBtn = document.getElementById('telegramBtn');
const supportBtn = document.getElementById('supportBtn');
const loadingIndicator = document.getElementById('loadingIndicator');

let img = null;
let imgData = {
  x: 0,
  y: 0,
  scale: 1,
  drag: false,
  lastX: 0,
  lastY: 0,
  lastDist: 0
};

const CANVAS_SIZE = 800; // Export at 800x800 for high quality

// ========== Utility Functions ==========
function showLoading() {
  if (loadingIndicator) {
    loadingIndicator.style.display = 'flex';
  }
}

function hideLoading() {
  if (loadingIndicator) {
    loadingIndicator.style.display = 'none';
  }
}

function showError(message) {
  alert(message);
  hideLoading();
}

function validateImageFile(file) {
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  if (!validTypes.includes(file.type)) {
    throw new Error('Please select a valid image file (JPEG, PNG, GIF, or WebP)');
  }
  
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    throw new Error('Image file is too large. Please select a file smaller than 10MB');
  }
}

// ========== Setup ==========
function resizeCanvasToDisplay() {
  try {
    // responsive size
    const rect = canvasContainer.getBoundingClientRect();
    canvas.width = CANVAS_SIZE;
    canvas.height = CANVAS_SIZE;
    canvas.style.width = rect.width + 'px';
    canvas.style.height = rect.height + 'px';
    frameOverlay.style.width = rect.width + 'px';
    frameOverlay.style.height = rect.height + 'px';
  } catch (error) {
    console.error('Error resizing canvas:', error);
  }
}

function resetState() {
  try {
    img = null;
    imgData = { x: 0, y: 0, scale: 1, drag: false, lastX: 0, lastY: 0, lastDist: 0 };
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    photoInput.value = '';
    hideLoading();
  } catch (error) {
    console.error('Error resetting state:', error);
    hideLoading();
  }
}

window.addEventListener('resize', resizeCanvasToDisplay);

document.addEventListener('DOMContentLoaded', () => {
  try {
    resizeCanvasToDisplay();
    draw();
  } catch (error) {
    console.error('Error initializing application:', error);
  }
});

// ========== Drawing ==========
function draw() {
  try {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (img) {
      // Draw user image
      const dispW = canvas.width;
      const dispH = canvas.height;

      const imgW = img.width * imgData.scale;
      const imgH = img.height * imgData.scale;

      const x = imgData.x;
      const y = imgData.y;

      ctx.save();
      ctx.drawImage(
        img,
        x - imgW / 2 + dispW / 2,
        y - imgH / 2 + dispH / 2,
        imgW,
        imgH
      );
      ctx.restore();
    }
    // The frame overlay is drawn by the <img> over the canvas in the DOM, not here.
  } catch (error) {
    console.error('Error drawing on canvas:', error);
  }
}

// ========== Image Upload ==========
photoInput.addEventListener('change', (e) => {
  if (!e.target.files.length) return;
  
  const file = e.target.files[0];
  
  try {
    validateImageFile(file);
    showLoading();
    
    const reader = new FileReader();
    
    reader.onerror = () => {
      showError('Error reading the selected file. Please try again.');
    };
    
    reader.onload = function(ev) {
      try {
        const image = new window.Image();
        
        image.onerror = () => {
          showError('Error loading the image. Please try a different file.');
        };
        
        image.onload = function() {
          try {
            img = image;
            // Fit image to canvas, center
            const scale = Math.max(
              CANVAS_SIZE / img.width,
              CANVAS_SIZE / img.height
            );
            imgData.scale = scale * 0.95; // Slightly smaller to allow manual zoom in
            imgData.x = 0;
            imgData.y = 0;
            draw();
            hideLoading();
          } catch (error) {
            showError('Error processing the image. Please try again.');
          }
        };
        
        image.src = ev.target.result;
      } catch (error) {
        showError('Error creating image object. Please try again.');
      }
    };
    
    reader.readAsDataURL(file);
  } catch (error) {
    showError(error.message);
  }
});

// ========== Canvas Manipulation (Touch + Mouse) ==========

let isDragging = false;
let lastPointer = {x: 0, y: 0};
let lastDist = null;

function getTouchPos(e) {
  try {
    const rect = canvas.getBoundingClientRect();
    let touch = (e.touches && e.touches[0]) || (e.changedTouches && e.changedTouches[0]);
    if (!touch) return {x:0, y:0};
    return {
      x: (touch.clientX - rect.left) * (canvas.width / rect.width),
      y: (touch.clientY - rect.top) * (canvas.height / rect.height)
    }
  } catch (error) {
    console.error('Error getting touch position:', error);
    return {x: 0, y: 0};
  }
}

canvasContainer.addEventListener('mousedown', (e) => {
  try {
    if (!img) return;
    isDragging = true;
    lastPointer = {
      x: (e.offsetX) * (canvas.width / canvas.offsetWidth),
      y: (e.offsetY) * (canvas.height / canvas.offsetHeight)
    };
    canvasContainer.style.cursor = 'grabbing';
  } catch (error) {
    console.error('Error handling mouse down:', error);
  }
});

window.addEventListener('mousemove', (e) => {
  try {
    if (!img || !isDragging) return;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvas.width / rect.width);
    const y = (e.clientY - rect.top) * (canvas.height / rect.height);
    imgData.x += (x - lastPointer.x);
    imgData.y += (y - lastPointer.y);
    lastPointer = {x, y};
    draw();
  } catch (error) {
    console.error('Error handling mouse move:', error);
  }
});

window.addEventListener('mouseup', () => {
  try {
    isDragging = false;
    canvasContainer.style.cursor = '';
  } catch (error) {
    console.error('Error handling mouse up:', error);
  }
});

canvasContainer.addEventListener('touchstart', (e) => {
  try {
    if (!img) return;
    if (e.touches.length === 1) {
      isDragging = true;
      let pos = getTouchPos(e);
      lastPointer = pos;
    } else if (e.touches.length === 2) {
      isDragging = false;
      lastDist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
    }
  } catch (error) {
    console.error('Error handling touch start:', error);
  }
});

canvasContainer.addEventListener('touchmove', (e) => {
  try {
    if (!img) return;
    if (e.touches.length === 1 && isDragging) {
      let pos = getTouchPos(e);
      imgData.x += (pos.x - lastPointer.x);
      imgData.y += (pos.y - lastPointer.y);
      lastPointer = pos;
      draw();
    } else if (e.touches.length === 2) {
      // Pinch to zoom
      let d = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      let scaleChange = d / lastDist;
      imgData.scale *= scaleChange;
      lastDist = d;
      draw();
      e.preventDefault();
    }
  } catch (error) {
    console.error('Error handling touch move:', error);
  }
});

canvasContainer.addEventListener('touchend', () => {
  try {
    isDragging = false;
    lastDist = null;
  } catch (error) {
    console.error('Error handling touch end:', error);
  }
});

// Zoom with mouse wheel
canvasContainer.addEventListener('wheel', (e) => {
  try {
    if (!img) return;
    e.preventDefault();
    const scaleFactor = (e.deltaY < 0) ? 1.07 : 0.93;
    imgData.scale *= scaleFactor;
    draw();
  } catch (error) {
    console.error('Error handling wheel zoom:', error);
  }
}, {passive: false});

// Keyboard controls (arrows move, + - zoom)
canvas.addEventListener('keydown', (e) => {
  try {
    if (!img) return;
    switch (e.key) {
      case 'ArrowUp': imgData.y -= 10; break;
      case 'ArrowDown': imgData.y += 10; break;
      case 'ArrowLeft': imgData.x -= 10; break;
      case 'ArrowRight': imgData.x += 10; break;
      case '+':
      case '=':
        imgData.scale *= 1.07; break;
      case '-':
      case '_':
        imgData.scale *= 0.93; break;
      default: return;
    }
    draw();
  } catch (error) {
    console.error('Error handling keyboard input:', error);
  }
});

// ========== Download ==========
downloadBtn.addEventListener('click', async () => {
  if (!img) {
    showError('Please upload an image first.');
    return;
  }
  
  try {
    showLoading();
    
    // Create export canvas
    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = CANVAS_SIZE;
    exportCanvas.height = CANVAS_SIZE;
    const exportCtx = exportCanvas.getContext('2d');

    // Draw image
    const imgW = img.width * imgData.scale;
    const imgH = img.height * imgData.scale;
    exportCtx.drawImage(
      img,
      imgData.x - imgW / 2 + CANVAS_SIZE / 2,
      imgData.y - imgH / 2 + CANVAS_SIZE / 2,
      imgW,
      imgH
    );

    // Draw the PNG frame overlay
    const overlayImg = new window.Image();
    overlayImg.crossOrigin = 'anonymous';
    
    overlayImg.onerror = () => {
      showError('Error loading the frame overlay. Please try again.');
    };
    
    overlayImg.onload = () => {
      try {
        exportCtx.globalAlpha = 1; // 100% transparency as requested
        exportCtx.drawImage(overlayImg, 0, 0, CANVAS_SIZE, CANVAS_SIZE);
        exportCtx.globalAlpha = 1;
        
        exportCanvas.toBlob((blob) => {
          try {
            if (!blob) {
              throw new Error('Failed to create image blob');
            }
            
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'graduation-frame.png';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            hideLoading();
          } catch (error) {
            showError('Error downloading the image. Please try again.');
          }
        }, 'image/png');
      } catch (error) {
        showError('Error creating the final image. Please try again.');
      }
    };
    
    overlayImg.src = frameOverlay.src;
  } catch (error) {
    showError('Error during export process. Please try again.');
  }
});

// ========== Reset ==========
resetBtn.addEventListener('click', () => {
  try {
    resetState();
    draw();
  } catch (error) {
    console.error('Error resetting:', error);
    showError('Error resetting the editor. Please refresh the page.');
  }
});

// ========== Telegram Bot ==========
telegramBtn.addEventListener('click', () => {
  try {
    window.open('https://t.me/Assiut61framebot', '_blank');
  } catch (error) {
    console.error('Error opening Telegram bot:', error);
    showError('Error opening Telegram bot. Please try again.');
  }
});

// ========== Support Button ==========
supportBtn.addEventListener('click', () => {
  try {
    window.open('https://t.me/Abdomahmood', '_blank');
  } catch (error) {
    console.error('Error opening support link:', error);
    showError('Error opening support link. Please try again.');
  }
});

// ========== Accessibility ==========
canvas.addEventListener('focus', () => {
  try {
    canvasContainer.style.boxShadow = '0 0 0 3px var(--accent)';
  } catch (error) {
    console.error('Error handling canvas focus:', error);
  }
});

canvas.addEventListener('blur', () => {
  try {
    canvasContainer.style.boxShadow = '';
  } catch (error) {
    console.error('Error handling canvas blur:', error);
  }
});

// ========== Frame Overlay Error Handling ==========
frameOverlay.addEventListener('error', () => {
  console.error('Error loading frame overlay image');
  showError('Error loading the graduation frame. Please refresh the page.');
});

frameOverlay.addEventListener('load', () => {
  console.log('Frame overlay loaded successfully');
});