import React from "react";
import ReactDOM from "react-dom";

import "./main.css";
import * as Svgs from "./svgs.jsx";
import * as Assets from "./assets/assets.js";
import Embindings from "./embindings.js";
import EmbindingsWASM from "./embindings.wasm";

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

function Asset(props) {
  var SVG = Assets[props.src];
  return <SVG {...props}/>;
}

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
var fill_images = {
  "x": "fill_x",
  "+": "fill_plus",
  "/": "fill_blue",
  "\\": "fill_green",
  "-": "fill_red",
  "|": "fill_orange",
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

class Symbol extends React.PureComponent {
  constructor(props) {
    super(props);
    this.handler = this.handler.bind(this);
  }
  handler(event) {
    event.stopPropagation();
    this.props.handler(this.props.y, this.props.x, this.props.symbolGroup, this.props.className);
  }
  render() {
    var classNames = []
    classNames.push("symbol");
    classNames.push("image-container");
    if (this.props.selectedSymbolGroup === this.props.symbolGroup) classNames.push("selected");
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
          <Component className="image-base symbol" onClick={this.handler}/>
        </div>
      );
    } else {
      // instructions
      if (!this.props.symbolGroup || !this.props.symbolGroup.state) {
        return <div></div>;
      }
      classNames.push(`bot${this.props.bot}`);
      classNames = classNames.join(" ");
      let Component = this.props.symbolGroup.state.svg;
      return (
        <div className={`symbol-shift ${classNames} ${this.props.className}`}>
          <Component className="image-base symbol" onClick={this.handler}/>
        </div>
      );
    }
  }
}

class Square extends React.PureComponent {
  constructor(props) {
    super(props);
    this.handler = this.handler.bind(this);
  }

  handler() {
    this.props.handler(this.props.y, this.props.x, null, null);
  }

  renderSymbol(props) {
    return (
      <Symbol
        selectedSymbolGroup={this.props.selectedSymbolGroup}
        y={this.props.y}
        x={this.props.x}
        index={0}
        simBoard={this.props.simBoard}
        stopped={this.props.stopped}
        {...props}
        {...(props.symbolGroup||{}).props}
        {...(props.symbolGroup||{}).state}
        handler={this.props.handler}
      />
    );
  }

  render() {
    var classNames = [];
    if (this.props.bot0) classNames.push("bot0");
    if (this.props.bot1) classNames.push("bot1");
    if (this.props.trespassable !== undefined) classNames.push(this.props.trespassable ? "trespassable" : "untrespassable");
    if (this.props.input) classNames.push("input");
    if (this.props.output) {
      classNames.push("output");
      classNames.push(this.props.powered ? "powered" : "unpowered");
    }
    classNames = classNames.join(" ");
    return (
      <div className={`square ${classNames}`} onClick={this.handler}>
        <div className="square-underlay"></div>
        <div className="square-overlay"></div>
        <div className={`square-inset ${((this.props.unresolved || {}).props || {}).multi || ""}`}>
          {this.renderSymbol({symbolType:"cell", className:"cell", cellValue:(this.props.cell && String.fromCharCode(this.props.cell.resolved())), cell:this.props.cell, symbolGroup:this.props.unresolved, index:this.props.unresolved_index})}
        </div>
        <div className="square-inset">
          {this.renderSymbol({symbolType:"instruction", className:"bot0-symbol instruction operation", symbolGroup:this.props.operation[0]})}
          {this.renderSymbol({symbolType:"instruction", className:"bot1-symbol instruction operation", symbolGroup:this.props.operation[1]})}
          {this.renderSymbol({symbolType:"instruction", className:"bot0-symbol instruction direction", symbolGroup:this.props.direction[0]})}
          {this.renderSymbol({symbolType:"instruction", className:"bot1-symbol instruction direction", symbolGroup:this.props.direction[1]})}
        </div>
      </div>
    );
  }
}

