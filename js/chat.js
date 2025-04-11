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
        adjustLayoutForKeyboard();
        scrollToBottom('auto');
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
        scrollToBottom();
    }

    // --- Scroll Logic ---
    function scrollToBottom(behavior = 'smooth') {
        if(chatMessagesContainer) {
            setTimeout(() => {
                chatMessagesContainer.scrollTo({
                    top: chatMessagesContainer.scrollHeight,
                    behavior: behavior
                });
            }, 50);
        }
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
                    scrollToBottom('auto');
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
                    scrollToBottom('auto');
                    setTimeout(typeCharacter, speed + (Math.random() * speed * 0.5 - speed * 0.25));
                } else {
                    typingAbortController = null;
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
        typingIndicator.classList.remove('hidden');
        scrollToBottom('auto');

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
        
        const systemInstruction = `Kamu adalah Konselor AI Ruang Warna, asisten kesehatan mental yang membantu pengguna memahami perasaan dan pikiran mereka. Berikan dukungan emosional, tips praktis, dan wawasan yang membantu. Hindari memberikan diagnosis medis atau menggantikan bantuan profesional. Jika pengguna menunjukkan tanda-tanda krisis, dorong mereka mencari bantuan profesional segera. ${screeningContext}`;

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
                scrollToBottom('auto');
                await typeEffect(aiBubbleContentElement, aiResponseText, 35);
            } else {
                renderSingleMessage(aiMessage);
            }

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
            chatContainer.style.paddingBottom = `${Math.max(0, keyboardHeight)}px`;
        } else {
            chatContainer.style.paddingBottom = '0px';
        }

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

    if (window.visualViewport) {
        console.log("Visual Viewport API supported. Enabling automatic keyboard adjustment.");
        window.visualViewport.addEventListener('resize', adjustLayoutForKeyboard);

        window.addEventListener('orientationchange', () => {
            console.log("Orientation changed, adjusting layout.");
            setTimeout(adjustLayoutForKeyboard, 150);
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
