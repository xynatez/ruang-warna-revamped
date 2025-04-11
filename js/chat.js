/* js/chat.js (REVISED - Visual Viewport API & Enhanced Prompt) */
document.addEventListener('DOMContentLoaded', () => {
    // Pastikan dependensi ada
    if (typeof getResultInterpretation === 'undefined' || typeof resultCategories === 'undefined') {
         console.error("ChatJS: Dependencies (getResultInterpretation/resultCategories) not loaded!");
         // Nonaktifkan input atau tampilkan pesan error (Kode Anda sudah benar)
          const messageInput = document.getElementById('messageInput');
          const chatForm = document.getElementById('chatForm');
          if(messageInput) messageInput.disabled = true;
          if(messageInput) messageInput.placeholder = "Gagal memuat komponen chat...";
          if(chatForm) chatForm.querySelector('button[type="submit"]').disabled = true;
          const systemMessageElement = document.getElementById('systemMessage');
           if(systemMessageElement) systemMessageElement.textContent = "Error: Komponen penting tidak dimuat. Chat tidak tersedia.";
          return; // Hentikan eksekusi
    }

    // --- Elemen DOM ---
    const chatMessagesContainer = document.getElementById('chatMessages');
    const messageInput = document.getElementById('messageInput');
    const chatForm = document.getElementById('chatForm');
    const typingIndicator = document.getElementById('typingIndicator');
    const systemMessageElement = document.getElementById('systemMessage');
    const bodyElement = document.body; // << BARU: Referensi ke body

    // --- State ---
    let chatHistory = []; // Format: { role: 'user'/'model', parts: [{text: '...'}] }
    let isAiTyping = false;
    let typingAbortController = null; // Untuk membatalkan animasi ketik jika perlu
    // let initialWindowHeight = window.innerHeight; // (Opsional, bisa digunakan jika perlu)

    // --- Helper ---
    const getSessionData = window.getSessionData || function(key) { console.warn("ChatJS: getSessionData fallback used"); return null; };
    const setSessionData = window.setSessionData || function(key, value) { console.warn("ChatJS: setSessionData fallback used"); };

    // --- Initialization ---
    function initializeChat() {
        chatHistory = getSessionData('chat_history') || [];
        if (chatHistory.length === 0) {
             systemMessageElement.textContent = "Sesi baru dimulai. Riwayat akan hilang jika browser ditutup.";
             const initialAIMsg = { role: 'model', parts: [{ text: "Halo! Saya Konselor AI Ruang Warna. Ada yang ingin Anda ceritakan atau diskusikan hari ini?" }] };
              chatHistory.push(initialAIMsg);
              renderSingleMessage(initialAIMsg); // Render pesan ini saja
             // Jangan simpan pesan awal ini ke session storage
        } else {
              systemMessageElement.textContent = "Melanjutkan sesi sebelumnya...";
              renderAllMessagesFromHistory(); // Render semua history saat load
        }
         // Panggil penyesuaian layout awal SEBELUM scroll akhir
         adjustLayoutForKeyboard(); // << BARU: Panggil penyesuaian awal
         scrollToBottom('auto'); // << MODIFIKASI: Scroll awal tanpa animasi
    }

    // --- Message Rendering ---
    function renderAllMessagesFromHistory() {
        if (!chatMessagesContainer) return;
        const messagesHtml = chatHistory.map(message => createMessageHTML(message)).join('');
        // Ambil teks system message yang sudah ada di HTML saat init, atau default
        const currentSystemText = systemMessageElement ? systemMessageElement.textContent : "Memulai sesi chat...";
        const systemMsgHtml = `<div class="text-center text-xs text-text-muted-light dark:text-text-muted-dark my-4 italic">${currentSystemText}</div>`;
        chatMessagesContainer.innerHTML = systemMsgHtml + messagesHtml;
    }

    function createMessageHTML(message) { /* ... Kode Anda (tidak berubah) ... */
        const textContent = message.parts[0]?.text || '';
        const isUser = message.role === 'user';
        return `
             <div class="message-wrapper flex ${isUser ? 'justify-end' : 'justify-start'} mb-3 animate-fade-in">
                 <div class="message-bubble max-w-[80%] md:max-w-[70%] p-3 rounded-xl shadow-sm
                     ${isUser
                         ? 'bg-primary dark:bg-primary-dark text-white dark:text-background-dark rounded-br-none'
                         : 'bg-content-bg-light dark:bg-content-bg-dark text-text-main-light dark:text-text-main-dark rounded-bl-none border border-border-color-light dark:border-border-color-dark'
                     }" data-message-role="${message.role}">
                     <div class="message-content whitespace-pre-wrap">${textContent.replace(/\n/g, '<br>')}</div>
                 </div>
             </div>`;
    }

    function renderSingleMessage(message) {
         if (!chatMessagesContainer) return;
         const messageHtml = createMessageHTML(message);
         chatMessagesContainer.insertAdjacentHTML('beforeend', messageHtml);
         scrollToBottom(); // Scroll setelah menambahkan pesan
    }

    // --- Scroll Logic ---
    // MODIFIKASI: Terima parameter 'behavior'
    function scrollToBottom(behavior = 'smooth') {
        if(chatMessagesContainer) {
            // Beri sedikit waktu agar render selesai & layout terupdate
             setTimeout(() => {
                 chatMessagesContainer.scrollTo({
                    top: chatMessagesContainer.scrollHeight,
                    behavior: behavior // Gunakan behavior yang diberikan
                 });
            }, 50); // Sedikit delay
        }
    }

    // --- Typing Effect ---
    async function typeEffect(element, text, speed = 35) { /* ... Kode Anda (tidak berubah, tapi pastikan scrollToBottom di dalamnya tidak mengganggu) ... */
        // Batalkan animasi ketik sebelumnya jika ada
        if (typingAbortController) {
             typingAbortController.abort();
        }
        typingAbortController = new AbortController();
        const signal = typingAbortController.signal;

       element.innerHTML = ''; // Kosongkan elemen target
       const processedText = text.replace(/<br\s*\/?>/gi, '\n'); // Ganti <br> kembali ke newline untuk proses
       let index = 0;

       return new Promise((resolve) => {
           function typeCharacter() {
               if (signal.aborted) {
                    console.log("Typing aborted.");
                    element.innerHTML = text.replace(/\n/g, '<br>'); // Tampilkan sisa teks jika dibatalkan (pastikan ada <br>)
                    scrollToBottom('auto'); // Scroll cepat ke bawah saat batal
                    resolve(); // Selesaikan promise
                    return;
               }

               if (index < processedText.length) {
                   const char = processedText[index];
                   if (char === '\n') {
                       element.innerHTML += '<br>'; // Tambahkan <br> untuk newline
                   } else {
                       element.textContent += char; // Gunakan textContent agar aman dari HTML injection
                   }
                   index++;
                   scrollToBottom('auto'); // Scroll cepat saat mengetik
                   setTimeout(typeCharacter, speed + (Math.random() * speed * 0.5 - speed * 0.25)); // Tambahkan variasi kecepatan
               } else {
                    typingAbortController = null; // Reset controller
                    resolve(); // Selesai
               }
           }
           typeCharacter(); // Mulai mengetik
       });
   }

    // --- AI Interaction ---
    async function sendMessageToAI(userMessageText) { /* ... Kode Anda (tidak berubah secara fundamental, pastikan scroll diatur)... */
        if (isAiTyping) return;

        // 1. Tambahkan pesan user ke history & render
        const userMessage = { role: 'user', parts: [{ text: userMessageText.trim() }] };
        chatHistory.push(userMessage);
        setSessionData('chat_history', chatHistory);
        renderSingleMessage(userMessage); // Ini akan memanggil scrollToBottom()

        // 2. Tampilkan indikator loading AI
        isAiTyping = true;
        typingIndicator.classList.remove('hidden');
        scrollToBottom('auto'); // Pastikan indikator terlihat

        // 3. Persiapan API Call (Kode Anda)
        const apiKey = "AIzaSyDP-3ba4HulshOKZkVzll7bFdGYkcP8bQQ"; // <<< GANTI / GUNAKAN PROXY!
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`;

        if (apiKey === "YOUR_GEMINI_API_KEY" || !apiKey) {
             // **PENTING:** Anda butuh fungsi addMessage atau modifikasi renderSingleMessage untuk pesan sistem error ini
             // Contoh: renderSingleMessage({ role: 'model', parts: [{ text: "Maaf, koneksi ke AI sedang tidak aktif..." }] });
             console.error("API Key not set"); // Placeholder
             isAiTyping = false;
             typingIndicator.classList.add('hidden');
             return;
        }

        // 4. Enhanced System Instruction (Kode Anda)
         const screeningData = getSessionData('screening_results');
         let screeningContext = "[Informasi screening tidak tersedia di sesi ini]";
         if (screeningData && screeningData.answers) {
              const interpretation = typeof getResultInterpretation !== 'undefined'
                                    ? getResultInterpretation(screeningData.screening_type, screeningData.answers)
                                    : null;
              screeningContext = `[Konteks Screening Pengguna (jika relevan): Tipe=${screeningData.screening_type || 'N/A'}, Skor=${interpretation?.score ?? 'N/A'}, Kategori=${interpretation?.category ?? 'N/A'}]`;
         }
        const systemInstruction = `...`; // (Instruksi sistem Anda yang panjang)

        // 5. Persiapan History untuk API (Kode Anda)
        const historyForAPI = chatHistory.slice(-8);
        console.log("ChatJS: Sending to Gemini...");

        let aiResponseText = "Maaf, terjadi kendala. Silakan coba lagi."; // Default error text

        try {
            // 6. API Call (Kode Anda)
            const response = await fetch(apiUrl, { /* ... */ });

            // 7. Parsing Respons (Kode Anda)
            const responseDataText = await response.text();
            // ... (error handling Anda) ...
            if (!response.ok) { throw new Error(`API Error (${response.status})`); }
            let data = JSON.parse(responseDataText);

            // 8. Ekstrak Teks Respons AI (Kode Anda)
            if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
                  aiResponseText = data.candidates[0].content.parts[0].text;
             } else if (data.promptFeedback?.blockReason) {
                  aiResponseText = `... (pesan blokir Anda) ...`;
             } else {
                  aiResponseText = `... (pesan bingung Anda) ...`;
             }

        } catch (error) {
            console.error("ChatJS: Error sending/processing AI message:", error);
            aiResponseText = `Maaf, terjadi kesalahan teknis (${error.message}).`;
        } finally {
            // 9. Sembunyikan Indikator Loading
             typingIndicator.classList.add('hidden');

            // 10. Tambahkan Respons AI ke History
            const aiMessage = { role: 'model', parts: [{ text: aiResponseText.trim() }] };
            chatHistory.push(aiMessage);
            setSessionData('chat_history', chatHistory);

             // 11. Buat Bubble Kosong & Mulai Animasi Ketik
             const aiBubbleWrapper = document.createElement('div');
             aiBubbleWrapper.innerHTML = createMessageHTML(aiMessage);
             const aiBubbleContentElement = aiBubbleWrapper.querySelector('.message-content');

             if (aiBubbleContentElement) {
                 chatMessagesContainer.appendChild(aiBubbleWrapper.firstElementChild);
                 scrollToBottom('auto'); // Scroll sebelum mulai ketik
                 await typeEffect(aiBubbleContentElement, aiResponseText, 35); // Jalankan animasi ketik (ini juga scroll)
             } else {
                 renderSingleMessage(aiMessage); // Fallback
             }

             // 12. Izinkan input user lagi SETELAH animasi selesai
             isAiTyping = false;
             // Mungkin tidak perlu focus() jika keyboard sudah muncul
             // messageInput.focus();
        }
    }


    // --- *** Layout Adjustment Logic (BARU) *** ---
    function adjustLayoutForKeyboard() {
        if (!window.visualViewport) {
            console.warn("Visual Viewport API not supported. Keyboard adjustment might not be automatic.");
            return; // Keluar jika API tidak didukung
        }

        // Hitung tinggi keyboard (atau area yang tertutup di bawah)
        const keyboardHeight = window.innerHeight - window.visualViewport.height;

        // Terapkan padding bawah ke body untuk mendorong konten ke atas
        // Hanya terapkan jika keyboard dianggap muncul (tinggi > 0)
        // Beri batas minimal (misal 50px) untuk mengabaikan perubahan kecil karena UI browser
        if (keyboardHeight > 50) {
             // Pastikan padding tidak negatif (jarang terjadi tapi untuk keamanan)
            bodyElement.style.paddingBottom = `${Math.max(0, keyboardHeight)}px`;
        } else {
            bodyElement.style.paddingBottom = '0px'; // Reset jika keyboard hilang/kecil
        }

        // PENTING: Scroll ke bawah setelah layout disesuaikan (tanpa animasi)
        scrollToBottom('auto');
    }

    // --- Event Listeners ---
    chatForm.addEventListener('submit', (event) => {
        event.preventDefault();
        const messageText = messageInput.value.trim();
        if (messageText && !isAiTyping) {
             if (typingAbortController) {
                 typingAbortController.abort();
             }
            sendMessageToAI(messageText);
            messageInput.value = '';
        }
    });

    messageInput.addEventListener('input', () => {
        // Kode Anda (jika ada, tidak berubah)
    });


    // --- Event Listener untuk Visual Viewport & Fallback (BARU) ---
    if (window.visualViewport) {
        console.log("Visual Viewport API supported. Enabling automatic keyboard adjustment.");
        // Panggil saat ukuran visual viewport berubah (keyboard muncul/hilang)
        window.visualViewport.addEventListener('resize', adjustLayoutForKeyboard);

        // Panggil juga saat orientasi berubah (untuk reset/penyesuaian)
        window.addEventListener('orientationchange', () => {
            console.log("Orientation changed, adjusting layout.");
            // Beri sedikit waktu untuk orientasi selesai
            setTimeout(adjustLayoutForKeyboard, 150);
        });
    } else {
        // --- Fallback jika Visual Viewport API tidak didukung ---
        console.warn("Visual Viewport API not supported. Using focus/scrollIntoView fallback.");
        messageInput.addEventListener('focus', () => {
            // Saat input difokuskan, coba scroll ke view sebagai alternatif
            setTimeout(() => {
                // Coba 'block: 'end'' agar bagian bawah input sejajar dengan bagian bawah area terlihat
                messageInput.scrollIntoView({ behavior: 'smooth', block: 'end' });
            }, 350); // Delay sedikit lebih lama untuk fallback
        });
    }

    // --- Initial Load ---
    initializeChat(); // Ini akan memanggil adjustLayoutForKeyboard() dan scrollToBottom() di akhir

}); // Akhir DOMContentLoaded
