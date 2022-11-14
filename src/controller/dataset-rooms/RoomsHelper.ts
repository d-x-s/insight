import {InsightDatasetKind, InsightError, InsightResult} from "../IInsightFacade";
import {IRoomDataset} from "./IRoomDataset";
// import parse5 = require ("parse5");

export default class RoomsHelper {
	constructor() {
		console.log("Rooms Helper created");
	}

	// TODO!!!!!!!!!!!!!!!
	// please make RoomsHelper a mirror of CoursesHelper
	// note: remember that CoursesHelper used to be AddDatasetHelpers, which I have refactored
	// code duplication is OK
	// I think that if we mirror CoursesHelper and RoomsHelper, it will be far easier than adapting AddDatasetHelpers to accept both the Sections and Rooms kinds of datasets

	// think about this, if we have separate INTERNALMODELS then when we remove a dataset, we need to check both because an id does not encode the kind of dataset
	// but if we have separate datasets, then wheenver we add a new dataset, we need to check the other map so that the ids are unique across both
	// I think this is not intuitive and will add a lot of unneccesary checking logic
	// therefore we go with the string:any key value pair for our Map and this preserve the majority of our original code (OCP)

	public addRoomsDatasetToModel(
		id: string,
		content: string,
		kind: InsightDatasetKind,
		model: Map<string, IRoomDataset>
	): Promise<string[]> {
		// TODO: Retrieve geolocation of each building

		return Promise.reject(new InsightError("reject"));
	}

	// SPEC:
	// (i) extend the query language to accommodate queries to a new dataset, i.e. Rooms; and
	// (ii) enable more comprehensive queries about the datasets, i.e. aggregate results.
	public performRoomQuery(): Promise<InsightResult[]> {
		return Promise.reject(new InsightError("reject"));
	}

	private findGeolocation() {
		// TODO: send a get request to http://cs310.students.cs.ubc.ca:11316/api/v1/project_team<TEAM NUMBER>/<ADDRESS>
	}
}
