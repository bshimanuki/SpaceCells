import React from "react";
import ReactDOM from "react-dom";
import update from "immutability-helper";
import Modal from 'react-modal';
import * as Charts from "@data-ui/histogram";

import * as Svgs from "./svgs.jsx";
import "./main.css"; // after svgs with its own css
import Embindings from "./embindings.js";
import EmbindingsWASM from "./embindings.wasm";

const MAX_HISTORY = 1000;

function nest(seq, value, obj={}, overwrite=true, start=0) {
  if (start === seq.length) {
    if (overwrite || JSON.stringify(obj) === JSON.stringify({})) return value;
    return undefined;
  }
  let newValue = nest(seq, value, obj[seq[start]] || {}, overwrite, start + 1);
  if (newValue !== undefined) obj[seq[start]] = newValue;
  return obj;
}
function getNested(obj, seq, start=0) {
  if (start === seq.length) return obj;
  return getNested(obj[seq[start]], seq, start + 1);
}

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
    symbols: mockNormal(30, 80),
  };
}
const mockData = makeMockData();

var Module;
const EmbindingsLoader = Embindings({
  locateFile: () => EmbindingsWASM,
});
EmbindingsLoader.then((core) => {
  Module = core;
  ReactDOM.render(
    <Game m={10} n={12}/>,
    document.getElementById("game")
  );
  Modal.setAppElement("#game");
  console.log("loaded");
});

const levels = {
  "not": "../examples/not.lvl",
  "and": "../examples/and.lvl",
  "crossing": "../examples/crossing.lvl",
  "delay": "../examples/delay.lvl",
  "switch": "../examples/switch.lvl",
  "xor": "../examples/xor.lvl",
  "median": "../examples/median.lvl",
  "rainbow": "../examples/rainbow.lvl",
  "adder": "../examples/adder.lvl",
  "stack": "../examples/stack.lvl",
};

const startSquares = [
  [2, 5], // red
  [7, 5], // blue
];

function getFileFromServer(url, doneCallback) {
  var xhr = new XMLHttpRequest();
  xhr.onreadystatechange = function() {
    if (xhr.readyState === 4) {
      doneCallback(xhr.status == 200 ? xhr.responseText : null);
    }
  }
  xhr.open("GET", url, true);
  xhr.send();
}

function isTextBox(element) {
  let tagName = element.tagName.toLowerCase();
  if (tagName === "textarea") return true;
  if (tagName !== "input") return false;
  let type = element.type.toLowerCase();
  const inputTypes = ["text", "password", "number", "email", "tel", "url", "search", "date", "datetime", "datetime-local", "time", "month", "week"];
  return inputTypes.includes(type);
}

function matchLocation(object, y, x) {
  let location = (object || {}).location || {};
  return location.valid && location.y === y && location.x === x;
}

function cellAllowed(c) {
  return " _".includes(c);
}

function svgForCell(c) {
  if (c.is_1x1) return c.x ? Svgs.XCell : Svgs.PlusCell;
  let direction = String.fromCharCode(c.direction);
  if (c.is_diode) {
    switch (direction) {
    case "^": return Svgs.DiodeUp;
    case "v": return Svgs.DiodeDown;
    case "<": return Svgs.DiodeLeft;
    case ">": return Svgs.DiodeRight;
    default: return null;
    }
  }
  switch (direction) {
  case "^": case "v": return Svgs.VerticalCell;
  case "<": case ">": return Svgs.HorizontalCell;
  default: return null;
  }
}

const botColors = ["red", "blue"];

const symbolTypesCellSymbol = [
  {type: "cellSymbol", keyboard: "q", subtype: "/", value: "/", svg: Svgs.XCell, className: "resolved-1 latched"},
  {type: "cellSymbol", keyboard: "w", subtype: "\\", value: "\\", svg: Svgs.XCell, className: "resolved-0 latched"},
  {type: "cellSymbol", keyboard: "e", subtype: "x", value: "x", svg: Svgs.XCell, className: "resolved-x unlatched"},
  {type: "cellSymbol", keyboard: "r", subtype: "+", value: "+", svg: Svgs.PlusCell, className: "resolved-x unlatched"},
  {type: "cellSymbol", keyboard: "a", subtype: "-", value: "-", svg: Svgs.PlusCell, className: "resolved-1 latched"},
  {type: "cellSymbol", keyboard: "s", subtype: "|", value: "|", svg: Svgs.PlusCell, className: "resolved-0 latched"},
  {type: "cellSymbol", keyboard: "df", subtype: "][", value: "][", svg: Svgs.HorizontalCell, multi: "horizontal"},
  {type: "cellSymbol", keyboard: "tg", subtype: "W\nM", value: "WM", svg: Svgs.VerticalCell, multi: "vertical"},
  {type: "cellSymbol", keyboard: "yu", subtype: "<x", value: "<x", svg: Svgs.DiodeLeft, multi: "horizontal"},
  {type: "cellSymbol", keyboard: "ik", subtype: "x\nv", value: "xv", svg: Svgs.DiodeDown, multi: "vertical"},
  {type: "cellSymbol", keyboard: "ol", subtype: "^\nx", value: "^x", svg: Svgs.DiodeUp, multi: "vertical"},
  {type: "cellSymbol", keyboard: "hj", subtype: "x>", value: "x>", svg: Svgs.DiodeRight, multi: "horizontal"},
];
const symbolTypesDirection = [
  {type: "direction", keyboard: "a", subtype: "<", value: "<", svg: Svgs.DirectionLeft},
  {type: "direction", keyboard: "s", subtype: "v", value: "v", svg: Svgs.DirectionDown},
  {type: "direction", keyboard: "d", subtype: ">", value: ">", svg: Svgs.DirectionRight},
  {type: "direction", keyboard: "w", subtype: "^", value: "^", svg: Svgs.DirectionUp},
];
const symbolTypesOperation = [
  {type: "operation", keyboard: "", subtype: "START", value: "S", svg: Svgs.Start},
  {type: "operation", keyboard: "q", subtype: "NEXT", value: "n", svg: Svgs.Next},
  {type: "operation", keyboard: "e", subtype: "GRAB/DROP", options: {w: ["GRAB/DROP", Svgs.Swap], g: ["GRAB", Svgs.Grab], d: ["DROP", Svgs.Drop]}},
  {type: "operation", keyboard: "r", subtype: "LOCK/FREE", options: {t: ["LOCK/FREE", Svgs.ToggleLatch], l: ["LOCK", Svgs.Latch], u: ["FREE", Svgs.Unlatch]}},
  {type: "operation", keyboard: "t", subtype: "RESET", value: "*", svg: Svgs.Relatch},
  {type: "operation", keyboard: "y", subtype: "SYNC", value: "s", svg: Svgs.Sync},
  {type: "operation", keyboard: "u", subtype: "ROTATE", value: "r", svg: Svgs.Rotate},
  {type: "operation", keyboard: "f", subtype: "BRANCH(|/)", options: {"<": ["<", Svgs.Branch1Left], "v": ["v", Svgs.Branch1Down], ">": [">", Svgs.Branch1Right], "^": ["^", Svgs.Branch1Up]}},
  {type: "operation", keyboard: "g", subtype: "BRANCH(-\\)", options: {"[": ["<", Svgs.Branch0Left], "W": ["v", Svgs.Branch0Down], "]": [">", Svgs.Branch0Right], "M": ["^", Svgs.Branch0Up]}},
  {type: "operation", keyboard: "h", subtype: "POWER", options: {p: ["TOGGLE TOP", Svgs.Power0], P: ["TOGGLE BOT", Svgs.Power1]}},
];

