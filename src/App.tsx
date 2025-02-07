import Main from "component/Main";
import { Switch, Route, Router } from "react-router-dom";
import "./App.css";
import { MessageProvider } from "component/MessageContext";
import { SerialProvider } from "context/SerialContext";
const App = () => {
  return (
    <MessageProvider>
      <Switch>
        <Route path="/" exact>
          <SerialProvider>
            <Main />
          </SerialProvider>
        </Route>
      </Switch>
    </MessageProvider>
  );
};

export default App;
