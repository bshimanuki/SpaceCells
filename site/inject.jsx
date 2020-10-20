import React from "react";
import ReactDOM from "react-dom";

import * as Main from './main.jsx';
import Reference from './reference.jsx';
import * as api from "./server-api-local.jsx";

if (document.getElementById("reference")) {
  ReactDOM.render(
    <Reference/>,
    document.getElementById("reference")
  );
}

if (document.getElementById("game")) {
  ReactDOM.render(
    <Main.Game m={10} n={12}
      api={api}
      isSolutions={false}
    />,
    document.getElementById("game")
  );
}
