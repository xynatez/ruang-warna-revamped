/* js/screening-data.js (REVISED RESULT COLORS) */
const screeningQuestions = {
    mood: [
        "Selama 2 minggu terakhir, seberapa sering Anda merasa sedih, murung, atau hampa?",
        "Selama 2 minggu terakhir, seberapa sering Anda kehilangan minat atau kesenangan dalam melakukan hal-hal yang biasanya Anda nikmati?",
        "Selama 2 minggu terakhir, seberapa sering Anda merasa khawatir berlebihan atau sulit mengendalikan rasa cemas?",
        "Selama 2 minggu terakhir, seberapa sering Anda mengalami kesulitan tidur (susah tidur, sering terbangun, atau tidur terlalu banyak)?",
        "Selama 2 minggu terakhir, seberapa sering Anda merasa lelah atau kekurangan energi?",
        "Selama 2 minggu terakhir, seberapa sering Anda merasa tidak berharga, bersalah berlebihan, atau menyalahkan diri sendiri?",
        "Selama 2 minggu terakhir, seberapa sering Anda kesulitan berkonsentrasi, misalnya saat membaca atau menonton TV?",
        "Selama 2 minggu terakhir, seberapa sering Anda merasa gelisah atau sebaliknya, bergerak atau berbicara lebih lambat dari biasanya?",
        "Selama 2 minggu terakhir, seberapa sering Anda merasa lebih baik mati atau memiliki pikiran untuk menyakiti diri sendiri?",
        // Tambah 1 pertanyaan netral/positif jika perlu untuk balancing
        "Selama 2 minggu terakhir, seberapa sering Anda merasa memiliki harapan tentang masa depan?" // Skor dibalik untuk ini (3->0, 2->1, 1->2, 0->3) - PERLU LOGIKA KHUSUS DI JS jika dipakai
    ],
    burnout: [
        "Saya merasa terkuras secara emosional oleh pekerjaan/studi saya.",
        "Saya merasa lelah ketika harus menghadapi hari lain di tempat kerja/studi.",
        "Saya merasa frustrasi dengan pekerjaan/studi saya.",
        "Saya merasa energi saya habis di akhir hari kerja/studi.",
        "Saya merasa lelah secara fisik maupun mental karena pekerjaan/studi saya.",
        "Saya merasa pekerjaan/studi menuntut terlalu banyak dari saya.",
        "Saya merasa kurang bersemangat tentang pekerjaan/studi saya.",
        "Saya menjadi kurang peduli terhadap orang lain (rekan kerja, klien, teman sekelas) sejak memulai pekerjaan/studi ini.",
        "Saya merasa ragu apakah pekerjaan/studi saya memberikan kontribusi positif.",
        "Saya merasa tidak lagi efektif dalam menyelesaikan tugas-tugas saya."
    ],
    postpartum: [
        "Saya bisa tertawa dan melihat sisi lucu dari suatu hal.", // Skor dibalik (0->3, 1->2, 2->1, 3->0)
        "Saya menantikan sesuatu dengan gembira.", // Skor dibalik
        "Saya menyalahkan diri sendiri secara tidak perlu ketika ada sesuatu yang salah.",
        "Saya merasa cemas atau khawatir tanpa alasan yang jelas.",
        "Saya merasa takut atau panik tanpa alasan yang jelas.",
        "Saya merasa kewalahan dan sulit mengatasi keadaan.",
        "Saya merasa sangat sedih sehingga sulit tidur.",
        "Saya merasa sedih atau sengsara.",
        "Saya merasa sangat sedih sehingga saya menangis.",
        "Pikiran untuk menyakiti diri sendiri pernah terlintas di benak saya."
    ]
};

const screeningOptions = [
    // Untuk Mood & Burnout (Frekuensi)
    { text: "Tidak Pernah", value: 0 },
    { text: "Beberapa Hari", value: 1 },
    { text: "Lebih dari Setengah Hari", value: 2 },
    { text: "Hampir Setiap Hari", value: 3 }
];

