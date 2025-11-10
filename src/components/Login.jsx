import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../data/firebase';
import { collection, getDocs, addDoc } from 'firebase/firestore';

function Login() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [categories, setCategories] = useState([]);
  const [isVisible, setIsVisible] = useState(false);
  const [testType, setTestType] = useState('kirish'); // 'kirish' or 'yakuniy'
  const [userChangedTestType, setUserChangedTestType] = useState(false);
  const navigate = useNavigate();
  const categoriesRef = useRef({}); // map id -> category

  useEffect(() => {
    fetchCategories();
    setIsVisible(true);
  }, []);

  const fetchCategories = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'categories'));
      const categoriesData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCategories(categoriesData);
      const map = {};
      categoriesData.forEach(c => (map[c.id] = c));
      categoriesRef.current = map;
    } catch (err) {
      console.error('Kategoriyalarni olishda xato:', err);
    }
  };

  // Decide a category's implied test type using various signals
  const inferCategoryType = (category) => {
    if (!category) return 'kirish';
    // 1) explicit questionsPerTest
    const qpt = Number(category.questionsPerTest);
    if (Number.isFinite(qpt) && qpt > 0) {
      return qpt >= 50 ? 'yakuniy' : 'kirish';
    }
    // 2) maxQuestions hint
    const maxQ = Number(category.maxQuestions);
    if (maxQ === 200) return 'yakuniy';
    if (maxQ === 100) return 'kirish';
    // 3) name suffix "(yakuniy)" or "(kirish)" (case-insensitive)
    const name = (category.name || '').toLowerCase();
    if (name.includes('yakun')) return 'yakuniy';
    if (name.includes('kirish')) return 'kirish';
    // default
    return 'kirish';
  };

  // Return filtered category list based on currently selected testType
  const filteredCategories = () => {
    if (!Array.isArray(categories)) return [];
    return categories.filter(cat => inferCategoryType(cat) === testType);
  };

  // If user selects a category (from dropdown), and we haven't marked user changed testType,
  // we update testType to match category default (so radio will reflect correct default).
  const onCategoryChange = (catId) => {
    setSelectedCategory(catId);
    if (!userChangedTestType) {
      const cat = categoriesRef.current[catId];
      const inferred = inferCategoryType(cat);
      setTestType(inferred);
    }
  };

  // When user toggles radio manually — mark that user changed preference so auto-overrides stop
  const onTestTypeChange = (value) => {
    setTestType(value);
    setUserChangedTestType(true);
    // If currently selected category doesn't match chosen type, clear selection so user picks again
    if (selectedCategory) {
      const selCat = categoriesRef.current[selectedCategory];
      if (selCat && inferCategoryType(selCat) !== value) {
        setSelectedCategory('');
      }
    }
  };

  // Also: whenever testType changes (e.g., auto-updated when category changes), ensure selectedCategory still valid
  useEffect(() => {
    if (!selectedCategory) return;
    const selCat = categoriesRef.current[selectedCategory];
    if (!selCat) return;
    if (inferCategoryType(selCat) !== testType) {
      // clear selection silently (because user changed type or category)
      setSelectedCategory('');
    }
  }, [testType, selectedCategory]);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!firstName || !lastName || !selectedCategory) {
      alert("Iltimos, barcha ma'lumotlarni kiriting.");
      return;
    }

    try {
      const docRef = await addDoc(collection(db, 'users'), {
        firstName,
        lastName,
        selectedCategory,
        testType,
        correct: 0,
        incorrect: 0,
        createdAt: new Date().toISOString()
      });
      navigate('/test', { state: { userId: docRef.id, firstName, lastName, selectedCategory, testType } });
    } catch (error) {
      console.error("Foydalanuvchini saqlashda xato:", error);
      alert("Foydalanuvchini saqlashda xatolik yuz berdi. Iltimos qayta urinib ko'ring.");
    }
  };

  // show small helper under <select>
  const renderCategoryHint = (catId) => {
    const cat = categoriesRef.current[catId];
    if (!cat) return null;
    const parts = [];
    if (cat.maxQuestions) parts.push(`maxQuestions: ${cat.maxQuestions}`);
    if (cat.questionsPerTest) parts.push(`questionsPerTest: ${cat.questionsPerTest}`);
    return parts.length ? parts.join(' • ') : null;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-96 h-96 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-96 h-96 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>

        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0 bg-repeat" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }}></div>
        </div>
      </div>

      <div className={`relative bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl w-full max-w-md p-8 border border-blue-100 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        <div className="absolute -top-6 left-1/2 -translate-x-1/2">
          <div className="w-12 h-12 bg-blue-600 rounded-xl rotate-45 flex items-center justify-center">
            <svg className="-rotate-45 w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
        </div>

        <h1 className="text-3xl font-bold text-center text-gray-800 mt-4 mb-8">Testga kirish</h1>
        
        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Familiya (Фамилиянгиз)</label>
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors bg-white/50 backdrop-blur-sm"
              placeholder="Familiyangizni kiriting"
              required
            />
          </div>
          
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Ism (Исмингиз)</label>
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors bg-white/50 backdrop-blur-sm"
              placeholder="Ismingizni kiriting"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Yo'nalishni tanlang (Йўналишни танланг)</label>
            <select
              value={selectedCategory}
              onChange={(e) => onCategoryChange(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors bg-white/50 backdrop-blur-sm"
              required
            >
              <option value="">Yo'nalishni tanlang</option>
              {filteredCategories().map(category => (
                <option key={category.id} value={category.id}>{category.name}</option>
              ))}
            </select>
            <div className="text-xs text-gray-500 mt-1">
              {renderCategoryHint(selectedCategory)}
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">Test turi</label>
            <div className="flex items-center gap-4 mt-2">
              <label className="inline-flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name="testType"
                  value="kirish"
                  checked={testType === 'kirish'}
                  onChange={() => onTestTypeChange('kirish')}
                  className="form-radio h-4 w-4 text-blue-600"
                />
                <span className="text-sm">Kirish</span>
              </label>

              <label className="inline-flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name="testType"
                  value="yakuniy"
                  checked={testType === 'yakuniy'}
                  onChange={() => onTestTypeChange('yakuniy')}
                  className="form-radio h-4 w-4 text-blue-600"
                />
                <span className="text-sm">Yakuniy</span>
              </label>
            </div>
            <p className="text-xs text-gray-500 mt-1">Kategoriya maxQuestions / questionsPerTest ga qarab avtomatik tanlanadi, lekin siz uni o'zgartirishingiz mumkin.</p>
          </div>

          <button
            type="submit"
            className="w-full py-3 px-6 text-white font-medium bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transform transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl"
          >
            Boshlash
          </button>
        </form>

        <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-b-2xl"></div>
      </div>
    </div>
  );
}

export default Login;