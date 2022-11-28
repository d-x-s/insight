// // const axios = require("axios");
// // import * as axios from "axios";
//
// document.getElementById("submit-rooms").addEventListener("click", submitRooms);
//
// function submitRooms() {
// 	alert("Button submitted");
// 	let firstRoomInput = document.getElementById("firstRoom").value;
// 	let secondRoomInput = document.getElementById("secondRoom").value;
// 	// can use firstRoomInput and secondRoomInput to send http request
//
// 	console.log("1");
// 	let firstRoomQuery = constructRoomQuery(firstRoomInput);
// 	let secondRoomQuery = constructRoomQuery(secondRoomInput);
//
// 	console.log("2");
//
// 	// console.log("2.4", firstRoomQueryResults);
//
// 	return new Promise((resolve, reject) => {
// 		console.log("3");
// 		let firstRoomQueryResults = sendQuery(firstRoomQuery);
// 		let secondRoomQueryResults = sendQuery(secondRoomQuery);
//
// 		console.log("4.1", firstRoomQueryResults);
// 		resolve([firstRoomQueryResults, secondRoomQueryResults]);
// 	}).then((result) => {
// 		console.log("4.2", result);
// 		let firstRoomBuilding = result[0][0];
// 		let secondRoomBuilding = result[1][0];
//
// 		let distanceBetweenBuildings = calculateDistance(firstRoomBuilding, secondRoomBuilding);
// 		const roomOutput = document.querySelector('.input-rooms-result');
// 		roomOutput.textContent = `Distance between rooms: ${distanceBetweenBuildings}`;
// 	});
//
//
// 	// console.log("3");
// 	// // get first of array
// 	// // let firstRoomBuilding = firstRoomQueryResults[0];
// 	// // let secondRoomBuilding = secondRoomQueryResults[0];
// 	//
// 	// console.log("4");
// 	// console.log("distance", firstRoomBuilding);
// 	// let distanceBetweenBuildings = calculateDistance(firstRoomBuilding, secondRoomBuilding);
// 	//
// 	// // display difference to user
// 	// console.log("distance between buildings", distanceBetweenBuildings);
// }
//
// function constructRoomQuery(roomInput) {
// 	return {
// 		"WHERE": {
// 			"AND": [
// 				{
// 					"IS": {
// 						"rooms_fullname": roomInput
// 					}
// 				}
// 			]
// 		},
// 		"OPTIONS": {
// 			"COLUMNS": [
// 				"rooms_fullname",
// 				"rooms_lat",
// 				"rooms_lon"
// 			],
// 			"ORDER": "rooms_fullname"
// 		}
// 	}
// }
//
// function sendQuery(query) {
//
// 	// get('http:localhost:4321/' + query).then((result) => {
// 	// 	console.log(result);
// 	// });
//
// 	axios.get('http:localhost:4321/' + query, {withCredentials: false}).then((result) => {
// 		console.log(result);
// 	});
//
// 	// return new Promise(function (resolve, reject) {
// 	// 	console.log("promise reached");
// 	// 	let queryRequest = new XMLHttpRequest();
// 	// 	// use axios
// 	// 	console.log("a");
// 	// 	queryRequest.open("GET", "http://localhost:4321/query", true);
// 	// 	console.log("b");
// 	// 	// https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Type
// 	// 	queryRequest.setRequestHeader("Content-Type", "application/json");
// 	// 	console.log("c");
// 	// 	queryRequest.send(JSON.stringify(query));
// 	//
// 	// 	console.log("d");
// 	// 	queryRequest.onload = function() {
// 	// 		if (queryRequest.status === 200) {
// 	// 			console.log("4.01");
// 	// 			resolve(JSON.parse(queryRequest.responseText));
// 	// 		} else {
// 	// 			const roomOutput = document.querySelector('.input-rooms-result');
// 	// 			roomOutput.textContent = `Error processing your request.`;
// 	// 			reject();
// 	// 		}
// 	// 	};
// 	// });
// }
//
// function calculateDistance(firstLocation, secondLocation) {
//
// 	let latDifference = (firstLocation.lat - secondLocation.lat) * (Math.PI/180);
// 	let lonDifference = (firstLocation.lon - secondLocation.lon) * (Math.PI/180);
//
// 	let a =
// 		Math.sin(latDifference/2) * Math.sin(latDifference/2) +
// 		Math.cos((Math.PI/180)*(firstLocation.lat)) * Math.cos((Math.PI/180)*(secondLocation.lat)) *
// 		Math.sin(lonDifference/2) * Math.sin(lonDifference/2);
// 	let c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
// 	let earthRadius = 6371;
// 	return earthRadius * c; // Distance in km
//
// }
//
// document.getElementById("calculate-instructor").addEventListener("click", calculateAverage);
//
// function calculateAverage() {
// 	let instructorInput = document.getElementById("instructor").value;
// 	let instructorQuery = constructInstructorQuery(instructorInput);
//
// 	let allInstructorCourses = sendQuery(instructorQuery);
//
// 	let resultArray = allInstructorCourses["result"];
// 	let firstRoom = resultArray[0];
// 	let average = firstRoom["AvgOfSectionAverages"]
//
// 	const instructorOutput = document.querySelector('.input-instructor-result');
// 	instructorOutput.textContent = `Average of Instructor: ${average}`;
// }
//
// function constructInstructorQuery(instructorInput) {
// 	return {
// 		"WHERE": {
// 			"IS": {
// 				"sections_instructor": instructorInput
// 			}
// 		},
// 		"OPTIONS": {
// 			"COLUMNS": [
// 				"sections_instructor",
// 				"AvgOfSectionAverages"
// 			],
// 			"ORDER": {
// 				"dir": "DOWN",
// 				"keys": [
// 					"AvgOfSectionAverages"
// 				]
// 			}
// 		},
// 		"TRANSFORMATIONS": {
// 			"GROUP": [
// 				"sections_instructor"
// 			],
// 			"APPLY": [
// 				{
// 					"AvgOfSectionAverages": {
// 						"AVG": "sections_avg"
// 					}
// 				}
// 			]
// 		}
// 	}
// }