function makeSymbolTypesByValue(symbolTypes) {
  let symbolTypesByValue = {};
  for (let symbolType of symbolTypes) {
    if (symbolType.value) symbolTypesByValue[symbolType.value] = symbolType;
    else {
      for (let symbolTypeValue in symbolType.options) {
        symbolTypesByValue[symbolTypeValue] = symbolType;
      }
    }
  }
  return symbolTypesByValue;
}
const symbolTypesByValue = {
  cellSymbol: makeSymbolTypesByValue(symbolTypesCellSymbol),
  direction: makeSymbolTypesByValue(symbolTypesDirection),
  operation: makeSymbolTypesByValue(symbolTypesOperation),
};
function symbolTypeByState(symbolState) {
  if (!symbolState.value) return null;
  return symbolTypesByValue[symbolState.type][symbolState.value];
}
function initialSelectionSymbolStates(type, symbolTypes) {
  // START starts on board and cannot be added
  return symbolTypes.filter(symbolType => symbolType.value !== "S").map((symbolType, i) => SymbolState({
    type: symbolType.type,
    value: symbolType.value || Object.keys(symbolType.options)[0][0],
    trace: [type, i],
  }));
}

function SymbolState(props) {
  return Object.assign({
    type: null,
    value: null,
    onBoard: false,
    bot: null,
    trace: [],
    selected: false,
  }, props);
}
const nullSymbolState = SymbolState();

function makeEmptySquare() {
  return {
    cellSymbol: nullSymbolState,
    cellSymbolIndex: null,
    direction: [nullSymbolState, nullSymbolState],
    operation: [nullSymbolState, nullSymbolState],
  }
}

function makeFixedCell(...args) {
  let square = makeEmptySquare();
  let [xSymbolValue] = makeSymbolState(...args);
  square.cellSymbol = xSymbolValue;
  square.cellSymbolIndex = 0;
  return square;
}

function makeSymbolState(type, c, y, x, bot) {
  if ("._ ".includes(c)) return [nullSymbolState];
  let symbols = symbolTypesByValue[type];
  for (let symbolValue in symbols) {
    if (symbolValue.includes(c)) {
      if (type === "cellSymbol") {
        var symbolState = SymbolState({type:type, value:symbolValue, onBoard:true, trace:["squares", y, x, type]});
      } else {
        var symbolState = SymbolState({type:type, value:symbolValue, onBoard:true, bot: bot, trace:["squares", y, x, type, bot]});
      }
      if (symbols[symbolValue].multi === "horizontal") return [symbolState, 0, c === ">" ? -1 : 1];
      else if (symbols[symbolValue].multi === "vertical") return [symbolState, c === "v" ? -1 : 1, 0];
      else return [symbolState];
    }
  }
  return [];
}

function makeSubmission(squares, m, n) {
  let join = func => squares.slice(0, m).map(row => row.slice(0, n).map(square => {
    let [symbolState, index] = func(square);
    return ((symbolState || {}).value || "")[index] || "_";
  }).join("")).join("\n");
  let cellSymbol = join(square => [square.cellSymbol, square.cellSymbolIndex])
  let direction0 = join(square => [square.direction[0], 0])
  let operation0 = join(square => [square.operation[0], 0])
  let direction1 = join(square => [square.direction[1], 0])
  let operation1 = join(square => [square.operation[1], 0])
  return [cellSymbol, direction0, operation0, direction1, operation1].join("\n\n");
}


class Symbol extends React.PureComponent {
  clickHandler = event => {
    event.stopPropagation();
    this.props.clickHandler(event, this.props.y, this.props.x, this.props.symbolState);
  }

  dragHandler = event => {
    event.stopPropagation();
    this.props.dragHandler(event, this.props.symbolState);
  }

  render() {
    var classNames = []
    classNames.push("symbol");
    classNames.push("image-container");
    if (this.props.symbolState.selected) classNames.push("selected");
    let props = {
      onClick: this.clickHandler,
      onDragStart: this.dragHandler,
      onDrag: this.dragHandler,
      onDragEnd: this.dragHandler,
      draggable: this.props.draggable,
    };
    if (this.props.symbolType === "cell") {
      if (this.props.index || !this.props.cell || !this.props.cell.exists) {
        return <div></div>;
      }
      if (this.props.cell.is_1x1) classNames.push(this.props.cell.latched ? "latched" : "unlatched");
      classNames.push(`resolved-${String.fromCharCode(this.props.cell.value)}`);
      classNames.push(String.fromCharCode(this.props.cell.color));
      if (this.props.cell.held) classNames.push("held");
      if (this.props.cell.rotating) classNames.push("rotating");
      if (this.props.cell.refreshing) classNames.push("refreshing");
      let moving = String.fromCharCode(this.props.cell.moving);
      if (moving !== " ") classNames.push(`moving-${moving}`);
      classNames = classNames.join(" ");
      let Component = svgForCell(this.props.cell);
      return (
        <div className={classNames}>
          <Component className="image-base symbol" {...props}/>
        </div>
      );
    } else {
      // instructions
      if (!this.props.symbolState.value) {
        return <div></div>;
      }
      classNames = classNames.join(" ");
      const symbolType = symbolTypeByState(this.props.symbolState);
      let Component = symbolType.svg || symbolType.options[this.props.symbolState.value][1];
      return (
        <div className={`symbol-shift ${classNames} ${this.props.className}`}>
          <Component className="image-base symbol" {...props}/>
        </div>
      );
    }
  }
}

class Square extends React.PureComponent {
  clickHandler = event => {
    this.props.clickHandler(event, this.props.y, this.props.x, null, null);
  }

  dragOverHandler = event => {
    this.props.dragOverHandler(event, {y: this.props.y, x: this.props.x});
  }

  renderSymbol(props) {
    const selected = props.symbolState.selected;
    return (
      <Symbol
        y={this.props.y}
        x={this.props.x}
        index={0}
        simBoard={this.props.simBoard}
        stopped={this.props.stopped}
        {...props}
        clickHandler={this.props.clickHandler}
        dragHandler={this.props.dragHandler}
        draggable={this.props.trespassable}
      />
    );
  }

  render() {
    var classNames = [];
    classNames.push("square");
    if (this.props.bot0) classNames.push("bot0-loc");
    if (this.props.bot1) classNames.push("bot1-loc");
    if (this.props.trespassable !== undefined) classNames.push(this.props.trespassable ? "trespassable" : "untrespassable");
    if (this.props.input) classNames.push("input");
    if (this.props.output) {
      classNames.push("output");
      classNames.push(this.props.powered ? "powered" : "unpowered");
    }
    if (this.props.dragOver) classNames.push("dragover");
    classNames = classNames.join(" ");
    var cellBotClassNames = [];
    if (this.props.bot0) cellBotClassNames.push("bot0");
    if (this.props.bot1) cellBotClassNames.push("bot1");
    cellBotClassNames = cellBotClassNames.join(" ");
    const cellSymbolType = symbolTypeByState(this.props.cellSymbol);
    return (
      <div className={classNames} onClick={this.clickHandler} onDragEnter={this.dragOverHandler} onDragOver={this.dragOverHandler} onDragLeave={this.dragOverHandler} onDrop={this.dragOverHandler}>
        <div className="square-underlay"/>
        <div className={`square-overlay ${cellBotClassNames}`}>
          <Svgs.CellBot/>
        </div>
        <div className="square-drag-overlay"/>
        <div className={`square-inset ${cellSymbolType && this.props.cellSymbolIndex === 0 ? cellSymbolType.multi : ""}`}>
          {this.renderSymbol({symbolType:"cell", className:"cell", cellValue:(this.props.cell && String.fromCharCode(this.props.cell.resolved())), cell:this.props.cell, symbolState:this.props.cellSymbol, index:this.props.cellSymbolIndex})}
        </div>
        <div className="square-inset">
          {this.renderSymbol({symbolType:"instruction", className:"bot0 instruction operation", symbolState:this.props.operation[0]})}
          {this.renderSymbol({symbolType:"instruction", className:"bot1 instruction operation", symbolState:this.props.operation[1]})}
          {this.renderSymbol({symbolType:"instruction", className:"bot0 instruction direction", symbolState:this.props.direction[0]})}
          {this.renderSymbol({symbolType:"instruction", className:"bot1 instruction direction", symbolState:this.props.direction[1]})}
        </div>
      </div>
    );
  }
}

