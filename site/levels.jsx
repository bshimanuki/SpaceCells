import React from "react";

import * as Svgs from "./svgs.jsx";

export const backgrounds = [
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

const LevelNot = <>
  <p>Turn the output green when the input is blue and blue when the input is green.</p>
</>;

const LevelCrossing = <>
  <p>Propagate the top input to the bottom output and the bottom input to the top output.</p>
</>;

const LevelAnd = <>
  <p>Given two inputs, output blue if they are both blue and green otherwise.</p>
</>;

const LevelDelay = <>
  <p>Output blue on the first step. For all other steps, output the color of the previous input.</p>
</>;

const LevelSwitch = <>
  <p>Switch the output between blue and red whenever the input is blue. The output should start as blue (unless the first input is blue).</p>
</>;

const LevelXor = <>
  <p>Given two inputs, output green if they are the same or blue if they are different.</p>
</>;

const LevelRam = <>
  <p>You have a blue/green input and a red/orange input. There is a red cubbie and a orange cubbie that each start with a blue light. Each step, use the bottom input to put the top input into that cubbie and output the color that was there before.</p>
</>;

const LevelRainbow = <>
  <p>No inputs. Output red, orange, yellow, green, blue, and purple in order and repeat.</p>
</>;

const LevelMedian = <>
  <p>Given one sequential input, output the majority of the past 3 inputs. The first 3 inputs will be blue.</p>
</>;

const LevelAdder = <>
  <p>Given two sequential inputs, let green represent a 0 bit and blue represent a 1 bit. The inputs are given from low bit to high bit. Output the corresponding color for the addition of these numbers in base 2.</p>
</>;

const LevelBattle = <>
  <p>The top input is for a blue player and the bottom input is for a green player. The game starts neutral. A player fires by inputting blue. Whenever a player fires, the state moves one step in the direction of the player (green, white, blue) or stays the same if already at an end. If both players fire, they both lose and you should output purple once and reset the state to neutral.</p>
</>;

const LevelStack = <>
  <p>Given two sequential inputs, push the upper color onto a stack if the lower color is green, and pop from the stack to the output if the lower color is blue. When pushing onto the stack, output the color pushed. The inputs are guaranteed such that the stack never grows beyond 3 elements.</p>
</>;

const IntroNot = <>
  {/*<div className="modal-title">SpaceCells</div>*/}
  <p>Welcome to SpaceCells, the satellite planet where engineers design systems that control colors at the level of electrons. The basic building block is the cell, a component with four cavities which holds two electrons.</p>
  <div className="row-line">
    <Svgs.XCell/>
  </div>
  <p>By placing them in different configurations, we can make them do anything we set our minds to!</p>
  {/*
  <div className="gridlines" style={{display:"grid", gridTemplateColumns:"repeat(6, min-content)"}}>
    <Svgs.XCell className="latched resolved-1"/><Svgs.XCell className="resolved-1"/><Svgs.XCell className="resolved-1"/><Svgs.XCell className="resolved-1"/><Svgs.XCell className="resolved-1"/><Svgs.XCell className="resolved-1"/>
    <div/><div/><Svgs.XCell className="resolved-1"/><div/><div/><div/>
    <Svgs.XCell className="resolved-1"/><div/><div/><Svgs.XCell className="resolved-0"/><Svgs.XCell className="resolved-0"/><Svgs.XCell className="resolved-0"/>
  </div>
  <p><Svgs.XCell className="inline latched resolved-1"/> is a locked cell, meaning it is fixed. Other <Svgs.XCell className="inline"/> cells are free to change.</p>
  */}
  <p>Cells are too small for human hands, so we manipulate them using bots. Bots move and perform all sorts of operations based on instructions we assign. The only ones you need as we start off are the direction instructions, the START instruction, and the NEXT instruction. There is a single START instruction and it is where the bot starts its operation. The NEXT instruction will cause your output to be verified and will advance the input(s) and output(s).</p>
  <div className="row-line">
    <Svgs.Start className="bot0"/>
    <Svgs.Next className="bot0"/>
    <Svgs.DirectionLeft className="bot0"/>
    <Svgs.DirectionDown className="bot0"/>
    <Svgs.DirectionUp className="bot0"/>
    <Svgs.DirectionRight className="bot0"/>
  </div>
  <p>You can check out the <em>Manual</em> for a complete description of cells and instructions.</p>
</>;

const IntroCrossing = <>
  <div class="note">
    <p>There's no excitement like a little switcheroo.</p>
  </div>
</>;

const IntroAnd = <>
  <p>You will be placing your own instructions from now on. Check the <em>Instructions</em> tabs.</p>
  <div class="note">
    <p>I have found a truly marvelous demonstration of this configuration, which this note is too small to contain.</p>
    <div className="gridlines" style={{display:"grid", gridTemplateColumns:"repeat(5, min-content)"}}>
      <div/><div/><Svgs.DiodeDown/><div/><div/>
      <div/><div/><div/><div/>
      <Svgs.DiodeRight/><Svgs.XCell/><Svgs.XCell/><Svgs.XCell/>
      <div/><div/><Svgs.DiodeUp/><div/><div/>
      <div/><div/><div/><div/>
    </div>
  </div>
</>;

const IntroDelay = <>
  <p>Most instructions are now available. Check the <em>Manual</em> for descriptions.</p>
  <div class="note">
    <p>Cells innately have no memories, but you know bots, they never forget a thing.</p>
  </div>
</>;

const IntroSwitch = <>
  <p>From here on, you will have multiple assignments available at a time.</p>
  <div class="note">
    <p>You can use the POWER instructions to toggle the power to the outputs.</p>
    <div className="row-line">
      <Svgs.Power0 className="bot0"/>
      <Svgs.Power0 className="bot1"/>
      <Svgs.Power1 className="bot0"/>
      <Svgs.Power1 className="bot1"/>
    </div>
    <p>Only powered outputs emit light. Both outputs start powered.</p>
  </div>
</>;

export const Epilogue = <>
  <h2>Epilogue</h2>
  <div class="note">
    <p>This is a final farewell. I am leaving in search of crystalized lattices which will allow for lightspeed computations. I have included a diagram here for you. With these at the table, we will have a key element towards advancing to the next age of innovation.</p>
    <Svgs.CleanCrystalTile/>
  </div>
</>;

export const levels = [
  {
    name: "not",
    title: "Inversion",
    data: require("../examples/not.lvl").default,
    goal: LevelNot,
    preface: IntroNot,
  },
  {
    name: "crossing",
    title: "X Crossing",
    data: require("../examples/crossing.lvl").default,
    goal: LevelCrossing,
    preface: IntroCrossing,
  },
  {
    name: "and",
    title: "Unity",
    data: require("../examples/and.lvl").default,
    goal: LevelAnd,
    preface: IntroAnd,
  },
  {
    name: "delay",
    title: "Memories",
    data: require("../examples/delay.lvl").default,
    goal: LevelDelay,
    preface: IntroDelay,
  },
  {
    name: "switch",
    title: "Power It Up",
    data: require("../examples/switch.lvl").default,
    goal: LevelSwitch,
    preface: IntroSwitch,
  },
  {
    name: "xor",
    title: "Differences",
    data: require("../examples/xor.lvl").default,
    goal: LevelXor,
  },
  {
    name: "ram",
    title: "Storage Unit",
    data: require("../examples/ram.lvl").default,
    goal: LevelRam,
  },
  {
    name: "rainbow",
    title: "Colors of the Rainbow",
    data: require("../examples/rainbow.lvl").default,
    goal: LevelRainbow,
  },
  {
    name: "median",
    title: "Median Filter",
    data: require("../examples/median.lvl").default,
    goal: LevelMedian,
  },
  {
    name: "adder",
    title: "Quick Maths",
    data: require("../examples/adder.lvl").default,
    goal: LevelAdder,
  },
  {
    name: "battle",
    title: "Fight",
    data: require("../examples/battle.lvl").default,
    goal: LevelBattle,
  },
  {
    name: "stack",
    title: "Stacks on Stacks",
    data: require("../examples/stack.lvl").default,
    goal: LevelStack,
  },
  {
    name: "epilogue",
    title: "Epilogue",
  },
];
