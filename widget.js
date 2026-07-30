// --- DOM Element References for Widget ---
const audioWidget = document.getElementById('audioWidget');
const audioWidgetHeader = document.getElementById('audioWidgetHeader');
const audioPlayer = document.getElementById('audioPlayer');
const playPauseBtn = document.getElementById('playPauseBtn');
const rewindBtn = document.getElementById('rewindBtn');
const fastForwardBtn = document.getElementById('fastForwardBtn');
const seekBar = document.getElementById('seekBar');
const miniToggleBtn = document.getElementById('miniToggleBtn');
const restoreBtn = document.getElementById('restoreBtn');

// --- Widget State Variables ---
let isDragging = false;
let offsetX = 0;
let offsetY = 0;
let normalWidgetSize = null;
let activePointerId = null;
let dragStartX = 0;
let dragStartY = 0;
let hasDragged = false;
let suppressNextControlClick = false;

// --- Mini-mode helpers ---
function enterMiniMode() {
  if (!audioWidget || audioWidget.classList.contains('mini-mode')) return;

  const bounds = audioWidget.getBoundingClientRect();
  normalWidgetSize = {
    width: `${bounds.width}px`,
    height: `${bounds.height}px`
  };

  audioWidget.classList.add('mini-mode');
  // Browser resize handles leave a used width/height that can win over the
  // class rules. Inline mini dimensions make the bubble deterministic.
  audioWidget.style.width = '60px';
  audioWidget.style.height = '60px';
}

function exitMiniMode() {
  if (!audioWidget) return;
  audioWidget.classList.remove('mini-mode');

  if (normalWidgetSize) {
    audioWidget.style.width = normalWidgetSize.width;
    audioWidget.style.height = normalWidgetSize.height;
  } else {
    audioWidget.style.removeProperty('width');
    audioWidget.style.removeProperty('height');
  }
  window.requestAnimationFrame(updateTitleOverflow);
}

// Scroll long book/chapter labels, but leave short labels centered and still.
const audioInfo = document.querySelector('.audio-info');
const audioInfoTrack = document.querySelector('.audio-info-track');

function updateTitleOverflow() {
  if (!audioInfo || !audioInfoTrack) return;
  audioInfo.classList.remove('is-overflowing');
  const overflows = audioInfoTrack.scrollWidth > audioInfo.clientWidth;
  audioInfo.classList.toggle('is-overflowing', overflows);
}

if (audioInfo && audioInfoTrack) {
  const titleObserver = new MutationObserver(() => {
    window.requestAnimationFrame(updateTitleOverflow);
  });
  titleObserver.observe(audioInfoTrack, { childList: true, subtree: true, characterData: true });
  window.addEventListener('resize', updateTitleOverflow);
  window.requestAnimationFrame(updateTitleOverflow);
}

// --- Audio Control Functions ---
function togglePlayPause() {
  if (!audioPlayer || !audioPlayer.src || audioPlayer.readyState < 1) return;
  if (audioPlayer.paused || audioPlayer.ended) {
    audioPlayer.play().catch(error => console.error("Audio play failed:", error));
  } else {
    audioPlayer.pause();
  }
}

function updatePlayPauseButton() {
  if (!playPauseBtn) return;
  const isPaused = !audioPlayer || audioPlayer.paused || audioPlayer.ended;

  playPauseBtn.textContent = isPaused ? '▶' : '❚❚';
  const actionLabel = isPaused ? 'Play' : 'Pause';
  playPauseBtn.title = actionLabel;
  playPauseBtn.setAttribute('aria-label', actionLabel);
  playPauseBtn.dataset.tooltip = actionLabel;
}

function rewindAudio(seconds) {
  if (!audioPlayer || !audioPlayer.src || isNaN(audioPlayer.duration)) return;
  audioPlayer.currentTime = Math.max(0, audioPlayer.currentTime - seconds);
}

function forwardAudio(seconds) {
  if (!audioPlayer || !audioPlayer.src || isNaN(audioPlayer.duration)) return;
  audioPlayer.currentTime = Math.min(audioPlayer.duration, audioPlayer.currentTime + seconds);
}

function updateSeekBar() {
  if (!seekBar || !audioPlayer) return;
  if (!isNaN(audioPlayer.duration)) {
    seekBar.value = (audioPlayer.currentTime / audioPlayer.duration) * 100;
  } else {
    seekBar.value = 0;
  }
}

