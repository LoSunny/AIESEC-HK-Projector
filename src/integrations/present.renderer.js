function fullscreen() {
    const elem = document.documentElement;
    if (elem.requestFullscreen) {
        elem.requestFullscreen();
    } else if (elem.webkitRequestFullscreen) { /* Safari */
        elem.webkitRequestFullscreen();
    } else if (elem.msRequestFullscreen) { /* IE11 */
        elem.msRequestFullscreen();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new ResizeObserver((entries) => {
        const rect = document.body.getBoundingClientRect();
        const {x, y, width, height} = rect;
        window.api.resize(x, y, width, height);
        window.resize();
    }).observe(document.body);

    document.getElementsByClassName('fullscreen')[0].addEventListener('click', fullscreen);
})

window.resize = () => {
    const rect = document.body.getBoundingClientRect();
    const {x, y, width, height} = rect;
    const video = document.querySelector('video');
    if (!video) return;
    const videoRect = getComputedStyle(video);
    const videoWidth = parseInt(videoRect.width.replace('px', ''));
    const videoHeight = parseInt(videoRect.height.replace('px', ''));

    if (videoWidth === width && height > videoHeight) {
        console.log("Case 1")
        video.style.width = 'auto';
        video.style.height = '100%';
    } else if (videoHeight === height && width > videoWidth) {
        console.log("Case 2")
        video.style.width = '100%';
        video.style.height = 'auto';
    } else if (videoWidth === width && height < videoHeight) {
        console.log("Case 3")
        video.style.width = 'auto';
        video.style.height = '100%';
    } else if (videoHeight === height && width < videoWidth) {
        console.log("Case 4")
        video.style.width = '100%';
        video.style.height = 'auto';
    } else {
        console.log({width, height, videoWidth, videoHeight})
    }
}