class Board extends React.PureComponent {
  renderSquare(props) {
    return (<Square
      key={props.y,props.x}
      handler={this.props.handler}
      simBoard={this.props.simBoard}
      selectedSymbolGroup={this.props.selectedSymbolGroup}
      selectedSymbolValue={this.props.selectedSymbolValue}
      stopped={this.props.stopped}
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
  botColors = ["red", "blue"]

  constructor(props) {
    super(props);
    this.symbolHandler = this.symbolHandler.bind(this);
    this.boardHandler = this.boardHandler.bind(this);
    this.changeSymbolOption = this.changeSymbolOption.bind(this);
    this.symbolTypeHandler = this.symbolTypeHandler.bind(this);
    this.botHandler = this.botHandler.bind(this);
    this.simHandler = this.simHandler.bind(this);
    this.resetBoard = this.resetBoard.bind(this);
    this.resetCells = this.resetCells.bind(this);
    this.trash = this.trash.bind(this);
    this.setLevelHandler = this.setLevelHandler.bind(this);
    this.setBoardHandler = this.setBoardHandler.bind(this);
    this.loadSubmission = this.loadSubmission.bind(this);
    this.setSubmission = this.setSubmission.bind(this);
    this.makeEmptySquare = this.makeEmptySquare.bind(this);
    this.state = {
      levelName: Object.keys(levels)[0],
      levelData: null,
      squares: Array.from({length: this.props.m}, e => Array.from({length: this.props.n}, this.makeEmptySquare)),
      submission: "",
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
      symbolType: "unresolved",
      bot: 0,
      selectedSymbolGroup: null,
      selectedSymbolGroupState: null,
      selectedOnBoard: false,
    };
  }

  componentDidMount() {
    this.setLevelHandler({target: {value: this.state.levelName}});
  }

  makeSubmission(squares, m, n) {
    var join = func => squares.slice(0, m).map(row => row.slice(0, n).map(square => {
      let [symbolGroup, index] = func(square);
      return (((symbolGroup || {}).state || {}).value || {})[index] || "_";
    }).join("")).join("\n");
    var unresolved = join(square => [square.unresolved, square.unresolved_index])
    var direction0 = join(square => [square.direction[0], 0])
    var operation0 = join(square => [square.operation[0], 0])
    var direction1 = join(square => [square.direction[1], 0])
    var operation1 = join(square => [square.operation[1], 0])
    return [unresolved, direction0, operation0, direction1, operation1].join("\n\n");
  }

  renderSymbolGroup(type, props) {
    return (
      <SymbolGroup key={props.subtype} active={this.state.symbolType===type} handler={this.symbolHandler} selected={this.state.selectedSymbolGroup} bot={this.state.bot} botColors={this.botColors} {...props}/>
    );
  }

  symbolTypesUnresolved = [
    {type: "unresolved", subtype: "x", value: "x", svg: Svgs.XCell, className: "resolved-x unlatched"},
    {type: "unresolved", subtype: "+", value: "+", svg: Svgs.PlusCell, className: "resolved-x unlatched"},
    {type: "unresolved", subtype: "/", value: "/", svg: Svgs.XCell, className: "resolved-1 latched"},
    {type: "unresolved", subtype: "\\", value: "\\", svg: Svgs.XCell, className: "resolved-0 latched"},
    {type: "unresolved", subtype: "-", value: "-", svg: Svgs.PlusCell, className: "resolved-1 latched"},
    {type: "unresolved", subtype: "|", value: "|", svg: Svgs.PlusCell, className: "resolved-0 latched"},
    {type: "unresolved", subtype: "][", value: "][", svg: Svgs.HorizontalCell, multi: "horizontal"},
    {type: "unresolved", subtype: "W\nM", value: "WM", svg: Svgs.VerticalCell, multi: "vertical"},
    {type: "unresolved", subtype: "<x", value: "<x", svg: Svgs.DiodeLeft, multi: "horizontal"},
    {type: "unresolved", subtype: "x\nv", value: "xv", svg: Svgs.DiodeDown, multi: "vertical"},
    {type: "unresolved", subtype: "^\nx", value: "^x", svg: Svgs.DiodeUp, multi: "vertical"},
    {type: "unresolved", subtype: "x>", value: "x>", svg: Svgs.DiodeRight, multi: "horizontal"},
  ];
  symbolTypesDirection = [
    {type: "direction", subtype: "<", value: "<", svg: Svgs.DirectionLeft},
    {type: "direction", subtype: "v", value: "v", svg: Svgs.DirectionDown},
    {type: "direction", subtype: ">", value: ">", svg: Svgs.DirectionRight},
    {type: "direction", subtype: "^", value: "^", svg: Svgs.DirectionUp},
  ];
  symbolTypesOperation = [
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

  makeEmptySquare() {
    return {
      unresolved: null,
      unresolved_index: null,
      resolved: null,
      direction: [null, null],
      operation: [null, null],
    }
  }

  makeSymbol(type, c) {
    if ("._ ".includes(c)) return [null];
    var symbols;
    if (type === "unresolved") symbols = this.symbolTypesUnresolved;
    else if (type === "direction") symbols = this.symbolTypesDirection;
    else if (type === "operation") symbols = this.symbolTypesOperation;
    else return [];
    for (let symbolType of symbols) {
      if ((symbolType.value || "").includes(c)) {
        let newSymbol = {props: symbolType, state: {value: symbolType.value, name: symbolType.name}}
        newSymbol.setState = (func, callback) => {newSymbol.state = Object.assign(newSymbol.state, func(newSymbol.state, newSymbol.props)); callback()};
        if (symbolType.multi === "horizontal") return [newSymbol, 0, c === ">" ? -1 : 1];
        else if (symbolType.multi === "vertical") return [newSymbol, c === "v" ? -1 : 1, 0];
        else return [newSymbol];
      } else if (Object.values(symbolType.options || {}).includes(c)) {
        let newSymbol = {props: symbolType, state: {value: c}}
        newSymbol.setState = (func, callback) => {newSymbol.state = Object.assign(newSymbol.state, func(newSymbol.state, newSymbol.props)); callback()};
        return [newSymbol];
      }
    }
    return [];
  }

  loadSubmission(submission) {
    var success = false;
    this.setState((state, props) => {
      var newState = {squares: state.squares.map(row => row.map(square => {
        let d = {};
        for (key in square) {
          if (Array.isArray(square[key])) d[key] = square[key].map(_ => null);
          else d[key] = null;
        }
        return d;
      }))};
      var parse = (type, bot, lines) => {
        if (lines.length !== state.board.m) return false;
        let grid = Array.from({length: this.state.board.m}).map(row => Array(this.state.board.n).fill(null));
        let indices = Array.from({length: this.state.board.m}).map(row => Array(this.state.board.n).fill(null));
        for (let y=0; y<grid.length; ++y) {
          if (lines[y].length !== state.board.n) return false;
          for (let x=0; x<grid[y].length; ++x) if (!grid[y][x]) {
            let [value, dy, dx] = this.makeSymbol(type, lines[y][x]);
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
          if (type === "unresolved") {
            newState.squares[y][x].unresolved = grid[y][x];
            newState.squares[y][x].unresolved_index = indices[y][x];
          } else {
            newState.squares[y][x][type][bot] = grid[y][x];
          }
        }
        return true;
      };
      var lines = submission.split(/(?:\r?\n)+/);
      var valid = true;
      valid &= parse("unresolved", null, lines.slice(0, state.board.m));
      valid &= parse("direction", 0, lines.slice(state.board.m, 2*state.board.m));
      valid &= parse("operation", 0, lines.slice(2*state.board.m, 3*state.board.m));
      valid &= parse("direction", 1, lines.slice(3*state.board.m, 4*state.board.m));
      valid &= parse("operation", 1, lines.slice(4*state.board.m, 5*state.board.m));
      if (!valid) {
        console.log("Could not parse input");
        return null;
      }
      success = true;
      return newState;
    },
      () => { success && this.resetBoard(); });
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
              handler={this.boardHandler}
              selectedSymbolGroup={this.state.selectedSymbolGroup}
              selectedSymbolValue={((this.state.selectedSymbolGroup || {}).state || {}).value}
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
            />
          </div>
          <div className="bottom-bar" style={{display:"flex", flexDirection:"column"}}>
            <div className="toggle-bar" style={{display:"flex", flexDirection:"row"}}>
              <Toggle handler={this.symbolTypeHandler} selected={this.state.symbolType} name="symbol-type" options={{unresolved:"Cells", instruction:"Instructions"}}/>
              <Toggle handler={this.botHandler} selected={this.state.bot} name="bot" options={["Red", "Blue"]} colors={this.botColors}/>
              <Toggle handler={this.simHandler} selected={this.state.simState} name="sim" options={{stop:"⏹", pause:"⏸", step:"⧐", play:"▶", fast:"⏩", nonstop:"⏭"}}/>
              <div style={{flex:1}}></div>
              <div className={`trash ${this.state.selectedSymbolGroup && this.state.selectedOnBoard ? "active" : "inactive"}`} onClick={this.trash}>🗑</div>
            </div>
            <div className={`symbol-bar bot${this.state.bot}`} style={{display:"flex", flexDirection:"row"}}>
              <div className="symbol-grid-bar grid-layout" style={{flex:3}}>
                {this.symbolTypesUnresolved.map(props => this.renderSymbolGroup("unresolved", props))}
                {this.symbolTypesDirection.map(props => this.renderSymbolGroup("instruction", props))}
                {this.symbolTypesOperation.map(props => this.renderSymbolGroup("instruction", props))}
              </div>
              <div className="symbol-options-bar" style={{flex:1, display:"flex", flexDirection:"column"}}>
                <SymbolOptions changeOption={this.changeSymbolOption} {...this.state.selectedSymbolGroupState}/>
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
                {input.map((bit, k) => <span key={k} className={`input-color ${k < this.state.step - this.state.wasNext ? "past" : ""} ${k === this.state.step - this.state.wasNext ? "present" : ""} ${k > this.state.step - this.state.wasNext ? "future" : ""}`} color={"GB"[Number(bit)]}>{"GB"[Number(bit)]}</span>)}
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

  botHandler(value) { this.setState({bot: value}); }
  symbolTypeHandler(value) {
    this.setState((state, props) => {
      if (state.symbolType !== value) {
        if (state.selectedOnBoard) {
          return {symbolType: value};
        } else {
          return {symbolType: value, selectedSymbolGroup: null, selectedSymbolGroupState: null};
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
      var newState = {simState: value, selectedSymbolGroup: null, selectedSymbolGroupState: null};
      clearTimeout(state.simTimeout);
      var makeRepeat = interval => {
        return setTimeout(
          function callOnce() {
            self.move();
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

  boardHandler(y, x, symbolGroup, className) {
    if (this.state.simState !== "stop") return;
    if (symbolGroup && symbolGroup.state) {
      if (this.state.inputs.some(square => matchLocation(square, y, x))) {
        // inputs are fixed
        return;
      } else if (className.split(/\s+/).includes("resolved")) {
        this.setState({selectedSymbolGroup: null, selectedSymbolGroupState: null, selectedOnBoard: true});
      } else {
        this.setState({selectedSymbolGroup: symbolGroup, selectedSymbolGroupState: Object.assign({}, symbolGroup.props, symbolGroup.state), selectedOnBoard: true});
      }
    } else if (this.state.selectedOnBoard) {
      this.setState({selectedSymbolGroup: null, selectedSymbolGroupState: null, selectedOnBoard: true});
    } else {
      if (this.state.selectedSymbolGroup && this.state.selectedSymbolGroup.state) {
        var locs = [[y, x]];
        // js doesn't have references...
        if (this.state.selectedSymbolGroup.props.type === "unresolved") {
          var current = this.state.squares[y][x].unresolved;
          if (this.state.selectedSymbolGroup.props.multi === "horizontal") {
            if (x + 1 >= this.props.n) return;
            locs.push([y, x + 1]);
            var partner = this.state.squares[y][x + 1].unresolved;
          } else if (this.state.selectedSymbolGroup.props.multi === "vertical") {
            if (y + 1 >= this.props.m) return;
            locs.push([y + 1, x]);
            var partner = this.state.squares[y + 1][x].unresolved;
          } else {
            var partner = {state: false};
          }
        } else {
          var current = this.state.squares[y][x][this.state.selectedSymbolGroup.props.type][this.state.bot];
          var partner = {state: false};
        }
        for (let loc of locs) {
          let [_y, _x] = loc;
          if (this.state.inputs.some(square => matchLocation(square, _y, _x))) {
            // inputs are fixed
            return;
          } else if (this.state.outputs.some(square => matchLocation(square, _y, _x))) {
            let value = this.state.selectedSymbolGroup.state.value;
            // outputs can only be unlatched 1x1 cells
            if (value !== "x" && value !== "+") return;
          } else if (!((this.state.trespassable || {})[_y] || {})[_x]) return;
        }
        if ((!current || !current.state) && (!partner || !partner.state)) {
          var symbolClone = {props: {...this.state.selectedSymbolGroup.props}, state: {...this.state.selectedSymbolGroup.state}};
          symbolClone.setState = (func, callback) => {symbolClone.state = Object.assign(symbolClone.state, func(symbolClone.state, symbolClone.props)); callback()};
          var newState = {squares: this.state.squares.map(row => row.map(square => ({...square})))};
          if (this.state.selectedSymbolGroup.props.type === "unresolved") {
            newState.squares[y][x].unresolved = symbolClone;
            newState.squares[y][x].unresolved_index = 0;
            if (this.state.selectedSymbolGroup.props.multi === "horizontal") {
              newState.squares[y][x + 1].unresolved = symbolClone;
              newState.squares[y][x + 1].unresolved_index = 1;
            } else if (this.state.selectedSymbolGroup.props.multi === "vertical") {
              newState.squares[y + 1][x].unresolved = symbolClone;
              newState.squares[y + 1][x].unresolved_index = 1;
            }
          } else {
            newState.squares[y][x][this.state.selectedSymbolGroup.props.type][this.state.bot] = symbolClone;
          }
          newState.selectedSymbolGroupState = Object.assign({}, symbolClone.props, symbolClone.state);
          this.setState(newState, this.resetBoard);
        }
      }
    }
  }

  resetBoard() {
    this.setState((state, props) => {
      var newState = {};
      if (state.board) state.board.delete();
      newState.submission = this.makeSubmission(state.squares, props.m, props.n);
      newState.board = Module.LoadBoard(state.levelData, newState.submission);
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

  move() {
    this.state.board.move();
    this.resetCells();
  }

  trash() {
    if (this.state.selectedSymbolGroup && this.state.selectedOnBoard) {
      this.state.selectedSymbolGroup.state = false;
      this.setState({selectedSymbolGroup: null, selectedSymbolGroupState: null, selectedOnBoard: false}, this.resetBoard);
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
          }
          var submission = this.makeSubmission(this.state.squares, this.props.m, this.props.n);
          var board = Module.LoadBoard(text, submission);
          var inputs = board.get_inputs();
          var inputLocations = Array.from({length: inputs.size()}).map((_, i) => inputs.get(i).location);
          inputs.delete();
          let levelGrid = board.get_level();
          newState.squares = this.state.squares.map((row, y) => row.map((square, x) => {
            if (y < board.m && x < board.n && !cellAllowed(String.fromCharCode(levelGrid.at(y, x)))) return this.makeEmptySquare();
            return {...square};
          }));
          levelGrid.delete();
          board.delete();
          let [xSymbolGroup] = this.makeSymbol("unresolved", "x");
          for (let location of inputLocations) {
            ((newState.squares[location.y] || {})[location.x] || {}).unresolved = xSymbolGroup;
            ((newState.squares[location.y] || {})[location.x] || {}).unresolved_index = 0;
          }
          this.setState(newState, this.resetBoard);
        }
      });
    }
  }

  setBoardHandler(event) {
    if (this.state.simState !== "stop") this.simHandler("stop");
    this.loadSubmission(this.state.submission);
  }

  symbolHandler(symbolGroup) {
    if (this.state.simState !== "stop") return;
    this.setState({selectedSymbolGroup: symbolGroup, selectedSymbolGroupState: Object.assign({}, symbolGroup.props, symbolGroup.state), selectedOnBoard: false});
  }

  changeSymbolOption(event) {
    let value = event.target.value;
    this.state.selectedSymbolGroup.setState((state, props) => ({
      value: value,
      svg: props.options[value][1],
    }), () => {this.setState({selectedSymbolGroupState: Object.assign({}, this.state.selectedSymbolGroup.props, this.state.selectedSymbolGroup.state)})});
  };
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
            onChange={this.handle}
          />
          <label htmlFor={`radio-${option}`} className={(this.props.colors||{})[option]}>{this.props.options[option]}</label>
        </React.Fragment>
        )}
      </div>
    );
  }
  handle = event => this.props.handler(event.target.value);
}

class SymbolGroup extends React.PureComponent {
  constructor(props) {
    super(props);
    // props: type, subtype, value, options
    this.state = {};
    this.state.value = this.props.value;
    this.state.svg = this.props.svg;
    if (this.props.options !== undefined) {
      this.state.value = Object.keys(this.props.options)[0];
      this.state.svg = this.props.options[this.state.value][1];
    }
  }
  render() {
    if (!this.props.active) return null;
    const Component = this.state.svg;
    return (
      <div className={`image-container symbolgroup symbol-${this.state.value} ${this.props.selected === this ? "selected" : ""} ${this.props.className || ""} ${this.props.multi || ""}`} onClick={this.pushThis}>
        <Component className="image-base"/>
      </div>
    );
  }
  pushThis = () => { this.props.handler(this); };
}

class SymbolOptions extends React.PureComponent {
  render() {
    return (
      <div className="symbol-options">
        {Object.entries(this.props.options || []).map(([key, [option, svg]]) =>
        <OptionItem key={key} short={key} option={option} {...this.props}/>
        )}
      </div>
    );
  }
}

class OptionItem extends React.PureComponent {
  render() {
    return (
      <div style={{display:"flex", alignItems:"center"}} key={`radio-option-${this.props.option}`}>
        <input type="radio" id={`radio-${this.props.short}`} value={this.props.short} name={`radio-for-${this.props.subtype}`}
          checked={this.props.value === this.props.short}
          onChange={this.props.changeOption}
        />
        <label htmlFor={`radio-${this.props.short}`}>{this.props.option}</label>
      </div>
    );
  }
}
