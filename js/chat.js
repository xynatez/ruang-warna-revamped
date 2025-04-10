/* js/chat.js (REVISED - Added iOS Keyboard Fix) */
document.addEventListener('DOMContentLoaded', () => {
    // Pastikan dependensi ada
    if (typeof getResultInterpretation === 'undefined' || typeof resultCategories === 'undefined') {
         console.error("ChatJS: Dependencies (getResultInterpretation/resultCategories) not loaded!");
         // Nonaktifkan input atau tampilkan pesan error
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
    const chatFooter = chatForm.closest('footer'); // Dapatkan elemen footer terdekat
    const typingIndicator = document.getElementById('typingIndicator');
    const systemMessageElement = document.getElementById('systemMessage');

    // --- State ---
    let chatHistory = [];
    let isAiTyping = false;
    let typingAbortController = null;

    // --- Helper ---
    const getSessionData = window.getSessionData || function(key) { console.warn("ChatJS: getSessionData fallback used"); return null; };
    const setSessionData = window.setSessionData || function(key, value) { console.warn("ChatJS: setSessionData fallback used"); };

    // --- Initialization ---
    function initializeChat() {
        chatHistory = getSessionData('chat_history') || [];
        if (chatHistory.length === 0) {
            systemMessageElement.textContent = "Sesi baru dimulai. Riwayat akan hilang jika browser ditutup.";
            const initialAIMsg = { role: 'model', parts: [{ text: "Halo! Saya Konselor AI Ruang Warna. Ada yang bisa saya bantu atau diskusikan hari ini?" }] };
             chatHistory.push(initialAIMsg);
             renderSingleMessage(initialAIMsg);
        } else {
             systemMessageElement.textContent = "Melanjutkan sesi sebelumnya...";
             renderAllMessagesFromHistory();
        }
         scrollToBottom(true); // Scroll paksa saat load awal
    }

    // --- Message Rendering ---
    function renderAllMessagesFromHistory() {
        // ... (Fungsi renderAllMessagesFromHistory tetap sama) ...
        if (!chatMessagesContainer) return;
        const messagesHtml = chatHistory.map(message => createMessageHTML(message)).join('');
        const systemMsgHtml = systemMessageElement ? `<div class="text-center text-xs text-text-muted-light dark:text-text-muted-dark my-4 italic">${systemMessageElement.textContent}</div>` : '';
        chatMessagesContainer.innerHTML = systemMsgHtml + messagesHtml;
    }

    function createMessageHTML(message) {
        // ... (Fungsi createMessageHTML tetap sama) ...
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
        // ... (Fungsi renderSingleMessage tetap sama) ...
         if (!chatMessagesContainer) return;
         const messageHtml = createMessageHTML(message);
         chatMessagesContainer.insertAdjacentHTML('beforeend', messageHtml);
         // Jangan auto scroll di sini agar scroll on focus bekerja
         // scrollToBottom();
    }

    // --- Scroll Function ---
    function scrollToBottom(force = false) {
        if (chatMessagesContainer) {
            // Hanya scroll jika user sudah dekat bagian bawah, kecuali dipaksa (saat load)
            const threshold = 100; // Jarak dari bawah (piksel)
            const shouldScroll = force || (chatMessagesContainer.scrollHeight - chatMessagesContainer.scrollTop - chatMessagesContainer.clientHeight < threshold);

            if (shouldScroll) {
                chatMessagesContainer.scrollTo({
                    top: chatMessagesContainer.scrollHeight,
                    behavior: force ? 'auto' : 'smooth' // 'auto' untuk load, 'smooth' untuk pesan baru
                });
                // console.log("Scrolled to bottom.");
            } else {
                // console.log("User scrolled up, not scrolling automatically.");
            }
        }
    }

    // --- Typing Effect ---
    async function typeEffect(element, text, speed = 35) {
        // ... (Fungsi typeEffect tetap sama) ...
         if (typingAbortController) { typingAbortController.abort(); }
         typingAbortController = new AbortController();
         const signal = typingAbortController.signal;
         element.innerHTML = '';
         const processedText = text.replace(/<br\s*\/?>/gi, '\n');
         let index = 0;
         return new Promise((resolve) => {
            function typeCharacter() {
                if (signal.aborted) { element.innerHTML = text.replace(/\n/g, '<br>'); scrollToBottom(); resolve(); return; }
                if (index < processedText.length) {
                    const char = processedText[index];
                    if (char === '\n') { element.innerHTML += '<br>'; }
                    else { element.textContent += char; } // Lebih aman
                    index++;
                    scrollToBottom(); // Scroll saat mengetik
                    setTimeout(typeCharacter, speed + (Math.random() * speed * 0.5 - speed * 0.25));
                } else { typingAbortController = null; resolve(); }
            }
            typeCharacter();
        });
    }

    // --- AI Interaction ---
    async function sendMessageToAI(userMessageText) {
        if (isAiTyping) return;
        // 1. Add user message
        const userMessage = { role: 'user', parts: [{ text: userMessageText.trim() }] };
        chatHistory.push(userMessage);
        setSessionData('chat_history', chatHistory);
        renderSingleMessage(userMessage);
        scrollToBottom(); // Scroll setelah pesan user ditambahkan

        // 2. Show Typing Indicator
        isAiTyping = true;
        typingIndicator.classList.remove('hidden');
        scrollToBottom(); // Pastikan indikator terlihat jika perlu scroll

        // 3. Prepare API Call
        const apiKey = "YOUR_GEMINI_API_KEY"; // <<< GANTI / PROXY!
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`;

        if (apiKey === "YOUR_GEMINI_API_KEY" || !apiKey) { /* ... handle no key ... */ return; }

        // 4. Enhanced System Instruction
        // ... (System Instruction tetap sama seperti revisi sebelumnya) ...
        const screeningData = getSessionData('screening_results');
         let screeningContext = "[Informasi screening tidak tersedia di sesi ini]";
         if (screeningData && screeningData.answers) {
              const interpretation = typeof getResultInterpretation !== 'undefined'
                                    ? getResultInterpretation(screeningData.screening_type, screeningData.answers)
                                    : null;
              screeningContext = `[Konteks Screening Pengguna (jika relevan): Tipe=${screeningData.screening_type || 'N/A'}, Skor=${interpretation?.score ?? 'N/A'}, Kategori=${interpretation?.category ?? 'N/A'}]`;
         }
         const systemInstruction = `[CONTEXT] Kamu adalah AI Konselor yang hangat dan empatik... ${screeningContext} [INSTRUCTION] Respons pesan terakhir pengguna... (Sama seperti prompt sebelumnya)`; // Ringkas saja

        // 5. Prepare History
        const historyForAPI = chatHistory.slice(-8);

        console.log("ChatJS: Sending to Gemini - History Count:", historyForAPI.length);

        let aiResponseText = "Maaf, terjadi kendala. Silakan coba lagi.";

        try {
            // 6. API Call
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: historyForAPI,
                    systemInstruction: { parts: [{ text: systemInstruction }] },
                    safetySettings: [ /* ... */ ],
                    generationConfig: { temperature: 0.8, maxOutputTokens: 500 }
                })
            });

            // 7. Parsing Respons
            const responseDataText = await response.text();
            console.log("ChatJS: Raw API Response Status:", response.status);
            // console.log("ChatJS: Raw API Response Body:", responseDataText); // Debug jika perlu

            if (!response.ok) { /* ... handle error ... */ throw new Error(`API Error (${response.status})`); }
            let data = null; try { data = JSON.parse(responseDataText); } catch (e) { throw new Error("Gagal memproses respons JSON."); }

            // 8. Ekstrak Teks
            if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
                aiResponseText = data.candidates[0].content.parts[0].text;
            } else if (data.promptFeedback?.blockReason) {
                aiResponseText = `Saya tidak dapat merespons karena alasan keamanan (${data.promptFeedback.blockReason}).`;
            } else {
                console.warn("ChatJS: Unexpected API response (No candidates):", data);
                aiResponseText = "Hmmm, sepertinya ada sedikit gangguan. Bisa coba ulangi?";
            }

        } catch (error) {
            console.error("ChatJS: Error sending/processing AI message:", error);
            aiResponseText = `Maaf, terjadi kesalahan teknis (${error.message}).`;
        } finally {
            // 9. Sembunyikan Indikator Loading (SEBELUM animasi ketik)
             typingIndicator.classList.add('hidden');

             // 10. Add AI response to history & save
             const aiMessage = { role: 'model', parts: [{ text: aiResponseText.trim() }] };
             chatHistory.push(aiMessage);
             setSessionData('chat_history', chatHistory);

             // 11. Buat Bubble Kosong & Mulai Animasi Ketik
             const aiBubbleWrapper = document.createElement('div');
             aiBubbleWrapper.innerHTML = createMessageHTML(aiMessage);
             const aiBubbleContentElement = aiBubbleWrapper.querySelector('.message-content');

             if (aiBubbleContentElement) {
                 chatMessagesContainer.appendChild(aiBubbleWrapper.firstElementChild);
                 scrollToBottom(); // Scroll setelah bubble ditambahkan
                 // Jalankan typeEffect tanpa menunggu (agar UI tidak freeze), biarkan scroll di dalamnya
                 typeEffect(aiBubbleContentElement, aiResponseText.replace(/\n/g, '<br>'), 35);
             } else {
                 renderSingleMessage(aiMessage);
                 scrollToBottom();
             }

             // 12. Izinkan input user lagi SEGERA (jangan tunggu animasi ketik selesai)
             isAiTyping = false;
             // Jangan auto-focus di mobile karena bisa memicu keyboard lagi
             // messageInput.focus();
        }
    }

    // --- Event Listeners ---
    chatForm.addEventListener('submit', (event) => {
        event.preventDefault();
        const messageText = messageInput.value.trim();
        if (messageText && !isAiTyping) {
            if (typingAbortController) { typingAbortController.abort(); } // Batalkan ketikan AI jika ada
            sendMessageToAI(messageText);
            messageInput.value = '';
        }
    });

    // ===== PERBAIKAN SAFARI iOS =====
    if (messageInput && chatFooter) {
        messageInput.addEventListener('focus', () => {
            console.log("Input focused, attempting to scroll footer into view...");
            // Beri sedikit delay agar keyboard sempat muncul/layout stabil
            setTimeout(() => {
                chatFooter.scrollIntoView({ behavior: 'smooth', block: 'end' });
                // Coba juga scroll chat container ke bawah setelahnya
                setTimeout(() => {
                    scrollToBottom(true); // Paksa scroll ke bawah
                }, 150); // Delay tambahan
            }, 100); // Delay awal
        });

        // Opsional: Scroll lagi saat input diubah (jika prediksi teks mengubah tinggi)
        // messageInput.addEventListener('input', () => {
        //     setTimeout(() => {
        //         chatFooter.scrollIntoView({ behavior: 'smooth', block: 'end' });
        //     }, 50);
        // });

        // Opsional: Coba scroll saat keyboard mungkin disembunyikan (blur)
        // messageInput.addEventListener('blur', () => {
        //    // Mungkin tidak perlu tindakan khusus di sini, layout akan kembali
        //    console.log("Input blurred");
        // });
    } else {
        console.error("ChatJS: messageInput or chatFooter element not found for iOS fix.");
    }
    // ===== AKHIR PERBAIKAN =====


    // --- Initial Load ---
    initializeChat();
});
