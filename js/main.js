/*--------- CONSTANTS ---------*/

const ships = [
  {
    size: 5,
    horizontal: true,
    img: '',
  },
  {
    size: 4,
    horizontal: true,
    img: '',
  },
  {
    size: 3,
    horizontal: true,
    img: '',
  },
  {
    size: 3,
    horizontal: true,
    img: '',
  },
  {
    size: 2,
    horizontal: true,
    img: '',
  },
  {
    size: 2,
    horizontal: true,
    img: '',
  },
];

const sounds = {
  jet: 'assets/sounds/fly-by-01.wav',
  explosion: 'assets/sounds/explosion-01.mp3',
  splash: 'assets/sounds/splash.wav',
};

const audioPlayer = new Audio();
const explosionPlayer = new Audio();
const splashPlayer = new Audio();

/*--------- APP STATE ---------*/

let game = {
  myTurn: true,
  aiTurn: false,
  mobile: false,
};
let user = {
  cells: [],
  ships: [...ships],
  horizontal: true,
  hovered: [],
  taken: '',
  cellSelected: -1,
};
let ai = {
  cells: [],
  ships: [...ships],
  hp: 19,
  hits: [],
  horizontal: false,
  startPostv: true,
  firstDir: true,
  shots: [],
};

/*--------- DOM ELEMENTS ---------*/

const userBoard = document.querySelector('.user-board');
const aiBoard = document.querySelector('.ai-board');
const menuBoard = document.querySelector('.menu-board');
const mainEl = document.querySelector('main');
const boardMsg = document.querySelector('body > h2');
const messageBanner = document.getElementById('message');
const menu = document.getElementById('menu');
const menuBtn = document.querySelector('#menu h2');

let userGrid = [];
let aiGrid = [];
let menuGrid = [];

const flipBtn = document.getElementById('horizontal-btn');
const toggleBtn = document.getElementById('toggle');
const aiBtn = document.getElementById('fire-btn');

const jet = document.querySelector('.jet');

/*--------- EVENT LISTENERS ---------*/
menuBtn.addEventListener('click', toggleMenu);

userBoard.addEventListener('click', prePlacePiece);
aiBoard.addEventListener('click', selectCell);
aiBtn.addEventListener('click', handleFireBtn);

/*------------------------------------- FUNCTIONS -------------------------------------------*/

/*--------- GAME START ---------*/

function initGame() {
  initBoard(userBoard);
  initBoard(aiBoard);
  initBoard(menuBoard);
  aiPlaceShips();
  if (window.innerWidth <= 800) {
    game.mobile = true;
  } else {
    aiBtn.textContent = 'Rotate';
  }
}

function initBoard(obj) {
  for (let i = 0; i < 100; i++) {
    let cell = document.createElement('div');
    cell.className = 'cell';
    cell.id = i;
    if (obj === userBoard) {
      user.cells.push({ revealed: false, contents: null, id: i });
      cell.addEventListener('mouseenter', mouseEnter);
      cell.addEventListener('mouseleave', mouseLeave);
      userGrid.push(cell);
    } else if (obj === menuBoard) {
      menuGrid.push(cell);
    } else {
      cell.addEventListener('mouseenter', aiMouseEnter);
      cell.addEventListener('mouseleave', aiMouseLeave);
      ai.cells.push({ revealed: false, contents: null, id: i });
      aiGrid.push(cell);
    }
    obj.appendChild(cell);
  }
}

function renderGrid(grid) {
  grid.forEach((cell, i) => {
    let piece = document.createElement('div');
    if (grid === aiGrid) {
      if (ai.cells[i].contents !== null) {
        piece.className = ai.cells[i].contents;
        cell.appendChild(piece);
      }
    } else {
      if (user.cells[i] !== null) {
        piece.className = ai.cells[i].contents;
        cell.appendChild(piece);
      }
    }
  });
}

function startGame() {
  aiBtn.textContent = 'FIRE';
  displayMessageBanner('YOUR TURN!');
  userGrid.forEach(cell => {
    cell.removeEventListener('mouseenter', mouseEnter);
    cell.removeEventListener('mouseleave', mouseLeave);
  });
  if (!game.mobile) {
    aiBtn.style.display = 'none';
  }
  toggle();
}

/*--------- HANDLE EVENTS ---------*/

function toggle(e) {
  userBoard.classList.toggle('hidden');
  aiBoard.classList.toggle('hidden');
  boardMsg.textContent =
    boardMsg.textContent === "USER'S BOARD" ? "COMPUTER'S BOARD" : "USER'S BOARD";
}

