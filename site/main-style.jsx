import React from "react";

export default <style>{`

* {
  font-family: Verdana;
  box-sizing: border-box;
}
textarea {
  font-family: monospace, sans-serif;
}
.spacer {
  flex: 1;
}
.hidden {
  visibility: hidden;
}
.clickable {
  cursor: pointer;
}
.clickable:hover {
  filter: brightness(90%) drop-shadow(0 0 0.5vmin cornflowerblue);
}
.level-selection .clickable:hover {
  filter: none;
}

/* layout */
body {
  /* background-color: whitesmoke; */
  background-color: #999;
  color: #000;
}
#game {
  text-align: center;
}
#game > * {
  text-align: initial;
}
.game-all {
  display: inline-flex;
  flex-direction: column;
}
.game-all > * {
  margin: auto;
}
.game-title {
}
#main-content {
  justify-content: center;
  min-width: min-content;
}
.left-sidebar {
  /* padding: 0 1%; */
  width: 30%;
  padding-left: 5%;
}
.center-column{
  position: relative;
  width: min-width;
}
.center-content {
  min-width: min-content;
  align-items: center;
  /* border-radius: 0 0 40px 40px; */
  /* border: 20px solid #555; */
  /* border-top-style: none; */
}
.stats-sidebar {
  padding: 0 1%;
  width: 30%;
}

/* board */
.board {
  background-color: beige;
  display: flex;
  flex-direction: column;
  font-family: monospace, sans-serif;
  border: 1px solid #000;
}
.board-row {
  display: flex;
}
.square {
  position: relative;
  height: 60px;
  width: 60px;
}
.square-overlay,.square-underlay,.square-drag-overlay,.square-background,.square-inset,.square-paths {
  position: absolute;
  width: 100%;
  height: 100%;
  pointer-events: none;
}
.square-underlay {
  pointer-events: auto;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  grid-template-rows: repeat(2, 1fr);
}
.square-background {
  outline: 1px solid #000;
  outline-offset: -1px;
}
.square-overlay {
  z-index: 50;
}
.square-paths {
  overflow: hidden;
  z-index: 20;
}
.output-symbol {
  position: absolute;
  margin-top: 100%;
  width: 100%;
  text-align: center;
  color: #222;
  user-select: none;
}
.square-drag-overlay {
  z-index: 60;
}
.square-inset.horizontal {
  width: 200%;
  /* width: calc(200% - 6px); */
}
.square-inset.vertical {
  height: 200%;
  /* height: calc(200% - 6px); */
}

/* bottom bar */
.bottom-bar {
  width: 100%;
}
.toggle-bar {
  align-items: center;
  background-color: tan;
}
.symbol-options-bar { background-color: tan; }
.symbol-bar {
  border-radius: 0 0 20px 20px;
  overflow: hidden;
}
.symbol-bar .unclickable:not(.selected) svg {
  opacity: 0.5;
}
.symbol-grid-bar {
  background-color: lightgray;
}
.symbol-options-bar {
}

/* cell / instruction selection grid*/
.grid-layout {
  display: grid;
  grid-template-columns: repeat(9, 1fr) [grid-end];
  /* grid-row-gap: 1%; */
  /* grid-column-gap: 1%; */
}
.image-container {
  position: relative;
  width: 100%;
  height: 100%;
}
.symbolgroup {
  padding-top: 100%;
  border-radius: 5px;
}
.symbolgroup.horizontal {
  padding-top: 50%;
  grid-column-end: span 2;
}
.symbolgroup.vertical {
  padding-top: 200%;
  grid-row-end: span 2;
}
.symbolgroup.symbol-WM {
  /* for spacing */
  grid-row-start: 1;
  grid-column-start: 5;
}
.symbolgroup.symbol--,.symbolgroup[class~="symbol-|"],.symbolgroup[class~="symbol-]["] {
  grid-row-start: 2;
}
.symbolgroup.direction {
  grid-row-start: 2;
}
.symbolgroup.direction[class~="symbol-^"] {
  grid-row-start: 1;
  grid-column-start: 2;
}
.symbol-options-bar {
  grid-column-start: 8;
  grid-column-end: span 2;
  grid-row-start: 1;
  grid-row-end: span 2;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.symbol-options-grid > * {
  width: min-content;
}
.symbol-options-grid > .svg-container {
  width: min-content;
}
.symbol-options-grid {
  height: 100%;
  width: 100%;
  padding: 0 5%;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  grid-template-rows: repeat(2, 1fr);
  justify-items: center;
}
.symbol-options-grid input {
  position: absolute !important;
  clip: rect(0, 0, 0, 0);
  overflow: hidden;
}
.symbol-options-grid label {
}
.symbol-options-grid svg {
  height: 100%;
}
.symbol-options-grid input:checked + label svg {
  /* filter: drop-shadow(0 0 1vmin black); */
}
.symbol-options-title {
  font-weight: bold;
}

/* symbols */
.symbol { z-index: 10; }
.direction,.operation { z-index: 30; }
.instruction.selected { z-index: 40; }
.image-container.symbol {
  position: absolute;
}
.symbol { pointer-events: none; }
.symbol svg > * { pointer-events: auto; }
.dragover-active .symbol svg > * { pointer-events: none; }
.image-container { pointer-events: none; }
.symbolgroup.image-container { pointer-events: auto; }

/* board instruction transforms */
.symbol-shift {
  position: absolute;
  height: 100%;
  width: 100%;
}
.symbol-shift.bot0 {
  transform: translate(-22.5%, -22.5%) scale(0.667);
}
.symbol-shift.bot1 {
  transform: translate(22.5%, 22.5%) scale(0.667);
}
.symbol-shift.bot0.path {
  transform: translate(-22.5%, -22.5%) scale(2);
  overflow: hidden;
}
.symbol-shift.bot1.path {
  transform: translate(22.5%, 22.5%) scale(2);
  overflow: hidden;
}

/* cell and symbol highlights */
.symbol.selected {
  filter: drop-shadow(0 0 1vmin black);
}
.symbol.instruction.selected svg { /* double for instructions */
  filter: drop-shadow(0 0 1vmin black);
}
.symbolgroup.selected {
  filter: drop-shadow(0 0 1vmin black);
}
.symbol-option {
  border-radius: 5px;
  filter: none;
}
.symbol-option.selected {
  background-color: rgba(0, 0, 0, 0.5);
  box-shadow: 0 0 0.5vmin black;
  filter: brightness(80%);
}
.symbol-option.clickable:hover {
  background-color: rgba(0, 0, 0, 0.2);
  box-shadow: 0 0 0.5vmin cornflowerblue;
  filter: brightness(80%);
}
.symbolgroup.available.key-held {
  /* filter: drop-shadow(0 0 1vmin black); */
  background-color: rgba(0, 0, 0, 0.4);
  filter: brightness(80%);
}
/* .bot0 .square-overlay, .bot1 .square-overlay { */
  /* border-style: solid; */
  /* border-width: 3.49px; [> extra 0.49 for rounding <] */
  /* border-radius: 17px; */
/* } */
/* .bot0 .square-overlay { */
  /* [> box-shadow: inset 3px 3px 5px crimson, inset -3px -3px 5px crimson; <] */
  /* border-color: crimson; */
/* } */
/* .bot1 .square-overlay { */
  /* [> box-shadow: inset 3px 3px 5px royalblue, inset -3px -3px 5px royalblue; <] */
  /* border-color: royalblue; */
/* } */
/* .bot0.bot1 .square-overlay { */
  /* [> mix crimson and royalblue <] */
  /* [> box-shadow: inset 5px 5px 5px #8e3e8e, inset -5px -5px 5px  #8e3e8e; <] */
  /* border-color: #8e3e8e; */
/* } */

/* boundary cells */
.untrespassable:not(.input):not(.output) {
  background-image: linear-gradient(to right, lightgray,#000,#333,#777,#aaa,#ccc,#ddd,#ccc,#aaa,#777,#333,#000,lightgray);
}
.output.unpowered svg { opacity: 0.5 }
.output.powered .square-underlay {
  border-style: dashed;
  border-width: 1%;
  border-color: gold;
}

/* trash */
.trash {
  font-size: 30px;
  margin: 0 3%;
  user-select: none;
  color: black;
}
.trash.inactive { visibility: hidden; }
.trash:hover,.trash.dragover {
  text-shadow:
    -1px -1px 0 red,
    1px -1px 0 red,
    -1px  1px 0 red,
    1px  1px 0 red;
}

/* toggles */
.toggle {
  display: flex;
  flex-direction: row;
  margin: 1ex;
  user-select: none;
}
.toggle > input {
  position: absolute !important;
  clip: rect(0, 0, 0, 0);
  overflow: hidden;
}
.toggle > label {
  background-color: #ccc;
  color: #444;
  text-align: center;
  line-height: 1;
  padding: 8px 16px;
  border: 1px solid rgba(0, 0, 0, 0.2);
  box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.3), 0 1px rgba(255, 255, 255, 0.1);
  transition: all 0.1s ease-in-out;
}
.toggle.symbol-type-toggle > label {
  width: 125px;
}
.toggle.sim-toggle > label {
  padding: 8px 8px;
}
.toggle > input:checked + label {
  color: #eee;
  background: green;
  box-shadow: none;
}
.toggle > input:checked + label.red {
  background: crimson;
}
.toggle > input:checked + label.blue {
  background: royalblue;
}
.toggle > label:first-of-type {
  border-radius: 5px 0 0 5px;
}
.toggle > label:last-of-type {
  border-radius: 0 5px 5px 0;
}
.sim-toggle * {
  font-family: Symbola;
}

/* stats sidebar */
.colon-list {
  display: table;
  width: min-content;
}
.colon-list > * {
  display: table-row;
}
.colon-list > * > * {
  display: table-cell;
  white-space: nowrap;
}
.colon-list > * > :first-child::after {
  content: ": ";
  white-space: pre;
}
.colon-list > .test-arrow > :first-child::after {
  content: "";
}
.finished {
  height: 30px;
}

/* results info */
.test-arrow * {
  font-family: monospace, sans-serif;
  font-weight: bold;
}
.colors * {
  font-family: monospace, sans-serif;
}
.colors .past,.actual-color:not(:last-child) {
  opacity: 0.5;
}
.colors .present,.actual-color:last-child {
  font-weight: bold;
}
.colors .future {
  opacity: 0.9;
}
[color=K] { color: black; }
[color=N] { color: brown; }
[color=R] { color: red; }
[color=O] { color: darkorange; }
[color=Y] { color: gold; }
[color=G] { color: green; }
[color=B] { color: blue; }
[color=P] { color: purple; }
[color=W] { color: white; }
[color=C] { color: cyan; }
[color=E] { color: orangered; }
[color=Y],
[color=W]
{
  text-shadow:
  0.5px 0px 0.5px #888,
  0.5px 0.5px 0.5px #888,
  0px 0.5px 0.5px #888,
  -0.5px 0.5px 0.5px #888,
  -0.5px 0px 0.5px #888,
  -0.5px -0.5px 0.5px #888,
  0px -0.5px 0.5px #888,
  0.5px -0.5px 0.5px #888;
}
.output-color-K .game-board { filter: drop-shadow(0 0 20px black); }
.output-color-N .game-board { filter: drop-shadow(0 0 20px brown); }
.output-color-R .game-board { filter: drop-shadow(0 0 20px red); }
.output-color-O .game-board { filter: drop-shadow(0 0 20px darkorange); }
.output-color-Y .game-board { filter: drop-shadow(0 0 20px gold); }
.output-color-G .game-board { filter: drop-shadow(0 0 20px green); }
.output-color-B .game-board { filter: drop-shadow(0 0 20px blue); }
.output-color-P .game-board { filter: drop-shadow(0 0 20px purple); }
.output-color-W .game-board { filter: drop-shadow(0 0 20px white); }
.output-color-C .game-board { filter: drop-shadow(0 0 20px cyan); }
.output-color-E .game-board { filter: drop-shadow(0 0 20px orangered); }
.cycles-value,.steps-value,.num-symbols-value {
  font-weight: bold;
}
.error-value {
  font-weight: bold;
}

/* drag n drop */
.dragging.dragover-trash {
  cursor: wait;
}
.dragging .selected > * {
  opacity: 0.25;
}
.dragging.dragover-trash .symbol.selected > :not(.start) {
  opacity: 0.5;
}
.dragging.dragover-trash .symbol.selected > :not(.start) svg .cell-border,
.dragging.dragover-trash .symbol.selected > :not(.start) svg .bot-fill {
  fill: red;
}
.dragging.dragover-trash .symbol.selected > :not(.start) svg .bot-stroke {
  stroke: red
}
.square.dragover .square-drag-overlay {
  background-color: rgba(255, 0, 0, 0.5);
}
.dragover-fits .square.dragover .square-drag-overlay {
  background-color: rgba(0, 255, 0, 0.5);
}
.rectangleSelected .square-drag-overlay {
  background-color: rgba(0, 0, 255, 0.5);
}

/* level selection */
.level-selection {
  width: 100%;
  height: 600px;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  user-select: none;
}
.level-selection > input {
  position: absolute !important;
  clip: rect(0, 0, 0, 0);
  overflow: hidden;
}
.level-selection > label {
  height: 40px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding-left: 7ex;
  text-indent: -6ex;
  border-radius: 10px 0 0 10px;
  border: 2px solid #444;
  border-right-style: none;
  background-color: #89c;
  color: #000;
  transition: all 0.1s ease-in-out;
}
.level-selection > input:checked + label {
  border-color: #ccc;
  color: #eee;
  background: #025;
  box-shadow: none;
}
.level-buttons {
  display: flex;
  flex-direction: column;
  align-items: stretch;
}
.level-button {
  background-color: #ccc;
  border: 1pt solid black;
  border-radius: 3px;
  font-size: smaller;
  text-align: center;
  user-select: none;
  padding: 1px;
}
.assignment-title::before {
  content: "★ ";
  color: yellow;
}
.assignment-title.unsolved::before {
  visibility: hidden;
}

/* results modal */
.modal-title {
  text-align: center;
  font-size: 40;
  margin: 10px;
  margin-bottom: 30px;
}
.modal-overlay {
  /* defaults */
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(255, 255, 255, 0.75);
  /* custom */
  z-index: 100;
}
.modal-content {
  /* defaults */
  position: absolute;
  top: 40px;
  left: 40px;
  right: 40px;
  bottom: 40px;
  border: 1px solid #ccc;
  background: #fff;
  overflow: auto;
  WebkitOverflowScrolling: touch;
  borderRadius: 4px;
  outline: none;
  padding: 20px;
  /* custom */
  height: 720px;
  width: 1080px;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  border-radius: 20px;
  background-color: aliceblue;
  color: black;
  overflow: visible;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 0;
}
.modal-body {
  flex: 1;
  overflow: auto;
  margin: 20px 0;
  padding: 0 50px;
  display: flex;
  flex-direction: column;
}
.modal-buttons {
  align-self: flex-end;
  margin: 20px;
}
.modal-buttons > * {
  margin: 0px 10px;
  padding: 5px 10px;
}
.charts {
  display: flex;
  justify-content: center;
}
.charts > * {
  margin: 20px;
}
.vx-axis-label {
  font-size: 20;
  transform: translate(0, 20px);
}
.vx-axis-tick {
  user-select: none;
}
.level-info {
  flex: 1;
}
.level-preface {
  /* min-height: 50%; */
  padding-bottom: 30px;
}
.modal-goal {
}
.goal-title {
  font-weight: bold;
  font-size: larger;
}
.goal-content {
}

/* debug sidebar */
.debug-sidebar {
  border-radius: 10px;
  padding: 15px;
  background-color: pink;
  border: 2px solid red;
  color: black;
}
.debug-title {
  font-weight: bold;
}
#submission {
  height: 20em;
}

`}</style>
