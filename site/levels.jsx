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

const LevelNot = {
  "tag": "p",
  "content": "Turn the output green when the input is blue and blue when the input is green.",
};

const LevelCrossing = {
  "tag": "p",
  "content": "Propagate the top input to the bottom output and the bottom input to the top output.",
};

const LevelAnd = {
  "tag": "p",
  "content": "Given two inputs, output blue if they are both blue and green otherwise.",
};

const LevelDelay = {
  "tag": "p",
  "content": "Output blue on the first step. For all other steps, output the color of the previous input.",
};

const LevelSwitch = {
  "tag": "p",
  "content": "Switch the output between blue and red whenever the input is blue. The output should start as blue (unless the first input is blue).",
};

const LevelXor = {
  "tag": "p",
  "content": "Given two inputs, output green if they are the same or blue if they are different.",
};

const LevelRam = {
  "tag": "p",
  "content": "You have a blue/green input and a red/orange input. You should output the color of the top input the previous time the bottom input was that color. The first time red is input and the first time orange is input, you should output blue.",
};

const LevelRainbow = {
  "tag": "p",
  "content": "No inputs. Output red, orange, yellow, green, blue, and purple in order and repeat.",
};

const LevelMedian = {
  "tag": "p",
  "content": "Given one sequential input, output the majority of the past 3 inputs. The first 3 inputs will be blue.",
};

const LevelAdder = {
  "tag": "p",
  "content": "Given two sequential inputs, let green represent a 0 bit and blue represent a 1 bit. The inputs are given from low bit to high bit. Output the corresponding color for the addition of these numbers in base 2.",
};

const LevelBattle = {
  "tag": "p",
  "content": "Simulate the status of a game with a blue player using the top input and a green player using the bottom input. The game starts neutral (white). A player fires their gun by inputting red. If exactly one player fires, the state moves one step in the direction of that player (green, white, blue) or stays the same if already the color of that player. If neither fires, nothing changes. If both players fire, they both lose and you should output purple and reset the state to neutral.",
};

const LevelStack = {
  "tag": "p",
  "content": "Given two sequential inputs, push the upper color onto a stack if the lower color is green, and pop from the stack to the output if the lower color is blue. When pushing onto the stack, output the color pushed. The inputs are guaranteed such that the stack never grows beyond 3 elements.",
};

const IntroNot = [
  /*<div className="modal-title">SpaceCells</div>*/
  {
    "tag": "p",
    "content": "Welcome to SpaceCells, the satellite planet where engineers design systems that control colors at the level of electrons. The basic building block is the cell, a component with four cavities which holds two electrons.",
  },
  {
    "tag": "div",
    "className": "row-line",
    "children": [
      {
        "tag": "Svg",
        "value": "XCell",
      },
    ],
  },
  {
    "tag": "p",
    "content": "By placing them in different configurations, we can make them do anything we set our minds to!",
  },
  /*
  <div className="gridlines" style={{display:"grid", gridTemplateColumns:"repeat(6, min-content)"}}>
    <Svgs.XCell className="latched resolved-1"/><Svgs.XCell className="resolved-1"/><Svgs.XCell className="resolved-1"/><Svgs.XCell className="resolved-1"/><Svgs.XCell className="resolved-1"/><Svgs.XCell className="resolved-1"/>
    <div/><div/><Svgs.XCell className="resolved-1"/><div/><div/><div/>
    <Svgs.XCell className="resolved-1"/><div/><div/><Svgs.XCell className="resolved-0"/><Svgs.XCell className="resolved-0"/><Svgs.XCell className="resolved-0"/>
  </div>
  <p><Svgs.XCell className="inline latched resolved-1"/> is a locked cell, meaning it is fixed. Other <Svgs.XCell className="inline"/> cells are free to change.</p>
  */
  {
    "tag": "p",
    "content": "Cells are too small for human hands, so we manipulate them using bots. Bots move and perform all sorts of operations based on instructions we assign. The only ones you need as we start off are the direction instructions, the START instruction, and the NEXT instruction. There is a single START instruction and it is where the bot starts its operation. The NEXT instruction will cause your output to be verified and will advance the input(s) and output(s).",
  },
  {
    "tag": "div",
    "className": "row-line",
    "children": [
      {
        "tag": "Svg",
        "value": "Start",
        "className": "bot0",
      },
      {
        "tag": "Svg",
        "value": "Next",
        "className": "bot0",
      },
      {
        "tag": "Svg",
        "value": "DirectionLeft",
        "className": "bot0",
      },
      {
        "tag": "Svg",
        "value": "DirectionDown",
        "className": "bot0",
      },
      {
        "tag": "Svg",
        "value": "DirectionUp",
        "className": "bot0",
      },
      {
        "tag": "Svg",
        "value": "DirectionRight",
        "className": "bot0",
      },
    ],
  },
  {
    "tag": "p",
    "children": [
      {
        "tag": "span",
        "content": "You can check out the ",
      },
      {
        "tag": "em",
        "content": "Manual",
      },
      {
        "tag": "span",
        "content": " for a complete description of cells and instructions.",
      },
    ],
  },
];

