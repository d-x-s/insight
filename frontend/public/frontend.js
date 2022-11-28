document.getElementById("click-me-button").addEventListener("click", handleClickMe);

function handleClickMe() {
	alert("Button Clicked!");
}

//

// let roomSubmission = document.getElementById("room-form").submit();
//
// console.log("roomSubmission", roomSubmission);

document.getElementById("submit-rooms").addEventListener("click", submitRooms);

function submitRooms() {
	alert("Button submitted");
	let firstRoomInput = document.getElementById("firstRoom").value;
	let secondRoomInput = document.getElementById("secondRoom").value;
	// can use firstRoomInput and secondRoomInput to send http request

	console.log("1");
	let firstRoomQuery = constructRoomQuery(firstRoomInput);
	let secondRoomQuery = constructRoomQuery(secondRoomInput);

	console.log("2");
	let firstRoomQueryResults = sendRoomQuery(firstRoomQuery);
	let secondRoomQueryResults = sendRoomQuery(secondRoomQuery);

	console.log("3");
	// get first of array
	let firstRoomBuilding = firstRoomQueryResults[0];
	let secondRoomBuilding = secondRoomQueryResults[0];

	console.log("4");
	let distanceBetweenBuildings = calculateDistance(firstRoomBuilding, secondRoomBuilding);

	// display difference to user
	console.log("distance between buildings", distanceBetweenBuildings);
}


function constructRoomQuery(roomInput) {
	return {
		"WHERE": {
			"IS": {
				"sections_instructor": roomInput
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

function sendRoomQuery(query) {

	return new Promise(function (resolve, reject) {
		let queryRequest = new XMLHttpRequest();
		queryRequest.onload = function() {
			if (queryRequest.status === 200) {
				resolve(JSON.parse(queryRequest.responseText));
			}
		}
		queryRequest.open("GET", "http:localhost:4321/query", true);
		// https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Type
		queryRequest.setRequestHeader("Content-Type", "application/json");
		queryRequest.send(JSON.stringify(query));
	});

}

function calculateDistance(firstLocation, secondLocation) {

	// calculate distance between two buildings using Haversine formula
	// https://stackoverflow.com/questions/18883601/function-to-calculate-distance-between-two-coordinates
	let latDifference = (firstLocation.lat - secondLocation.lat) * (Math.PI/180);
	let lonDifference = (firstLocation.lon - secondLocation.lon) * (Math.PI/180);

	let a =
		Math.sin(latDifference/2) * Math.sin(latDifference/2) +
		Math.cos((Math.PI/180)*(firstLocation.lat)) * Math.cos((Math.PI/180)*(secondLocation.lat)) *
		Math.sin(lonDifference/2) * Math.sin(lonDifference/2);
	let c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
	let earthRadius = 6371;
	return earthRadius * c; // Distance in km

}



////


document.getElementById("calculate").addEventListener("click", calculateAverage);

function calculateAverage() {
	alert("Button submitted");
	let instructorInput = document.getElementById("instructor").value;
	let instructorQuery = constructInstructorQuery(instructorInput);



}


function constructInstructorQuery(instructorInput) {
	return {
		"WHERE": {
			"IS": {
				"sections_instructor": instructorInput
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
