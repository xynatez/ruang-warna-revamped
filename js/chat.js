/* js/chat.js (FINAL VERSION - Cross-Platform Optimized) */
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

    // --- Platform Detection ---
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    const isAndroid = /Android/.test(navigator.userAgent);
    const isMobile = isIOS || isAndroid;
    const isDesktop = !isMobile;

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
    let scrollObserver = null;
    let lastScrollPosition = 0;

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
            renderSingleMessage(initialAIMsg);
        } else {
            systemMessageElement.textContent = "Melanjutkan sesi sebelumnya...";
            renderAllMessagesFromHistory();
        }
        
        setupScrollObserver();
        setupScrollHandlers();
        
        if (isMobile) {
            setupMobileKeyboardHandlers();
        } else {
            setupDesktopScrollHandlers();
        }
        
        // Scroll ke bawah setelah inisialisasi
        scrollToBottom('force');
    }

    // --- Message Rendering ---
    function renderAllMessagesFromHistory() {
        if (!chatMessagesContainer) return;
        const messagesHtml = chatHistory.map(message => createMessageHTML(message)).join('');
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
        scrollToBottom('force');
    }

    // --- Scroll Logic ---
    function scrollToBottom(behavior = 'smooth') {
        if (!chatMessagesContainer) return;
        
        // Gunakan requestAnimationFrame untuk memastikan scroll terjadi setelah render
        requestAnimationFrame(() => {
            // Jika user tidak sedang scroll manual atau ini dipanggil dengan 'force'
            if (!userScrolled || behavior === 'force') {
                const scrollOptions = {
                    top: chatMessagesContainer.scrollHeight,
                    behavior: behavior === 'force' ? 'auto' : behavior
                };
                
                try {
                    chatMessagesContainer.scrollTo(scrollOptions);
                } catch (e) {
                    // Fallback untuk browser yang tidak mendukung scrollTo dengan options
                    chatMessagesContainer.scrollTop = chatMessagesContainer.scrollHeight;
                }
                
                // Double-check scroll position setelah render
                setTimeout(() => {
                    chatMessagesContainer.scrollTop = chatMessagesContainer.scrollHeight;
                }, 100);
            }
        });
    }

    function setupScrollObserver() {
        // Bersihkan observer sebelumnya jika ada
        if (scrollObserver) {
            scrollObserver.disconnect();
        }
        
        // Buat observer baru untuk memantau perubahan konten
        scrollObserver = new MutationObserver((mutations) => {
            const hasNewMessages = mutations.some(mutation => 
                mutation.type === 'childList' && mutation.addedNodes.length > 0);
            
            if (hasNewMessages) {
                scrollToBottom('force');
            }
        });
        
        // Mulai observasi
        scrollObserver.observe(chatMessagesContainer, { 
            childList: true, 
            subtree: true 
        });
    }

    function setupScrollHandlers() {
        // Deteksi scroll manual user
        chatMessagesContainer.addEventListener('scroll', () => {
            // Simpan posisi scroll terakhir
            lastScrollPosition = chatMessagesContainer.scrollTop;
            
            // Hitung jarak dari bawah
            const distanceFromBottom = 
                chatMessagesContainer.scrollHeight - 
                chatMessagesContainer.clientHeight - 
                chatMessagesContainer.scrollTop;
            
            // Jika jarak dari bawah kurang dari 100px, anggap user di bawah
            userScrolled = distanceFromBottom > 100;
        });
        
        // Reset userScrolled saat user klik input
        messageInput.addEventListener('click', () => {
            userScrolled = false;
            scrollToBottom();
        });
    }

    function setupDesktopScrollHandlers() {
        // Untuk desktop: scroll ke bawah saat window resize
        window.addEventListener('resize', () => {
            if (isDesktop) {
                scrollToBottom();
            }
        });
        
        // Untuk desktop: gunakan ResizeObserver untuk mendeteksi perubahan ukuran container
        if (window.ResizeObserver) {
            const resizeObserver = new ResizeObserver(() => {
                if (isDesktop) {
                    scrollToBottom();
                }
            });
            resizeObserver.observe(chatMessagesContainer);
        }
    }

    function setupMobileKeyboardHandlers() {
        if (!window.visualViewport) {
            console.warn("Visual Viewport API not supported. Using fallback.");
            setupMobileKeyboardFallback();
            return;
        }

        console.log("Visual Viewport API supported. Enabling automatic keyboard adjustment.");
        
        // Handler untuk visualViewport resize (keyboard muncul/hilang)
        const viewportHandler = () => {
            const keyboardHeight = window.innerHeight - window.visualViewport.height;
            
            if (keyboardHeight > 50) {
                // Terapkan padding ke chat container, bukan body
                chatContainer.style.paddingBottom = `${Math.max(0, keyboardHeight)}px`;
                scrollToBottom('force');
            } else {
                chatContainer.style.paddingBottom = '0px';
            }
        };
        
        // Tambahkan event listeners
        window.visualViewport.addEventListener('resize', viewportHandler);
        window.visualViewport.addEventListener('scroll', viewportHandler);
        
        // Tambahkan listener untuk orientasi berubah
        window.addEventListener('orientationchange', () => {
            console.log("Orientation changed, adjusting layout.");
            setTimeout(() => {
                viewportHandler();
                scrollToBottom('force');
            }, 300); // Beri waktu lebih lama untuk orientasi berubah
        });
    }

    function setupMobileKeyboardFallback() {
        // Fallback untuk browser yang tidak mendukung Visual Viewport API
        messageInput.addEventListener('focus', () => {
            setTimeout(() => {
                if (isIOS) {
                    // iOS fallback
                    messageInput.scrollIntoView({behavior: 'smooth', block: 'center'});
                } else {
                    // Android fallback
                    const inputPosition = messageInput.getBoundingClientRect().top;
                    const chatMessagesTop = chatMessagesContainer.getBoundingClientRect().top;
                    const scrollAmount = inputPosition - chatMessagesTop;
                    chatMessagesContainer.scrollTop = scrollAmount;
                }
                scrollToBottom('force');
            }, 300);
        });
    }

    // --- Typing Effect ---
    async function typeEffect(element, text, speed = 35) {
        if (typingAbortController) {
            typingAbortController.abort();
        }
        typingAbortController = new AbortController();
        const signal = typingAbortController.signal;

        element.innerHTML = '';
        const processedText = text.replace(/<br\s*\/?>/gi, '\n');
        let index = 0;

        return new Promise((resolve) => {
            function typeCharacter() {
                if (signal.aborted) {
                    console.log("Typing aborted.");
                    element.innerHTML = text.replace(/\n/g, '<br>');
                    scrollToBottom('force');
                    resolve();
                    return;
                }

                if (index < processedText.length) {
                    const char = processedText[index];
                    if (char === '\n') {
                        element.innerHTML += '<br>';
                    } else {
                        element.textContent += char;
                    }
                    index++;
                    
                    // Scroll setiap beberapa karakter untuk memastikan visibilitas
                    if (index % 10 === 0) {
                        scrollToBottom('auto');
                    }
                    
                    setTimeout(typeCharacter, speed + (Math.random() * speed * 0.5 - speed * 0.25));
                } else {
                    typingAbortController = null;
                    scrollToBottom('force');
                    resolve();
                }
            }
            typeCharacter();
        });
    }

    // --- AI Interaction ---
    async function sendMessageToAI(userMessageText) {
        if (isAiTyping) return;

        const userMessage = { role: 'user', parts: [{ text: userMessageText.trim() }] };
        chatHistory.push(userMessage);
        setSessionData('chat_history', chatHistory);
        renderSingleMessage(userMessage);

        isAiTyping = true;
        userScrolled = false; // Reset user scroll state saat kirim pesan
        typingIndicator.classList.remove('hidden');
        scrollToBottom('force');

        const apiKey = "AIzaSyDP-3ba4HulshOKZkVzll7bFdGYkcP8bQQ";
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`;

        if (apiKey === "YOUR_GEMINI_API_KEY" || !apiKey) {
            console.error("API Key not set");
            isAiTyping = false;
            typingIndicator.classList.add('hidden');
            return;
        }

        const screeningData = getSessionData('screening_results');
        let screeningContext = "[Informasi screening tidak tersedia di sesi ini]";
        if (screeningData && screeningData.answers) {
            const interpretation = typeof getResultInterpretation !== 'undefined'
                                         ? getResultInterpretation(screeningData.screening_type, screeningData.answers)
                                         : null;
            screeningContext = `[Konteks Screening Pengguna (jika relevan): Tipe=${screeningData.screening_type || 'N/A'}, Skor=${interpretation?.score ?? 'N/A'}, Kategori=${interpretation?.category ?? 'N/A'}]`;
        }
        
        const systemInstruction = `Kamu adalah Konselor AI Ruang Warna, asisten kesehatan mental yang dikembangkan oleh Sebastian menggunakan AIS (Alwin Intelligence System). Peranmu adalah menjadi teman curhat dan pendukung emosional bagi pengguna, dengan fokus utama pada kesehatan mental. Ingat pedoman berikut:

1. Fokus Tema: Batasi responmu hanya pada topik kesehatan mental, emosi, dan kesejahteraan psikologis. Jika ditanya tentang topik di luar ini (misalnya matematika atau pengetahuan umum), jelaskan dengan sopan bahwa kamu dikhususkan untuk diskusi kesehatan mental.

2. Adaptasi Bahasa: Sesuaikan gaya bahasamu dengan pengguna. Jika mereka menggunakan bahasa informal atau slang, ikuti gaya tersebut untuk menciptakan hubungan yang lebih dekat.

3. Sikap Positif: Berikan respons yang menyemangati dan meningkatkan mood. Jadilah teman cerita yang menyenangkan dan suportif, sambil tetap memberikan wawasan yang bermanfaat.

4. Batasan Profesional: Hindari memberikan diagnosis medis. Jika pengguna menunjukkan tanda-tanda krisis atau masalah serius, dorong mereka untuk mencari bantuan profesional.

5. Konteks Screening: Gunakan informasi dari screening (jika tersedia) untuk memberikan saran yang lebih personal: ${screeningContext}

6. Interaksi Personal: Tunjukkan empati, berikan dukungan emosional, dan tawarkan tips praktis untuk mengelola stres atau meningkatkan kesejahteraan mental.

7. Kreativitas dalam Saran: Berikan ide-ide kreatif untuk self-care dan aktivitas yang dapat meningkatkan mood, disesuaikan dengan konteks pembicaraan.

8. Edukasi Ringan: Sisipkan informasi edukatif tentang kesehatan mental dengan cara yang mudah dipahami dan tidak menggurui.

9. Penanganan Krisis: Jika pengguna menunjukkan tanda-tanda krisis, berikan dukungan dengan hati-hati dan arahkan mereka ke sumber bantuan profesional atau hotline krisis.

10. Identitas: Jika ditanya tentang identitasmu, jelaskan bahwa kamu adalah AI yang dikembangkan oleh Sebastian menggunakan AIS, didesain khusus untuk mendukung kesehatan mental.

11. Hindari jawaban yang sangat panjang, dan jangan gunakan jawaban berbentuk list dan huruf bold.

Ingat, tujuan utamamu adalah menjadi teman curhat yang menyenangkan, suportif, dan membantu meningkatkan mood pengguna sambil memberikan wawasan berharga tentang kesehatan mental.`;

        const historyForAPI = chatHistory.slice(-8);
        console.log("ChatJS: Sending to Gemini...");
        
        let aiResponseText = "Maaf, terjadi kendala. Silakan coba lagi.";

        try {
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

            const responseDataText = await response.text();
            if (!response.ok) { throw new Error(`API Error (${response.status})`); }
            let data = JSON.parse(responseDataText);

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
            typingIndicator.classList.add('hidden');

            const aiMessage = { role: 'model', parts: [{ text: aiResponseText.trim() }] };
            chatHistory.push(aiMessage);
            setSessionData('chat_history', chatHistory);

            const aiBubbleWrapper = document.createElement('div');
            aiBubbleWrapper.innerHTML = createMessageHTML(aiMessage);
            const aiBubbleContentElement = aiBubbleWrapper.querySelector('.message-content');

            if (aiBubbleContentElement) {
                aiBubbleContentElement.textContent = '';
                chatMessagesContainer.appendChild(aiBubbleWrapper.firstElementChild);
                scrollToBottom('force');
                await typeEffect(aiBubbleContentElement, aiResponseText, 35);
            } else {
                renderSingleMessage(aiMessage);
            }

            isAiTyping = false;
        }
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

    // --- Cleanup pada unload ---
    window.addEventListener('beforeunload', () => {
        if (scrollObserver) {
            scrollObserver.disconnect();
        }
        
        if (chatContainer) {
            chatContainer.style.paddingBottom = '0px';
        }
    });

    // --- Initial Load ---
    initializeChat();

}); // Akhir DOMContentLoaded
