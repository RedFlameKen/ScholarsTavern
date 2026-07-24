import { useEffect, useRef, useState } from "react";
import VideoIcon from "../../../assets/icons/Video.svg"
import VideoOffIcon from "../../../assets/icons/VideoDisabled.svg"
import HeadphonesIcon from "../../../assets/icons/Headphones.svg"
import HeadphonesOffIcon from "../../../assets/icons/HeadphonesDisabled.svg"
import MicIcon from "../../../assets/icons/Mic.svg"
import MicOffIcon from "../../../assets/icons/MicDisabled.svg"
import CallEndIcon from "../../../assets/icons/CallEnd.svg"
import { useCall as UseCall } from "../../../call/CallProvider";

function CallView({ channel, group_id }) {
    const {
        peers,
        previewRef,
        remoteStreams,
        toggleMuted,
        isMuted,
        toggleDeafened,
        isDeafened,
        toggleVideo,
        videoDisabled,
        startCall,
        endCall,
        firstName,
        lastName,
        connected
    } = UseCall()

    const [leftCall, setLeftCall] = useState(false)
    
    function RemoteVideo({ stream, first_name, last_name }) {
        const ref = useRef(null)

        useEffect(() => {
            if (ref.current) {
                ref.current.srcObject = stream
            }
        }, [stream])

        return (
            <div className="grid-card">
                <div className="user-stream-placeholder">
                    <video
                        className="stream-video"
                        ref={ref}
                        autoPlay
                        playsInline
                        muted={isDeafened}
                    />
                    <span className="user-tag">{`${first_name} ${last_name}`}</span>
                </div>
            </div>
        )
    }

    function createLocalVideo() {
        return (
            <div className="grid-card">
                <div className="user-stream-placeholder">
                    <video
                        className={`stream-video ${videoDisabled ? "stream-video-disabled" : ""}`}
                        ref={previewRef}
                        autoPlay
                        playsInline
                        muted={true}
                    />
                    <span className="user-tag">{`${firstName} ${lastName}`}</span>
                </div>
            </div>
        )
    }

    function createRemoteVideo(id, stream) {
        const peer = peers.current.get(id)
        return (
            <RemoteVideo
                key={id}
                stream={stream}
                first_name={peer.first_name}
                last_name={peer.last_name}
            />
        )
    }

    return (
        /* --- 1. VOICE CALL VIEW --- */
        <div className="voice-call-container">
            {/* Header Bar */}
            <div className="voice-call-header">
                <h2 className="group-name">{channel.name}</h2>
                <div className="participant-badge-container">
                    <div className="overlap-avatars">
                        <span className="avatar-dot dot-1"></span>
                        <span className="avatar-dot dot-2"></span>
                        <span className="avatar-dot dot-3"></span>
                    </div>
                    <span className="participant-count">{[...remoteStreams].length + (connected ? 1 : 0)}</span>
                </div>
            </div>

            {connected ? 
                <div className="voice-view">

                    {/* Stream / Avatar Grid */}
                    <div className="voice-grid">
                        {createLocalVideo()}
                        {[...remoteStreams].map(([id, stream]) =>
                            createRemoteVideo(id, stream)
                        )}
                    </div>

                    {/* Controls Panel */}
                    <div className="voice-controls">
                        <button
                            className={`control-btn circle-btn ${videoDisabled ? "active-control" : ""}`}
                            onClick={() => {
                                toggleVideo()
                            }}
                        >
                            {videoDisabled ? (<img src={VideoOffIcon} alt="" />) : (<img src={VideoIcon} alt="" />)}
                        </button>
                        <button
                            className={`control-btn circle-btn ${isDeafened ? "active-control" : ""}`}
                            onClick={() => {
                                toggleDeafened()
                            }}
                        >
                            <img src={isDeafened ? HeadphonesOffIcon : HeadphonesIcon} alt="" />
                        </button>
                        <button className="control-btn hangup-btn" onClick={() => {
                                endCall()
                                setLeftCall(true)
                            }}>
                            <img src={CallEndIcon} alt="" />
                        </button>
                        <button
                            className={`control-btn circle-btn ${isMuted ? "active-control" : ""}`}
                            onClick={() => {
                                toggleMuted()
                            }}
                        >
                            <img src={isMuted ? MicOffIcon : MicIcon} alt="" />
                        </button>
                        <button className="control-btn circle-btn">⚙️</button>
                    </div>
                </div>
                : leftCall ?
            <div className="join-call-view">
                <div className="join-grid-box">
                    <h1 className="join-call-title">{channel.name}</h1>
                </div>
                <div className="join-grid-box">
                    <p className="join-call-subtitle">Join the call</p>
                </div>
                <div className="join-grid-box">
                    <button
                         className="join-call-join-button"
                        type="button"
                        onClick={() => {
                            startCall({ group_id: group_id, channel: channel })
                            setLeftCall(false)
                        }}
                    >Join Call</button>
                </div>
            </div>
                : 
                <div>
                </div>

            }
        </div>
    )
}

export default CallView;
