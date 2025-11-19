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
const BASE_TTS_AUDIO_URL = `https://raw.githubusercontent.com/${GITHUB_USER}/${AUDIO_GITHUB_REPO}/${AUDIO_GITHUB_BRANCH}/TTS/`;

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
  tts: 'Janet\'s%20Repentance'
},
{
  name: "Mr. Gilfil's Love Story",
  code: "MG",
  xml: 'Mr.Gilfil\'s%20Love%20Story.xml',
  tts: 'Mr.%20Gilfil\'s%20Love%20Story'
},
{
  name: "The Sad Fortunes of the Reverend Amos Barton",
  code: "AM",
  xml: 'The%20Sad%20Fortunes%20of%20the%20Reverend%20Amos%20Barton.xml',
  tts: 'Amos%20Barton'
},
{
  name: "Daniel Deronda",
  code: "DD",
  xml: 'Daniel_Deronda_refine_v1.xml',
  tts: 'Daniel%20Deronda'
},
{
  name: "Brother Jacob",
  code: "BJ",
  xml: 'Brother%20Jacob_refine_v1.xml',
  tts: 'Brother%20Jacob'
},
{
  name: "Adam Bede",
  code: "AB",
  xml: 'Adam%20Bede_refine_v1.1.xml',
  tts: 'Adam%20Bede'
},
{
  name: "Impressions of Theophrastus Such",
  code: "TS",
  xml: 'Impressions%20of%20Theophrastus%20Such.xml',
  tts: 'Theophrastus%20Such'
}, 
{
  name: "Felix Holt, The Radical",
  code: "FH",
  xml: 'Felix%20Holt%2C%20the%20Radical_refine_v1.xml', 
  tts: 'Felix%20Holt'
},
{
  name: "Romola",
  code: "RM",
  xml: 'Romola_refine_v1.xml',
  tts: 'Romola'
},
{
  name: "The Mill on the Floss",
  code: "MF",
  xml: 'The%20Mill%20on%20the%20Floss.xml', 
  tts: 'The%20Mill%20on%20the%20Floss'
},
{
  name: "Silas Marner",
  code: "SM",
  xml: 'Silas%20Marner.xml',
  tts: 'Silas%20Marner'  
},
{
  name: "Middlemarch",
  code: "MM",
  xml: 'Middlemarch_refine_v1.xml',
  tts: 'Middlemarch'
},
{
  name: "Lifted Veil",
  code: "LV",
  xml: 'liftedVeil.xml',
  tts: 'The%20Lifted%20Veil'
}
];

// --- Global State Variables ---
let currentUrl = '';
let currentIndex = -1;
let currentChapter = '';
let currentChapterNo = -1;
let xmlDoc = '';
let selectionType = 0;
let currentAudioSource = localStorage.getItem('ge_audio_source'); 

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
  //console.log(screenWidth);
  const sidebarWidth = screenWidth < 320 ? screenWidth - 30 + "px" : "350px";

  sidebar.style.width = sidebarWidth;
  
  // Toggle sidebar
  sidebar.classList.toggle("open");
  toggleButton.classList.toggle("open");
  main.classList.toggle("shifted");

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

function parseXML(xmlString) {
    let parser = new DOMParser();
    xmlDoc = parser.parseFromString(xmlString, "text/xml");

    const sidebar = document.getElementById("mySidebar");
    if (!sidebar) {
      console.error('Sidebar element #mySidebar not found in DOM');
      return; // Avoid the null.innerHTML crash
    }
    sidebar.innerHTML = `
        <div class="breadcrumb" id="breadcrumb">
            <span onclick="goToIndex()">Select Text</span>
            &gt; <span onclick="loadBooks(${currentIndex})">
                ${bookData[currentIndex].name}
            </span>
        </div>
    `;
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
              
              
            });
        });
    } else {
        // No Books: Load Chapters directly
        loadChapters();
    }
}