// Opsi khusus untuk Postpartum (EPDS-like, skor bisa bervariasi)
// Perhatikan ada pertanyaan dengan skor terbalik
const postpartumOptions = [
    { text: "Seringkali", value: 0 }, // Untuk pertanyaan positif (no 1, 2) -> value rendah jika positif
    { text: "Kadang-kadang", value: 1 },
    { text: "Jarang", value: 2 },
    { text: "Tidak Pernah", value: 3 },
];
const postpartumOptionsNegative = [ // Untuk pertanyaan negatif (no 3-10)
    { text: "Seringkali", value: 3 }, // -> value tinggi jika negatif
    { text: "Kadang-kadang", value: 2 },
    { text: "Jarang", value: 1 },
    { text: "Tidak Pernah", value: 0 },
];


// STRUKTUR WARNA HASIL BARU
const resultCategories = {
    mood: [ // Contoh: Sesuaikan skor berdasarkan validasi (misal PHQ-9)
        { range: [0, 4], category: "Minimal", interpretation: "Gejala suasana hati minimal atau tidak ada. Tetap jaga kesehatan mental Anda.", code: 'safe' },
        { range: [5, 9], category: "Ringan", interpretation: "Anda mungkin mengalami gejala suasana hati ringan. Perhatikan self-care dan pantau perasaan Anda.", code: 'tired' },
        { range: [10, 14], category: "Sedang", interpretation: "Gejala suasana hati tingkat sedang terdeteksi. Pertimbangkan berbicara dengan teman, keluarga, atau profesional.", code: 'vulnerable' },
        { range: [15, 19], category: "Cukup Berat", interpretation: "Anda mengalami gejala suasana hati yang cukup berat. Sangat disarankan mencari dukungan profesional.", code: 'emergency' },
        { range: [20, 27], category: "Berat", interpretation: "Gejala suasana hati berat terdeteksi. Mohon segera hubungi profesional kesehatan mental atau layanan darurat.", code: 'emergency' } // Max score 9*3 = 27 (jika pakai 9 pertanyaan)
    ],
    burnout: [ // Contoh: Sesuaikan skor berdasarkan validasi (misal MBI)
        { range: [0, 9], category: "Energi Terjaga", interpretation: "Tingkat energi Anda tampak baik. Pertahankan keseimbangan.", code: 'safe' },
        { range: [10, 18], category: "Mulai Lelah", interpretation: "Ada tanda-tanda kelelahan. Perhatikan kebutuhan istirahat dan batas.", code: 'tired' },
        { range: [19, 25], category: "Risiko Burnout", interpretation: "Anda berisiko mengalami burnout. Evaluasi beban kerja/studi dan cari strategi coping.", code: 'vulnerable' },
        { range: [26, 30], category: "Burnout Tinggi", interpretation: "Tingkat kelelahan sangat tinggi. Prioritaskan istirahat dan pertimbangkan bantuan profesional.", code: 'emergency' } // Max score 10*3 = 30
    ],
    postpartum: [ // Contoh: Sesuaikan skor berdasarkan validasi (misal EPDS)
        { range: [0, 8], category: "Risiko Rendah", interpretation: "Risiko depresi pasca melahirkan tampak rendah. Tetap perhatikan perubahan perasaan Anda.", code: 'safe' },
        { range: [9, 12], category: "Risiko Sedang", interpretation: "Ada kemungkinan gejala depresi pasca melahirkan. Baik untuk membicarakannya dengan pasangan, keluarga, atau dokter.", code: 'tired' },
        { range: [13, 30], category: "Risiko Tinggi / Perlu Evaluasi", interpretation: "Skor Anda mengindikasikan kemungkinan depresi pasca melahirkan yang perlu dievaluasi lebih lanjut oleh profesional kesehatan.", code: 'vulnerable' } // Threshold EPDS >= 13 sering dianggap perlu evaluasi. Skor 30 max.
        // Tambahkan kategori darurat jika ada pertanyaan spesifik tentang menyakiti diri
    ]
};

