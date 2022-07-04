import './index.scss'
import logo from './logo.png'

function App() {
  return (
    <div>
      <div className="navbar">
        <img src={logo} height="18" alt="Nylund Development" />
        <div className="toolbar">
          <p>File</p>
        </div>
      </div>
      <div className="content">
        <div style={{ width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}> <img width="150" src={logo} alt="Nylund Development" style={{ filter: 'drop-shadow(1px 1px 5px #111a)'}} /> </div>
      </div>
    </div>
  );
}

export default App;
