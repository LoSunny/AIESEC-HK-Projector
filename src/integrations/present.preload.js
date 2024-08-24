const {contextBridge, ipcRenderer} = require('electron');

let sources = [];

ipcRenderer.on('new-source', (event, name, sourceId) => {
    console.log('new-source', name, sourceId);
    navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
            cursor: 'never',
            mandatory: {
                chromeMediaSource: 'tab',
                chromeMediaSourceId: sourceId
            }
        }
    }).then(stream => {
        sources.push({name, stream});
    }).catch(err => {
        console.error(err);
    });
});

ipcRenderer.on('change-source', (event, sourceId) => {
    let video = document.querySelector('video');
    if (!video) {
        document.getElementById("default").remove();
        video = document.createElement('video');

        video.autoplay = true;
        video.className = 'video';
        video.style.height = '100%';
        document.body.appendChild(video);
        const script = document.createElement("script");
        script.type = "text/javascript";
        script.textContent = 'window.resize();';
        document.body.appendChild(script);
        document.body.removeChild(script);
    }
    const fullscreenDiv = document.getElementsByClassName('fullscreen')[0];
    if (sourceId === 'black') {
        fullscreenDiv.style.display = 'block';
    } else {
        fullscreenDiv.style.display = 'none';
    }
    let source = sources.find(s => s.name === sourceId);
    if (source) source = source.stream;
    video.srcObject = source;
});

ipcRenderer.on('delete-source', (event, sourceId) => {
    const source = sources.find(s => s.sourceId === sourceId);
    if (!source) return;
    const stream = source.stream;
    stream.getVideoTracks().forEach(track => track.stop());
    stream.getAudioTracks().forEach(track => track.stop());
    sources = sources.filter(s => s.sourceId !== sourceId);
});

ipcRenderer.on('freeze', () => {
    console.log('freeze');
    const freeze = document.getElementById('freeze');
    const video = document.querySelector('video');
    if (!video) return;
    if (freeze) {
        freeze.remove();
        video.style.display = 'block';
        return;
    }
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.id = 'freeze';
    canvas.className = 'video';
    canvas.style.height = video.style.height;
    canvas.style.width = video.style.width;
    const context = canvas.getContext('2d');
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    document.body.appendChild(canvas);
    video.style.display = 'none';
});

const electronAPI = {
    resize: (x, y, width, height) => ipcRenderer.send('present-resize', x, y, width, height),
}

contextBridge.exposeInMainWorld('api', electronAPI);
