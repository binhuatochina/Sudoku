// 数独生成与求解工具

// 随机打乱数组顺序
function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

// 检查在指定位置填入数字是否合法
function isSafe(board, row, col, num) {
  for (let x = 0; x < 9; x++) {
    if (board[row][x] === num || board[x][col] === num) return false;
  }
  const startRow = row - row % 3, startCol = col - col % 3;
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      if (board[startRow + i][startCol + j] === num) return false;
    }
  }
  return true;
}

// 递归填充整个数独盘面，生成一个完整解
function fillBoard(board) {
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      if (board[row][col] === 0) {
        let nums = [1,2,3,4,5,6,7,8,9];
        shuffle(nums);
        for (let num of nums) {
          if (isSafe(board, row, col, num)) {
            board[row][col] = num;
            if (fillBoard(board)) return true;
            board[row][col] = 0;
          }
        }
        return false;
      }
    }
  }
  return true;
}

// 深拷贝盘面
function copyBoard(board) {
  return board.map(row => row.slice());
}

// 随机挖空指定数量的格子，生成题目
function removeCells(board, holes) {
  let puzzle = copyBoard(board);
  let count = holes;
  while (count > 0) {
    let r = Math.floor(Math.random() * 9);
    let c = Math.floor(Math.random() * 9);
    if (puzzle[r][c] !== 0) {
      puzzle[r][c] = 0;
      count--;
    }
  }
  return puzzle;
}

// 生成数独题目和解答，支持不同难度
function generateSudoku(difficulty = 'easy') {
  let board = Array.from({length: 9}, () => Array(9).fill(0));
  fillBoard(board);
  let solution = copyBoard(board);
  let holes = difficulty === 'easy' ? 30 : (difficulty === 'medium' ? 40 : 50);
  let puzzle = removeCells(board, holes);
  return { puzzle, solution };
}

// 游戏状态变量
let sudokuData = null; // 当前题目和答案
let selectedCell = null; // 当前选中的格子
let errorCount = 0; // 错误次数
let timer = 0; // 计时秒数
let timerInterval = null; // 计时器
let history = []; // 操作历史（用于撤销）

// 渲染数独棋盘
function renderBoard(puzzle, solution) {
  const board = document.getElementById('sudoku-board');
  board.innerHTML = '';
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      const cell = document.createElement('div');
      cell.className = 'sudoku-cell';
      cell.dataset.row = r;
      cell.dataset.col = c;
      if (puzzle[r][c] !== 0) {
        cell.textContent = puzzle[r][c];
        cell.classList.add('prefilled'); // 预填数字
      } else {
        cell.textContent = '';
      }
      cell.addEventListener('click', () => selectCell(r, c));
      board.appendChild(cell);
    }
  }
}

// 选中某个格子
function selectCell(r, c) {
  if (selectedCell) selectedCell.classList.remove('selected');
  const board = document.getElementById('sudoku-board');
  const idx = r * 9 + c;
  const cell = board.children[idx];
  if (cell.classList.contains('prefilled')) return; // 预填数字不可选
  cell.classList.add('selected');
  selectedCell = cell;
}

// 更新错误计数显示
function updateErrorCount() {
  document.getElementById('error-count').textContent = errorCount;
}

// 更新时间显示
function updateTimer() {
  const min = String(Math.floor(timer/60)).padStart(2, '0');
  const sec = String(timer%60).padStart(2, '0');
  document.getElementById('timer').textContent = `${min}:${sec}`;
}

// 启动计时器
function startTimer() {
  if (timerInterval) clearInterval(timerInterval);
  timer = 0;
  updateTimer();
  timerInterval = setInterval(() => {
    timer++;
    updateTimer();
  }, 1000);
}

// 停止计时器
function stopTimer() {
  if (timerInterval) clearInterval(timerInterval);
}

