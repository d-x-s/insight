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
			let isValid: boolean = true;

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
			isValid = isValid && this.isFilterValid(query, id);

			// 3) VALIDATE "OPTIONS" CLAUSE (OUTPUT)
			isValid = isValid && this.isOptionsValid(query, id);

			return isValid;

		} catch (error) {
			Utility.log("caught in isQueryValid", "error");
			return false;
		}
	}

	private isFilterValid(where: any, id: string): boolean {
		try {
			if (where === "undefined" || !(where instanceof Object)) {
				return false;
			}

			const whereKeys = Object.keys(where);

			// empty WHERE is when you return the entire dataset (no filtering done)
			// so in this case it is trivially valid
			if (whereKeys.length === 0) {
				return true;
			}

			// WHERE should only have 1 key
			// there are 4 choices of top-level filter, and we pick 1
			// LOGICCOMPARISON | MCOMPARISON | SCOMPARISON | NEGATION
			let filterKey = whereKeys[0];

			switch (filterKey) {
				// LOGICCOMPARISON "Logic"
				case "AND":
				case "OR":
					return this.isValidLogicComparison();
				// MCOMPARISON "Math Comparison"
				case "LT":
				case "GT":
				case "EQ":
					return this.isValidMathComparison();
				// SCOMPARISON "String Comparison"
				case "IS":
					return this.isValidStringComparison();
				// NEGATION "Negation"
				case "NOT":
					return this.isValidNegation();
				default:
					return false;
			}

			return true;

		} catch (error) {
			Utility.log("caught in isWhereValid", "error");
			return false;
		}
	}

	private isOptionsValid(options: any, id: string): boolean {
		return true;
	}

	private isValidLogicComparison(): boolean {
		return true;
	}

	private isValidMathComparison(): boolean {
		return true;
	}

	private isValidStringComparison(): boolean {
		return true;
	}

	private isValidNegation(): boolean {
		return true;
	}
}
