import "./index.css";
import Swal, {SweetAlertOptions} from "sweetalert2";

[document.getElementById("url"), document.getElementById("name")].forEach(e => e.addEventListener("keypress", event => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    document.getElementById("open").click();
}));

document.getElementById("gdrive").addEventListener("click", () => {
    (document.getElementById("url") as HTMLInputElement).value = "https://drive.google.com/";
    (document.getElementById("name") as HTMLInputElement).value = "Google Drive";
    document.getElementById("open").click();
});

document.getElementById("yt").addEventListener("click", () => {
    (document.getElementById("url") as HTMLInputElement).value = "https://www.youtube.com/";
    (document.getElementById("name") as HTMLInputElement).value = "YouTube";
    document.getElementById("open").click();
});

document.getElementById("spotify").addEventListener("click", () => {
    (document.getElementById("url") as HTMLInputElement).value = "https://open.spotify.com/";
    (document.getElementById("name") as HTMLInputElement).value = "Spotify";
    document.getElementById("open").click();
});

document.getElementById("open").addEventListener("click", () => {
    const urlEle = document.getElementById("url") as HTMLInputElement;
    const url = urlEle.value;
    const nameEle = document.getElementById("name") as HTMLInputElement;
    const name = nameEle.value;
    if (!url.startsWith("http://") && !url.startsWith("https://")) return Swal.fire("Invalid URL", "Please enter a valid URL", "error");
    if (!name) return Swal.fire("Invalid Name", "Please enter a name", "error");
    urlEle.value = "";
    nameEle.value = "";
    const uuid = "10000000-1000-4000-8000-100000000000".replace(/[018]/g, c => (+c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> +c / 4).toString(16));
    window.api.newWindow(url, uuid, name);
    newScreen(uuid, name);
});

