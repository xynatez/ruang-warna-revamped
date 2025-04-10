/* js/chat.js (REVISED - Typing Effect & Enhanced Prompt) */
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
          // Tampilkan pesan di area sistem
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

    // --- State ---
    let chatHistory = []; // Format: { role: 'user'/'model', parts: [{text: '...'}] }
    let isAiTyping = false;
    let typingAbortController = null; // Untuk membatalkan animasi ketik jika perlu

    // --- Helper ---
    const getSessionData = window.getSessionData || function(key) { console.warn("ChatJS: getSessionData fallback used"); return null; };
    const setSessionData = window.setSessionData || function(key, value) { console.warn("ChatJS: setSessionData fallback used"); };

    // --- Initialization ---
    function initializeChat() {
        chatHistory = getSessionData('chat_history') || [];
        if (chatHistory.length === 0) {
            systemMessageElement.textContent = "Sesi baru dimulai. Riwayat akan hilang jika browser ditutup.";
            // Tambahkan pesan AI awal tanpa menyimpan & tanpa animasi ketik
            const initialAIMsg = { role: 'model', parts: [{ text: "Halo! Saya Konselor AI Ruang Warna. Ada yang ingin Anda ceritakan atau diskusikan hari ini?" }] };
             chatHistory.push(initialAIMsg); // Tambahkan ke array untuk render awal
             renderSingleMessage(initialAIMsg); // Render pesan ini saja
             // Jangan simpan pesan awal ini ke session storage agar tidak terduplikasi saat reload
        } else {
             systemMessageElement.textContent = "Melanjutkan sesi sebelumnya...";
             renderAllMessagesFromHistory(); // Render semua history saat load
        }
         scrollToBottom(); // Pastikan scroll di bawah saat load
    }

    // --- Message Rendering ---

    // Fungsi untuk render semua pesan dari history (saat load/refresh)
    function renderAllMessagesFromHistory() {
        if (!chatMessagesContainer) return;
        const messagesHtml = chatHistory.map(message => createMessageHTML(message)).join('');
        const systemMsgHtml = systemMessageElement ? `<div class="text-center text-xs text-text-muted-light dark:text-text-muted-dark my-4 italic">${systemMessageElement.textContent}</div>` : '';
        chatMessagesContainer.innerHTML = systemMsgHtml + messagesHtml;
    }

    // Fungsi untuk membuat HTML satu pesan
     function createMessageHTML(message) {
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

    // Fungsi untuk render satu pesan saja (biasanya untuk user atau AI awal)
    function renderSingleMessage(message) {
         if (!chatMessagesContainer) return;
         const messageHtml = createMessageHTML(message);
         chatMessagesContainer.insertAdjacentHTML('beforeend', messageHtml);
         scrollToBottom();
    }

    // Fungsi untuk scroll ke bawah
    function scrollToBottom() {
        if(chatMessagesContainer) {
            chatMessagesContainer.scrollTop = chatMessagesContainer.scrollHeight;
        }
    }


    // --- Typing Effect ---
    async function typeEffect(element, text, speed = 35) {
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
                     element.innerHTML = text; // Tampilkan sisa teks jika dibatalkan
                     scrollToBottom();
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
                    scrollToBottom();
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
    async function sendMessageToAI(userMessageText) {
        if (isAiTyping) return;

        // 1. Tambahkan pesan user ke history & render
        const userMessage = { role: 'user', parts: [{ text: userMessageText.trim() }] };
        chatHistory.push(userMessage);
        setSessionData('chat_history', chatHistory);
        renderSingleMessage(userMessage);

        // 2. Tampilkan indikator loading AI
        isAiTyping = true;
        typingIndicator.classList.remove('hidden');
        scrollToBottom();

        // 3. Persiapan API Call
        const apiKey = "AIzaSyDP-3ba4HulshOKZkVzll7bFdGYkcP8bQQ"; // <<< GANTI / GUNAKAN PROXY!
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`;

        if (apiKey === "YOUR_GEMINI_API_KEY" || !apiKey) {
             addMessage('model', "Maaf, koneksi ke AI sedang tidak aktif (API Key belum diatur)."); // Akan di-render tanpa typing
             isAiTyping = false;
             typingIndicator.classList.add('hidden');
             return;
        }

        // 4. Enhanced System Instruction (Prompt Engineering)
         const screeningData = getSessionData('screening_results');
         let screeningContext = "[Informasi screening tidak tersedia di sesi ini]";
         if (screeningData && screeningData.answers) {
              const interpretation = typeof getResultInterpretation !== 'undefined'
                                    ? getResultInterpretation(screeningData.screening_type, screeningData.answers)
                                    : null;
              screeningContext = `[Konteks Screening Pengguna (jika relevan): Tipe=${screeningData.screening_type || 'N/A'}, Skor=${interpretation?.score ?? 'N/A'}, Kategori=${interpretation?.category ?? 'N/A'}]`;
         }

        const systemInstruction = `
[CONTEXT]
Kamu adalah AI Konselor yang hangat dan empatik di platform "Ruang Warna", dirancang untuk memberikan dukungan emosional awal. Bayangkan dirimu sebagai pendengar yang baik, sabar, dan tidak menghakimi.
${screeningContext}

[INSTRUCTION UTAMA]
1.  **Respons Inti:** Tanggapi pesan terakhir pengguna (role 'user') dengan penuh perhatian, kehangatan, dan pengertian mendalam. Gunakan Bahasa Indonesia yang natural dan mengalir.
2.  **Empati & Validasi:** Validasi perasaan atau pengalaman yang diungkapkan pengguna secara tulus. Tunjukkan bahwa Anda memahami perspektif mereka. Gunakan frasa seperti: "Saya bisa membayangkan betapa sulitnya itu...", "Sangat wajar jika Anda merasa...", "Terima kasih telah mempercayai saya dengan cerita ini...".
3.  **Adaptasi Gaya Bahasa:** Cermati gaya bahasa pengguna (misal: formal, santai, penggunaan kata sapaan). Sesuaikan respons Anda agar terasa *nyambung* dan nyaman, namun **selalu pertahankan nada profesional, suportif, penuh hormat, dan etis**. Jangan menggunakan bahasa gaul yang berlebihan atau tidak pantas.
4.  **Kreativitas & Nuansa:** Hindari respons template atau terdengar kaku/robotik. Berikan jawaban yang terasa otentik dan manusiawi. Gunakan variasi kalimat dan tunjukkan kepribadian yang peduli.
5.  **Fokus:** Fokus pada refleksi, validasi emosi, dan dukungan. Jika pengguna meminta saran, tawarkan saran self-care yang umum dan ringan (misal: teknik pernapasan, journaling, aktivitas menyenangkan) atau ajak mereka berefleksi ("Bagaimana perasaan Anda jika mencoba...?").
6.  **Batasan Tegas:** **JANGAN PERNAH** memberikan diagnosis medis/psikologis, label klinis, atau nasihat medis/terapi spesifik. Tegaskan bahwa Anda BUKAN pengganti profesional berlisensi jika percakapan mengarah ke sana.
7.  **Penanganan Krisis:** Jika pengguna mengungkapkan pikiran eksplisit untuk menyakiti diri sendiri/orang lain, bunuh diri, atau sedang dalam krisis akut yang membahayakan, **prioritaskan keselamatan**. Jangan mencoba menangani krisis. **SEGERA, dengan tenang dan jelas**, sarankan mereka untuk menghubungi layanan darurat (misal: **119 ext. 8** untuk Indonesia) atau mencari bantuan profesional darurat (UGD, psikolog/psikiater). Contoh: "Saya mendengar Anda sedang dalam kesulitan besar dan mengkhawatirkan keselamatan Anda. Sangat penting untuk mendapatkan bantuan segera. Anda bisa menghubungi 119 ext. 8 atau pergi ke UGD terdekat."
8.  **Ringkas & Jelas:** Jaga respons agar tetap ringkas dan mudah dicerna (target 2-4 paragraf pendek), hindari jargon teknis.
9.  **Peran:** Selalu berperan sebagai 'model'.`;

        // 5. Persiapan History untuk API
        const historyForAPI = chatHistory.slice(-8); // Kirim lebih banyak history untuk konteks adaptasi

        console.log("ChatJS: Sending to Gemini - History Slice:", JSON.stringify(historyForAPI.map(m=>m.role))); // Log roles saja
        console.log("ChatJS: Sending System Instruction separately.");

        let aiResponseText = "Maaf, terjadi kendala. Silakan coba lagi."; // Default error text

        try {
            // 6. API Call
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: historyForAPI,
                    systemInstruction: { parts: [{ text: systemInstruction }] },
                    safetySettings: [ /* ... safety settings seperti sebelumnya ... */ ],
                    generationConfig: { temperature: 0.8, maxOutputTokens: 500 } // Temp sedikit naik
                })
            });

            // 7. Parsing Respons (dengan logging mentah)
            const responseDataText = await response.text();
            console.log("ChatJS: Raw API Response Status:", response.status);
            // console.log("ChatJS: Raw API Response Body:", responseDataText); // Aktifkan jika perlu debug detail

            if (!response.ok) {
                // ... (Error handling seperti sebelumnya, throw error) ...
                 let errorData = null; try { errorData = JSON.parse(responseDataText); } catch (e) {}
                 console.error("ChatJS: AI API Error Details:", errorData);
                 let errorMsg = `API Error (${response.status})`;
                 if (errorData?.promptFeedback?.blockReason) errorMsg = `Permintaan diblokir: ${errorData.promptFeedback.blockReason}`;
                 else if (errorData?.error?.message) errorMsg += `: ${errorData.error.message}`;
                 throw new Error(errorMsg);
            }

            let data = null; try { data = JSON.parse(responseDataText); } catch (e) { throw new Error("Gagal memproses respons JSON dari AI."); }

            // 8. Ekstrak Teks Respons AI
             if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
                  aiResponseText = data.candidates[0].content.parts[0].text;
             } else if (data.promptFeedback?.blockReason) {
                  aiResponseText = `Saya tidak dapat merespons topik tersebut karena alasan keamanan (${data.promptFeedback.blockReason}).`;
             } else {
                  console.warn("ChatJS: Unexpected API response structure (No candidates):", data);
                  aiResponseText = "Hmmm, sepertinya saya sedikit bingung. Bisa coba ulangi atau sampaikan dengan cara lain?";
             }

        } catch (error) {
            console.error("ChatJS: Error sending/processing AI message:", error);
            aiResponseText = `Maaf, terjadi kesalahan teknis saat berkomunikasi dengan AI (${error.message}).`;
        } finally {
            // 9. Sembunyikan Indikator Loading
             typingIndicator.classList.add('hidden');

            // 10. Tambahkan Respons AI ke History (PENTING: Setelah try...catch...finally)
            const aiMessage = { role: 'model', parts: [{ text: aiResponseText.trim() }] };
            chatHistory.push(aiMessage);
            setSessionData('chat_history', chatHistory);

             // 11. Buat Bubble Kosong & Mulai Animasi Ketik
             const aiBubbleWrapper = document.createElement('div');
             aiBubbleWrapper.innerHTML = createMessageHTML(aiMessage); // Buat HTML lengkapnya
             const aiBubbleContentElement = aiBubbleWrapper.querySelector('.message-content'); // Dapatkan elemen kontennya

             if (aiBubbleContentElement) {
                 chatMessagesContainer.appendChild(aiBubbleWrapper.firstElementChild); // Tambahkan wrapper ke DOM
                 scrollToBottom();
                 await typeEffect(aiBubbleContentElement, aiResponseText.replace(/\n/g, '<br>'), 35); // Jalankan animasi ketik
             } else {
                 // Fallback jika elemen tidak ditemukan (seharusnya tidak terjadi)
                 renderSingleMessage(aiMessage);
             }

             // 12. Izinkan input user lagi SETELAH animasi selesai
             isAiTyping = false;
             messageInput.focus(); // Fokus kembali ke input
        }
    }

    // --- Event Listeners ---
    chatForm.addEventListener('submit', (event) => {
        event.preventDefault();
        const messageText = messageInput.value.trim();
        if (messageText && !isAiTyping) {
             // Batalkan animasi ketik sebelumnya jika user kirim pesan baru
             if (typingAbortController) {
                 typingAbortController.abort();
             }
            sendMessageToAI(messageText);
            messageInput.value = '';
        }
    });

     // Handle jika user mengetik saat AI sedang mengetik (opsional: batalkan ketikan AI)
     messageInput.addEventListener('input', () => {
         // if (isAiTyping && typingAbortController) {
         //     typingAbortController.abort(); // Batalkan ketikan AI jika user mulai mengetik
         // }
     });

    // --- Initial Load ---
    initializeChat();
});
Explain