// 更新数字面板可用状态
function updateNumberPad() {
  const count = Array(10).fill(0); // 1~9
  const board = document.getElementById('sudoku-board');
  for (let i = 0; i < 81; i++) {
    const val = board.children[i].textContent;
    if (val >= '1' && val <= '9') count[+val]++;
  }
  const pad = document.getElementById('number-pad');
  for (let i = 1; i <= 9; i++) {
    const btn = pad.children[i-1];
    if (count[i] >= 9) {
      btn.disabled = true;
      btn.style.background = '#eee';
      btn.style.color = '#aaa';
      btn.style.cursor = 'not-allowed';
    } else {
      btn.disabled = false;
      btn.style.background = '';
      btn.style.color = '';
      btn.style.cursor = '';
    }
  }
}

// 处理数字输入
function handleNumberInput(num) {
  if (!selectedCell) return;
  const r = +selectedCell.dataset.row;
  const c = +selectedCell.dataset.col;
  if (sudokuData.puzzle[r][c] !== 0) return; // 预填不可改
  history.push({r, c, prev: selectedCell.textContent}); // 记录历史
  selectedCell.textContent = num;
  if (sudokuData.solution[r][c] != num) {
    selectedCell.classList.add('error'); // 错误高亮
    errorCount++;
    updateErrorCount();
    setTimeout(() => selectedCell.classList.remove('error'), 600);
    if (errorCount >= 3) {
      alert('游戏结束，错误次数过多！');
      stopTimer();
    }
  } else {
    selectedCell.classList.remove('error');
    sudokuData.puzzle[r][c] = num;
    checkWin();
  }
  updateNumberPad();
}

// 擦除当前格子内容
function handleErase() {
  if (!selectedCell) return;
  const r = +selectedCell.dataset.row;
  const c = +selectedCell.dataset.col;
  if (sudokuData.puzzle[r][c] !== 0) return;
  history.push({r, c, prev: selectedCell.textContent});
  selectedCell.textContent = '';
  updateNumberPad();
}

// 撤销上一步操作
function handleUndo() {
  if (history.length === 0) return;
  const last = history.pop();
  const board = document.getElementById('sudoku-board');
  const idx = last.r * 9 + last.c;
  board.children[idx].textContent = last.prev;
  updateNumberPad();
}

// 破解（显示答案）
function handleSolve() {
  renderBoard(sudokuData.solution, sudokuData.solution);
  stopTimer();
  updateNumberPad();
}

// 提示（为选中格子填入正确答案）
function handleHint() {
  if (!selectedCell) return; // 没有选中格子
  const r = +selectedCell.dataset.row;
  const c = +selectedCell.dataset.col;
  // 仅对可填写格子进行提示
  if (selectedCell.classList.contains('prefilled') || selectedCell.textContent !== '') return;
  selectedCell.textContent = sudokuData.solution[r][c];
  selectedCell.classList.add('hint'); // 高亮提示
  setTimeout(() => selectedCell.classList.remove('hint'), 1000);
  updateNumberPad();
}

// 检查是否完成
function checkWin() {
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (sudokuData.puzzle[r][c] === 0) return;
    }
  }
  alert('恭喜你完成了数独！');
  stopTimer();
}

// 初始化游戏
function initGame() {
  const difficulty = document.getElementById('difficulty').value;
  sudokuData = generateSudoku(difficulty);
  errorCount = 0;
  updateErrorCount();
  renderBoard(sudokuData.puzzle, sudokuData.solution);
  startTimer();
  history = [];
  selectedCell = null;
  updateNumberPad();
}

// 事件绑定
// 难度切换
document.getElementById('difficulty').addEventListener('change', initGame);
// 撤销
document.getElementById('undo').addEventListener('click', handleUndo);
// 擦除
document.getElementById('erase').addEventListener('click', handleErase);
// 破解
document.getElementById('solve').addEventListener('click', handleSolve);
// 提示
document.getElementById('hint').addEventListener('click', handleHint);
// 数字输入
document.getElementById('number-pad').addEventListener('click', function(e) {
  if (e.target.classList.contains('num-btn')) {
    handleNumberInput(e.target.textContent);
  }
});

// 页面加载初始化
window.onload = initGame; 