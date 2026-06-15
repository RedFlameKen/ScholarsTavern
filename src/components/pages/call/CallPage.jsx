const sock = new WebSocket("ws://localhost:8000/call/")

const peer = new RTCPeerConnection({
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
})

let isCaller = false;

async function handleOffer(data){
    await peer.setRemoteDescription(new RTCSessionDescription(data.offer));

    const answer = await peer.createAnswer();
    await peer.setLocalDescription(answer);

    sock.send(JSON.stringify({
        type: "answer",
        answer
    }))
}

async function handleAnswer(data) {
    await peer.setRemoteDescription(
        new RTCSessionDescription(data.answer)
    )
}

async function handleIceCandidate(data){
    if(peer.remoteDescription){
        await peer.addIceCandidate(
            new RTCIceCandidate(data.candidate)
        )
    }
}

sock.onmessage = async (ev) => {
    console.log(`raw message: ${ev.data}`)
    if (ev.data == null)
        return;

    const data = JSON.parse(ev.data)
    if (data.type === "offer" && !isCaller)
        handleOffer(data)

    if (data.type === "answer")
        handleAnswer(data)

    if (data.type === "ice-candidate")
        handleIceCandidate(data)
}

peer.onicecandidate = (ev) => {
    if (ev.candidate) {
        sock.send(JSON.stringify({
            type: "ice-candidate",
            candidate: ev.candidate
        }))
    }
}

peer.ontrack = (ev) => {
    // const audioEl = document.getElementById("remote_audio");
    // audioEl.srcObject = new MediaStream(ev.streams[0].getAudioTracks())
    // audioEl.play().catch(err => {
    //     console.log(`autoplay blocked: ${err}`)
    // })

    const videoEl = document.getElementById("remote_video");
    videoEl.srcObject = ev.streams[0]
    videoEl.play().catch(err => {
        console.log(`autoplay blocked: ${err}`)
    })
}

async function startCall(){
    isCaller = true;
    const call_stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: true,
    });

    call_stream.getTracks().forEach(track => {
        peer.addTrack(track, call_stream)
    })
    const offer = await peer.createOffer();
    await peer.setLocalDescription(offer);
    sock.send(JSON.stringify({
        type: "offer",
        offer
    }))
}


function CallPage() {
  return (
    <div className="App">
      Breh, this is the call page
      <button type="button" onClick={_ => startCall()}>Start Call</button>
      <br/>
      {/* <audio id="remote_audio" controls autoPlay> */}
      {/* </audio> */}
      <video id="remote_video" width="200" height="180" controls>
      </video>
    </div>
  );
}

export default CallPage;
