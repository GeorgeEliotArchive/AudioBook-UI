// --- DOM Element References for Widget ---
const audioWidget = document.getElementById('audioWidget');
const audioWidgetHeader = document.getElementById('audioWidgetHeader');
const audioPlayer = document.getElementById('audioPlayer');
const playPauseBtn = document.getElementById('playPauseBtn');
const rewindBtn = document.getElementById('rewindBtn');
const fastForwardBtn = document.getElementById('fastForwardBtn');
const audioBookTitleEl = document.getElementById('audioBookTitle');
const audioChapterTitleEl = document.getElementById('audioChapterTitle');
const seekBar = document.getElementById('seekBar');
const audioSourceDropdown = document.getElementById('audioSource'); // Added reference

// --- Widget State Variables ---
let isDragging = false;
let offsetX, offsetY;

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
    if (!audioPlayer || audioPlayer.paused || audioPlayer.ended) {
        playPauseBtn.textContent = '▶'; playPauseBtn.title = 'Play';
    } else {
        playPauseBtn.textContent = '❚❚'; playPauseBtn.title = 'Pause';
    }
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

function closeAudioWidget() {
    if (audioPlayer && !audioPlayer.paused) {
        audioPlayer.pause();
    }
    if (audioWidget) {
        audioWidget.style.display = 'none';
    }
}

// --- Event Listeners for Audio ---
if (audioPlayer) {
    audioPlayer.addEventListener('play', updatePlayPauseButton);
    audioPlayer.addEventListener('pause', updatePlayPauseButton);
    audioPlayer.addEventListener('ended', updatePlayPauseButton);
    audioPlayer.addEventListener('timeupdate', updateSeekBar);
    audioPlayer.addEventListener('loadedmetadata', updateSeekBar);
    audioPlayer.addEventListener('error', (e) => { /* ... existing error handling ... */ });
    audioPlayer.addEventListener('canplay', () => { /* ... existing canplay handling ... */ });
    audioPlayer.addEventListener('loadstart', () => { /* ... existing loadstart handling ... */ });
}
if (seekBar) {
    seekBar.addEventListener('input', seekAudio);
}

// --- Drag Functionality ---
if (audioWidgetHeader && audioWidget) {
    audioWidgetHeader.addEventListener('mousedown', (e) => {
      if (e.target.closest('button, input[type="range"], select, label')) return; // Prevent drag on controls/select
      isDragging = true;
      offsetX = e.clientX - audioWidget.offsetLeft;
      offsetY = e.clientY - audioWidget.offsetTop;
      audioWidget.style.cursor = 'grabbing';
      audioWidgetHeader.style.cursor = 'grabbing';
      window.addEventListener('mousemove', onDragMouseMove);
      window.addEventListener('mouseup', onDragMouseUp);
    });
}
function onDragMouseMove(e) {
  if (!isDragging || !audioWidget) return;

  e.preventDefault();

  // New position of the widget
  const x = e.clientX - offsetX;
  const y = e.clientY - offsetY;

  // Apply position
  audioWidget.style.left = `${x}px`;
  audioWidget.style.top = `${y}px`;
}

function onDragMouseUp() {
  if (!isDragging) return;
  isDragging = false;

  // Reset cursors
  if (audioWidget) {
    audioWidget.style.cursor = '';
  }
  if (audioWidgetHeader) {
    audioWidgetHeader.style.cursor = 'grab';
  }

  // Remove window listeners
  window.removeEventListener('mousemove', onDragMouseMove);
  window.removeEventListener('mouseup', onDragMouseUp);
}

// --- Resize Functionality --- (Native CSS used)

console.log("Audio Widget JS loaded.");