const IntroCrossing = [
  {
    "tag": "div",
    "className": "note",
    "children": [
      {
        "tag": "p",
        "content": "There's no excitement like a little switcheroo.",
      },
    ],
  },
];

const IntroAnd = [
  {
    "tag": "p",
    "children": [
      {
        "tag": "span",
        "content": "You will be placing your own instructions from now on. Check the ",
      },
      {
        "tag": "em",
        "content": "Instructions",
      },
      {
        "tag": "span",
        "content": " tabs.",
      },
    ],
  },
  {
    "tag": "div",
    "className": "note",
    "children": [
      {
        "tag": "p",
        "content": "I have found a truly marvelous demonstration of this configuration, which this note is too small to contain.",
      },
      {
        "tag": "div",
        "className": "gridlines",
        "style": {
          "display": "grid",
          "gridTemplateColumns": "repeat(5, min-content)",
        },
        "children": [
          {"tag": "div"}, {"tag": "div"}, {"tag": "Svg", "value": "DiodeDown"}, {"tag": "div"}, {"tag": "div"},
          {"tag": "div"}, {"tag": "div"}, {"tag": "div"}, {"tag": "div"},
          {"tag": "Svg", "value": "DiodeRight"}, {"tag": "Svg", "value": "XCell"}, {"tag": "Svg", "value": "XCell"}, {"tag": "Svg", "value": "XCell"},
          {"tag": "div"}, {"tag": "div"}, {"tag": "Svg", "value": "DiodeUp"}, {"tag": "div"}, {"tag": "div"},
          {"tag": "div"}, {"tag": "div"}, {"tag": "div"}, {"tag": "div"},
        ],
      },
    ],
  },
];

const IntroDelay = [
  {
    "tag": "p",
    "children": [
      {
        "tag": "span",
        "content": "Most instructions are now available. Check the ",
      },
      {
        "tag": "em",
        "content": "Manual",
      },
      {
        "tag": "span",
        "content": " for descriptions."
      },
    ],
  },
  {
    "tag": "div",
    "className": "note",
    "children": [
      {
        "tag": "p",
        "content": "Cells innately have no memories, but you know bots, they never forget a thing.",
      },
    ],
  },
];

const IntroSwitch = [
  {
    "tag": "p",
    "content": "From here on, you will have multiple assignments available at a time.",
  },
  {
    "tag": "div",
    "className": "note",
    "children": [
      {
        "tag": "p",
        "content": "You can use the POWER instructions to toggle the power to the outputs.",
      },
      {
        "tag": "div",
        "className": "row-line",
        "children": [
          {
            "tag": "Svg",
            "value": "Power0",
            "className": "bot0",
          },
          {
            "tag": "Svg",
            "value": "Power0",
            "className": "bot1",
          },
          {
            "tag": "Svg",
            "value": "Power1",
            "className": "bot0",
          },
          {
            "tag": "Svg",
            "value": "Power1",
            "className": "bot1",
          },
        ],
      },
      {
        "tag": "p",
        "content": "Only powered outputs emit light. Both outputs start powered.",
      },
    ],
  },
];

export const Epilogue = [
  {
    "tag": "h2",
    "content": "Epilogue",
  },
  {
    "tag": "div",
    "className": "note",
    "children": [
      {
        "tag": "p",
        "content": "This is a final farewell. I am leaving in search of crystalized lattices which will allow for lightspeed computations. I have included a diagram here for you. With these at the table, we will have a key element towards advancing to the next age of innovation.",
      },
      {
        "tag": "Svg",
        "value": "CleanCrystalTile",
      },
    ],
  },
];

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
