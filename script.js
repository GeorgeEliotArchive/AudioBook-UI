// --- Constants ---
const GITHUB_USER = 'GeorgeEliotArchive'; // Owner of BOTH repositories

// --- Text Repository Details ---
const TEXT_GITHUB_REPO = 'allworks';
const TEXT_GITHUB_BRANCH = 'main'; // <<< VERIFY default branch for 'allworks' repo on GitHub
// Use raw.githubusercontent.com for text files
const BASE_TEXT_URL = `https://raw.githubusercontent.com/${GITHUB_USER}/${TEXT_GITHUB_REPO}/${TEXT_GITHUB_BRANCH}/teiEncode/`;

// --- Audio Repository Details ---
const AUDIO_GITHUB_REPO = 'AudioBooks';
const AUDIO_GITHUB_BRANCH = 'main'; // <<< VERIFY default branch for 'AudioBooks' repo on GitHub
// --- TRY USING raw.githubusercontent.com for AUDIO ---
const BASE_LIBRIVOX_AUDIO_URL = `https://raw.githubusercontent.com/${GITHUB_USER}/${AUDIO_GITHUB_REPO}/${AUDIO_GITHUB_BRANCH}/LibriVox/`;
const BASE_TTS_AUDIO_URL = `https://raw.githubusercontent.com/${GITHUB_USER}/${AUDIO_GITHUB_REPO}/${AUDIO_GITHUB_BRANCH}/TTS/`;

const LIBRIVOX_A = false // Only one version
const LIBRIVOX_AB = true // Two versions
// --- Book Database ---
// name is the book title
// code is shorthand of book title used by audio files
// xml is the xml file already url encoded
// tts is the folder used for audio files on both the tts and librivox side
// vox is null when there is no librivox audio, vox is LIBRIVOX_A when only one version of the audio files exist, vox is LIBRIVOX_AB when two audio file verions exist
let bookData = [
{
  name: "Janet's Repentance",
  code: "JR",
  xml: 'Janet\'s%20Repentance.xml', 
  tts: 'Janet\'s%20Repentance',
  vox: null
},
{
  name: "Mr. Gilfil's Love Story",
  code: "MG",
  xml: 'Mr.Gilfil\'s%20Love%20Story.xml',
  tts: 'Mr.%20Gilfil\'s%20Love%20Story',
  vox: null
},
{
  name: "The Sad Fortunes of the Reverend Amos Barton",
  code: "AM",
  xml: 'The%20Sad%20Fortunes%20of%20the%20Reverend%20Amos%20Barton.xml',
  tts: 'Amos%20Barton',
  vox: null
},
{
  name: "Daniel Deronda",
  code: "DD",
  xml: 'Daniel_Deronda_refine_v1.xml',
  tts: 'Daniel%20Deronda',
  vox: LIBRIVOX_A
},
{
  name: "Brother Jacob",
  code: "BJ",
  xml: 'Brother%20Jacob_refine_v1.xml',
  tts: 'Brother%20Jacob',
  vox: LIBRIVOX_A
},
{
  name: "Adam Bede",
  code: "AB",
  xml: 'Adam%20Bede_refine_v1.1.xml',
  tts: 'Adam%20Bede',
  vox: LIBRIVOX_AB
},
{
  name: "Impressions of Theophrastus Such",
  code: "TS",
  xml: 'Impressions%20of%20Theophrastus%20Such.xml',
  tts: 'Theophrastus%20Such',
  vox: LIBRIVOX_AB
}, 
{
  name: "Felix Holt, The Radical",
  code: "FH",
  xml: 'Felix%20Holt%2C%20the%20Radical_refine_v1.xml', 
  tts: 'Felix%20Holt',
  vox: LIBRIVOX_A
},
{
  name: "Romola",
  code: "RM",
  xml: 'Romola_refine_v1.xml',
  tts: 'Romola',
  vox: LIBRIVOX_A
},
{
  name: "The Mill on the Floss",
  code: "MF",
  xml: 'The%20Mill%20on%20the%20Floss.xml', 
  tts: 'The%20Mill%20on%20the%20Floss',
  vox: LIBRIVOX_AB
},
{
  name: "Silas Marner",
  code: "SM",
  xml: 'Silas%20Marner.xml',
  tts: 'Silas%20Marner',
  vox: LIBRIVOX_AB  
},
{
  name: "Middlemarch",
  code: "MM",
  xml: 'Middlemarch_refine_v1.xml',
  tts: 'Middlemarch',
  vox: LIBRIVOX_A
},
{
  name: "Lifted Veil",
  code: "LV",
  xml: 'liftedVeil.xml',
  tts: 'The%20Lifted%20Veil',
  vox: null
}
];

