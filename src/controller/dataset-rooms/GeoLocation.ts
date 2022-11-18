import * as http from "http";
import {InsightError} from "../IInsightFacade";

export class GeoLocation {

	constructor() {
		console.log("Geolocation class created");
	}

	public processLatAndLong(internalRoomsInput: any) {
		return new Promise((resolve, reject) => {
			let promiseLatAndLong: any = [];

			// console.log("process called");

			let requestAddress = "http://cs310.students.cs.ubc.ca:11316/api/v1/project_team132/";

			// console.log("index", index);

			for (let roomBuildingName in internalRoomsInput) {
				let geoLocationResult: any = {lat: null, lon: null};

				let roomInfo = internalRoomsInput[roomBuildingName];
				let appendAddress = encodeURIComponent(roomInfo.address);
				let newAddress = requestAddress + appendAddress;

				// console.log("woohoo");

				promiseLatAndLong.push(this.processLatAndLongHelper(geoLocationResult, newAddress,
					roomInfo, internalRoomsInput));
			}

			return Promise.all(promiseLatAndLong).then(() => {
				resolve(true);
			}).catch((err) => {
				reject(new InsightError("ERROR: unable to process lat and long" + err));
			});
		});
	}

	// HELPER:
	public processLatAndLongHelper(currResult: any, address: string, roomInfo: any, internalRoomsIndex: any) {
		// TODO: Send request to http://cs310.students.cs.ubc.ca:11316/api/v1/project_team132/<ADDRESS>

		// console.log("process1");

		// let promises: Promise<any> =
		return new Promise((resolve, reject) => {
			http.get(address, (res: any) => {

				// let res = JSON.parse(result);
				console.log("fetching http");
				// console.log("res", res);

				if (res.lat === undefined || res.lon === undefined) {
					reject(new InsightError("invalid lat or lon"));
				} else {
					console.log("res", res.lat, res.lon);
					roomInfo.lat = res.lat;
					roomInfo.lon = res.lon;
					// fix this
					internalRoomsIndex[roomInfo.shortname] = roomInfo;
				}
				// FIX THIS
				resolve(true);
			});
		}).catch((err) => {
			return new InsightError("Error processing lat and long" + err);
		});

		// Promise.all([promises]).then((result): any => {
		// 	console.log("res", result);
		// 	return Promise.resolve(result);
		// });
	}


}
