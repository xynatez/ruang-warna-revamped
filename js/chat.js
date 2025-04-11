/* js/chat.js (REVISED - Visual Viewport API & Enhanced Prompt - FIXED KEYBOARD SCROLL - FINAL VERSION) */
document.addEventListener('DOMContentLoaded', () => {
    // Pastikan dependensi ada
    if (typeof getResultInterpretation === 'undefined' || typeof resultCategories === 'undefined') {
        console.error("ChatJS: Dependencies (getResultInterpretation/resultCategories) not loaded!");
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
    const bodyElement = document.body;
    const chatContainer = document.getElementById('chat-container');

    // --- State ---
    let chatHistory = []; // Format: { role: 'user'/'model', parts: [{text: '...'}] }
    let isAiTyping = false;
    let typingAbortController = null; // Untuk membatalkan animasi ketik jika perlu
    let userScrolled = false;

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
        } else {
            systemMessageElement.textContent = "Melanjutkan sesi sebelumnya...";
            renderAllMessagesFromHistory(); // Render semua history saat load
        }
        setupScrollObserver();
        setupScrollHandlers();
        adjustLayoutForKeyboard();
        scrollToBottom('force'); // Scroll awal dengan force
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

    function renderSingleMessage(message) {
        if (!chatMessagesContainer) return;
        const messageHtml = createMessageHTML(message);
        chatMessagesContainer.insertAdjacentHTML('beforeend', messageHtml);
        scrollToBottom('force'); // Gunakan force untuk memastikan scroll terjadi
    }

    // --- Scroll Logic ---
    function scrollToBottom(behavior = 'smooth') {
        if(chatMessagesContainer) {
            // Beri sedikit waktu agar render selesai & layout terupdate
            setTimeout(() => {
                // Jika user tidak sedang scroll manual atau ini dipanggil dengan 'force'
                if (!userScrolled || behavior === 'force') {
                    chatMessagesContainer.scrollTop = chatMessagesContainer.scrollHeight;
                    
                    // Double-check scroll position setelah render
                    setTimeout(() => {
                        chatMessagesContainer.scrollTop = chatMessagesContainer.scrollHeight;
                    }, 100);
                }
            }, 100); // Tingkatkan delay
        }
    }

    function setupScrollObserver() {
        // Gunakan MutationObserver untuk memantau perubahan pada container chat
        const observer = new MutationObserver((mutations) => {
            // Cek apakah ada penambahan node (pesan baru)
            const hasNewMessages = mutations.some(mutation => 
                mutation.type === 'childList' && mutation.addedNodes.length > 0);
            
            if (hasNewMessages) {
                scrollToBottom('force'); // Gunakan 'force' untuk memastikan scroll terjadi
            }
        });
        
        // Mulai observasi
        observer.observe(chatMessagesContainer, { 
            childList: true, 
            subtree: true 
        });
    }

    function setupScrollHandlers() {
        // Tambahkan event listener untuk mendeteksi scroll manual user
        chatMessagesContainer.addEventListener('scroll', () => {
            // Deteksi apakah user scroll ke atas
            const isAtBottom = Math.abs(
                chatMessagesContainer.scrollHeight - 
                chatMessagesContainer.clientHeight - 
                chatMessagesContainer.scrollTop
            ) < 50;
            
            userScrolled = !isAtBottom;
        });
        
        // Reset userScrolled saat user klik input
        messageInput.addEventListener('click', () => {
            userScrolled = false;
            scrollToBottom();
        });

        // Scroll ke bawah saat window resize pada desktop
        window.addEventListener('resize', () => {
            // Hanya scroll jika ini adalah desktop (bukan karena keyboard mobile)
            if (window.innerWidth > 768) { // Asumsi lebar desktop > 768px
                scrollToBottom();
            }
        });
    }

    // --- Typing Effect ---
    async function typeEffect(element, text, speed = 35) {
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
                    scrollToBottom('force'); // Scroll cepat ke bawah saat batal
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
                    
                    // Scroll setiap beberapa karakter untuk memastikan visibilitas
                    if (index % 10 === 0) {
                        scrollToBottom('auto');
                    }
                    
                    setTimeout(typeCharacter, speed + (Math.random() * speed * 0.5 - speed * 0.25)); // Tambahkan variasi kecepatan
                } else {
                    typingAbortController = null; // Reset controller
                    scrollToBottom('force'); // Pastikan scroll ke bawah setelah animasi selesai
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
        renderSingleMessage(userMessage); // Ini akan memanggil scrollToBottom()

        // 2. Tampilkan indikator loading AI
        isAiTyping = true;
        typingIndicator.classList.remove('hidden');
        scrollToBottom('force'); // Pastikan indikator terlihat

        // 3. Persiapan API Call
        const apiKey = "AIzaSyDP-3ba4HulshOKZkVzll7bFdGYkcP8bQQ"; // <<< GANTI / GUNAKAN PROXY!
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`;

        if (apiKey === "YOUR_GEMINI_API_KEY" || !apiKey) {
            console.error("API Key not set"); // Placeholder
            isAiTyping = false;
            typingIndicator.classList.add('hidden');
            return;
        }

        // 4. Enhanced System Instruction
        const screeningData = getSessionData('screening_results');
        let screeningContext = "[Informasi screening tidak tersedia di sesi ini]";
        if (screeningData && screeningData.answers) {
            const interpretation = typeof getResultInterpretation !== 'undefined'
                                         ? getResultInterpretation(screeningData.screening_type, screeningData.answers)
                                         : null;
            screeningContext = `[Konteks Screening Pengguna (jika relevan): Tipe=${screeningData.screening_type || 'N/A'}, Skor=${interpretation?.score ?? 'N/A'}, Kategori=${interpretation?.category ?? 'N/A'}]`;
        }
        
        const systemInstruction = `Kamu adalah Konselor AI Ruang Warna, asisten kesehatan mental yang membantu pengguna memahami perasaan dan pikiran mereka. Berikan dukungan emosional, tips praktis, dan wawasan yang membantu. Hindari memberikan diagnosis medis atau menggantikan bantuan profesional. Jika pengguna menunjukkan tanda-tanda krisis, dorong mereka mencari bantuan profesional segera. ${screeningContext}`;

        // 5. Persiapan History untuk API
        const historyForAPI = chatHistory.slice(-8);
        console.log("ChatJS: Sending to Gemini...");
        
        let aiResponseText = "Maaf, terjadi kendala. Silakan coba lagi."; // Default error text

        try {
            // 6. API Call
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [
                        {
                            role: 'user',
                            parts: [{ text: systemInstruction }]
                        },
                        ...historyForAPI
                    ],
                    generationConfig: {
                        temperature: 0.7,
                        topK: 40,
                        topP: 0.95,
                        maxOutputTokens: 1024,
                    },
                    safetySettings: [
                        { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
                        { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
                        { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
                        { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" }
                    ],
                }),
            });

            // 7. Parsing Respons
            const responseDataText = await response.text();
            if (!response.ok) { throw new Error(`API Error (${response.status})`); }
            let data = JSON.parse(responseDataText);

            // 8. Ekstrak Teks Respons AI
            if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
                aiResponseText = data.candidates[0].content.parts[0].text;
            } else if (data.promptFeedback?.blockReason) {
                aiResponseText = "Maaf, saya tidak dapat merespons permintaan tersebut karena melanggar kebijakan keamanan. Silakan coba dengan pertanyaan atau topik lain.";
            } else {
                aiResponseText = "Maaf, saya tidak dapat memproses permintaan Anda saat ini. Silakan coba lagi dengan pertanyaan yang berbeda.";
            }

        } catch (error) {
            console.error("ChatJS: Error sending/processing AI message:", error);
            aiResponseText = `Maaf, terjadi kesalahan teknis (${error.message}). Silakan coba lagi nanti.`;
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
                aiBubbleContentElement.textContent = ''; // Kosongkan dulu untuk efek ketik
                chatMessagesContainer.appendChild(aiBubbleWrapper.firstElementChild);
                scrollToBottom('force'); // Scroll sebelum mulai ketik
                await typeEffect(aiBubbleContentElement, aiResponseText, 35); // Jalankan animasi ketik (ini juga scroll)
            } else {
                renderSingleMessage(aiMessage); // Fallback
            }

            // 12. Izinkan input user lagi SETELAH animasi selesai
            isAiTyping = false;
        }
    }

    // --- Layout Adjustment Logic ---
    function adjustLayoutForKeyboard() {
        if (!window.visualViewport) {
            console.warn("Visual Viewport API not supported. Keyboard adjustment might not be automatic.");
            return;
        }

        const keyboardHeight = window.innerHeight - window.visualViewport.height;

        if (keyboardHeight > 50) {
            // Terapkan padding ke container chat, bukan body
            chatContainer.style.paddingBottom = `${Math.max(0, keyboardHeight)}px`;
        } else {
            chatContainer.style.paddingBottom = '0px';
        }

        scrollToBottom('force');
    }

    // --- Event Listeners ---
    chatForm.addEventListener('submit', (event) => {
        event.preventDefault();
        const messageText = messageInput.value.trim();
        if (messageText && !isAiTyping) {
            if (typingAbortController) {
                typingAbortController.abort();
            }
            userScrolled = false; // Reset user scroll state on send
            sendMessageToAI(messageText);
            messageInput.value = '';
        }
    });

    if (window.visualViewport) {
        console.log("Visual Viewport API supported. Enabling automatic keyboard adjustment.");
        window.visualViewport.addEventListener('resize', adjustLayoutForKeyboard);

        window.addEventListener('orientationchange', () => {
            console.log("Orientation changed, adjusting layout.");
            setTimeout(() => {
                adjustLayoutForKeyboard();
                scrollToBottom('force');
            }, 150);
        });
    } else {
        console.warn("Visual Viewport API not supported. Using manual scrollTop fallback.");
        messageInput.addEventListener('focus', () => {
            setTimeout(() => {
                const inputPosition = messageInput.getBoundingClientRect().top;
                const chatMessagesTop = chatMessagesContainer.getBoundingClientRect().top;
                const scrollAmount = inputPosition - chatMessagesTop;

                chatMessagesContainer.scrollTop = scrollAmount;
            }, 250);
        });
    }

    // --- Cleanup pada unload ---
    window.addEventListener('beforeunload', () => {
        chatContainer.style.paddingBottom = '0px';
    });

    // --- Initial Load ---
    initializeChat();

}); // Akhir DOMContentLoaded
