import {registerPeerConnectionListeners} from "../webUtils";

export function setupObserver(sources: () => Record<string, MediaStream>) {
    const pcs: Record<string, RTCPeerConnection> = {};
    let liveStream: MediaStream;
    window.presentElectronAPI.onOffer(async (id, offer) => {
        console.log("Got offer: ", offer);
        let pc = pcs[id];
        if (!pc) {
            console.log("Creating new pc");
            pc = newPeerConnection(id);
        }
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        console.log("Created answer: ", answer);
        window.presentElectronAPI.presentAnswer(id, answer);
        pcs[id] = pc;
    });

    window.presentElectronAPI.onAnswer(async (id, answer) => {
        console.log("Got answer: ", answer);
        pcs[id]?.setRemoteDescription(new RTCSessionDescription(answer)).then(() => console.log("Set remote description")).catch(console.error);
    });

    window.presentElectronAPI.onNewUser(async id => {
        if (pcs[id]) return;
        console.log("Creating new pc for ", id);
        const pc = newPeerConnection(id);
        await presentOffer(pc, id);
        pcs[id] = pc;
        pc.addTrack(liveStream.getTracks()[0], liveStream);
    });

    window.presentElectronAPI.onIceCandidate((id, candidate) => {
        console.log("Got candidate: ", candidate);
        pcs[id]?.addIceCandidate(new RTCIceCandidate(candidate)).then(() => console.log("Added candidate")).catch(console.error);
    });

    window.presentElectronAPI.onObserverDisconnect(id => {
        pcs[id]?.close();
        delete pcs[id];
    });

    window.presentElectronAPI.onObserverChangeSource((id, uuid) => {
        console.log("Adding track to pc", id, uuid);
        sources()[uuid].getTracks().forEach(track => pcs[id]?.addTrack(track, sources()[uuid]));
    });

    window.presentElectronAPI.liveView().then(uuid => {
        navigator.mediaDevices.getUserMedia({
            video: {
                mandatory: {
                    chromeMediaSource: "tab",
                    chromeMediaSourceId: uuid
                }
            }
        } as MediaStreamConstraints).then(stream => {
            liveStream = stream;
        }).catch(err => {
            console.error(err);
        });
    });
}

function newPeerConnection(id: string) {
    const pc = new RTCPeerConnection({
        iceServers: [{urls: ["stun:stun1.l.google.com:19302", "stun:stun2.l.google.com:19302"]}],
        iceCandidatePoolSize: 10
    });
    registerPeerConnectionListeners(pc);
    pc.addEventListener("icecandidate", event => {
        if (!event.candidate) {
            console.log("Got final candidate!");
            return;
        }
        console.log("Got candidate: ", event.candidate);
    });
    pc.addEventListener("negotiationneeded", async () => {
        await presentOffer(pc, id);
    });
    return pc;
}

async function presentOffer(pc: RTCPeerConnection, id: string) {
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    console.log("Created offer: ", offer);
    window.presentElectronAPI.presentOffer(id, offer);
}
