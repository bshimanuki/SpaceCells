import levels_yaml from "../levels/levels.yaml"

const NUM_TUTORIAL_LEVELS = 4;

function mockNormal(mu, maxV) {
  const n = 200;
  const normalFidelity = 6;
  const values = Array.from({length: n}).map(_ => Array.from({length: normalFidelity}).map(Math.random).reduce((acc, x) => acc + x) / normalFidelity * 2 * mu);
  const nbins = 20;
  const width = maxV / nbins;
  const bins = Array(nbins).map((_, i) => i * width);
  let counts = Array(nbins).fill(0);;
  for (const value of values) {
    ++counts[Math.floor(value / width)];
  }
  return {
    bin0: 0,
    binWidth: width,
    counts: counts,
  };
}
function makeMockData() {
  return {
    cycles: mockNormal(200, 500),
    cells: mockNormal(20, 80),
    instructions: mockNormal(30, 80),
    symbols: mockNormal(50, 100),
  };
}
const mockData = makeMockData();

const mockTeamLevelStats = {
  cycles: 100,
  cells: 20,
  instructions: 30,
  symbols: 50,
};

function getFileFromServer(url) {
  let promise = new Promise(resolve => {
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function() {
      if (xhr.readyState === 4) {
        resolve(xhr.status == 200 ? xhr.responseText : null);
      }
    }
    xhr.open("GET", url, true);
    xhr.send();
  });
  return promise;
}

const backgrounds = [
  require("../backgrounds/1.txt").default,
  require("../backgrounds/2.txt").default,
  require("../backgrounds/3.txt").default,
  require("../backgrounds/4.txt").default,
  require("../backgrounds/5.txt").default,
  require("../backgrounds/6.txt").default,
  require("../backgrounds/7.txt").default,
  require("../backgrounds/8.txt").default,
  require("../backgrounds/9.txt").default,
  require("../backgrounds/10.txt").default,
  require("../backgrounds/11.txt").default,
  require("../backgrounds/12.txt").default,
];

const levels = levels_yaml.levels.map((yaml, i) => {
  let level = {...yaml};
  level.levelNumber = i;
  if (level.name !== "epilogue") {
    level.data = require(`../levels/${level.name}.lvl`).default;
    level.background = backgrounds[i];
  }
  return level;
});

export function get_data(router, knownLevels) {
  const levelsSolved = Number(localStorage.getItem("levels-solved")) || 0;
  let data = {
    levelsSolved: levelsSolved,
    levels: levels,
  };
  if (levelsSolved & (1 << (NUM_TUTORIAL_LEVELS - 1))) data.totalLevels = levels.length;
  const result = {
    data: data,
  };
  return Promise.resolve(result);
}

export function get_submission(router, level, knownLevels) {
  const url = `../example_solutions/${levels[level].name}.sol`;
  let data_promise = get_data(knownLevels);
  let text_promise = getFileFromServer(url);
  let promise = new Promise(resolve => {
    Promise.all([data_promise, text_promise]).then(([result, submission]) => {
      result.data.submission = submission;
      resolve(result);
    });
  });
  return promise;
}

export function make_submission(router, level, submission, cycles, knownLevels) {
  let levelsSolved = Number(localStorage.getItem("levels-solved")) || 0;
  let newState = {};
  if (!(levelsSolved & (1 << level))) {
    levelsSolved = levelsSolved | (1 << level);
    localStorage.setItem("levels-solved", levelsSolved);
  }
  const data_promise = get_data(knownLevels);
  return data_promise.then(result => {
    result.data.level_stats = mockData;
    result.data.team_level_stats = mockTeamLevelStats;
    return result;
  });
}
