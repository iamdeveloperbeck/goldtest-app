import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { db } from '../data/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

function TestPage() {
  const location = useLocation();
  const { userId, firstName, lastName, selectedCategory } = location.state;
  const [tests, setTests] = useState([]);
  const [categoryName, setCategoryName] = useState('');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(1800);
  const [result, setResult] = useState(null);
  const [passingScore, setPassingScore] = useState(0);

  useEffect(() => {
    if (selectedCategory) {
      fetchTests();
    }
  }, [selectedCategory]);

  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setInterval(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearInterval(timer);
    } else {
      submitResults();
    }
  }, [timeLeft]);

  const fetchTests = async () => {
    try {
      const categoryRef = doc(db, `categories/${selectedCategory}`);
      const categoryDoc = await getDoc(categoryRef);

      if (categoryDoc.exists()) {
        const categoryData = categoryDoc.data();
        setCategoryName(categoryData.name);

        let testsData = categoryData.tests || [];
        
        // Randomly shuffle questions and limit to 30 or 50 questions based on the test length
        const testCount = testsData.length >= 50 ? 50 : 30;
        testsData = testsData.sort(() => Math.random() - 0.5).slice(0, testCount);
        
        setTests(testsData);

        // Set passing score based on test count
        if (testCount === 30) {
          setPassingScore(18); // 18 out of 30
        } else if (testCount === 50) {
          setPassingScore(28); // 28 out of 50
        }
      } else {
        console.log('Category not found');
      }
    } catch (error) {
      console.error('Error fetching tests:', error);
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
    const correctCount = tests.reduce((count, test, index) => {
      if (answers[index] === test.questions[0].correctAnswer) {
        return count + 1;
      }
      return count;
    }, 0);

    const incorrectCount = tests.length - correctCount;
    const passed = correctCount >= passingScore;

    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        correct: correctCount,
        incorrect: incorrectCount,
        passed,
        answers,
      });
      setResult({
        correct: correctCount,
        incorrect: incorrectCount,
        passed,
      });
    } catch (error) {
      console.error('Natijalarni saqlashda xato:', error);
    }
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
  };

  if (tests.length === 0) {
    return <div className='w-full h-screen flex items-center justify-center'><p className='p-4 mb-4 text-sm text-red-800 font-bold rounded-lg bg-red-50'>Testlar yuklanmoqda kutib turing!</p></div>;
  }

  const currentQuestion = tests[currentQuestionIndex].questions[0];

  return (
    <div className='p-10'>
      <h1 className='text-4xl font-bold mb-4'>Test sinovi</h1>
      <h2 className='text-2xl mb-4'>Xush kelibsiz, {firstName} {lastName}</h2>
      <h3 className='text-xl mb-4'>Yo'nalish: {categoryName}</h3>
      <div className='mb-4'>Berilgan vaqt: {formatTime(timeLeft)}</div>

      {result ? (
        <div className='border p-4 mt-4 bg-green-100'>
          <h2 className='text-2xl font-bold mb-2'>Natijalar</h2>
          <p>To'g'ri javoblar: {result.correct}</p>
          <p>Noto'g'ri javoblar: {result.incorrect}</p>
          <p>Holat: {result.passed ? 'Siz testdan o‘tdingiz' : 'Afsus testdan o‘ta olmadingiz!'}</p>
        </div>
      ) : (
        <>
          <div className='border p-4 mb-4 rounded-[15px]'>
            <p className='mb-4 text-2xl font-bold'>{currentQuestion.question}</p>
            <div className='flex flex-col items-start'>
              {currentQuestion.options.map((option, index) => (
                <button
                  key={index}
                  onClick={() => handleAnswer(option)}
                  className={`bg-gray-200 p-2 mb-2 rounded font-bold hover:bg-blue-200 ${answers[currentQuestionIndex] === option ? 'bg-blue-200' : ''}`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          <div className='flex flex-wrap items-center justify-center w-full gap-2'>
            {tests.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentQuestionIndex(index)}
                className={`rounded-full text-[12px] w-[30px] h-[30px] font-bold ${answers[index] ? 'bg-green-200' : 'bg-gray-200'}`}
              >
                {index + 1}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default TestPage;
