import { useEffect, useState } from "react";
import { DEFAULT_SERVER_DOMAIN, WEBSOCKET_PROTOCOL } from "../../../request/requester";

const ChannelType = {
    CHAT: "chat",
    VOICE: "voice",
};

function ChatView({ cur_user_id, channel, chatSocket }) {
    const [chats, setChats] = useState([]);
    const [inputMessage, setInputMessage] = useState("");

    const handleSendMessage = (e) => {
        e.preventDefault();
        if (!inputMessage.trim()) return;

        chatSocket.current.send(JSON.stringify({
            type: "message_sent",
            chat: {
                type: "text",
                sender: cur_user_id.current,
                text: inputMessage,
                chat_channel_id: channel.id
            }
        }));
        setInputMessage("");
    };

    useEffect(() => {
        chatSocket.current = new WebSocket(`${WEBSOCKET_PROTOCOL}${DEFAULT_SERVER_DOMAIN}/chat/${channel.id}`);

        chatSocket.current.onmessage = async (ev) => {
            if (ev.data === null) return;

            const data = JSON.parse(ev.data);

            switch (data.type) {
                case "load_chats":
                    if (channel.type !== ChannelType.CHAT) break;
                    setChats(data.chats)
                    break;
                case "message_sent":
                    if (channel.type !== ChannelType.CHAT) break;
                    setChats(prev => [
                        ...prev, data.data
                    ])
                    break;
                default:
                    break;
            }
        };

        setChats([]);

        return () => {
            if (chatSocket.current) {
                chatSocket.current.close()
            }
        }
    }, [channel.id, channel.type, chatSocket])

    function createMessageBubble(chat) {
        return (
            <div key={chat.id} className="message-bubble">
                <div className="message-meta">
                    <span className="message-sender">{chat.sender}</span>
                    <span className="message-time">
                        {new Date(chat.time).toLocaleTimeString([], {
                            hour: "numeric",
                            minute: "2-digit"
                        })}
                    </span>
                </div>
                <p className="message-text">{chat.text}</p>
            </div>
        );
    }

    return (
        /* --- 2. TEXT CHAT VIEW --- */
        <>
            <div className="chat-room-header">
                <h2>{channel.name}</h2>
            </div>

            <div className="messages-log">
                {chats.map((msg) => (
                    createMessageBubble(msg)
                ))}
            </div>

            {/* Message Input Box */}
            <form className="chat-input-area" onSubmit={handleSendMessage}>
                <input
                    type="text"
                    placeholder={`Message ${channel.name}...`}
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    className="chat-field"
                />
                <button type="submit" className="chat-send-btn">Send</button>
            </form>
        </>
    )
}

export default ChatView;
