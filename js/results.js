/* js/results.js (REVISED) */
document.addEventListener('DOMContentLoaded', () => {
    // Pastikan data dan fungsi tersedia
    if (typeof getResultInterpretation === 'undefined' || typeof screeningQuestions === 'undefined' || typeof Chart === 'undefined') {
        console.error("Dependencies not loaded: getResultInterpretation, screeningQuestions, or Chart.js");
        handleMissingData("Gagal memuat komponen halaman hasil.");
        return;
    }

    // --- Elemen DOM ---
    const resultsContainer = document.getElementById('resultsContainer');
    const loadingState = document.getElementById('loadingState');
    const messageArea = document.getElementById('messageArea');
    const messageText = document.getElementById('messageText');
    const resultsDisplay = document.getElementById('resultsDisplay');

    const totalScoreElement = document.getElementById('totalScore');
    const maxScoreTextElement = document.getElementById('maxScoreText');
    const scoreCategoryLabelElement = document.getElementById('scoreCategoryLabel');
    const scoreCategoryElement = document.getElementById('scoreCategory');
    const scoreInterpretationElement = document.getElementById('scoreInterpretation');
    const scoreSection = document.getElementById('scoreSection'); // Kontainer skor & interpretasi
    const scoreGaugeCanvas = document.getElementById('scoreGaugeChart').getContext('2d');
    const perQuestionCanvas = document.getElementById('perQuestionChart').getContext('2d');
    const aiFeedbackTextElement = document.getElementById('aiFeedbackText');
    const aiFeedbackLoader = document.getElementById('aiFeedbackLoader');
    const professionalHelpButton = document.getElementById('professionalHelpButton');

    // --- Variabel Chart ---
    let scoreGaugeChart = null;
    let perQuestionChart = null;

    // --- Load & Process Results ---
    function loadResults() {
        loadingState.classList.remove('hidden');
        resultsDisplay.classList.add('hidden');
        messageArea.classList.add('hidden');

        // Delay simulasi/memberi waktu render awal
        setTimeout(() => {
            const resultsData = typeof getSessionData === 'function' ? getSessionData('screening_results') : null;

            if (!resultsData || !resultsData.answers) {
                handleMissingData();
                return;
            }

            const { screening_type, answers, timestamp } = resultsData;
            const interpretation = getResultInterpretation(screening_type, answers);
            const maxScore = (screeningQuestions[screening_type] || []).length * 3; // Max score = Jml soal * 3

            if (!interpretation) {
                console.error("Could not get result interpretation for type:", screening_type, "with answers:", answers);
                handleMissingData("Gagal menganalisis hasil screening Anda.");
                return;
            }

            // --- Update UI Elements ---
            totalScoreElement.textContent = interpretation.score;
            maxScoreTextElement.textContent = `dari maks. ${maxScore}`;
            scoreCategoryLabelElement.textContent = `Kategori Hasil (${screening_type})`;
            scoreCategoryElement.textContent = interpretation.category;
            scoreInterpretationElement.textContent = interpretation.interpretation;

            // Terapkan Styling Hasil (Background, Text, Border)
            applyResultStyling(scoreSection, interpretation.details);

            // Tampilkan/Sembunyikan Tombol Bantuan Profesional
            if (professionalHelpButton) {
                const showHelpButtonCodes = ['vulnerable', 'emergency']; // Tampilkan jika kategori ini
                if (showHelpButtonCodes.includes(interpretation.code)) {
                    professionalHelpButton.classList.remove('hidden');
                } else {
                    professionalHelpButton.classList.add('hidden');
                }
            }

            // --- Render Charts ---
            renderScoreGaugeChart(scoreGaugeCanvas, interpretation.score, maxScore, interpretation.details.gauge);
            renderPerQuestionChart(perQuestionCanvas, answers, screening_type);

            // --- Fetch AI Feedback ---
            fetchAiFeedback(screening_type, interpretation.score, interpretation.category, answers);

            // --- Tampilkan Hasil ---
            loadingState.classList.add('hidden');
            resultsDisplay.classList.remove('hidden');

        }, 500); // Sedikit delay
    }

    // --- Fungsi Styling ---
    function applyResultStyling(element, details) {
        if (!element || !details) return;
        // Hapus kelas styling hasil sebelumnya jika ada
        const resultClasses = ['safe', 'tired', 'vulnerable', 'emergency'];
        element.className.split(' ').forEach(cls => {
            if (resultClasses.some(rc => cls.includes(`result-${rc}`))) {
                element.classList.remove(cls);
            }
        });
        // Tambahkan kelas baru
        details.bg.split(' ').forEach(cls => element.classList.add(cls));
        details.text.split(' ').forEach(cls => element.classList.add(cls));
        details.border.split(' ').forEach(cls => element.classList.add(cls)); // Tambahkan border
    }


    // --- Chart Rendering ---
     function renderScoreGaugeChart(ctx, score, maxScore, color) {
         const isDark = document.documentElement.classList.contains('dark');
         const remainingColor = isDark ? '#334155' : '#E2E8F0'; // slate-700 / slate-200

         if (scoreGaugeChart) scoreGaugeChart.destroy(); // Hancurkan chart lama

         scoreGaugeChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                datasets: [{
                    data: [score, Math.max(0, maxScore - score)],
                    backgroundColor: [color, remainingColor],
                    borderColor: [color, remainingColor], // Hindari border putih
                     borderWidth: 1,
                     circumference: 180,
                     rotation: 270,
                }]
            },
             options: {
                 responsive: true,
                 maintainAspectRatio: false, // Biarkan container mengatur ukuran
                 aspectRatio: 2,
                 cutout: '70%',
                 plugins: {
                     legend: { display: false },
                     tooltip: { enabled: false }
                 }
             }
        });
    }

    function renderPerQuestionChart(ctx, answersData, type) {
        const isDark = document.documentElement.classList.contains('dark');
        const labels = (screeningQuestions[type] || []).map((_, i) => `Q${i + 1}`);
        const primaryColor = isDark ? '#2DD4BF' : '#14B8A6'; // primary-dark / primary
        const gridColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)';
        const textColor = isDark ? '#E2E8F0' : '#334155'; // slate-200 / slate-700

        if (perQuestionChart) perQuestionChart.destroy(); // Hancurkan chart lama

        perQuestionChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Skor Jawaban',
                    data: answersData,
                     backgroundColor: primaryColor,
                     borderColor: primaryColor,
                     borderWidth: 1,
                     borderRadius: 4,
                     barPercentage: 0.5,
                }]
            },
            options: {
                 responsive: true,
                 maintainAspectRatio: false,
                 indexAxis: 'x',
                 scales: {
                     y: {
                         beginAtZero: true,
                         max: 3,
                         ticks: { stepSize: 1, color: textColor },
                         grid: { color: gridColor, drawBorder: false },
                         title: { display: true, text: 'Skor (0-3)', color: textColor, font: { weight: '600' } }
                     },
                     x: {
                         ticks: { color: textColor },
                         grid: { display: false }, // Sembunyikan grid x
                         title: { display: true, text: 'Pertanyaan', color: textColor, font: { weight: '600' } }
                     }
                 },
                 plugins: {
                     legend: { display: false },
                     tooltip: {
                         backgroundColor: isDark ? '#1E293B' : '#FFFFFF', // slate-800 / white
                         titleColor: isDark ? '#F1F5F9' : '#0F172A', // slate-100 / slate-900
                         bodyColor: isDark ? '#CBD5E1' : '#475569', // slate-300 / slate-600
                         borderColor: isDark ? '#334155' : '#E2E8F0', // slate-700 / slate-200
                         borderWidth: 1,
                         padding: 10,
                         callbacks: {
                             label: (context) => {
                                 const scoreValue = context.parsed.y;
                                 const options = getOptionsForType(type, context.dataIndex); // Dapatkan opsi yg benar
                                 const option = options.find(opt => opt.value === scoreValue);
                                 return ` Skor: ${scoreValue}${option ? ` (${option.text})` : ''}`;
                             },
                             title: (context) => {
                                const index = context[0].dataIndex;
                                return screeningQuestions[type] && screeningQuestions[type][index] ? `Q${index + 1}: ${screeningQuestions[type][index]}` : `Pertanyaan ${index + 1}`;
                             }
                         }
                     }
                 }
             }
         });
     }

    // --- AI Feedback Fetching ---
     async function fetchAiFeedback(screeningType, score, category, answerDetails) {
        aiFeedbackLoader.classList.remove('hidden');
        aiFeedbackTextElement.textContent = ''; // Kosongkan dulu
        const apiKey = "AIzaSyDP-3ba4HulshOKZkVzll7bFdGYkcP8bQQ"; // <<< GANTI DENGAN KUNCI ANDA ATAU GUNAKAN PROXY!
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`;

          if (apiKey === "YOUR_GEMINI_API_KEY" || !apiKey) {
              console.warn("ResultsJS: Gemini API Key not set.");
              aiFeedbackTextElement.textContent = "Fitur feedback AI tidak aktif (API Key belum diatur).";
              aiFeedbackLoader.classList.add('hidden');
              return;
          }

          const prompt = `[CONTEXT] Kamu adalah AI suportif di Ruang Warna. Pengguna baru saja menyelesaikan screening '${screeningType}' dengan skor ${score}, masuk kategori '${category}'. Detail jawaban (0-3): ${JSON.stringify(answerDetails)}. [INSTRUCTION] Berikan refleksi singkat (1 Paragraf singkat), empatik, validatif, jangan pakai teks bold, bahasamu harus membuat mood user membaik, tugas utamamu memberikan feedback hasil screeningnya dalam 1 paragraf dgn 3 atau 4 kalimat, tampilkan juga skornya berapa dia, berikan feedback positif dan dalam Bahasa Indonesia. Hindari diagnosis. Jika skor/kategori tinggi (misal 'Berat', 'Emergency', 'Risiko Tinggi'), sertakan saran lembut untuk mencari bantuan profesional. Jangan memberi nasihat medis spesifik. Fokus pada validasi perasaan dan dukungan.`;

          console.log("ResultsJS: Sending prompt to Gemini for feedback...");

          try {
              const response = await fetch(apiUrl, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                      contents: [{ parts: [{ text: prompt }] }],
                      safetySettings: [ { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" }, { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_MEDIUM_AND_ABOVE" }, { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_MEDIUM_AND_ABOVE" }, { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" } ],
                      generationConfig: { temperature: 0.7, maxOutputTokens: 350 }
                  })
              });

              const responseDataText = await response.text(); // Baca teks dulu
              console.log("ResultsJS: AI Feedback Raw Status:", response.status);
              console.log("ResultsJS: AI Feedback Raw Body:", responseDataText);

              if (!response.ok) {
                   let errorData = null; try { errorData = JSON.parse(responseDataText); } catch (e) {}
                   console.error("ResultsJS: AI Feedback API Error Details:", errorData);
                   let errorMsg = `API Error (${response.status})`;
                   if (errorData?.promptFeedback?.blockReason) errorMsg = `Permintaan diblokir: ${errorData.promptFeedback.blockReason}`;
                   else if (errorData?.error?.message) errorMsg += `: ${errorData.error.message}`;
                   throw new Error(errorMsg);
              }

              let data = null; try { data = JSON.parse(responseDataText); } catch (e) { throw new Error("Gagal memproses respons AI."); }

              let feedbackText = "Tidak dapat memproses feedback saat ini.";
               if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
                   feedbackText = data.candidates[0].content.parts[0].text;
               } else if (data.promptFeedback?.blockReason) {
                   feedbackText = `Maaf, feedback tidak dapat dibuat karena alasan keamanan (${data.promptFeedback.blockReason}).`;
               } else {
                   console.warn("ResultsJS: Unexpected AI Feedback response structure (No candidates):", data);
                   feedbackText = "Gagal mendapatkan feedback dari AI saat ini.";
               }
              aiFeedbackTextElement.textContent = feedbackText.trim();

          } catch (error) {
              console.error("ResultsJS: Error fetching AI feedback:", error);
              aiFeedbackTextElement.textContent = `Maaf, terjadi kendala saat mendapatkan feedback (${error.message}).`;
          } finally {
              aiFeedbackLoader.classList.add('hidden');
          }
     }

    // --- Error Handling ---
    function handleMissingData(message = "Hasil screening tidak ditemukan atau sesi telah berakhir.") {
        loadingState.classList.add('hidden');
        resultsDisplay.classList.add('hidden');
        messageArea.classList.remove('hidden');
        messageText.textContent = message + "\n\nAnda akan diarahkan kembali...";
        setTimeout(() => { window.location.href = 'screening-selection.html'; }, 4000);
    }

    // --- Event Listener for Theme Change ---
    window.addEventListener('themeChanged', (event) => {
        console.log("ResultsJS: Theme changed detected, redrawing charts.");
        // Muat ulang data untuk mendapatkan warna yg benar saat redraw
        const resultsData = typeof getSessionData === 'function' ? getSessionData('screening_results') : null;
         if (resultsData && resultsData.answers) {
             const interpretation = getResultInterpretation(resultsData.screening_type, resultsData.answers);
             const maxScore = (screeningQuestions[resultsData.screening_type] || []).length * 3;
             if (interpretation) {
                 renderScoreGaugeChart(scoreGaugeCanvas, interpretation.score, maxScore, interpretation.details.gauge);
                 renderPerQuestionChart(perQuestionCanvas, resultsData.answers, resultsData.screening_type);
             }
         }
    });


    // --- Initial Load ---
    loadResults();
});
