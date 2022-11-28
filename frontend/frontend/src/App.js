import logo from './logo.svg';
import './App.css';
// import {handleSubmission} from "./HandleSubmit";
import {useRef} from "react";
import axios from "axios";

function App() {
	const firstRoomInputField = useRef(null);
	const secondRoomInputField = useRef(null);
	const instructorInputField = useRef(null);

	const handleRoomSubmission = () => {
		let firstRoomInput = firstRoomInputField.current.value;
		let secondRoomInput = secondRoomInputField.current.value;

		let firstRoomQuery = createRoomQuery(firstRoomInput);
		let secondRoomQuery = createRoomQuery(secondRoomInput);

		let firstRoomQueryResults = sendQuery(firstRoomQuery);
		let secondRoomQueryResults = sendQuery(secondRoomQuery);

		let firstRoomBuilding = firstRoomQueryResults[0];
		let secondRoomBuilding = secondRoomQueryResults[0];

		console.log("firstRoom", firstRoomBuilding);

		let distanceBetweenBuildings = calculateDistance(firstRoomBuilding, secondRoomBuilding);
		
		// render value
	}

	function createRoomQuery(input) {
		return {
			"WHERE": {
				"AND": [
					{
						"IS": {
							"rooms_fullname": input
						}
					}
				]
			},
			"OPTIONS": {
				"COLUMNS": [
					"rooms_fullname",
					"rooms_lat",
					"rooms_lon"
				],
				"ORDER": "rooms_fullname"
			}
		}
	}

	function sendQuery(query) {
		axios.get(`http://localhost:4321/datasets`, query)
			.then((result) => {
				console.log("result", result.data);
			return result.data;
		}).catch((err) => {
			console.log("Unable to generate request", err);
		});
	}

	function calculateDistance(firstLocation, secondLocation) {
		let latDifference = (firstLocation.lat - secondLocation.lat) * (Math.PI/180);
		let lonDifference = (firstLocation.lon - secondLocation.lon) * (Math.PI/180);

		let a = Math.sin(latDifference/2) * Math.sin(latDifference/2) +
			Math.cos((Math.PI/180)*(firstLocation.lat)) * Math.cos((Math.PI/180)*(secondLocation.lat)) *
			Math.sin(lonDifference/2) * Math.sin(lonDifference/2);
		let c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
		let earthRadius = 6371;
		return earthRadius * c; // Distance in km
	}

	const handleInstructorSubmission = () => {
		let instructorInput = instructorInputField.current.value;

		let instructorQuery = createInstructorQuery(instructorInput);

		let instructorResult = sendInstructorQuery(instructorQuery);

		// let instructorAverage = instructorResult.getAverage//

		// render instructorAverage

	}

	function createInstructorQuery(input) {
		return {
			"WHERE": {
				"IS": {
					"sections_instructor": input
				}
			},
			"OPTIONS": {
				"COLUMNS": [
					"sections_instructor",
					"AvgOfSectionAverages"
				],
				"ORDER": {
					"dir": "DOWN",
					"keys": [
						"AvgOfSectionAverages"
					]
				}
			},
			"TRANSFORMATIONS": {
				"GROUP": [
					"sections_instructor"
				],
				"APPLY": [
					{
						"AvgOfSectionAverages": {
							"AVG": "sections_avg"
						}
					}
				]
			}
		}
	}

	function sendInstructorQuery(query) {

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
	  	<p></p>

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
