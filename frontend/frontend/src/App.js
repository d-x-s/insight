import logo from './logo.svg';
import './App.css';
// import {handleSubmission} from "./HandleSubmit";
import {useRef, useState} from "react";
import axios from "axios";

function App() {
	const firstRoomInputField = useRef(null);
	const secondRoomInputField = useRef(null);
	const instructorInputField = useRef(null);

	// let distanceResult = useState("");
	const [distanceResult, setCount] = useState(null);
	const [instructorAvg, setInstructorAvg] = useState(null);

	const handleRoomSubmission = () => {
		let firstRoomInput = firstRoomInputField.current.value;
		let secondRoomInput = secondRoomInputField.current.value;

		let firstRoomQuery = createRoomQuery(firstRoomInput);
		let secondRoomQuery = createRoomQuery(secondRoomInput);

		sendRoomQueries(firstRoomQuery, secondRoomQuery).then((r) => {
			console.log("r", r);
			// distanceResult = r;
		});
	}

	function createRoomQuery(input) {
		let x = {
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
		return x;
	}

	async function sendRoomQueries(firstQuery, secondQuery) {
		axios.post(`http://localhost:4321/query`, firstQuery)
			.then((firstResult) => {
				console.log("result from sendQuery1", firstResult.data.result[0]);
				let firstResultValue = firstResult.data.result[0];
				axios.post(`http://localhost:4321/query`, secondQuery).then((secondResult) => {
					let secondResultValue = secondResult.data.result[0];
					console.log("result from sendQuery2", secondResult.data.result[0]);
					return calculateDistance(firstResultValue, secondResultValue);
				}).catch((err) => {
					setCount("Error sending query (Room not found)  " + err);
					console.log("Unable to generate second request. Please resubmit the second room. ", err);
				});
			}).catch((err) => {
				setCount("Error sending query (Room not found)  " + err);
				console.log("Unable to generate first request. Please resubmit the first room. ", err);
		});
	}

	function calculateDistance(firstLocation, secondLocation) {
		let latDifference = (firstLocation["rooms_lat"] - secondLocation["rooms_lat"]) * (Math.PI/180);
		let lonDifference = (firstLocation["rooms_lon"] - secondLocation["rooms_lon"]) * (Math.PI/180);

		// console.log(latDifference);
		// console.log(lonDifference);

		let a = Math.sin(latDifference/2) * Math.sin(latDifference/2) +
			Math.cos((Math.PI/180)*(firstLocation["rooms_lat"])) * Math.cos((Math.PI/180)*(secondLocation["rooms_lat"])) *
			Math.sin(lonDifference/2) * Math.sin(lonDifference/2);
		let c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
		let earthRadius = 6371;
		console.log("earth", earthRadius * c);
		setCount("Distance between Rooms: " + earthRadius*c + "km");
		return earthRadius * c; // Distance in km
	}

	const handleInstructorSubmission = () => {
		let instructorInput = instructorInputField.current.value;

		let instructorQuery = createInstructorQuery(instructorInput);

		console.log("instructorQuery", instructorQuery);

		sendInstructorQuery(instructorQuery);

	}

	function createInstructorQuery(input) {
		let x = {
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

		return x;
	}

	function sendInstructorQuery(query) {
		axios.post(`http://localhost:4321/query`, query)
			.then((result) => {
				console.log("result from sendQuery", result.data.result[0]["AvgOfSectionAverages"]);
				setInstructorAvg("Instructor's average: " + result.data.result[0]["AvgOfSectionAverages"]);
			}).catch((err) => {
				setInstructorAvg("Instructor not found. Please resubmit the instructor's name. Error: " + err);
				console.log("Unable to generate request", err);
		});
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
				<button id="-rooms" onClick={handleRoomSubmission}>Submit Names</button>
				<p>{distanceResult}</p>

				<p>
					Input instructor here:
				</p>
				<input className="instructor-input" ref={instructorInputField} />
				<br></br>
				<button id="submit-instructors" onClick={handleInstructorSubmission}>Submit Instructor</button>
				<p>{instructorAvg}</p>

			</header>
		</div>
	);
}

export default App;