function newScreen(uuid: string, name: string) {
    const screensDiv = document.getElementById("screens");
    const screenDiv = document.createElement("div");
    screenDiv.className = "flex flex-col";
    const screenButton = document.createElement("button");
    screenButton.id = uuid;
    screenButton.className = "text-white bg-green-700 hover:bg-green-900 rounded-lg text-sm px-5 py-1 mb-2 cursor-pointer screen";
    screenButton.innerText = name;
    screenButton.onclick = () => changeActive(screenButton);
    screenButton.ondblclick = () => {
        changeActive(document.getElementsByClassName("screen")[0]);
        Swal.fire({
            title: "Change Name",
            input: "text",
            inputValue: screenButton.innerText,
            inputValidator: (value) => {
                if (!value) return "Name is required";
            }
        }).then(result => {
            changeActive(screenButton);
            if (result.isConfirmed && result.value) {
                window.api.renameWindow(uuid, result.value);
                screenButton.innerText = result.value;
            }
        });
    };
    screenDiv.appendChild(screenButton);
    const presentDiv = document.createElement("div");
    presentDiv.className = "flex flex-row";
    const presentButton = document.createElement("button");
    presentButton.className = "text-white bg-purple-700 hover:bg-purple-900 rounded-lg text-sm px-1 py-1 me-1 mb-2 cursor-pointer present";
    presentButton.dataset.id = uuid;
    presentButton.innerText = "Present";
    presentButton.onclick = () => changePresent(presentButton);
    presentDiv.appendChild(presentButton);
    const deleteButton = document.createElement("button");
    deleteButton.className = "text-white bg-red-700 hover:bg-red-900 rounded-lg text-sm px-1 py-1 me-1 mb-2 cursor-pointer delete";
    deleteButton.dataset.id = uuid;
    deleteButton.innerText = "Delete";
    deleteButton.onclick = () => deleteWindow(deleteButton);
    presentDiv.appendChild(deleteButton);
    const volumeSvg = document.createElement("div");
    volumeSvg.className = "volumecontrol";
    volumeSvg.dataset.id = uuid;
    volumeSvg.insertAdjacentHTML("afterbegin",
        "<svg viewBox=\"0 0 24 24\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\" class=\"size-6 cursor-pointer muted notplaying\"><path d=\"M3 14V10C3 9.44772 3.44772 9 4 9H6.64922C6.87629 9 7.0966 8.92272 7.27391 8.78087L10.3753 6.29976C11.0301 5.77595 12 6.24212 12 7.08062V16.9194C12 17.7579 11.0301 18.2241 10.3753 17.7002L7.27391 15.2191C7.0966 15.0773 6.87629 15 6.64922 15H4C3.44772 15 3 14.5523 3 14Z\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/><path d=\"M16 9.5L18.5 12M21 14.5L18.5 12M18.5 12L21 9.5M18.5 12L16 14.5\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/></svg>" +
        "<svg viewBox=\"0 0 24 24\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\" class=\"size-6 cursor-pointer muted playing\"><path d=\"M5 5L19 19\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/><path fill-rule=\"evenodd\" clip-rule=\"evenodd\" d=\"M8.00287 6.91712L6.64922 8.00003H4C2.89543 8.00003 2 8.89546 2 10V14C2 15.1046 2.89543 16 4 16H6.64922L9.75061 18.4811C11.0601 19.5288 13 18.5964 13 16.9194V11.9142L11 9.91425V16.9194L7.89861 14.4383C7.54398 14.1546 7.10336 14 6.64922 14H4V10H6.64922C7.10336 10 7.54398 9.84547 7.89861 9.56177L9.42578 8.34003L8.00287 6.91712ZM11 7.08582V7.08066L10.9971 7.08295L9.57422 5.66004L9.75061 5.51892C11.0601 4.4713 13 5.40365 13 7.08066V9.08582L11 7.08582ZM15.3187 14.233C15.2402 14.3497 15.1553 14.4626 15.0642 14.5712C14.7092 14.9943 14.7644 15.625 15.1874 15.98C15.6105 16.335 16.2413 16.2798 16.5963 15.8568C16.6491 15.7938 16.7006 15.7298 16.7507 15.6649L15.3187 14.233ZM17.7214 13.8072L15.9991 12.0849C16.0174 11.2215 15.7558 10.3747 15.2524 9.67154C14.9309 9.22248 15.0343 8.59782 15.4834 8.27632C15.9324 7.95482 16.5571 8.05823 16.8786 8.5073C17.6537 9.59 18.0467 10.8998 17.9956 12.2304C17.9749 12.7694 17.8818 13.2995 17.7214 13.8072ZM18.1736 17.0879C18.1586 17.1061 18.1435 17.1242 18.1284 17.1423C17.7734 17.5654 17.8285 18.1962 18.2516 18.5512C18.6479 18.8837 19.2263 18.8563 19.5897 18.504L18.1736 17.0879ZM20.752 16.8378L19.2646 15.3504C19.7379 14.3243 19.9918 13.202 19.9998 12.0559C20.0128 10.1943 19.3762 8.38646 18.1996 6.9438C17.8505 6.51581 17.9145 5.88589 18.3425 5.53683C18.7705 5.18777 19.4004 5.25175 19.7494 5.67974C21.2202 7.48307 22.016 9.74287 21.9998 12.0698C21.988 13.7485 21.5543 15.3863 20.752 16.8378Z\" fill=\"currentColor\"/></svg>" +
        "<svg viewBox=\"0 0 24 24\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\" class=\"size-6 cursor-pointer unmuted notplaying\"><path fill-rule=\"evenodd\" clip-rule=\"evenodd\" d=\"M8.56296 4.86899C9.5451 4.08327 11 4.78253 11 6.04029V17.9597C11 19.2174 9.5451 19.9167 8.56296 19.131L4.64922 16H3C1.34315 16 0 14.6568 0 13V11C0 9.34312 1.34315 7.99998 3 7.99998H4.64922L8.56296 4.86899ZM9 7.0806L5.89861 9.56172C5.54398 9.84542 5.10336 9.99998 4.64922 9.99998H3C2.44772 9.99998 2 10.4477 2 11V13C2 13.5523 2.44772 14 3 14H4.64922C5.10336 14 5.54398 14.1545 5.89861 14.4382L9 16.9194V7.0806Z\" fill=\"currentColor\"/></svg>" +
        "<svg viewBox=\"0 0 24 24\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\" class=\"size-6 cursor-pointer unmuted playing\"><path d=\"M3 14V10C3 9.44772 3.44772 9 4 9H6.64922C6.87629 9 7.0966 8.92272 7.27391 8.78087L10.3753 6.29976C11.0301 5.77595 12 6.24212 12 7.08062V16.9194C12 17.7579 11.0301 18.2241 10.3753 17.7002L7.27391 15.2191C7.0966 15.0773 6.87629 15 6.64922 15H4C3.44772 15 3 14.5523 3 14Z\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/><path d=\"M15.8302 15.2139C16.5435 14.3639 16.9537 13.3008 16.9963 12.1919C17.0389 11.0831 16.7114 9.99163 16.0655 9.08939\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/><path d=\"M18.8944 17.7851C20.2406 16.1807 20.9852 14.1571 20.9998 12.0628C21.0144 9.96855 20.2982 7.93473 18.9745 6.31174\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/></svg>");
    volumeSvg.onclick = (e) => {
        let target = e.target as HTMLElement;
        while (!target.classList.contains("volumecontrol") && target.parentElement) {
            target = target.parentElement;
        }
        target.classList.toggle("mute");
        window.api.volumeMute(uuid);
    };
    presentDiv.appendChild(volumeSvg);
    screenDiv.appendChild(presentDiv);
    screensDiv.appendChild(screenDiv);
}

