import {IInsightFacade, InsightDataset, InsightDatasetKind, InsightError, InsightResult} from "./IInsightFacade";
import Utility from "../Utility";
import ValidateQueryHelper from "./ValidateQueryHelper";
import JSZip from "jszip";
import {Dataset} from "./Dataset";
import {SectionsData} from "./SectionsData";

/**
 * This is the main programmatic entry point for the project.
 * Method documentation is in IInsightFacade
 *
 */
export default class InsightFacade implements IInsightFacade {

	// instantiate dataset locally after
	// currently mapped as
	public dataset: Map<string, Dataset[]>;

	constructor() {
		Utility.log("initialize InsightFacade", "trace");
		this.dataset = new Map();
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

	// HELPER: check if kind is valid
	// Note: for C1, we are only accepting Sections and not Rooms
	public checkKind(kindToVerify: InsightDatasetKind): boolean {
		return kindToVerify === InsightDatasetKind.Sections;
	}

	// // HELPER: Called by addDataset to handle parsing and adding dataset to model
	// private addDatasetToModel(id: string, content: string, kind: InsightDatasetKind): Promise<string[]> {
	// 	let zipped: JSZip = new JSZip();
	//
	// 	return new Promise<string[]> ((resolve, reject) => {
	// 		let dataToProcess: Array<Promise<string>> = [];
	// 		zipped.loadAsync(content, {base64: true})
	// 			.then((file) => {
	// 				let fileFolder = file.folder("courses");
	// 				if (fileFolder == null) {
	// 					return new InsightError("ERROR: null file folder, could not load");
	// 				}
	// 				fileFolder.forEach((section) => {
	// 					if (fileFolder == null) {
	// 						return new InsightError("ERROR: null file folder, could not load");
	// 					}
	// 					let currSection = fileFolder.file(section);
	// 					if (currSection == null) {
	// 						return;
	// 					}
	// 					dataToProcess.push(currSection.async("text"));
	// 					return dataToProcess;
	// 				});
	// 			}).then(() => {
	// 				let pushDataset = this.pushToDataset(dataToProcess, content);
	// 			}).then((pushDataset) => {
	// 				// add a for loop here to push every element of pushDataset to
	// 				let newDataset: Dataset = {
	// 					id: id,
	// 					sectionData: pushDataset,
	// 					kind: kind
	// 				};
	// 				this.dataset.set(id, newDataset);
	// 				// what to return here
	// 				resolve(pushDataset);
	// 			}
	// 			)
	// 			.catch((err) => {
	// 				reject(new InsightError("Failed to parse" + err));
	// 			});
	// 	});
	// }
	//
	// // HELPER: Called by addDatasetToModel to prepare JSON for internal model
	// private pushToDataset(promiseDataToProcess: Array<Promise<string>>, content: string): Promise<SectionsData[]> {
	// 	let pushDataset: SectionsData[] = [];
	// 	try {
	// 		promiseDataToProcess.forEach((dataToProcess: string) => {
	// 			let data = JSON.parse(dataToProcess);
	//
	// 			// relook at how this works
	// 			let dataElement = data["result"];
	// 			data.forEach((dataElement) => {
	// 				pushDataset.push(dataElement);
	// 			});
	// 		});
	//
	// 		return Promise.resolve(pushDataset);
	// 	} catch {
	// 			return Promise.reject(new InsightError("ERROR: could not push to dataset");
	// 	};
	// }

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

		// temporary
		return Promise.reject(new InsightError("Not implemented"));
		// Assuming all inputs are valid, we can push this to the internal model.
		// return Promise.resolve(this.addDatasetToModel(id, content, kind));

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
		// validate the query
		try {
			const id = "";
			let validator = new ValidateQueryHelper();
			validator.isQueryValid(query, id);

			// if the dataset being queried is not available

			// if the dataset being queried

			return Promise.reject("Not implemented.");

		} catch {
			return Promise.reject(new InsightError("Invalid Query"));
		}
	}

	/*
    listDatasets(): Promise<InsightDataset[]> returns an array of
    currently added datasets. Each element of the array should
    describe a dataset following the InsightDataset interface
    which contains the dataset id, kind, and number of rows.
    */
	public listDatasets(): Promise<InsightDataset[]> {
		let listDatasetsFromLocal: InsightDataset[] = [];
		return new Promise<InsightDataset[]>((resolve, reject) => {
			this.dataset.forEach((data, id) => {
				if (!id || !data) {
					reject(new InsightError("invalid id or data in set"));
				}
				let currInsightDataset: InsightDataset = {
					id: id,
					kind: InsightDatasetKind.Sections,
					numRows: data.length
				};
				listDatasetsFromLocal.push(currInsightDataset);
			});
			resolve(listDatasetsFromLocal);
		});
	}

}
