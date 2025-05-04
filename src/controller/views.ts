import {WebContentsView} from "electron";

export interface View {
    id: string;
    name: string;
    type: "general" | "canva" | "google" | "screenshare";
    webContents: WebContentsView[];
    active: boolean;
    present: boolean;
}

export interface ShareScreenView extends View {
    type: "screenshare";
    pid: number;
}

type Views = View | ShareScreenView;

let views: Views[] = [{
    id: "black",
    name: "Black",
    type: "general",
    webContents: [],
    active: true,
    present: true
}];

export function getViews() {
    return views;
}

export function getActiveView() {
    return views.find(view => view.active);
}

export function getPresentView() {
    return views.find(view => view.present);
}

export function getView(uuid: string) {
    return views.find(view => view.id === uuid);
}

export function addView(view: View | ShareScreenView) {
    views.push(view);
}

export function updatePresentView(uuid: string) {
    views.forEach(view => view.present = view.id === uuid);
}

export function deactiveAllViews() {
    views.forEach(view => view.active = false);
}

export function deleteView(uuid: string) {
    views = views.filter(view => view.id !== uuid);
}
