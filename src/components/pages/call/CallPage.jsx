import { useEffect, useRef, useState } from "react";
import { checkAuth, DEFAULT_SERVER_DOMAIN, WEBSOCKET_PROTOCOL } from "../../../request/requester";

function CallPage() {
    const [remoteStreams, setRemoteStreams] = useState(new Map())
    const peers = useRef(new Map())
    const previewRef = useRef(null)
    const previewStreamRef = useRef(null)
    const sock = useRef(null)
    const cur_user_id = useRef(-1)

    function createPeer(userId){
        const peer = new RTCPeerConnection({
            iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
        })

        peer.onicecandidate = (ev) => {
            if (ev.candidate) {
                sock.current.send(JSON.stringify({
                    type: "ice-candidate",
                    to: userId,
                    from: cur_user_id.current,
                    candidate: ev.candidate
                }))
            }
        }

        peer.ontrack = (ev) => {
            const stream =  ev.streams[0]

            setRemoteStreams(prev => {
                const next = new Map(prev)
                next.set(userId, stream)
                return next
            })
        }
        let peer_obj = {peer: peer, pendingCandidates: [], connected: false}
        peers.current.set(userId, peer_obj)
        return peer_obj
    }

    function getPeer(userId){
        let peer = peers.current.get(userId)
        if(!peer) {
            peer = createPeer(userId)
        }
        return peer;
    }

    async function drainCandidateQueue(peer){
        while(peer.pendingCandidates.length > 0){
            const candidate = peer.pendingCandidates.shift()
            await peer.peer.addIceCandidate(
                new RTCIceCandidate(candidate)
            )
        }
    }

    async function addLocalTracks(peer){
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

    async function handleExistingUsers(data){
        const existing_users = data.users
        console.log(`existing users data: ${JSON.stringify(data)}`)

        for (const user_id of existing_users) {
            if (user_id === cur_user_id.current) {
                return
            }
            const peer = getPeer(user_id).peer

            addLocalTracks(peer)

            const offer = await peer.createOffer();
            await peer.setLocalDescription(offer);

            sock.current.send(JSON.stringify({
                type: "offer",
                to: user_id,
                from: cur_user_id.current,
                offer
            }))
        };
    }

    function handleUserLeft(data){
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
        const peer_obj = getPeer(data.from)
        const peer = peer_obj.peer
        console.log(JSON.stringify(getPeer(data.from)))
        await peer.setRemoteDescription(new RTCSessionDescription(data.offer));

        addLocalTracks(peer)
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
        console.log(`from handle answer: ${data.from}`)
        const peer = getPeer(data.from)
        console.log(`upon answer: ${peer.peer.signalingState}`)
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
            console.log("candidate signal is not for this instance")
            return
        }

        const peer = getPeer(data.from)
        if (!peer.peer.remoteDescription) {
            peer.pendingCandidates.push(data.candidate)
            return
        }

        try {
            await peer.peer.addIceCandidate(
                new RTCIceCandidate(data.candidate)
            )
        } catch (error) {
            console.log(`unable to add ice candidate, error: ${error}`)
            peer.pendingCandidates.push(data.candidate)
        }
    }

    async function startCall() {
        const result = await checkAuth({})
        if (!result.success)
            return
        cur_user_id.current = parseInt(result.data.user_id)
        const call_stream = await navigator.mediaDevices.getUserMedia({
            audio: false,
            video: true,
        });

        previewStreamRef.current = call_stream

        if (previewRef.current) {
            previewRef.current.srcObject = call_stream
            previewRef.current.onloadedmetadata = () => {
                previewRef.current.play()
            }
        }

        sock.current = new WebSocket(`${WEBSOCKET_PROTOCOL}${DEFAULT_SERVER_DOMAIN}/call/`)

        sock.current.onmessage = async (ev) => {
            if (ev.data == null)
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

    function RemoteVideo({stream}){
        const ref = useRef(null)

        useEffect(() => {
            if (ref.current) {
                ref.current.srcObject = stream
            }
        }, [stream])

        return (
            <video 
                ref={ref}
                autoPlay
                playsInline
                width={200}
                height={180}
            />
        )
    }

    return (
        <div className="App">
            Breh, this is the call page
            <button type="button" onClick={_ => startCall()}>Start Call</button>
            <br />
            {/* <audio id="remote_audio" controls autoPlay> */}
            {/* </audio> */}
            <video ref={previewRef} id="self_video" width="200" height="180">
            </video>
            <div className="remote-videos">
                {[...remoteStreams].map(([_, stream]) => (
                    <RemoteVideo
                        key={stream.id}
                        stream={stream}
                    />
                ))
                }
            </div>
        </div>
    );
}

export default CallPage;
