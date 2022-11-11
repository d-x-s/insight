import {InsightDatasetKind, InsightError, InsightResult} from "../IInsightFacade";
// import parse5 = require ("parse5");
import {RoomData} from "./RoomData";

export default class RoomsHelper {

	constructor() {
		console.log("Roome Helper created");
	}

	// TODO: After addRooms is completed
	private findGeolocation() {
		// TODO: send a get request to http://cs310.students.cs.ubc.ca:11316/api/v1/project_team<TEAM NUMBER>/<ADDRESS>

		// use http://cs310.students.cs.ubc.ca:11316/api/v1/project_team132 + append room
	}

	private verifyValidityOfRooms(content: any) {
		// check if valid zip file

		// check if single .htm file per dataset in root of zip

		// check if rooms c

		return false;
	}

	// HELPER: takes in content and adds
	public addRooms(id: string, content: string, kind: InsightDatasetKind): Promise<string[]> {

		// TODO: Retrieve geolocation of each building

		if (this.verifyValidityOfRooms(content)){
			return Promise.reject(new InsightError("ERROR: Invalid room"));
		}

		return Promise.reject(new InsightError("reject"));
	}

	public parseRoom(content: string): Promise<RoomData[]> {

		// return new Promise((resolve, reject) => {
		//
		// });

		return Promise.reject(new InsightError("ERROR: "));
	}

	// SPEC:
	// (i) extend the query language to accommodate queries to a new dataset, i.e. Rooms; and
	// (ii) enable more comprehensive queries about the datasets, i.e. aggregate results.
	public performRoomQuery(): Promise<InsightResult[]> {
		return Promise.reject(new InsightError("reject"));
	}
}
