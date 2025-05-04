import {electronAPI} from "./windows/main/preload";
import {presentElectronAPI} from "./windows/present/preload";
import {viewerElectronAPI} from "./integrations/preload";
import {shareScreenElectronAPI} from "./windows/sharescreen/preload";
import {pdfElectronAPI} from "./windows/pdf/preload";

declare global {
    interface Window {
        api: typeof electronAPI;
        presentElectronAPI: typeof presentElectronAPI;
        viewerElectronAPI: typeof viewerElectronAPI;
        shareScreenElectronAPI: typeof shareScreenElectronAPI;
        pdfElectronAPI: typeof pdfElectronAPI;
    }
}
