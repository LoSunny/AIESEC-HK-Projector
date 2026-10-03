import "./index.css";
import {shortcutFromEvent, shortcutLabels} from "./shortcut";

type Action = "previous" | "next";
const actions: Action[] = ["previous", "next"];
const values: Record<Action, string> = {previous: "", next: ""};
const loaded: Record<Action, boolean> = {previous: false, next: false};
const get = (id: string) => document.getElementById(id);
const button = (id: string) => get(id) as HTMLButtonElement;
let editing: Action | null = null;
let candidate = "";
let saving = false;

function displayShortcut(element: HTMLElement, value: string, fallback: string) {
    element.replaceChildren();
    if (!value) {
        element.textContent = fallback;
        return;
    }
    shortcutLabels(value).forEach((key, index) => {
        if (index) element.append(document.createTextNode("+"));
        const badge = document.createElement("kbd");
        badge.textContent = key;
        element.append(badge);
    });
}

function refresh() {
    actions.forEach(action => {
        button(action).disabled = !loaded[action] || editing !== null || saving;
        button(`${action}-clear`).disabled = !loaded[action] || !values[action] || editing !== null || saving;
        if (loaded[action]) displayShortcut(get(`${action}-value`), values[action], "Not set");
        get(action).closest(".shortcut-row").classList.toggle("editing", editing === action);
    });
    get("shortcut-editor").hidden = editing === null;
    button("save-shortcut").disabled = !candidate || saving;
    button("cancel-shortcut").disabled = saving;
}

function cancel() {
    const previous = editing;
    editing = null;
    candidate = "";
    get("capture-error").textContent = "";
    refresh();
    if (previous) button(previous).focus();
}

function read(action: Action): Promise<string> {
    return action === "next" ? window.settingsElectronAPI.getNextShortcut() : window.settingsElectronAPI.getPrevShortcut();
}

function write(action: Action, value: string) {
    if (action === "next") window.settingsElectronAPI.nextShortcut(value);
    else window.settingsElectronAPI.prevShortcut(value);
}

async function save(action: Action, value: string) {
    saving = true;
    refresh();
    try {
        write(action, value);
        values[action] = await read(action);
        get("settings-status").textContent = `${action === "next" ? "Next" : "Previous"} slide shortcut ${value ? "updated" : "cleared"}.`;
        cancel();
    } catch {
        get("settings-status").textContent = "Could not update the shortcut. Please try again.";
    } finally {
        saving = false;
        refresh();
        if (!editing) button(action).focus();
    }
}

actions.forEach(action => {
    button(action).onclick = () => {
        editing = action;
        candidate = "";
        get("editor-title").textContent = `Set up the ${action} slide button`;
        get("recording-instructions").textContent = `Press the ${action} slide button on your presentation clicker, then choose Save shortcut.`;
        displayShortcut(get("shortcut-preview"), "", "Waiting for your clicker…");
        get("capture-error").textContent = "";
        refresh();
        button("cancel-shortcut").focus();
    };
    button(`${action}-clear`).onclick = () => void save(action, "");
});
button("cancel-shortcut").onclick = cancel;
button("save-shortcut").onclick = () => {
    if (editing && candidate && !saving) void save(editing, candidate);
};
document.addEventListener("keydown", event => {
    if (!editing || saving || event.repeat) return;
    if (event.key === "Escape") {
        event.preventDefault();
        cancel();
        return;
    }
    // Allow keyboard users to reach Save and Cancel without changing their recording.
    if (event.key === "Tab" || (event.key === "Enter" && candidate)) return;
    event.preventDefault();
    try {
        const shortcut = shortcutFromEvent(event);
        if (!shortcut) return;
        const other = editing === "next" ? "previous" : "next";
        if (shortcut === values[other]) throw new Error(`This button is already assigned to the ${other} slide. Press the ${editing} slide button on your clicker.`);
        candidate = shortcut;
        get("capture-error").textContent = "";
        displayShortcut(get("shortcut-preview"), candidate, "Waiting for your clicker…");
    } catch (error) {
        candidate = "";
        get("capture-error").textContent = error instanceof Error ? error.message : "Press the slide button on your clicker again.";
        displayShortcut(get("shortcut-preview"), "", "Waiting for your clicker…");
    }
    refresh();
});
void Promise.all(actions.map(async action => {
    try {
        values[action] = await read(action);
        loaded[action] = true;
    } catch {
        get(`${action}-value`).textContent = "Could not load";
    }
})).then(() => {
    get("settings-status").textContent = actions.every(action => loaded[action]) ? "Changes apply when you save. Clear disables a shortcut." : "Could not load all shortcuts. Close and reopen Settings to try again.";
    refresh();
});
