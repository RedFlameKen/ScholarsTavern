import { useEffect, useRef, useState } from "react";
import { checkAuth, DEFAULT_SERVER_DOMAIN, WEBSOCKET_PROTOCOL } from "../../../request/requester";

function CallPage() {
    const [remoteStreams, setRemoteStreams] = useState(new Map());
    const peers = useRef(new Map());
    const previewRef = useRef(null);
    const previewStreamRef = useRef(null);
    const sock = useRef(null);
    const cur_user_id = useRef(-1);

    // CLEANUP EFFECT: Prevents camera lights staying on when navigating away
    useEffect(() => {
        return () => {
            // Stop camera and microphone tracks safely
            if (previewStreamRef.current) {
                previewStreamRef.current.getTracks().forEach(track => track.stop());
            }
            // Close all active peer connections
            peers.current.forEach(peerObj => {
                if (peerObj.peer) peerObj.peer.close();
            });
            // Close signaling socket
            if (sock.current) {
                sock.current.close();
            }
        };
    }, []);

    function createPeer(userId) {
        const peer = new RTCPeerConnection({
            iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
        });

        peer.onicecandidate = (ev) => {
            if (ev.candidate && sock.current && sock.current.readyState === WebSocket.OPEN) {
                sock.current.send(JSON.stringify({
                    type: "ice-candidate",
                    to: userId,
                    from: cur_user_id.current,
                    candidate: ev.candidate
                }));
            }
        };

        peer.ontrack = (ev) => {
            const stream = ev.streams[0];
            setRemoteStreams(prev => {
                const next = new Map(prev);
                next.set(userId, stream);
                return next;
            });
        };

        let peer_obj = { peer: peer, pendingCandidates: [], connected: false };
        peers.current.set(userId, peer_obj);
        return peer_obj;
    }

    function getPeer(userId) {
        let peer = peers.current.get(userId);
        if (!peer) {
            peer = createPeer(userId);
        }
        return peer;
    }

    async function drainCandidateQueue(peer) {
        while (peer.pendingCandidates.length > 0) {
            const candidate = peer.pendingCandidates.shift();
            try {
                await peer.peer.addIceCandidate(new RTCIceCandidate(candidate));
            } catch (e) {
                console.error("Error draining candidate:", e);
            }
        }
    }

    async function addLocalTracks(peer) {
        const call_stream = previewStreamRef.current;
        if (call_stream) {
            call_stream.getTracks().forEach(track => {
                const senders = peer.getSenders();
                const alreadyAdded = senders.some(sender => sender.track === track);
                if (!alreadyAdded) {
                    peer.addTrack(track, call_stream);
                }
            });
        }
    }

    async function handleExistingUsers(data) {
        const existing_users = data.users;
        for (const user_id of existing_users) {
            if (user_id === cur_user_id.current) return;

            const peer = getPeer(user_id).peer;
            await addLocalTracks(peer);

            const offer = await peer.createOffer();
            await peer.setLocalDescription(offer);

            if (sock.current && sock.current.readyState === WebSocket.OPEN) {
                sock.current.send(JSON.stringify({
                    type: "offer",
                    to: user_id,
                    from: cur_user_id.current,
                    offer
                }));
            }
        }
    }

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

    async function handleOffer(data) {
        const peer_obj = getPeer(data.from);
        const peer = peer_obj.peer;
        await peer.setRemoteDescription(new RTCSessionDescription(data.offer));

        await addLocalTracks(peer);
        const answer = await peer.createAnswer();
        await peer.setLocalDescription(answer);

        if (sock.current && sock.current.readyState === WebSocket.OPEN) {
            sock.current.send(JSON.stringify({
                type: "answer",
                to: data.from,
                answer
            }));
        }
        await drainCandidateQueue(peer_obj);
    }

    async function handleAnswer(data) {
        const peer = getPeer(data.from);
        if (peer.peer.signalingState === "have-local-offer" && !peer.connected) {
            peer.connected = true;
            await peer.peer.setRemoteDescription(new RTCSessionDescription(data.answer));
        }
        await drainCandidateQueue(peer);
    }

    async function handleIceCandidate(data) {
        if (data.to !== cur_user_id.current) return;

        const peer = getPeer(data.from);
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

    async function startCall() {
        try {
            const result = await checkAuth({});
            if (!result.success) return;

            cur_user_id.current = parseInt(result.data.user_id);

            // MOBILE CONSTRAINT PREFERENCE: Forces selfie camera + manages device processing load
            const call_stream = await navigator.mediaDevices.getUserMedia({
                audio: true, // Switched to true assuming a call needs audio!
                video: {
                    facingMode: "user",
                    width: { ideal: 640 },
                    height: { ideal: 480 }
                },
            });

            previewStreamRef.current = call_stream;

            if (previewRef.current) {
                previewRef.current.srcObject = call_stream;
                previewRef.current.onloadedmetadata = () => {
                    previewRef.current.play().catch(e => console.log("Playback error:", e));
                };
            }

            sock.current = new WebSocket(`${WEBSOCKET_PROTOCOL}${DEFAULT_SERVER_DOMAIN}/call/`);

            sock.current.onmessage = async (ev) => {
                if (ev.data == null) return;
                const data = JSON.parse(ev.data);

                switch (data.type) {
                    case "existing_users": await handleExistingUsers(data); break;
                    case "user_left": handleUserLeft(data); break;
                    case "offer": await handleOffer(data); break;
                    case "answer": await handleAnswer(data); break;
                    case "ice-candidate": await handleIceCandidate(data); break;
                    default: break;
                }
            };
        } catch (err) {
            console.error("Failed to access media devices:", err);
        }
    }

    function RemoteVideo({ stream }) {
        const ref = useRef(null);

        useEffect(() => {
            if (ref.current) {
                ref.current.srcObject = stream;
            }
        }, [stream]);

        return (
            <video
                ref={ref}
                autoPlay
                playsInline
                muted // Standard practice to prevent audio feedback loop echoes locally
                className="video-tile"
            />
        );
    }

    return (
        <div className="App call-container">
            <header className="call-header">
                <h2>Call Room</h2>
                <button className="btn-start" type="button" onClick={() => startCall()}>
                    Start Call
                </button>
            </header>

            <div className="video-grid">
                {/* Local User Preview Video */}
                <div className="video-wrapper local">
                    <video
                        ref={previewRef}
                        id="self_video"
                        autoPlay
                        playsInline
                        muted
                    />
                    <span className="video-label">You</span>
                </div>

                {/* Remote Users Group */}
                {[...remoteStreams].map(([userId, stream]) => (
                    <div className="video-wrapper" key={stream.id}>
                        <RemoteVideo stream={stream} />
                        <span className="video-label">User {userId}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default CallPage;