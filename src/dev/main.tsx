import React from "react";
import ReactDOM from "react-dom/client";

import main from "../../shaders/main.wesl?static";

console.log(main);

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    Use this to run a local development environment of the library for testing
  </React.StrictMode>,
);
