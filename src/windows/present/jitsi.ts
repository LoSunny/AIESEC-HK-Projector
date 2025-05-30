// @ts-expect-error js module
import JitsiMeetModule from "../../integrations/lib-jitsi-meet.min";
// @ts-expect-error js module
const JitsiMeetJS: JitsiMeetJS = JitsiMeetModule;

interface Jitsi {
    connection: any;
    room: any;
}

const jitsis: Record<string, Jitsi> = {};

export function newJitsi(uuid: string, name: string, liveStream: MediaStream) {
    console.log("Sharing screen", liveStream);

    console.log("Setting up jitsi", JitsiMeetJS);
    JitsiMeetJS.init();
    // https://ladatano.partidopirata.com.ar/jitsimeter/
    const connection = new JitsiMeetJS.JitsiConnection(null, null, {
        hosts: {
            domain: "meet.jitsi",
            muc: "muc.meet.jitsi",
        },
        bosh: "https://meet.element.io/http-bind",
        serviceUrl: "wss://meet.element.io/xmpp-websocket?room=aiesechk",
    });
    let room: any;
    connection.addEventListener(JitsiMeetJS.events.connection.CONNECTION_ESTABLISHED, (...args: any[]) => {
        console.log("CONNECTION_ESTABLISHED", args);

        if (room != null) return;
        room = connection.initJitsiConference("aiesechk", {});
        room.on(JitsiMeetJS.events.conference.CONFERENCE_JOINED, (...args: any[]) => {
            console.log("CONFERENCE_JOINED", args);
            room.setDisplayName(name);

            const newTracks = JitsiMeetJS.createLocalTracksFromMediaStreams([{
                stream: liveStream,
                sourceType: "window",
                mediaType: "video",
                videoType: "desktop"
            }]);
            newTracks.forEach((track: any) => {
                room.addTrack(track);
            });
        });
        room.on(JitsiMeetJS.events.conference.CONFERENCE_LEFT, (...args: any[]) => {
            console.log("CONFERENCE_LEFT", args);
        });
        room.on(JitsiMeetJS.events.conference.USER_JOINED, (...args: any[]) => {
            console.log("USER_JOINED", args);
        });
        room.on(JitsiMeetJS.events.conference.USER_LEFT, (...args: any[]) => {
            console.log("USER_LEFT", args);
        });
        console.log("Joining jitsi room");
        room.join();
        jitsis[uuid] = {connection, room};
    });
    connection.addEventListener(JitsiMeetJS.events.connection.CONNECTION_FAILED, (...args: any[]) => {
        console.log("CONNECTION_FAILED", args);
    });
    connection.addEventListener(JitsiMeetJS.events.connection.CONNECTION_DISCONNECTED, (...args: any[]) => {
        console.log("CONNECTION_DISCONNECTED", args);
    });
    console.log("Connecting to jitsi");
    connection.connect();
}

export function renameJitsi(uuid: string, name: string) {
    const jitsi = jitsis[uuid];
    if (!jitsi) return;
    jitsi.room.setDisplayName(name);
}

export function deleteJitsi(uuid: string) {
    const jitsi = jitsis[uuid];
    if (!jitsi) return;
    jitsi.room.leave();
    jitsi.connection.disconnect();
    delete jitsis[uuid];
}
