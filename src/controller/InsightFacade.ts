import {
	IInsightFacade,
	InsightDataset,
	InsightDatasetKind,
	InsightError,
	InsightResult,
	NotFoundError,
	ResultTooLargeError,
} from "./IInsightFacade";
import PerformQueryHelper from "./query/PerformQueryHelper";
import ValidateQueryHelper from "./query/ValidateQueryHelper";
import PerformQueryOptionsHelper from "./query/PerformQueryOptionsHelper";
import {CourseDataset} from "./courses/CourseDataset";
import RoomsHelper from "./rooms/RoomsHelper";
import {IdValidator} from "./read-and-parse/IdValidator";
import {AddDatasetHelpers} from "./read-and-parse/AddDatasetHelpers";
import JSZip from "jszip";
import * as fs from "fs";
import path from "path";
import Rooms from "./rooms/Rooms";

/**
 * This is the main programmatic entry point for the project.
 * Method documentation is in IInsightFacade
 *
 */
export default class InsightFacade implements IInsightFacade {
	public internalModel: Map<string, CourseDataset>;
	public fileDirectory: string;
	public idChecker: IdValidator;
	public addDatasetHelpers: AddDatasetHelpers;

	constructor() {
		this.fileDirectory = __dirname + "/../../data";
		this.internalModel = new Map();
		this.idChecker = new IdValidator();
		this.addDatasetHelpers = new AddDatasetHelpers();
	}

	// HELPER: Called by addDataset to handle parsing and adding dataset to model
	private addDatasetToModel(id: string, content: string, kind: InsightDatasetKind): Promise<string[]> {
		let zipped: JSZip = new JSZip();
		return new Promise<string[]>((resolve, reject) => {
			let dataToProcess: Array<Promise<string>> = [];
			zipped
				.loadAsync(content, {base64: true})
				.then((loadedZipFile) => {
					return this.addDatasetHelpers.loadAsyncHelper(loadedZipFile, dataToProcess);
				})
				.then((value: Array<Promise<string>> | InsightError) => {
					if (value instanceof InsightError) {
						return value;
					}
					if (value.length === 0) {
						reject(new InsightError("InsightError: empty directory"));
					}
					Promise.all(value)
						.then((arrayOfPromiseAllResults) => {
							return this.addDatasetHelpers.parseJSON(arrayOfPromiseAllResults);
						})
						.then((convertedSections) => {
							resolve(
								this.addDatasetHelpers.setDataToModelAndDisk(
									id,
									convertedSections,
									kind,
									content,
									this.internalModel
								)
							);
						});
				})
				.catch((err) => {
					reject(new InsightError("InsightError: failed to parse" + err));
				});
		});
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
		if (!this.idChecker.checkId(id)) {
			return Promise.reject(new InsightError("InsightError: id is invalid"));
		}

		if (!this.idChecker.checkContent(content)) {
			return Promise.reject(new InsightError("InsightError: content is invalid"));
		}

		// // check param @kind for validity
		// if (!this.idChecker.checkKind(kind)) {
		// 	return Promise.reject(new InsightError("Error in addDataset: kind is invalid"));
		// }

		let keys = Array.from(this.internalModel.keys());
		if (keys.includes(id)) {
			return Promise.reject(new InsightError("InsightError: " + id + " already exists among datasets"));
		}

		if (this.idChecker.checkIfExistsOnDisk(id)) {
			return Promise.reject(new InsightError("InsightError: dataset file already exists on disk"));
		}

		if (kind === InsightDatasetKind.Sections) {
			// Assuming all inputs are valid, we can push this to the internal model.
			return Promise.resolve(this.addDatasetToModel(id, content, kind));
		} else {
			return Promise.resolve(Rooms.addDatasetRoom(id, content, kind));
		}
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
			if (!this.idChecker.checkId(id)) {
				reject(new InsightError("InsightError: id is invalid"));
			}
			if (!this.internalModel.has(id)) {
				reject(new NotFoundError("InsightError: id does have associated dataset"));
			}
			let fileToDelete = path.join(this.fileDirectory, "/" + id + ".zip");
			fs.unlink(fileToDelete, (err) => {
				if (err) {
					return new InsightError("InsightError: dataset file could not be deleted");
				}
			});
			try {
				this.internalModel.delete(id);
				return resolve(id);
			} catch {
				return new InsightError("InsightError: could not delete dataset");
			}
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
			let queryValidator = new ValidateQueryHelper();
			let queryEngine = new PerformQueryHelper();
			let optionsFilter = new PerformQueryOptionsHelper();
			let id = "";

			try {
				id = queryValidator.extractDatasetID(query); // the id of the dataset you are querying upon is determined by the first key of OPTIONS
			} catch (err) {
				return reject(new InsightError(`InsightError: failing to extract id because ${err}`));
			}

			let keys = Array.from(this.internalModel.keys());
			if (!keys.includes(id)) {
				return reject(new InsightError(`InsightError: referenced dataset with id: ${id} not yet added yet`));
			}

			queryValidator.validateQuery(query, id);
			if (!queryValidator.getValid()) {
				return reject(new InsightError("InsightError: query is not valid"));
			}

			let result: any[];
			try {
				result = queryEngine.processQuery(query, this.internalModel.get(id));
				result = optionsFilter.processOptions(query, result);
			} catch (err) {
				return reject(new InsightError("InsightError: unexpected behavior while performing query: " + err));
			}

			if (result.length > 5000) {
				return reject(new ResultTooLargeError("ResultTooLargeError: query returned more than 5000 results"));
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
					reject(new InsightError("InsightError: invalid id or invalid data found"));
				}
				let currInsightDataset: InsightDataset = {
					id: id,
					kind: InsightDatasetKind.Sections,
					numRows: data.sectionsData.length,
				};
				listDatasetsFromLocal.push(currInsightDataset);
			});
			resolve(listDatasetsFromLocal);
		});
	}
}
