import logo from './logo.svg';
import './App.css';
// import {handleSubmission} from "./HandleSubmit";
import {useRef} from "react";

function App() {
	const firstRoomInputField = useRef(null);
	const secondRoomInputField = useRef(null);
	const instructorInputField = useRef(null);

	const handleRoomSubmission = () => {
		let firstRoomInput = firstRoomInputField.current.value;
		let secondRoomInput = secondRoomInputField.current.value;

		// let firstRoomQuery = createRoomQuery(firstRoomInput);
		// let secondRoomQuery = createRoomQuery(secondRoomInput);

		// call




	}

	const handleInstructorSubmission = () => {
		let instructorInput = instructorInputField.current.value;
	}


  return (
    <div className="App">
      <header className="App-header">
	  	<p>
			Input rooms here:
		</p>
		<input id="first-room-input" ref={firstRoomInputField} />
	  	<input className="second-room-input" ref={secondRoomInputField} />
		  <br></br>
	  	<button id="submit-rooms" onClick={handleRoomSubmission}>Submit Names</button>

	  	<p>
			Input instructor here:
		</p>
	  	<input className="instructor-input" ref={instructorInputField} />
		  <br></br>
	  	<button id="submit-instructors" onClick={handleInstructorSubmission}>Submit Instructor</button>

      </header>
    </div>
  );
}

export default App;
