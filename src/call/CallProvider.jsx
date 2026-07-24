// @ts-check
import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import { checkAuth, DEFAULT_SERVER_DOMAIN, WEBSOCKET_PROTOCOL } from "../request/requester";

/**
 * @typedef {Object} Channel
 * @property {string|number} id
 * @property {string} name
 */

/**
 * @typedef {Object} User
 * @property {string|number} id
 * @property {string} first_name
 * @property {string} last_name
 */

/**
 * @typedef {Object} PeerObject
 * @property {RTCPeerConnection} peer
 * @property {RTCIceCandidateInit[]} pendingCandidates
 * @property {boolean} connected
 * @property {string} first_name
 * @property {string} last_name
 */

/**
 * @typedef {Object} CallContextType
 * @property {React.MutableRefObject<WebSocket | null>} sock
 * @property {(options: { group_id?: string|number, channel: Channel } | Channel) => Promise<void>} startCall
 * @property {React.MutableRefObject<Map<string|number, PeerObject>>} peers
 * @property {React.MutableRefObject<MediaStream | null>} previewStreamRef
 * @property {React.MutableRefObject<HTMLVideoElement | null>} previewRef
 * @property {Map<string|number, MediaStream>} remoteStreams
 * @property {React.Dispatch<React.SetStateAction<Map<string|number, MediaStream>>>} setRemoteStreams
 * @property {Channel | null} currentCall
 * @property {React.Dispatch<React.SetStateAction<Channel | null>>} setCurrentCall
 * @property {boolean} connected
 * @property {React.Dispatch<React.SetStateAction<boolean>>} setConnected
 * @property {() => void} toggleMuted
 * @property {boolean} isMuted
 * @property {() => void} toggleDeafened
 * @property {boolean} isDeafened
 * @property {() => void} toggleVideo
 * @property {boolean} videoDisabled
 * @property {() => void} endCall
 * @property {string} firstName
 * @property {string} lastName
 */

const CallContext = createContext(/** @type {CallContextType | null} */(null));

/**
 * @param {Object} props
 * @param {React.ReactNode} props.children
 */
