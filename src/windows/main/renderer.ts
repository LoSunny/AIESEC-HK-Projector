import "./index.css";
import Swal, {SweetAlertOptions} from "sweetalert2";
import QRCode from "qrcode";

[document.getElementById("url"), document.getElementById("name")].forEach(e => e.addEventListener("keypress", event=> {
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
    volumeSvg.className = 'volumecontrol';
    volumeSvg.insertAdjacentHTML('afterbegin', "<svg xmlns=\"http://www.w3.org/2000/svg\" fill=\"none\" viewBox=\"0 0 24 24\" stroke-width=\"1.5\" stroke=\"currentColor\" class=\"size-6 cursor-pointer unmuted\"><path stroke-linecap=\"round\" stroke-linejoin=\"round\" d=\"M19.114 5.636a9 9 0 0 1 0 12.728M16.463 8.288a5.25 5.25 0 0 1 0 7.424M6.75 8.25l4.72-4.72a.75.75 0 0 1 1.28.53v15.88a.75.75 0 0 1-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.009 9.009 0 0 1 2.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75Z\"/></svg><svg xmlns=\"http://www.w3.org/2000/svg\" fill=\"none\" viewBox=\"0 0 24 24\" stroke-width=\"1.5\" stroke=\"currentColor\" class=\"size-6 cursor-pointer muted\"><path stroke-linecap=\"round\" stroke-linejoin=\"round\" d=\"M17.25 9.75 19.5 12m0 0 2.25 2.25M19.5 12l2.25-2.25M19.5 12l-2.25 2.25m-10.5-6 4.72-4.72a.75.75 0 0 1 1.28.53v15.88a.75.75 0 0 1-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.009 9.009 0 0 1 2.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75Z\" /></svg>");
    volumeSvg.onclick = (e) => {
        const target = e.target as HTMLElement;
        target.parentElement.parentElement.getElementsByClassName('volumecontrol')[0].classList.toggle("mute");
        window.api.volumeMute(uuid);
    };
    presentDiv.appendChild(volumeSvg);
    screenDiv.appendChild(presentDiv);
    screensDiv.appendChild(screenDiv);
}

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
