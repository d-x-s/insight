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
}


document.getElementById("calculate").addEventListener("click", calculateAverage);

function calculateAverage() {
	alert("Button submitted");
	let instructorInput = document.getElementById("instructor").value;
	// can send http request based on instructorInput -> use this in the WHERE clause
}
