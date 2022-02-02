gsap.registerPlugin(Physics2DPlugin, CustomEase);
const gameSpace = document.querySelector('.game_space');

const gameBoard = document.querySelector('#game_board');

const gameEl = document.querySelector('#game-elements');

const pigeon1 = document.querySelector('#pigeon1');

const pigeon2 = document.querySelector('#pigeon2');

const pigeons = document.querySelectorAll('.pigeon-disc');

const gameScoreDisp = document.querySelector('#score');

const roundDisp = document.querySelector('#round');

const bulletDisp = document.querySelectorAll('.bullet');

const circles = gsap.utils.toArray('.circle');

const pex = document.querySelectorAll('.pex');
const pexGroup = document.querySelector('#pigeon-explode');
const pointsDis = document.querySelector('#points-display');
const points2 = document.querySelector('#points2');

const physics = { velocity: 455, angle: -90, gravity: 200 };

let p1Anim, p2Anim, p1Circle, p2Circle, hit1, hit2, circle1, circle2;

const gameState = {
  round: {
    number: 1,
    hits: 0,
    disc: 0,
    flight: {
      number: 0,
      bullets: 3,
      hits: 0,
      score: [],
    },
  },
  score: 0,
};

function pad(num, size) {
  num = num.toString();
  while (num.length < size) num = '0' + num;
  return num;
}

function getOutline(el) {
  let obj = {};
  let box = el.getBoundingClientRect();
  obj.left = box['x'];
  obj.top = box['y'];
  obj.width = box['width'];
  obj.height = box['height'];
  return obj;
}

function reset(el) {
  let tl = gsap.timeline();
  tl.set(el, {
    opacity: 0,
    x: 0,
    y: 0,
    transformOrigin: '50% 50%',
    scaleX: 0,
    scaleY: 0,
  });
  return tl;
}

function pigeonExp(xPos, yPos) {
  let fac = 15;
  let x = [1, 2, 2, 1, -1, -2, -2, -1];
  let y = [-2, -1, 1, 2, 2, 1, -1, -2];
  let tl = gsap.timeline();
  tl.set(pexGroup, { x: xPos, y: yPos, opacity: '100%' });
  // tl.add('start', 0.1);
  [...pex].forEach((pex, i) => {
    tl.to(
      pex,
      {
        duration: 0.25,
        x: x[i] * fac,
        y: y[i] * fac,
        ease: 'power2.out',
      },
      'start'
    );
  });
  tl.set(pexGroup, { opacity: 0 });
  [...pex].forEach((pex, i) => {
    tl.set(pex, {
      x: 0,
      y: 0,
      ease: 'power2.out',
    });
  });
  return tl;
}

function hitScore(xPos, yPos) {
  let points = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  points.style.fill = '#fff';
  points.classList.add('points');
  points.textContent =
    gameState.round.flight.score[gameState.round.flight.hits - 1];
  pointsDis.appendChild(points);
  let tl = gsap.timeline();
  tl.set(points, { opacity: '100%', x: xPos, y: yPos }).set(
    points,
    { opacity: 0 },
    '+=.75'
  );
  return tl;
}

function send(pigeon, time) {
  let tl = gsap.timeline();
  tl.set(pigeon, { scale: 1.5, opacity: '100%', x: 'random(-15, 15)', y: 10 })
    .to(pigeon, { duration: 4, physics2D: physics })
    .to(
      pigeon,
      {
        scale: 0.25,
        duration: 4,
        ease: 'power2.out',
      },
      `-=${4}`
    )
    .to(pigeon, { x: 'random(-200, 400)', duration: 4 }, `-=${4}`);
  return tl.timeScale(time);
}

function sendPigeon(p, time = 1) {
  let tl = gsap.timeline({ paused: true });
  tl.add(reset(p)).add(send(p, time)).add(reset(p));
  return tl;
}

function sendPigeon1(time = 1) {
  let pigeon = sendPigeon(pigeon1, time);
  pigeon.restart();
  fxSounds.beep1.play();
  fxSounds.fly1.play();
  setTimeout(function () {
    fxSounds.fly1.stop();
  }, 4000 / time);
  return pigeon;
}

function sendPigeon2(time = 1) {
  let pigeon = sendPigeon(pigeon2, time);
  pigeon.restart();
  fxSounds.beep2.play();
  fxSounds.fly2.play();
  setTimeout(function () {
    fxSounds.fly2.stop();
  }, 4000 / time);
  return pigeon;
}