function loadChapters(bookId = null) {
    const sidebar = document.getElementById("mySidebar");
    sidebar.innerHTML = `<div class="breadcrumb" id="breadcrumb"><span onclick="goToIndex()">Select Text</span> &gt; <span onclick="loadBooks(${currentIndex})">${bookData[currentIndex].name}</span></div>`;
    const crumb = document.getElementById("breadcrumb");

    const mainContent = document.getElementById("mainContent");

    let chapters;

    if (bookId) {
        // Nested structure: Title -> Book I / Book II -> Chapters
        mainContent.innerHTML = `<h1>${bookData[currentIndex].name} ${bookId}</h1>`;
        crumb.innerHTML += ` &gt; <span onclick="loadChapters('${bookId}')">${bookId}</span>`;
        sidebar.innerHTML = `<div class="breadcrumb" id="breadcrumb">${crumb.innerHTML}</div>`;

        // Pick the correct list of chapters for this bookId
        let bookList = null;
        switch (selectionType) {
            case 0:
                bookList = xmlDoc.querySelectorAll(`div[type="toc"] > list > list`);
                break;
            case 1:
                bookList = xmlDoc.querySelectorAll(`div[type="toc"] > list > item > list`);
                break;
        }

        if (bookList && bookList.length > 0) {
            // Use the numeric part of bookId (e.g., "Book 1" -> index 0) if available
            let idx = extractNumber(bookId) - 1;
            if (isNaN(idx) || idx < 0 || idx >= bookList.length) {
                idx = 0; // fallback to first book list
            }
            chapters = bookList[idx].querySelectorAll("ref");
        } else {
            chapters = [];
        }
    } else {
        // Flat structure: Title -> Chapters
        crumb.innerHTML += ` &gt; <span onclick="loadChapters()">Chapters</span>`;
        sidebar.innerHTML = `<div class="breadcrumb" id="breadcrumb">${crumb.innerHTML}</div>`;
        mainContent.innerHTML = `<h2>${bookData[currentIndex].name}</h2>`;

        // You already set selectionType in parseXML; reuse it here
        switch (selectionType) {
            case 0:
                chapters = xmlDoc.querySelectorAll('div[type="toc"] > list > ref');
                break;
            case 1:
                chapters = xmlDoc.querySelectorAll('div[type="toc"] > list > item > ref');
                break;
            default:
                chapters = [];
        }
    }

    if (!chapters || chapters.length === 0) {
        mainContent.innerHTML += `<p>No chapters found.</p>`;
        return;
    }

    
    let firstChapterId = null;
    let firstChapterTitle = null;

    chapters.forEach((chapter, index) => {
        let chapterTitle;
        let chapterId = chapter.getAttribute("target").replace("#", "");

        try {
            const node = xmlDoc.evaluate(
                `//*[@xml:id="${chapterId}"]`,
                xmlDoc,
                nsResolver,
                XPathResult.FIRST_ORDERED_NODE_TYPE,
                null
            ).singleNodeValue;
            chapterTitle = node
                ? node.querySelector("head").textContent
                : chapter.textContent;
        } catch (e) {
            chapterTitle = chapter.textContent;
        }

        // Sidebar link
        const chapterLink = document.createElement("a");
        chapterLink.href = "#";
        chapterLink.textContent = chapterTitle;
        chapterLink.onclick = function (e) {
            e.preventDefault();
            loadChapterText(chapterId, this, chapterTitle);
        };
        sidebar.appendChild(chapterLink);

        // Optional heading in main content (you can keep or remove)
        const chapterHeading = document.createElement("h3");
        chapterHeading.textContent = chapterTitle;
        chapterHeading.style.marginBottom = "-20px";
        // If you don’t want these headings, comment out next line:
        // mainContent.appendChild(chapterHeading);

        // Save first chapter for default display
        if (index === 0) {
            firstChapterId = chapterId;
            firstChapterTitle = chapterTitle;
        }
    });

    if (firstChapterId) {
        loadChapterText(firstChapterId, null, firstChapterTitle);
    }
}

function loadChapterText(chapterId, element = null, titleOverride = null) {
    const chapterNo = extractNumber(chapterId);
    if (chapterNo === currentChapterNo) {
        return; // already showing this chapter
    }

    // Update "current chapter" label for audio widget
    if (element) {
        currentChapter = element.innerHTML;
    } else if (titleOverride) {
        currentChapter = titleOverride;
    } else {
        currentChapter = "";
    }
    currentChapterNo = chapterNo;

    // If you still use this for the audio widget:
    if (typeof loadAudioForChapter === "function") {
        loadAudioForChapter(currentChapterNo, true);
    }

    // Find the element with the given xml:id
    const chapterNode = xmlDoc.evaluate(
        `//*[@xml:id="${chapterId}"]`,
        xmlDoc,
        nsResolver,
        XPathResult.FIRST_ORDERED_NODE_TYPE,
        null
    ).singleNodeValue;

    const content = document.getElementById("mainContent");
    if (!content || !chapterNode) return;

    const headNode = chapterNode.querySelector("head");
    const headingText =
        (headNode && headNode.textContent) ||
        titleOverride ||
        currentChapter ||
        "";

    content.innerHTML = `<h2>${headingText}</h2>`;

    chapterNode.querySelectorAll("p").forEach(p => {
        const formattedText = p.innerHTML.replace(/_/g, ""); // Remove underscores
        content.innerHTML += `<p>${formattedText}</p>`;
    });
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
          sidebar.innerHTML = `<div class="breadcrumb" id="breadcrumb"><span onclick="goToIndex()">Select Text</span> > <span onclick="loadBooks(${currentIndex})">${bookData[currentIndex].name}</span></div>`;
          
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
            //loadDownloads(mainContent, targetId);
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
    //const audioSourceDropdown = document.getElementById('audioSource');
    const playPauseBtn = document.getElementById('playPauseBtn'); // Needed for disabling
    const rewindBtn = document.getElementById('rewindBtn');
    const fastForwardBtn = document.getElementById('fastForwardBtn');


    if (!audioPlayer || !audioWidget || !audioBookTitleEl || !audioChapterTitleEl || !seekBar  || !playPauseBtn || !rewindBtn || !fastForwardBtn) {
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
   
    let selectedSource = 'tts'; 
    audioFilename += '.mp3';
    const audioFolder = bookData[currentIndex].tts; // Get folder for selected source
    let baseAudioUrl =  BASE_TTS_AUDIO_URL 

   
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


// Restores the main book list in the sidebar
function goToIndex() {
  const sidebar = document.getElementById("mySidebar");

  // Restore original sidebar content
  sidebar.innerHTML = `
  <div class="breadcrumb" id="breadcrumb">
    <span onclick="goToIndex()">Select Text</span>
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
  currentAudioSource = localStorage.getItem('ge_audio_source');

  // Reset main content
  // mainContent.innerHTML = `
  //     <h2>Welcome to the George Eliot Archive</h2>
  //     <h3>Select a work from the index menu (➔) to begin reading.</h3>`;

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
    // const audioSourceDropdown = document.getElementById('audioSource');
    // if (audioSourceDropdown) {
    //     audioSourceDropdown.value = currentAudioSource;
    // } else {
    //     console.warn("Audio source dropdown not found on DOMContentLoaded.");
    // }
});


//console.log("George Eliot Archive UI Initialized. Preferred source:", currentAudioSource);