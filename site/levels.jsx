import levels_yaml from "./levels.yaml"

const backgrounds = [
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

export const Epilogue = levels_yaml.Epilogue;

export const levels = levels_yaml.levels.map((yaml, i) => {
  if (yaml.name === "epilogue") return yaml;
  return Object.assign({
    data: require(`../examples/${yaml.name}.lvl`).default,
    background: backgrounds[i],
  }, yaml);
});
