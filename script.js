const board = document.querySelector('#gameBoard');
const snakeLayer = document.querySelector('#snakeLayer');
const foodLayer = document.querySelector('#foodLayer');
const wallsLayer = document.querySelector('#wallsLayer');
const scoreElement = document.querySelector('#score');
const targetElement = document.querySelector('#target');
const overlay = document.querySelector('#gameOverlay');
const overlayEyebrow = document.querySelector('#overlayEyebrow');
const overlayTitle = document.querySelector('#overlayTitle');
const overlayText = document.querySelector('#overlayText');
const overlayIcon = document.querySelector('#overlayIcon');
const replayButton = document.querySelector('#replayButton');
const nextButton = document.querySelector('#nextButton');
const statusText = document.querySelector('#statusText');
const gameBoard = document.querySelector('#gameBoard');
const gameTip = document.querySelector('.game-tip');
const quizPanel = document.querySelector('#quizPanel');
const questionNumber = document.querySelector('#questionNumber');
const questionText = document.querySelector('#questionText');
const answers = document.querySelector('#answers');
const quizResult = document.querySelector('#quizResult');
const quizEyebrow = document.querySelector('#quizEyebrow');
const quizActions = document.querySelector('#quizActions');
const quizReplay = document.querySelector('#quizReplay');
const quizNext = document.querySelector('#quizNext');
const prizePanel = document.querySelector('#prizePanel');
const prizeButtons = document.querySelectorAll('.prize-button');
const tablePrize = document.querySelector('#tablePrize');
const restartAllButton = document.querySelector('#restartAllButton');
const arrowControls = document.querySelectorAll('[data-direction]');

const gridSize = 12;
const levelTwoWalls = [
  { x: 4, y: 2 }, { x: 5, y: 2 }, { x: 6, y: 2 }, { x: 7, y: 2 },
  { x: 2, y: 4 }, { x: 2, y: 5 }, { x: 2, y: 6 }, { x: 2, y: 7 },
  { x: 4, y: 8 }, { x: 5, y: 8 }, { x: 6, y: 8 }, { x: 7, y: 8 },
  { x: 9, y: 4 }, { x: 9, y: 5 }, { x: 9, y: 6 }, { x: 9, y: 7 }
];
const hazards = [{ x: 3, y: 3 }, { x: 8, y: 8 }];
const foodSpots = [
  { x: 1, y: 1 }, { x: 5, y: 1 }, { x: 10, y: 1 }, { x: 1, y: 5 },
  { x: 10, y: 5 }, { x: 5, y: 5 }, { x: 1, y: 10 }, { x: 5, y: 10 },
  { x: 10, y: 10 }, { x: 3, y: 6 }, { x: 8, y: 2 }, { x: 10, y: 7 }
];

let snake;
let direction;
let collected;
let gameOver;
let level;
let questionIndex;

const mathQuestions = [
  { question: 'כמה זה 2 + 3?', answers: [4, 5, 6, 7], correct: 5 },
  { question: 'כמה זה 7 - 2?', answers: [3, 4, 5, 6], correct: 5 },
  { question: 'כמה זה 3 + 4?', answers: [6, 7, 8, 9], correct: 7 },
  { question: 'כמה זה 10 - 3?', answers: [6, 7, 8, 9], correct: 7 },
  { question: 'כמה זה 2 + 2?', answers: [3, 4, 5, 6], correct: 4 }
];
const riddleQuestions = [
  { question: 'מה נותן אור ביום?', answers: ['השמש', 'הירח', 'הכיסא', 'הנעל'], correct: 'השמש' },
  { question: 'איזו חיה אומרת מיאו?', answers: ['כלב', 'חתול', 'פרה', 'דג'], correct: 'חתול' },
  { question: 'מה שותים כשצמאים?', answers: ['מים', 'חול', 'נייר', 'אבן'], correct: 'מים' },
  { question: 'מה יש לנו שתי יחידות כדי לראות?', answers: ['אוזניים', 'ידיים', 'עיניים', 'כובעים'], correct: 'עיניים' },
  { question: 'מה צבע הדשא בדרך כלל?', answers: ['כחול', 'ירוק', 'סגול', 'ורוד'], correct: 'ירוק' }
];
let activeQuestions = mathQuestions;
let audioContext;

function playVictorySound() {
  audioContext ??= new AudioContext();
  if (audioContext.state === 'suspended') audioContext.resume();
  const now = audioContext.currentTime;
  [523, 659, 784, 1047].forEach((frequency, index) => {
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    oscillator.type = 'triangle';
    oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(0.001, now + index * 0.13);
    gain.gain.exponentialRampToValueAtTime(0.22, now + index * 0.13 + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.001, now + index * 0.13 + 0.42);
    oscillator.connect(gain).connect(audioContext.destination);
    oscillator.start(now + index * 0.13);
    oscillator.stop(now + index * 0.13 + 0.45);
  });
}

