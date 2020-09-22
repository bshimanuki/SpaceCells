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
  <p>Given a blue or green input, output the opposite color.</p>
</>;

const LevelAnd = <>
  <p>Given two inputs, output blue if they are both blue and green otherwise.</p>
</>;

const LevelCrossing = <>
  <p>Given a red/orange input and a blue/green input, output the inputs crossing paths.</p>
</>;

const LevelDelay = <>
  <p>Given one input, output the color of the previous input. Output blue as the first output.</p>
</>;

const LevelSwitch = <>
  <p>Given one input, switch the output between blue and red whenever the input is blue. The output should start as blue (unless the first input is blue).</p>
</>;

const LevelXor = <>
  <p>Given two inputs, output green if they are the same or blue if they are different.</p>
</>;

const LevelRainbow = <>
  <p>No inputs. Output red, orange, yellow, green, blue, and purple in order and repeat.</p>
</>;

const LevelMedian = <>
  <p>Given one sequential input, output the median (majority) of the past 3 inputs. The first 3 inputs will be blue.</p>
</>;

const LevelAdder = <>
  <p>Given two sequential inputs, let green represent a 0 bit and blue represent a 1 bit. The inputs are given from low bit to high bit. Output the corresponding color for the addition of these numbers in base 2.</p>
</>;

const LevelStack = <>
  <p>Given two sequential inputs, push the upper color onto a stack if the lower color is green, and pop from the stack to the output if the lower color is blue. When pushing onto the stack, output the color pushed. The inputs are guaranteed such that the stack never grows beyond 3 elements.</p>
</>;

export const levels = [
  {
    name: "not",
    title: "Inversion",
    data: require("../examples/not.lvl").default,
    info: LevelNot,
  },
  {
    name: "and",
    title: "and",
    data: require("../examples/and.lvl").default,
    info: LevelAnd,
  },
  {
    name: "crossing",
    title: "crossing",
    data: require("../examples/crossing.lvl").default,
    info: LevelCrossing,
  },
  {
    name: "delay",
    title: "delay",
    data: require("../examples/delay.lvl").default,
    info: LevelDelay,
  },
  {
    name: "switch",
    title: "switch",
    data: require("../examples/switch.lvl").default,
    info: LevelSwitch,
  },
  {
    name: "xor",
    title: "xor",
    data: require("../examples/xor.lvl").default,
    info: LevelXor,
  },
  {
    name: "median",
    title: "median",
    data: require("../examples/median.lvl").default,
    info: LevelMedian,
  },
  {
    name: "rainbow",
    title: "rainbow",
    data: require("../examples/rainbow.lvl").default,
    info: LevelRainbow,
  },
  {
    name: "adder",
    title: "adder",
    data: require("../examples/adder.lvl").default,
    info: LevelAdder,
  },
  {
    name: "stack",
    title: "stack",
    data: require("../examples/stack.lvl").default,
    info: LevelStack,
  },
];