class Board extends React.PureComponent {
  renderSquare(props) {
    const dragOver = ((this.props.dragOverSet || {})[props.y] || {})[props.x];
    return (<Square
      key={props.y,props.x}
      clickHandler={this.props.clickHandler}
      dragHandler={this.props.dragHandler}
      dragOverHandler={this.props.dragOverHandler}
      simBoard={this.props.simBoard}
      dragOver={dragOver}
      stopped={this.props.stopped}
      flipflop={dragOver && this.props.flipflop}
      {...props}
    />);
  }

  render() {
    return (
      <div className="board">
        {this.props.squares.slice(0, this.props.m).map((row, y) =>
        <div key={y} className="board-row">
          {row.slice(0, this.props.n).map((square, x) => this.renderSquare(Object.assign(
            {
              y: y,
              x: x,
              cell: ((this.props.cells || {})[y] || {})[x],
              trespassable: ((this.props.trespassable || {})[y] || {})[x],
              bot0: matchLocation(this.props.bots[0], y, x),
              bot1: matchLocation(this.props.bots[1], y, x),
              input: this.props.inputs.some(input => matchLocation(input, y, x)),
              output: this.props.outputs.some(output => matchLocation(output, y, x)),
              powered: this.props.outputs.filter(output => output.power).some(output => matchLocation(output, y, x)),
              levelChar: ((this.props.levelGrid || {})[y] || {})[x],
            },
            square)))}
        </div>
        )}
      </div>
    );
  }
}

function parseSubmission(submission, m, n) {
  var squares = Array.from({length: m}).map(_ => Array.from({length: n}).map(_ => makeEmptySquare()));
  var parseGrid = (type, bot, lines) => {
    if (lines.length !== m) return false;
    let grid = Array.from({length: m}).map(row => Array(n).fill(nullSymbolState));
    let indices = Array.from({length: m}).map(row => Array(n).fill(null));
    for (let y=0; y<grid.length; ++y) {
      if (lines[y].length !== n) return false;
      for (let x=0; x<grid[y].length; ++x) if (!grid[y][x].value) {
        let [value, dy, dx] = makeSymbolState(type, lines[y][x], y, x, bot);
        if (value === undefined) return false;
        grid[y][x] = value;
        indices[y][x] = 0;
        if (dy || dx) {
          indices[y][x] = dy + dx >= 0 ? 0 : 1;
          grid[y+dy][x+dx] = value;
          indices[y+dy][x+dx] = dy + dx >= 0 ? 1 : 0;
        }
      }
    }
    for (let y=0; y<grid.length; ++y) for (let x=0; x<grid[y].length; ++x) {
      if (type === "cellSymbol") {
        squares[y][x].cellSymbol = grid[y][x];
        squares[y][x].cellSymbolIndex = indices[y][x];
      } else {
        squares[y][x][type][bot] = grid[y][x];
      }
    }
    return true;
  };
  var lines = submission.split(/(?:\r?\n)+/);
  var valid = true;
  valid &= parseGrid("cellSymbol", null, lines.slice(0, m));
  valid &= parseGrid("direction", 0, lines.slice(m, 2*m));
  valid &= parseGrid("operation", 0, lines.slice(2*m, 3*m));
  valid &= parseGrid("direction", 1, lines.slice(3*m, 4*m));
  valid &= parseGrid("operation", 1, lines.slice(4*m, 5*m));
  if (!valid) {
    return ["Could not parse input", null];
  }
  return [null, squares];
};

