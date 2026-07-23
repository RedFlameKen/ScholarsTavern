import { createContext, useContext, useRef, useState } from "react";
import { checkAuth, DEFAULT_SERVER_DOMAIN, WEBSOCKET_PROTOCOL } from "../request/requester";

const CallContext = createContext(null)

function CallProvider({ children }) {
    const sock = useRef(null)
    const peers = useRef(new Map())
    const previewStreamRef = useRef(null)
    // BUG: preview is black when re-entering call
    const previewRef = useRef(null)
    const audioRef = useRef(null)
    const videoRef = useRef(null)
    const cur_user_id = useRef(-1)

    const [remoteStreams, setRemoteStreams] = useState(new Map())
    const [currentCall, setCurrentCall] = useState(null)
    const [connected, setConnected] = useState(false)

    const [isMuted, setIsMuted] = useState(false);
    const [isDeafened, setIsDeafened] = useState(false);
    const [videoDisabled, setVideoDisabled] = useState(true);

    const [firstName, setFirstName] = useState("User")
    const [lastName, setLastName] = useState("User")

    function toggleDeafened() {
        setIsDeafened(!isDeafened)
        remoteStreams.forEach(stream => {
            stream.getAudioTracks().forEach(track => {
                track.enabled = !isDeafened;
            });
        });
    }

    function toggleMuted() {
        setIsMuted(!isMuted)
        if (audioRef.current) {
            audioRef.current.enabled = isMuted
        }
    }

    function toggleVideo() {
        setVideoDisabled(!videoDisabled)
        if (videoRef.current) {
            videoRef.current.enabled = videoDisabled
        }
    }


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

    async function startCall({ group_id, channel }) {
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

        sock.current = new WebSocket(`${WEBSOCKET_PROTOCOL}${DEFAULT_SERVER_DOMAIN}/call/${group_id}/${channel.id}`)

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

        setConnected(true)
        setCurrentCall(channel)
    }

    // Exit voice room button (returns to the first chat room)
    function endCall() {
        setRemoteStreams([])

        for (const peer_obj of peers.current.values()) {
            peer_obj.peer.close()
        }

        peers.current.clear();

        if (previewStreamRef.current) {
            previewStreamRef.current.getTracks().forEach(track => track.stop())
            previewStreamRef.current = null
        }

        if (previewRef.current) {
            previewRef.current.srcObject = null
        }

        sock.current.close()
        sock.current = null;

        setConnected(false)
        setCurrentCall(null)
    }

    const value = {
        sock,
        startCall,
        peers,
        previewStreamRef,
        previewRef,
        remoteStreams,
        setRemoteStreams,
        currentCall,
        setCurrentCall,
        connected,
        setConnected,
        toggleMuted,
        isMuted,
        toggleDeafened,
        isDeafened,
        toggleVideo,
        videoDisabled,
        endCall,
        firstName,
        lastName,
    }

    return (
        <CallContext.Provider value={value}>
            {children}
        </CallContext.Provider>
    )

}

export function useCall() {
    return useContext(CallContext)
}

export default CallProvider;
