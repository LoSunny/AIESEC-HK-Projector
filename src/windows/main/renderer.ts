import "./index.css";
import {resolveAddress} from "./address";
import Swal, {SweetAlertOptions} from "sweetalert2";

type Tab = {
    id: string;
    name: string;
    url: string;
    web: boolean;
    back: boolean;
    forward: boolean;
    muted: boolean;
    audible: boolean;
    element: HTMLElement
};
const tabs = new Map<string, Tab>();
const pending = new Set<string>();
const get = (id: string) => document.getElementById(id);
const address = get("url") as HTMLInputElement;
let active = "black";
let presenting = "black";
let dragged: string | null = null;
let blank = false;

function updateAudio(tab: Tab) {
    const button = tab.element.querySelector<HTMLButtonElement>(".tab-audio");
    if (!button) return;
    const state = tab.muted ? (tab.audible ? "Muted · sound playing" : "Muted · no sound") : (tab.audible ? "Sound playing" : "No sound");
    const action = tab.muted ? "Unmute" : "Mute";
    const speaker = "<path d=\"M3 9h4l5-4v14l-5-4H3z\"/>";
    const waves = tab.audible ? "<path d=\"M16 8a6 6 0 0 1 0 8M19 5a10 10 0 0 1 0 14\"/>" : "";
    const mute = tab.muted ? (tab.audible ? "<path d=\"m3 3 18 18\"/>" : "<path d=\"m16 9 5 6m0-6-5 6\"/>") : "";
    button.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${speaker}${waves}${mute}</svg>`;
    button.classList.toggle("muted", tab.muted);
    button.classList.toggle("playing", tab.audible);
    button.title = `${state} — click to ${action.toLowerCase()}`;
    button.setAttribute("aria-label", `${tab.name}: ${state}. ${action} tab`);
    button.setAttribute("aria-pressed", String(tab.muted));
}

function updateToolbar() {
    const tab = tabs.get(active);
    if (document.activeElement !== address) address.value = blank ? "" : tab?.url || "";
    address.placeholder = blank || active === "black" ? "Search Google or enter a website address" : tab?.web ? "Search Google or enter a website address" : "This source has no web address";
    (get("back") as HTMLButtonElement).disabled = blank || !tab?.back;
    (get("forward") as HTMLButtonElement).disabled = blank || !tab?.forward;
    (get("reload") as HTMLButtonElement).disabled = blank || !tab?.web;
    get("present-status").textContent = `Presenting: ${tabs.get(presenting)?.name || "Black screen"}`;
    tabs.forEach(t => {
        t.element.classList.toggle("active", t.id === active);
        t.element.classList.toggle("presenting", t.id === presenting);
        t.element.setAttribute("aria-selected", String(t.id === active));
        t.element.tabIndex = t.id === active ? 0 : -1;
    });
    get("empty").style.visibility = active === "black" || pending.has(active) ? "visible" : "hidden";
}

function select(id: string) {
    active = id;
    blank = false;
    window.api.changeActive(pending.has(id) ? "black" : id);
    address.blur();
    updateToolbar();
}

function close(id: string) {
    if (id === "black" || !tabs.has(id)) return;
    const order = [...get("screens").children].map(el => (el as HTMLElement).dataset.id);
    if (active === id) select(order[order.indexOf(id) - 1] || "black");
    if (presenting === id) {
        presenting = "black";
        window.api.changePresent("black");
    }
    tabs.get(id).element.remove();
    tabs.delete(id);
    if (!pending.delete(id)) window.api.deleteWindow(id);
    updateToolbar();
}

function addTab(id: string, name: string, url = "", web = false) {
    if (tabs.has(id)) return;
    const element = document.createElement("div");
    element.className = "tab";
    element.dataset.id = id;
    element.setAttribute("role", "tab");
    element.draggable = true;
    const title = document.createElement("button");
    title.className = "tab-title";
    title.textContent = name;
    title.title = `${name} — double-click to rename`;
    title.tabIndex = -1;
    element.append(title);
    const tab: Tab = {id, name, url, web, back: false, forward: false, muted: false, audible: false, element};
    tabs.set(id, tab);
    element.onclick = () => select(id);
    element.onkeydown = event => {
        const order = [...get("screens").children] as HTMLElement[];
        const index = order.indexOf(element);
        if (["ArrowLeft", "ArrowRight"].includes(event.key)) {
            event.preventDefault();
            const next = order[(index + (event.key === "ArrowRight" ? 1 : order.length - 1)) % order.length];
            select(next.dataset.id);
            next.focus();
        }
        if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            select(id);
        }
    };
    title.ondblclick = async () => {
        if (id === "black") return;
        select("black"); // Native views would otherwise cover the dialog.
        const result = await Swal.fire({
            title: "Rename tab",
            input: "text",
            inputValue: tab.name,
            showCancelButton: true,
            inputValidator: value => !value.trim() ? "Enter a name" : undefined
        });
        if (!tabs.has(id)) return;
        if (result.isConfirmed) {
            tab.name = result.value.trim();
            title.textContent = tab.name;
            title.title = tab.name;
            if (!pending.has(id)) window.api.renameWindow(id, tab.name);
            updateAudio(tab);
        }
        select(id);
    };
    if (id !== "black") {
        const audio = document.createElement("button");
        audio.className = "tab-audio";
        audio.onclick = event => {
            event.stopPropagation();
            tab.muted = !tab.muted;
            updateAudio(tab);
            window.api.volumeMute(id);
        };
        const exit = document.createElement("button");
        exit.className = "tab-close";
        exit.textContent = "×";
        exit.title = "Close tab";
        exit.setAttribute("aria-label", `Close ${name}`);
        exit.onclick = event => {
            event.stopPropagation();
            close(id);
        };
        element.append(audio, exit);
        updateAudio(tab);
    }
    element.ondragstart = event => {
        dragged = id;
        event.dataTransfer.setData("text/plain", id);
        event.dataTransfer.effectAllowed = "move";
        element.classList.add("dragging");
    };
    element.ondragover = event => {
        if (dragged && dragged !== id) {
            event.preventDefault();
            element.classList.add("drop-target");
        }
    };
    element.ondragleave = () => element.classList.remove("drop-target");
    element.ondrop = event => {
        event.preventDefault();
        const source = tabs.get(dragged)?.element;
        if (source && source !== element) {
            const after = event.clientX > element.getBoundingClientRect().left + element.clientWidth / 2;
            get("screens").insertBefore(source, after ? element.nextSibling : element);
        }
        element.classList.remove("drop-target");
    };
    element.ondragend = () => {
        dragged = null;
        tabs.forEach(t => t.element.classList.remove("dragging", "drop-target"));
    };
    get("screens").append(element);
    select(id);
    element.scrollIntoView({block: "nearest", inline: "nearest"});
    if (web) window.api.browserCommand(id, "watch");
}

function openWebsite(raw: string, name?: string, newTab = false) {
    let url: URL;
    try {
        url = resolveAddress(raw);
    } catch (error) {
        address.setCustomValidity(error instanceof Error ? error.message : "Enter a website address or search keywords.");
        address.reportValidity();
        return;
    }
    address.setCustomValidity("");
    const tab = tabs.get(active);
    if (tab?.web && !blank && !newTab) {
        tab.url = url.href;
        window.api.browserCommand(active, "navigate", url.href);
    } else {
        const id = pending.has(active) && !newTab ? active : crypto.randomUUID();
        window.api.newWindow(url.href, id, name || url.hostname);
        if (pending.delete(id)) {
            tab.name = name || url.hostname;
            tab.url = url.href;
            tab.web = true;
            tab.element.querySelector(".tab-title").textContent = tab.name;
            updateAudio(tab);
            select(id);
            window.api.browserCommand(id, "watch");
        } else addTab(id, name || url.hostname, url.href, true);
    }
    address.blur();
    updateToolbar();
}

get("navigation").onsubmit = event => {
    event.preventDefault();
    openWebsite(address.value);
};
address.oninput = () => address.setCustomValidity("");
get("new-tab").onclick = () => {
    const id = crypto.randomUUID();
    pending.add(id);
    addTab(id, "New tab");
    blank = true;
    updateToolbar();
    address.value = "";
    address.focus();
};
["back", "forward", "reload"].forEach(command => get(command).onclick = () => window.api.browserCommand(active, command));
[["gdrive", "https://drive.google.com/", "Google Drive"], ["yt", "https://www.youtube.com/", "YouTube"], ["spotify", "https://open.spotify.com/", "Spotify"]].forEach(([id, url, name]) => get(id).onclick = () => openWebsite(url, name, true));
get("present").onclick = () => {
    presenting = pending.has(active) ? "black" : active;
    window.api.changePresent(presenting);
    updateToolbar();
};
get("freeze").onclick = () => {
    const button = get("freeze");
    const frozen = button.getAttribute("aria-pressed") !== "true";
    button.setAttribute("aria-pressed", String(frozen));
    button.textContent = frozen ? "Unfreeze" : "Freeze";
    window.api.freeze();
};
get("settings").onclick = () => window.api.openSettings();
get("share").onclick = () => window.api.shareScreen();
get("pdf").onclick = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".pdf";
    input.onchange = () => {
        const file = input.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
            if (typeof reader.result === "string" && reader.result.startsWith("data:application/pdf")) window.api.pdf(file.name, reader.result);
            else Swal.fire("Invalid PDF", "Please select a valid PDF file", "error");
        };
        reader.readAsDataURL(file);
    };
    input.click();
};
window.api.browserState((id, state) => {
    const tab = tabs.get(id);
    if (!tab) return;
    if (state.url) tab.url = state.url;
    tab.back = state.back;
    tab.forward = state.forward;
    tab.element.classList.toggle("loading", state.loading);
    if (active === id) updateToolbar();
});
window.api.audioStateChanged((id, audible) => {
    const tab = tabs.get(id);
    if (!tab) return;
    tab.audible = audible;
    updateAudio(tab);
});
window.api.newScreenAccepted((id, name) => addTab(id, name));
window.api.screenStopped(id => close(id));
window.api.swal((options: SweetAlertOptions) => {
    if (options.toast) {
        // Anchor SweetAlert to the browser chrome, above the native page view.
        // Toasts must never change or restore the selected source.
        void Swal.fire({...options, target: get("navigation")});
        return;
    }
    const previous = active;
    select("black");
    Swal.fire(options).then(result => {
        if (options.title === "Update Available" && result.isConfirmed) window.api.openURL("https://github.com/LoSunny/AIESEC-HK-Projector/releases/latest");
        if (tabs.has(previous)) select(previous);
    });
});
new ResizeObserver(() => {
    const {x, y, width, height} = get("win").getBoundingClientRect();
    window.api.mainNewSize(Math.round(x), Math.round(y), Math.round(width), Math.round(height));
}).observe(get("win"));
// document.addEventListener("keydown", event => {
//     if (!event.metaKey && !event.ctrlKey) return;
//     if (event.key.toLowerCase() === "l") { event.preventDefault(); address.focus(); address.select(); }
//     if (event.key.toLowerCase() === "t") { event.preventDefault(); get("new-tab").click(); }
//     if (event.key.toLowerCase() === "w" && active !== "black") { event.preventDefault(); close(active); }
//     if (event.key.toLowerCase() === "r" && tabs.get(active)?.web) { event.preventDefault(); window.api.browserCommand(active, "reload"); }
// });
addTab("black", "Black screen");