class Game extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      levelName: Object.keys(levels)[0],
      levelData: null,
      squares: Array.from({length: this.props.m}, e => Array.from({length: this.props.n}, makeEmptySquare)),
      submission: "",
      submissionHistory: [],
      submissionFuture: [],
      // backend
      board: null, // Emscripten pointer
      cells: [], // 2D array of Emscripten pointers
      trespassable: [], // 2D array of bools
      bots: [null, null], // converted to javascript objects
      levelGrid: [], // array of chars
      inputs: [], // converted to javascript objects
      outputs: [], // converted to javascript objects
      inputBits: [], // (test_case, input, step) -> bool
      outputColors: [], // (test_case, step) -> char
      lastColor: null, // last output color as char
      testCase: 0,
      step: 0,
      cycle: 0,
      numSymbols: 0,
      error: "", // if any errors
      errorReason: null,
      status: null, // from check_status()
      validBoard: false, // set from reset_and_validate()
      // simulation
      simState: "stop",
      simTimeout: null,
      // selection
      symbolType: "cellSymbol",
      bot: 0,
      selectedSymbolStates: new Set(),
      selectionSymbolStateCellSymbols: initialSelectionSymbolStates("selectionSymbolStateCellSymbols", symbolTypesCellSymbol),
      selectionSymbolStateInstructions: initialSelectionSymbolStates("selectionSymbolStateInstructions", [...symbolTypesDirection, ...symbolTypesOperation]),
      // events
      heldKey: null,
      draggedSymbolState: nullSymbolState,
      dragOverPosition: null,
      dragOverPositionSemaphore: 0, // count dragenter vs dragleave (for children)
      dragOverSet: null,
      dragOverFits: false,
      // state change indicator alternate between +/-1
      flipflop: 1,
      // results
      showModal: false,
      lastResults: null,
    };
  }

  componentDidMount() {
    window.addEventListener("keydown", this.keyboardHandler)
    window.addEventListener("keyup", this.keyboardHandler)
    this.setLevelHandler({target: {value: this.state.levelName}});
  }

  componentWillUnmount() {
    window.removeEventListener("keydown", this.keyboardHandler)
    window.removeEventListener("keyup", this.keyboardHandler)
  }

  renderSymbolGroup(type, symbolState) {
    const symbolType = symbolTypeByState(symbolState);
    return (
      <SymbolGroup
        key={symbolTypeByState(symbolState).subtype}
        active={this.state.symbolType===type}
        dragHandler={this.dragHandler}
        clickHandler={this.symbolClickHandler}
        bot={this.state.bot}
        symbolState={symbolState}
        held={symbolType.keyboard.includes(this.state.heldKey)}
      />
    );
  }

  loadSubmission(submission, {undoredo}={}) {
    var makeNewState = (state, props) => {
      var [error, squares] = parseSubmission(submission, state.board.m, state.board.n);
      if (error) return {error: error};
      return {squares: squares};
    };
    this.resetBoard({makeNewState, undoredo});
  }

  render() {
    let classNames = [];
    if (this.state.draggedSymbolState.value) classNames.push("dragging");
    if (this.state.dragOverFits) classNames.push("dragover-fits");
    if (this.state.dragOverPosition === "trash") classNames.push("dragover-trash");
    if (this.state.wasNext) classNames.push(`output-color-${this.state.lastColor}`);
    classNames.push(`sim-${this.state.simState}`);
    if (this.state.simState !== "stop") classNames.push("sim-running");
    classNames = classNames.join(" ");
    // trash is active if non-START board symbols are selected
    let trashActive = [...this.state.selectedSymbolStates].some(symbolState => symbolState.onBoard && symbolState.value !== "S");
    return (
      <div id="main-content" style={{display:"flex"}} className={classNames}>
        <div className="level-selector-sidebar" style={{display:"flex", flexDirection:"column"}}>
          <div>
            <label htmlFor="level_select">Choose level:</label>
            <select name="level_select" id="level_select" value={this.state.levelName} onChange={this.setLevelHandler}>
              {Object.keys(levels).map(levelName => <option key={levelName} value={levelName}>{levelName}</option>)}
            </select>
          </div>
          <textarea name="submission" id="submission" value={this.state.submission} onChange={this.setSubmission}/>
          <input type="button" value="Load" onClick={this.setBoardHandler}/>
          <div style={{paddingBottom: "60px"}}/>
          <input type="button" value="Reset Board" onClick={this.clearBoardHandler}/>
          <div style={{paddingBottom: "60px"}}/>
          <input type="button" value="Show Results" onClick={this.openModalHandler}/>
        </div>
        <div className="center-content" style={{display:"flex", flexDirection:"column", alignItems:"center", width:"min-content"}}>
          <div style={{display:"flex", width:"min-content"}} className="game-board">
            <Board
              clickHandler={this.boardClickHandler}
              dragHandler={this.dragHandler}
              dragOverHandler={this.dragOverHandler}
              dragOverSet={this.state.dragOverSet}
              simBoard={this.state.validBoard || this.state.cycle}
              stopped={this.state.simState==="stop"}
              m={this.props.m}
              n={this.props.n}
              squares={this.state.squares}
              cells={this.state.cells}
              trespassable={this.state.trespassable}
              inputs={this.state.inputs}
              outputs={this.state.outputs}
              levelGrid={this.state.levelGrid}
              bots={this.state.bots}
              flipflop={this.state.flipflop}
            />
          </div>
          <div className="bottom-bar" style={{display:"flex", flexDirection:"column"}}>
            <div className="toggle-bar" style={{display:"flex", flexDirection:"row"}}>
              {/*<Toggle handler={this.symbolTypeHandler} selected={this.state.symbolType} name="symbol-type" options={{cellSymbol:"Cells", instruction:"Instructions"}}/>*/}
              {/*<Toggle handler={this.botHandler} selected={this.state.bot} name="bot" options={["Red", "Blue"]} colors={botColors}/>*/}
              <Toggle handler={this.jointSymbolTypeHandler} selected={this.state.symbolType === "cellSymbol" ? "cellSymbol" : botColors[this.state.bot]} name="symbol-type" options={{cellSymbol:"Cells", red:"Red Instr.", blue:"Blue Instr."}} colors={{cellSymbol:"green", red:"red", blue:"blue"}}/>
              <Toggle handler={this.simHandler} selected={this.state.simState} name="sim" options={{stop:"⏹", pause:"⏸", step:"⧐", play:"▶", fast:"⏩", nonstop:"⏩", batch:"⏭"}}/>
              <div style={{flex:1}}></div>
              <div className={`trash ${trashActive ? "active" : "inactive"} ${this.state.dragOverPosition === "trash" && "dragover"}`} onClick={this.trash} onDragEnter={this.trashDragOver} onDragOver={this.trashDragOver} onDragLeave={this.trashDragOver} onDrop={this.trashDragOver}>🗑</div>
            </div>
            <div className={`symbol-bar bot${this.state.bot}`} style={{position:"relative"}}>
              <div className="symbol-grid-bar grid-layout" style={{position:"relative"}}>
                {this.state.selectionSymbolStateCellSymbols.map(symbolState => this.renderSymbolGroup("cellSymbol", symbolState))}
                {this.state.selectionSymbolStateInstructions.map(symbolState => this.renderSymbolGroup("instruction", symbolState))}
                {this.state.symbolType === "instruction" &&
                  <div className="symbol-options-bar">
                    <SymbolOptions changeOption={this.changeSymbolOption} selectedSymbolState={this.state.selectedSymbolStates.size === 1 && this.state.selectedSymbolStates.values().next().value}/>
                  </div>
                }
              </div>
            </div>
          </div>
        </div>
        <div className="stats-sidebar" style={{display:"flex", flexDirection:"column"}}>
          <div className="colon-list">
            <div className="test-case">
              <span className="test-case-name">Test Case</span><span><span className="test-case-value">{this.state.testCase + 1}</span> / <span className="test-case-total">{this.state.outputColors.length}</span></span>
            </div>
            {(this.state.inputBits[this.state.testCase] || []).map((input, i) => {
              const loc = this.state.inputs[i].location;
              const colors = getNested(this.state.squares, [loc.y, loc.x]).cellSymbol.value === "x" ? "GB" : "OR";
              return (
                <div key={i} className="input-colors">
                  <span className="input-name">Input{this.state.inputs.length > 1 ? ` ${i+1}` : ""}</span>
                  <span className="colors">
                    {input.map((bit, k) =>
                    <span key={k} className={`input-color ${k < this.state.step - this.state.wasNext ? "past" : ""} ${k === this.state.step - this.state.wasNext ? "present" : ""} ${k > this.state.step - this.state.wasNext ? "future" : ""}`} color={colors[Number(bit)]}>{colors[Number(bit)]}</span>
                    )}
                  </span>
                </div>
              );
            })}
            <div className="expected-colors">
              <span className="expected-name">Expected</span>
              <span className="colors">
                {(this.state.outputColors[this.state.testCase] || []).map((color, k) => <span key={k} className={`expected-color ${k < this.state.step - this.state.wasNext ? "past" : ""} ${k === this.state.step - this.state.wasNext ? "present" : ""} ${k > this.state.step - this.state.wasNext ? "future" : ""}`} color={color}>{color}</span>)}
              </span>
            </div>
            <div className="actual-colors">
              <span className="actual-name">Actual</span>
              <span className="colors">
                {(this.state.outputColors[this.state.testCase] || []).slice(0, Math.max(0, this.state.step)).map((color, k) => <span key={k} className={`actual-color`} color={color}>{color}</span>)}
                {this.state.errorReason === Module.ErrorReason.WRONG_OUTPUT && <span className={`actual-color`} color={this.state.lastColor}>{this.state.lastColor}</span>}
              </span>
            </div>
          </div>
          <br/>
          <div className="colon-list">
            <div><span className="steps">Completed Test Cases</span><span className="steps-value">{this.state.testCase + (this.state.step === (this.state.outputColors[this.state.testCase] || {}).length)}</span></div>
            {/*<div><span className="steps">Steps</span><span className="steps-value">{this.state.step}</span></div>*/}
            <div><span className="cycles">Total Cycles</span><span className="cycles-value">{this.state.cycle}</span></div>
            <div><span className="cycles">Total Symbols</span><span className="num-symbols-value">{this.state.numSymbols}</span></div>
          </div>
          <br/>
          <div className="colon-list">
            {this.state.error ? <div><span className="error">Error</span><span className="error-value">{this.state.error}</span></div> : "" }
          </div>
          <br/>
          { this.state.status === Module.Status.DONE && <div className="finished">Finished level!</div> }
          <ResultsModal isOpen={this.state.showModal} closeModalHandler={this.closeModalHandler} stats={mockData} results={this.state.lastResults}/>
        </div>
      </div>
    );
  }

  onFinish = () => {
    if (this.state.status === Module.Status.DONE) {
      this.setState((state, props) => {
        return {
          showModal: true,
          lastResults: {
            cycles: state.cycle,
            symbols: state.numSymbols,
          },
        };
      });
    }
  }

  selectedOnBoard = (state=this.state, props=this.props) => state.selectedSymbolStates.size && state.selectedSymbolStates.values().next().value.onBoard;

  fits = (state, props, symbolState, y, x, ignoreSelected=true) => {
    const symbolType = symbolTypeByState(symbolState);
    if (y < 0 || x < 0 || y >= props.m || x >= props.n) return false;
    var locs = [[y, x]];
    var destSymbolStates = [];
    // js doesn't have references...
    if (symbolType.type === "cellSymbol") {
      destSymbolStates.push(state.squares[y][x].cellSymbol);
      switch (symbolType.multi) {
      case "horizontal":
        if (x + 1 >= props.n) return false;
        locs.push([y, x + 1]);
        destSymbolStates.push(state.squares[y][x + 1].cellSymbol);
        break;
      case "vertical":
        if (y + 1 >= props.m) return false;
        locs.push([y + 1, x]);
        destSymbolStates.push(state.squares[y + 1][x].cellSymbol);
        break;
      default:
        break;
      }
    } else {
      const bot = symbolState.onBoard ? symbolState.bot : state.bot;
      destSymbolStates.push(state.squares[y][x][symbolType.type][bot]);
    }
    for (let loc of locs) {
      let [_y, _x] = loc;
      if (!((state.trespassable || {})[_y] || {})[_x]) return false;
    }
    for (let destSymbolState of destSymbolStates) {
      if (destSymbolState.value && !(ignoreSelected && destSymbolState.selected)) {
        return false;
      }
    }
    return true;
  }

  getCopySymbolsUpdater = (state, props, symbolState, position, symbolStates=[symbolState], dragging=false) => {
    let squaresUpdater = {};
    let updatedSymbolStates = new Set();
    for (const _symbolState of symbolStates) {
      const symbolType = symbolTypeByState(_symbolState);
      if (symbolState.onBoard) {
        var y =  _symbolState.trace[1]  + position[0] - symbolState.trace[1];
        var x =  _symbolState.trace[2]  + position[1] - symbolState.trace[2];
      } else {
        var [y, x] = position;
      }
      let symbolClone = Object.assign({}, _symbolState, {
        onBoard: true,
      });
      if (!dragging) {
        symbolClone.selected = false;
      }
      if (symbolType.type === "cellSymbol") {
        symbolClone.trace = ["squares", y, x, symbolType.type];
        squaresUpdater = nest([y, x, "cellSymbol"], {$set: symbolClone}, squaresUpdater);
        squaresUpdater = nest([y, x, "cellSymbolIndex"], {$set: 0}, squaresUpdater);
        if (symbolType.multi === "horizontal") {
          squaresUpdater = nest([y, x + 1, "cellSymbol"], {$set: symbolClone}, squaresUpdater);
          squaresUpdater = nest([y, x + 1, "cellSymbolIndex"], {$set: 1}, squaresUpdater);
        } else if (symbolType.multi === "vertical") {
          squaresUpdater = nest([y + 1, x, "cellSymbol"], {$set: symbolClone}, squaresUpdater);
          squaresUpdater = nest([y + 1, x, "cellSymbolIndex"], {$set: 1}, squaresUpdater);
        }
      } else {
        if (!symbolState.onBoard) {
          symbolClone.bot = state.bot;
        }
        symbolClone.trace = ["squares", y, x, symbolType.type, symbolClone.bot];
        squaresUpdater = nest([y, x, symbolType.type, symbolClone.bot], {$set: symbolClone}, squaresUpdater);
      }
      updatedSymbolStates.add(symbolClone);
    }
    return [squaresUpdater, updatedSymbolStates];
  }

  copyOrMoveSymbols = (symbolState, position, {noSelected, dragging}={}) => {
    this.setState((state, props) => {
      const symbolStates = noSelected ? [symbolState] : state.selectedSymbolStates;
      if (symbolStates.size === 0) return null;
      let newState = {...state};
      let fits = true;
      symbolStates.forEach(_symbolState => {
        if (_symbolState.onBoard) {
          var y =  _symbolState.trace[1]  + position[0] - symbolState.trace[1];
          var x =  _symbolState.trace[2]  + position[1] - symbolState.trace[2];
        } else {
          var [y, x] = position;
        }
        fits &= this.fits(state, props, _symbolState, y, x);
      });
      if (!fits) return null;
      let [squaresUpdater, updatedSymbolStates] = this.getCopySymbolsUpdater(state, props, symbolState, position, symbolStates, dragging);
      symbolStates.forEach(_symbolState => {
        if (_symbolState.onBoard) {
          const symbolType = symbolTypeByState(_symbolState);
          const [y, x] = _symbolState.trace.slice(1, 3);
          squaresUpdater = nest(_symbolState.trace.slice(1), {$set: nullSymbolState}, squaresUpdater, false);
          if (symbolType.type === "cellSymbol") {
            squaresUpdater = nest([y, x, "cellSymbolIndex"], {$set: null}, squaresUpdater, false);
            if (symbolType.multi === "horizontal") {
              squaresUpdater = nest([y, x + 1, "cellSymbol"], {$set: nullSymbolState}, squaresUpdater, false);
              squaresUpdater = nest([y, x + 1, "cellSymbolIndex"], {$set: null}, squaresUpdater, false);
            } else if (symbolType.multi === "vertical") {
              squaresUpdater = nest([y + 1, x, "cellSymbol"], {$set: nullSymbolState}, squaresUpdater, false);
              squaresUpdater = nest([y + 1, x, "cellSymbolIndex"], {$set: null}, squaresUpdater, false);
            }
          }
        }
      });
      newState.squares = update(state.squares, squaresUpdater);
      if (dragging) {
        newState.selectedSymbolStates = updatedSymbolStates;
        state.selectedSymbolStates.forEach(_symbolState => {
          if (!_symbolState.onBoard) {
            // just remove selected
            newState = update(newState, nest(_symbolState.trace, {selected: {$set: false}}));
          }
        });
      }
      return newState;
    }, this.resetBoard);
  }

  getClearSelected = (state, props)  => {
    let delta = {};
    state.selectedSymbolStates.forEach(symbolState => {
      const symbolType = symbolTypeByState(symbolState);
      delta = nest(symbolState.trace, {selected: {$set: false}}, delta);
      if (symbolState.onBoard) {
        const [y, x] = symbolState.trace.slice(1, 3);
        if (symbolType.multi === "horizontal") delta = nest(["squares", y, x+1, ...symbolState.trace.slice(3)], {selected: {$set: false}}, delta);
        else if (symbolType.multi === "vertical") delta = nest(["squares", y+1, x, ...symbolState.trace.slice(3)], {selected: {$set: false}}, delta);
      }
    });
    let newState = update(state, delta);
    newState.selectedSymbolStates.clear();
    return newState;
  }

  // keepOldAndToggle used for shift select
  setSelected = (symbolState, keepOldAndToggle=false) => {
    const symbolType = symbolTypeByState(symbolState);
    this.setState((state, props) => {
      let newState = keepOldAndToggle ? state : this.getClearSelected(state, props);
      if (keepOldAndToggle && getNested(newState, symbolState.trace).selected) {
        newState.selectedSymbolStates = update(newState.selectedSymbolStates, {$remove: [getNested(newState, symbolState.trace)]});
        newState = update(newState, nest(symbolState.trace, {selected: {$set: false}}));
        if (symbolState.onBoard) {
          const [y, x] = symbolState.trace.slice(1, 3);
          if (symbolType.multi === "horizontal") newState = update(newState, nest(["squares", y, x+1, ...symbolState.trace.slice(3)], {selected: {$set: false}}));
          else if (symbolType.multi === "vertical") newState = update(newState, nest(["squares", y+1, x, ...symbolState.trace.slice(3)], {selected: {$set: false}}));
        }
      } else {
        newState = update(newState, nest(symbolState.trace, {selected: {$set: true}}));
        if (symbolState.onBoard) {
          const [y, x] = symbolState.trace.slice(1, 3);
          if (symbolType.multi === "horizontal") newState = update(newState, nest(["squares", y, x+1, ...symbolState.trace.slice(3)], {selected: {$set: true}}));
          else if (symbolType.multi === "vertical") newState = update(newState, nest(["squares", y+1, x, ...symbolState.trace.slice(3)], {selected: {$set: true}}));
        }
        newState.selectedSymbolStates = update(newState.selectedSymbolStates, {$add: [getNested(newState, symbolState.trace)]});
      }
      return newState;
    });
  }

  jointSymbolTypeHandler = value => {
    if (value === "cellSymbol" || value === "instruction") {
      this.symbolTypeHandler(value);
    } else {
      this.botHandler(botColors.indexOf(value));
    }
  }
  botHandler = value => { this.setState({bot: Number(value)}, () => this.symbolTypeHandler("instruction")); }
  symbolTypeHandler = value => {
    this.setState((state, props) => {
      if (state.symbolType !== value) {
        if (state.selectedSymbolStates.size === 1 && !state.selectedSymbolStates.values().next().value.onBoard) {
          return Object.assign(this.getClearSelected(state, props), {symbolType: value});
        } else {
          return {symbolType: value};
        }
      }
    });
  }
  simHandler = value => {
    const INITIAL_DELAY = 200; // ms
    const PLAY_INTERVAL = 1000; // ms
    const FAST_INTERVAL = 100; // ms
    const NONSTOP_INTERVAL = 0; // ms
    var self = this;
    var needsToResetCells = false;
    this.setState(
      (state, props) => {
        if (state.simState === value) return null;
        var newState = Object.assign(this.getClearSelected(state, props), {simState: value});
        clearTimeout(state.simTimeout);
        var makeRepeat = (interval, steps=1) => {
          return setTimeout(
            function callOnce() {
              self.move(steps);
              self.setState((state, props) => {
                clearTimeout(state.simTimeout);
                if (state.board.check_status() !== Module.Status.RUNNING) return {simState: "pause"};
                else return {simTimeout: setTimeout(callOnce, interval)};
              });
            },
            INITIAL_DELAY);
        }
        if (value === "step") newState.simTimeout = setTimeout(() => { this.move(); this.simHandler("pause"); }, INITIAL_DELAY);
        else if (value === "play") newState.simTimeout = makeRepeat(PLAY_INTERVAL);
        else if (value === "fast") newState.simTimeout = makeRepeat(FAST_INTERVAL);
        else if (value === "nonstop") newState.simTimeout = makeRepeat(NONSTOP_INTERVAL);
        else if (value === "batch") newState.simTimeout = makeRepeat(NONSTOP_INTERVAL, 10);
        else if (value === "stop") {
          needsToResetCells = true;
        }
        return newState;
      },
      () => {
        if(needsToResetCells) {
          this.setState(
            (state, props) => {
              state.board.reset_and_validate();
              let status = state.board.check_status();
              return {status: status, validBoard: status !== Module.Status.INVALID};
            },
            this.resetCells);
        }
      }
    );
  }

  boardClickHandler = (event, y, x, symbolState) => {
    if (this.state.simState !== "stop") return;
    if (this.state.heldKey) {
      let keyboardSymbolState = null;
      const selectionSymbolStates = this.state.symbolType === "cellSymbol" ? this.state.selectionSymbolStateCellSymbols : this.state.selectionSymbolStateInstructions;
      for (const symbolState of selectionSymbolStates) {
        const symbolType = symbolTypeByState(symbolState);
        if (symbolType.keyboard.includes(this.state.heldKey)) keyboardSymbolState = symbolState;
      }
      if (keyboardSymbolState) {
        this.copyOrMoveSymbols(keyboardSymbolState, [y, x], {noSelected: true});
        return;
      }
    }
    const keepOldAndToggle = this.selectedOnBoard() && event.shiftKey;
    if (symbolState) {
      if (this.state.inputs.some(square => matchLocation(square, y, x))) {
        // inputs are fixed
        return;
      } else if (this.state.outputs.some(square => matchLocation(square, y, x))) {
        // outputs are fixed
        return;
      } else {
        this.setSelected(symbolState, keepOldAndToggle);
        return;
      }
    } else if (this.selectedOnBoard()) {
      if (!keepOldAndToggle) this.setState(this.getClearSelected);
      return;
    } else {
      if (this.state.selectedSymbolStates.size === 1) {
        const selectedSymbolState = this.state.selectedSymbolStates.values().next().value;
        this.copyOrMoveSymbols(selectedSymbolState, [y, x]);
        return;
      }
    }
  }

  keyboardHandler = event => {
    if (isTextBox(event.target)) return;
    switch (event.type) {
    case "keydown":
      if (event.ctrlKey) {
        switch (event.key) {
        case "z": return this.undo();
        case "Z": return this.redo();
        }
      } else {
        switch (event.key) {
        case "1": this.symbolTypeHandler("cellSymbol"); break;
        case "2": this.botHandler(0); break;
        case "3": this.botHandler(1); break;
        case "4": this.simHandler("stop"); break;
        case "5": this.simHandler("pause"); break;
        case "6": this.simHandler("step"); break;
        case "7": this.simHandler("play"); break;
        case "8": this.simHandler("fast"); break;
        case "9": this.simHandler("nonstop"); break;
        case "0": this.simHandler("batch"); break;
        case "Delete": case "Backspace": this.trash(); break;
        }
        this.setState({heldKey: event.key});
      }
      break;
    case "keyup":
      this.setState((state, props) => {
        if (state.heldKey === event.key) return {heldKey: null};
        return null;
      });
      break;
    }
  }

  undo = () => {
    if (this.state.submissionHistory.length > 1) {
      let item = this.state.submissionHistory.pop();
      this.state.submissionFuture.push(item);
      item = this.state.submissionHistory[this.state.submissionHistory.length - 1]
      this.loadSubmission(item, {undoredo:true});
    }
  }

  redo = () => {
    if (this.state.submissionFuture.length) {
      let item = this.state.submissionFuture.pop();
      this.state.submissionHistory.push(item);
      this.loadSubmission(item, {undoredo:true});
    }
  }

  resetBoard = ({...args}) => {
    this.setState((state, props) => {
      if (args.makeNewState) {
        var newState = args.makeNewState(state, props);
        if (newState.error) return newState;
      } else var newState = {};
      let stateGet = key => newState[key] || state[key];
      newState.submission = makeSubmission(stateGet("squares"), props.m, props.n);
      if (args.undoredo) {
        // don't have to reset each square's selected field because they were newly created by undo/redo
        if (this.selectedOnBoard(state, props)) stateGet("selectedSymbolStates").clear();
      } else {
        if (newState.submission !== state.submissionHistory[state.submissionHistory.length-1]) {
          state.submissionHistory.push(newState.submission);
          if (state.submissionHistory.length > 2 * MAX_HISTORY) state.submissionHistory = state.submissionHistory.slice(state.submissionHistory.length - MAX_HISTORY);
          newState.submissionFuture = [];
        }
      }
      if (state.board) state.board.delete();
      newState.board = Module.LoadBoard(stateGet("levelData"), newState.submission);
      localStorage.setItem(`board-state-${stateGet("levelName")}`, newState.submission);
      var trespassable = newState.board.get_trespassable();
      newState.trespassable = Array.from({length: newState.board.m}).map((row, y) => Array.from({length: newState.board.n}).map((cell, x) => {
        return trespassable.at(y, x);
      }));
      trespassable.delete();
      var boardLevel = newState.board.get_level();
      newState.levelGrid = Array.from({length: newState.board.m}).map((row, y) => Array.from({length: newState.board.n}).map((cell, x) => {
        return String.fromCharCode(boardLevel.at(y, x));
      }));
      boardLevel.delete();
      var inputs = newState.board.get_inputs();
      newState.inputs = Array.from({length: inputs.size()}).map((_, i) => inputs.get(i));
      inputs.delete();
      var inputBits = newState.board.get_input_bits();
      newState.inputBits = Array.from({length: inputBits.size()}).map((_, t) => {
        let test_case_vec = inputBits.get(t);
        let test_case_js = Array.from({length: test_case_vec.size()}).map((_, i) => {
          let input_vec = test_case_vec.get(i);
          let input_js = Array.from({length: input_vec.size()}).map((_, k) => !!input_vec.get(k));
          input_vec.delete();
          return input_js;
        });
        test_case_vec.delete();
        return test_case_js;
      });
      inputBits.delete();
      var outputColors = newState.board.get_output_colors();
      newState.outputColors = Array.from({length: outputColors.size()}).map((_, t) => {
        let test_case_vec = outputColors.get(t);
        let test_case_js = Array.from({length: test_case_vec.size()}).map((_, k) => {
          let pointer = test_case_vec.get(k);
          let color = String.fromCharCode(pointer.as_char);
          pointer.delete();
          return color;
        });
        test_case_vec.delete();
        return test_case_js
      });
      outputColors.delete();
      return newState;
    },
      this.resetCells);
  }

  resetCells = () => {
    this.setState((state, props) => {
      var newState = {};
      newState.wasNext = state.board.was_next;
      newState.testCase = state.board.test_case;
      newState.step = state.board.step;
      newState.cycle = state.board.cycle;
      newState.numSymbols = state.board.get_num_symbols();
      state.cells.forEach(row => row.forEach(cell => {
        if (cell) cell.delete();
      }));
      var cells = state.board.get_cells();
      newState.cells = Array.from({length: state.board.m}).map((row, y) => Array.from({length: state.board.n}).map((cell, x) => {
        return cells.at(y, x);
      }));
      cells.delete();
      // output power is dynamic
      var outputs = state.board.get_outputs();
      newState.outputs = Array.from({length: outputs.size()}).map((_, i) => outputs.get(i));
      outputs.delete();
      var bots = state.board.get_bots();
      newState.bots = Array.from({length: bots.size()}).map((bot, k) => bots.get(k));
      bots.delete();
      var lastColor = state.board.get_last_color();
      newState.lastColor = String.fromCharCode(lastColor.as_char);
      lastColor.delete();
      newState.error = state.board.get_error();
      newState.errorReason = state.board.get_error_reason();
      newState.status = state.board.check_status();
      newState.validBoard = newState.status !== Module.Status.INVALID;
      if (newState.error) console.log(newState.error);
      return newState;
    }, this.onFinish);
  }

  move = (steps=1) => {
    for (let i=0; i<steps; ++i) {
      this.state.board.move();
    }
    this.resetCells();
  }

  trash = () => {
    if (this.selectedOnBoard()) {
      this.setState((state, props) => {
        let removeSelected = symbolState => {
          if (symbolState.selected) {
            // don't delete START
            if (symbolState.value === "S") return update(symbolState, {selected: {$set: false}});
            return nullSymbolState;
          }
          return symbolState;
        }
        let newState = {};
        newState.squares  = state.squares.map(row => row.map(square => ({
          cellSymbol: removeSelected(square.cellSymbol),
          cellSymbolIndex: square.cellSymbolIndex,
          direction: square.direction.map(removeSelected),
          operation: square.operation.map(removeSelected),
        })));
        newState.selectedSymbolStates = new Set();
        return newState;
      }, this.resetBoard);
    }
  }

  trashDragOver = event => {
    this.dragOverHandler(event, {special: "trash", onDrop: this.trash});
  }

  setSubmission = event => {
    this.setState({submission: event.target.value});
  }

  setLevelHandler = (event, {loadCookie, clearBoard}={loadCookie:true, clearBoard:true}) => {
    var value = event.target.value;
    if (this.state.levelData === null || value !== this.state.levelName) {
      var path = levels[value];
      getFileFromServer(path, text => this.setBoardToLevel(value, text, {loadCookie, clearBoard}));
    }
  }

  setBoardToLevel = (levelName, levelData, {keepHistory, clearBoard, loadCookie}={}) => {
    if (levelData) {
      if (this.state.simState !== "stop") this.simHandler("stop");
      var newState = {
        levelName: levelName,
        levelData: levelData,
      }
      if (!keepHistory) {
        newState.submissionHistory = [];
        newState.submissionFuture = [];
      }
      var submission = null;
      var board = null;
      if (loadCookie) {
        submission = localStorage.getItem(`board-state-${levelName}`);
        if (submission) {
          board = Module.LoadBoard(levelData, submission);
          const status = board.check_status();
          const m = board.m;
          const n = board.n;
          board.delete();
          if (status !== Module.Status.INVALID) {
            let [err, submissionSquares] = parseSubmission(submission, m, n);
            if (!err) {
              newState.squares = submissionSquares;
              this.setState(newState, this.resetBoard);
              return;
            }
          }
        }
      }
      let squares = this.state.squares;
      if (clearBoard) squares = squares.map(row => row.map(makeEmptySquare));
      submission = makeSubmission(squares, this.props.m, this.props.n);
      board = Module.LoadBoard(levelData, submission);
      var inputs = board.get_inputs();
      var inputLocations = Array.from({length: inputs.size()}).map((_, i) => inputs.get(i).location);
      inputs.delete();
      let levelGrid = board.get_level();
      newState.squares = squares.map((row, y) => row.map((square, x) => {
        if (clearBoard) {
          for (let bot in startSquares) {
            bot = Number(bot);
            if (JSON.stringify(startSquares[bot]) === JSON.stringify([y, x])) {
              let [symbolState] = makeSymbolState("operation", "S", y, x, bot);
              return update(makeEmptySquare(), {operation: {[bot]: {$set: symbolState}}});
            }
          }
        }
        let levelValue = String.fromCharCode(levelGrid.at(y, x));
        if (levelValue === "x") return makeFixedCell("cellSymbol", "x", y, x);
        if (levelValue === "+") return makeFixedCell("cellSymbol", "+", y, x);
        if (y < board.m && x < board.n && !cellAllowed(levelValue)) return makeEmptySquare();
        return {...square};
      }));
      levelGrid.delete();
      board.delete();
      this.setState(newState, this.resetBoard);
    }
  }

  setBoardHandler = event => {
    if (this.state.simState !== "stop") this.simHandler("stop");
    this.loadSubmission(this.state.submission);
  }

  clearBoardHandler = event => {
    this.setBoardToLevel(this.state.levelName, this.state.levelData, {keepHistory: true, clearBoard: true});
  }

  symbolClickHandler = symbolState => {
    if (this.state.simState !== "stop") return;
    this.setSelected(symbolState);
  }

  changeSymbolOption = event => {
    if (this.state.selectedSymbolStates.size === 1) {
      const value = event.target.value;
      this.setState((state, props) => {
        const selectedSymbolState = this.state.selectedSymbolStates.values().next().value;
        let newState = update(state, nest(selectedSymbolState.trace, {value: {$set: value}}));
        newState.selectedSymbolStates = new Set([getNested(newState, selectedSymbolState.trace)]);
        newState.flipflop = -state.flipflop;
        return newState;
      });
    }
  }

  dragHandler = (event, symbolState) => {
    if (this.state.simState !== "stop") {
      event.preventDefault();
      return;
    }
    switch (event.type) {
    case "dragstart":
      let symbolType = symbolTypeByState(symbolState);
      if (symbolState.onBoard) event.dataTransfer.effectAllowed = "move";
      else event.dataTransfer.effectAllowed = "copy";
      if (!symbolState.selected) this.setSelected(symbolState);
      this.setState({draggedSymbolState: symbolState});
      break;
    case "drag":
      break;
    case "drop": // control received from dragOverHandler
    case "dragend":
      this.setState({draggedSymbolState: nullSymbolState});
      break;
    }
  }

  dragOverHandler = (event, {y, x, special, onDrop}) => {
    if (!this.state.draggedSymbolState.value) return;
    if (special) {
      switch (event.type) {
      case "dragenter":
        event.preventDefault(); // allow drop
        this.setState((state, props) => {
          const semaphore = state.dragOverPosition === special ? state.dragOverPositionSemaphore + 1 : 1;
          return {
            dragOverPosition: special,
            dragOverPositionSemaphore: semaphore,
            dragOverSet: null,
            dragOverFits: false,
          };
        });
        break;
      case "dragover":
        event.preventDefault(); // allow drop
        break;
      case "drop":
        if (onDrop) onDrop();
        // dragend doesn't trigger, so trigger it manually
        this.dragHandler(event, this.state.draggedSymbolState);
        // waterfall
      case "dragleave":
        this.setState((state, props) => {
          if (state.dragOverPosition !== special) return null;
          const semaphore = state.dragOverPositionSemaphore - 1;
          let newState = {}
          newState.dragOverPositionSemaphore = semaphore;
          if (semaphore === 0) newState.dragOverPosition = null;
          return newState;
        });
        break;
      }
    } else {
      let fits = true;
      this.state.selectedSymbolStates.forEach(symbolState => {
        if (symbolState.onBoard) {
          var _y =  symbolState.trace[1]  + y - this.state.draggedSymbolState.trace[1];
          var _x =  symbolState.trace[2]  + x - this.state.draggedSymbolState.trace[2];
        } else {
          var [_y, _x] = [y, x];
        }
        fits &= this.fits(this.state, this.props, symbolState, _y, _x);
      });
      switch (event.type) {
      case "dragenter":
        if (fits) event.preventDefault(); // allow drop
        this.setState((state, props) => {
          const draggedSymbolStates = state.draggedSymbolState.onBoard ? state.selectedSymbolStates : new Set([state.draggedSymbolState]);
          const semaphore = JSON.stringify(state.dragOverPosition) === JSON.stringify([y, x]) ? state.dragOverPositionSemaphore + 1 : 1;
          return {
            dragOverPosition: [y, x],
            dragOverPositionSemaphore: semaphore,
            dragOverSet: this.getCopySymbolsUpdater(state, props, state.draggedSymbolState, [y, x], draggedSymbolStates, true)[0],
            dragOverFits: fits,
          };
        });
        break;
      case "dragover":
        if (fits) event.preventDefault(); // allow drop
        break;
      case "drop":
        // dragend doesn't trigger, so trigger it manually
        this.copyOrMoveSymbols(this.state.draggedSymbolState, [y, x], {dragging: true});
        this.dragHandler(event, this.state.draggedSymbolState);
        // waterfall
      case "dragleave":
        this.setState((state, props) => {
          if (JSON.stringify(state.dragOverPosition) !== JSON.stringify([y, x])) return null;
          const semaphore = state.dragOverPositionSemaphore - 1;
          let newState = {}
          newState.dragOverPositionSemaphore = semaphore;
          if (semaphore === 0) {
            newState.dragOverPosition = null;
            newState.dragOverSet = null;
            newState.dragOverFits = false;
          }
          return newState;
        });
        break;
      }
    }
  }

  openModalHandler = () => {
    this.setState({showModal: true});
  }
  closeModalHandler = () => {
    this.setState({showModal: false});
  }
}

