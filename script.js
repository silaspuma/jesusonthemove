// API.bible configuration
const API_KEY = 'ulKy7sztP3_MN-GQn4z-F';
const API_BASE_URL = 'https://api.scripture.api.bible/v1';
const BIBLE_ID = 'de4e12af7f28f599-02'; // KJV Bible

let currentVerse = {};

// Get today's date string (YYYY-MM-DD)
function getTodayString() {
    const today = new Date();
    return today.toISOString().split('T')[0];
}

// Curated list of verses for daily rotation
const verseIds = [
    'JHN.3.16', 'ROM.8.28', 'PSA.23.1', 'MAT.11.28', 'JER.29.11',
    'PHP.4.13', 'ISA.40.31', 'JOS.1.9', 'GAL.5.22', 'EPH.3.16',
    'ROM.12.2', 'JHN.14.27', '1PE.5.7', 'PSA.27.1', 'HEB.11.1',
    'JHN.10.10', '2TI.1.7', 'ROM.6.9', 'MAT.6.33', '1JN.4.7',
    'PRO.3.5-3.6', 'PSA.34.18', 'COL.3.16', 'PHP.4.6', '1TH.5.16',
    'MAT.5.16', 'LAM.3.22-3.23', 'JHN.8.32', 'ROM.3.23', 'JHN.1.1',
    'ROM.10.9', '1CO.13.4', '2CO.5.17', 'GAL.2.20', 'EPH.2.8',
    'PHP.2.5', 'COL.1.15', '1TH.4.16', '2TI.2.15', 'TIT.2.11',
    'HEB.12.2', 'JAS.1.17', '1PE.1.3', '2PE.1.3', '1JN.1.9'
];

// Get verse of the day based on date
function getTodaysVerseId() {
    const today = new Date();
    const dayOfYear = Math.floor((today - new Date(today.getFullYear(), 0, 0)) / 1000 / 60 / 60 / 24);
    const index = dayOfYear % verseIds.length;
    return verseIds[index];
}

// Fetch verse of the day from API.bible
async function fetchVerseOfDay() {
    try {
        const verseId = getTodaysVerseId();
        const url = `${API_BASE_URL}/bibles/${BIBLE_ID}/passages/${verseId}?content-type=text&include-notes=false&include-titles=false&include-chapter-numbers=false&include-verse-numbers=false&include-verse-spans=false`;
        
        console.log('Fetching verse from:', url);
        
        const response = await fetch(url, {
            headers: {
                'api-key': API_KEY
            }
        });

        console.log('Response status:', response.status);

        if (!response.ok) {
            const errorData = await response.text();
            console.error('API Error:', errorData);
            throw new Error(`API returned status ${response.status}`);
        }

        const data = await response.json();
        console.log('API response:', data);
        
        const passage = data.data.content;
        const reference = data.data.reference;

        // Clean up the text
        const cleanText = passage.trim().replace(/\s+/g, ' ');

        return {
            text: cleanText,
            reference: reference
        };
    } catch (error) {
        console.error('Error fetching verse of the day:', error);
        // Fallback verse if API fails
        return {
            text: "For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life.",
            reference: "John 3:16"
        };
    }
}

// Get today's verse (from cache or API)
async function getTodaysVerse() {
    const todayString = getTodayString();
    const cachedData = localStorage.getItem('dailyVerse');

    if (cachedData) {
        const parsed = JSON.parse(cachedData);
        // If cached verse is from today, use it
        if (parsed.date === todayString) {
            return parsed.verse;
        }
    }

    // Otherwise, fetch verse of the day from API (only once per day)
    const verse = await fetchVerseOfDay();

    // Cache the verse with today's date
    localStorage.setItem('dailyVerse', JSON.stringify({
        date: todayString,
        verse: verse
    }));

    return verse;
}

// Display the verse
async function displayVerse() {
    currentVerse = await getTodaysVerse();
    document.getElementById('verseText').textContent = `"${currentVerse.text}"`;
    document.getElementById('verseReference').textContent = currentVerse.reference;
    updateSaveButton();
}

// Display current date
function displayDate() {
    const today = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    document.getElementById('currentDate').textContent = today.toLocaleDateString('en-US', options);
}

// Show notification
function showNotification(message) {
    const notification = document.getElementById('notification');
    const notificationText = document.getElementById('notificationText');
    
    notificationText.textContent = message;
    notification.classList.add('show');
    
    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

// Check if verse is saved
function isVerseSaved() {
    const savedVerses = JSON.parse(localStorage.getItem('savedVerses') || '[]');
    return savedVerses.some(v => v.reference === currentVerse.reference);
}

// Update save button state
function updateSaveButton() {
    const saveButton = document.getElementById('saveButton');
    if (isVerseSaved()) {
        saveButton.classList.add('saved');
        saveButton.querySelector('span').textContent = 'Saved';
    } else {
        saveButton.classList.remove('saved');
        saveButton.querySelector('span').textContent = 'Save';
    }
}

// Save verse functionality
function saveVerse() {
    const savedVerses = JSON.parse(localStorage.getItem('savedVerses') || '[]');
    
    if (!isVerseSaved()) {
        savedVerses.push({
            text: currentVerse.text,
            reference: currentVerse.reference,
            savedDate: new Date().toISOString()
        });
        localStorage.setItem('savedVerses', JSON.stringify(savedVerses));
        showNotification('Verse saved');
        updateSaveButton();
    } else {
        // Remove from saved
        const filtered = savedVerses.filter(v => v.reference !== currentVerse.reference);
        localStorage.setItem('savedVerses', JSON.stringify(filtered));
        showNotification('Verse removed from saved');
        updateSaveButton();
    }
}

// Share verse functionality
async function shareVerse() {
    const shareText = `"${currentVerse.text}" - ${currentVerse.reference}`;
    
    if (navigator.share) {
        try {
            await navigator.share({
                title: 'That Daily Bread',
                text: shareText,
                url: window.location.href
            });
            showNotification('Verse shared');
        } catch (err) {
            if (err.name !== 'AbortError') {
                copyToClipboard(shareText);
            }
        }
    } else {
        copyToClipboard(shareText);
    }
}

// Fallback: Copy to clipboard
function copyToClipboard(text) {
    if (navigator.clipboard) {
        navigator.clipboard.writeText(text).then(() => {
            showNotification('Verse copied to clipboard');
        }).catch(() => {
            showNotification('Unable to copy verse');
        });
    } else {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.select();
        try {
            document.execCommand('copy');
            showNotification('Verse copied to clipboard');
        } catch (err) {
            showNotification('Unable to copy verse');
        }
        document.body.removeChild(textArea);
    }
}

// Event listeners
document.getElementById('saveButton').addEventListener('click', saveVerse);
document.getElementById('shareButton').addEventListener('click', shareVerse);

// Initialize
displayVerse();
displayDate();