function mouseEnter(e) {
  //if target is far enough away from edge for piece to fit, toogle good class
  //else toggle bad class
  if (game.mobile) return;
  if (user.horizontal) {
    for (let i = 0; i < user.ships[0].size; i++) {
      user.hovered.push(parseInt(e.target.id) + i);
    }
  } else {
    for (let i = 0; i < user.ships[0].size; i++) {
      user.hovered.push(parseInt(e.target.id) + i * 10);
    }
  }
  user.taken = checkTaken(user.hovered, user) ? 'hoveredRed' : 'hoveredGreen';
  renderUserCells(user.hovered);
}

function mouseLeave(target) {
  //if target is far enough away from edge for piece to fit, toogle good class
  //else toggle bad class
  if (game.mobile) return;
  let temp = user.hovered.filter(c => c < 100);
  temp.forEach(cell => {
    userGrid[cell].classList.remove('hoveredGreen');
    userGrid[cell].classList.remove('hoveredRed');
  });
  user.hovered = [];
}

function aiMouseEnter(e) {
  if (game.mobile) return;
  if (!ai.cells[e.target.id].revealed) {
    e.target.classList.add('ai-hover');
  }
}

function aiMouseLeave(e) {
  if (!game.mobile) {
    e.target.classList.remove('ai-hover');
  }
}

function prePlacePiece(e) {
  if (!e.target.className.split(' ').includes('cell')) return;
  if (game.mobile) {
    if (parseInt(e.target.id) === user.hovered[0]) {
      user.horizontal = user.horizontal ? false : true;
      return showHover();
    }
    showHover();
    function showHover() {
      if (user.hovered.length > 0) {
        user.hovered.forEach(cell => {
          userGrid[cell].classList.remove('hoveredRed');
          userGrid[cell].classList.remove('hoveredGreen');
        });
      }
      user.hovered = [];
      if (user.horizontal) {
        for (let i = 0; i < user.ships[0].size; i++) {
          user.hovered.push(parseInt(e.target.id) + i);
        }
      } else {
        for (let i = 0; i < user.ships[0].size; i++) {
          user.hovered.push(parseInt(e.target.id) + i * 10);
        }
      }
      user.taken = checkTaken(user.hovered, user) ? 'hoveredRed' : 'hoveredGreen';
      renderUserCells(user.hovered);
    }
  } else {
    placePiece();
  }
}

function placePiece(cell) {
  //updates userGrid to show where the pieces are
  //store the size of the ship in each cell
  if (user.taken === 'hoveredGreen' && user.hovered.length > 0) {
    user.hovered.forEach((cell, i) => {
      let ship = document.createElement('img');
      let menuShip = document.createElement('img');
      let shipPiece = '';
      if (i === 0) {
        shipPiece = 'front';
      } else if (i === user.hovered.length - 1) {
        shipPiece = 'end';
      } else {
        shipPiece = `piece-${i + 1}`;
      }
      if (!user.horizontal) {
        shipPiece = 'vert-' + shipPiece;
      } else {
        shipPiece = 'hor-' + shipPiece;
      }
      ship.src = `assets/ships/${shipPiece}.png`;
      menuShip.src = `assets/ships/${shipPiece}.png`;
      userGrid[cell].appendChild(ship);
      menuGrid[cell].appendChild(menuShip);
      user.cells[cell].contents = 'ship';
    });
    user.ships.shift();
    if (user.ships.length === 0) {
      startGame();
    }
    user.hovered.forEach(cell => {
      userGrid[cell].classList.remove('hoveredRed');
      userGrid[cell].classList.remove('hoveredGreen');
    });
    user.hovered = [];
  }
}

function renderUserCells(cells) {
  let newCells = cells.filter(c => c < 100);
  // if ()
  if (newCells.length !== cells.length) {
    user.taken = 'hoveredRed';
  }
  newCells.forEach(cell => {
    userGrid[cell].classList.add(user.taken);
  });
}

/*--------- USER FUNCTIONS ---------*/

function handleFireBtn(e) {
  if (game.mobile) {
    if (user.ships.length > 0) {
      placePiece(user.cellSelected);
    } else {
      fire(user.cellSelected);
    }
  } else {
    user.horizontal = user.horizontal ? false : true;
  }
}

function selectCell(e) {
  let cell = e.target;
  if (!cell.classList.value.split(' ').includes('cell')) return;
  if (!game.mobile) return fire(cell.id);
  let targetEl = document.createElement('img');
  targetEl.src = 'assets/target-01.svg';
  targetEl.id = 'cross-hairs';
  let oldTarget = document.getElementById('cross-hairs');
  console.log(oldTarget);
  if (user.cellSelected >= 0 && oldTarget !== null)
    aiGrid[user.cellSelected].removeChild(oldTarget);
  console.log(user.cellSelected, cell.id);
  aiGrid[cell.id].appendChild(targetEl);
  user.cellSelected = cell.id;
}