class Toggle extends React.PureComponent {
  render() {
    return (
      <div className={`toggle ${this.props.name}-toggle`}>
        {Object.keys(this.props.options).map(option =>
        <React.Fragment key={`radio-${option}`}>
          <input type="radio" id={`radio-${option}`} value={option} name={this.props.name}
            // == to equate "1" with 1
            checked={this.props.selected == option}
            onClick={this.handler}
            readOnly
          />
          <label htmlFor={`radio-${option}`} className={(this.props.colors||{})[option]}>{this.props.options[option]}</label>
        </React.Fragment>
        )}
      </div>
    );
  }
  handler = event => this.props.handler(event.target.value);
}

class SymbolGroup extends React.PureComponent {
  render() {
    if (!this.props.active) return null;
    const symbolState = this.props.symbolState;
    const symbolType = symbolTypeByState(symbolState);
    const Component = symbolType.svg || symbolType.options[symbolState.value][1];
    let classNames = [];
    classNames.push("image-container");
    classNames.push("symbolgroup");
    classNames.push(symbolState.type);
    classNames.push(`symbol-${symbolState.value}`);
    if (this.props.symbolState.selected) classNames.push("selected");
    classNames.push(symbolType.className || "");
    classNames.push(symbolType.multi || "");
    if (this.props.held) classNames.push("held");
    classNames = classNames.join(" ");
    return (
      <div className={classNames} onClick={this.clickHandler} onDrag={this.dragHandler} onDragStart={this.dragHandler} onDragEnd={this.dragHandler} draggable>
        <Component className="image-base"/>
      </div>
    );
  }
  clickHandler = () => { this.props.clickHandler(this.props.symbolState); };
  dragHandler = (event) => { this.props.dragHandler(event, this.props.symbolState); };
}

