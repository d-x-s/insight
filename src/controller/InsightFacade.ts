import {IInsightFacade, InsightDataset, InsightDatasetKind, InsightError, InsightResult} from "./IInsightFacade";
import {IdValidator} from "./IdValidator";
import JSZip from "jszip";

/**
 * This is the main programmatic entry point for the project.
 * Method documentation is in IInsightFacade
 *
 */
export default class InsightFacade implements IInsightFacade {
	constructor() {
		console.log("InsightFacadeImpl::init()");
	}

	/*
    * addDataset(id: string, content: string, kind: InsightDatasetKind):
    * Promise<string[]> adds a dataset to the internal model,
    * providing the id of the dataset, the string of the content
    * of the dataset, and the kind of the dataset.
    *
    * For this checkpoint the dataset kind will be sections,
    * and the rooms kind is invalid. A valid id is as idstring
    * is defined in the EBNF. Additionally, an id that is only
    * whitespace is invalid.
    * Any invalid inputs should be rejected.
    * */
	public addDataset(id: string, content: string, kind: InsightDatasetKind): Promise<string[]> {
		// parsing dataset
		let zipped = new JSZip();


		// validate id based on EBNF definitions
		// IdValidator.checkId(id);
		//
		// if (kind == InsightDatasetKind.Rooms) {
		// 	throw InsightError;
		// }

		// data modelling
		let datasetToAdd: string[];

		datasetToAdd = [id, content, kind];

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
		return Promise.reject("Not implemented.");
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

		// validateQueryStructure();
		//
		// handleWhere(): {
		// 	applyComparitor();
		//
		// }
		//
		// handleOptions(): {
		//
		// }


		return Promise.reject("Not implemented.");
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