function fire(cell) {
  //checks aiGrid
  if (!game.myTurn || ai.hp < 1) {
    return;
  }

  let oldTarget = document.getElementById('cross-hairs');
  if (user.cellSelected >= 0) aiGrid[user.cellSelected].removeChild(oldTarget);

  let id = cell;
  if (!ai.cells[id].revealed) {
    if (ai.cells[id].contents === 'ship') {
      //show hit on grid
      ai.cells[id].contents = 'hit';
      renderAiCell(id, 'hit');
      ai.hp--;
    } else {
      //show miss
      ai.cells[id].contents = 'miss';
      renderAiCell(id, 'miss');
      game.myTurn = false;
      setTimeout(startAiTurn, 1000);
    }
    ai.cells[id].revealed = true;
    if (ai.hp < 1) displayWinner('user');
  } else {
    return;
  }
}

function renderAiCell(cell, clss) {
  let piece = document.createElement('div');
  piece.className = clss;
  aiGrid[cell].appendChild(piece);
}

function showAi() {
  ai.cells.forEach((cell, i) => {
    if (cell.contents === 'ship') {
      let piece = document.createElement('div');
      piece.classList.add('ship');
      aiGrid[i].appendChild(piece);
    }
  });
}

/*--------- AI FUNCTIONS ---------*/

function aiPlaceShips() {
  //randomly places ai pieces
  ai.ships.forEach((ship, index) => {
    let cells = [];
    cells = randomRoot(ship);
    let taken = checkTaken(cells, ai);
    while (taken) {
      cells = randomRoot(ship);
      taken = checkTaken(cells, ai);
    }
    cells.forEach(c => {
      if (ai.cells[c].contents !== null) {
      } else {
        cells.forEach(c => {
          ai.cells[c].contents = 'ship';
        });
        ships.shift();
      }
    });
  });
  function randomRoot(s) {
    let temp = [];
    let horizontal = Math.random() > 0.5 ? true : false;
    let root = Math.floor(Math.random() * 100);
    if (horizontal) {
      for (let i = 0; i < s.size; i++) {
        temp.push(root + i);
      }
    } else {
      for (let i = 0; i < s.size; i++) {
        temp.push(root + i * 10);
      }
    }
    return temp;
  }
}

function checkTaken(cs, who) {
  let noGood = false;
  if (
    cs[0] % 10 !== cs[cs.length - 1] % 10 &&
    Math.floor(cs[0] / 10) !== Math.floor(cs[cs.length - 1] / 10)
  ) {
    noGood = true;
  }
  cs.forEach(c => {
    if (c > 99 || who.cells[c].contents !== null) {
      noGood = true;
    }
  });
  if (noGood) {
    return true;
  }
  return false;
}

function changeHorizontal() {
  //changes if the current piece is horizontal or not
  pieces[0].horizontal ? (pieces[0].horizontal = false) : (pieces[0].horizontal = true);
}

function aiFire(e) {
  if (user.hp > 1) {
    return displayWinner('computer');
  }
  let cell = aiPickTarget();

  //for debugging
  if (typeof e === 'number') {
    cell = e;
  }

  user.cells[cell].revealed = true;
  ai.shots.push(cell);
  if (user.cells[cell].contents === 'ship') {
    user.hp--;
    if (ai.firstDir) {
      ai.hits.push(cell);
    } else {
      ai.hits.unshift(cell);
    }
    aiFire();
  } else {
    if (ai.hits.length > 1) {
      ai.firstDir = false;
    }
    console.log(ai.shots);
    flyBy(ai.shots[0]);
    setTimeout(() => aiAnimateShots(cell), 1000);
    game.aiTurn = false;
  }
}

function aiPickTarget() {
  let options = [];
  if (ai.hits.length === 0) {
    return randomCell();
  } else if (ai.hits.length === 1) {
    options = adjacent(ai.hits[0]);
    if (options.length > 0) {
      let cell = options[Math.floor(Math.random() * options.length)];
      detectOrientation(cell);
      return cell;
    } else {
      ai.hits = [];
      ai.firstDir = true;
      return randomCell();
    }
  } else {
    options = nextInDirection();
    if (options.length === 0 || user.cells[options[0]].revealed) {
      if (ai.firstDir) {
        ai.firstDir = false;
        options = nextInDirection();
        if (options.length === 0 || user.cells[options[0]].revealed) {
          ai.hits = [];
          ai.firstDir = true;
          options = [randomCell()];
        }
      } else {
        ai.hits = [];
        ai.firstDir = true;
        options = [randomCell()];
      }
    }
    return options[0];
  }
}

function randomCell() {
  let cell = Math.floor(Math.random() * 100);
  while (user.cells[cell].revealed) {
    cell = Math.floor(Math.random() * 100);
  }
  return cell;
}

