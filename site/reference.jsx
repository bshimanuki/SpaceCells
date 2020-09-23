import React from "react";

import * as Svgs from "./svgs.jsx";
import "./svgs.css";
import "./info.css";

function Empty() {
  return <div><Svgs.XCell className="hidden"/></div>;
}
function Sel() {
  return <div><div className="highlight"><Svgs.XCell className="hidden"/></div></div>;
}

const X = Svgs.XCell;
const B = (props={}) => <Svgs.XCell className={`resolved-1 ${props.classname || ""}`} {...props}/>;
const G = (props={}) => <Svgs.XCell className={`resolved-0 ${props.classname || ""}`} {...props}/>;
const P = Svgs.PlusCell;
const R = (props={}) => <Svgs.PlusCell className={`resolved-1 ${props.classname || ""}`} {...props}/>;
const O = (props={}) => <Svgs.PlusCell className={`resolved-0 ${props.classname || ""}`} {...props}/>;
const BL = (props={}) => <Svgs.XCell className={`latched resolved-1 ${props.classname || ""}`} {...props}/>;
const GL = (props={}) => <Svgs.XCell className={`latched resolved-0 ${props.classname || ""}`} {...props}/>;
const RL = (props={}) => <Svgs.PlusCell className={`latched resolved-1 ${props.classname || ""}`} {...props}/>;
const OL = (props={}) => <Svgs.PlusCell className={`latched resolved-0 ${props.classname || ""}`} {...props}/>;

