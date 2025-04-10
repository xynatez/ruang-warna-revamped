/* js/screening.js (REVISED) */
document.addEventListener('DOMContentLoaded', () => {
    // Pastikan data dan fungsi global sudah dimuat
    if (typeof screeningQuestions === 'undefined' || typeof getOptionsForType === 'undefined') {
        console.error("Screening data or functions not loaded!");
        alert("Gagal memuat data screening. Silakan coba muat ulang halaman.");
        return; // Hentikan eksekusi jika data penting tidak ada
    }

    const screeningType = sessionStorage.getItem('screening_type');
    const questions = screeningQuestions[screeningType];

    // --- Elemen DOM ---
    const questionContainer = document.getElementById('questionContainer');
    const questionTextElement = document.getElementById('questionText');
    const optionsContainer = document.getElementById('optionsContainer');
    const progressBar = document.getElementById('progressBar');
    const progressText = document.getElementById('progressText');
    const prevButton = document.getElementById('prevButton');
    const nextButton = document.getElementById('nextButton');

    // --- State ---
    let currentQuestionIndex = 0;
    let answers = [];
    let isTransitioning = false;

    // --- Inisialisasi ---
    function initializeScreening() {
        if (!screeningType || !questions) {
            console.error("Screening type invalid or questions missing.");
            alert("Terjadi kesalahan. Silakan pilih jenis screening kembali.");
            window.location.href = 'screening-selection.html';
            return;
        }

        // Reset state jika user kembali atau reload
        if (sessionStorage.getItem('screening_results')) {
            sessionStorage.removeItem('screening_results');
        }
        answers = new Array(questions.length).fill(null);
        currentQuestionIndex = 0;
        displayQuestion(currentQuestionIndex, 'enter'); // Mulai dengan animasi masuk
    }

    // --- Logika Tampilan ---
    function displayQuestion(index, direction = 'enter') {
        if (isTransitioning) return; // Cegah klik ganda saat animasi
        isTransitioning = true;

        const question = questions[index];
        const options = getOptionsForType(screeningType, index); // Dapatkan opsi yang sesuai

        // 1. Animasi Keluar (jika bukan load pertama)
        if (questionTextElement.textContent !== 'Memuat...') {
            questionTextElement.style.opacity = 0;
            optionsContainer.style.opacity = 0;
        }

        // Delay untuk ganti konten setelah fade out
        setTimeout(() => {
            // 2. Update Konten
            questionTextElement.textContent = question;
            optionsContainer.innerHTML = ''; // Kosongkan opsi lama

            options.forEach(option => {
                const optionId = `q${index}_opt${option.value}`;
                const isChecked = answers[index] === option.value;

                const wrapper = document.createElement('div');
                wrapper.classList.add('relative'); // Untuk styling focus-within

                const input = document.createElement('input');
                input.type = 'radio';
                input.id = optionId;
                input.name = `question_${index}`;
                input.value = option.value;
                input.checked = isChecked;
                input.classList.add('absolute', 'opacity-0', 'w-0', 'h-0'); // Sembunyikan radio asli

                const label = document.createElement('label');
                label.htmlFor = optionId;
                label.textContent = option.text;
                // Styling label agar terlihat seperti tombol radio, gunakan kelas dari input.css
                label.classList.add(
                    'block', 'w-full', 'p-4', 'border', 'rounded-lg', 'cursor-pointer',
                    'text-center', 'font-semibold', 'transition-all', 'duration-200',
                    'border-border-color-light', 'dark:border-border-color-dark',
                    'hover:border-primary', 'dark:hover:border-primary-dark',
                    'hover:bg-primary/5', 'dark:hover:bg-primary-dark/10'
                 );
                 // Terapkan style checked jika perlu (di-handle oleh CSS :checked + label)
                 if (isChecked) {
                     label.classList.add('border-primary', 'bg-primary/5', 'dark:border-primary-dark', 'dark:bg-primary-dark/10');
                 }

                wrapper.appendChild(input);
                wrapper.appendChild(label);
                optionsContainer.appendChild(wrapper);

                // Event listener pada input
                input.addEventListener('change', (event) => {
                     handleOptionSelect(index, parseInt(event.target.value));
                     // Update visual (CSS :checked + label sudah menangani ini)
                });
            });

            // 3. Update Progress Bar & Tombol
            updateProgress(index);
            updateNavigationButtons(index);

            // 4. Animasi Masuk
            questionTextElement.style.opacity = 1;
            optionsContainer.style.opacity = 1;
            isTransitioning = false; // Animasi selesai

        }, 150); // Durasi sedikit lebih pendek dari transisi opacity
    }

    function updateProgress(index) {
        const progressPercentage = ((index + 1) / questions.length) * 100;
        progressBar.style.width = `${progressPercentage}%`;
        progressText.textContent = `Pertanyaan ${index + 1} dari ${questions.length}`;
    }

    function updateNavigationButtons(index) {
        prevButton.disabled = index === 0 || isTransitioning;
        nextButton.disabled = answers[index] === null || isTransitioning;
        nextButton.innerHTML = (index === questions.length - 1)
            ? 'Lihat Hasil <i data-feather="check-circle" class="inline-block ml-1 w-5 h-5"></i>'
            : 'Selanjutnya <i data-feather="arrow-right" class="inline-block ml-1 w-5 h-5"></i>';
        // Render ulang ikon feather di tombol next
        if (typeof feather !== 'undefined') {
             setTimeout(() => feather.replace({ 'stroke-width': 2.5 }), 0); // Feather butuh waktu render
        }
    }


    // --- Event Handlers ---
    function handleOptionSelect(questionIndex, value) {
        answers[questionIndex] = value;
        nextButton.disabled = false; // Aktifkan tombol next
        console.log(`Q${questionIndex + 1} Answered: ${value}`);

        // Optional: Auto-next
         // setTimeout(() => {
         //     if (currentQuestionIndex < questions.length - 1 && !isTransitioning) {
         //         handleNext();
         //     }
         // }, 200);
    }

    function handleNext() {
        if (answers[currentQuestionIndex] === null || isTransitioning) return;

        if (currentQuestionIndex < questions.length - 1) {
            currentQuestionIndex++;
            displayQuestion(currentQuestionIndex, 'enter');
        } else {
            saveResults();
        }
    }

    function handlePrev() {
        if (currentQuestionIndex > 0 && !isTransitioning) {
            currentQuestionIndex--;
            displayQuestion(currentQuestionIndex, 'exit');
        }
    }

    // --- Save Results ---
    function saveResults() {
        console.log("Final Answers:", answers);
        if (answers.some(answer => answer === null)) {
             alert("Sepertinya ada pertanyaan yang terlewat. Silakan periksa kembali.");
             const firstUnanswered = answers.findIndex(ans => ans === null);
             if (firstUnanswered !== -1) {
                 currentQuestionIndex = firstUnanswered;
                 displayQuestion(currentQuestionIndex);
             }
             return;
         }

        const resultsData = {
            screening_type: screeningType,
            answers: answers,
            timestamp: Date.now()
        };
        // Gunakan helper global jika ada
        if (typeof setSessionData === 'function') {
            setSessionData('screening_results', resultsData);
        } else {
            sessionStorage.setItem('screening_results', JSON.stringify(resultsData));
        }
        console.log("Screening results saved. Navigating to results...");
        window.location.href = 'results.html';
    }

    // --- Attach Listeners ---
    prevButton.addEventListener('click', handlePrev);
    nextButton.addEventListener('click', handleNext);

    // --- Start ---
    initializeScreening();
});
