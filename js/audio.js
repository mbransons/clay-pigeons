class Fx {
  constructor(context, buffer) {
    this.context = context;
    this.buffer = buffer;
  }

  setup() {
    this.gainNode = this.context.createGain();
    this.source = this.context.createBufferSource();
    this.source.buffer = this.buffer;
    this.source.connect(this.gainNode);
    this.gainNode.connect(this.context.destination);

    this.gainNode.gain.setValueAtTime(0.8, this.context.currentTime);
  }

  play() {
    this.setup();
    this.source.start(this.context.currentTime);
  }

  stop() {
    var ct = this.context.currentTime + 0.5;
    this.gainNode.gain.exponentialRampToValueAtTime(0.001, ct);
    this.source.stop(ct);
  }
}

class Buffer {
  constructor(context, urls) {
    this.context = context;
    this.urls = urls;
    this.buffer = {};
  }

  loadSound(url, key) {
    let request = new XMLHttpRequest();
    request.open('get', url, true);
    request.responseType = 'arraybuffer';
    let thisBuffer = this;
    request.onload = function () {
      thisBuffer.context
        .decodeAudioData(request.response)
        .then(function (buffer) {
          thisBuffer.buffer[key] = buffer;
          return buffer;
        })
        .then(function (buffer) {
          fxSounds[key] = new Fx(context, buffer);
        });
    };
    request.send();
  }

  getBuffer() {
    let thisUrls = this.urls;
    for (let key in thisUrls) {
      this.loadSound(thisUrls[key], key);
    }
  }

  loaded() {
    //   document.querySelector('.loading').style.opacity = 0;
    //   document.querySelector('.loading').style.height = 0;
    //   document.querySelector('.notes').style.height = "auto";
    //   document.querySelector('.notes').style.opacity = 1;
    loaded = true;
  }

  getSound(key) {
    return this.buffer[key];
  }
}

// let progressBar = document.querySelector('.progress');
// let iteration = 0;

// function updateProgress(total) {
//   progressBar.style.width = 175 - (++iteration / total) * 175;
// }

let fx = null;
let preset = 0;
let loaded = false;

let sounds = {
  beep1: './audio/disc-beep1.mp3',
  fly1: './audio/disc-fly1.mp3',
  beep2: './audio/disc-beep2.mp3',
  fly2: './audio/disc-fly2.mp3',
  hit: './audio/disc-hit.mp3',
  shot: './audio/gunshot.mp3',
};

let context, buffer, fxSound;
let fxSounds = {};

// function init() {
//   let ready = buffer.loaded();
// }

//   let buttons = document.querySelectorAll('.notes .note');
//   buttons.forEach(button => {
//     button.addEventListener('mouseenter', playGuitar.bind(button));
//     button.addEventListener('mouseleave', stopGuitar);
//   })
