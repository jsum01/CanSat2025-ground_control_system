import Main from 'component/Main';
import { Switch, Route, Router } from 'react-router-dom'

const App = () => {
	return (<>
		<Switch>
			<Route path="/" exact>
				<Main />
			</Route>
		</Switch>
	</>);
}

export default App