window.api.audioStateChanged((uuid: string, audible: boolean) => {
    console.log("Audio state changed", uuid, audible);
    console.log(document.querySelector(`.volumecontrol[data-id="${uuid}"]`));
    document.querySelector(`.volumecontrol[data-id="${uuid}"]`)?.classList.toggle("play");
});


new ResizeObserver(() => {
    const win = document.getElementById("win");
    const rect = win.getBoundingClientRect();
    const {x, y, width, height} = rect;
    window.api.mainNewSize(x, y, width, height);
}).observe(document.getElementById("win"));

document.getElementById("freeze").addEventListener("click", (e: MouseEvent) => {
    if (e.target instanceof Element) e.target.textContent = e.target.textContent.trim() === "Freeze" ? "Unfreeze" : "Freeze";
    window.api.freeze();
});
document.getElementsByClassName("screen")[0].addEventListener("click", e => changeActive(e.target));
document.getElementsByClassName("present")[0].addEventListener("click", e => changePresent(e.target));

function changeActive(element: EventTarget) {
    const eles = [...document.getElementsByClassName("screen")];
    eles.forEach(ele => ele.classList.remove("active"));
    const source = (element as HTMLInputElement).id;
    (element as HTMLElement).classList.add("active");
    window.api.changeActive(source);
}

function changePresent(element: EventTarget) {
    const source = (element as HTMLInputElement).dataset.id;
    window.api.changePresent(source);
}

function deleteWindow(element: EventTarget) {
    const source = (element as HTMLInputElement).dataset.id;
    document.getElementById(source).parentElement.remove();
    window.api.deleteWindow(source);
}

window.api.swal((options: SweetAlertOptions) => {
    Swal.fire(options).then(result => {
        if (options.title === "Update Available") {
            if (result.isConfirmed) {
                window.api.openURL("https://github.com/LoSunny/AIESEC-HK-Projector/releases/latest");
            }
        }
    });
});

document.getElementById("share").addEventListener("click", () => {
    window.api.shareScreen();
});

window.api.newScreenAccepted((uuid: string, name: string) => {
    newScreen(uuid, name);
});

window.api.screenStopped((uuid: string) => {
    (document.querySelector(`.delete[data-id="${uuid}"]`) as HTMLElement)?.click();
});

document.getElementById("pdf").addEventListener("click", () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".pdf";
    input.onchange = () => {
        const file = input.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
            if (reader.result instanceof ArrayBuffer) return;
            if (reader.result.startsWith("data:application/pdf")) window.api.pdf(file.name, reader.result);
            else Swal.fire("Invalid PDF", "Please select a valid PDF file", "error");
        };
        reader.readAsDataURL(file);
    };
    input.click();
});

document.getElementById("settings").addEventListener("click", () => {
    window.api.openSettings();
})

// document.getElementById("observer").addEventListener("click", () => {
//     const url = "https://jitsi.riot.im/aiesechk";
//     QRCode.toDataURL(url, (err, dataurl) => {
//         const active = document.getElementsByClassName("active")[0];
//         changeActive(document.getElementsByClassName("screen")[0]);
//
//         Swal.fire({
//             title: "Share this URL with the observer",
//             text: url,
//             imageUrl: dataurl,
//         }).then(() => {
//             if (active) changeActive(active);
//         });
//     });
// });