function CallProvider({ children }) {
    /** @type {React.MutableRefObject<WebSocket | null>} */
    const sock = useRef(null);
    /** @type {React.MutableRefObject<Map<string|number, PeerObject>>} */
    const peers = useRef(new Map());
    /** @type {React.MutableRefObject<MediaStream | null>} */
    const previewStreamRef = useRef(null);
    /** @type {React.MutableRefObject<HTMLVideoElement | null>} */
    const previewRef = useRef(null);

    /** @type {React.MutableRefObject<MediaStreamTrack | null>} */
    const audioRef = useRef(null);
    /** @type {React.MutableRefObject<MediaStreamTrack | null>} */
    const videoRef = useRef(null);
    const cur_user_id = useRef(-1);

    const [remoteStreams, setRemoteStreams] = useState(/** @type {Map<string|number, MediaStream>} */(new Map()));
    const [currentCall, setCurrentCall] = useState(/** @type {Channel | null} */(null));
    const [connected, setConnected] = useState(false);

    const [isMuted, setIsMuted] = useState(false);
    const [isDeafened, setIsDeafened] = useState(false);
    const [videoDisabled, setVideoDisabled] = useState(false); // Starts false now to mirror initialization

    const [firstName, setFirstName] = useState("User");
    const [lastName, setLastName] = useState("");

    const toggleDeafened = useCallback(() => {
        const nextDeafened = !isDeafened;
        setIsDeafened(nextDeafened);
        remoteStreams.forEach(stream => {
            stream.getAudioTracks().forEach(track => {
                track.enabled = !nextDeafened;
            });
        });
    }, [isDeafened, remoteStreams]);

    const toggleMuted = useCallback(() => {
        const nextMuted = !isMuted;
        setIsMuted(nextMuted);
        if (audioRef.current) {
            audioRef.current.enabled = !nextMuted;
        }
    }, [isMuted]);

    const toggleVideo = useCallback(() => {
        const nextVideoDisabled = !videoDisabled;
        setVideoDisabled(nextVideoDisabled);

        // 1. Update the local track hardware state
        if (videoRef.current) {
            videoRef.current.enabled = !nextVideoDisabled;
        }

        // 2. Loop through all existing peer connections and sync the track state
        peers.current.forEach(({ peer }) => {
            const senders = peer.getSenders();
            const videoSender = senders.find(sender => sender.track && sender.track.kind === 'video');

            if (videoSender) {
                if (videoSender.track) {
                    videoSender.track.enabled = !nextVideoDisabled;
                }
            } else if (!nextVideoDisabled && videoRef.current && previewStreamRef.current) {
                try {
                    peer.addTrack(videoRef.current, previewStreamRef.current);
                } catch (err) {
                    console.warn("Failed to dynamically add video track to peer connection:", err);
                }
            }
        });
    }, [videoDisabled]);

    /**
     * @param {User} user
     * @returns {PeerObject}
     */
    function createPeer(user) {
        const peer = new RTCPeerConnection({
            iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
        });

        addLocalTracks(peer);

        peer.onicecandidate = (ev) => {
            if (ev.candidate) {
                if (sock.current && sock.current.readyState === 1) {
                    sock.current.send(JSON.stringify({
                        type: "ice-candidate",
                        to: user.id,
                        from: cur_user_id.current,
                        candidate: ev.candidate
                    }));
                }
            }
        };

        peer.ontrack = (ev) => {
            const stream = ev.streams[0];

            if (isDeafened) {
                stream.getAudioTracks().forEach(track => {
                    track.enabled = false;
                });
            }

            setRemoteStreams(prev => {
                const next = new Map(prev);
                next.set(user.id, stream);
                return next;
            });
        };

        /** @type {PeerObject} */
        const peer_obj = {
            peer: peer,
            pendingCandidates: [],
            connected: false,
            first_name: user.first_name,
            last_name: user.last_name
        };
        peers.current.set(user.id, peer_obj);
        return peer_obj;
    }

    /**
     * @param {User} user
     * @returns {PeerObject}
     */
    function getPeer(user) {
        let peer = peers.current.get(user.id);
        if (!peer) {
            peer = createPeer(user);
        }
        return peer;
    }

    /**
     * @param {PeerObject} peer
     */
    async function drainCandidateQueue(peer) {
        while (peer.pendingCandidates.length > 0) {
            const candidate = peer.pendingCandidates.shift();
            if (candidate) {
                await peer.peer.addIceCandidate(new RTCIceCandidate(candidate));
            }
        }
    }

    /**
     * @param {RTCPeerConnection} peer
     */
    function addLocalTracks(peer) {
        const call_stream = previewStreamRef.current;
        if (call_stream) {
            call_stream.getTracks().forEach(track => {
                const alreadyAdded = peer.getSenders().some(
                    sender => sender.track === track
                );

                if (!alreadyAdded) {
                    peer.addTrack(track, call_stream);
                }
            });
        }
    }

    /**
     * @param {any} data
     */
    async function handleExistingUsers(data) {
        const existing_users = data.users;

        for (const user of existing_users) {
            if (user.id === cur_user_id.current) {
                continue;
            }
            const peer = getPeer(user).peer;

            const offer = await peer.createOffer();
            await peer.setLocalDescription(offer);

            if (sock.current && sock.current.readyState === 1) {
                sock.current.send(JSON.stringify({
                    type: "offer",
                    to: user.id,
                    from: cur_user_id.current,
                    offer
                }));
            }
        }
    }

    /**
     * @param {any} data
     */
    function handleUserLeft(data) {
        const user_id = data.user_id;
        setRemoteStreams(prev => {
            const next = new Map(prev);
            next.delete(user_id);
            return next;
        });

        const peer = peers.current.get(user_id);
        if (peer) {
            peer.peer.close();
            peers.current.delete(user_id);
        }
    }

    /**
     * @param {any} data
     */
    async function handleOffer(data) {
        const peer_obj = getPeer(data.user);
        const peer = peer_obj.peer;
        await peer.setRemoteDescription(new RTCSessionDescription(data.offer));

        const answer = await peer.createAnswer();
        await peer.setLocalDescription(answer);

        if (sock.current && sock.current.readyState === 1) {
            sock.current.send(JSON.stringify({
                type: "answer",
                to: data.from,
                answer
            }));
        }
        await drainCandidateQueue(peer_obj);
    }

    /**
     * @param {any} data
     */
    async function handleAnswer(data) {
        const peer = getPeer(data.user);
        if (peer.peer.signalingState === "have-local-offer" && !peer.connected) {
            peer.connected = true;
            await peer.peer.setRemoteDescription(new RTCSessionDescription(data.answer));
        }
        await drainCandidateQueue(peer);
    }

    /**
     * @param {any} data
     */
    async function handleIceCandidate(data) {
        if (data.to !== cur_user_id.current) {
            return;
        }

        const peer = getPeer(data.user);
        if (!peer.peer.remoteDescription) {
            peer.pendingCandidates.push(data.candidate);
            return;
        }

        try {
            await peer.peer.addIceCandidate(new RTCIceCandidate(data.candidate));
        } catch (error) {
            peer.pendingCandidates.push(data.candidate);
        }
    }

    function initializeStates() {
        setRemoteStreams(new Map());
        setCurrentCall(null);
        setConnected(false);
        setIsMuted(false);
        setIsDeafened(false);
        setVideoDisabled(false); // Set false here so the UI toggle aligns on startup
        setFirstName("User");
        setLastName("");
    }

    const endCall = useCallback(() => {
        setRemoteStreams(new Map());

        for (const peer_obj of peers.current.values()) {
            peer_obj.peer.close();
        }
        peers.current.clear();

        if (previewStreamRef.current) {
            previewStreamRef.current.getTracks().forEach(track => track.stop());
            previewStreamRef.current = null;
        }

        if (previewRef.current) {
            previewRef.current.srcObject = null;
        }

        if (sock.current) {
            sock.current.close();
            sock.current = null;
        }

        audioRef.current = null;
        videoRef.current = null;

        setConnected(false);
        setCurrentCall(null);
    }, []);

    const startCall = useCallback(
        /**
         * @param {{ group_id?: string|number, channel: Channel } | Channel} options
         */
        async (options) => {
            if (!options || (!('channel' in options) && !('id' in options))) {
                console.error("DEBUG: startCall was invoked with invalid parameters:", options);
                return;
            }

            const channel = ('channel' in options && options.channel) ? options.channel : /** @type {Channel} */ (options);
            const group_id = ('group_id' in options && options.group_id) ? options.group_id : "default_group";

            if (connected && currentCall && String(currentCall.id) === String(channel.id)) {
                return;
            }

            initializeStates();

            let result;
            try {
                result = await checkAuth({});
                if (!result || !result.success) {
                    console.warn("Call authentication failed.");
                    return;
                }
            } catch (error) {
                console.error("Network error: Failed to reach the authentication server.", error);
                alert("Unable to connect to the server. Please check if the backend is running.");
                return;
            }

            try {
                cur_user_id.current = parseInt(result.data.user_id);
                setFirstName(result.data.first_name);
                setLastName(result.data.last_name);

                const call_stream = await navigator.mediaDevices.getUserMedia({
                    audio: true,
                    video: true,
                });

                previewStreamRef.current = call_stream;

                if (previewRef.current) {
                    previewRef.current.srcObject = call_stream;
                    previewRef.current.onloadedmetadata = () => {
                        if (previewRef.current) {
                            previewRef.current.play().catch(err => console.error("Video preview failed playing:", err));
                        }
                    };
                }

                audioRef.current = call_stream.getAudioTracks()[0] || null;
                videoRef.current = call_stream.getVideoTracks()[0] || null;

                // Fix: Enforce that the hardware track stays active upon joining
                if (videoRef.current) {
                    videoRef.current.enabled = true;
                }

                const wsUrl = `${WEBSOCKET_PROTOCOL}${DEFAULT_SERVER_DOMAIN}/call/${group_id}/${channel.id}`;
                sock.current = new WebSocket(wsUrl);

                sock.current.onmessage = async (ev) => {
                    if (ev.data === null) return;
                    const data = JSON.parse(ev.data);

                    switch (data.type) {
                        case "existing_users":
                            await handleExistingUsers(data);
                            break;
                        case "user_left":
                            handleUserLeft(data);
                            break;
                        case "offer":
                            await handleOffer(data);
                            break;
                        case "answer":
                            await handleAnswer(data);
                            break;
                        case "ice-candidate":
                            await handleIceCandidate(data);
                            break;
                        default:
                            break;
                    }
                };

                setConnected(true);
                setCurrentCall(channel);

            } catch (systemError) {
                console.error("🚨 CRITICAL: startCall failed setup logic:", systemError);
                alert("Could not open call: Microphone/Camera access denied or connection dropped.");
                endCall();
            }
        }, [connected, currentCall, endCall]);

    const value = useMemo(() => ({
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
    }), [
        remoteStreams,
        currentCall,
        connected,
        isMuted,
        isDeafened,
        videoDisabled,
        firstName,
        lastName,
        startCall,
        toggleDeafened,
        toggleMuted,
        toggleVideo,
        endCall
    ]);

    return (
        <CallContext.Provider value={value}>
            {children}
        </CallContext.Provider>
    );
}

export function useCall() {
    const context = useContext(CallContext);
    if (!context) {
        throw new Error("useCall must be used within a CallProvider");
    }
    return context;
}

export default CallProvider;