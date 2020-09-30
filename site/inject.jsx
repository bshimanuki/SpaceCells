import React from "react";
import ReactDOM from "react-dom";

import * as Main from './main.jsx';

ReactDOM.render(
  <Main.Game m={10} n={12} useServer={false}/>,
  document.getElementById("game")
);

