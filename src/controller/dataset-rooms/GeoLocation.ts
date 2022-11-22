import * as http from "http";
import {InsightError} from "../IInsightFacade";

export class GeoLocation {
	protected requestAddress: string = "http://cs310.students.cs.ubc.ca:11316/api/v1/project_team132/";

	public setBuildingCoordinates(buildingsMap: any) {
		return new Promise((resolve, reject) => {
			let promiseArrayOfHTTP: any = [];

			for (const [buildingName] of buildingsMap) {
				// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map/get#:~:text=The%20get()%20method%20returns,it%20inside%20the%20Map%20object.
				// very interesting property of Map's get(), you get a reference to the object, any change made to this object will be modified directly in the map!
				let buildingObject = buildingsMap.get(buildingName);
				let buildingAddress = encodeURIComponent(buildingObject.address);
				let httpAddress = this.requestAddress + buildingAddress;
				promiseArrayOfHTTP.push(this.retrieveCoordinates(httpAddress, buildingObject));
			}

			return Promise.all(promiseArrayOfHTTP)
				.then(() => {
					resolve(true);
				})
				.catch((err) => {
					reject(new InsightError("unable to process lat and long" + err));
				});
		});
	}

	public retrieveCoordinates(address: string, buildingObject: any) {
		return new Promise((resolve, reject) => {
			http.get(address, (response: any) => {
				response.on("data", (result: any) => {
					let coordinates = JSON.parse(result);
					if (coordinates.lat === undefined || coordinates.lon === undefined) {
						reject(new InsightError("invalid lat or lon"));
					} else {
						buildingObject.lat = coordinates.lat;
						buildingObject.lon = coordinates.lon;
					}
				});
				resolve(true);
			});
		}).catch((err) => {
			return new InsightError("error processing lat and long" + err);
		});
	}
}
