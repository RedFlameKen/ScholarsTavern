import { useEffect, useRef } from "react";

let isCaller = false;

function CallPage() {
    const previewRef = useRef(null)
    const remoteVidRef = useRef(null)
    const sock = useRef(null)
    const peer = useRef(null)

    // The play method is not allowed by the user agent or the platform in the current context, possibly because the user denied permission.
    async function handleOffer(data) {
        await peer.current.setRemoteDescription(new RTCSessionDescription(data.offer));

        const answer = await peer.current.createAnswer();
        await peer.current.setLocalDescription(answer);

        sock.current.send(JSON.stringify({
            type: "answer",
            answer
        }))
    }

    async function handleAnswer(data) {
        await peer.current.setRemoteDescription(
            new RTCSessionDescription(data.answer)
        )
    }

    async function handleIceCandidate(data) {
        if (peer.current.remoteDescription) {
            await peer.current.addIceCandidate(
                new RTCIceCandidate(data.candidate)
            )
        }
    }

    async function startCall() {
        isCaller = true;
        const call_stream = await navigator.mediaDevices.getUserMedia({
            audio: true,
            video: true,
        });

        if (previewRef.current) {
            previewRef.current.srcObject = call_stream
            previewRef.current.onloadedmetadata = () => {
                previewRef.current.play()
            }
        }

        call_stream.getTracks().forEach(track => {
            peer.current.addTrack(track, call_stream)
            console.log(peer.current.signalingState)
            console.log(peer.current.getSenders())
        })
        const offer = await peer.current.createOffer();
        await peer.current.setLocalDescription(offer);
        sock.current.send(JSON.stringify({
            type: "offer",
            offer
        }))
    }

    useEffect(() => {
        sock.current = new WebSocket("wss://scholarstavernserver.onrender.com/call/")
        peer.current = new RTCPeerConnection({
            iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
        })

        sock.current.onmessage = async (ev) => {
            // console.log(`raw message: ${ev.data}`)
            if (ev.data == null)
                return;

            const data = JSON.parse(ev.data)
            if (data.type === "offer")
                handleOffer(data)

            if (data.type === "answer")
                handleAnswer(data)

            if (data.type === "ice-candidate")
                handleIceCandidate(data)
        }

        peer.current.onicecandidate = (ev) => {
            if (ev.candidate) {
                sock.current.send(JSON.stringify({
                    type: "ice-candidate",
                    candidate: ev.candidate
                }))
            }
        }

        peer.current.ontrack = (ev) => {
            // const audioEl = document.getElementById("remote_audio");
            // audioEl.srcObject = new MediaStream(ev.streams[0].getAudioTracks())
            // audioEl.play().catch(err => {
            //     console.log(`autoplay blocked: ${err}`)
            // })

            if (remoteVidRef.current) {
                remoteVidRef.current.srcObject = ev.streams[0]
                remoteVidRef.current.onloadedmetadata = () => {
                    // remoteVidRef.current.play()
                }
            }
        }

        return () => {
            sock.current?.close();
            peer.current?.close();
        }
    }, [])


    return (
        <div className="App">
            Breh, this is the call page
            <button type="button" onClick={_ => startCall()}>Start Call</button>
            <br />
            {/* <audio id="remote_audio" controls autoPlay> */}
            {/* </audio> */}
            <video ref={previewRef} id="self_video" width="200" height="180" controls>
            </video>
            <video ref={remoteVidRef} width="200" height="180" controls>
            </video>
        </div>
    );
}

export default CallPage;
