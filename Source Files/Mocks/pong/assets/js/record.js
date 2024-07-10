import { Recorder, RecorderStatus, Encoders } from "canvas-record";
//import createCanvasContext from "canvas-context";
import { AVC } from "media-codecs";

// Animation
/*
export function record(canvas) {
    let context = canvas.getContext('2d');
    let canvasRecorder;



    const tick = async () => {

    if (canvasRecorder.status !== RecorderStatus.Recording) return;
    await canvasRecorder.step();

    if (canvasRecorder.status !== RecorderStatus.Stopped) {
        requestAnimationFrame(() => tick());
    }
    };

    canvasRecorder = new Recorder(context, {
    name: "canvas-record-example",
    encoderOptions: {
        codec: AVC.getCodec({ profile: "Main", level: "5.2" }),
    },
    });

    // Start and encode frame 0
    canvasRecorder.start();

    // Animate to encode the rest
}

*/

function record(canvas) {
  var videoStream = canvas.captureStream(30);

  var mediaRecorder = new MediaRecorder(videoStream);
  var chunks = [];
  mediaRecorder.ondataavailable = function (e) {
    chunks.push(e.data);
  };

  mediaRecorder.onstop = function (e) {
    var blob = new Blob(chunks, { type: "video/mp4" }); // other types are available such as 'video/webm' for instance, see the doc for more info
    chunks = [];
    var videoURL = URL.createObjectURL(blob);
    video.src = videoURL;
  };
  mediaRecorder.start();
}
window.record = record;
