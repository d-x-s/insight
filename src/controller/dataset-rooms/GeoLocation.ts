import * as http from "http";
import {InsightError} from "../IInsightFacade";

export class GeoLeocation {

	constructor() {
		console.log("Geolocation class created");
	}

	// HELPER:
	public processLatAndLong(address: string): Promise<any> {
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
