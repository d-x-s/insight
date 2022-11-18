import * as http from "http";
import {InsightError} from "../IInsightFacade";
import InsightFacade from "../InsightFacade";

export class GeoLeocation {

	constructor() {
		console.log("Geolocation class created");
	}

	public processLatAndLong(index: any) {
		return new Promise((resolve, reject) => {
			let promiseLatAndLong: any = [];

			console.log("process called");

			let requestAddress = "http://cs310.students.cs.ubc.ca:11316/api/v1/project_team132/";

			console.log("index", index);

			for (let roomBuildingName in index) {
				let geoLocationResult: any = {lat: null, lon: null};

				let roomInfo = index[roomBuildingName];
				let appendAddress = encodeURIComponent(roomInfo.address);
				let newAddress = requestAddress + appendAddress;

				console.log("woohoo");

				promiseLatAndLong.push(this.processLatAndLongHelper(geoLocationResult, newAddress, roomInfo, index));
			}

			return Promise.all(promiseLatAndLong).then(() => {
				resolve(true);
			});
		});
	}

	// HELPER:
	public processLatAndLongHelper(currResult: any, address: string, roomInfo: any, index: any): Promise<any> {
		// TODO: Send request to http://cs310.students.cs.ubc.ca:11316/api/v1/project_team132/<ADDRESS>

		console.log("process1");

		let promises: Promise<any> = new Promise<any>((resolve, reject) => {
			http.get(address, (result: any) => {

				let res = JSON.parse(result);

				if (res.lat === undefined || res.lon === undefined) {
					return new InsightError("invalid lat or lon");
				} else {
					console.log("res", res.lat, res.lon);
					roomInfo.lat = res.lat;
					roomInfo.lon = res.lon;
					index.building[roomInfo.shortname] = roomInfo;
				}

			});
		}).catch((err) => {
			return new InsightError("Error processing lat and long" + err);
		});

		return promises.then((result): any => {
			console.log("res", result);
			return Promise.resolve(result);
		});
	}


}
