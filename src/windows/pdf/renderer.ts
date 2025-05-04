import "./index.css";
import * as pdfjsLib from "pdfjs-dist";

pdfjsLib.GlobalWorkerOptions.workerSrc = "../../pdf.worker.mjs";
let pdf: pdfjsLib.PDFDocumentProxy;
let pageNumber = 1;

const canvas = document.getElementById("pdfContainer") as HTMLCanvasElement;
const context = canvas.getContext("2d");
let rendering = false;
let timeout: NodeJS.Timeout;

window.pdfElectronAPI.hasPDF(async (data: string) => {
    pdf = await pdfjsLib.getDocument(data).promise;
    renderPage();
});

async function renderPage() {
    if (rendering) return;
    rendering = true;
    const page = await pdf.getPage(pageNumber);
    const bodyViewport = getComputedStyle(document.body);

    const viewport = page.getViewport({scale: 1});
    const scale = Math.min(parseInt(bodyViewport.width) / viewport.width, parseInt(bodyViewport.height) / viewport.height);
    const scaledViewport = page.getViewport({scale});

    canvas.height = scaledViewport.height;
    canvas.width = scaledViewport.width;

    const renderContext = {
        canvasContext: context,
        viewport: scaledViewport,
    };
    return page.render(renderContext).promise.then(() => rendering = false);
}

window.addEventListener("resize", async () => {
    if (!pdf) return;
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(renderPage, 500);
});

// Listen for up/down/right/left/PageUp/PageDown key presses
window.addEventListener("keydown", async (event) => {
    if (!pdf) return;
    if (event.key === "ArrowRight" || event.key === "ArrowDown" || event.key === "PageDown") {
        if (pageNumber >= pdf.numPages) return;
        pageNumber++;
    } else if (event.key === "ArrowLeft" || event.key === "ArrowUp" || event.key === "PageUp") {
        if (pageNumber <= 1) return;
        pageNumber--;
    } else return;
    renderPage();
});
