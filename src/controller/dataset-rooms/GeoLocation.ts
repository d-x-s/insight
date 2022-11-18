import * as http from "http";
import {InsightError} from "../IInsightFacade";

export class GeoLeocation {

	constructor() {
		console.log("Geolocation class created");
	}

	public processLatAndLong(index: any) {
		let promiseLatAndLong: Array<Promise<string>> = [];
		Object.keys(index).forEach((indexKey: string) => {
			promiseLatAndLong.push(this.processLatAndLongHelper(indexKey, index));
		});
		return Promise.all(promiseLatAndLong);
	}

	// HELPER:
	public processLatAndLongHelper(address: string, internalIndex: any): Promise<any> {
		// TODO: Send request to http://cs310.students.cs.ubc.ca:11316/api/v1/project_team132/<ADDRESS>

		let geoLocationResult: any = {lat: null, lon: null};
		let requestAddress = "http://cs310.students.cs.ubc.ca:11316/api/v1/project_team132/" + address;

		let promises: Promise<any> = new Promise<any>((resolve, reject) => {
			http.get(requestAddress, (result) => {
				let data = "";
				result.setEncoding("utf8");

				result.on("data", (currListener) => {
					data += currListener;
				});
				result.on("end", () => {
					geoLocationResult = JSON.parse(data);
					internalIndex[address]["lon"] = geoLocationResult["lon"];
					internalIndex[address]["lat"] = geoLocationResult["lat"];
					resolve(geoLocationResult);
				}).on("error", (err) => {
					reject(new InsightError("Error processing Lat and Long" + err));
				});
			});
		}).catch((err) => {
			return new InsightError("Error processing lat and long" + err);
		});

		return promises.then((result): any => {
			return Promise.resolve(result);
		});
	}


}
