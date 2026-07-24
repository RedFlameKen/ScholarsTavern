import { useEffect, useRef, useState } from "react";
import { DEFAULT_SERVER_DOMAIN, WEBSOCKET_PROTOCOL } from "../../../request/requester";

const ChannelType = {
    CHAT: "chat",
    VOICE: "voice",
};

function ChatView({ cur_user_id, channel, chatSocket }) {
    const [chats, setChats] = useState([]);
    const [inputMessage, setInputMessage] = useState("");
    const messagesRef = useRef(null);
    const scrollRef = useRef(null);

    
    const channelRef = useRef(channel);

    
    useEffect(() => {
        channelRef.current = channel;
    }, [channel]);

    const handleSendMessage = (e) => {
        e.preventDefault();
        if (!inputMessage.trim()) return;

        
        if (!chatSocket.current || chatSocket.current.readyState !== WebSocket.OPEN) {
            console.warn("Unable to send message: WebSocket connection is not open yet.");
            return;
        }

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
        const container = messagesRef.current;
        if (!container) return;

        
        requestAnimationFrame(() => {
            const isNearBottom =
                container.scrollHeight -
                container.scrollTop -
                container.clientHeight < 150;

            if (isNearBottom && scrollRef.current) {
                scrollRef.current.scrollIntoView({ behavior: "smooth" });
            }
        });
    }, [chats]);

    
    useEffect(() => {
        if (channel.id === -1) return;

        const wsUrl = `${WEBSOCKET_PROTOCOL}${DEFAULT_SERVER_DOMAIN}/chat/${channel.id}`;
        const socketInstance = new WebSocket(wsUrl);
        chatSocket.current = socketInstance;

        socketInstance.onmessage = async (ev) => {
            if (!ev.data) return;

            try {
                const data = JSON.parse(ev.data);

                
                if (channelRef.current.type !== ChannelType.CHAT) return;

                switch (data.type) {
                    case "load_chats":
                        setChats(data.chats);
                        
                        requestAnimationFrame(() => {
                            if (scrollRef.current) scrollRef.current.scrollIntoView();
                        });
                        break;
                    case "message_sent":
                        setChats(prev => [...prev, data.data]);
                        break;
                    default:
                        break;
                }
            } catch (err) {
                console.error("Failed to process message payload package:", err);
            }
        };

        
        setChats([]);

        return () => {
            if (socketInstance.readyState === WebSocket.OPEN || socketInstance.readyState === WebSocket.CONNECTING) {
                socketInstance.close();
            }
            if (chatSocket.current === socketInstance) {
                chatSocket.current = null;
            }
        };
    }, [channel.id, chatSocket]);

    function createMessageBubble(chat) {
        const isOwnMessage = chat.sender_id === cur_user_id.current;
        return (
            <div key={chat.id} className={isOwnMessage ? "own-message-bubble" : "message-bubble"}>
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
        <>
            <div className="chat-room-header">
                <h2>{channel.name}</h2>
            </div>

            <div ref={messagesRef} className="messages-log">
                {chats.map((msg) => createMessageBubble(msg))}
                <div ref={scrollRef} />
            </div>

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
    );
}

export default ChatView;