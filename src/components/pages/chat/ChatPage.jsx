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
    const socket = useRef(null)
    const { startCall, currentCall, endCall } = UseCall()

    // Control states for responsive slide-out menus
    const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Closed by default on mobile
    const [isMembersOpen, setIsMembersOpen] = useState(false); // Right side panel tracking hook

    const [groupMembers, setGroupMembers] = useState([
        { id: 1, name: "Alex Mercer", role: "Admin", isOnline: true, pfp: null },
        { id: 2, name: "Beatrix_99", role: "Member", isOnline: true, pfp: null },
        { id: 3, name: "CodeMonkey", role: "Member", isOnline: false, pfp: null },
    ]);

    const cur_user_id = useRef(-1);
    const [activeChannel, setActiveChannel] = useState({ id: -1, name: "", type: "chat" });

    function handleKickMember(memberId, name) {
        const confirmKick = window.confirm(`Are you sure you want to kick ${name} from the group?`);
        if (confirmKick) {
            console.log(`UI Trigger: Request backend to kick user ID ${memberId}`);
        }
    }

    function setCurrentChannel(channel) {
        if (currentCall) {
            if (currentCall.id === channel.id && currentCall.type === channel.type) return;
            if (currentCall) endCall();
        }
        setActiveChannel(channel);
        setIsSidebarOpen(false); // Close sidebar drawer layout automatically on choice (mobile convenience)

        if (channel.type === ChannelType.VOICE) {
            startCall({ group_id: group_id, channel: channel })
        }
    }

    useEffect(() => {
        async function initUserId() {
            const result = await checkAuth({});
            if (!result.success) return;
            cur_user_id.current = parseInt(result.data.user_id);
        }
        initUserId();

        GET({
            endpoint: `/group/${group_id}`,
            on_finish: (response) => {
                if (!response.success) return;
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

    function createChannelItemIcon(type) {
        let icon = type === ChannelType.VOICE ? voiceIcon : tagIcon;
        return (
            <div className="channel-item-icon">
                <img src={icon} alt="" />
            </div>
        );
    }

    function createChannelItem(channel) {
        return (
            <div
                key={channel.id}
                className={`channel-item ${activeChannel.id === channel.id && activeChannel.type === channel.type ? "active" : ""}`}
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
                <div className="channel-group">{channelGroup.name}</div>
                {channelGroup.channels.map(channel => createChannelItem(channel))}
            </div>
        );
    }

    return (
        <div id="chat_page" className={`
            ${isSidebarOpen ? "sidebar-mobile-visible" : "sidebar-mobile-hidden"}
            ${isMembersOpen ? "members-mobile-visible" : "members-mobile-hidden"}
        `}>
            <NavBar />

            {/* Left Drawer Trigger Button */}
            <button
                type="button"
                className="mobile-menu-toggle left-toggle"
                onClick={() => {
                    setIsSidebarOpen(!isSidebarOpen);
                    if (isMembersOpen) setIsMembersOpen(false); // Auto close opposite drawer panel
                }}
                aria-label="Toggle channels layout menu"
            >
                {isSidebarOpen ? "✕" : "☰"}
            </button>

            {/* Right Drawer Trigger Button */}
            <button
                type="button"
                className="mobile-menu-toggle right-toggle"
                onClick={() => {
                    setIsMembersOpen(!isMembersOpen);
                    if (isSidebarOpen) setIsSidebarOpen(false); // Auto close opposite drawer panel
                }}
                aria-label="Toggle group members list view profile layout"
            >
                {isMembersOpen ? "✕" : "👥"}
            </button>

            {/* Backdrop Dim overlay for small displays when any side navigation pane view opens up */}
            {(isSidebarOpen || isMembersOpen) && (
                <div className="mobile-backdrop-blur" onClick={() => {
                    setIsSidebarOpen(false);
                    setIsMembersOpen(false);
                }} />
            )}

            {/* Left Channel Sidebar */}
            <div id="channels_section">
                <h3 className="channels-header">{groupName}</h3>
                <div className="channels-list">
                    {channels.map((channel) => createChannelGroup(channel))}
                </div>
            </div>

            {/* Central Window Layout View Workspace */}
            <div id="main_section">
                {activeChannel.type === ChannelType.VOICE ?
                    <CallView group_id={group_id} cur_user_id={cur_user_id} channel={activeChannel} sock={socket} /> :
                    <ChatView cur_user_id={cur_user_id} channel={activeChannel} chatSocket={socket} />
                }
            </div>

            {/* Right Group Members Sidebar Panel */}
            <div id="members_section">
                <h4 className="members-header">Members — {groupMembers.length}</h4>
                <div className="members-list">
                    {groupMembers.map((member) => (
                        <div key={member.id} className={`member-card ${member.isOnline ? "online" : "offline"}`}>
                            <div className="member-avatar-wrapper">
                                {member.pfp ? (
                                    <img src={member.pfp} alt={member.name} className="member-pfp" />
                                ) : (
                                    <div className="member-pfp-placeholder">
                                        {member.name.charAt(0).toUpperCase()}
                                    </div>
                                )}
                                <span className="status-indicator"></span>
                            </div>
                            <div className="member-details">
                                <span className="member-name">{member.name}</span>
                                <span className="member-role">{member.role}</span>
                            </div>
                            <button
                                type="button"
                                className="member-kick-btn"
                                onClick={() => handleKickMember(member.id, member.name)}
                                title={`Kick ${member.name}`}
                            >
                                ✕
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default ChatPage;