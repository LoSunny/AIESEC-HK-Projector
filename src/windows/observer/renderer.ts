import io from "socket.io-client";
import Swal from "sweetalert2";

import "./index.css";
import {registerPeerConnectionListeners} from "../webUtils";


const vid = document.getElementById("localVideo") as HTMLVideoElement;
const streams: Record<string, MediaStream> = {};
let liveStream: MediaStream;
const socket = io({reconnection: false, transports: ["websocket", "polling", "webtransport"]});
socket.on("connect", async () => {
    console.log("Connected to websocket server", socket.id);

    const pc = new RTCPeerConnection({
        iceServers: [{urls: ["stun:stun1.l.google.com:19302", "stun:stun2.l.google.com:19302"]}],
        iceCandidatePoolSize: 10
    });

    registerPeerConnectionListeners(pc);
    pc.addEventListener("track", event => {
        console.log("Got stream:", event.streams);
        if (liveStream == null) return liveStream = event.streams[0];
        const stream = Object.values(streams).find(stream => stream.getTracks().length === 0);
        if (!stream) return;
        vid.srcObject = stream;
        event.streams[0].getTracks().forEach(track => stream.addTrack(track));
        const btns = [...document.querySelectorAll("button[data-uuid]")] as HTMLButtonElement[];
        btns.forEach(btn => {
            btn.classList.remove("cursor-not-allowed");
            btn.disabled = false;
        });
    });

    pc.addEventListener("icecandidate", event => {
        if (!event.candidate) {
            console.log("Got final candidate!");
            return;
        }
        console.log("Sending IceCandidate:", event.candidate);
        socket.emit("icecandidate", event.candidate);
    });

    // Must acceptOffer from server instead of creating offer, not sure why
    // const offer = await pc.createOffer();
    // await pc.setLocalDescription(offer);
    // console.log("Created offer:", offer);
    // socket.emit("offer", offer);
    socket.on("answer", async (answer: RTCSessionDescriptionInit) => {
        console.log("Got answer:", answer);
        await pc.setRemoteDescription(new RTCSessionDescription(answer));
    });
    socket.on("offer", async (offer: RTCSessionDescriptionInit) => {
        console.log("Got offer:", offer);
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        console.log("Created answer:", answer);
        socket.emit("answer", answer);
    });
    socket.emit("request-sources");
    socket.on("response-sources", (sources: { name: string, uuid: string }[]) => {
        console.log("Got sources:", sources);
        if (sources.length === 0) document.getElementById("noscreen").textContent = "No screens available";
        else sources.forEach(source => newSource(source.uuid, source.name));
    });
    socket.on("new-source", (uuid: string, name: string) => {
        newSource(uuid, name);
    });
    socket.on("rename-source", (uuid: string, name: string) => {
        const button = document.querySelector(`button[data-uuid="${uuid}"]`);
        if (button) button.textContent = name;
    });
    socket.on("remove-source", (uuid: string) => {
        const button = document.querySelector(`button[data-uuid="${uuid}"]`);
        if (button) button.remove();
    });
});

socket.on("disconnect", () => {
    console.log("Disconnected from websocket server");
    document.body.style.backgroundColor = "lightgray";
    Swal.fire({
        title: "Disconnected from server",
        icon: "error",
        text: "Please reload the page to reconnect"
    });
});

let lastIndex = 0;

function genColor() {
    const colors = ["Slate", "Gray", "Zinc", "Neutral", "Stone", "Red", "Orange", "Amber", "Yellow", "Lime", "Green", "Emerald", "Teal", "Cyan", "Sky", "Blue", "Indigo", "Violet", "Purple", "Fuchsia", "Pink", "Rose"];
    while (true) {
        const i = Math.floor(Math.random() * colors.length);
        if (colors.length / 3 > i) continue;
        lastIndex += i;
        lastIndex %= colors.length;
        return colors[lastIndex];
    }
}

function newSource(uuid: string, name: string) {
    const div = document.getElementById("screens");
    const button = document.createElement("button");
    button.innerText = name;
    button.dataset.uuid = uuid;
    button.onclick = e => {
        const btns = [...document.querySelectorAll("button[data-uuid]")] as HTMLButtonElement[];
        btns.forEach(btn => btn.classList.remove("custom-selected"));
        (e.target as HTMLElement).classList.add("custom-selected");
        if (streams[uuid]) {
            vid.srcObject = streams[uuid];
            btns.forEach(btn => {
                btn.classList.remove("cursor-not-allowed");
                btn.disabled = false;
            });
            return;
        }
        btns.forEach(btn => {
            btn.classList.add("cursor-not-allowed");
            btn.disabled = true;
        });
        streams[uuid] = new MediaStream();
        socket.emit("change-source", uuid);
    };

    const color = genColor();
    button.className = "text-white bg-" + color + "-700 hover:bg-" + color + "-800 rounded-lg text-sm px-3 py-2.5 me-2 mb-2";
    div.appendChild(button);
    console.log("Adding source:", button);
}

document.addEventListener("keyup", e => {
    if (e.key !== "p") return;
    togglePresentScreen();
});

document.getElementsByClassName("presenter")[0].addEventListener("click", () => {
    togglePresentScreen();
});

const mode = document.getElementById("mode") as HTMLElement;

function cb() {
    togglePresentScreen();
    console.log("Removed click event listener");
    vid.removeEventListener("click", cb);
}

function togglePresentScreen() {
    if (mode.textContent === "Manual Mode") {
        mode.textContent = "Auto Mode";
        vid.srcObject = liveStream;
        vid.addEventListener("click", cb);
    } else {
        mode.textContent = "Manual Mode";
        const btn = document.querySelector(".custom-selected") as HTMLButtonElement;
        if (btn) btn.click();
        else vid.srcObject = null;
        console.log("Removed click event listener");
        vid.removeEventListener("click", cb);
    }
    const div = document.getElementById("screens");
    div.style.display = mode.textContent === "Auto Mode" ? "none" : "block";

    document.body.classList.toggle("bg-black");
}