// --- Global State Variables ---
let currentUrl = '';
let currentIndex = -1;
let currentChapter = '';
let currentChapterNo = -1;
let xmlDoc = '';
let selectionType = 0;
let currentAudioSource = localStorage.getItem('ge_audio_source') || 'librivox'; // Default to librivox, load preference

const nsResolver = function(prefix) {
  var ns = {
    'xml': 'http://www.w3.org/XML/1998/namespace'
  };
  return ns[prefix] || null;
};

// --- Core UI Functions ---
function toggleNav() {
  const sidebar = document.getElementById("mySidebar");
  const toggleButton = document.querySelector(".openbtn");
  const main = document.getElementById("main");

  if (!sidebar || !toggleButton || !main) return;

  // Check window width and adjust sidebar width
  const screenWidth = window.innerWidth;
  console.log(screenWidth);
  const sidebarWidth = screenWidth < 320 ? screenWidth - 30 + "px" : "350px";

  sidebar.style.width = sidebarWidth;
  
  // Toggle sidebar
  sidebar.classList.toggle("open");
  toggleButton.classList.toggle("open");

  // Adjust main margin dynamically
  main.style.marginLeft = sidebar.classList.contains("open") ? sidebarWidth : "0px";

  // Adjust button position dynamically
  toggleButton.style.transform = sidebar.classList.contains("open") ? `translateX(${sidebarWidth})` : "translateX(0)";
}


function isDigit(char) {
    return /^[0-9]$/.test(char);
}

function extractNumber(id) {
    let match = id.match(/\d+/);
    return match ? parseInt(match[0], 10) : null;
}

async function loadBooks(index) {
    currentChapter = '';
    if (index < 0 || index >= bookData.length) {
        console.error("Invalid index provided.");
        return;
    }
    currentIndex = index;
    let fetchUrl = BASE_TEXT_URL + bookData[index].xml;
    try {
        let response = await fetch(fetchUrl);
        if (!response.ok) {
            throw new Error(`Failed to fetch XML file: ${response.status}`);
        }

        let xmlText = await response.text();
        parseXML(xmlText);
    } catch (error) {
        console.error("Error fetching XML:", error);
    }
}

