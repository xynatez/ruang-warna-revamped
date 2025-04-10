/*
js/chat.js
Handles the AI chat interface, message sending/receiving, and interaction with Gemini API.
*/

// IMPORTANT: Replace with your actual Gemini API Key or use a secure proxy method
const GEMINI_API_KEY_CHAT = "AIzaSyDP-3ba4HulshOKZkVzll7bFdGYkcP8bQQ"; // <--- !!! NEVER PUSH THIS TO GITHUB !!!
const GEMINI_API_URL_CHAT = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GEMINI_API_KEY_CHAT}`; // Example model

document.addEventListener('DOMContentLoaded', () => {
    const chatMessagesContainer = document.getElementById('chatMessages');
    const messageInput = document.getElementById('messageInput');
    const chatForm = document.getElementById('chatForm');
    const typingIndicator = document.getElementById('typingIndicator');
    const systemMessageElement = document.getElementById('systemMessage');

    let chatHistory = []; // Array to hold message objects { role: 'user'/'model', text: '...' }
    let isAiTyping = false;

    // --- Initialization ---
    function initializeChat() {
        // Handle page reload: Clear history as per instructions
        chatHistory = [];
        sessionStorage.removeItem('chat_history'); // Explicitly clear chat history from session
        renderMessages(); // Render initial state (likely just the system message)

        // Show system message confirming new session
         if (systemMessageElement) {
             systemMessageElement.classList.remove('hidden');
             systemMessageElement.textContent = "Sesi baru dimulai. Riwayat chat akan hilang jika halaman di-refresh.";
         }

         // Load screening results if available to provide context for the first AI message
         const screeningData = getSessionData('screening_results');
         if (screeningData) {
              console.log("Screening data found, will be used for initial AI context.");
              // Optionally, add a starting message from AI based on results?
              // addMessage('model', "Halo! Saya melihat hasil screening Anda. Ada yang ingin Anda ceritakan lebih lanjut?");
         } else {
              console.log("No screening data found in session.");
              // Optionally add a generic welcome message
              // addMessage('model', "Halo! Ada yang bisa saya bantu hari ini?");
         }

    }

    // --- Message Handling ---
    function addMessage(role, text) {
        const message = { role: role === 'ai' ? 'model' : 'user', text: text.trim() }; // Align with Gemini role names
        chatHistory.push(message);
        // Persist history to sessionStorage (even though it clears on reload, useful if user navigates away and back within the same session)
        // setSessionData('chat_history', chatHistory); // Re-enable if persistence within session (not across reloads) is desired
        renderMessages();
    }

    function renderMessages() {
        if (!chatMessagesContainer) return;

        // Clear existing messages except the system message
        const messages = chatMessagesContainer.querySelectorAll('.message-bubble');
        messages.forEach(msg => msg.remove());

        chatHistory.forEach(message => {
            const messageElement = document.createElement('div');
            messageElement.classList.add('message-bubble', 'max-w-[80%]', 'p-3', 'rounded-lg', 'shadow-sm', 'mb-2', 'animate-fade-in');

            if (message.role === 'user') {
                messageElement.classList.add('bg-pastel-blue', 'text-white', 'ml-auto', 'rounded-br-none');
                 messageElement.textContent = message.text;
            } else { // role === 'model' (AI)
                messageElement.classList.add('bg-gray-200', 'dark:bg-gray-700', 'text-gray-800', 'dark:text-gray-200', 'mr-auto', 'rounded-bl-none');
                 // Basic Markdown support (newlines) - could be expanded
                 messageElement.innerHTML = message.text.replace(/\n/g, '<br>');
            }

            chatMessagesContainer.appendChild(messageElement);
        });

        // Scroll to the bottom
        chatMessagesContainer.scrollTop = chatMessagesContainer.scrollHeight;
    }

    // --- AI Interaction ---
    async function sendMessageToAI(userMessageText) {
        if (isAiTyping) return; // Prevent multiple submissions while waiting

        addMessage('user', userMessageText);
        isAiTyping = true;
        typingIndicator.classList.remove('hidden');
        chatMessagesContainer.scrollTop = chatMessagesContainer.scrollHeight; // Scroll down after user message and typing indicator

         // ** SECURITY WARNING:** API Key is exposed. Use a proxy for production.
         if (GEMINI_API_KEY_CHAT === "YOUR_GEMINI_API_KEY") {
             console.warn("Gemini API Key not set. Skipping AI response.");
             addMessage('model', "Maaf, koneksi ke AI sedang tidak aktif (API Key belum diatur).");
             isAiTyping = false;
             typingIndicator.classList.add('hidden');
             return;
         }


        // --- Prepare Context for Gemini ---
        const screeningData = getSessionData('screening_results');
        let screeningContext = "[RIWAYAT SCREENING TIDAK TERSEDIA]";
        if (screeningData) {
             const interpretation = getResultInterpretation(screeningData.screening_type, screeningData.answers.reduce((sum, answer) => sum + (answer !== null ? answer : 0), 0));
             screeningContext = `
