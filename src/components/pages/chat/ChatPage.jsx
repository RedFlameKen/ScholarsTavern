import { useEffect, useRef, useState } from "react";
import NavBar from "../../nav_bar/NavBar";
import "../../../styles/ColorPalette.css";
import "./ChatPage.css";
import { useParams } from "react-router-dom";
import { checkAuth, GET, DEFAULT_SERVER_DOMAIN, WEBSOCKET_PROTOCOL } from "../../../request/requester";
import voiceIcon from "../../../assets/icons/Voice.svg"
import tagIcon from "../../../assets/icons/Tag.svg"

const ChannelType = {
    CHAT: "chat",
    VOICE: "voice",
}

// TODO: create a system to open the correct group
function ChatPage() {
    const { group_id } = useParams()
    const [groupName, setGroupName] = useState("")
    const [channels, setChannels] = useState([])
    const chatSocket = useRef(null)

    const cur_user_id = useRef(-1)

    const [activeChannel, setActiveChannel] = useState({ id: 0, name: "", type: ChannelType.CHAT });


    const [chats, setChats] = useState([]);
    const [inputMessage, setInputMessage] = useState("");

    useEffect(() => {
        GET({
            endpoint: `/group/${group_id}`,
            on_finish: (response) => {
                if (!response.success) {
                    console.log(`unable to get channels: ${response.message}`)
                    return
                }

                setGroupName(response.data.group_name)

                const channelGroups = response.data.channel_groups

                let newChannels = []
                for (const channel_group of channelGroups) {
                    newChannels = [...newChannels, channel_group]
                }

                setChannels(newChannels)

                setCurrentChannel(newChannels[0].channels[0])
            }
        })

        async function initUserId() {
            const result = await checkAuth({})
            if (!result.success)
                return
            cur_user_id.current = parseInt(result.data.user_id)
        }

        initUserId()

    }, [group_id])

    function setCurrentChannel(channel) {
        setActiveChannel(channel)

        setChats([])

        if (chatSocket.current)
            chatSocket.current.close()

        chatSocket.current = new WebSocket(`${WEBSOCKET_PROTOCOL}${DEFAULT_SERVER_DOMAIN}/chat/${channel.id}`)

        chatSocket.current.onmessage = async (ev) => {
            if (ev.data === null)
                return;

            const data = JSON.parse(ev.data)

            switch (data.type) {
                case "load_chats":
                    if (channel.type != ChannelType.CHAT) break;
                    setChats(data.chats)
                    break;
                case "message_sent":
                    if (channel.type != ChannelType.CHAT) break;
                    setChats(prev => [
                        ...prev, data.data
                    ])
                    break;
            }

        }

    }

    const handleSendMessage = (e) => {
        e.preventDefault();
        if (!inputMessage.trim()) return;

        chatSocket.current.send(JSON.stringify({
            type: "message_sent",
            chat: {
                type: "text",
                sender: cur_user_id.current,
                text: inputMessage,
                chat_channel_id: activeChannel.id
            }
        }))
        setInputMessage("");
    };

    function createChannelItemIcon(type) {
        let icon;
        switch (type) {
            default:
            case ChannelType.CHAT:
                icon = tagIcon;
                break;
            case ChannelType.VOICE:
                icon = voiceIcon;
                break;
        }

        return (
            <div className="channel-item-icon">
                <img src={icon} />
            </div>
        )
    }

    function createChannelItem(channel) {
        return (
            <div
                key={channel.id}
                className={`channel-item ${activeChannel.id === channel.id &&
                        activeChannel.type === channel.type ? "active" : ""}`}
                onClick={() => setCurrentChannel(channel)}
            >
                {createChannelItemIcon(channel.type)}
                <span className="channel-item-label">{channel.name}</span>
            </div>
        )
    }

    function createChannelGroup(channelGroup) {
        return (
            <div key={channelGroup.id} className="channel-group-wrapper">
                <div className={`channel-group`}>
                    {channelGroup.name}
                </div>
                {channelGroup.channels.map(channel => (
                    createChannelItem(channel)
                ))
                }
            </div>
        )
    }

    function createMessageBubble(chat) {
        return (
            <div key={chat.id} className="message-bubble">
                <div className="message-meta">
                    <span className="message-sender">{chat.sender}</span>
                    <span className="message-time">{new Date(chat.time).toLocaleDateString([], {
                        hour: "numeric",
                        minute: "2-digit"
                    })}</span>
                </div>
                <p className="message-text">{chat.text}</p>
            </div>
        )
    }

    return (
        <div id="chat_page">
            <NavBar />

            {/* Sidebar: Tavern Channels */}
            <div id="channels_section">
                <h3 className="channels-header">{groupName}</h3>
                <div className="channels-list">
                    {channels.map((channel) => {
                        return createChannelGroup(channel)
                    })}
                </div>
            </div>

            {/* Main Area: Chat Room Logs */}
            <div id="main_section">
                <div className="chat-room-header">
                    <h2>{activeChannel.name}</h2>
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
                        placeholder={`Message ${activeChannel.name}...`}
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
