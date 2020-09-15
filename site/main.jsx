import React from "react";
import ReactDOM from "react-dom";
import update from "immutability-helper";

import "./main.css";
import * as Svgs from "./svgs.jsx";
import Embindings from "./embindings.js";
import EmbindingsWASM from "./embindings.wasm";

const MAX_HISTORY = 1000;

function nest(seq, value, obj={}, start=0) {
  if (start === seq.length) return value;
  obj[seq[start]] = nest(seq, value, obj[seq[start]] || {}, start + 1);
  return obj;
}
function getNested(obj, seq, start=0) {
  if (start === seq.length) return obj;
  return getNested(obj[seq[start]], seq, start + 1);
}

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
  console.log("loaded");
});

var levels = {
  "not": "../examples/not.lvl",
  "and": "../examples/and.lvl",
  "delay": "../examples/delay.lvl",
  "switch": "../examples/switch.lvl",
  "xor": "../examples/xor.lvl",
  "median": "../examples/median.lvl",
  "rainbow": "../examples/rainbow.lvl",
  "adder": "../examples/adder.lvl",
  "stack": "../examples/stack.lvl",
};

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
  {type: "cellSymbol", subtype: "/", value: "/", svg: Svgs.XCell, className: "resolved-1 latched"},
  {type: "cellSymbol", subtype: "\\", value: "\\", svg: Svgs.XCell, className: "resolved-0 latched"},
  {type: "cellSymbol", subtype: "x", value: "x", svg: Svgs.XCell, className: "resolved-x unlatched"},
  {type: "cellSymbol", subtype: "+", value: "+", svg: Svgs.PlusCell, className: "resolved-x unlatched"},
  {type: "cellSymbol", subtype: "-", value: "-", svg: Svgs.PlusCell, className: "resolved-1 latched"},
  {type: "cellSymbol", subtype: "|", value: "|", svg: Svgs.PlusCell, className: "resolved-0 latched"},
  {type: "cellSymbol", subtype: "][", value: "][", svg: Svgs.HorizontalCell, multi: "horizontal"},
  {type: "cellSymbol", subtype: "W\nM", value: "WM", svg: Svgs.VerticalCell, multi: "vertical"},
  {type: "cellSymbol", subtype: "<x", value: "<x", svg: Svgs.DiodeLeft, multi: "horizontal"},
  {type: "cellSymbol", subtype: "x\nv", value: "xv", svg: Svgs.DiodeDown, multi: "vertical"},
  {type: "cellSymbol", subtype: "^\nx", value: "^x", svg: Svgs.DiodeUp, multi: "vertical"},
  {type: "cellSymbol", subtype: "x>", value: "x>", svg: Svgs.DiodeRight, multi: "horizontal"},
];
const symbolTypesDirection = [
  {type: "direction", subtype: "<", value: "<", svg: Svgs.DirectionLeft},
  {type: "direction", subtype: "v", value: "v", svg: Svgs.DirectionDown},
  {type: "direction", subtype: ">", value: ">", svg: Svgs.DirectionRight},
  {type: "direction", subtype: "^", value: "^", svg: Svgs.DirectionUp},
];
const symbolTypesOperation = [
  {type: "operation", subtype: "START", value: "S", svg: Svgs.Start},
  {type: "operation", subtype: "NEXT", value: "n", svg: Svgs.Next},
  {type: "operation", subtype: "GRAB/DROP", options: {g: ["GRAB", Svgs.Grab], d: ["DROP", Svgs.Drop], w: ["GRAB/DROP", Svgs.Swap]}},
  {type: "operation", subtype: "LOCK/FREE", options: {l: ["LOCK", Svgs.Latch], u: ["FREE", Svgs.Unlatch], t: ["LOCK/FREE", Svgs.ToggleLatch]}},
  {type: "operation", subtype: "RESET", value: "*", svg: Svgs.Relatch},
  {type: "operation", subtype: "SYNC", value: "s", svg: Svgs.Sync},
  {type: "operation", subtype: "ROTATE", value: "r", svg: Svgs.Rotate},
  {type: "operation", subtype: "BRANCH(|/)", options: {"<": ["<", Svgs.Branch1Left], "v": ["v", Svgs.Branch1Down], ">": [">", Svgs.Branch1Right], "^": ["^", Svgs.Branch1Up]}},
  {type: "operation", subtype: "BRANCH(-\\)", options: {"[": ["<", Svgs.Branch0Left], "W": ["v", Svgs.Branch0Down], "]": [">", Svgs.Branch0Right], "M": ["^", Svgs.Branch0Up]}},
  {type: "operation", subtype: "POWER", options: {p: ["TOGGLE POWER 1", Svgs.Power0], P: ["TOGGLE POWER 2", Svgs.Power1]}},
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
  return symbolTypes.map((symbolType, i) => SymbolState({
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
    dragged: false,
  }, props);
}
const nullSymbolState = SymbolState();

class Symbol extends React.PureComponent {
  constructor(props) {
    super(props);
    this.clickHandler = this.clickHandler.bind(this);
    this.dragHandler = this.dragHandler.bind(this);
  }

  clickHandler(event) {
    event.stopPropagation();
    this.props.clickHandler(this.props.y, this.props.x, this.props.symbolState);
  }

  dragHandler(event) {
    event.stopPropagation();
    this.props.dragHandler(event, this.props.symbolState);
  }

  render() {
    var classNames = []
    classNames.push("symbol");
    classNames.push("image-container");
    if (this.props.symbolState.selected) classNames.push("selected");
    if (this.props.symbolState.dragged) classNames.push("dragged");
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
      classNames.push(`bot${this.props.bot}`);
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
  constructor(props) {
    super(props);
    this.clickHandler = this.clickHandler.bind(this);
    this.dragOverHandler = this.dragOverHandler.bind(this);
  }

  clickHandler() {
    this.props.clickHandler(this.props.y, this.props.x, null, null);
  }

  dragOverHandler(event) {
    this.props.dragOverHandler(event, this.props.y, this.props.x);
  }

  renderSymbol(props) {
    const selected = props.symbolState.selected;
    const dragged = props.symbolState.dragged;
    return (
      <Symbol
        y={this.props.y}
        x={this.props.x}
        index={0}
        simBoard={this.props.simBoard}
        stopped={this.props.stopped}
        flipflop={(dragged || selected) && this.props.flipflop}
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
    classNames = classNames.join(" ");
    var cellBotClassNames = [];
    if (this.props.bot0) cellBotClassNames.push("bot0");
    if (this.props.bot1) cellBotClassNames.push("bot1");
    if (this.props.dragOver) cellBotClassNames.push("dragover");
    cellBotClassNames = cellBotClassNames.join(" ");
    const cellSymbolType = symbolTypeByState(this.props.cellSymbol);
    return (
      <div className={classNames} onClick={this.clickHandler} onDragEnter={this.dragOverHandler} onDragOver={this.dragOverHandler} onDragLeave={this.dragOverHandler} onDrop={this.dragOverHandler}>
        <div className="square-underlay"></div>
        <div className={`square-overlay ${cellBotClassNames}`}>
          <Svgs.CellBot/>
        </div>
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
    const dragOver = this.props.dragOverRange && this.props.dragOverRange[0] <= props.y && this.props.dragOverRange[1] <= props.x  && props.y < this.props.dragOverRange[2] && props.x < this.props.dragOverRange[3];
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

class Game extends React.Component {
  constructor(props) {
    super(props);
    this.dragHandler = this.dragHandler.bind(this);
    this.dragOverHandler = this.dragOverHandler.bind(this);
    this.symbolClickHandler = this.symbolClickHandler.bind(this);
    this.boardClickHandler = this.boardClickHandler.bind(this);
    this.changeSymbolOption = this.changeSymbolOption.bind(this);
    this.symbolTypeHandler = this.symbolTypeHandler.bind(this);
    this.botHandler = this.botHandler.bind(this);
    this.simHandler = this.simHandler.bind(this);
    this.keyboardHandler = this.keyboardHandler.bind(this);
    this.resetBoard = this.resetBoard.bind(this);
    this.resetCells = this.resetCells.bind(this);
    this.trash = this.trash.bind(this);
    this.setLevelHandler = this.setLevelHandler.bind(this);
    this.setBoardHandler = this.setBoardHandler.bind(this);
    this.loadSubmission = this.loadSubmission.bind(this);
    this.setSubmission = this.setSubmission.bind(this);
    this.makeEmptySquare = this.makeEmptySquare.bind(this);
    this.setSelected = this.setSelected.bind(this);
    this.getClearSelected = this.getClearSelected.bind(this);
    this.state = {
      levelName: Object.keys(levels)[0],
      levelData: null,
      squares: Array.from({length: this.props.m}, e => Array.from({length: this.props.n}, this.makeEmptySquare)),
      submission: "",
      submissionHistory: [],
      submissionFuture: [],
      submissionIndex: -1,
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
      selectedSymbolStates: [],
      selectedOnBoard: false,
      selectionSymbolStateCellSymbols: initialSelectionSymbolStates("selectionSymbolStateCellSymbols", symbolTypesCellSymbol),
      selectionSymbolStateInstructions: initialSelectionSymbolStates("selectionSymbolStateInstructions", [...symbolTypesDirection, ...symbolTypesOperation]),
      draggedSymbolStates: [],
      dragOverRange: null,
      // state change indicator alternate between +/-1
      flipflop: 1,
    };
  }

  componentDidMount() {
    window.addEventListener("keydown", this.keyboardHandler)
    this.setLevelHandler({target: {value: this.state.levelName}});
  }

  componentWillUnmount() {
    window.removeEventListener("keydown", this.keyboardHandler)
  }

  makeSubmission(squares, m, n) {
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

  renderSymbolGroup(type, symbolState) {
    return (
      <SymbolGroup
        key={symbolTypeByState(symbolState).subtype}
        active={this.state.symbolType===type}
        dragHandler={this.dragHandler}
        clickHandler={this.symbolClickHandler}
        bot={this.state.bot}
        symbolState={symbolState}
      />
    );
  }

  makeEmptySquare() {
    return {
      cellSymbol: nullSymbolState,
      cellSymbolIndex: null,
      direction: [nullSymbolState, nullSymbolState],
      operation: [nullSymbolState, nullSymbolState],
    }
  }

  makeFixedCell(...args) {
    let square = this.makeEmptySquare();
    let [xSymbolValue] = this.makeSymbolState(...args);
    square.cellSymbol = xSymbolValue;
    square.cellSymbolIndex = 0;
    return square;
  }

  makeSymbolState(type, c, y, x, bot) {
    if ("._ ".includes(c)) return [nullSymbolState];
    let symbols = symbolTypesByValue[type];
    for (let symbolValue in symbols) {
      if (symbolValue.includes(c)) {
        if (type == "cellSymbol") {
          var symbolState = SymbolState({type:type, value:symbolValue, onBoard:true, trace:["squares", y, x, type]});
        } else {
          var symbolState = SymbolState({type:type, value:symbolValue, onBoard:true, trace:["squares", y, x, type, bot]});
        }
        if (symbols[symbolValue].multi === "horizontal") return [symbolState, 0, c === ">" ? -1 : 1];
        else if (symbols[symbolValue].multi === "vertical") return [symbolState, c === "v" ? -1 : 1, 0];
        else return [symbolState];
      }
    }
    return [];
  }

  loadSubmission(submission, {undoredo}={}) {
    var makeNewState = (state, props) => {
      var newState = {squares: state.squares.map(row => row.map(square => {
        let d = {};
        for (let key in square) {
          if (Array.isArray(square[key])) d[key] = square[key].map(_ => nullSymbolState);
          else d[key] = nullSymbolState;
        }
        return d;
      }))};
      var parse = (type, bot, lines) => {
        if (lines.length !== state.board.m) return false;
        let grid = Array.from({length: this.state.board.m}).map(row => Array(this.state.board.n).fill(nullSymbolState));
        let indices = Array.from({length: this.state.board.m}).map(row => Array(this.state.board.n).fill(null));
        for (let y=0; y<grid.length; ++y) {
          if (lines[y].length !== state.board.n) return false;
          for (let x=0; x<grid[y].length; ++x) if (!grid[y][x].value) {
            let [value, dy, dx] = this.makeSymbolState(type, lines[y][x], y, x, bot);
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
            newState.squares[y][x].cellSymbol = grid[y][x];
            newState.squares[y][x].cellSymbolIndex = indices[y][x];
          } else {
            newState.squares[y][x][type][bot] = grid[y][x];
          }
        }
        return true;
      };
      var lines = submission.split(/(?:\r?\n)+/);
      var valid = true;
      valid &= parse("cellSymbol", null, lines.slice(0, state.board.m));
      valid &= parse("direction", 0, lines.slice(state.board.m, 2*state.board.m));
      valid &= parse("operation", 0, lines.slice(2*state.board.m, 3*state.board.m));
      valid &= parse("direction", 1, lines.slice(3*state.board.m, 4*state.board.m));
      valid &= parse("operation", 1, lines.slice(4*state.board.m, 5*state.board.m));
      if (!valid) {
        return ["Could not parse input", null];
      }
      return [null, newState];
    };
    this.resetBoard({makeNewState, undoredo});
  }

  render() {
    return (
      <div id="main-content" style={{display:"flex"}}>
        <div className="level-selector-sidebar" style={{display:"flex", flexDirection:"column"}}>
          <div>
            <label htmlFor="level_select">Choose level:</label>
            <select name="level_select" id="level_select" value={this.state.levelName} onChange={this.setLevelHandler}>
              {Object.keys(levels).map(levelName => <option key={levelName} value={levelName}>{levelName}</option>)}
            </select>
          </div>
          <textarea name="submission" id="submission" value={this.state.submission} onChange={this.setSubmission}/>
          <input type="button" value="Load" onClick={this.setBoardHandler}/>
        </div>
        <div className="center-content" style={{display:"flex", flexDirection:"column", alignItems:"center", width:"min-content"}}>
          <div style={{display:"flex", width:"min-content"}} className="game-board">
            <Board
              clickHandler={this.boardClickHandler}
              dragHandler={this.dragHandler}
              dragOverHandler={this.dragOverHandler}
              dragOverRange={this.state.dragOverRange}
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
              <Toggle handler={this.symbolTypeHandler} selected={this.state.symbolType} name="symbol-type" options={{cellSymbol:"Cells", instruction:"Instructions"}}/>
              <Toggle handler={this.botHandler} selected={this.state.bot} name="bot" options={["Red", "Blue"]} colors={botColors}/>
              <Toggle handler={this.simHandler} selected={this.state.simState} name="sim" options={{stop:"⏹", pause:"⏸", step:"⧐", play:"▶", fast:"⏩", nonstop:"⏩", batch:"⏭"}}/>
              <div style={{flex:1}}></div>
              <div className={`trash ${this.state.selectedSymbolStates.length && this.state.selectedOnBoard ? "active" : "inactive"}`} onClick={this.trash}>🗑</div>
            </div>
            <div className={`symbol-bar bot${this.state.bot}`} style={{display:"flex", flexDirection:"row"}}>
              <div className="symbol-grid-bar grid-layout" style={{flex:3}}>
                {this.state.selectionSymbolStateCellSymbols.map(symbolState => this.renderSymbolGroup("cellSymbol", symbolState))}
                {this.state.selectionSymbolStateInstructions.map(symbolState => this.renderSymbolGroup("instruction", symbolState))}
              </div>
              <div className="symbol-options-bar" style={{flex:1, display:"flex", flexDirection:"column"}}>
                <SymbolOptions changeOption={this.changeSymbolOption} selectedSymbolState={this.state.selectedSymbolStates.length === 1 && this.state.selectedSymbolStates[0]}/>
              </div>
            </div>
          </div>
        </div>
        <div className="stats-sidebar" style={{display:"flex", flexDirection:"column"}}>
          <div className="colon-list">
            <div className="test-case">
              <span className="test-case-name">Test Case</span><span><span className="test-case-value">{this.state.testCase + 1}</span> / <span className="test-case-total">{this.state.outputColors.length}</span></span>
            </div>
            {(this.state.inputBits[this.state.testCase] || []).map((input, i) =>
            <div key={i} className="input-colors">
              <span className="input-name">Input{this.state.inputs.length > 1 ? ` ${i+1}` : ""}</span>
              <span className="colors">
                {input.map((bit, k) => {
                    let colors = "GB";
                    return <span key={k} className={`input-color ${k < this.state.step - this.state.wasNext ? "past" : ""} ${k === this.state.step - this.state.wasNext ? "present" : ""} ${k > this.state.step - this.state.wasNext ? "future" : ""}`} color={colors[Number(bit)]}>{colors[Number(bit)]}</span>;
                })}
              </span>
            </div>
            )}
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
          </div>
          <br/>
          <div className="colon-list">
            {this.state.error ? <div><span className="error">Error</span><span className="error-value">{this.state.error}</span></div> : "" }
          </div>
          <br/>
          { this.state.status === Module.Status.DONE && <div className="finished">Finished level!</div> }
        </div>
      </div>
    );
  }

  getClearSelected(state, props) {
    let delta = {};
    state.selectedSymbolStates.map(symbolState => nest(symbolState.trace, {selected: {$set: false}}, delta));
    let newState = update(state, delta);
    newState.selectedSymbolStates = [];
    return newState;
  }

  setSelected(symbolState) {
    this.setState((state, props) => {
      let newState = this.getClearSelected(state, props);
      newState = update(newState, nest(symbolState.trace, {selected: {$set: true}}));
      newState.selectedSymbolStates = [getNested(newState, symbolState.trace)];
      newState.selectedOnBoard = newState.selectedSymbolStates[0].onBoard;
      return newState;
    });
  }

  botHandler(value) { this.setState({bot: value}, () => this.symbolTypeHandler("instruction")); }
  symbolTypeHandler(value) {
    this.setState((state, props) => {
      if (state.symbolType !== value) {
        if (state.selectedSymbolStates.length === 1 && !state.selectedSymbolStates[0].onBoard) {
          return Object.assign(this.getClearSelected(state, props), {symbolType: value});
        } else {
          return {symbolType: value};
        }
      }
    });
  }
  simHandler(value) {
    const INITIAL_DELAY = 200; // ms
    const PLAY_INTERVAL = 1000; // ms
    const FAST_INTERVAL = 100; // ms
    const NONSTOP_INTERVAL = 0; // ms
    var self = this;
    var needsToResetCells = false;
    this.setState((state, props) => {
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
      });
  }

  boardClickHandler(y, x, symbolState) {
    if (this.state.simState !== "stop") return;
    if (symbolState) {
      if (this.state.inputs.some(square => matchLocation(square, y, x))) {
        // inputs are fixed
        return;
      } else if (this.state.outputs.some(square => matchLocation(square, y, x))) {
        // outputs are fixed
        return;
      } else {
        this.setSelected(symbolState);
      }
    } else if (this.state.selectedOnBoard) {
      this.setState(this.getClearSelected);
    } else {
      if (this.state.selectedSymbolStates.length === 1) {
        const selectedSymbolState = this.state.selectedSymbolStates[0];
        const symbolType = symbolTypeByState(selectedSymbolState);
        var locs = [[y, x]];
        // js doesn't have references...
        if (symbolType.type === "cellSymbol") {
          var current = this.state.squares[y][x].cellSymbol;
          if (symbolType.multi === "horizontal") {
            if (x + 1 >= this.props.n) return;
            locs.push([y, x + 1]);
            var partner = this.state.squares[y][x + 1].cellSymbol;
          } else if (symbolType.multi === "vertical") {
            if (y + 1 >= this.props.m) return;
            locs.push([y + 1, x]);
            var partner = this.state.squares[y + 1][x].cellSymbol;
          } else {
            var partner = nullSymbolState;
          }
          var selectedSymbolClone  = Object.assign({}, selectedSymbolState, {
            onBoard: true,
            trace: ["squares", y, x, symbolType.type],
            selected: false,
            dragged: false,
          });
        } else {
          var current = this.state.squares[y][x][symbolType.type][this.state.bot];
          var partner = nullSymbolState;
          var selectedSymbolClone  = Object.assign({}, selectedSymbolState, {
            onBoard: true,
            bot: this.state.bot,
            trace: ["squares", y, x, symbolType.type, this.state.bot],
            selected: false,
            dragged: false,
          });
        }
        for (let loc of locs) {
          let [_y, _x] = loc;
          if (this.state.inputs.some(square => matchLocation(square, _y, _x))) {
            // inputs are fixed
            return;
          } else if (this.state.outputs.some(square => matchLocation(square, _y, _x))) {
            // outputs are fixed
            return;
          } else if (this.state.outputs.some(square => matchLocation(square, _y, _x))) {
            // TODO: this check is not necessary if outputs are fixed
            let value = selectedSymbolState.value;
            // outputs can only be unlatched 1x1 cells
            if (value !== "x" && value !== "+") return;
          } else if (!((this.state.trespassable || {})[_y] || {})[_x]) return;
        }
        if (!current.value && !partner.value) {
          let newState = {squares: this.state.squares.map(row => row.map(square => ({...square})))};
          if (symbolType.type === "cellSymbol") {
            newState.squares[y][x].cellSymbol = selectedSymbolClone;
            newState.squares[y][x].cellSymbolIndex = 0;
            if (symbolType.multi === "horizontal") {
              newState.squares[y][x + 1].cellSymbol = selectedSymbolClone;
              newState.squares[y][x + 1].cellSymbolIndex = 1;
            } else if (symbolType.multi === "vertical") {
              newState.squares[y + 1][x].cellSymbol = selectedSymbolClone;
              newState.squares[y + 1][x].cellSymbolIndex = 1;
            }
          } else {
            newState.squares[y][x][symbolType.type][this.state.bot] = selectedSymbolClone;
          }
          this.setState(newState, this.resetBoard);
        }
      }
    }
  }

  keyboardHandler(event) {
    if (isTextBox(event.target)) return;
    if (event.ctrlKey) {
      switch (event.key) {
      case "z": return this.undo();
      case "Z": return this.redo();
      }
    }
  }

  undo() {
    if (this.state.submissionHistory.length > 1) {
      let item = this.state.submissionHistory.pop();
      this.state.submissionFuture.push(item);
      item = this.state.submissionHistory[this.state.submissionHistory.length - 1]
      this.loadSubmission(item, {undoredo:true});
    }
  }

  redo() {
    if (this.state.submissionFuture.length) {
      let item = this.state.submissionFuture.pop();
      this.state.submissionHistory.push(item);
      this.loadSubmission(item, {undoredo:true});
    }
  }

  resetBoard({...args}) {
    this.setState((state, props) => {
      if (args.makeNewState) {
        var [error, newState] = args.makeNewState(state, props);
        if (error) return {error: error};
      } else var newState = {};
      if (state.board) state.board.delete();
      let stateGet = key => newState[key] || state[key];
      newState.submission = this.makeSubmission(stateGet("squares"), props.m, props.n);
      if (args.undoredo) {
        // don't have to reset each square's selected field because they were newly created by undo/redo
        if (state.selectedOnBoard) newState.selectedSymbolStates = [];
      } else {
        if (newState.submission !== state.submissionHistory[state.submissionHistory.length-1]) {
          state.submissionHistory.push(newState.submission);
          if (state.submissionHistory.length > 2 * MAX_HISTORY) state.submissionHistory = state.submissionHistory.slice(state.submissionHistory.length - MAX_HISTORY);
          newState.submissionFuture = [];
        }
      }
      newState.board = Module.LoadBoard(stateGet("levelData"), newState.submission);
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

  resetCells() {
    this.setState((state, props) => {
      var newState = {};
      newState.wasNext = state.board.was_next;
      newState.testCase = state.board.test_case;
      newState.step = state.board.step;
      newState.cycle = state.board.cycle;
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
    });
  }

  move(steps=1) {
    for (let i=0; i<steps; ++i) {
      this.state.board.move();
    }
    this.resetCells();
  }

  trash() {
    if (this.state.selectedOnBoard) {
      this.setState((state, props) => {
        let removeSelected = symbolState => symbolState.selected ? nullSymbolState : symbolState;
        let newState = {};
        newState.squares  = state.squares.map(row => row.map(square => ({
          cellSymbol: removeSelected(square.cellSymbol),
          cellSymbolIndex: square.cellSymbolIndex,
          direction: square.direction.map(removeSelected),
          operation: square.operation.map(removeSelected),
        })));
        newState.selectedSymbolStates = [];
        return newState;
      }, this.resetBoard);
    }
  }

  setSubmission(event) {
    this.setState({submission: event.target.value});
  }

  setLevelHandler(event) {
    var value = event.target.value;
    if (this.state.levelData == null || value !== this.state.levelName) {
      var path = levels[value];
      getFileFromServer(path, (text) => {
        if (text) {
          if (this.state.simState !== "stop") this.simHandler("stop");
          var newState = {
            levelName: value,
            levelData: text,
            submissionHistory: [],
            submissionFuture: [],
          }
          var submission = this.makeSubmission(this.state.squares, this.props.m, this.props.n);
          var board = Module.LoadBoard(text, submission);
          var inputs = board.get_inputs();
          var inputLocations = Array.from({length: inputs.size()}).map((_, i) => inputs.get(i).location);
          inputs.delete();
          let levelGrid = board.get_level();
          newState.squares = this.state.squares.map((row, y) => row.map((square, x) => {
            let levelValue = String.fromCharCode(levelGrid.at(y, x));
            if (levelValue === "x") return this.makeFixedCell("cellSymbol", "x", y, x);
            if (levelValue === "+") return this.makeFixedCell("cellSymbol", "+", y, x);
            if (y < board.m && x < board.n && !cellAllowed(levelValue)) return this.makeEmptySquare();
            return {...square};
          }));
          levelGrid.delete();
          board.delete();
          this.setState(newState, this.resetBoard);
        }
      });
    }
  }

  setBoardHandler(event) {
    if (this.state.simState !== "stop") this.simHandler("stop");
    this.loadSubmission(this.state.submission);
  }

  symbolClickHandler(symbolState) {
    if (this.state.simState !== "stop") return;
    this.setSelected(symbolState);
  }

  changeSymbolOption(event) {
    if (this.state.selectedSymbolStates.length === 1) {
      const value = event.target.value;
      this.setState((state, props) => {
        const selectedSymbolState = this.state.selectedSymbolStates[0];
        let newState = update(state, nest(selectedSymbolState.trace, {value: {$set: value}}));
        newState.selectedSymbolStates = [getNested(newState, selectedSymbolState.trace)];
        newState.flipflop = -state.flipflop;
        return newState;
      });
    }
  }

  dragHandler(event, symbolState) {
    switch (event.type) {
    case "dragstart":
      let symbolType = symbolTypeByState(symbolState);
      symbolState.classNames = "drag";
      if (symbolState.onBoard) event.dataTransfer.effectAllowed = "move";
      else event.dataTransfer.effectAllowed = "copy";
      this.setState({draggedSymbolState: symbolState});
      break;
    case "drag":
      break;
    case "dragend":
      symbolState.classNames = "";
      this.setState({draggedSymbolState: nullSymbolState});
      break;
    }
  }

  dragOverHandler(event, y, x) {
    switch (event.type) {
    case "dragenter":
      event.dataTransfer.dropEffect = event.dataTransfer.effectAllowed;
      this.setState({dragOverPosition: [y, x]});
      break;
    case "dragover":
      event.dataTransfer.dropEffect = event.dataTransfer.effectAllowed;
      break;
    case "dragleave":
      this.setState((state, props) => {
        if (JSON.stringify(state.dragOverPosition) === JSON.stringify([y, x])) return {dragOverPosition: null};
        return null;
      });
      break;
    case "drop":
      break;
    }
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
    if (this.props.symbolState.dragged) classNames.push("dragged");
    classNames.push(symbolType.className || "");
    classNames.push(symbolType.multi || "");
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
