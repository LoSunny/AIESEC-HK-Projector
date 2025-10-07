import {fullscreen} from "./fullscreen";

import "./index.css";
import {deleteJitsi, newJitsi, renameJitsi} from "./jitsi";

const sources: Record<string, MediaStream> = {};

document.addEventListener("DOMContentLoaded", () => {
    new ResizeObserver(() => {
        const rect = document.body.getBoundingClientRect();
        const {x, y, width, height} = rect;
        window.presentElectronAPI.presentNewSize(x, y, width, height);
        console.log("Resizing video due to resize");
        rendererResize();
    }).observe(document.body);

    console.log("Adding fullscreen event listener");
    [...document.getElementsByClassName("fullscreen")].forEach(ele => ele.addEventListener("click", fullscreen));
});

function rendererResize() {
    const rect = document.body.getBoundingClientRect();
    const {width, height} = rect;
    const video = document.querySelector("video");
    if (!video) return;
    const videoRect = getComputedStyle(video);
    const videoWidth = parseInt(videoRect.width.replace("px", ""));
    const videoHeight = parseInt(videoRect.height.replace("px", ""));

    console.log({
        videoWidth: video.videoWidth, videoHeight: video.videoHeight,
        videoViewport: video.videoWidth / video.videoHeight,
        computedWidth: videoWidth, computedHeight: videoHeight,
        computedViewport: videoWidth / videoHeight,
        width, height, viewport: width / height
    });
    if (video.videoWidth / video.videoHeight > width / height) {
        video.style.width = null;
        video.style.height = "100%";
    } else {
        video.style.width = "100%";
        video.style.height = null;
    }
}

window.presentElectronAPI.onNewSource((uuid, name, sourceId) => {
    navigator.mediaDevices.getUserMedia({
        // Audio is currently not supported
        // audio: true,
        video: {
            mandatory: {
                chromeMediaSource: "tab",
                chromeMediaSourceId: sourceId
            }
        }
    } as MediaStreamConstraints).then(stream => {
        sources[uuid] = stream;
        newJitsi(uuid, name, stream);
    }).catch(err => {
        console.error(err);
    });
});

window.presentElectronAPI.onChangeSource((uuid) => {
    let video = document.querySelector("video");
    if (!video) {
        document.getElementById("default").remove();
        video = document.createElement("video");

        video.muted = true;
        video.autoplay = true;
        video.className = "center max-w-none";
        video.style.height = "100%";
        document.body.appendChild(video);
    }
    console.log("Changing source to ", uuid);
    const fullscreenDiv = document.getElementsByClassName("fullscreen")[0] as HTMLElement;
    if (uuid === "black") {
        fullscreenDiv.style.display = "none";
        fullscreenDiv.style.display = "block";
    } else {
        fullscreenDiv.style.display = "none";
    }

    video.addEventListener("play", rendererResize);
    video.srcObject = sources[uuid];
});

window.presentElectronAPI.onDeleteSource((uuid) => {
    const stream = sources[uuid];
    if (!stream) return;
    stream.getVideoTracks().forEach(track => track.stop());
    delete sources[uuid];
    deleteJitsi(uuid);
});

window.presentElectronAPI.onFreeze(() => {
    console.log("freeze");
    const freeze = document.getElementById("freeze");
    const video = document.querySelector("video");
    if (!video) return;
    if (freeze) {
        freeze.remove();
        video.style.display = "block";
        return;
    }
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.className = "center";
    canvas.id = "freeze";
    canvas.style.height = video.style.height;
    canvas.style.width = video.style.width;
    const context = canvas.getContext("2d");
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    document.body.appendChild(canvas);
    video.style.display = "none";
});

window.presentElectronAPI.onRenameSource((uuid, newName) => {
    renameJitsi(uuid, newName);
});
