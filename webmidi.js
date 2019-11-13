let w = 0, h = 0;
let lastTimestamp = 0;
let speed = 0.25;

let keyboardEvents = [];
let audioContext = new AudioContext();
let pressedKeys = {};

let wave = 'square';

let keys = {'48': {note: 'C', octave: 4, position: 1, sharp: false, frequency: 261.6},
            '49': {note: 'C#', octave: 4, position: 1, sharp: true, frequency: 277.2},
            '50': {note: 'D', octave: 4, position: 2, sharp: false, frequency: 293.7},
            '51': {note: 'D#', octave: 4, position: 2, sharp: true, frequency: 311.1},
            '52': {note: 'E', octave: 4, position: 3, sharp: false, frequency: 329.6},
            '53': {note: 'F', octave: 4, position: 4, sharp: false, frequency: 349.2},
            '54': {note: 'F#', octave: 4, position: 4, sharp: true, frequency: 370.0},
            '55': {note: 'G', octave: 4, position: 5, sharp: false, frequency: 392.0},
            '56': {note: 'G#', octave: 4, position: 5, sharp: true, frequency: 415.3},
            '57': {note: 'A', octave: 4, position: 6, sharp: false, frequency: 440.0},
            '58': {note: 'Bb', octave: 4, position: 6, sharp: true, frequency: 466.2},
            '59': {note: 'B', octave: 4, position: 7, sharp: false, frequency: 493.9},
            '60': {note: 'C', octave: 5, position: 8, sharp: false, frequency: 523.3},
            '61': {note: 'C#', octave: 5, position: 8, sharp: true, frequency: 554.4},
            '62': {note: 'D', octave: 5, position: 9, sharp: false, frequency: 587.3},
            '63': {note: 'D#', octave: 5, position: 9, sharp: true, frequency: 622.3},
            '64': {note: 'E', octave: 5, position: 10, sharp: false, frequency: 659.3},
            '65': {note: 'F', octave: 5, position: 11, sharp: false, frequency: 698.5},
            '66': {note: 'F#', octave: 5, position: 11, sharp: true, frequency: 740.0},
            '67': {note: 'G', octave: 5, position: 12, sharp: false, frequency: 784.0},
            '68': {note: 'G#', octave: 5, position: 12, sharp: true, frequency: 830.6},
            '69': {note: 'A', octave: 5, position: 13, sharp: false, frequency: 880.0},
            '70': {note: 'Bb', octave: 5, position: 13, sharp: true, frequency: 932.3},
            '71': {note: 'B', octave: 5, position: 14, sharp: false, frequency: 987.8},
            '72': {note: 'C', octave: 6, position: 15, sharp: false, frequency: 1047}};

function fixSize() {

    w = window.innerWidth;
    h = window.innerHeight;
    const canvas = document.getElementById('webMidiCanvas');
    canvas.width = w;
    canvas.height = h;

}

function pageLoad() {

    window.addEventListener("resize", fixSize);
    fixSize();

    navigator.requestMIDIAccess().then(onMIDISuccess, onMIDIFailure);

    window.addEventListener("keydown", event => pressedKeys[event.key] = true);
    window.addEventListener("keyup", event => pressedKeys[event.key] = false);

    window.requestAnimationFrame(frame);

}

function onMIDISuccess(midiAccess) {
    for (var input of midiAccess.inputs.values()) {
        input.onmidimessage = getMIDIMessage;
    }
}

function onMIDIFailure() {
    alert('Could not access your MIDI devices.');
}

function getMIDIMessage(midiMessage) {

    let key = keys[midiMessage.data[1]];
    let timestamp = Math.floor(midiMessage.timeStamp);

    console.log(midiMessage);

    if (midiMessage.data[0] === 144) {

        let velocity = midiMessage.data[2];
        let release = false;
        let audio = playNote(key.frequency, velocity);
        keyboardEvents.push({key, velocity, release, timestamp, audio});


    } else if (midiMessage.data[0] === 128) {

        for (let i = keyboardEvents.length - 1; i >= 0; i--) {
            if (keyboardEvents[i].key === key) {
                keyboardEvents[i].release = timestamp;
                keyboardEvents[i].audio.gain.exponentialRampToValueAtTime(0.00001, audioContext.currentTime + 1);
                break;
            }
        }

    }

}

function playNote(frequency, velocity){

    let o = audioContext.createOscillator();
    o.type = wave;
    o.frequency.value=frequency;
    o.start();

    let g = audioContext.createGain();
    g.connect(audioContext.destination);
    g.gain.value = velocity / 512;

    o.connect(g);

    return g;
}

function frame(timestamp) {

    if (lastTimestamp === 0) lastTimestamp = timestamp;
    const frameLength = (timestamp - lastTimestamp) / 1000;
    lastTimestamp = timestamp;

    const canvas = document.getElementById('webMidiCanvas');
    const context = canvas.getContext('2d');

    context.fillStyle = 'blue';
    context.fillRect(0,0,w,h);

    if (pressedKeys["1"]) {
      wave = 'sine';
    } else if (pressedKeys["2"]) { 
      wave = 'square';
    } else if (pressedKeys["3"]) {
      wave = 'sawtooth';
    } else if (pressedKeys["4"]) {
      wave = 'triangle';
    }

    let step = h / 30;

    for (let e of keyboardEvents) {

        let start = timestamp - e.timestamp;
        let length;
        if (e.release === false) {
            length = timestamp - e.timestamp;
        } else {
            length = e.release - e.timestamp;
        }

        let x = w - start * speed;

        if (x + length < 0) continue;

        let y = h - e.key.position * 2 * step + step/2;

        if (e.key.sharp) {
            context.fillStyle = 'black';
            y -= step;
        } else {
            context.fillStyle = 'white';
        }

        context.fillRect(x, y, length * speed, step);

        context.fillStyle = 'red';
        context.font = '30px Arial';
        context.textAlign = 'left';
        context.textBaseline  = 'top';
        context.fillText(e.key.note, x+2, y+2);

    }

    window.requestAnimationFrame(frame);

}