[RIWAYAT SCREENING]
Tipe Screening: ${screeningData.screening_type || 'Tidak diketahui'}
Skor Total: ${screeningData.answers.reduce((sum, answer) => sum + (answer !== null ? answer : 0), 0)}
Kategori: ${interpretation ? interpretation.category : 'Tidak diketahui'}
Detail Jawaban: ${JSON.stringify(screeningData.answers)}
            `.trim();
        }

        // Gemini uses a specific format for chat history
        // Combine chatHistory into the prompt structure expected by Gemini API
        // We need to alternate 'user' and 'model' roles.

        // Construct the prompt including chat history and instructions
         const historyForPrompt = chatHistory.slice(-5); // Get last 5 messages (user+AI) for context window
         const promptInstructions = `
[CONTEXT]
Kamu adalah konselor psikologi AI di platform "Ruang Warna". Tugasmu memberi dukungan emosional, refleksi, dan saran praktis ringan untuk kesehatan mental. Kamu BUKAN dokter dan TIDAK memberi diagnosis medis.

${screeningContext}

[INSTRUKSI UNTUK AI]
1. Merespons pesan terakhir dari pengguna ('user') dengan empati, kehangatan, dan pengertian.
2. Gunakan bahasa Indonesia yang natural, inklusif, dan non-judgmental.
3. VALIDASI emosi pengguna dan fokus pada coping skills praktis jika sesuai.
4. JANGAN memberikan diagnosis klinis atau nasihat medis.
5. Sarankan layanan profesional jika pengguna menunjukkan distres berat, ide bunuh diri, atau meminta diagnosis (lihat halaman Layanan Profesional).
6. Jaga respons agar tidak terlalu panjang (target 2-4 paragraf singkat).
7. Selalu akhiri respons sebagai 'model'.

[RIWAYAT CHAT SEBELUMNYA (maksimal 4 terakhir + pesan baru)]`; // Gemini API usually handles history via `contents` array


         // Prepare contents array for Gemini API
          const contents = [];
          // Add history - ensuring alternating roles
          let lastRole = null;
          historyForPrompt.forEach(msg => {
               // Ensure strict alternation if needed, though gemini-flash might handle it
               if (msg.role !== lastRole) {
                   contents.push({ role: msg.role, parts: [{ text: msg.text }] });
                   lastRole = msg.role;
               } else {
                    // If consecutive messages from same role, append (less ideal for chat models)
                    // Or just take the last one of that role block
                    console.warn("Consecutive messages from same role detected in history, might affect context.");
                    contents.push({ role: msg.role, parts: [{ text: msg.text }] });
               }

          });

         // Make sure the last message added was the user's message that triggered this call
         // The structure above derived from chatHistory already includes the latest user message.


          console.log("Sending to Gemini - Contents:", JSON.stringify(contents, null, 2));
          console.log("Sending to Gemini - Prompt Instructions for context (not directly sent):", promptInstructions);


        try {
             // We send the structured contents, the model infers context and instructions implicitly (or via system prompt if supported)
             const response = await fetch(GEMINI_API_URL_CHAT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: contents, // Send the structured chat history
                    // Add safety settings and generation config as needed
                    // safetySettings: [...],
                    generationConfig: {
                         // maxOutputTokens: 256, // Limit response length if needed
                         // temperature: 0.7, // Adjust creativity/determinism
                    },
                    // System instruction (if model supports it well) can be cleaner:
                    // systemInstruction: { parts: [{ text: promptInstructions }] }
                })
            });


            isAiTyping = false;
            typingIndicator.classList.add('hidden');

            if (!response.ok) {
                const errorData = await response.json();
                console.error("Gemini API Error:", response.status, errorData);
                throw new Error(`API Error (${response.status}): ${errorData.error?.message || 'Gagal terhubung ke AI'}`);
            }

            const data = await response.json();

             // Extract AI response
             let aiResponseText = "Maaf, saya tidak bisa merespons saat ini.";
             if (data.candidates && data.candidates.length > 0 && data.candidates[0].content && data.candidates[0].content.parts && data.candidates[0].content.parts.length > 0) {
                  aiResponseText = data.candidates[0].content.parts[0].text;
             } else if (data.promptFeedback && data.promptFeedback.blockReason) {
                 // Handle blocked responses due to safety filters
                 console.warn("Gemini response blocked:", data.promptFeedback.blockReason);
                 aiResponseText = `Maaf, saya tidak dapat merespons permintaan tersebut karena alasan keamanan (${data.promptFeedback.blockReason}). Bisakah kita membahas topik lain?`;
             } else {
                  console.warn("Unexpected Gemini API response structure:", data);
             }

            addMessage('model', aiResponseText);

        } catch (error) {
            console.error("Error sending message to AI:", error);
            isAiTyping = false;
            typingIndicator.classList.add('hidden');
            addMessage('model', `Maaf, terjadi kesalahan teknis saat menghubungi konselor AI (${error.message}). Silakan coba lagi sesaat lagi.`);
        }
    }

    // --- Event Listeners ---
    chatForm.addEventListener('submit', (event) => {
        event.preventDefault();
        const messageText = messageInput.value.trim();
        if (messageText && !isAiTyping) {
            sendMessageToAI(messageText);
            messageInput.value = ''; // Clear input field
        }
    });

    // --- Initial Load ---
    initializeChat();

});
Explain
