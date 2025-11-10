import { Route, Routes } from 'react-router-dom';
import './App.css';
import Login from './components/Login';
import QuizComponent from './components/QuizComponent';
import TestResult from './components/TestResult';

function App() {
  return (
    <>
      <Routes>
        <Route path='/' element={<Login />} />
        <Route path='/test' element={<QuizComponent />} />
        <Route path='/result' element={<TestResult />} />
      </Routes>
    </>
  );
}

export default App;
