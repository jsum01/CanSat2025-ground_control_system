import TeamSammard from 'component/TeamSammard';
import { Switch, Route, Router } from 'react-router-dom'

const App = () => {
	return (<>
		<Switch>
			<Route path="/" exact>
				<TeamSammard />
			</Route>
		</Switch>
	</>);
}

export default App