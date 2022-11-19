import {
	IInsightFacade,
	InsightDataset,
	InsightDatasetKind,
	InsightError,
	InsightResult,
	NotFoundError,
	ResultTooLargeError,
} from "./IInsightFacade";
import PerformQueryHelper from "./query/engine/PerformQuery";
import ValidateQueryHelper from "./query/validation/ValidateQuery";
import PerformQueryOptionsHelper from "./query/engine/engine-helpers/PerformQueryOptionsHelper";
import RoomsHelper from "./dataset-rooms/RoomsHelper";
import {IdValidator} from "./read-and-parse/IdValidator";
import {CoursesHelper} from "./dataset-courses/CoursesHelper";
import * as fs from "fs";
import path from "path";
import TransformationsHelper from "./query/engine/engine-helpers/TransformationsHelper";

/**
 * This is the main programmatic entry point for the project.
 * Method documentation is in IInsightFacade
 *
 */
export default class InsightFacade implements IInsightFacade {
	public internalModel: Map<string, any>;
	public fileDirectory: string;
	public idChecker: IdValidator;

	constructor() {
		this.fileDirectory = __dirname + "/../../data";
		this.internalModel = new Map();
		this.idChecker = new IdValidator();
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
			let AddCoursesHelper = new CoursesHelper();
			return Promise.resolve(AddCoursesHelper.addCoursesDatasetToModel(id, content, kind, this.internalModel));
		} else {
			let AddRoomsHelper = new RoomsHelper(id);
			// console.log("Rooms Init");
			return Promise.resolve(AddRoomsHelper.addRoomsDatasetToModel(id, content, kind, this.internalModel));
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
			let transformer = new TransformationsHelper();
			let optionsFilter = new PerformQueryOptionsHelper();
			let id = "";

			try {
				id = queryValidator.extractDatasetID(query); // the id of the dataset you are querying upon is determined by the first key of OPTIONS
			} catch (err) {
				return reject(new InsightError(`InsightError: failing to extract id because ${err}`));
			}
			let keys = Array.from(this.internalModel.keys());
			// console.log(keys);
			// console.log(id);
			if (!keys.includes(id)) {
				return reject(new InsightError(`InsightError: referenced dataset with id: ${id} not yet added yet`));
			}
			// retrieve the dataset and it's kind
			let dataset = this.internalModel.get(id);
			let kind = dataset.kind;
			try {
				queryValidator.validateQuery(query, id, kind);
				if (!queryValidator.getValidStatus()) {
					return reject(new InsightError("InsightError: query is not valid"));
				}
			} catch (err) {
				return reject(new InsightError(`InsightError: query is not valid because of ${err}`));
			}
			let result: any[];
			try {
				// console.log("154");
				// console.log(dataset);
				result = queryEngine.processQuery(query, dataset, queryValidator.getTransformedStatus());
				if (result.length > 5000) {
					return reject(new ResultTooLargeError("ResultTooLargeError: query returns more than 5000 results"));
				}
				if (queryValidator.getTransformedStatus()) {
					result = transformer.transform(query, result);
				}
				result = optionsFilter.processOptions(query, result, queryValidator.getTransformedStatus());
				console.log(result);
			} catch (err) {
				return reject(new InsightError("InsightError: unexpected behavior while performing query: " + err));
			}
			return resolve(result);
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
				// console.log("data sections", data.sectionsData?.length);
				// console.log("rooms sections", data.roomsData?.length);

				let sectionsDataRows: number;
				let roomsDataRows: number;

				if (data.sectionsData?.length === undefined) {
					sectionsDataRows = 0;
				} else {
					sectionsDataRows = data.sectionsData?.length;
				}
				if (data.roomsData?.length === undefined) {
					roomsDataRows = 0;
				} else {
					roomsDataRows = data.roomsData?.length;
				}
				// console.log("roomsDataRows", roomsDataRows);

				let currInsightDataset: InsightDataset = {
					id: id,
					kind: data.kind,
					numRows: sectionsDataRows + roomsDataRows,
				};
				listDatasetsFromLocal.push(currInsightDataset);
			});
			resolve(listDatasetsFromLocal);
		});
	}
}
