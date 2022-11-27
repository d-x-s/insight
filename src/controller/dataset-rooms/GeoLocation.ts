import * as http from "http";

export class GeoLocation {
	protected requestAddress: string = "http://cs310.students.cs.ubc.ca:11316/api/v1/project_team132/";

	public setBuildingCoordinates(buildingsMap: any) {
		return new Promise((resolve) => {
			let promiseArrayOfHTTP: any = [];
			for (const [buildingName] of buildingsMap) {
				// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map/get#:~:text=The%20get()%20method%20returns,it%20inside%20the%20Map%20object.
				// interesting property of Map's get(), if the value is an object you will receive a reference to it (not a copy of the object), any change made to this object will modify it directly in the map!
				let buildingObject = buildingsMap.get(buildingName);
				let buildingAddress = encodeURIComponent(buildingObject.address);
				let httpAddress = this.requestAddress + buildingAddress;
				promiseArrayOfHTTP.push(this.retrieveCoordinates(httpAddress, buildingObject));
			}

			// if you use Promise.all, you reject if any of the promises reject
			// use Promise.allSettled because we SKIP over buildings we fail to retrieve coordinates for
			// there is no need to handle the case where an invalid coordinate retrieval causes a (building) promise to be rejected, just ignore it and we will filter out the invalid results later
			// if we fail to retrieve the coordinates for a building, we will not add the coordinate key value pairs to the corresponding rooms
			// this is how we identify any invalid rooms, as these invalid builings will result in rooms without all 11 keys (in particular, they will be missing lat and lon keys)
			return Promise.allSettled(promiseArrayOfHTTP).then(() => {
				resolve(true);
			});
		});
	}

	private retrieveCoordinates(address: string, buildingObject: any) {
		return new Promise((resolve, reject) => {
			http.get(address, (response: any) => {
				if (response.statusCode < 200 || response.statusCode >= 300) {
					return reject(new Error("HTTP error with statusCode=" + response.statusCode));
				}
				response.on("data", (result: any) => {
					let coordinates = JSON.parse(result);
					if (coordinates.lat !== undefined && coordinates.lon !== undefined) {
						buildingObject.lat = coordinates.lat;
						buildingObject.lon = coordinates.lon;
					}
				});
				resolve(true);
			});
		});
	}
}