function seekAudio() {
  if (!seekBar || !audioPlayer || isNaN(audioPlayer.duration)) return;
  audioPlayer.currentTime = (seekBar.value / 100) * audioPlayer.duration;
}

// --- Event Listeners for Audio ---
if (audioPlayer) {
  audioPlayer.addEventListener('play', updatePlayPauseButton);
  audioPlayer.addEventListener('pause', updatePlayPauseButton);
  audioPlayer.addEventListener('ended', updatePlayPauseButton);
  audioPlayer.addEventListener('timeupdate', updateSeekBar);
  audioPlayer.addEventListener('loadedmetadata', updateSeekBar);

}

if (seekBar) {
  seekBar.addEventListener('input', seekAudio);
}

if (miniToggleBtn) {
  miniToggleBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    enterMiniMode();
  });
}

if (restoreBtn) {
  restoreBtn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    exitMiniMode();
  });
}

// --- Drag Functionality (mouse, touch, and stylus) ---
function beginWidgetDrag(e) {
  if (!audioWidget || !e.isPrimary || (e.pointerType === 'mouse' && e.button !== 0)) return;

  const isMini = audioWidget.classList.contains('mini-mode');
  if (!isMini && !e.target.closest('#audioWidgetHeader')) return;
  if (!isMini && e.target.closest('button, input, select, label')) return;
  if (isMini && e.target.closest('#restoreBtn')) return;

  const bounds = audioWidget.getBoundingClientRect();
  activePointerId = e.pointerId;
  dragStartX = e.clientX;
  dragStartY = e.clientY;
  offsetX = e.clientX - bounds.left;
  offsetY = e.clientY - bounds.top;
  hasDragged = false;
  isDragging = true;

  // Move with left/top coordinates after the first drag, regardless of the
  // initial top/right CSS positioning.
  audioWidget.style.left = `${bounds.left}px`;
  audioWidget.style.top = `${bounds.top}px`;
  audioWidget.style.right = 'auto';
  audioWidget.style.bottom = 'auto';
  audioWidget.setPointerCapture(e.pointerId);
}

function moveWidget(e) {
  if (!isDragging || !audioWidget || e.pointerId !== activePointerId) return;

  const distance = Math.hypot(e.clientX - dragStartX, e.clientY - dragStartY);
  if (!hasDragged && distance < 5) return;

  hasDragged = true;
  e.preventDefault();

  const maxX = Math.max(0, window.innerWidth - audioWidget.offsetWidth);
  const maxY = Math.max(0, window.innerHeight - audioWidget.offsetHeight);
  const x = Math.min(maxX, Math.max(0, e.clientX - offsetX));
  const y = Math.min(maxY, Math.max(0, e.clientY - offsetY));

  audioWidget.style.left = `${x}px`;
  audioWidget.style.top = `${y}px`;
  audioWidget.style.cursor = 'grabbing';
}

function endWidgetDrag(e) {
  if (!isDragging || !audioWidget || e.pointerId !== activePointerId) return;

  if (audioWidget.hasPointerCapture(e.pointerId)) {
    audioWidget.releasePointerCapture(e.pointerId);
  }
  suppressNextControlClick = hasDragged;
  if (hasDragged) {
    window.setTimeout(() => {
      suppressNextControlClick = false;
    }, 0);
  }
  isDragging = false;
  activePointerId = null;
  audioWidget.style.cursor = '';
}

if (audioWidget) {
  audioWidget.addEventListener('pointerdown', beginWidgetDrag);
  audioWidget.addEventListener('pointermove', moveWidget);
  audioWidget.addEventListener('pointerup', endWidgetDrag);
  audioWidget.addEventListener('pointercancel', endWidgetDrag);
  audioWidget.addEventListener('click', (e) => {
    if (!suppressNextControlClick) return;
    suppressNextControlClick = false;
    e.preventDefault();
    e.stopImmediatePropagation();
  }, true);
}
document.addEventListener("DOMContentLoaded", () => {
    const isMobileUA = /Android|iPhone|iPad|iPod|Opera Mini|IEMobile/i.test(navigator.userAgent);
    const isMobileScreen = window.matchMedia("(max-width: 768px)").matches;

    if (isMobileUA || isMobileScreen) {
        // Auto-switch to mini mode when mobile device detected
        enterMiniMode();
    }
});