function loadDownloads(mainContent, chapterId) {
  // Create a container for the columns
  let chapterContainer = document.createElement("div");
  chapterContainer.style.display = "flex";
  chapterContainer.style.justifyContent = "space-between";
  chapterContainer.style.marginBottom = "5px";

  // Create the Librivox column
  let librivoxColumn = document.createElement("div");
  librivoxColumn.style.flex = "1";

  if (bookData[currentIndex].vox) {
    // If `vox` is **true**, show two download buttons
    let librivoxTitle = document.createElement("h4");
    librivoxTitle.textContent = "Librivox";
    librivoxTitle.style.marginBottom = "0px";
    
    let librivoxButtonA = document.createElement("button");
    librivoxButtonA.textContent = "Download A";
    librivoxButtonA.onclick = () => downloadAudioFile(chapterId, false, "A");
    librivoxButtonA.style.marginRight = "5px";

    let librivoxButtonB = document.createElement("button");
    librivoxButtonB.textContent = "Download B";
    librivoxButtonB.onclick = () => downloadAudioFile(chapterId, false, "B");

    librivoxColumn.appendChild(librivoxTitle);
    librivoxColumn.appendChild(librivoxButtonA);
    librivoxColumn.appendChild(librivoxButtonB);
  } else {
    // If `vox` is **false**, show only one download button
    let librivoxTitle = document.createElement("h4");
    librivoxTitle.textContent = "Librivox";
    librivoxTitle.style.marginBottom = "0px";

    let librivoxButton = document.createElement("button");
    librivoxButton.textContent = "Download";
    librivoxButton.onclick = () => downloadAudioFile(chapterId);

    librivoxColumn.appendChild(librivoxTitle);
    librivoxColumn.appendChild(librivoxButton);
  }

  // Create the Text-to-Speech column
  let ttsColumn = document.createElement("div");
  ttsColumn.style.flex = "1";
  let ttsTitle = document.createElement("h4");
  ttsTitle.textContent = "Text-to-Speech";
  ttsTitle.style.marginBottom = "0px";
  let ttsButton = document.createElement("button");
  ttsButton.textContent = "Download";
  ttsButton.onclick = () => downloadAudioFile(chapterId, true);

  ttsColumn.appendChild(ttsTitle);
  ttsColumn.appendChild(ttsButton);
  
  if(bookData[currentIndex].vox === null)
    librivoxColumn.style.display = "none";
  // Append columns
  chapterContainer.appendChild(librivoxColumn);
  chapterContainer.appendChild(ttsColumn);

  // Append container AFTER chapter title
  mainContent.appendChild(chapterContainer);
}

function parseXML(xmlString) {
    let parser = new DOMParser();
    xmlDoc = parser.parseFromString(xmlString, "text/xml");

    const sidebar = document.getElementById("mySidebar");
    sidebar.innerHTML = `<div class="breadcrumb" id="breadcrumb"><span onclick="goToIndex()">Index</span> > <span onclick="loadBooks(${currentIndex})">${bookData[currentIndex].name}</span></div>`;
    let books = xmlDoc.querySelectorAll('div[type="toc"] > list > ref');
    let bookList = xmlDoc.querySelectorAll(`div[type="toc"] > list > list`);
    selectionType = 0;
    if(books.length === 0)
    {
        books = xmlDoc.querySelectorAll('div[type="toc"] > list > item > ref');
        bookList = xmlDoc.querySelectorAll(`div[type="toc"] > list > item > list`);
        selectionType = 1;
    }
    
    const mainContent = document.getElementById("mainContent");
    mainContent.innerHTML = `<h2>${bookData[currentIndex].name} Audio Files</h2>`;
        
    if (books[0].innerHTML.includes("ook") || books[0].innerHTML.includes("art")) {
        // Books exist: Load Books first
        books.forEach(book => {
            let bookTitle = book.textContent;
            let bookId = book.getAttribute("target");
            if(isDigit(bookId[bookId.length-1]))
            {
              bookId = bookId.charAt(1).toUpperCase() + bookId.substring(2,bookId.length-1) + " " + bookId[bookId.length-1];
              chapters = bookList[extractNumber(bookId) - 1].querySelectorAll('ref');
            }
            else
            {
              bookId = bookId.charAt(1).toUpperCase() + bookId.substring(2,bookId.length);
              chapters = bookList[bookList.length-1].querySelectorAll('ref');
            }

            let bookElement = document.createElement("a");
            bookElement.href = "#";
            bookElement.textContent = bookTitle;
            bookElement.onclick = function () {
                loadChapters(bookId);
            };
            sidebar.appendChild(bookElement);
            bookElement = document.createElement("h2")
            bookElement.textContent = bookTitle;
            bookElement.style.marginBottom = "-10px";
            mainContent.appendChild(bookElement);
            
            //console.log(books);
            chapters.forEach(chapter => {
              let chapterTitle;
              let chapterId = chapter.getAttribute("target").replace("#", "");

              try {
                  chapterTitle = xmlDoc.evaluate(`//*[@xml:id="${chapterId}"]`, xmlDoc, nsResolver, XPathResult.FIRST_ORDERED_NODE_TYPE, null)
                      .singleNodeValue.querySelector("head").textContent;
              } catch (e) {
                  chapterTitle = chapter.textContent;
              }

              // Create the chapter title element
              let chapterElement = document.createElement("h3");
              chapterElement.style.marginBottom = "-20px";
              chapterElement.textContent = chapterTitle;
              
              loadDownloads(mainContent, chapterId);
            });
        });
    } else {
        // No Books: Load Chapters directly
        loadChapters();
    }
}

