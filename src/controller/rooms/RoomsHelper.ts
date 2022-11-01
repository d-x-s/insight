import {InsightDatasetKind, InsightError, InsightResult} from "../IInsightFacade";
// import parse5 = require ("parse5");

export default class RoomsHelper {
	constructor() {
		console.log("Rooms Helper created");
	}

	private findGeolocation() {
		// TODO: send a get request to http://cs310.students.cs.ubc.ca:11316/api/v1/project_team<TEAM NUMBER>/<ADDRESS>
	}

	public addRooms(id: string, content: string, kind: InsightDatasetKind): Promise<string[]> {

		// TODO: Retrieve geolocation of each building


		return Promise.reject(new InsightError("reject"));
	}

	// SPEC:
	// (i) extend the query language to accommodate queries to a new dataset, i.e. Rooms; and
	// (ii) enable more comprehensive queries about the datasets, i.e. aggregate results.
	public performRoomQuery(): Promise<InsightResult[]> {
		return Promise.reject(new InsightError("reject"));
	}
}
