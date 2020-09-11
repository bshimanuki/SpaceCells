import React from "react";
import ReactDOM from "react-dom";

import "./main.css";
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

var level_debug;
var board_debug;
var submission_debug;
function compute() {
  // level_debug = document.getElementById("level").value;
  submission_debug = document.getElementById("submission").value;
  board_debug = Module.LoadBoard(level, submission_debug);
  console.log(board_debug.check_status());
  // board_debug.run(100);
  // console.log(board_debug.check_status());
}
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
    var selectedClass = this.props.selectedSymbolGroup === this.props.symbolGroup ? "selected" : "";
    if (!this.props.symbolGroup || !this.props.symbolGroup.state) {
      return <div></div>;
    }
    if (this.props.type === "unresolved") {
      if (this.props.index) {
        return <div></div>;
      }
      var outline_image = this.props.outline;
      if (this.props.cell && this.props.cell.is_1x1) {
        if (this.props.cell.latched) outline_image = "outline_latched";
        else outline_image = "outline_unlatched";
      }
      var fill_image = fill_images[this.props.cellValue] || this.props.fill;
      return (
        <div className={`image-container symbol cell symbol-${this.props.value} ${this.props.className} ${selectedClass} ${this.props.diode ? "diode" : ""} ${this.props.multi || ""}`} alt={this.props.subtype}>
          <Asset className="image-base" src={outline_image} onClick={this.handler}/>
          <Asset className="image-overlay" src={fill_image}/>
          <Asset className="image-overlay" src={fill_image}/>
        </div>
      );
    } else {
      return (
        <div className={`image-container symbol symbol-shift ${this.props.className} ${selectedClass}`} alt={this.props.subtype}>
          <Asset className="image-base" src={`${this.props.type}_${this.props.botColors[this.props.bot]}_${this.props.name}`} onClick={this.handler}/>
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
      <Symbol selectedSymbolGroup={this.props.selectedSymbolGroup} y={this.props.y} x={this.props.x} index={0} stopped={this.props.stopped} {...props} {...(props.symbolGroup||{}).props} {...(props.symbolGroup||{}).state} handler={this.props.handler}/>
    );
  }

  render() {
    var classNames = [];
    classNames.push("square");
    if (this.props.bot0) classNames.push("bot0");
    if (this.props.bot1) classNames.push("bot1");
    if (this.props.trespassable !== undefined) classNames.push(this.props.trespassable ? "trespassable" : "untrespassable");
    if (this.props.input) classNames.push("input");
    if (this.props.output) classNames.push("output");
    if (this.props.powered) classNames.push("powered");
    classNames.push();
    return (
      <div className={classNames.join(" ")} onClick={this.handler}>
        {this.renderSymbol({className:"cell", cellValue:(this.props.cell && String.fromCharCode(this.props.cell.resolved())), cell:this.props.cell, symbolGroup:this.props.unresolved, index:this.props.unresolved_index})}
        {this.renderSymbol({className:"bot0-symbol operation", symbolGroup:this.props.operation[0]})}
        {this.renderSymbol({className:"bot1-symbol operation", symbolGroup:this.props.operation[1]})}
        {this.renderSymbol({className:"bot0-symbol direction", symbolGroup:this.props.direction[0]})}
        {this.renderSymbol({className:"bot1-symbol direction", symbolGroup:this.props.direction[1]})}
      </div>
    );
  }
}