export default function Reference() {
  return <div className="reference">
    <h1>Reference</h1>
    <p>In this world, you are building systems of cells manipulated by bots. Bots move and follow instructions every cycle, with the eventual goal of using the input cells to construct a correct polarities at the output cells.</p>

    <h2>Controls</h2>
    <p>The bottom bar contains cell and instruction symbols, which you can place on the grid by clicking or dragging. (Alternatively, you can hold the top two rows of a QWERTY keyboard to select and then click to place.)</p>
    <p>Symbols on the grid can be dragged around or removed by dragging to or clicking the trash can. Hold Shift while clicking to select multiple symbols. The START symbols can be moved but not removed.</p>
    <p>Run your system by using the playback toggles. (There are also keyboard shortcuts for the symbol type with keys 1-3 and playback with keys 4-0.)</p>
    <p>Ctrl+Z and Ctrl+Shift+Z will undo/redo, and Delete/Backspace will remove the selected symbols.</p>

    <h2>Inputs and Outputs</h2>
    <p>The inputs come from the left of the grid and the outputs are on the right of the grid. Some levels may not have any inputs. The goal of the level is to produce the expected outputs for each test sequence of inputs.</p>
    <p>The outputs will be checked and the inputs will advance forward whenever a bot is on a NEXT instruction.</p>

    <h2>Cells</h2>
    <p>Cells contain four cavities in a square pattern in which lies two electrons. Due to Coulomb repulsion, the electrons settle in opposing cavities. Thus each cell has two determined polarities. When a current is applied, the cell will emit light in a color depending on the polarity.</p>
    <p>The polarity of cells cause nearby cells to be affected at a range shown below. Most cell types will restabilize each cycle. Cells that are closer together have higher priority than cells further apart.</p>
    <div className="gridlines" style={{display:"grid", gridTemplateColumns:"repeat(5, min-content)"}}>
      <Empty/><Sel/><Sel/><Sel/><Empty/>
      <Sel/><Sel/><Sel/><Sel/><Sel/>
      <Sel/><Sel/><X/><Sel/><Sel/>
      <Sel/><Sel/><Sel/><Sel/><Sel/>
      <Empty/><Sel/><Sel/><Sel/><Empty/>
    </div>

    <h3>Unlatched Cells</h3>
    <div className="row-line">
      <X/><Svgs.RightArrow/><B/><G/>
    </div>
    <div className="row-line">
      <P/><Svgs.RightArrow/><R/><O/>
    </div>
    <p>These are the basic cell types that can change polarity depending on the cells around it.</p>

    <h3>Locked Cells</h3>
    <div className="row-line">
      <BL/><GL/><RL/><OL/>
    </div>
    <p>Cells do not change polarity while locked.</p>

    <h3>Offset Cells</h3>
    <div className="row-line">
      <Svgs.HorizontalCell/>
      <Svgs.VerticalCell/>
    </div>
    <span>These cells are twice as big, but the offset position of the cavities mean that they interact with both <X className="inline"/> and <P className="inline"/> cells.</span>

    <h3>Diode Cells</h3>
    <div style={{display:"grid", gridTemplateColumns:"repeat(4, min-content)"}}>
      <Svgs.DiodeLeft/>
      <Svgs.DiodeDown/>
      <Svgs.DiodeUp/>
      <Svgs.DiodeRight style={{gridRowStart:2}}/>
    </div>
    <p>Diode cells consist of two sets of square cavities, where the polarity of the source square determines the polarity of the destination square in the direction of the arrow.</p>

    <h2>Unresolved Cells</h2>
    <p>Cells whose polarity does not stabilize to one polarity or the other are considered unresolved. Unresolved cells will cause other cells that depend on them to also be unresolved. You will receive an error if branching or outputting is attempted on an unresolved cell. The middle two cells here are unresolved.</p>
    <div className="gridlines" style={{display:"grid", gridTemplateColumns:"repeat(6, min-content)"}}>
      <Empty/><Empty/><Empty/><Empty/><Empty/><Empty/>
      <Empty/><BL/><X/><X/><GL/><Empty/>
      <Empty/><Empty/><Empty/><Empty/><Empty/><Empty/>
    </div>

    <h2>Bots</h2>
    <p>There are two bots: one red and one blue. Each bot moves according to direction instructions and performs actions based on operational instructions. Instructions are laid out on the grid, and bots operate based on the instructions on their current loation. Each grid space can have up to one direction instruction and one operation instruction for each bot.</p>

    <h2>Instructions</h2>
    <p>Instructions that operate on a cell will be a no-op if there is no cell or if the cell does not match the valid types for the instruction.</p>

    <h3>Direction Instructions</h3>
    <div className="row-line">
      <Svgs.DirectionLeft className="bot0"/>
      <Svgs.DirectionLeft className="bot1"/>
      <Svgs.DirectionDown className="bot0"/>
      <Svgs.DirectionDown className="bot1"/>
      <Svgs.DirectionUp className="bot0"/>
      <Svgs.DirectionUp className="bot1"/>
      <Svgs.DirectionRight className="bot0"/>
      <Svgs.DirectionRight className="bot1"/>
    </div>
    <p>When on an arrow, the bot will change the direction of its movement.</p>

    <h3>START Instruction</h3>
    <div className="row-line">
      <Svgs.Start className="bot0"/>
      <Svgs.Start className="bot1"/>
    </div>
    <p>There is always one START instruction for each bot. The bot starts on this grid space and will move left (unless there is also an arrow instruction).</p>

    <h3>NEXT Instruction</h3>
    <div className="row-line">
      <Svgs.Next className="bot0"/>
      <Svgs.Next className="bot1"/>
    </div>
    <p>Advance the input and output. The output color will be verified against expected output, and the input cells will advance to the next input.</p>

    <h3>GRAB / DROP Instructions</h3>
    <div className="row-line">
      <Svgs.Swap className="bot0"/>
      <Svgs.Swap className="bot1"/>
      <Svgs.Grab className="bot0"/>
      <Svgs.Grab className="bot1"/>
      <Svgs.Drop className="bot0"/>
      <Svgs.Drop className="bot1"/>
    </div>
    <p>GRAB will cause a bot to pick up a cell and carry it until a DROP instruction. It is an error if a bot carries a cell into another cell. This only affects 1x1 cells.</p>

    <h3>LOCK / FREE Instructions</h3>
    <div className="row-line">
      <Svgs.ToggleLatch className="bot0"/>
      <Svgs.ToggleLatch className="bot1"/>
      <Svgs.Latch className="bot0"/>
      <Svgs.Latch className="bot1"/>
      <Svgs.Unlatch className="bot0"/>
      <Svgs.Unlatch className="bot1"/>
    </div>
    <p>Cause the cell to become locked (with the current value after settling) or unlocked. This only affects 1x1 cells.</p>

    <h3>RESET Instruction</h3>
    <div className="row-line">
      <Svgs.Relatch className="bot0"/>
      <Svgs.Relatch className="bot1"/>
    </div>
    <p>Reset the value of a locked cell to the value it would settle to if unlocked. You could think of this as unlocking and relocking it in the same cycle. This only affects locked cells.</p>

    <h3>ROTATE Instruction</h3>
    <div className="row-line">
      <Svgs.Rotate className="bot0"/>
      <Svgs.Rotate className="bot1"/>
    </div>
    <p>The bot will rotate the cell 90 degrees, thus inverting the polarity if it is locked. This is only valid for 1x1 cells. The bot will not move during the cycle it is rotating (which results in a pause whether or not there is a cell to rotate).</p>

    <h3>SYNC Instruction</h3>
    <div className="row-line">
      <Svgs.Sync className="bot0"/>
      <Svgs.Sync className="bot1"/>
    </div>
    <p>Pause until the other bot is also on a SYNC.</p>

    <h3>POWER Instructions</h3>
    <div className="row-line">
      <Svgs.Power0 className="bot0"/>
      <Svgs.Power0 className="bot1"/>
      <Svgs.Power1 className="bot0"/>
      <Svgs.Power1 className="bot1"/>
    </div>
    <p>Toggle the power for specified output cell (corresponding to the top or bottom output). This affects which cell(s) will light up when the I/O advances. Both outputs start powered at initialization.</p>

    <h3>BRANCH Instructions</h3>
    <div className="row-line">
      <Svgs.Branch0Left className="bot0"/>
      <Svgs.Branch0Down className="bot0"/>
      <Svgs.Branch0Up className="bot0"/>
      <Svgs.Branch0Right className="bot0"/>
      <Svgs.Branch1Left className="bot0"/>
      <Svgs.Branch1Down className="bot0"/>
      <Svgs.Branch1Up className="bot0"/>
      <Svgs.Branch1Right className="bot0"/>
    </div>
    <div className="row-line">
      <Svgs.Branch0Left className="bot1"/>
      <Svgs.Branch0Down className="bot1"/>
      <Svgs.Branch0Up className="bot1"/>
      <Svgs.Branch0Right className="bot1"/>
      <Svgs.Branch1Left className="bot1"/>
      <Svgs.Branch1Down className="bot1"/>
      <Svgs.Branch1Up className="bot1"/>
      <Svgs.Branch1Right className="bot1"/>
    </div>
    <p>If the current cell matches one of the specified polarities, change directions (ignoring any regular arrows). It is an error if the cell does not have a stable polarity at the current cycle. This is valid for 1x1 cells and diode cells.</p>
  </div>;
}
