import {
	IInsightFacade,
	InsightDataset,
	InsightDatasetKind,
	InsightError,
	InsightResult,
	NotFoundError,
	ResultTooLargeError,
} from "./IInsightFacade";
import * as fs from "fs";
import path from "path";
import RoomsHelper from "./dataset-rooms/RoomsHelper";
import {IdValidator} from "./read-and-parse/IdValidator";
import {CoursesHelper} from "./dataset-courses/CoursesHelper";
import PerformQueryHelper from "./query/engine/PerformQuery";
import ValidateQueryHelper from "./query/validation/ValidateQuery";
import PerformQueryOptionsHelper from "./query/engine/engine-helpers/PerformQueryOptionsHelper";
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

	public addDataset(id: string, content: string, kind: InsightDatasetKind): Promise<string[]> {
		if (!this.idChecker.checkId(id)) {
			return Promise.reject(new InsightError("InsightError: " + id + " is invalid"));
		}

		if (!this.idChecker.checkContent(content)) {
			return Promise.reject(new InsightError("InsightError: content is invalid"));
		}

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
			let AddRoomsHelper = new RoomsHelper();
			return Promise.resolve(AddRoomsHelper.addRoomsDatasetToModel(id, content, kind, this.internalModel));
		}
	}

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

	public performQuery(query: unknown): Promise<InsightResult[]> {
		return new Promise((resolve, reject) => {
			let queryValidator = new ValidateQueryHelper();
			let queryEngine    = new PerformQueryHelper();
			let transformer    = new TransformationsHelper();
			let optionsFilter  = new PerformQueryOptionsHelper();
			let id = "";

			try {
				id = queryValidator.extractDatasetID(query);
			} catch (err) {
				return reject(new InsightError(`InsightError: failing to extract id because ${err}`));
			}

			let keys = Array.from(this.internalModel.keys());
			if (!keys.includes(id)) {
				return reject(new InsightError(`InsightError: referenced dataset with id: ${id} not yet added yet`));
			}

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
				result = queryEngine.processQuery(query, dataset, queryValidator.getTransformedStatus());
				if (result.length > 5000) {
					return reject(new ResultTooLargeError("ResultTooLargeError: query returns more than 5000 results"));
				}

				if (queryValidator.getTransformedStatus()) {
					result = transformer.transform(query, result);
				}

				result = optionsFilter.processOptions(query, result, queryValidator.getTransformedStatus());

			} catch (err) {
				return reject(new InsightError("InsightError: unexpected behavior while performing query: " + err));
			}
			return resolve(result);
		});
	}

	public listDatasets(): Promise<InsightDataset[]> {
		let listDatasetsFromLocal: InsightDataset[] = [];
		return new Promise<InsightDataset[]>((resolve, reject) => {
			this.internalModel.forEach((dataset, id) => {
				if (!id || !dataset) {
					reject(new InsightError("InsightError: invalid id or invalid data found"));
				}

				// let sectionsDataRows: number;
				// let roomsDataRows: number;

				// if (data.sectionsData?.length === undefined) {
				// 	sectionsDataRows = 0;
				// } else {
				// 	sectionsDataRows = data.sectionsData?.length;
				// }

				// if (data.roomsData?.length === undefined) {
				// 	roomsDataRows = 0;
				// } else {
				// 	roomsDataRows = data.roomsData?.length;
				// }

				let currInsightDataset: InsightDataset = {
					id: id,
					kind: dataset.kind,
					numRows: dataset.data.length // BUGNOTE
				};

				listDatasetsFromLocal.push(currInsightDataset);

			});
			resolve(listDatasetsFromLocal);
		});
	}
}
