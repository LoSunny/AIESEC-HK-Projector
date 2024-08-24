/**
 * This file will automatically be loaded by webpack and run in the "renderer" context.
 * To learn more about the differences between the "main" and the "renderer" context in
 * Electron, visit:
 *
 * https://electronjs.org/docs/latest/tutorial/process-model
 *
 * By default, Node.js integration in this file is disabled. When enabling Node.js integration
 * in a renderer process, please be aware of potential security implications. You can read
 * more about security risks here:
 *
 * https://electronjs.org/docs/tutorial/security
 *
 * To enable Node.js integration in this file, open up `main.js` and enable the `nodeIntegration`
 * flag:
 *
 * ```
 *  // Create the browser window.
 *  mainWindow = new BrowserWindow({
 *    width: 800,
 *    height: 600,
 *    webPreferences: {
 *      nodeIntegration: true
 *    }
 *  });
 * ```
 */

import './index.css';

console.log('👋 This message is being logged by "renderer.js", included via webpack');

document.getElementById("open").addEventListener("click", () => {
    // @ts-ignore
    const url = document.getElementById('url').value;
    // @ts-ignore
    const name = document.getElementById('name').value;
    if (!url.startsWith("http://") && !url.startsWith("https://")) return alert('Invalid URL');
    const uuid = "10000000-1000-4000-8000-100000000000".replace(/[018]/g, c => (+c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> +c / 4).toString(16));
    window.api.newWindow(url, uuid);
    const screensDiv = document.getElementById("screens");
    const screenDiv = document.createElement("div");
    screenDiv.className = "column";
    const screenButton = document.createElement("button");
    screenButton.id = uuid;
    screenButton.className = "text-white bg-green-700 hover:bg-green-900 rounded-lg text-sm px-5 py-1 me-2 mb-2 cursor-pointer screen";
    screenButton.innerText = name;
    screenButton.onclick = () => changeActive(screenButton);
    screenDiv.appendChild(screenButton);
    const presentDiv = document.createElement("div");
    const presentButton = document.createElement("button");
    presentButton.className = "text-white bg-purple-700 hover:bg-purple-900 rounded-lg text-sm px-3 py-1 me-2 mb-2 cursor-pointer present";
    presentButton.dataset.id = uuid;
    presentButton.innerText = "Present";
    presentButton.onclick = () => changePresent(presentButton);
    presentDiv.appendChild(presentButton);
    const deleteButton = document.createElement("button");
    deleteButton.className = "text-white bg-red-700 hover:bg-red-900 rounded-lg text-sm px-3 py-1 me-2 mb-2 cursor-pointer delete";
    deleteButton.dataset.id = uuid;
    deleteButton.innerText = "Delete";
    deleteButton.onclick = () => deleteWindow(deleteButton);
    presentDiv.appendChild(deleteButton);
    screenDiv.appendChild(presentDiv);
    screensDiv.appendChild(screenDiv);
});

new ResizeObserver((entries) => {
    const win = document.getElementById('win');
    const rect = win.getBoundingClientRect();
    const {x, y, width, height} = rect;
    window.api.resize(x, y, width, height);
}).observe(document.getElementById('win'));

document.getElementById('freeze').addEventListener('click', () => window.api.freeze());
document.getElementsByClassName('screen')[0].addEventListener('click', e => changeActive(e.target));
document.getElementsByClassName('present')[0].addEventListener('click', e => changePresent(e.target));

function changeActive(element: EventTarget) {
    const source = (element as HTMLInputElement).id;
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

const next = document.getElementById('next');
next.addEventListener('click', () => {
    function keyEvent(event: KeyboardEvent) {
        window.api.nextShortcut(event.key);
        next.textContent = "Next Slide Key: " + event.key;
        document.removeEventListener('keydown', keyEvent);
    }

    if (next.textContent.includes("Press a key")) {
        next.textContent = "Next Slide Key: Press a key";
        document.removeEventListener('keydown', keyEvent);
    } else if (next.textContent.includes("Unset")) {
        next.textContent = "Next Slide Key: Press a key";
        document.addEventListener('keydown', keyEvent);
    } else {
        window.api.nextShortcut('');
        next.textContent = "Next Slide Key: Unset";
    }
});

const prev = document.getElementById('previous');
prev.addEventListener('click', () => {
    function keyEvent(event: KeyboardEvent) {
        window.api.prevShortcut(event.key);
        prev.textContent = "Previous Slide Key: " + event.key;
        document.removeEventListener('keydown', keyEvent);
    }

    if (prev.textContent.includes("Press a key")) {
        prev.textContent = "Previous Slide Key: Press a key";
        document.removeEventListener('keydown', keyEvent);
    } else if (prev.textContent.includes("Unset")) {
        prev.textContent = "Previous Slide Key: Press a key";
        document.addEventListener('keydown', keyEvent);
    } else {
        window.api.prevShortcut('');
        prev.textContent = "Previous Slide Key: Unset";
    }
});
