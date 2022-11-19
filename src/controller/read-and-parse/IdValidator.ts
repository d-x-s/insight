import path from "path";
import fs from "fs";

export class IdValidator {
	public fileDirectory: string;
	constructor() {
		this.fileDirectory = __dirname + "/../../data";
	}

	// HELPER: check if id is valid
	public checkId(idToVerify: string): boolean {
		// check to see if idToVerify is a string
		// typeof is safer: https://stackoverflow.com/questions/2703102/typeof-undefined-vs-null
		if (idToVerify === null || typeof idToVerify === "undefined") {
			return false;
		}

		// check to see if there are any underscores
		if (idToVerify.includes("_")) {
			return false;
		}

		// check to see if the whole string is only white spaces
		return idToVerify.trim().length !== 0;
	}

	// HELPER: check if content is valid
	public checkContent(contentToVerify: string): boolean {
		return !(contentToVerify === null || typeof contentToVerify === "undefined");
	}

	// // HELPER: check if kind is valid
	// // Note: for C1, we are only accepting Sections and not Rooms
	// public checkKind(kindToVerify: InsightDatasetKind): boolean {
	// 	return kindToVerify === InsightDatasetKind.Sections;
	// }

	// HELPER: check if id exists on disk
	public checkIfExistsOnDisk(idToCheck: string) {
		let idToSearchFor = path.join(this.fileDirectory, "/" + idToCheck + ".zip");
		if (fs.existsSync(idToSearchFor)) {
			return true;
		} else {
			return false;
		}
	}
}
