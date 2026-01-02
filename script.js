// API.bible configuration
const API_KEY = 'kswdJ0PhRlF7tnfs1Zghp';
const API_BASE_URL = 'https://rest.api.bible/v1';
const BIBLE_ID = 'de4e12af7f28f599-02'; // KJV Bible

let currentVerse = {};
let streakData = {
    currentStreak: 0,
    lastVisit: null,
    history: []
};
let hasMarkedToday = false;
let firestoreApi = null;
const STREAK_HISTORY_DAYS = 62; // keep enough days to render full months
let nextVerseRefreshTimer = null;

// Get today's date string (YYYY-MM-DD) in UTC
function getTodayString() {
    const today = new Date();
    const year = today.getUTCFullYear();
    const month = String(today.getUTCMonth() + 1).padStart(2, '0');
    const day = String(today.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// Large curated list of meaningful verses for daily rotation (365+ verses)
const verseIds = [
    // John
    'JHN.1.1', 'JHN.1.12', 'JHN.3.16', 'JHN.3.17', 'JHN.4.24', 'JHN.6.35', 'JHN.8.12', 'JHN.8.32', 'JHN.10.10', 'JHN.10.11', 'JHN.11.25', 'JHN.13.34', 'JHN.14.1', 'JHN.14.6', 'JHN.14.27', 'JHN.15.5', 'JHN.15.13', 'JHN.16.33',
    // Romans
    'ROM.1.16', 'ROM.3.23', 'ROM.5.1', 'ROM.5.8', 'ROM.6.9', 'ROM.6.23', 'ROM.8.1', 'ROM.8.28', 'ROM.8.31', 'ROM.8.37', 'ROM.8.38-8.39', 'ROM.10.9', 'ROM.10.13', 'ROM.12.1', 'ROM.12.2', 'ROM.12.12', 'ROM.15.13',
    // Psalms
    'PSA.1.1', 'PSA.1.6', 'PSA.16.11', 'PSA.19.14', 'PSA.23.1', 'PSA.23.4', 'PSA.27.1', 'PSA.27.14', 'PSA.28.7', 'PSA.30.5', 'PSA.32.1', 'PSA.34.8', 'PSA.34.18', 'PSA.37.4', 'PSA.37.5', 'PSA.40.1', 'PSA.42.1', 'PSA.46.1', 'PSA.46.10', 'PSA.51.10', 'PSA.55.22', 'PSA.56.3', 'PSA.62.8', 'PSA.86.5', 'PSA.90.12', 'PSA.91.1', 'PSA.91.11', 'PSA.95.1', 'PSA.100.4', 'PSA.103.2', 'PSA.107.1', 'PSA.118.24', 'PSA.119.9', 'PSA.119.11', 'PSA.119.105', 'PSA.121.1', 'PSA.127.1', 'PSA.133.1', 'PSA.139.14', 'PSA.145.18', 'PSA.147.3', 'PSA.150.6',
    // Matthew
    'MAT.4.4', 'MAT.5.3', 'MAT.5.4', 'MAT.5.6', 'MAT.5.9', 'MAT.5.14', 'MAT.5.16', 'MAT.6.9', 'MAT.6.25', 'MAT.6.33', 'MAT.6.34', 'MAT.7.7', 'MAT.7.12', 'MAT.11.28', 'MAT.16.24', 'MAT.18.20', 'MAT.19.26', 'MAT.22.37', 'MAT.28.19', 'MAT.28.20',
    // Proverbs
    'PRO.1.7', 'PRO.3.5-3.6', 'PRO.3.7', 'PRO.4.23', 'PRO.10.9', 'PRO.11.25', 'PRO.13.20', 'PRO.14.12', 'PRO.15.1', 'PRO.16.3', 'PRO.16.9', 'PRO.17.17', 'PRO.18.10', 'PRO.18.21', 'PRO.19.17', 'PRO.21.21', 'PRO.22.1', 'PRO.27.1', 'PRO.27.17', 'PRO.29.25', 'PRO.31.25', 'PRO.31.30',
    // Philippians
    'PHP.1.6', 'PHP.2.3', 'PHP.2.5', 'PHP.3.13', 'PHP.4.4', 'PHP.4.6', 'PHP.4.7', 'PHP.4.8', 'PHP.4.13', 'PHP.4.19',
    // Isaiah
    'ISA.9.6', 'ISA.26.3', 'ISA.40.8', 'ISA.40.29', 'ISA.40.31', 'ISA.41.10', 'ISA.43.2', 'ISA.53.5', 'ISA.54.10', 'ISA.55.6', 'ISA.55.8', 'ISA.58.11', 'ISA.64.8',
    // Jeremiah
    'JER.17.7', 'JER.29.11', 'JER.29.13', 'JER.31.3', 'JER.32.17', 'JER.33.3',
    // Joshua
    'JOS.1.8', 'JOS.1.9', 'JOS.24.15',
    // Galatians
    'GAL.2.20', 'GAL.5.1', 'GAL.5.16', 'GAL.5.22-5.23', 'GAL.6.2', 'GAL.6.9',
    // Ephesians
    'EPH.1.7', 'EPH.2.8-2.9', 'EPH.2.10', 'EPH.3.16', 'EPH.3.20', 'EPH.4.2', 'EPH.4.29', 'EPH.4.32', 'EPH.5.1', 'EPH.6.10', 'EPH.6.11',
    // 1 Peter
    '1PE.1.3', '1PE.2.9', '1PE.3.15', '1PE.5.6', '1PE.5.7', '1PE.5.10',
    // Hebrews
    'HEB.4.12', 'HEB.4.16', 'HEB.10.23', 'HEB.11.1', 'HEB.11.6', 'HEB.12.1', 'HEB.12.2', 'HEB.13.5', 'HEB.13.8',
    // 1 John
    '1JN.1.7', '1JN.1.9', '1JN.3.1', '1JN.4.4', '1JN.4.7', '1JN.4.8', '1JN.4.19', '1JN.5.4',
    // Colossians
    'COL.1.15', 'COL.1.16', 'COL.2.6', 'COL.3.2', 'COL.3.12', 'COL.3.13', 'COL.3.16', 'COL.3.17', 'COL.3.23',
    // 2 Timothy
    '2TI.1.7', '2TI.2.15', '2TI.3.16',
    // James
    'JAS.1.2', 'JAS.1.5', 'JAS.1.17', 'JAS.1.19', 'JAS.1.22', 'JAS.3.17', 'JAS.4.7', 'JAS.4.8', 'JAS.5.16',
    // 1 Corinthians
    '1CO.6.19', '1CO.10.13', '1CO.10.31', '1CO.13.4-13.5', '1CO.13.7', '1CO.13.13', '1CO.15.57', '1CO.16.13',
    // 2 Corinthians
    '2CO.4.16', '2CO.4.18', '2CO.5.7', '2CO.5.17', '2CO.9.7', '2CO.12.9',
    // 1 Thessalonians
    '1TH.4.16', '1TH.5.11', '1TH.5.16', '1TH.5.17', '1TH.5.18',
    // Lamentations
    'LAM.3.21-3.23', 'LAM.3.25', 'LAM.3.26',
    // Titus
    'TIT.2.11', 'TIT.3.5',
    // Mark
    'MRK.10.27', 'MRK.11.24', 'MRK.12.30', 'MRK.16.15',
    // Luke
    'LUK.1.37', 'LUK.6.31', 'LUK.6.38', 'LUK.9.23', 'LUK.11.9', 'LUK.12.15', 'LUK.18.27',
    // Acts
    'ACT.1.8', 'ACT.2.38', 'ACT.4.12', 'ACT.16.31', 'ACT.20.35',
    // Genesis
    'GEN.1.1', 'GEN.1.27', 'GEN.50.20',
    // Exodus
    'EXO.14.14', 'EXO.20.12',
    // Deuteronomy
    'DEU.6.5', 'DEU.31.6', 'DEU.31.8',
    // 1 Samuel
    '1SA.16.7',
    // 2 Chronicles
    '2CH.7.14', '2CH.20.15',
    // Nehemiah
    'NEH.8.10',
    // Job
    'JOB.19.25', 'JOB.23.10',
    // Ecclesiastes
    'ECC.3.1', 'ECC.3.11', 'ECC.4.9', 'ECC.12.1',
    // Daniel
    'DAN.12.3',
    // Micah
    'MIC.6.8',
    // Habakkuk
    'HAB.2.14', 'HAB.3.19',
    // Zephaniah
    'ZEP.3.17',
    // Zechariah
    'ZEC.4.6',
    // Malachi
    'MAL.3.10',
    // 2 Peter
    '2PE.1.3', '2PE.3.9', '2PE.3.18',
    // Jude
    'JUD.1.24',
    // Revelation
    'REV.1.8', 'REV.3.20', 'REV.21.4',
    // Numbers
    'NUM.6.24-6.26',
    // Ruth
    'RUT.1.16',
    // 1 Kings
    '1KI.8.61',
    // 2 Kings
    '2KI.20.5',
    // Ezra
    'EZR.10.4',
    // Esther
    'EST.4.14',
    // Hosea
    'HOS.10.12',
    // Joel
    'JOL.2.13', 'JOL.2.25',
    // Amos
    'AMO.5.24',
    // Jonah
    'JON.2.9',
    // Nahum
    'NAH.1.7',
    // Haggai
    'HAG.2.4',
    // 1 Timothy
    '1TI.4.12', '1TI.6.6', '1TI.6.12',
    // Philemon
    'PHM.1.6',
    // 3 John
    '3JN.1.2', '3JN.1.4',
    // 2 John
    '2JN.1.6'
];

// Get verse of the day based on UTC date (same for everyone worldwide)
function getTodaysVerseId() {
    const now = new Date();
    // Use UTC date to ensure everyone sees the same verse regardless of timezone
    const year = now.getUTCFullYear();
    const month = now.getUTCMonth();
    const day = now.getUTCDate();
    
    // Create a seed from the date (YYYYMMDD format)
    const seed = year * 10000 + (month + 1) * 100 + day;
    
    // Simple seeded random function
    const random = (seed) => {
        const x = Math.sin(seed) * 10000;
        return x - Math.floor(x);
    };
    
    // Use seed to pick a random verse that will be the same for everyone today
    const index = Math.floor(random(seed) * verseIds.length);
    return verseIds[index];
}

// Fetch verse of the day from API.bible
async function fetchVerseOfDay() {
    const verseId = getTodaysVerseId();
    const url = `${API_BASE_URL}/bibles/${BIBLE_ID}/passages/${verseId}?content-type=text&include-notes=false&include-titles=false&include-chapter-numbers=false&include-verse-numbers=false&include-verse-spans=false`;
    
    console.log('fetching verse from:', url);
    console.log('using verse ID:', verseId);
    console.log('api key:', API_KEY);
    
    const response = await fetch(url, {
        headers: {
            'api-key': API_KEY
        }
    });

    console.log('response status:', response.status);

    if (!response.ok) {
        const errorData = await response.text();
        console.error('api error:', errorData);
        throw new Error(`api returned status ${response.status}: ${errorData}`);
    }

    const data = await response.json();
    console.log('api response:', data);
    
    const passage = data.data.content;
    const reference = data.data.reference;

    // Clean up the text
    const cleanText = passage.trim().replace(/\s+/g, ' ');

    return {
        text: cleanText,
        reference: reference
    };
}

// Get today's verse (from cache or API)
async function getTodaysVerse() {
    const todayString = getTodayString();
    const cachedData = localStorage.getItem('dailyVerse');

    console.log('today\'s date:', todayString);
    console.log('cached data:', cachedData);

    if (cachedData) {
        const parsed = JSON.parse(cachedData);
        console.log('parsed cache:', parsed);
        // If cached verse is from today, use it
        if (parsed.date === todayString) {
            console.log('using cached verse from today');
            return parsed.verse;
        } else {
            console.log('cache is old, fetching new verse');
        }
    }

    // Otherwise, fetch verse of the day from API (only once per day)
    console.log('fetching new verse from api...');
    const verse = await fetchVerseOfDay();

    // Cache the verse with today's date
    localStorage.setItem('dailyVerse', JSON.stringify({
        date: todayString,
        verse: verse
    }));

    console.log('cached new verse:', verse);
    return verse;
}

// Display the verse
async function displayVerse() {
    try {
        currentVerse = await getTodaysVerse();
        document.getElementById('verseText').textContent = `"${currentVerse.text}"`;
        document.getElementById('verseReference').textContent = currentVerse.reference;
        updateSaveButton();
    } catch (error) {
        console.error('failed to display verse:', error);
        document.getElementById('verseText').textContent = `error loading verse: ${error.message}`;
        document.getElementById('verseReference').textContent = 'please check console for details';
    }
}

// Display current date
function displayDate() {
    const today = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    document.getElementById('currentDate').textContent = today.toLocaleDateString('en-US', options);
}

function scheduleDailyVerseRefresh() {
    if (nextVerseRefreshTimer) {
        clearTimeout(nextVerseRefreshTimer);
    }
    const now = new Date();
    const nextMidnightUTC = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1);
    const delay = nextMidnightUTC - now.getTime();
    nextVerseRefreshTimer = setTimeout(async () => {
        localStorage.removeItem('dailyVerse');
        await displayVerse();
        displayDate();
        scheduleDailyVerseRefresh();
    }, Math.max(1000, delay));
}

// ---------- Streak helpers ----------

function toDateStringUTC(dateObj) {
    const year = dateObj.getUTCFullYear();
    const month = String(dateObj.getUTCMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function isSameDay(a, b) {
    return a === b;
}

function isYesterday(lastDate, today) {
    const date = new Date(`${lastDate}T00:00:00Z`);
    date.setUTCDate(date.getUTCDate() + 1);
    return toDateStringUTC(date) === today;
}

function trimHistory(history) {
    if (!Array.isArray(history)) return [];
    const unique = Array.from(new Set(history));
    const sorted = unique.sort();
    return sorted.slice(-STREAK_HISTORY_DAYS);
}

async function loadFirestoreApi() {
    if (firestoreApi) return firestoreApi;
    if (!window.firebaseDb) return null;
    try {
        firestoreApi = await import('https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js');
        return firestoreApi;
    } catch (err) {
        console.error('failed to load firestore api', err);
        return null;
    }
}

function getUserDocRef(uid, { doc }) {
    return doc(window.firebaseDb, 'users', uid);
}

async function loadStreakData(uid) {
    const api = await loadFirestoreApi();
    if (!api || !uid) {
        const local = localStorage.getItem('streakData');
        streakData = local ? JSON.parse(local) : { currentStreak: 0, lastVisit: null, history: [] };
        return;
    }

    const { getDoc } = api;
    const ref = getUserDocRef(uid, api);
    const snap = await getDoc(ref);
    if (snap.exists()) {
        const data = snap.data();
        streakData = {
            currentStreak: data.currentStreak || 0,
            lastVisit: data.lastVisit || null,
            history: data.history || []
        };
    } else {
        streakData = { currentStreak: 0, lastVisit: null, history: [] };
    }
}

async function saveStreakData(uid) {
    streakData.history = trimHistory(streakData.history);
    const api = await loadFirestoreApi();
    if (!api || !uid) {
        localStorage.setItem('streakData', JSON.stringify(streakData));
        return;
    }
    const { setDoc } = api;
    const ref = getUserDocRef(uid, api);
    await setDoc(ref, {
        currentStreak: streakData.currentStreak,
        lastVisit: streakData.lastVisit,
        history: streakData.history
    }, { merge: true });
}

async function updateStreakForToday(uid) {
    const today = getTodayString();
    const historySet = new Set(streakData.history || []);

    if (streakData.lastVisit && isSameDay(streakData.lastVisit, today)) {
        return false;
    }

    const continued = streakData.lastVisit && isYesterday(streakData.lastVisit, today);
    streakData.currentStreak = continued ? (streakData.currentStreak || 0) + 1 : 1;
    streakData.lastVisit = today;
    historySet.add(today);
    streakData.history = Array.from(historySet);
    await saveStreakData(uid);
    hasMarkedToday = true;
    return true;
}

function setAccountButtonDefault() {
    const btn = document.getElementById('accountButton');
    if (!btn) return;
    btn.classList.remove('streak-mode', 'animating');
    btn.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
            <circle cx="12" cy="7" r="4"></circle>
        </svg>
    `;
    btn.setAttribute('aria-label', 'account');
}

function setAccountButtonStreak() {
    const btn = document.getElementById('accountButton');
    if (!btn) return;
    btn.classList.add('streak-mode');
    btn.innerHTML = `
        <div class="streak-ring">
            <svg class="streak-fire-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 2C12 2 7 7 7 12C7 15.866 9.686 19 12 19C14.314 19 17 15.866 17 12C17 9 14 7 14 7C14 7 14.5 10 12 12C10.5 10.5 11 7.5 12 6.5C13 5.5 12 2 12 2Z" fill="currentColor" stroke="currentColor"></path>
            </svg>
        </div>
    `;
    btn.setAttribute('aria-label', 'view streak');
}

function triggerStreakAnimation() {
    const btn = document.getElementById('accountButton');
    if (!btn) return;
    btn.classList.remove('animating');
    // Force reflow so animation restarts
    void btn.offsetWidth;
    btn.classList.add('animating');
    setTimeout(() => btn.classList.remove('animating'), 1400);
}

function renderStreakPanel() {
    const calendarEl = document.getElementById('streakCalendar');
    const daysEl = document.getElementById('streakPanelDays');
    if (!calendarEl || !daysEl) return;

    const today = new Date();
    const historySet = new Set(streakData.history || []);
    const year = today.getUTCFullYear();
    const month = today.getUTCMonth();
    const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();

    const items = [];
    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(Date.UTC(year, month, day));
        const iso = toDateStringUTC(date);
        const completed = historySet.has(iso);
        const weekday = date.toLocaleDateString('en-US', { weekday: 'short' }).toLowerCase();
        items.push(`
            <div class="streak-day ${completed ? 'done' : 'missed'}">
                <div class="day-fire">${completed ? '🔥' : '—'}</div>
                <div class="day-number">${day}</div>
                <div class="day-label">${weekday}</div>
            </div>
        `);
    }

    calendarEl.innerHTML = items.join('');
    const count = streakData.currentStreak || 0;
    daysEl.textContent = `${count} day${count === 1 ? '' : 's'}`;
}

function updateStreakUI(loggedIn) {
    if (loggedIn) {
        setAccountButtonStreak();
        renderStreakPanel();
    } else {
        setAccountButtonDefault();
        closeStreakPanel();
    }
}

function openStreakPanel() {
    const panel = document.getElementById('streakPanel');
    const backdrop = document.getElementById('streakPanelBackdrop');
    if (!panel || !backdrop) return;
    renderStreakPanel();
    panel.classList.remove('hidden');
    backdrop.classList.remove('hidden');
}

function closeStreakPanel() {
    const panel = document.getElementById('streakPanel');
    const backdrop = document.getElementById('streakPanelBackdrop');
    if (!panel || !backdrop) return;
    panel.classList.add('hidden');
    backdrop.classList.add('hidden');
}

function toggleStreakPanel() {
    const panel = document.getElementById('streakPanel');
    if (!panel) return;
    const isOpen = !panel.classList.contains('hidden');
    if (isOpen) {
        closeStreakPanel();
    } else {
        openStreakPanel();
    }
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
    const iconSvg = saveButton.querySelector('svg');
    
    if (isVerseSaved()) {
        saveButton.classList.add('saved');
        // Change to filled bookmark
        iconSvg.innerHTML = `<path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" fill="currentColor" stroke="currentColor"></path>`;
        saveButton.setAttribute('aria-label', 'Unsave verse');
    } else {
        saveButton.classList.remove('saved');
        // Change to outline bookmark
        iconSvg.innerHTML = `<path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>`;
        saveButton.setAttribute('aria-label', 'Save verse');
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
        showNotification('verse saved');
        updateSaveButton();
    } else {
        // Remove from saved
        const filtered = savedVerses.filter(v => v.reference !== currentVerse.reference);
        localStorage.setItem('savedVerses', JSON.stringify(filtered));
        showNotification('verse unsaved');
        updateSaveButton();
    }
}

// Share verse functionality
async function shareVerse() {
    const shareText = `"${currentVerse.text}" - ${currentVerse.reference}`;
    
    if (navigator.share) {
        try {
            await navigator.share({
                title: 'that daily bread',
                text: shareText,
                url: window.location.href
            });
            showNotification('verse shared');
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
            showNotification('verse copied to clipboard');
        }).catch(() => {
            showNotification('unable to copy verse :(');
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
            showNotification('verse copied to clipboard');
        } catch (err) {
            showNotification('unable to copy verse :(');
        }
        document.body.removeChild(textArea);
    }
}

// Event listeners
document.getElementById('saveButton').addEventListener('click', saveVerse);
document.getElementById('shareButton').addEventListener('click', shareVerse);
document.getElementById('savedVersesButton').addEventListener('click', toggleSavedVerses);

// Toggle saved verses view
function toggleSavedVerses() {
    const savedView = document.getElementById('savedVersesView');
    const isShowing = savedView.classList.contains('active');
    
    if (isShowing) {
        hideSavedVerses();
    } else {
        showSavedVerses();
    }
}

// Show saved verses with animation
function showSavedVerses() {
    const verseBox = document.getElementById('verseBox');
    const dailyView = document.getElementById('dailyVerseView');
    const savedView = document.getElementById('savedVersesView');
    const savedButton = document.getElementById('savedVersesButton');
    const savedContainer = document.getElementById('savedVersesContainer');
    const savedVerses = JSON.parse(localStorage.getItem('savedVerses') || '[]');
    
    console.log('Saved verses:', savedVerses);
    
    // Transform button to X icon
    const iconSvg = savedButton.querySelector('.icon');
    iconSvg.innerHTML = '<line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line>';
    savedButton.classList.add('showing-close');
    
    // Hide daily verse
    dailyView.classList.add('hidden');
    
    // Populate saved verses
    if (savedVerses.length === 0) {
        savedContainer.innerHTML = '<p class="no-verses">No saved verses yet. Save a verse to see it here!</p>';
    } else {
        savedContainer.innerHTML = savedVerses.map((verse, index) => {
            const date = new Date(verse.savedDate);
            const dateStr = date.toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            });
            
            // Escape HTML to prevent breaking the template
            const escapeHtml = (text) => {
                const div = document.createElement('div');
                div.textContent = text;
                return div.innerHTML;
            };
            
            return `
                <div class="saved-verse-item">
                    <p class="saved-verse-text">"${escapeHtml(verse.text)}"</p>
                    <p class="saved-verse-reference">${escapeHtml(verse.reference)}</p>
                    <p class="saved-verse-date">Saved on ${dateStr}</p>
                    <div class="saved-verse-actions">
                        <button class="delete-saved-verse" onclick="deleteSavedVerse(${index})" aria-label="Remove verse">
                            <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="3 6 5 6 21 6"></polyline>
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                <line x1="10" y1="11" x2="10" y2="17"></line>
                                <line x1="14" y1="11" x2="14" y2="17"></line>
                            </svg>
                        </button>
                        <button class="share-saved-verse" onclick="shareSavedVerse(${index})" aria-label="Share verse">
                            <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <circle cx="18" cy="5" r="3"></circle>
                                <circle cx="6" cy="12" r="3"></circle>
                                <circle cx="18" cy="19" r="3"></circle>
                                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
                                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
                            </svg>
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    }
    
    // Show saved verses view
    verseBox.classList.add('showing-saved');
    savedView.classList.add('active');
}

// Hide saved verses with reverse animation
function hideSavedVerses() {
    const verseBox = document.getElementById('verseBox');
    const dailyView = document.getElementById('dailyVerseView');
    const savedView = document.getElementById('savedVersesView');
    const savedButton = document.getElementById('savedVersesButton');
    
    // Restore button to library icon
    const iconSvg = savedButton.querySelector('.icon');
    iconSvg.innerHTML = '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>';
    savedButton.classList.remove('showing-close');
    
    // Hide saved verses view
    savedView.classList.remove('active');
    verseBox.classList.remove('showing-saved');
    
    // Show daily verse
    dailyView.classList.remove('hidden');
}

// Delete a saved verse
function deleteSavedVerse(index) {
    const savedVerses = JSON.parse(localStorage.getItem('savedVerses') || '[]');
    const deletedVerse = savedVerses[index];
    savedVerses.splice(index, 1);
    localStorage.setItem('savedVerses', JSON.stringify(savedVerses));
    
    // Update save button if current verse was deleted
    if (deletedVerse.reference === currentVerse.reference) {
        updateSaveButton();
    }
    
    // Refresh saved verses view
    showSavedVerses();
    showNotification('verse removed');
}

// Share a saved verse
async function shareSavedVerse(index) {
    const savedVerses = JSON.parse(localStorage.getItem('savedVerses') || '[]');
    const verse = savedVerses[index];
    const shareText = `"${verse.text}" - ${verse.reference}`;
    
    if (navigator.share) {
        try {
            await navigator.share({
                title: 'that daily bread',
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

// Initialize
displayVerse();
displayDate();
scheduleDailyVerseRefresh();

// Hide loading screen after 1 second
window.addEventListener('load', () => {
    setTimeout(() => {
        const loadingScreen = document.getElementById('loadingScreen');
        loadingScreen.classList.add('hidden');
    }, 1000);
});

// Background image slideshow
const backgroundImages = [
    'calming1.jpg',
    'calming2.jpg',
    'calming3.jpg',
    'calming4.jpg',
    'calming5.jpg',
    'calming6.jpg',
    'calming7.jpg',
    'calming8.jpg',
    'calming9.jpg',
    'calming10.jpg'
];

let currentImageIndex = 0;
let currentBgElement = 1;

// Initialize first image
document.getElementById('bgImage1').style.backgroundImage = `url('${backgroundImages[0]}')`;

// Rotate background images
function rotateBackgroundImage() {
    currentImageIndex = (currentImageIndex + 1) % backgroundImages.length;
    currentBgElement = currentBgElement === 1 ? 2 : 1;
    
    const nextElement = document.getElementById(`bgImage${currentBgElement}`);
    const prevElement = document.getElementById(`bgImage${currentBgElement === 1 ? 2 : 1}`);
    
    nextElement.style.backgroundImage = `url('${backgroundImages[currentImageIndex]}')`;
    nextElement.classList.add('active');
    prevElement.classList.remove('active');
}

// Change image every 7 seconds
setInterval(rotateBackgroundImage, 7000);

// Firebase Authentication
let currentUser = null;

// Setup Firebase auth state listener
function setupFirebase() {
    if (!window.firebaseAuth) {
        console.log('Firebase not initialized yet');
        return;
    }
    
    window.firebaseAuth.onAuthStateChanged(async (user) => {
        currentUser = user;
        if (user) {
            showAccountProfile(user);
            await loadStreakData(user.uid);
            const addedToday = await updateStreakForToday(user.uid);
            updateStreakUI(true);
            if (addedToday) {
                triggerStreakAnimation();
            }
        } else {
            hasMarkedToday = false;
            streakData = { currentStreak: 0, lastVisit: null, history: [] };
            updateStreakUI(false);
            showLoginForm();
        }
    });
}

// Show account profile
function showAccountProfile(user) {
    document.getElementById('accountProfile').classList.remove('hidden');
    document.getElementById('loginForm').classList.add('hidden');
    document.getElementById('signupForm').classList.add('hidden');
    document.getElementById('userEmail').textContent = user.email;
}

// Show login form
function showLoginForm() {
    document.getElementById('loginForm').classList.remove('hidden');
    document.getElementById('signupForm').classList.add('hidden');
    document.getElementById('accountProfile').classList.add('hidden');
}

// Login
async function login() {
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    if (!email || !password) {
        showNotification('please enter email and password');
        return;
    }
    
    try {
        const { signInWithEmailAndPassword } = await import('https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js');
        await signInWithEmailAndPassword(window.firebaseAuth, email, password);
        showNotification('logged in successfully');
        closeAuthModal();
    } catch (error) {
        console.error('Login error:', error);
        showNotification('login failed: ' + error.message);
    }
}

// Sign up
async function signup() {
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;
    const confirm = document.getElementById('signupConfirm').value;
    
    if (!email || !password || !confirm) {
        showNotification('please fill in all fields');
        return;
    }
    
    if (password !== confirm) {
        showNotification('passwords do not match');
        return;
    }
    
    try {
        const { createUserWithEmailAndPassword } = await import('https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js');
        await createUserWithEmailAndPassword(window.firebaseAuth, email, password);
        showNotification('account created successfully');
        closeAuthModal();
    } catch (error) {
        console.error('Signup error:', error);
        showNotification('signup failed: ' + error.message);
    }
}

// Logout
async function logout() {
    try {
        const { signOut } = await import('https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js');
        await signOut(window.firebaseAuth);
        showNotification('logged out');
        closeAuthModal();
    } catch (error) {
        console.error('Logout error:', error);
    }
}

// Auth modal functions
function openAuthModal() {
    document.getElementById('authModal').classList.add('show');
}

function closeAuthModal() {
    document.getElementById('authModal').classList.remove('show');
    document.getElementById('loginEmail').value = '';
    document.getElementById('loginPassword').value = '';
    document.getElementById('signupEmail').value = '';
    document.getElementById('signupPassword').value = '';
    document.getElementById('signupConfirm').value = '';
}

// Auth event listeners
if (document.getElementById('accountButton')) {
    document.getElementById('accountButton').addEventListener('click', () => {
        if (currentUser) {
            toggleStreakPanel();
        } else {
            openAuthModal();
        }
    });
}
if (document.getElementById('authModalClose')) {
    document.getElementById('authModalClose').addEventListener('click', closeAuthModal);
}
if (document.getElementById('loginBtn')) {
    document.getElementById('loginBtn').addEventListener('click', login);
}
if (document.getElementById('signupBtn')) {
    document.getElementById('signupBtn').addEventListener('click', signup);
}
if (document.getElementById('logoutBtn')) {
    document.getElementById('logoutBtn').addEventListener('click', logout);
}
if (document.getElementById('switchToSignup')) {
    document.getElementById('switchToSignup').addEventListener('click', () => {
        document.getElementById('loginForm').classList.add('hidden');
        document.getElementById('signupForm').classList.remove('hidden');
    });
}
if (document.getElementById('switchToLogin')) {
    document.getElementById('switchToLogin').addEventListener('click', () => {
        document.getElementById('signupForm').classList.add('hidden');
        document.getElementById('loginForm').classList.remove('hidden');
    });
}
if (document.getElementById('authModal')) {
    document.getElementById('authModal').addEventListener('click', (e) => {
        if (e.target.id === 'authModal') {
            closeAuthModal();
        }
    });
}

// Streak panel events
if (document.getElementById('streakPanelClose')) {
    document.getElementById('streakPanelClose').addEventListener('click', closeStreakPanel);
}
if (document.getElementById('streakPanelBackdrop')) {
    document.getElementById('streakPanelBackdrop').addEventListener('click', closeStreakPanel);
}

// Setup Firebase when available
setTimeout(() => {
    setupFirebase();
}, 500);

// Hide loading screen after 1 second
window.addEventListener('load', () => {
    setTimeout(() => {
        const loadingScreen = document.getElementById('loadingScreen');
        loadingScreen.classList.add('hidden');
    }, 1000);
});
