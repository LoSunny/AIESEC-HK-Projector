import "./index.css";

let resetKey = true;
let keys = new Set<string>();
let pressedKeys = new Set<string>();

function keyDownEvent(event: KeyboardEvent, element: HTMLButtonElement) {
    pressedKeys.add(event.key);
    if (resetKey) {
        keys.clear();
        pressedKeys.forEach(key => keys.add(key));
    }
    resetKey = false;
    if (!keys.has(event.key)) keys.add(event.key);
    element.textContent = "Next Slide Key: " + Array.from(keys).join(", ");
}

function keyUpEvent(event: KeyboardEvent) {
    pressedKeys.delete(event.key);
    resetKey = true;
}

const next = document.getElementById("next") as HTMLButtonElement;
const keyDownEventNext = (event: KeyboardEvent) => keyDownEvent(event, next);
next.addEventListener("click", () => {
    if (document.getElementsByClassName("custom-glow").length > 0 && !next.classList.contains("custom-glow")) return;
    if (next.textContent.includes("Unset")) {
        keys = new Set<string>();
        pressedKeys = new Set<string>();
        prev.disabled = true;
        next.classList.add("custom-glow");
        next.textContent = "Next Slide Key: Press a key";
        document.addEventListener("keydown", keyDownEventNext);
        document.addEventListener("keyup", keyUpEvent);
        prev.classList.add("cursor-not-allowed");
    } else if (next.classList.contains("custom-glow")) {
        prev.disabled = false;
        document.removeEventListener("keydown", keyDownEventNext);
        document.removeEventListener("keyup", keyUpEvent);
        next.classList.remove("custom-glow");
        next.textContent = "Next Slide Key: " + (keys.size === 0 ? "Unset" : Array.from(keys).join(", "));
        window.settingsElectronAPI.nextShortcut(Array.from(keys).join("+"));
        prev.classList.remove("cursor-not-allowed");
    } else {
        window.settingsElectronAPI.nextShortcut("");
        next.textContent = "Next Slide Key: Unset";
        prev.classList.remove("cursor-not-allowed");
    }
});
window.settingsElectronAPI.getNextShortcut().then(k => {
    if (k === "") return;
    next.textContent = "Next Slide Key: " + k;
})

const prev = document.getElementById("previous") as HTMLButtonElement;
const keyDownEventPrev = (event: KeyboardEvent) => keyDownEvent(event, prev);
prev.addEventListener("click", () => {
    if (document.getElementsByClassName("custom-glow").length > 0 && !prev.classList.contains("custom-glow")) return;
    if (prev.textContent.includes("Unset")) {
        keys = new Set<string>();
        pressedKeys = new Set<string>();
        next.disabled = true;
        prev.classList.add("custom-glow");
        prev.textContent = "Previous Slide Key: Press a key";
        document.addEventListener("keydown", keyDownEventPrev);
        document.addEventListener("keyup", keyUpEvent);
        next.classList.add("cursor-not-allowed");
    } else if (prev.classList.contains("custom-glow")) {
        next.disabled = false;
        document.removeEventListener("keydown", keyDownEventPrev);
        document.removeEventListener("keyup", keyUpEvent);
        prev.classList.remove("custom-glow");
        prev.textContent = "Previous Slide Key: " + (keys.size === 0 ? "Unset" : Array.from(keys).join(", "));
        window.settingsElectronAPI.prevShortcut(Array.from(keys).join("+"));
        next.classList.remove("cursor-not-allowed");
    } else {
        window.settingsElectronAPI.prevShortcut("");
        prev.textContent = "Previous Slide Key: Unset";
        next.classList.remove("cursor-not-allowed");
    }
});
window.settingsElectronAPI.getPrevShortcut().then(k => {
    if (k === "") return;
    prev.textContent = "Previous Slide Key: " + k;
});
