import {electronAPI} from "./preload";

declare global {
    interface Window {api: typeof electronAPI}
}
