import { useEffect, useRef, useState } from "react";
import { checkAuth, DEFAULT_SERVER_DOMAIN, WEBSOCKET_PROTOCOL } from "../../../request/requester";
import VideoIcon from "../../../assets/icons/Video.svg"
import VideoOffIcon from "../../../assets/icons/VideoDisabled.svg"
import HeadphonesIcon from "../../../assets/icons/Headphones.svg"
import HeadphonesOffIcon from "../../../assets/icons/HeadphonesDisabled.svg"
import MicIcon from "../../../assets/icons/Mic.svg"
import MicOffIcon from "../../../assets/icons/MicDisabled.svg"
import CallEndIcon from "../../../assets/icons/CallEnd.svg"

function CallView({ cur_user_id, channel, sock }) {
    // Voice panel controls
    const [isMuted, setIsMuted] = useState(false);
    const [isDeafened, setIsDeafened] = useState(false);
    const [videoDisabled, setVideoDisabled] = useState(true);

    const [remoteStreams, setRemoteStreams] = useState(new Map())
    const peers = useRef(new Map())
    const previewRef = useRef(null)
    const previewStreamRef = useRef(null)
    const audioRef = useRef(null)
    const videoRef = useRef(null)

    const [firstName, setFirstName] = useState("User")
    const [lastName, setLastName] = useState("User")

    function createPeer(user) {
        const peer = new RTCPeerConnection({
            iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
        })

        addLocalTracks(peer)

        peer.onicecandidate = (ev) => {
            if (ev.candidate) {
                if (sock.current && sock.current.readyState === 1) {
                    sock.current.send(JSON.stringify({
                        type: "ice-candidate",
                        to: user.id,
                        from: cur_user_id.current,
                        candidate: ev.candidate
                    }))
                }
            }
        }

        peer.ontrack = (ev) => {
            const stream = ev.streams[0]

            if (isDeafened) {
                stream.getAudioTracks().forEach(track => {
                    track.enabled = false;
                });
            }

            console.log(`adding remote stream of ${user}`)
            setRemoteStreams(prev => {
                const next = new Map(prev)
                next.set(user.id, stream)
                return next
            })
        }

        let peer_obj = {
            peer: peer,
            pendingCandidates: [],
            connected: false,
            first_name: user.first_name,
            last_name: user.last_name
        }
        peers.current.set(user.id, peer_obj)
        return peer_obj
    }

    function getPeer(user) {
        let peer = peers.current.get(user.id)
        if (!peer) {
            peer = createPeer(user)
        }
        return peer;
    }

    async function drainCandidateQueue(peer) {
        while (peer.pendingCandidates.length > 0) {
            const candidate = peer.pendingCandidates.shift()
            await peer.peer.addIceCandidate(
                new RTCIceCandidate(candidate)
            )
        }
    }

    function addLocalTracks(peer) {
        const call_stream = previewStreamRef.current
        if (call_stream) {
            call_stream.getTracks().forEach(track => {
                const alreadyAdded = peer.getSenders().some(
                    sender => sender.track === track
                );

                if (!alreadyAdded) {
                    peer.addTrack(track, call_stream);
                }
            })
        }
    }

    async function handleExistingUsers(data) {
        const existing_users = data.users

        for (const user of existing_users) {
            if (user.id === cur_user_id.current) {
                continue
            }
            const peer = getPeer(user).peer

            const offer = await peer.createOffer();
            await peer.setLocalDescription(offer);

            if (sock.current && sock.current.readyState === 1) {
                sock.current.send(JSON.stringify({
                    type: "offer",
                    to: user.id,
                    from: cur_user_id.current,
                    offer
                }))
            }
        };
    }

    function handleUserLeft(data) {
        const user_id = data.user_id
        setRemoteStreams(prev => {
            const next = new Map(prev)
            next.delete(user_id)
            return next
        })

        const peer = peers.current.get(user_id)
        if (peer) {
            peer.peer.close()
            peers.current.delete(user_id)
        }
    }

    // received request from new user
    async function handleOffer(data) {
        const peer_obj = getPeer(data.user)
        const peer = peer_obj.peer
        await peer.setRemoteDescription(new RTCSessionDescription(data.offer));

        const answer = await peer.createAnswer();
        await peer.setLocalDescription(answer);

        sock.current.send(JSON.stringify({
            type: "answer",
            to: data.from,
            answer
        }))
        await drainCandidateQueue(peer_obj)

    }

    // called by the newly joined user
    async function handleAnswer(data) {
        const peer = getPeer(data.user)
        if (peer.peer.signalingState === "have-local-offer" && !peer.connected) {
            peer.connected = true
            await peer.peer.setRemoteDescription(
                new RTCSessionDescription(data.answer)
            )
        }
        await drainCandidateQueue(peer)
    }

    async function handleIceCandidate(data) {
        if (data.to !== cur_user_id.current) {
            return
        }

        const peer = getPeer(data.user)
        if (!peer.peer.remoteDescription) {
            peer.pendingCandidates.push(data.candidate)
            return
        }

        try {
            await peer.peer.addIceCandidate(
                new RTCIceCandidate(data.candidate)
            )
        } catch (error) {
            peer.pendingCandidates.push(data.candidate)
        }
    }

    async function startCall() {
        const result = await checkAuth({})
        if (!result.success)
            return
        cur_user_id.current = parseInt(result.data.user_id)
        setFirstName(result.data.first_name)
        setLastName(result.data.last_name)

        const call_stream = await navigator.mediaDevices.getUserMedia({
            audio: true,
            video: true,
        });

        previewStreamRef.current = call_stream

        if (previewRef.current) {
            previewRef.current.srcObject = call_stream
            previewRef.current.onloadedmetadata = () => {
                previewRef.current.play()
            }
        }

        audioRef.current = call_stream.getAudioTracks()[0]
        videoRef.current = call_stream.getVideoTracks()[0]
        videoRef.current.enabled = false

        sock.current = new WebSocket(`${WEBSOCKET_PROTOCOL}${DEFAULT_SERVER_DOMAIN}/call/`)

        sock.current.onmessage = async (ev) => {
            if (ev.data === null)
                return;

            const data = JSON.parse(ev.data)

            switch (data.type) {
                case "existing_users":
                    await handleExistingUsers(data)
                    break;
                case "user_left":
                    handleUserLeft(data)
                    break;
                case "offer":
                    await handleOffer(data)
                    break;
                case "answer":
                    await handleAnswer(data)
                    break;
                case "ice-candidate":
                    await handleIceCandidate(data)
                    break;
                default:
                    break;
            }

        }
    }

    useEffect(() => {
        startCall()
        return () => {
            if (sock.current) {
                sock.current.close()
            }
        }
    }, [sock])

    function setDeafened(deafened) {
        remoteStreams.forEach(stream => {
            stream.getAudioTracks().forEach(track => {
                track.enabled = !deafened;
            });
        });
    }

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

    // Exit voice room button (returns to the first chat room)
    const handleDisconnectVoice = () => {
        // TODO: close streams and peers
        setRemoteStreams([])

        for (const peer_obj of peers.current.values()) {
            peer_obj.peer.close()
        }

        peers.current.clear();

        if (previewStreamRef.current) {
            previewStreamRef.current.getVideoTracks().forEach(track => track.stop())
            previewStreamRef.current.getAudioTracks().forEach(track => track.stop())
            previewStreamRef.current = null
        }

        if (previewRef.current) {
            previewRef.current.srcObject = null
        }

        sock.current.close()
        sock.current = null;

    };

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
                    <span className="participant-count">6</span>
                </div>
            </div>

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
                        setVideoDisabled(!videoDisabled)
                        if (videoRef.current) {
                            videoRef.current.enabled = videoDisabled
                        }
                    }}
                >
                {videoDisabled ? (<img src={VideoOffIcon} alt=""/>) : (<img src={VideoIcon} alt=""/>)}
                </button>
                <button
                    className={`control-btn circle-btn ${isDeafened ? "active-control" : ""}`}
                    onClick={() => {
                        setIsDeafened(!isDeafened)
                        setDeafened(!isDeafened)
                    }}
                >
                    <img src={isDeafened ? HeadphonesOffIcon : HeadphonesIcon} alt=""/>
                </button>
                <button className="control-btn hangup-btn" onClick={handleDisconnectVoice}>
                    <img src={CallEndIcon} alt=""/>
                </button>
                <button
                    className={`control-btn circle-btn ${isMuted ? "active-control" : ""}`}
                    onClick={() => {
                        setIsMuted(!isMuted)
                        if (audioRef.current) {
                            audioRef.current.enabled = isMuted
                        }
                    }}
                >
                    <img src={isMuted ? MicOffIcon : MicIcon} alt=""/>
                </button>
                <button className="control-btn circle-btn">⚙️</button>
            </div>
        </div>
    )
}

export default CallView;
