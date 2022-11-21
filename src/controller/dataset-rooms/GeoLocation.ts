import * as http from "http";
import {InsightError} from "../IInsightFacade";

export class GeoLocation {

	public processLatAndLong(internalRoomsInput: any) {
		return new Promise((resolve, reject) => {
			let promiseLatAndLong: any = [];
			let requestAddress = "http://cs310.students.cs.ubc.ca:11316/api/v1/project_team132/";

			for (let roomBuildingName in internalRoomsInput) {
				let geoLocationResult: any = {lat: null, lon: null};
				let roomInfo = internalRoomsInput[roomBuildingName];
				let appendAddress = encodeURIComponent(roomInfo.address);
				let newAddress = requestAddress + appendAddress;
				promiseLatAndLong.push(this.processLatAndLongHelper(
									   geoLocationResult,
									   newAddress,
					                   roomInfo,
									   internalRoomsInput));
			}

			return Promise.all(promiseLatAndLong).then(() => {
				resolve(true);
			}).catch((err) => {
				reject(new InsightError("ERROR: unable to process lat and long" + err));
			});
		});
	}

	public processLatAndLongHelper(currResult: any, address: string, roomInfo: any, internalRoomsIndex: any) {
		return new Promise((resolve, reject) => {
			http.get(address, (result: any) => {
				result.on("data", (tempRes: any) => { // BUGNOTE
					let res = JSON.parse(tempRes);
					if (res.lat === undefined || res.lon === undefined) {
						reject(new InsightError("invalid lat or lon"));
					} else {
						roomInfo.lat = res.lat;
						roomInfo.lon = res.lon;
						internalRoomsIndex[roomInfo.shortname] = roomInfo;
					}
				});
				resolve(true);
			});
		}).catch((err) => {
			return new InsightError("Error processing lat and long" + err);
		});
	}
}
