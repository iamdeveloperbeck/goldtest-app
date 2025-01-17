import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../data/firebase';
import { collection, getDocs, addDoc } from 'firebase/firestore';

function Login() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [categories, setCategories] = useState([]);
  const [isVisible, setIsVisible] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchCategories();
    setIsVisible(true);
  }, []);

  const fetchCategories = async () => {
    const querySnapshot = await getDocs(collection(db, 'categories'));
    const categoriesData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setCategories(categoriesData);
  };

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
        correct: 0,
        incorrect: 0,
      });
      navigate('/test', { state: { userId: docRef.id, firstName, lastName, selectedCategory } });
    } catch (error) {
      console.error("Foydalanuvchini saqlashda xato:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-4">
      {/* Decorative Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-96 h-96 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-96 h-96 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
        
        {/* Science Pattern Overlay */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0 bg-repeat" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }}></div>
        </div>
      </div>

      {/* Main Form Card */}
      <div className={`relative bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl w-full max-w-md p-8 border border-blue-100 transition-all duration-700 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      }`}>
        <div className="absolute -top-6 left-1/2 -translate-x-1/2">
          <div className="w-12 h-12 bg-blue-600 rounded-xl rotate-45 flex items-center justify-center">
            <svg 
              className="-rotate-45 w-6 h-6 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" 
              />
            </svg>
          </div>
        </div>

        <h1 className="text-3xl font-bold text-center text-gray-800 mt-4 mb-8">Testga kirish</h1>
        
        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Ism (Исмингиз)
            </label>
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
            <label className="block text-sm font-medium text-gray-700">
              Familiya (Фамилиянгиз)
            </label>
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
            <label className="block text-sm font-medium text-gray-700">
              Yo'nalishni tanlang (Йўналишни танланг)
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors bg-white/50 backdrop-blur-sm"
              required
            >
              <option value="">Yo'nalishni tanlang</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>{category.name}</option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            className="w-full py-3 px-6 text-white font-medium bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transform transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl"
          >
            Boshlash
          </button>
        </form>

        {/* Decorative Bottom Pattern */}
        <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-b-2xl"></div>
      </div>
    </div>
  );
}

export default Login;
