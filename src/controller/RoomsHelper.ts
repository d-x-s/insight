import {InsightDatasetKind, InsightError} from "./IInsightFacade";

export default class RoomsHelper {

	constructor() {
		console.log("Rooms Helper created");
	}

	public addRooms(id: string, content: string, kind: InsightDatasetKind): Promise<string[]> {
		return Promise.reject(new InsightError("reject"));
	};

}
