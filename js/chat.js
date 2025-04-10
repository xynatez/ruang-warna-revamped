/*
js/chat.js (BERDASARKAN paste.txt [1] + PERBAIKAN SAFARI iOS)
Handles the AI chat interface, message sending/receiving, and interaction with Gemini API.
*/

// IMPORTANT: Replace with your actual Gemini API Key or use a secure proxy method
const GEMINI_API_KEY_CHAT = "AIzaSyDP-3ba4HulshOKZkVzll7bFdGYkcP8bQQ"; // <<< GANTI JIKA PERLU!
// Menggunakan URL API yang lebih stabil
const GEMINI_API_URL_CHAT = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${GEMINI_API_KEY_CHAT}`;

document.addEventListener('DOMContentLoaded', () => {
    // --- Elemen DOM ---
    const chatMessagesContainer = document.getElementById('chatMessages');
    const messageInput = document.getElementById('messageInput');
    const chatForm = document.getElementById('chatForm');
    const chatFooter = chatForm.closest('footer'); // Dapatkan elemen footer
    const typingIndicator = document.getElementById('typingIndicator');
    const systemMessageElement = document.getElementById('systemMessage');

    // --- State ---
    let chatHistory = []; // Format Asli: { role: 'user'/'model', text: '...' }
    let isAiTyping = false;

    // --- Helper Functions (Fallback) ---
    const getSessionData = window.getSessionData || function(key) {
        const data = sessionStorage.getItem(key);
        if (data) { try { return JSON.parse(data); } catch(e) { console.error("Fallback getSessionData error:", e); return null; } }
        return null;
    };
     const getResultInterpretation = window.getResultInterpretation || function(type, score) {
         console.warn("Fallback getResultInterpretation used in chat.js");
         // Coba implementasi sederhana jika screening-data.js gagal load
         // Ini hanya contoh, logika asli ada di screening-data.js
         if (typeof resultCategories !== 'undefined' && resultCategories[type]) {
             for (const cat of resultCategories[type]) {
                 if (score >= cat.range[0] && score <= cat.range[1]) return cat;
             }
         }
         return null;
     };

    // --- Initialization (Dari paste.txt [1]) ---
    function initializeChat() {
        chatHistory = [];
        sessionStorage.removeItem('chat_history');
        renderMessages(); // Render awal

         if (systemMessageElement) {
             systemMessageElement.classList.remove('hidden');
             systemMessageElement.textContent = "Sesi baru dimulai. Riwayat chat akan hilang jika browser ditutup.";
         }

         const screeningData = getSessionData('screening_results');
         if (screeningData) {
              console.log("Screening data found (Base: paste.txt).");
              // Tambahkan pesan AI awal jika perlu
              // addMessage('model', "Halo! Saya melihat hasil screening Anda...");
         } else {
              console.log("No screening data found (Base: paste.txt).");
              // Tambahkan pesan AI awal jika perlu
              addMessage('model', "Halo! Ada yang bisa saya bantu hari ini?");
         }
         // Pastikan scroll awal
         if (chatMessagesContainer) chatMessagesContainer.scrollTop = chatMessagesContainer.scrollHeight;
    }

    // --- Message Handling (Render disesuaikan ke HTML terbaru) ---
    function addMessage(role, text) {
        // Role disesuaikan ke format API ('user' atau 'model')
        const message = { role: role === 'ai' ? 'model' : 'user', text: text.trim() };
        chatHistory.push(message);
        // setSessionData('chat_history', chatHistory); // Uncomment jika ingin simpan history sesi ini
        renderMessages();
    }

    function renderMessages() {
        if (!chatMessagesContainer) return;

        // Simpan posisi scroll sebelum render ulang
        const scrollPos = chatMessagesContainer.scrollTop;
        const isScrolledToBottom = chatMessagesContainer.scrollHeight - chatMessagesContainer.scrollTop - chatMessagesContainer.clientHeight < 1;


        // Kosongkan container KECUALI system message
        const messages = chatMessagesContainer.querySelectorAll('.message-wrapper'); // Target wrapper
        messages.forEach(msg => msg.remove());

        // Render ulang dari history
        chatHistory.forEach(message => {
            const textContent = message.text || '';
            const isUser = message.role === 'user';

            const wrapper = document.createElement('div');
             wrapper.classList.add('message-wrapper', 'flex', 'mb-3'); // Struktur wrapper
             if (isUser) wrapper.classList.add('justify-end');
             else wrapper.classList.add('justify-start');

            const messageElement = document.createElement('div');
            messageElement.classList.add(
                'message-bubble', // Kelas generik
                'max-w-[80%]', 'md:max-w-[70%]', 'p-3', 'rounded-xl', // Ukuran & bentuk dari HTML terbaru
                'shadow-sm', 'animate-fade-in' // Efek dasar
            );

            // Tambahkan kelas warna & alignment sesuai role (dari config TERBARU)
            if (isUser) {
                 messageElement.classList.add(
                     'bg-primary', 'dark:bg-primary-dark',
                     'text-white', 'dark:text-background-dark',
                     'rounded-br-none'
                 );
            } else { // role === 'model' (AI)
                 messageElement.classList.add(
                     'bg-content-bg-light', 'dark:bg-content-bg-dark',
                     'text-text-main-light', 'dark:text-text-main-dark',
                     'rounded-bl-none',
                     'border', 'border-border-color-light', 'dark:border-border-color-dark'
                 );
            }

            // Inner div untuk konten (agar whitespace-pre-wrap bekerja)
            const contentDiv = document.createElement('div');
            contentDiv.classList.add('message-content', 'whitespace-pre-wrap');
            contentDiv.innerHTML = textContent.replace(/\n/g, '<br>'); // Tetap pakai innerHTML untuk <br>

            messageElement.appendChild(contentDiv);
            wrapper.appendChild(messageElement);
            chatMessagesContainer.appendChild(wrapper);
        });

        // Kembalikan posisi scroll atau scroll ke bawah jika sebelumnya sudah di bawah
        if (isScrolledToBottom) {
             chatMessagesContainer.scrollTop = chatMessagesContainer.scrollHeight;
        } else {
             chatMessagesContainer.scrollTop = scrollPos; // Coba pertahankan posisi scroll
        }

        // Jika tidak ada pesan, pastikan scroll di atas
         if (chatHistory.length === 0 && systemMessageElement) {
              chatMessagesContainer.scrollTop = 0;
         }
    }

    // --- AI Interaction (Struktur dari paste.txt [1], API call disesuaikan) ---
    async function sendMessageToAI(userMessageText) {
        if (isAiTyping) return;

        addMessage('user', userMessageText);
        isAiTyping = true;
        typingIndicator.classList.remove('hidden');
        // Scroll manual setelah indikator muncul
        if (chatMessagesContainer) chatMessagesContainer.scrollTop = chatMessagesContainer.scrollHeight;


         if (GEMINI_API_KEY_CHAT === "YOUR_GEMINI_API_KEY" || !GEMINI_API_KEY_CHAT) {
             console.warn("ChatJS (paste.txt base): API Key not set.");
             addMessage('model', "Maaf, koneksi AI tidak aktif (Key?).");
             isAiTyping = false;
             typingIndicator.classList.add('hidden');
             return;
         }

        // --- Prepare Context & Instructions (Struktur dari paste.txt [1]) ---
        const screeningData = getSessionData('screening_results');
        let screeningContext = "[Riwayat screening tdk tersedia]";
        if (screeningData && screeningData.answers) {
             try {
                 // Kalkulasi skor (pastikan reduce aman)
                 const score = screeningData.answers.reduce((sum, answer) => sum + (answer === null ? 0 : Number(answer) || 0), 0);
                 // Dapatkan interpretasi (gunakan fallback jika perlu)
                 const interpretation = getResultInterpretation(screeningData.screening_type, score);
                 screeningContext = `[Konteks: Tipe=${screeningData.screening_type || 'N/A'}, Skor=${score}, Kategori=${interpretation?.category || 'N/A'}]`;
             } catch(e) {
                 console.error("Error processing screening context:", e);
                 screeningContext = "[Gagal proses screening context]";
             }
        }

        // Gabungkan instruksi dan history untuk format API 'contents'
         const historyForAPI = chatHistory.slice(-5); // Ambil 5 terakhir (termasuk user)
         const promptInstructions = `[INSTRUKSI AI] Kamu AI Konselor Ruang Warna. ${screeningContext}. Respons pesan terakhir 'user' dg hangat, empatik (Bahasa Indonesia). JANGAN diagnosis. Jika darurat >> 119. Peran: 'model'.`;

         const contents = [];
         // Add history
         historyForAPI.forEach((msg, index) => {
              if (index === historyForAPI.length - 1) { // Pesan user terakhir
                   // Sisipkan instruksi sebelum pesan user terakhir (metode paste.txt)
                   contents.push({ role: 'model', parts: [{ text: promptInstructions }] });
                   contents.push({ role: msg.role, parts: [{ text: msg.text }] });
               } else {
                   contents.push({ role: msg.role, parts: [{ text: msg.text }] });
               }
          });
          // Handle jika history kosong atau hanya ada user pertama
           if (historyForAPI.length <= 1 && historyForAPI[0]?.role === 'user') {
                contents.unshift({ role: 'model', parts: [{ text: promptInstructions }] });
           }


          console.log("ChatJS (paste.txt base): Sending Contents Roles:", JSON.stringify(contents.map(c=>c.role)));

        let aiResponseText = "Maaf, saya tidak bisa merespons saat ini.";

        try {
             const response = await fetch(GEMINI_API_URL_CHAT, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: contents, // Kirim history+instruksi gabungan
                    // safetySettings & generationConfig bisa ditambahkan jika perlu
                    safetySettings: [ { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" }, /* ...lainnya... */ ],
                    generationConfig: { temperature: 0.7, maxOutputTokens: 400 }
                })
            });

            // Parsing & Error Handling
            const responseDataText = await response.text();
            console.log("ChatJS (paste.txt base): Raw API Status:", response.status);
            // console.log("ChatJS (paste.txt base): Raw API Body:", responseDataText);

            if (!response.ok) {
                 let errorData = null; try { errorData = JSON.parse(responseDataText); } catch (e) {}
                 console.error("ChatJS (paste.txt base): API Error:", errorData);
                 let errorMsg = `API Error (${response.status})`;
                 if (errorData?.promptFeedback?.blockReason) errorMsg = `Diblokir: ${errorData.promptFeedback.blockReason}`;
                 else if (errorData?.error?.message) errorMsg += `: ${errorData.error.message}`;
                 throw new Error(errorMsg);
            }

            let data = null; try { data = JSON.parse(responseDataText); } catch (e) { throw new Error("Gagal proses respons JSON."); }

             // Ekstrak Teks
             if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
                  aiResponseText = data.candidates[0].content.parts[0].text;
             } else if (data.promptFeedback?.blockReason) {
                 aiResponseText = `Tidak bisa respons (${data.promptFeedback.blockReason}).`;
             } else {
                  console.warn("ChatJS (paste.txt base): No candidates found:", data);
                  aiResponseText = "Hmmm, coba lagi?";
             }

            // Add AI message
            addMessage('model', aiResponseText);

        } catch (error) {
            console.error("ChatJS (paste.txt base): Error in sendMessageToAI:", error);
            addMessage('model', `Error: ${error.message}`);
        } finally {
            isAiTyping = false;
            typingIndicator.classList.add('hidden');
        }
    }

    // --- Event Listeners ---
    // Submit Form (Dari paste.txt [1])
    chatForm.addEventListener('submit', (event) => {
        event.preventDefault();
        const messageText = messageInput.value.trim();
        if (messageText && !isAiTyping) {
            sendMessageToAI(messageText);
            messageInput.value = '';
        }
    });

    // ===== PERBAIKAN SAFARI iOS (DITERAPKAN DI SINI) =====
    if (messageInput && chatFooter) {
        messageInput.addEventListener('focus', () => {
            console.log("Input focused, scrolling footer into view (paste.txt base)...");
            // Beri delay agar keyboard muncul
            setTimeout(() => {
                chatFooter.scrollIntoView({ behavior: 'smooth', block: 'end' });
                // Scroll chat messages ke bawah setelahnya
                setTimeout(() => {
                     if (chatMessagesContainer) chatMessagesContainer.scrollTop = chatMessagesContainer.scrollHeight;
                }, 150);
            }, 100);
        });
    } else {
        console.error("ChatJS (paste.txt base): messageInput or chatFooter not found for iOS fix.");
    }
    // ===== AKHIR PERBAIKAN =====


    // --- Initial Load ---
    initializeChat();

});
