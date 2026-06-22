import { BrowserRouter, Routes, Route } from "react-router-dom"
import './App.css';
import ChatPage from './components/pages/chat/ChatPage';
import CallPage from './components/pages/call/CallPage';
import HomePage from './components/pages/home/HomePage';
import AccountProfilePage from './components/pages/account_profile/AccountProfilePage';
import LoginPage from './components/pages/login/LoginPage';
import SignupPage from './components/pages/signup/SignupPage';

function App() {
  return (
      <BrowserRouter>
        <Routes>
            <Route path="/" element={<LoginPage />} />
            <Route path="/home" element={<HomePage />} />
            <Route path="/chat" element={<ChatPage />} />
            <Route path="/call" element={<CallPage />} />
            <Route path="/profile" element={<AccountProfilePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
        </Routes>
      </BrowserRouter>
  );
}

export default App;