class SymbolOptions extends React.PureComponent {
  render() {
    const symbolType = this.props.selectedSymbolState ? symbolTypeByState(this.props.selectedSymbolState) : {};
    return (
      <div className="symbol-options">
        {Object.entries(symbolType.options || []).map(([value, [option, svg]]) =>
        <OptionItem key={value} value={value} option={option} subtype={symbolType.subtype} {...this.props}/>
        )}
      </div>
    );
  }
}

class OptionItem extends React.PureComponent {
  render() {
    return (
      <div style={{display:"flex", alignItems:"center"}} key={`radio-option-${this.props.option}`}>
        <input type="radio" id={`radio-${this.props.value}`} value={this.props.value} name={`radio-for-${this.props.subtype}`}
          checked={this.props.selectedSymbolState && this.props.selectedSymbolState.value === this.props.value}
          onChange={this.props.changeOption}
        />
        <label htmlFor={`radio-${this.props.value}`}>{this.props.option}</label>
      </div>
    );
  }
}

class ResultsChart extends React.PureComponent {
  render() {
    const binnedData = this.props.values.counts.map((count, i) => ({
      id: `${i}`,
      bin0: this.props.values.bin0 + i * this.props.values.binWidth,
      bin1: this.props.values.bin0 + (i + 1) * this.props.values.binWidth,
      count: count,
    }));
    let ownBinnedData = null;
    if (this.props.own) {
      ownBinnedData = [{
        id: `own`,
        bin0: this.props.own,
        bin1: this.props.own+1,
        count: Math.max(...this.props.values.counts),
      }];
    }
    return (
      <Charts.Histogram
        ariaLabel="Statistics"
        height={400}
        width={400}
      >
        <Charts.PatternLines
          id={`pattern-${this.props.name}`}
          height={8}
          width={8}
          background="none"
          stroke="#22b8cf"
          strokeWidth={0.5}
          orientation={[ "diagonal" ]}
        />
        <Charts.BarSeries animated binnedData={binnedData} stroke="#22b8cf" fill={`url(#pattern-${this.props.name})`}/>
        {ownBinnedData && <Charts.BarSeries animated binnedData={ownBinnedData} stroke="#00f"/>}
        <Charts.XAxis
          label={this.props.label}
        />
        <Charts.YAxis
          label=" "
          numTicks={0}
        />
      </Charts.Histogram>
    );
  }
}

