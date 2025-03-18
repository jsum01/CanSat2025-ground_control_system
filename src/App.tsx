import Main from "component/Main";
import { Switch, Route, Router } from "react-router-dom";
import "./App.css";
import { MessageProvider } from "component/MessageContext";
import { SerialProvider } from "context/SerialContext";
import { LoadingProvider } from "context/LoadingContext";
import { AppStateProvider } from "context/AppStateContext";

const App = () => {
  return (
    <MessageProvider>
      <LoadingProvider delay={100}> {/* 100ms 지연 설정 */}
        <AppStateProvider>
          <Switch>
            <Route path="/" exact>
              <SerialProvider>
                <Main />
              </SerialProvider>
            </Route>
          </Switch>
        </AppStateProvider>
      </LoadingProvider>
    </MessageProvider>
  );
};

export default App;
