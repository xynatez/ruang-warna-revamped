/* js/chat.js (REVISED - FINAL) */
document.addEventListener('DOMContentLoaded', () => {
    // Pastikan dependensi ada
    if (typeof getResultInterpretation === 'undefined' || typeof resultCategories === 'undefined') {
         console.error("ChatJS: Dependencies (getResultInterpretation/resultCategories) not loaded!");
         // Mungkin nonaktifkan input chat atau tampilkan pesan error
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

    // --- Helper ---
    const getSessionData = window.getSessionData || function(key) { /* Fallback jika main.js gagal load */ return null; };
    const setSessionData = window.setSessionData || function(key, value) { /* Fallback */ };

    // --- Initialization ---
    function initializeChat() {
        chatHistory = getSessionData('chat_history') || []; // Coba load history sesi ini jika ada
        if (chatHistory.length === 0) {
            // Jika history kosong, mulai dengan pesan sistem & AI
            systemMessageElement.textContent = "Sesi baru dimulai. Riwayat akan hilang jika browser ditutup.";
             addMessage('model', "Halo! Saya Konselor AI Ruang Warna. Ada yang bisa saya bantu atau diskusikan hari ini?", false); // Jangan save initial
        } else {
             systemMessageElement.textContent = "Melanjutkan sesi sebelumnya...";
        }
        renderMessages();
    }

    // --- Message Handling ---
    function addMessage(role, text, save = true) {
        const message = { role: role, parts: [{ text: text.trim() }] };
        chatHistory.push(message);
        if (save) {
            setSessionData('chat_history', chatHistory); // Simpan history ke session
        }
        renderMessages(); // Render ulang semua pesan
    }

    function renderMessages() {
        if (!chatMessagesContainer) return;

        const messagesHtml = chatHistory.map(message => {
             const textContent = message.parts[0]?.text || ''; // Safely access text
             const isUser = message.role === 'user';
             return `
                 <div class="message-bubble flex ${isUser ? 'justify-end' : 'justify-start'} mb-3 animate-fade-in">
                     <div class="max-w-[80%] md:max-w-[70%] p-3 rounded-xl shadow-sm
                         ${isUser
                             ? 'bg-primary dark:bg-primary-dark text-white dark:text-background-dark rounded-br-none'
                             : 'bg-content-bg-light dark:bg-content-bg-dark text-text-main-light dark:text-text-main-dark rounded-bl-none border border-border-color-light dark:border-border-color-dark'
                         }">
                         ${textContent.replace(/\n/g, '<br>')}
                     </div>
                 </div>`;
         }).join('');

         const systemMsgHtml = systemMessageElement ? `<div class="text-center text-xs text-text-muted-light dark:text-text-muted-dark my-4 italic">${systemMessageElement.textContent}</div>` : '';
         chatMessagesContainer.innerHTML = systemMsgHtml + messagesHtml;

        // Scroll to bottom
        chatMessagesContainer.scrollTop = chatMessagesContainer.scrollHeight;
    }

    // --- AI Interaction ---
    async function sendMessageToAI(userMessageText) {
        if (isAiTyping) return;
        addMessage('user', userMessageText); // Add user message immediately, save=true by default
        isAiTyping = true;
        typingIndicator.classList.remove('hidden');
        chatMessagesContainer.scrollTop = chatMessagesContainer.scrollHeight;

        const apiKey = "AIzaSyDP-3ba4HulshOKZkVzll7bFdGYkcP8bQQ"; // <<< GANTI DENGAN KUNCI ANDA ATAU GUNAKAN PROXY!
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`;

        if (apiKey === "YOUR_GEMINI_API_KEY" || !apiKey) { /* ... handle no key ... */ return; }

        // --- Prepare Context & System Instruction ---
         const screeningData = getSessionData('screening_results');
         let screeningContext = "[Informasi screening tidak tersedia di sesi ini]";
         if (screeningData && screeningData.answers) {
              // Panggil fungsi interpretasi (pastikan dimuat)
              const interpretation = typeof getResultInterpretation !== 'undefined'
                                    ? getResultInterpretation(screeningData.screening_type, screeningData.answers)
                                    : null;
              screeningContext = `[Konteks Screening Pengguna (jika relevan): Tipe=${screeningData.screening_type || 'N/A'}, Skor=${interpretation?.score ?? 'N/A'}, Kategori=${interpretation?.category ?? 'N/A'}]`;
         }

         const systemInstruction = `[CONTEXT] Kamu adalah AI Konselor suportif di Ruang Warna. ${screeningContext} [INSTRUCTION] Respons pesan terakhir pengguna (role 'user') dalam Bahasa Indonesia yang hangat, empatik, dan validatif. JANGAN mendiagnosis atau memberi nasihat medis. Fokus pada refleksi, dukungan emosional, atau saran self-care ringan jika diminta. Jika ada indikasi krisis/bahaya diri, sarankan segera hubungi 119 atau profesional. Jaga respons agar ringkas (2-4 paragraf). Selalu berperan sebagai 'model'.`;

        // Prepare history: slice(-N) might cut off the system instruction if added there.
        // Send only the relevant chat turn history.
        const historyForAPI = chatHistory.slice(-6); // Kirim beberapa pesan terakhir

        console.log("ChatJS: Sending to Gemini - History Slice:", JSON.stringify(historyForAPI, null, 2));
        console.log("ChatJS: Sending System Instruction separately.");


        try {
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: historyForAPI, // Hanya riwayat chat
                    systemInstruction: { parts: [{ text: systemInstruction }] }, // Instruksi sistem terpisah
                    safetySettings: [ { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" }, { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_MEDIUM_AND_ABOVE" }, { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_MEDIUM_AND_ABOVE" }, { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" } ],
                    generationConfig: { temperature: 0.75, maxOutputTokens: 450 }
                })
            });

            const responseDataText = await response.text();
            console.log("ChatJS: Raw API Response Status:", response.status);
            console.log("ChatJS: Raw API Response Body:", responseDataText);

            if (!response.ok) { /* ... handle error like in results.js ... */ throw new Error(`API Error (${response.status})`); }

            let data = null; try { data = JSON.parse(responseDataText); } catch (e) { throw new Error("Gagal memproses respons AI."); }

             let aiResponseText = "Maaf, saya tidak bisa merespons saat ini.";
             if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
                  aiResponseText = data.candidates[0].content.parts[0].text;
             } else if (data.promptFeedback?.blockReason) {
                  aiResponseText = `Saya tidak dapat merespons karena alasan keamanan (${data.promptFeedback.blockReason}).`;
             } else {
                  console.warn("ChatJS: Unexpected API response (No candidates):", data);
                  aiResponseText = "Sepertinya saya kesulitan memproses respons. Bisa coba lagi?";
             }
            addMessage('model', aiResponseText); // Save=true by default

        } catch (error) {
            console.error("ChatJS: Error sending message to AI:", error);
            addMessage('model', `Maaf, terjadi kesalahan teknis (${error.message}).`); // Save=true
        } finally {
            isAiTyping = false;
            typingIndicator.classList.add('hidden');
        }
    }

    // --- Event Listeners ---
    chatForm.addEventListener('submit', (event) => {
        event.preventDefault();
        const messageText = messageInput.value.trim();
        if (messageText && !isAiTyping) {
            sendMessageToAI(messageText);
            messageInput.value = '';
        }
    });

    // --- Initial Load ---
    initializeChat();
});
