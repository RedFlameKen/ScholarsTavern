import { useEffect, useRef, useState } from "react";
import NavBar from "../../nav_bar/NavBar";
import "../../../styles/ColorPalette.css";
import "./ChatPage.css";
import { useParams } from "react-router-dom";
import { checkAuth, GET } from "../../../request/requester";
import voiceIcon from "../../../assets/icons/Voice.svg";
import tagIcon from "../../../assets/icons/Tag.svg";
import ChatView from "./ChatView";
import CallView from "./CallView";
import { useCall as UseCall } from "../../../call/CallProvider";

const ChannelType = {
    CHAT: "chat",
    VOICE: "voice",
};

function ChatPage() {
    const { group_id } = useParams();
    const [groupName, setGroupName] = useState("");
    const [channels, setChannels] = useState([]);

    // Independent socket refs prevent connection race conditions between views
    const chatSocket = useRef(null);
    const voiceSocket = useRef(null);

    const { startCall, currentCall, endCall } = UseCall();
    const cur_user_id = useRef(-1);

    const [activeChannel, setActiveChannel] = useState({ id: -1, name: "", type: "chat" });

    // NEW: Mobile UI sidebar drawer tracking flag
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    function setCurrentChannel(channel) {
        if (currentCall) {
            if (currentCall.id === channel.id && currentCall.type === channel.type) {
                // Close sidebar on mobile even if selecting the already active channel
                setIsSidebarOpen(false);
                return;
            }
            endCall();
        }

        setActiveChannel(channel);
        // Automatically hide the side menu drawer on smaller device profiles once an option is selected
        setIsSidebarOpen(false);

        switch (channel.type) {
            case ChannelType.CHAT:
                break;
            default:
            case ChannelType.VOICE:
                startCall({ group_id: group_id, channel: channel });
                break;
        }
    }

    // 1. Authentication hook: Runs exactly once on component mount
    useEffect(() => {
        async function initUserId() {
            try {
                const result = await checkAuth({});
                if (!result || !result.success) {
                    console.warn("User authentication failed or returned unsuccessful.");
                    return;
                }
                cur_user_id.current = parseInt(result.data.user_id);
            } catch (error) {
                console.error("Network connection error during checkAuth initialization:", error);
            }
        }

        initUserId();
    }, []);

    // 2. Main data fetching hook: Runs when group_id updates, preventing infinite render loops
    useEffect(() => {
        GET({
            endpoint: `/group/${group_id}`,
            on_finish: (response) => {
                if (!response.success) {
                    console.log(`unable to get channels: ${response.message}`);
                    return;
                }

                setGroupName(response.data.group_name);
                const channelGroups = response.data.channel_groups;

                let newChannels = [];
                for (const channel_group of channelGroups) {
                    newChannels = [...newChannels, channel_group];
                }

                setChannels(newChannels);

                if (newChannels[0] && newChannels[0].channels[0]) {
                    setActiveChannel(newChannels[0].channels[0]);
                }
            }
        });
    }, [group_id]);

    // 3. Clean up active calls when user leaves the chat page entirely
    useEffect(() => {
        return () => {
            endCall();
        };
    }, [endCall]);

    function createChannelItemIcon(type) {
        let icon = type === ChannelType.VOICE ? voiceIcon : tagIcon;
        return (
            <div className="channel-item-icon">
                <img src={icon} alt="" />
            </div>
        );
    }

    function createChannelItem(channel) {
        const isActive = activeChannel.id === channel.id && activeChannel.type === channel.type;
        return (
            <div
                key={channel.id}
                className={`channel-item ${isActive ? "active" : ""}`}
                onClick={() => setCurrentChannel(channel)}
            >
                {createChannelItemIcon(channel.type)}
                <span className="channel-item-label">{channel.name}</span>
            </div>
        );
    }

    function createChannelGroup(channelGroup) {
        return (
            <div key={channelGroup.id} className="channel-group-wrapper">
                <div className="channel-group">
                    {channelGroup.name}
                </div>
                {channelGroup.channels.map(channel => createChannelItem(channel))}
            </div>
        );
    }

    return (
        // Dynamic template literal class handles injected viewport state cleanly for styling logic
        <div id="chat_page" className={isSidebarOpen ? "sidebar-mobile-visible" : "sidebar-mobile-hidden"}>
            <NavBar />

            {/* Mobile Menu Action Toggle Button Overlay */}
            <button
                type="button"
                className="mobile-menu-toggle"
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                aria-label="Toggle channels navigation drawer menu"
            >
                {isSidebarOpen ? "✕" : "☰"}
            </button>

            {/* Sidebar View Pane */}
            <div id="channels_section">
                <h3 className="channels-header">{groupName}</h3>
                <div className="channels-list">
                    {channels.map((channel) => createChannelGroup(channel))}
                </div>
            </div>

            {/* Main Center Content Grid Display Panel */}
            <div id="main_section">
                {activeChannel.type === ChannelType.VOICE ? (
                    <CallView
                        group_id={group_id}
                        cur_user_id={cur_user_id}
                        channel={activeChannel}
                        sock={voiceSocket}
                    />
                ) : (
                    <ChatView
                        cur_user_id={cur_user_id}
                        channel={activeChannel}
                        chatSocket={chatSocket}
                    />
                )}
            </div>
        </div>
    );
}

export default ChatPage;