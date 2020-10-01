// vim: ft=css
import React from "react";

export default <style>{`

.symbol svg, .symbolgroup svg {
  position: absolute;
  top: 50%;
  left: 50%;
  height: 100%;
  width: 100%;
  transform: translate(-50%, -50%);
  user-select: none;
}
.symbol-options-bar svg {
  user-select: none;
}

.bot-stroke {
  stroke: lightgray;
}
.bot-fill {
  fill: lightgray;
}
.bot-outline {
  fill: none;
  stroke: none;
  opacity: 0.8;
}
.bot0 .bot-stroke {
  stroke: red;
}
.bot1 .bot-stroke {
  stroke: blue;
}
.bot0 .bot-fill {
  fill: red;
}
.bot1 .bot-fill {
  fill: blue;
}
.bot0.bot1 .bot-stroke {
  stroke: purple;
}
.bot0.bot1 .bot-fill {
  fill: purple;
}

.arrow {
  stroke-linecap: round;
}

.cell-border {
  rx: 0.5;
  ry: 0.5;
  fill: white;
  stroke: gray;
}
.latched .cell-border {
  stroke: goldenrod;
}

.cell-fill {
  stroke: gray;
  stroke-width: 0.05;
  fill: lightgray;
}
.resolved-1 .cell-x .cell-border { fill: #ddf; }
.resolved-0 .cell-x .cell-border { fill: #dfd; }
.resolved-1 .cell-plus .cell-border { fill: #fcc; }
.resolved-0 .cell-plus .cell-border { fill: #fed; }
.resolved-1 .circle-0 { fill: white; }
.resolved-0 .circle-1 { fill: white; }
.resolved-1 .cell-x .circle-1 { fill: blue; }
.resolved-0 .cell-x .circle-0 { fill: green; }
.resolved-1 .cell-plus .circle-1 { fill: red; }
.resolved-0 .cell-plus .circle-0 { fill: orange; }

.diode .arrow {
  stroke: black;
  stroke-width: 0.1;
}

.direction-ghost {
  stroke: white;
  opacity: 0;
  stroke-width: 0.8;
}
.direction-outline {
  stroke: gray;
  stroke-width: 0.4;
}
.direction-main {
  stroke-width: 0.3;
}
.square .direction {
  position: absolute;
  width: 100%;
  height: 100%;
}
.square .direction-up { transform: translate(0%, -25%); }
.square .direction-down { transform: translate(0%, 25%); }
.square .direction-left { transform: translate(-25%, 0%); }
.square .direction-right { transform: translate(25%, 0%); }

.operation svg text {
  fill: white;
  font-weight: bold;
  stroke: black;
  stroke-width: 0.05;
  paint-order: stroke fill;
}

.operation-circle {
  stroke: gray;
  stroke-width: 0.05;
}

.branch-overlay {
  fill: white;
  stroke: none;
  opacity: 0.75;
}

.symbol svg text {
  font-weight: bold;
  stroke: black;
  stroke-width: 0.05;
  paint-order: stroke fill;
}

.rightarrow {
  stroke: black;
  stroke-width: 0.2;
}

.path {
  stroke-width: 0.025;
  fill: none;
  opacity: 75%;
}

`}</style>