// Fungsi untuk mendapatkan detail kategori hasil berdasarkan code
function getResultDetailsByCode(code) {
     const colorConfig = {
        safe: {
          bg: 'bg-result-safe-bg_light dark:bg-result-safe-bg_dark',
          text: 'text-result-safe-text_light dark:text-result-safe-text_dark',
          border: 'border-result-safe-border_light dark:border-result-safe-border_dark',
          gauge: '#10B981' // Warna Gauge Chart (Misal: Green-500)
        },
        tired: {
          bg: 'bg-result-tired-bg_light dark:bg-result-tired-bg_dark',
          text: 'text-result-tired-text_light dark:text-result-tired-text_dark',
          border: 'border-result-tired-border_light dark:border-result-tired-border_dark',
          gauge: '#F59E0B' // Amber-500
        },
        vulnerable: {
          bg: 'bg-result-vulnerable-bg_light dark:bg-result-vulnerable-bg_dark',
          text: 'text-result-vulnerable-text_light dark:text-result-vulnerable-text_dark',
          border: 'border-result-vulnerable-border_light dark:border-result-vulnerable-border_dark',
          gauge: '#F43F5E' // Rose-500
        },
        emergency: {
          bg: 'bg-result-emergency-bg_light dark:bg-result-emergency-bg_dark',
          text: 'text-result-emergency-text_light dark:text-result-emergency-text_dark',
          border: 'border-result-emergency-border_light dark:border-result-emergency-border_dark',
          gauge: '#EF4444' // Red-500
        }
     };
     return colorConfig[code] || colorConfig.safe; // Default ke safe jika code tidak ditemukan
}


// Fungsi untuk mendapatkan interpretasi hasil (termasuk penanganan skor terbalik jika ada)
function getResultInterpretation(type, answers) {
    let totalScore = 0;
    const questions = screeningQuestions[type];

    // Logika Skor Khusus untuk Postpartum (EPDS-like)
    if (type === 'postpartum') {
        // Pertanyaan 1, 2 memiliki skor terbalik
        const reversedScoreIndices = [0, 1];
        answers.forEach((answer, index) => {
            if (answer === null) return; // Abaikan jika tidak dijawab
            if (reversedScoreIndices.includes(index)) {
                totalScore += (3 - answer); // Balik skor (0->3, 1->2, 2->1, 3->0)
            } else {
                totalScore += answer;
            }
        });
    } else {
        // Skor normal untuk mood dan burnout
         totalScore = answers.reduce((sum, answer) => sum + (answer !== null ? answer : 0), 0);
         // Handle pertanyaan mood no 10 jika dipakai (skor terbalik)
         if (type === 'mood' && answers.length > 9 && answers[9] !== null) {
             // Asumsi pertanyaan ke-10 (index 9) adalah yg skornya dibalik
             // Kurangi skor normalnya, tambahkan skor terbaliknya
             // totalScore = totalScore - answers[9] + (3 - answers[9]);
             // Atau jika tidak dimasukkan dalam reduce awal:
             // totalScore += (3 - answers[9]);
             // -> Perlu dipastikan pertanyaan mana yg dibalik skornya jika dipakai
         }
    }


    const categories = resultCategories[type];
    if (!categories) return null;

    for (const cat of categories) {
        if (totalScore >= cat.range[0] && totalScore <= cat.range[1]) {
            // Gabungkan data interpretasi dengan detail warna berdasarkan code
            const details = getResultDetailsByCode(cat.code);
            return {
                score: totalScore,
                category: cat.category,
                interpretation: cat.interpretation,
                code: cat.code,
                details: details // Mengandung bg, text, border, gauge color
            };
        }
    }
    return null; // Jika skor di luar semua rentang (seharusnya tidak terjadi)
}

// Fungsi untuk mendapatkan opsi jawaban yang sesuai
function getOptionsForType(type, index) {
    if (type === 'postpartum') {
        // Pertanyaan 1, 2 (index 0, 1) pakai opsi biasa (value rendah jika positif)
        const reversedScoreIndices = [0, 1];
        return reversedScoreIndices.includes(index) ? postpartumOptions : postpartumOptionsNegative;
    }
    // Default untuk mood dan burnout
    return screeningOptions;
}
