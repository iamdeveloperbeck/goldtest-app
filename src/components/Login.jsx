import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../data/firebase';
import { collection, getDocs, addDoc } from 'firebase/firestore';

function Login() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [categories, setCategories] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchCategories();
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
    <div className='w-full h-screen flex items-center justify-center'>
      <div className='border p-[30px_60px] rounded-[20px]'>
        <h1 className='text-4xl font-bold mb-4'>Testga kirish</h1>
        <form onSubmit={handleLogin} className='text-center'>
          <div className='mb-4 text-left'>
            <label className='block text-sm font-medium text-gray-700'>Ism(Исмингиз)</label>
            <input
              type='text'
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder='Ismingizni kiriting'
              className='bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5'
            />
          </div>
          <div className='mb-4 text-left'>
            <label className='block text-sm font-medium text-gray-700'>Familiya(Фамилиянгиз)</label>
            <input
              type='text'
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className='bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5'
              placeholder='Familiyangizni kiriting'
            />
          </div>
          <div className='mb-4 text-left'>
            <label className='block text-sm font-medium text-gray-700'>Yo'nalishni tanlang(Йўналишни танланг):</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className='bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5'
            >
              <option value=''>Yo'nalishni tanlang</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>{category.name}</option>
              ))}
            </select>
          </div>
          <button type='submit' className='text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 focus:outline-none'>Boshlash</button>
        </form>
      </div>
    </div>
  );
}

export default Login;
