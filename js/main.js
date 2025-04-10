/* js/main.js (REVISED) */
document.addEventListener('DOMContentLoaded', () => {
    const darkModeToggle = document.getElementById('darkModeToggle');
    const htmlElement = document.documentElement;
    const moonIcon = `<i data-feather="moon" class="w-5 h-5"></i>`;
    const sunIcon = `<i data-feather="sun" class="w-5 h-5"></i>`;

    // Fungsi applyTheme yang dipanggil dari berbagai tempat
    window.applyTheme = (isDark) => {
        if (isDark) {
            htmlElement.classList.add('dark');
            if (darkModeToggle) darkModeToggle.innerHTML = sunIcon;
            sessionStorage.setItem('darkMode', 'true');
        } else {
            htmlElement.classList.remove('dark');
            if (darkModeToggle) darkModeToggle.innerHTML = moonIcon;
            sessionStorage.setItem('darkMode', 'false');
        }
        if (typeof feather !== 'undefined') {
             setTimeout(() => feather.replace({ width: '1em', height: '1em' }), 0);
        }
        // Dispatch custom event for charts or other elements to listen to theme changes
        window.dispatchEvent(new CustomEvent('themeChanged', { detail: { isDark } }));
    };

    // Initial theme check
    let initialDark = sessionStorage.getItem('darkMode') === 'true';
    window.applyTheme(initialDark);

    // Toggle listener
    if (darkModeToggle) {
        darkModeToggle.addEventListener('click', () => {
            const isCurrentlyDark = htmlElement.classList.contains('dark');
            window.applyTheme(!isCurrentlyDark);
        });
    }

    // --- Session Reset ---
    const resetAllButtons = document.querySelectorAll('#resetAllButton');
    const resetSession = () => {
        console.log("Resetting session data...");
        sessionStorage.clear();
        window.applyTheme(false); // Reset to light mode default
        console.log("Session storage cleared. Redirecting to Landing Page.");
        window.location.href = 'index.html';
    };

    resetAllButtons.forEach(button => {
        if (button) {
            button.addEventListener('click', (event) => {
                 event.preventDefault();
                 if (confirm("Yakin ingin mereset semua data sesi (hasil screening, chat) dan kembali ke beranda?")) {
                    resetSession();
                 }
            });
        }
    });

     // --- Global Helper Functions ---
    window.getSessionData = (key) => {
        const data = sessionStorage.getItem(key);
        if (data) { try { return JSON.parse(data); } catch (e) { console.error("getSessionData Error:", key, e); return null; } }
        return null;
    };
    window.setSessionData = (key, value) => {
        try { sessionStorage.setItem(key, JSON.stringify(value)); } catch (e) { console.error("setSessionData Error:", key, e); }
    };

     // Initial Feather Icons render
     if (typeof feather !== 'undefined') {
          feather.replace({ width: '1em', height: '1em' });
     } else {
         console.warn("Feather Icons script not ready on initial DOM load.");
     }
});
