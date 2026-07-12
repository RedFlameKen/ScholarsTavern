import { useEffect, useState } from "react";
import NavBar from "../../nav_bar/NavBar";
import "../../../styles/ColorPalette.css";
import "./ChatPage.css";
import { useParams } from "react-router-dom";
import { GET } from "../../../request/requester";
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

    // Mock data for tavern channels
    // const [channels] = useState(["# general-lounge", "# research-hall", "# trade-post", "# rumors-board"]);
    const [activeChannel, setActiveChannel] = useState({ id: 0, name: "", type: ChannelType.CHAT });

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

                setActiveChannel(newChannels[0].channels[0])
            }
        })

    }, [])

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
                className={`channel-item ${
                    activeChannel.id === channel.id &&
                    activeChannel.type == channel.type ? "active" : ""}`}
                onClick={() => setActiveChannel(channel)}
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