function loadChapters(bookId = null) {
    const sidebar = document.getElementById("mySidebar");
    sidebar.innerHTML = `<div class="breadcrumb" id="breadcrumb"><span onclick="goToIndex()">Index</span> > <span onclick="loadBooks(${currentIndex})">${bookData[currentIndex].name}</span></div>`;
    const crumb = document.getElementById("breadcrumb");
    
    const mainContent = document.getElementById("mainContent");
  
    //console.log("Book ID:", bookId);
    //console.log("XML Document:", xmlDoc);

    let chapters;

    if (bookId) {
        mainContent.innerHTML = `<h1>${bookData[currentIndex].name} ${bookId} Audio Files</h1>`;
        crumb.innerHTML += ` > <span onclick="loadChapters('${bookId}')"> ${bookId}</span>`;
        sidebar.innerHTML = `<div class="breadcrumb" id="breadcrumb">${crumb.innerHTML}</div>`;
        // Locate the book referencelet
        let bookList = null;
        switch(selectionType) {
            case 0:
              bookList = xmlDoc.querySelectorAll(`div[type="toc"] > list > list`);
              break;
            case 1:
              bookList = xmlDoc.querySelectorAll(`div[type="toc"] > list > item > list`);
              break;
        }
        if (!bookList) {
            console.error(`Book reference not found for ID: ${bookId}`);
            return;
        }
        else {
          // Find its parent item that contains the associated list
          if(isDigit(bookId[bookId.length-1]))
            chapters = bookList[extractNumber(bookId) - 1].querySelectorAll('ref'); // Get all chapters inside the list
          else
            chapters = bookList[bookList.length-1].querySelectorAll('ref');
        }
    } else {
        sidebar.innerHTML = `<div class="breadcrumb" id="breadcrumb">${crumb.innerHTML}</div>`;
        // No book selected, load standalone chapters
        chapters = xmlDoc.querySelectorAll('div[type="toc"] > list > item > ref');
        mainContent.innerHTML = `<h2>${bookData[currentIndex].name} Audio Files</h2>`;
    }

    //console.log("Found chapters:", chapters);
    
    chapters.forEach(chapter => {
        let chapterTitle;
        let chapterId = chapter.getAttribute("target").replace("#", "");
        try {
          chapterTitle = xmlDoc.evaluate(`//*[@xml:id="${chapterId}"]`, xmlDoc, nsResolver, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue.querySelector("head").textContent;
        }
        catch(e) {
          chapterTitle = chapter.textContent;
        }
        let chapterElement = document.createElement("a");
        chapterElement.href = "#";
        chapterElement.textContent = chapterTitle;
        chapterElement.onclick = function () {
            loadChapterText(chapterId, this);
        };
        sidebar.appendChild(chapterElement);
        chapterElement = document.createElement("h3");
        chapterElement.textContent = chapterTitle;
        chapterElement.style.marginBottom = "-20px";
        mainContent.appendChild(chapterElement);
        loadDownloads(mainContent, chapterId);
    });
}

function loadChapterText(chapterId, element) {
    if(extractNumber(chapterId) != currentChapterNo) {
      //console.log(element.innerHTML);
      currentChapter = element.innerHTML;
      currentChapterNo = extractNumber(chapterId);
      
      loadAudioForChapter(currentChapterNo, true);

      // Find the element with the given xml:id
      let chapter = xmlDoc.evaluate(`//*[@xml:id="${chapterId}"]`, xmlDoc, nsResolver, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
      
      let content = document.getElementById("mainContent");

      if (chapter) {
        content.innerHTML = `<h2>${chapter.querySelector("head").textContent}</h2>`;

        chapter.querySelectorAll("p").forEach(p => {
            let formattedText = p.innerHTML.replace(/_/g, ""); // Remove all underscores
            content.innerHTML += `<p>${formattedText}</p>`;
        });
      }
    }
}

function loadVeil(index) {
  currentIndex = index;
  let fetchUrl = BASE_TEXT_URL + bookData[index].xml;
  var xhr = new XMLHttpRequest();
  xhr.open("GET", fetchUrl, true);
  xhr.onreadystatechange = function () {
    if (xhr.readyState == 4) {
      if (xhr.status == 200) {
        var responseText = xhr.responseText;
        try {
          // Manually parse the response text as XML
          var parser = new DOMParser();
          xmlDoc = parser.parseFromString(responseText, "text/xml");
          var chapters = xmlDoc.getElementsByTagName("div");

          // Clear current sidebar content and update with chapters
          const sidebar = document.getElementById("mySidebar");
          sidebar.innerHTML = `<div class="breadcrumb" id="breadcrumb"><span onclick="goToIndex()">Index</span> > <span onclick="loadBooks(${currentIndex})">${bookData[currentIndex].name}</span></div>`;
          
          const mainContent = document.getElementById("mainContent");
          mainContent.innerHTML = `<h2>${bookData[currentIndex].name} Audio Files</h2>`;
          for (var i = 0; i < chapters.length; i++) {
			var rawTitle = chapters[i].getElementsByTagName("head")[0]?.textContent || "Unnamed Chapter";

			// Convert "CHAPTER I" to "Chapter 1"
			var formattedTitle = rawTitle.replace(/CHAPTER\s+([IVXLCDM\d]+)/i, (match, number) => {
				return `Chapter ${number}`;
			});

			var targetId = chapters[i].getAttribute("xml:id");
			var chapterLink = document.createElement("a");
			chapterLink.href = "#";
			chapterLink.textContent = formattedTitle;
			chapterLink.setAttribute("onclick", `loadChapterText('${targetId}', this)`);
			sidebar.appendChild(chapterLink);
            chapterLink = document.createElement("h3");
            chapterLink.textContent = formattedTitle;
            chapterLink.style.marginBottom = "-20px";
            mainContent.appendChild(chapterLink);
            loadDownloads(mainContent, targetId);
		}

        } catch (e) {
          console.error("Failed to parse XML:", e);
        }
      } else {
        console.error("Failed to load XML. Status:", xhr.status);
      }
    }
  };
  xhr.send();
}

// Helper function to load audio based on current source selection
function loadAudioForChapter(chapter, setup = false) {
    // Ensure widget elements are available (defined in widget.js or globally)
    const audioPlayer = document.getElementById('audioPlayer');
    const audioWidget = document.getElementById('audioWidget');
    const audioBookTitleEl = document.getElementById('audioBookTitle');
    const audioChapterTitleEl = document.getElementById('audioChapterTitle');
    const seekBar = document.getElementById('seekBar');
    const audioSourceDropdown = document.getElementById('audioSource');
    const playPauseBtn = document.getElementById('playPauseBtn'); // Needed for disabling
    const rewindBtn = document.getElementById('rewindBtn');
    const fastForwardBtn = document.getElementById('fastForwardBtn');


    if (!audioPlayer || !audioWidget || !audioBookTitleEl || !audioChapterTitleEl || !seekBar || !audioSourceDropdown || !playPauseBtn || !rewindBtn || !fastForwardBtn) {
        console.error("Widget DOM elements not found. Cannot load audio.");
        return;
    }
     // Ensure widget functions are available (defined in widget.js)
    if (typeof closeAudioWidget !== 'function' || typeof updatePlayPauseButton !== 'function') {
        console.error("Widget functions not loaded correctly.");
        return;
    }

    let audioFilename = bookData[currentIndex].code + '_CHAPTER';
    if(chapter < 10)
      audioFilename += '0';
    audioFilename += String(chapter);
    // Get the currently selected source from the dropdown
    let selectedSource = audioSourceDropdown.value; // Read current value
    if(bookData[currentIndex].vox === null)
    {
      audioSourceDropdown.value = 'tts';
      selectedSource = audioSourceDropdown.value;
      audioSource.innerHTML = `<option value="tts">TTS</option>`
    }
    else if(setup)
    {
        if(bookData[currentIndex].vox)
        {
          audioSource.innerHTML = `<option value="librivoxA" selected>LibriVox A</option><option value="librivoxB" selected>LibriVox B</option><option value="tts">TTS</option>`;
          if(selectedSource === 'librivox')
          {
            audioSourceDropdown.value = 'librivoxA';
            selectedSource = audioSourceDropdown.value;
          }
        }
        else
        {
          audioSource.innerHTML = `<option value="librivox" selected>LibriVox</option><option value="tts">TTS</option>`;
          if(selectedSource !== 'tts')
          {
            audioSourceDropdown.value = 'librivox';
            selectedSource = audioSourceDropdown.value;
          }
        }
    }
    if(selectedSource === 'librivoxA')
    {
        audioFilename += 'A';
    }
    else if(selectedSource === 'librivoxB')
    {
        audioFilename += 'B';
    }
    audioFilename += '.mp3';
     
    const audioFolder = bookData[currentIndex].tts; // Get folder for selected source
    let baseAudioUrl = (selectedSource === 'tts') ? BASE_TTS_AUDIO_URL : BASE_LIBRIVOX_AUDIO_URL; // Choose base URL

    // Set the dropdown to reflect the current source being loaded
    audioSourceDropdown.value = selectedSource;

    if (audioFolder && audioFilename) {
        const audioUrl = `${baseAudioUrl}${audioFolder}/${audioFilename}`;
        //console.log(`Setting ${selectedSource} audio source:`, audioUrl);

        if (!audioPlayer.paused) audioPlayer.pause();
        // Setting src to empty first can help avoid issues in some browsers when changing source
        audioPlayer.src = "";
        audioPlayer.src = audioUrl;
        audioPlayer.load(); // Explicitly load

        audioBookTitleEl.textContent = bookData[currentIndex].name;
        audioChapterTitleEl.textContent = currentChapter;
        audioWidget.style.display = 'block';
        updatePlayPauseButton(); // Update button state
        seekBar.value = 0; // Reset seek bar
        // Ensure controls are enabled
        playPauseBtn.disabled = false;
        rewindBtn.disabled = false;
        fastForwardBtn.disabled = false;
        seekBar.disabled = false;
        audioSourceDropdown.disabled = false;

    } else {
        console.warn(`Audio file/folder not specified for source "${selectedSource}" for key "${chapter}" in book "${bookData[currentIndex].name}".`);
        // Display message in widget, disable player
        audioBookTitleEl.textContent = bookData[currentIndex].name;
        audioChapterTitleEl.textContent = `${currentChapter} (${selectedSource} unavailable)`;
        audioPlayer.removeAttribute('src');
        audioPlayer.load(); // Try to clear player state
        playPauseBtn.disabled = true;
        rewindBtn.disabled = true;
        fastForwardBtn.disabled = true;
        seekBar.disabled = true;
        seekBar.value = 0;
        updatePlayPauseButton(); // Update button state
        audioWidget.style.display = 'block'; // Keep widget visible
        // Optionally disable the dropdown if only one source exists or none exist?
        // audioSourceDropdown.disabled = true; // Or more complex logic
    }
}

// Function called when the dropdown value changes
function handleAudioSourceChange() {
    const audioSourceDropdown = document.getElementById('audioSource'); // Get fresh reference
    if (!audioSourceDropdown) return;

    currentAudioSource = audioSourceDropdown.value;
    localStorage.setItem('ge_audio_source', currentAudioSource); // Save preference
    //console.log("Audio source changed to:", currentAudioSource);
    loadAudioForChapter(currentChapterNo);
}

function downloadAudioFile(chapterId, tts, voxType = '') {
  let chapterNo = extractNumber(chapterId);
  let downloadUrl;
  if(tts)
    downloadUrl = BASE_TTS_AUDIO_URL;
  else
    downloadUrl = BASE_LIBRIVOX_AUDIO_URL;
  downloadUrl += bookData[currentIndex].tts + '/' + bookData[currentIndex].code + '_CHAPTER';
  if(chapterNo < 10)
      downloadUrl += '0';
  downloadUrl += String(chapterNo) + voxType + '.mp3';
  // **Trigger Download on the Element**
  let link = document.createElement("a");
  link.href = downloadUrl;
  link.style.display = "none"; // Hide the element

  document.body.appendChild(link);
  link.click();  // **Trigger the download**
  document.body.removeChild(link); // Cleanup
}

// Restores the main book list in the sidebar
function goToIndex() {
  const sidebar = document.getElementById("mySidebar");
  const mainContent = document.getElementById("mainContent");

  // Restore original sidebar content
  sidebar.innerHTML = `
  <div class="breadcrumb" id="breadcrumb">
    <span onclick="goToIndex()">Index</span>
  </div>
  <a href="#" onclick="loadBooks(2)">The Sad Fortunes of the Reverend Amos Barton</a>
  <a href="#" onclick="loadBooks(1)">Mr. Gilfil's Love Story</a>
  <a href="#" onclick="loadBooks(0)">Janet's Repentance</a>
  <a href="#" onclick="loadBooks(5)">Adam Bede</a>
  <a href="#" onclick="loadVeil(12)">Lifted Veil</a>
  <a href="#" onclick="loadBooks(9)">The Mill on the Floss</a>
  <a href="#" onclick="loadBooks(10)">Silas Marner</a>
  <a href="#" onclick="loadBooks(8)">Romola</a>
  <a href="#" onclick="loadBooks(4)">Brother Jacob</a>
  <a href="#" onclick="loadBooks(7)">Felix Holt, The Radical</a>
  <a href="#" onclick="loadBooks(11)">Middlemarch</a>
  <a href="#" onclick="loadBooks(3)">Daniel Deronda</a>
  <a href="#" onclick="loadBooks(6)">Impressions of Theophrastus Such</a>
  `;

  // Reset state
  currentIndex = -1;
  currentChapter = '';
  currentChapterNo = -1;
  xmlDoc = '';
  selectionType = 0;
  currentAudioSource = localStorage.getItem('ge_audio_source') || 'librivox';

  // Reset main content
  mainContent.innerHTML = `
      <h2>Welcome to the George Eliot Archive</h2>
      <h3>Select a work from the index menu (➔) to begin reading.</h3>`;

  // Hide the audio widget
  if (typeof closeAudioWidget === 'function') {
      closeAudioWidget();
  }

  // Reset main content margin if sidebar was closed
  if (main && !sidebar.classList.contains('open')) {
      main.classList.remove('shifted');
  }
}

// --- Initial Setup ---
// Set the dropdown to the stored/default value when the page loads
document.addEventListener('DOMContentLoaded', () => {
    const audioSourceDropdown = document.getElementById('audioSource');
    if (audioSourceDropdown) {
        audioSourceDropdown.value = currentAudioSource;
    } else {
        console.warn("Audio source dropdown not found on DOMContentLoaded.");
    }
});

//console.log("George Eliot Archive UI Initialized. Preferred source:", currentAudioSource);