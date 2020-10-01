// vim: ft=css
import React from "react";

export default <style>{`

.information .hidden {
  visibility: hidden;
}
.information .svg-container {
  display: inline;
  position: relative;
  user-select: none;
}
.information svg {
  position: relative;
  height: 60px;
  width: 60px;
}
.information .inline svg {
  height: 30px;
  width: 30px;
}
.information .gridlines > * {
  border: 1px solid black;
}
.information .highlight {
  background-color: red;
  opacity: 0.5;
}
.information .row-line {
  display: flex;
  align-items: flex-end;
}
.information .horizontal svg {
  width: 120px;
}
.information .vertical svg {
  height: 120px;
}
.information .horizontal {
  grid-column-end: span 2;
}
.information .vertical {
  grid-row-end: span 2;
}

.information .note {
  margin: 0 10%;
  padding: 1em 10%;
  background-color: #fe6;
  filter: drop-shadow(4px 4px 4px black);
}

.level-info .row-line, .level-info .gridlines {
  justify-content: center;
}

.epilogue {
  position: absolute;
  width: 100%;
  padding: 30px;
}

`}</style>
