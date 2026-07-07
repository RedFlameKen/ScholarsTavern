import { useState } from "react";
import NavBar from "../../nav_bar/NavBar";
import "../../../styles/ColorPalette.css";
import "./ChatPage.css";

function ChatPage() {
    // Mock data for tavern channels
    const [channels] = useState(["# general-lounge", "# research-hall", "# trade-post", "# rumors-board"]);
    const [activeChannel, setActiveChannel] = useState("# general-lounge");

    // Mock data for messages
    const [messages, setMessages] = useState([
        { id: 1, sender: "Alchemist_John", text: "Has anyone managed to fix that webpack background image bug yet?", time: "4:32 PM" },
        { id: 2, sender: "WizardCSS", text: "Aye, just use an absolute URL or download it locally into your assets folder!", time: "4:34 PM" }
    ]);
    const [inputMessage, setInputMessage] = useState("");

    const handleSendMessage = (e) => {
        e.preventDefault();
        if (!inputMessage.trim()) return;

        const newMsg = {
            id: messages.length + 1,
            sender: "You", // Temporary fallback sender name
            text: inputMessage,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        setMessages([...messages, newMsg]);
        setInputMessage("");
    };

    return (
        <div id="chat_page">
            <NavBar />

            {/* Sidebar: Tavern Channels */}
            <div id="channels_section">
                <h3 className="channels-header">Tavern Rooms</h3>
                <div className="channels-list">
                    {channels.map((channel) => (
                        <div
                            key={channel}
                            className={`channel-item ${activeChannel === channel ? "active" : ""}`}
                            onClick={() => setActiveChannel(channel)}
                        >
                            {channel}
                        </div>
                    ))}
                </div>
            </div>

            {/* Main Area: Chat Room Logs */}
            <div id="main_section">
                <div className="chat-room-header">
                    <h2>{activeChannel}</h2>
                </div>

                <div className="messages-log">
                    {messages.map((msg) => (
                        <div key={msg.id} className="message-bubble">
                            <div className="message-meta">
                                <span className="message-sender">{msg.sender}</span>
                                <span className="message-time">{msg.time}</span>
                            </div>
                            <p className="message-text">{msg.text}</p>
                        </div>
                    ))}
                </div>

                {/* Message Input Box */}
                <form className="chat-input-area" onSubmit={handleSendMessage}>
                    <input
                        type="text"
                        placeholder={`Message ${activeChannel}...`}
                        value={inputMessage}
                        onChange={(e) => setInputMessage(e.target.value)}
                        className="chat-field"
                    />
                    <button type="submit" className="chat-send-btn">Send</button>
                </form>
            </div>
        </div>
    )
}

export default ChatPage;