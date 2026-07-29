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

// --- Drag Functionality ---

// Normal mode: drag by header
if (audioWidgetHeader && audioWidget) {
  audioWidgetHeader.addEventListener('mousedown', (e) => {
    // Don't start drag when interacting with controls
    if (e.target.closest('button, input[type="range"], select, label')) return;

    isDragging = true;
    offsetX = e.clientX - audioWidget.offsetLeft;
    offsetY = e.clientY - audioWidget.offsetTop;

    audioWidget.style.cursor = 'grabbing';
    audioWidgetHeader.style.cursor = 'grabbing';

    window.addEventListener('mousemove', onDragMouseMove);
    window.addEventListener('mouseup', onDragMouseUp);
  });
}

// Mini mode: drag by the bubble itself (avoid play/restore clicks)
if (audioWidget) {
  audioWidget.addEventListener('mousedown', (e) => {
    if (!audioWidget.classList.contains('mini-mode')) return;

    // Still avoid dragging when clicking the buttons themselves
    if (e.target.closest('button, input[type="range"], select, label')) return;

    isDragging = true;
    offsetX = e.clientX - audioWidget.offsetLeft;
    offsetY = e.clientY - audioWidget.offsetTop;

    audioWidget.style.cursor = 'grabbing';

    window.addEventListener('mousemove', onDragMouseMove);
    window.addEventListener('mouseup', onDragMouseUp);
  });
}

function onDragMouseMove(e) {
  if (!isDragging || !audioWidget) return;

  e.preventDefault();

  const x = e.clientX - offsetX;
  const y = e.clientY - offsetY;

  audioWidget.style.left = `${x}px`;
  audioWidget.style.top = `${y}px`;
}

function onDragMouseUp() {
  if (!isDragging) return;
  isDragging = false;

  if (audioWidget) {
    audioWidget.style.cursor = '';
  }
  if (audioWidgetHeader) {
    audioWidgetHeader.style.cursor = 'grab';
  }

  window.removeEventListener('mousemove', onDragMouseMove);
  window.removeEventListener('mouseup', onDragMouseUp);
}
document.addEventListener("DOMContentLoaded", () => {
    const isMobileUA = /Android|iPhone|iPad|iPod|Opera Mini|IEMobile/i.test(navigator.userAgent);
    const isMobileScreen = window.matchMedia("(max-width: 768px)").matches;

    if (isMobileUA || isMobileScreen) {
        // Auto-switch to mini mode when mobile device detected
        enterMiniMode();
    }
});