function blink(circle) {
  let tl = gsap.timeline();
  tl.set(
    circle,
    {
      opacity: 0,
    },
    '+=.25'
  ).set(circle, { opacity: '100%' }, '+=.25');
  return tl.repeat(-1);
}

function mark(circle, hit) {
  gsap.set(circle, { opacity: '100%' });
  hit
    ? (circle.firstElementChild.style.fill = '#da2f18')
    : (circle.firstElementChild.style.fill = '#ffffff');
}

function sendFlight(time = 1) {
  let ran = gsap.utils.snap(0.25, Math.random());
  ran = ran * 1000;
  p1Anim = sendPigeon1(time);
  flying.p1 = true;
  hit1 = false;
  circle1 = circles[gameState.round.disc];
  p1Circle = blink(circle1);
  gameState.round.disc += 1;
  p1Anim.eventCallback('onComplete', pigeonDone, ['p1']);
  setTimeout(function () {
    p2Anim = sendPigeon2(time);
    flying.p2 = true;
    hit2 = false;
    circle2 = circles[gameState.round.disc];
    p2Circle = blink(circle2).delay(ran === 250 || ran === 750 ? 0.25 : 0);
    gameState.round.disc += 1;
    p2Anim.eventCallback('onComplete', pigeonDone, ['p2']);
  }, ran);
}

function gameClickHandler(e) {
  gameState.round.flight.bullets -= 1;
  if (gameState.round.flight.bullets >= 0) {
    bulletDisp[gameState.round.flight.bullets].style.opacity = 0;
    if (e.target.dataset.pigeonDisc) {
      setFlightData(e.target);
      hit(e.target.parentNode);
    } else {
      fxSounds.shot.play();
    }
  } else {
    gameSpace.removeEventListener('click', gameClickHandler);
  }
}

function resetFlightData() {
  hit1 = false;
  hit2 = false;
  while (pointsDis.firstChild) {
    pointsDis.removeChild(pointsDis.firstChild);
  }
  gameState.round.flight.number += 1;
  gameState.round.flight.bullets = 3;
  gameState.round.flight.hits = 0;
  gameState.round.flight.score = [];
  for (let bullet of bulletDisp) {
    bullet.style.opacity = '100%';
  }
}

function setFlightData(pigeon) {
  gameBoardSize = getOutline(gameBoard);
  pigeonSize = getOutline(pigeon);
  pigeonRatio = pigeonSize.width / gameBoardSize.width;
  gameState.round.flight.hits += 1;
  if (pigeonRatio < 0.1) {
    gameState.round.flight.score.push(1500);
    gameState.score += 1500;
  } else {
    gameState.round.flight.score.push(1000);
    gameState.score += 1000;
  }
  gameScoreDisp.textContent = pad(gameState.score, 6);
}

function hit(pigeon) {
  fxSounds.hit.play();
  let pos = getBBox(pigeon, false);
  if (pigeon.dataset.pigeon === '1') {
    let p1Pos = getBBox(pigeon1, false);
    hit1 = true;
    fxSounds.fly1.stop();
    p1Anim.clear().add(reset(pigeon));
  } else {
    let p2Pos = getBBox(pigeon2, false);
    hit2 = true;
    fxSounds.fly2.stop();
    p2Anim.clear().add(reset(pigeon));
  }
  pigeonExp(pos.cx, pos.cy).add(hitScore(pos.cx, pos.cy), '+=.5');
}

function round() {
  if (gameState.round.flight.number < 5) {
    //round continues
    setTimeout(function () {
      resetFlightData();
      gameSpace.addEventListener('click', gameClickHandler);
      sendFlight(1.1);
    }, 3000);
  } else {
    //round finishes
    gameState.round.number += 1;
    roundDisp.textContent = `R=${gameState.round.number}`;
    gameState.round.flight.number = 0;
    gameState.round.hits = 0;
    gameState.round.flight.score = [];
  }
}

let flying = {
  p1: false,
  p2: false,
};

function pigeonDone(p) {
  if (p === 'p1') {
    p1Circle.clear();
    p1Circle.call(mark, [circle1, hit1]);
  } else {
    p2Circle.clear();
    p2Circle.call(mark, [circle2, hit2]);
  }
  flying[p] = false;
  if (!flying.p1 && !flying.p2) {
    round();
  }
}

function loadAudio() {
  context = new (window.AudioContext || window.webkitAudioContext)();
  buffer = new Buffer(context, sounds);
  fxSounds = {};
  fxSound = buffer.getBuffer();
}

async function init() {
  document
    .querySelector('#notification-go')
    .addEventListener('click', function () {
      loadAudio();
      this.style.visibility = 'hidden';
      round();
    });
}

init();
