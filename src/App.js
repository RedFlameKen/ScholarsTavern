import { BrowserRouter, Routes, Route } from "react-router-dom"
import './App.css';
import ChatPage from './components/pages/chat/ChatPage';
import CallPage from './components/pages/call/CallPage';
import LoginPage from './components/pages/login/LoginPage';

// const sock = new WebSocket('ws://localhost:8000/chat/')
//
// sock.onopen = function() {
//     console.log('websocket connection established, bruh')
//
//     const message = {
//         'message': 'I\'ve connected'
//     };
//
//     sock.send(JSON.stringify(message))
// }
//
// sock.onmessage = function(response) {
//     const message = JSON.parse(response.data)
//     console.log(`message received: ${message['message']}`)
// }
//
// function send_message(message){
//     var message_json = {
//         'message': message
//     }
//     sock.send(JSON.stringify(message_json))
// }


function App() {
  return (
      <BrowserRouter>
        <Routes>
            <Route path="/" element={<LoginPage />} />
            <Route path="/chat" element={<ChatPage />} />
            <Route path="/call" element={<CallPage />} />
            <Route path="/login" element={<LoginPage />} />
        </Routes>
      </BrowserRouter>
  );
}

export default App;
