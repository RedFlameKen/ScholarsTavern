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

    const cur_user_id = useRef(-1);

    const [activeChannel, setActiveChannel] = useState({ id: -1, name: "", type: "chat" });

    function setCurrentChannel(channel) {
        if (currentCall){
            if (currentCall.id === channel.id &&
                currentCall.type === channel.type) {
                return
            }
            if (currentCall) {
                endCall()
            }
        }
        setActiveChannel(channel);

        switch (channel.type) {
            case ChannelType.CHAT:
                break;
            default:
            case ChannelType.VOICE:
                startCall({group_id: group_id, channel: channel})
                break;
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
                <img src={icon} alt="" />
            </div>
        );
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
        );
    }

    function createChannelGroup(channelGroup) {
        return (
            <div key={channelGroup.id} className="channel-group-wrapper">
                <div className={`channel-group`}>
                    {channelGroup.name}
                </div>
                {channelGroup.channels.map(channel => (
                    createChannelItem(channel)
                ))}
            </div>
        );
    }

    return (
        <div id="chat_page">
            <NavBar />

            {/* Sidebar: Tavern Channels */}
            <div id="channels_section">
                <h3 className="channels-header">{groupName}</h3>
                <div className="channels-list">
                    {channels.map((channel) => (
                        createChannelGroup(channel)
                    ))}
                </div>
            </div>

            {/* Main Area Content Panel */}
            <div id="main_section">
                {activeChannel.type === ChannelType.VOICE ? 
                    <CallView 
                        group_id={group_id}
                        cur_user_id={cur_user_id}
                        channel={activeChannel}
                        sock={socket}
                    /> :
                    <ChatView
                        cur_user_id={cur_user_id}
                        channel={activeChannel}
                        chatSocket={socket}
                    />
                }
            </div>
        </div>
    );
}

export default ChatPage;
