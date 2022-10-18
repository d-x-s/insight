import {
	IInsightFacade,
	InsightDataset,
	InsightDatasetKind,
	InsightError,
	InsightResult,
	ResultTooLargeError,
} from "./IInsightFacade";
import Utility from "../Utility";
import ValidateQueryHelper from "./ValidateQueryHelper";
import JSZip from "jszip";
import {Dataset} from "./Dataset";
import {SectionsData} from "./SectionsData";
import PerformQueryHelper from "./PerformQueryHelper";
import PerformQueryOptionsHelper from "./PerformQueryOptionsHelper";

/**
 * This is the main programmatic entry point for the project.
 * Method documentation is in IInsightFacade
 *
 */
export default class InsightFacade implements IInsightFacade {
	// locally instantiated model containing Datasets
	public internalModel: Map<string, Dataset>;

	constructor() {
		Utility.log("initialize InsightFacade", "trace");
		this.internalModel = new Map();
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

	// HELPER: Called by addDataset to handle parsing and adding dataset to model
	private addDatasetToModel(id: string, content: string, kind: InsightDatasetKind): Promise<string[]> {
		let zipped: JSZip = new JSZip();
		return new Promise<string[]>((resolve, reject) => {
			let dataToProcess: Array<Promise<string>> = [];
			zipped.loadAsync(content, {base64: true}).then((file) => {
				let fileFolder = file.folder("courses");
				if (fileFolder == null || fileFolder === undefined) {
					return new InsightError("ERROR: null file folder, could not load");
				}
				fileFolder.forEach((course) => {
					if (fileFolder == null || fileFolder === undefined) {
						return new InsightError("ERROR: null file folder, could not load");
					}
					let currCourse = fileFolder.file(course);
					if (currCourse == null) {
						return new InsightError("ERROR: current course being added is null");
					}
					dataToProcess.push(currCourse.async("text"));
				});
				return dataToProcess;
			}).then((value: Array<Promise<string>> | InsightError) => {
				if (value instanceof InsightError) {
					return new InsightError("ERROR: InsightError caught ");
				}
				Promise.all(value).then((results) => {
					let pushDataset: any = [];
					results.forEach((v) => {
						// let data = JSON.parse(v);
						let dataFromJSON = JSON.parse(v)["result"];
								// console.log(dataFromJSON);
						dataFromJSON.forEach((x: any) => {
									// console.log(x);
							let y = this.convertToSectionFormat(x);
							pushDataset.push(y);
						});
					});
		     			// console.log(pushDataset);
							// console.log(pushDataset);
					return pushDataset;
				}).then((pushDataset) => {
							// console.log(pushDataset);
					let newDataset: Dataset = {
						id: id,
						sectionData: pushDataset,
						kind: kind,
					};
					this.internalModel.set(id, newDataset);
					let updateKeysAfterAdd: string[] = Array.from(this.internalModel.keys());
					resolve(updateKeysAfterAdd);
				});
			})
				.catch((err) => {
					reject(new InsightError("Failed to parse" + err));
				});
		});
	}

	private convertToSectionFormat(x: any) {
		let newSection = {} as SectionsData;
		newSection.audit = x["Audit"];
		newSection.avg = x["Avg"];
		newSection.dept = x["Subject"];
		newSection.fail = x["Fail"];
		newSection.id = x["Course"];
		newSection.instructor = x["Professor"];
		newSection.pass = x["Pass"];
		newSection.title = x["Title"];
		newSection.uuid = String(x["id"]);
		if (x["Section"] === "overall") {
			newSection.year = 1900;
		} else {
			newSection.year = Number(x["Year"]);
		}
		return newSection;
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
		let keys = Array.from(this.internalModel.keys());
		if (keys.includes(id)) {
			return Promise.reject(new InsightError("Error in addDataset: " + id + " already exists among datasets"));
		}

		// temporary
		// return Promise.reject(new InsightError("Not implemented"));
		// Assuming all inputs are valid, we can push this to the internal model.
		return Promise.resolve(this.addDatasetToModel(id, content, kind));
	}

	/*
	 * removeDataset(id: string): Promise<string> removes a
	 * dataset from the internal model, given the id. A valid id
	 * is as idstring is defined in the EBNF. As above, an id
	 * that is only whitespace is invalid. In addition, removing
	 * a nonexistent id should be rejected.
	 */
	public removeDataset(id: string): Promise<string> {
		return new Promise<string>((resolve, reject) => {
			// check param @id for validity (EBNF standards) and whitespace verification
			if (!this.checkId(id)) {
				reject(new InsightError("Error in addDataset: id is invalid"));
			}
			// check for nonexistent id
			if (!this.internalModel.has(id)) {
				reject(new InsightError("This id does not exist in our dataset"));
			}
			this.internalModel.delete(id);
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
			let validator = new ValidateQueryHelper();
			let performer = new PerformQueryHelper();
			let options = new PerformQueryOptionsHelper();

			// the id of the dataset you are querying upon is determined by the first key of OPTIONS
			let id = validator.extractDatasetID(query);
			if (id === "") {
				return reject(new InsightError("performQuery::Invalid query::L221"));
			}
			console.log("The id is:" + id);

			let keys = Array.from(this.internalModel.keys());
			if (!keys.includes(id)) {
				return reject(new InsightError(`performQuery::Referenced dataset ${id} not yet added yet`));
			}

			validator.validateQuery(query, id);
			if (!validator.getValid()) {
				return reject(new InsightError("performQuery::Invalid query::L231"));
			}

			let result: any[];
			try {
				result = performer.processQuery(query, this.internalModel.get(id));
				result = options.processOptions(query, result);
			} catch {
				return reject(new InsightError("performQuery::Error while querying"));
			}

			if (result.length > 5000) {
				return reject(new ResultTooLargeError());
			} else {
				return resolve(result);
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
		let listDatasetsFromLocal: InsightDataset[] = [];
		return new Promise<InsightDataset[]>((resolve, reject) => {
			this.internalModel.forEach((data, id) => {
				if (!id || !data) {
					reject(new InsightError("invalid id or data in set"));
				}
				console.log(data.sectionData.length);
				let currInsightDataset: InsightDataset = {
					id: id,
					kind: InsightDatasetKind.Sections,
					numRows: data.sectionData.length
				};
				listDatasetsFromLocal.push(currInsightDataset);
			});
			resolve(listDatasetsFromLocal);
		});
	}
}