class ResultsModal extends React.PureComponent {
  render() {
    const cyclesBinnedData = this.props.stats.cycles.counts.map((count, i) => ({
      id: `${i}`,
      bin0: this.props.stats.cycles.bin0 + i * this.props.stats.cycles.binWidth,
      bin1: this.props.stats.cycles.bin0 + (i + 1) * this.props.stats.cycles.binWidth,
      count: count,
    }));
    const symbolsBinnedData = this.props.stats.symbols.counts.map((count, i) => ({
      id: `${i}`,
      bin0: this.props.stats.symbols.bin0 + i * this.props.stats.symbols.binWidth,
      bin1: this.props.stats.symbols.bin0 + (i + 1) * this.props.stats.symbols.binWidth,
      count: count,
    }));
    return (
      <Modal
        isOpen={this.props.isOpen}
        onRequestClose={this.props.closeModalHandler}
        contentLabel="Result Statistics"
        overlayClassName="modal-overlay"
        className="modal-content"
      >
        <div className="modal-title">
          Assignment Complete!
        </div>
        <div className="charts">
          <ResultsChart name="cycles" values={this.props.stats.cycles} own={(this.props.results||{}).cycles} label="Elapsed Cycles"/>
          <ResultsChart name="symbols" values={this.props.stats.symbols} own={(this.props.results||{}).symbols} label="Symbols Used"/>
        </div>
        <div className="modal-buttons">
          <button className="modal-close-button" onClick={this.props.closeModalHandler}>Go Back</button>
          <button className="modal-next-button" onClick={this.props.closeModalHandler}>Next</button>
        </div>
      </Modal>
    );
  }
}
