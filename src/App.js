import { BrowserRouter, Routes, Route } from "react-router-dom"
import './App.css';
import ChatPage from './components/pages/chat/ChatPage';
import CallPage from './components/pages/call/CallPage';
import HomePage from './components/pages/home/HomePage';
import AccountProfilePage from './components/pages/account_profile/AccountProfilePage';
import LoginPage from './components/pages/login/LoginPage';
import SignupPage from './components/pages/signup/SignupPage';
import LandingPage from "./components/pages/landing_page/LandingPage";
import SearchPage from "./components/pages/search/SearchPage";

function App() {
  return (
      <BrowserRouter>
        <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/home" element={<HomePage />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/chat/:group_id" element={<ChatPage />} />
            <Route path="/call" element={<CallPage />} />
            <Route path="/profile" element={<AccountProfilePage />} />
            <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        
        </Routes>
      </BrowserRouter>
  );
}

export default App;