function detectOrientation(cell) {
  if (cell % 10 === ai.hits[0] % 10) {
    ai.horizontal = false;
  } else {
    ai.horizontal = true;
  }
  if (cell > ai.hits[0]) {
    ai.startPostv = true;
  } else {
    ai.startPostv = false;
  }
}

function nextInDirection() {
  let ans = [];
  let num = ai.firstDir ? ai.hits[ai.hits.length - 1] : ai.hits[0];
  let posDir = ai.firstDir ? ai.startPostv : !ai.startPostv;

  if (ai.horizontal) {
    ans = posDir ? [num + 1] : [num - 1];
  } else {
    ans = posDir ? [num + 10] : [num - 10];
  }
  if (aiGrid[ans].contents === 'ships' && aiGrid[ans].revealed) {
    console.log('hee hee');
  }
  return ans.filter(x => x >= 0 && x < 100 && !user.cells[x].revealed);
}

function adjacent(firstHit) {
  let temp = [firstHit + 1, firstHit - 1, firstHit + 10, firstHit - 10];
  let ans = [];

  temp.forEach((x, i) => {
    if (i < 2) {
      if (Math.floor(x / 10) === Math.floor(firstHit / 10)) {
        ans.push(x);
      }
    } else {
      if (x % 10 === firstHit % 10) {
        ans.push(x);
      }
    }
  });
  return ans.filter(x => x >= 0 && x < 100 && !user.cells[x].revealed);
}

/*-----------  MESSAGES -----------*/

function displayMessageBanner(message) {
  messageBanner.innerHTML = `<h2>${message}<h2>`;
  messageBanner.classList.add('showing');
  setTimeout(() => messageBanner.classList.add('out'), 1000);
  setTimeout(() => {
    messageBanner.className = '';
    messageBanner.textContent = '';
  }, 1600);
}

function displayWinner(winner) {}

/*----------- TURN CONTROLLER -------*/

function startAiTurn() {
  // displayMessageBanner("COMPUTER's TURN!");
  toggle();
  game.aiTurn = true;
  aiFire();
}

function aiMove() {
  aiLoopTest(19);
}

function endAiTurn() {
  game.myTurn = true;
  displayMessageBanner('YOUR TURN!');
  toggle();
}

/*--------- ANIMATIONS ---------*/

function aiAnimateShots() {
  if (ai.shots.length <= 0) return setTimeout(endAiTurn, 1000);
  setTimeout(() => {
    let where = userGrid[ai.shots[0]];
    let whereElse = menuGrid[ai.shots[0]];
    let piece = document.createElement('div');
    let menuPiece = document.createElement('div');
    let explosion = document.createElement('img');
    let smoke = document.createElement('img');
    smoke.src = 'assets/explosions/smoke-02.gif';
    explosion.src = 'assets/explosions/transparent-explosions-animated-gif-1.gif';
    smoke.className = 'explosion smoke';
    explosion.className = 'explosion';
    let clss = ai.shots.length === 1 ? 'miss' : 'hit';
    piece.classList.add(clss);
    menuPiece.classList.add(clss);
    where.appendChild(piece);
    whereElse.appendChild(menuPiece);
    if (clss === 'hit') {
      where.appendChild(explosion);
      where.appendChild(smoke);
      playSound('explosion', explosionPlayer);
    } else {
      playSound('splash', splashPlayer);
    }
    setTimeout(() => explosion.classList.add('fade-out'), 600);
    // if (ai.shots.length === 3 || ai.shots.length === 6) {
    //   setTimeout(() => {
    //     console.log(ai.shots);
    //     flyBy(ai.shots[0]);
    //   }, 500);
    // }
    ai.shots.shift();
    return aiAnimateShots();
  }, 500);
}

function flyBy(cell) {
  playSound('jet', audioPlayer);
  let jet = document.createElement('img');
  jet.className = 'jet';
  jet.src = 'assets/Jet01.png';
  let top = 0;
  let row = Math.floor(cell / 10);
  if (row < 2) {
  } else if (row < 4) {
    top = 18;
  } else if (row < 6) {
    top = 37.5;
  } else if (row < 8) {
    top = 56;
  } else {
    top = 75;
  }
  mainEl.appendChild(jet);
  setTimeout(() => (jet.style.top = top + '%'), 0);
  setTimeout(() => jet.classList.toggle('fly-over'), 0);
  setTimeout(() => mainEl.removeChild(jet), 2000);
}

/*-------- AUDIO ------*/

function playSound(name, source) {
  source.src = sounds[name];
  source.play();
}

/*---------- MENU ----------*/

function toggleMenu() {
  menu.classList.toggle('visible');
  menuBtn.classList.toggle('visible');
}

/*-------- ON START ------*/

initGame();