function samePosition(first, second) {
  return first.x === second.x && first.y === second.y;
}

function positionStyle(position) {
  return { left: `${(position.x + 0.5) * (100 / gridSize)}%`, top: `${(position.y + 0.5) * (100 / gridSize)}%` };
}

function render() {
  wallsLayer.replaceChildren();
  if (level === 2) {
    levelTwoWalls.forEach((wall) => {
      const element = document.createElement('div');
      element.className = 'wall';
      Object.assign(element.style, { left: `${wall.x * (100 / gridSize)}%`, top: `${wall.y * (100 / gridSize)}%` });
      wallsLayer.append(element);
    });
  }
  snakeLayer.replaceChildren();
  snake.forEach((segment, index) => {
    const element = document.createElement('div');
    element.className = `snake-segment${index === 0 ? ' head' : ''}`;
    Object.assign(element.style, positionStyle(segment));
    snakeLayer.append(element);
  });
  foodLayer.replaceChildren();
  foodSpots.filter((food) => !collected.includes(food)).forEach((food) => {
    const element = document.createElement('div');
    element.className = 'food';
    Object.assign(element.style, positionStyle(food));
    foodLayer.append(element);
  });
  scoreElement.textContent = String(collected.length).padStart(2, '0');
  targetElement.textContent = `מתוך ${foodSpots.length}`;
}

function endGame(won, reason = 'hazard') {
  gameOver = true;
  overlay.hidden = false;
  overlayEyebrow.textContent = won ? 'כל הכבוד!' : 'נפסלתם';
  const lossTitles = {
    hazard: 'אוי, נגעתם בכדור אדום',
    wall: 'אוי, נגעתם בקיר',
    edge: 'אוי, יצאתם מהמסלול',
    self: 'אוי, הנחש נגע בעצמו'
  };
  overlayTitle.textContent = won ? 'אספתם את כל הנקודות' : lossTitles[reason];
  overlayText.textContent = won
    ? 'תרצה לעשות עוד פעם או שתרצה לעבור לשלב הבא?'
    : `הניקוד שלכם: ${String(collected.length).padStart(2, '0')}`;
  overlayIcon.textContent = won ? '★' : '×';
  nextButton.hidden = !won;
  statusText.textContent = won ? 'ניצחון!' : 'המשחק הסתיים';
  document.querySelector('.status-dot').style.background = won ? '#4daa65' : 'var(--coral)';
}

function showQuestion() {
  const current = activeQuestions[questionIndex];
  questionNumber.textContent = `שאלה ${questionIndex + 1} מתוך ${activeQuestions.length}`;
  questionText.textContent = current.question;
  quizResult.textContent = '';
  quizResult.classList.remove('wrong');
  quizActions.hidden = true;
  answers.replaceChildren();
  current.answers.forEach((answer) => {
    const button = document.createElement('button');
    button.className = 'answer-button';
    button.type = 'button';
    button.textContent = answer;
    button.addEventListener('click', () => answerQuestion(answer));
    answers.append(button);
  });
}

function startQuiz() {
  level = 3;
  gameBoard.hidden = true;
  gameTip.hidden = true;
  quizPanel.hidden = false;
  quizEyebrow.textContent = 'MATH LAB / 003';
  statusText.textContent = 'שלב 3: מתמטיקה';
  activeQuestions = mathQuestions;
  questionIndex = 0;
  showQuestion();
}

function answerQuestion(answer) {
  const current = activeQuestions[questionIndex];
  if (answer !== current.correct) {
    quizResult.textContent = 'לא בדיוק. נפסלתם, נסו שוב!';
    quizResult.classList.add('wrong');
    return;
  }
  questionIndex += 1;
  if (questionIndex === activeQuestions.length) {
    questionNumber.textContent = `סיימתם ${activeQuestions.length} מתוך ${activeQuestions.length}`;
    questionText.textContent = 'כל הכבוד!';
    answers.replaceChildren();
    quizResult.textContent = level === 3 ? 'סיימתם את שלב המתמטיקה!' : 'סיימתם את כל החידות!';
    quizActions.hidden = false;
    quizNext.hidden = false;
    quizNext.textContent = level === 3 ? 'תרצו לעבור לשלב הבא →' : 'לבחור פרס →';
    statusText.textContent = level === 3 ? 'שלב 3 הושלם!' : 'כל השלבים הושלמו!';
    return;
  }
  showQuestion();
}

function startRiddles() {
  level = 4;
  quizEyebrow.textContent = 'RIDDLE LAB / 004';
  statusText.textContent = 'שלב 4: חידות';
  activeQuestions = riddleQuestions;
  questionIndex = 0;
  showQuestion();
}

function restartCurrentLevel() {
  if (level === 3) {
    startQuiz();
  } else if (level === 4) {
    startRiddles();
  } else {
    startLevel();
  }
}