class Board extends React.PureComponent {
  renderSquare(props) {
    return (<Square
      key={props.y,props.x}
      handler={this.props.handler}
      validBoard={this.props.validBoard}
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
    {type: "unresolved", subtype: "x", value: "x", outline: "outline_unlatched", fill: "fill_x"},
    {type: "unresolved", subtype: "+", value: "+", outline: "outline_unlatched", fill: "fill_plus"},
    {type: "unresolved", subtype: "/", value: "/", outline: "outline_latched", fill: "fill_blue"},
    {type: "unresolved", subtype: "\\", value: "\\", outline: "outline_latched", fill: "fill_green"},
    {type: "unresolved", subtype: "-", value: "-", outline: "outline_latched", fill: "fill_red"},
    {type: "unresolved", subtype: "|", value: "|", outline: "outline_latched", fill: "fill_orange"},
    {type: "unresolved", subtype: "][", value: "][", multi:"horizontal", outline: "outline_horizontal", fill: "fill_x"},
    {type: "unresolved", subtype: "W\nM", value: "WM", multi:"vertical", outline: "outline_vertical", fill: "fill_x"},
    {type: "unresolved", subtype: "<x", value: "<x", multi:"horizontal", diode: true, outline: "outline_diode_left", fill: "fill_x"},
    {type: "unresolved", subtype: "x\nv", value: "xv", multi:"vertical", diode: true, outline: "outline_diode_down", fill: "fill_x"},
    {type: "unresolved", subtype: "^\nx", value: "^x", multi:"vertical", diode: true, outline: "outline_diode_up", fill: "fill_x"},
    {type: "unresolved", subtype: "x>", value: "x>", multi:"horizontal", diode: true, outline: "outline_diode_right", fill: "fill_x"},
  ];
  symbolTypesDirection = [
    {type: "direction", subtype: "<", value: "<", name: "left"},
    {type: "direction", subtype: "v", value: "v", name: "down"},
    {type: "direction", subtype: ">", value: ">", name: "right"},
    {type: "direction", subtype: "^", value: "^", name: "up"},
  ];
  symbolTypesOperation = [
    {type: "operation", subtype: "START", value: "S", name: "start"},
    {type: "operation", subtype: "NEXT", value: "n", name: "next"},
    {type: "operation", subtype: "GRAB/DROP", options: {GRAB: "g", DROP: "d", "GRAB/DROP": "w"}, names: {GRAB: "grab", DROP: "drop", "GRAB/DROP": "swap"}},
    {type: "operation", subtype: "LOCK/FREE", options: {LOCK: "l", FREE: "u", "LOCK/FREE": "t"}, names: {LOCK: "latch", FREE: "unlatch", "LOCK/FREE": "togglelatch"}},
    {type: "operation", subtype: "RESET", value: "*", name: "relatch"},
    {type: "operation", subtype: "SYNC", value: "s", name: "sync"},
    {type: "operation", subtype: "ROTATE", value: "r", name: "rotate"},
    {type: "operation", subtype: "BRANCH(|/)", options: {"<": "<", "v": "v", ">": ">", "^": "^"}, names: {"<": "branch1left", "v": "branch1down", ">": "branch1right", "^": "branch1up"}},
    {type: "operation", subtype: "BRANCH(-\\)", options: {"<": "[", "v": "W", ">": "]", "^": "M"}, names: {"<": "branch0left", "v": "branch0down", ">": "branch0right", "^": "branch0up"}},
    {type: "operation", subtype: "POWER", options: {"TOGGLE POWER 1": "p", "TOGGLE POWER 2": "P"}, names: {"TOGGLE POWER 1": "power0", "TOGGLE POWER 2": "power1"}},
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
              validBoard={this.state.validBoard}
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
            <div className="symbol-bar" style={{display:"flex", flexDirection:"row"}}>
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
      value: props.options[value],
      name: props.names[value],
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
    this.state.name = this.props.name;
    if (this.props.options !== undefined) {
      let option = Object.keys(this.props.options)[0];
      this.state.value = this.props.options[option];
      this.state.name = this.props.names[option];
    }
  }
  render() {
    if (!this.props.active) return null;
    if (this.props.type === "unresolved") {
      return (
        <div className={`image-container symbolgroup symbol-${this.state.value} ${this.props.selected === this ? "selected" : ""} ${this.props.diode ? "diode" : ""} ${this.props.multi || ""}`} onClick={this.pushThis} alt={this.props.subtype}>
          <Asset className="image-base" src={this.props.outline}/>
          <Asset className="image-overlay" src={this.props.fill}/>
          <Asset className="image-overlay" src={this.props.fill}/>
        </div>
      );
    } else {
      return (
        <div className={`image-container symbolgroup symbol-${this.state.value} ${this.props.selected === this ? "selected" : ""}`} onClick={this.pushThis} alt={this.props.subtype}>
          <Asset src={`${this.props.type}_${this.props.botColors[this.props.bot]}_${this.state.name}`} className="image-base"/>
        </div>
      );
    }
  }
  pushThis = () => { this.props.handler(this); };
}

class SymbolOptions extends React.PureComponent {
  render() {
    return (
      <div className="symbol-options">
        {Object.keys(this.props.options || []).map((option, i) =>
        <OptionItem key={i} option={option} {...this.props}/>
        )}
      </div>
    );
  }
}

class OptionItem extends React.PureComponent {
  render() {
    return (
      <div style={{display:"flex", alignItems:"center"}} key={`radio-option-${this.props.option}`}>
        <input type="radio" id={`radio-${this.props.option}`} value={this.props.option} name={`radio-for-${this.props.subtype}`}
          checked={this.props.value === this.props.options[this.props.option]}
          onChange={this.props.changeOption}
        />
        <label htmlFor={`radio-${this.props.option}`}>{this.props.option}</label>
      </div>
    );
  }
}
