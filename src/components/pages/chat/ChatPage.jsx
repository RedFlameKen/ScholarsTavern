import { useEffect, useRef, useState } from "react";
import NavBar from "../../nav_bar/NavBar";
import "../../../styles/ColorPalette.css";
import "./ChatPage.css";
import { useNavigate, useParams } from "react-router-dom";
import { buildUrl, checkAuth, GET, POST } from "../../../request/requester";
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
    const navigate = useNavigate();
    const { group_id } = useParams();
    const [groupName, setGroupName] = useState("");
    const [channels, setChannels] = useState([]);
    const socket = useRef(null)
    const { startCall, currentCall, endCall } = UseCall()

    // Control states for responsive slide-out menus
    const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Closed by default on mobile
    const [isMembersOpen, setIsMembersOpen] = useState(false); // Right side panel tracking hook
    const [kickSubject, setKickSubject] = useState(null);

    const [groupMembers, setGroupMembers] = useState([]);

    const cur_user_id = useRef(-1);
    const user_is_mod = useRef(false)
    const [activeChannel, setActiveChannel] = useState({ id: -1, name: "", type: "chat" });

    // TODO: add kick backend call
    function handleKickMember(member) {
        POST({
            endpoint: "/group/kick",
            body: {
                data: {
                    subject_id: member.id,
                    group_id: group_id,
                }
            },
            on_finish: (response) => {
                if (!response.success) {
                    console.log(`unable to kick the user ${response.message}`)
                    return;
                }

                setGroupMembers(prev => prev.filter(m => m.id !== member.id))
                setKickSubject(null)
            }
        })
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
                    navigate("/home")
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

                const members = response.data.members;

                user_is_mod.current = response.data.is_moderator

                setGroupMembers(members)

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
        const isActive = activeChannel.id === channel.id && activeChannel.type === channel.type;
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
                        <div key={member.id} className={`member-card ${member.isOnline ? "online" : "offline"}`}
                            onClick={() => {
                                if (!user_is_mod.current) {
                                    return
                                }
                                setKickSubject(member)
                            }}
                        >
                            <div className="member-avatar-wrapper">
                                    <img src={`${buildUrl()}/user/pfp/${member.id}`} alt={`${member.first_name} ${member.last_name}`} className="member-pfp" />
                            </div>
                            <div className="member-details">
                                <span className="member-name">{`${member.first_name} ${member.last_name}`}</span>
                                <span className="member-role">{member.is_moderator ?
                                    "Admin" : "Member"
                                }</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {kickSubject && (
                <div id="kick_member_overlay" onClick={() => {}}>
                    <div id="kick_member_content" onClick={(e) => e.stopPropagation()}>
                        <h2 id="kick_pfp_header">{`Are you sure you want to kick ${kickSubject.first_name} ${kickSubject.last_name}?`}</h2>
                        <button
                            id="kick_member_button"
                            onClick={() => {handleKickMember(kickSubject)}}
                        >
                            Kick User
                        </button>
                        <a 
                            className="cancel_prompt_btn"
                            onClick={() => setKickSubject(null)}>
                            Cancel
                        </a>
                    </div>
                </div>
            )}

        </div>
    );
}

export default ChatPage;
