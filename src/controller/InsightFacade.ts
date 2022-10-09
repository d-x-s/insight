import {
	IInsightFacade,
	InsightDataset,
	InsightDatasetKind,
	InsightError,
	InsightResult,
	NotFoundError
} from "./IInsightFacade";
import PerformQueryHelper from "./PerformQueryHelper";
import Utility from "../Utility";
import ValidateQueryHelper from "./ValidateQueryHelper";
import JSZip from "jszip";
import Dataset from "./Dataset";

/**
 * This is the main programmatic entry point for the project.
 * Method documentation is in IInsightFacade
 *
 */
export default class InsightFacade implements IInsightFacade {

	// instantiate dataset locally after
	// currently mapped as
	public dataset!: Map<string, Dataset[]>;

	constructor() {
		Utility.log("initialize InsightFacade", "trace");
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
		if (idToVerify.trim().length === 0) {
			return false;
		}

		return true;
	}

	// HELPER: check if content is valid
	public checkContent(contentToVerify: string): boolean {
		if (contentToVerify === null || typeof contentToVerify === "undefined") {
			return false;
		}
		return true;
	}

	// HELPER: check if kind is valid
	// Note: for C1, we are only accepting Sections and not Rooms
	public checkKind(kindToVerify: InsightDatasetKind): boolean {
		if (kindToVerify !== InsightDatasetKind.Sections) {
			return false;
		}
		return true;
	}

	/*
    * addDataset(id: string, content: string, kind: InsightDatasetKind):
    * Promise<string[]> adds a dataset to the internal model,
    * providing the id of the dataset, the string of the content
    * of the dataset, and the kind of the dataset.
    *
    * For this checkpoint the dataset kind will be sections,
    * and the rooms kind is invalid. A valid id is an id string
    * is defined in the EBNF. Additionally, an id that is only
    * whitespace is invalid.
    * Any invalid inputs should be rejected.
    * */
	public addDataset(id: string, content: string, kind: InsightDatasetKind): Promise<string[]> {

		// check param @id for validity
		if (!this.checkId(id)) {
			return Promise.reject(new InsightError("Error in addDataset: id is invalid"));
		}

		// check param @content for validity
		if (!this.checkContent(content)) {
			return Promise.reject(new InsightError("Error in addDataset: content is invalid"));
		}

		// check param @kind for validity
		if (!this.checkKind(kind)) {
			return Promise.reject(new InsightError("Error in addDataset: kind is invalid"));
		}

		// check if @id already exists in dataset
		let keys = Array.from(this.dataset.keys());
		if (keys.includes(id)) {
			return Promise.reject(new InsightError("Error in addDataset: " + id + " already exists among datasets"));
		}

		// After receiving the dataset, it should be processed into a data structure of
		//      * your design. The processed data structure should be persisted to disk; your
		//      * system should be able to load this persisted value into memory for answering
		//      * queries.

		let filesExtractedPromise: Array<Promise<string>>;
		let extractedData: JSON[] = [];

		// this is currently buggy:

		// // Create new zip and call helper function to process data from zip file
		// let processDataPromise: Promise<string[]> = new Promise((resolve, reject) => {
		// 	let zippedFile: JSZip = new JSZip();
		// 	zippedFile.loadAsync(content, {base64: true}).then(() => {
		// 		zippedFile.forEach((filesToExtract) => {
		// 			if (zippedFile.file(filesToExtract) != null) {
		// 				// filesExtractedPromise.push(filesToExtract.file(filesToExtract).async("text"));
		// 				filesExtractedPromise.push(zippedFile.file(filesToExtract).async("text")
		// 					.then((rawDataFromFile) => {
		// 						let dataFromFile = JSON.parse(rawDataFromFile);
		// 						// add verification for if a section is valid here?
		// 						extractedData.push(dataFromFile);
		// 					}).catch((err) => {
		// 						// return new InsightError("Error in parsing from raw data");
		// 					}));
		// 			}
		// 		});
		// 	})
		// 		.catch((err) => {
		// 			return new InsightError("");
		// 		});
		//
		// 	// Data is now parsed, can now push to internal model
		// 	this.processData(id, content, kind)
		// 		.then((data) => {
		// 			resolve(data);
		// 		})
		// 		.catch((err: InsightError) => {
		// 			reject(new InsightError("Data could not be processed"));
		// 		});
		// });

		// delete below return statement eventually
		return Promise.reject("Not implemented.");
	}

	/*
    * removeDataset(id: string): Promise<string> removes a
    * dataset from the internal model, given the id. A valid id
    * is as idstring is defined in the EBNF. As above, an id
    * that is only whitespace is invalid. In addition, removing
    * a nonexistent id should be rejected.
    */
	public removeDataset(id: string): Promise<string> {

		return new Promise<string> ((resolve, reject) => {
			// check param @id for validity (EBNF standards) and whitespace verification
			if (!this.checkId(id)) {
				reject(new InsightError("Error in addDataset: id is invalid"));
			}
			// check for nonexistent id
			if (!this.dataset.has(id)) {
				reject("This id does not exist in our dataset");
			}
			this.dataset.delete(id);
			resolve(id);
		});
	}

	/*
    performQuery(query: unknown): Promise<InsightResult[]>
    performs a query on the dataset. It first should parse and
    validate the input query, then perform semantic checks on
    the query and evaluate the query only if it is valid. A result
    should have a max size of 5,000. If this limit is exceeded
    then it should reject with a ResultTooLargeError.
    */
	public performQuery(query: unknown): Promise<InsightResult[]> {

		return new Promise((resolve, reject) => {

			const id = "";

			// validate query
			let validator = new ValidateQueryHelper();
			validator.validateQuery(query, id);

			if (!validator.getValid()) {
				return reject(new InsightError());
			}
		});
	}

	/*
    listDatasets(): Promise<InsightDataset[]> returns an array of
    currently added datasets. Each element of the array should
    describe a dataset following the InsightDataset interface
    which contains the dataset id, kind, and number of rows.
    */
	public listDatasets(): Promise<InsightDataset[]> {
		return Promise.reject("Not implemented.");
	}
}
