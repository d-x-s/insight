import logo from './logo.svg';
import './App.css';

function App() {
  return (
    <div className="App">
      <header className="App-header">
	  	<p>
			Input rooms here:
		</p>
		<input className="first-room-input" />
	  	<input className="second-room-input" />
		  <br></br>
	  	<button id="submit-rooms">Submit Names</button>

	  	<p>
			Input instructor here:
		</p>
	  	<input className="instructor-input" />
		  <br></br>
	  	<button id="submit-instructors">Submit Instructor</button>

      </header>
    </div>
  );
}

export default App;
