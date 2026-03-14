import { render } from 'preact';
import Router from 'preact-router';
import { Admin } from './pages/Admin';
import { Fids } from './pages/Fids';
import { Gids } from './pages/Gids';
import './style.css';

function App() {
  return (
    <Router>
      <Admin path="/admin" />
      <Fids path="/fids/:id" />
      <Gids path="/gids/:id" />
      <Admin path="/" default />
    </Router>
  );
}

render(<App />, document.getElementById('app')!);
