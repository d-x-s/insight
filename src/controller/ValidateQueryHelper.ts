import Utility from "../Utility";
import {InsightError} from "./IInsightFacade";

export default class ValidateQueryHelper {

	// TODO: keys will be extended in future checkpoints
	protected QKEYS = ["OPTIONS", "WHERE"];
	protected MKEYS = ["avg", "pass", "fail", "audit", "year"];
	protected SKEYS = ["dept", "id", "instructor", "title", "uuid"];

	constructor() {
		Utility.log("initializing ValidateQueryHelper", "trace");
	}

	// @TODO: see piazza@502, is this the right way to access? treat it like a JSON?
	// https://piazza.com/class/l7qenrnq7oy512/post/502
	// this query is not a JSON, but rather a Javascript Object
	public isQueryValid(query: any, id: string): boolean {
		try {
			let result: boolean = true;

			// grab a reference to JSON objects "WHERE" and "OPTIONS"
			const queryKeys = Object.keys(query);

			// 0) CHECK FOR VALID ARGUMENTS
			if (query === null || query === "undefined" || !(query instanceof Object)) {
				return false;
			}

			// 1) VALIDATE TOP LEVEL ACCESSORS
			// expect exactly 2 members (WHERE and OPTIONS)
			if (queryKeys.length !== 2) {
				Utility.log("not exactly 2 top level members", "error");
				return false;
			}
			// expect correct naming
			for (let k of queryKeys) {
				if(!this.QKEYS.includes(k)) {
					Utility.log("typos or incorrect naming in WHERE and OPTIONS", "error");
					return false;
				}
			}

			// 2) VALIDATE "WHERE" CLAUSE (FILTERING)
			result = this.isWhereValid(query, id);

			// 3) VALIDATE "OPTIONS" CLAUSE (OUTPUT)
			result = this.isOptionsValid(query, id);

			return result;

		} catch (error) {
			Utility.log("caught in isQueryValid", "error");
			return false;
		}
	}

	private isWhereValid(where: any, id: string): boolean {
		try {
			if (where === "undefined" || !(where instanceof Object)) {
				return false;
			}

			const whereKeys = Object.keys(where);

			// empty WHERE is just the entire dataset (no filtering done)
			if (whereKeys.length === 0) {
				return true;
			}


		} catch (error) {
			Utility.log("caught in isWhereValid", "error");
			return false;
		}
	}

	private isOptionsValid(options: any, id: string): boolean {
		return true;
	}
}
