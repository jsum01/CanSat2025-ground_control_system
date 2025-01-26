import Main from 'component/Main';
import { Switch, Route, Router } from 'react-router-dom'
import './App.css';
import { MessageProvider } from 'component/MessageContext';
const App = () => {
	return (
	<MessageProvider>
		<Switch>
			<Route path="/" exact>
				<Main />
			</Route>
		</Switch>
	</MessageProvider>
	);
}

export default App