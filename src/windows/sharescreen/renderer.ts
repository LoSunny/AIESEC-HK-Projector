import "./index.css";

document.addEventListener("DOMContentLoaded", () => {
    console.log("Sending share screen request");
    let name: string;
    navigator.mediaDevices.getDisplayMedia({audio: true, video: true}).then(stream => {
        document.getElementById("loading").style.display = "none";
        console.log("Screen sharing success", stream);
        const video = document.getElementById("video") as HTMLVideoElement;
        video.srcObject = stream;
        video.onloadedmetadata = () => video.play();
        window.shareScreenElectronAPI.success(stream.id, name);
        stream.getVideoTracks().forEach(track => {
            track.onended = () => window.shareScreenElectronAPI.stopped(stream.id);
        });
    }).catch(e => {
        if (e instanceof Error) {
            if (e.name === "NotSupportedError" && e.message === "Not supported") window.shareScreenElectronAPI.askScreenPermission();
        } else console.log(e);
    });
    window.shareScreenElectronAPI.currentSource(sources => {
        document.getElementById("loading").style.display = "none";
        const video = document.getElementById("video") as HTMLVideoElement;
        video.style.display = "none";
        const div = document.getElementById("sources") as HTMLDivElement;
        div.style.display = "block";
        sources.forEach(source => {
            const img = document.createElement("img");
            img.src = source.thumbnail;
            img.title = source.id.split(":")[0] + ": " + source.name;
            img.onclick = () => {
                name = source.name;
                video.style.display = "block";
                div.style.display = "none";
                window.shareScreenElectronAPI.selectSource(source.id);
            };
            div.appendChild(img);
        });
        div.appendChild(document.createElement("br"));
        div.appendChild(document.createElement("br"));
        div.appendChild(document.createElement("br"));
        const btn = document.createElement("button");
        btn.innerText = "Cancel";
        btn.onclick = () => window.shareScreenElectronAPI.cancel();
        div.appendChild(btn);
    });
});
