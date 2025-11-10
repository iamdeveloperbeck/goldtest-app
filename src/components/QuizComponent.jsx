import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { db } from '../data/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

function TestPage() {
  const location = useLocation();
  const { userId, firstName, lastName, selectedCategory } = location.state || {};
  const [tests, setTests] = useState([]);
  const [categoryName, setCategoryName] = useState('');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(1800); // default 30 minutes
  const [result, setResult] = useState(null);
  const [passingScore, setPassingScore] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [loadingTests, setLoadingTests] = useState(false);
  const [fetchError, setFetchError] = useState('');

  useEffect(() => {
    setIsVisible(true);
    if (selectedCategory) {
      fetchTests();
    }
  }, [selectedCategory]);

  // Timer effect
  useEffect(() => {
    if (timeLeft > 0 && !result) {
      const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
      return () => clearInterval(timer);
    } else if (timeLeft <= 0 && !result) {
      // time over -> submit
      submitResults();
    }
  }, [timeLeft, result]);

  // Utility: shuffle array (Fisher-Yates)
  const shuffleArray = (arr) => {
    const a = Array.isArray(arr) ? [...arr] : [];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };

  const fetchTests = async () => {
    setLoadingTests(true);
    setFetchError('');
    try {
      const categoryRef = doc(db, `categories/${selectedCategory}`);
      const categoryDoc = await getDoc(categoryRef);

      if (!categoryDoc.exists()) {
        setFetchError('Tanlangan kategoriya topilmadi');
        setLoadingTests(false);
        return;
      }

      const categoryData = categoryDoc.data();
      setCategoryName(categoryData?.name || '');

      // Decide how many questions per test based on category metadata
      // Priority:
      // 1) if categoryData.questionsPerTest exists -> use it
      // 2) else if categoryData.maxQuestions === 200 -> use 50
      // 3) else default -> 30
      const perTestFromCategory = Number(categoryData?.questionsPerTest);
      const maxQ = Number(categoryData?.maxQuestions);
      let questionsPerTest;
      if (Number.isFinite(perTestFromCategory) && perTestFromCategory > 0) {
        questionsPerTest = Math.max(1, Math.floor(perTestFromCategory));
      } else if (maxQ === 200) {
        questionsPerTest = 50;
      } else {
        // default for 100 or unknown
        questionsPerTest = 30;
      }

      // Determine passing score defaults if not provided in category
      // default mapping: 30 -> 18, 50 -> 28
      let defaultPassing = 0;
      if (questionsPerTest === 30) defaultPassing = 18;
      else if (questionsPerTest === 50) defaultPassing = 28;
      else defaultPassing = Math.ceil(questionsPerTest * 0.6); // fallback 60%

      // Use categoryData.tests as source (array)
      let testsData = Array.isArray(categoryData?.tests) ? [...categoryData.tests] : [];

      // If testsData items are objects that contain a 'questions' array each,
      // and you want to use each inner question as a single test item,
      // adapt accordingly. Current assumption: each item of testsData is a 'test' (with questions array).
      const availableCount = testsData.length;

      // If there are fewer available items than questionsPerTest, we take all available.
      const take = Math.min(questionsPerTest, Math.max(0, availableCount));

      // Shuffle and slice
      const picked = take > 0 ? shuffleArray(testsData).slice(0, take) : [];

      setTests(picked);
      setPassingScore(defaultPassing);

      // optional: adjust timer based on questionsPerTest (example: 1 minute per question)
      // setTimeLeft(questionsPerTest * 60); // uncomment if you want dynamic timer

      setLoadingTests(false);
    } catch (error) {
      console.error('Error fetching tests:', error);
      setFetchError('Testlarni yuklashda xatolik yuz berdi');
      setLoadingTests(false);
    }
  };

  const handleAnswer = (answer) => {
    setAnswers(prev => ({ ...prev, [currentQuestionIndex]: answer }));
    const nextIndex = currentQuestionIndex + 1;
    if (nextIndex < tests.length) {
      setCurrentQuestionIndex(nextIndex);
    } else {
      submitResults();
    }
  };

  const submitResults = async () => {
    if (!Array.isArray(tests) || tests.length === 0) {
      return;
    }

    // Calculate correct answers
    const correctCount = tests.reduce((count, test, index) => {
      // ensure test.questions exists and first question has correctAnswer
      const correctAnswer = test?.questions?.[0]?.correctAnswer ?? test?.correctAnswer ?? '';
      if (!correctAnswer) return count;
      if (answers[index] === correctAnswer) return count + 1;
      return count;
    }, 0);

    const incorrectCount = tests.length - correctCount;
    const passed = correctCount >= (passingScore || 0);

    try {
      if (userId) {
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, {
          correct: correctCount,
          incorrect: incorrectCount,
          passed,
          answers,
          lastTestAt: new Date().toISOString(),
          category: selectedCategory,
        });
      }

      setResult({
        correct: correctCount,
        incorrect: incorrectCount,
        passed,
      });
    } catch (error) {
      console.error('Natijalarni saqlashda xato:', error);
      // still show results locally
      setResult({
        correct: correctCount,
        incorrect: incorrectCount,
        passed,
      });
    }
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
  };

  if (loadingTests) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 to-blue-50 flex items-center justify-center">
        <div className="animate-pulse bg-white rounded-xl shadow-xl p-6">
          <p className="text-teal-800 font-medium">Testlar yuklanmoqda, kuting...</p>
        </div>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 to-blue-50 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-xl p-6">
          <p className="text-red-600 font-medium">{fetchError}</p>
        </div>
      </div>
    );
  }

  if (!tests || tests.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 to-blue-50 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-xl p-6">
          <p className="text-teal-800 font-medium">Bu yo'nalishda hozircha testlar mavjud emas yoki yetarli emas.</p>
        </div>
      </div>
    );
  }

  // ensure safe access
  const currentQuestion = tests[currentQuestionIndex]?.questions?.[0] ?? {
    question: 'Savol mavjud emas',
    options: [],
  };

  return (
    <div className={`min-h-screen bg-gradient-to-br from-teal-50 to-blue-50 p-4 md:p-8 transition-all duration-700 ${
      isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
    }`}>
      <div className="max-w-4xl mx-auto">
        {/* Header Card */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-6">
          <div className="bg-gradient-to-r from-teal-600 to-blue-600 p-6">
            <h1 className="text-3xl font-bold text-white mb-3">Test sinovi</h1>
            <div className="space-y-1 text-teal-50">
              <p className="text-lg">Xush kelibsiz, {firstName} {lastName}</p>
              <p className="text-sm">Yo'nalish: {categoryName}</p>
            </div>
          </div>

          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5 text-teal-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-gray-600">Berilgan vaqt: <span className="font-mono font-bold text-teal-600">{formatTime(timeLeft)}</span></span>
            </div>
          </div>
        </div>

        {result ? (
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden transition-all duration-300 transform hover:scale-[1.02]">
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-6">Natijalar</h2>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span className="text-green-800">To'g'ri javoblar</span>
                  </div>
                  <span className="text-2xl font-bold text-green-600">{result.correct}</span>
                </div>

                <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </div>
                    <span className="text-red-800">Noto'g'ri javoblar</span>
                  </div>
                  <span className="text-2xl font-bold text-red-600">{result.incorrect}</span>
                </div>
              </div>

              <div className="mt-6 text-center">
                <p className={`py-3 px-4 rounded-full inline-block ${
                  result.passed ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
                }`}>
                  Holat: {result.passed ? "Siz testdan o'tdingiz!" : "Afsus testdan o'ta olmadingiz!"}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Question Card */}
            <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
              <h2 className="text-xl font-medium text-gray-800 mb-6">
                {currentQuestion.question}
              </h2>

              <div className="space-y-3">
                {currentQuestion.options.map((option, index) => (
                  <button
                    key={index}
                    onClick={() => handleAnswer(option)}
                    className={`w-full text-left p-4 rounded-xl transition-all duration-200 ${
                      answers[currentQuestionIndex] === option 
                        ? 'bg-teal-500 text-white shadow-lg scale-[1.02]' 
                        : 'bg-gray-50 hover:bg-gray-100 text-gray-700'
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>

            {/* Pagination */}
            <div className="bg-white rounded-2xl shadow-xl p-4">
              <div className="grid grid-cols-10 gap-2">
                {tests.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentQuestionIndex(index)}
                    className={`aspect-square rounded-lg text-sm font-medium transition-all duration-200
                      ${answers[index] 
                        ? 'bg-teal-500 text-white' 
                        : 'bg-gray-50 text-gray-600 hover:bg-teal-50 hover:text-teal-600'}
                      ${currentQuestionIndex === index ? 'ring-2 ring-teal-500 ring-offset-2' : ''}
                      focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2`}
                  >
                    {index + 1}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default TestPage;