function startPrizeStage() {
  level = 5;
  quizPanel.hidden = true;
  gameBoard.hidden = true;
  gameTip.hidden = true;
  prizePanel.hidden = false;
  statusText.textContent = 'שלב 5: בחירת פרס';
  tablePrize.textContent = 'הפרס מחכה למטה על השולחן';
  prizeButtons.forEach((button) => button.classList.remove('selected'));
  playVictorySound();
}

function choosePrize(prize, button) {
  prizeButtons.forEach((item) => item.classList.remove('selected'));
  button.classList.add('selected');
  tablePrize.textContent = `הפרס ${prize} מחכה למטה על השולחן!`;
  statusText.textContent = `בחרתם: ${prize}`;
}

function tick() {
  if (gameOver) return;
  const head = { x: snake[0].x + direction.x, y: snake[0].y + direction.y };
  const hitWall = head.x < 0 || head.x >= gridSize || head.y < 0 || head.y >= gridSize;
  const hitSelf = snake.some((segment) => samePosition(segment, head));
  const hitHazard = hazards.some((hazard) => samePosition(hazard, head));
  const hitMazeWall = level === 2 && levelTwoWalls.some((wall) => samePosition(wall, head));
  if (hitHazard) { endGame(false, 'hazard'); return; }
  if (hitMazeWall) { endGame(false, 'wall'); return; }
  if (hitSelf) { endGame(false, 'self'); return; }
  if (hitWall) { endGame(false, 'edge'); return; }
  snake.unshift(head);
  const food = foodSpots.find((spot) => samePosition(spot, head) && !collected.includes(spot));
  if (food) {
    collected.push(food);
    if (collected.length === foodSpots.length) { render(); endGame(true); return; }
  } else {
    snake.pop();
  }
  render();
}

function setDirection(newDirection) {
  direction = newDirection;
  return true;
}

function resetGame() {
  level = 1;
  gameBoard.hidden = false;
  gameTip.hidden = false;
  quizPanel.hidden = true;
  quizActions.hidden = true;
  prizePanel.hidden = true;
  startLevel();
}

function startLevel() {
  snake = level === 2 ? [{ x: 1, y: 11 }] : [{ x: 6, y: 6 }];
  direction = { x: 1, y: 0 };
  collected = [];
  gameOver = false;
  overlay.hidden = true;
  nextButton.hidden = true;
  statusText.textContent = 'משחק פעיל';
  document.querySelector('.status-dot').style.background = '#4daa65';
  render();
  board.focus();
}

function startNextLevel() {
  if (level === 1) {
    level = 2;
    startLevel();
  } else if (level === 2) {
    startQuiz();
  } else {
    startPrizeStage();
  }
}

const directions = { ArrowUp: { x: 0, y: -1 }, ArrowDown: { x: 0, y: 1 }, ArrowLeft: { x: -1, y: 0 }, ArrowRight: { x: 1, y: 0 } };

function moveWithDirection(key) {
  if (gameOver || level > 2 || !directions[key]) return;
  if (setDirection(directions[key])) tick();
}

function getBoardDirection(clientX, clientY) {
  const bounds = board.getBoundingClientRect();
  const offsetX = clientX - (bounds.left + bounds.width / 2);
  const offsetY = clientY - (bounds.top + bounds.height / 2);
  if (Math.abs(offsetX) > Math.abs(offsetY)) return offsetX < 0 ? 'ArrowLeft' : 'ArrowRight';
  return offsetY < 0 ? 'ArrowUp' : 'ArrowDown';
}

document.addEventListener('keydown', (event) => {
  if (!directions[event.key]) return;
  event.preventDefault();
  moveWithDirection(event.key);
});
board.addEventListener('pointerdown', (event) => {
  if (event.pointerType === 'touch' || event.target.closest('button')) return;
  event.preventDefault();
  moveWithDirection(getBoardDirection(event.clientX, event.clientY));
});
board.addEventListener('touchstart', (event) => {
  if (event.target.closest('button')) return;
  const touch = event.changedTouches[0];
  if (!touch) return;
  event.preventDefault();
  moveWithDirection(getBoardDirection(touch.clientX, touch.clientY));
}, { passive: false });
arrowControls.forEach((button) => button.addEventListener('click', () => moveWithDirection(button.dataset.direction)));
replayButton.addEventListener('click', restartCurrentLevel);
nextButton.addEventListener('click', startNextLevel);
quizReplay.addEventListener('click', () => {
  questionIndex = 0;
  showQuestion();
});
quizNext.addEventListener('click', () => {
  if (level === 3) startRiddles();
  else startPrizeStage();
});
prizeButtons.forEach((button) => button.addEventListener('click', () => choosePrize(button.dataset.prize, button)));
restartAllButton.addEventListener('click', resetGame);
resetGame();
