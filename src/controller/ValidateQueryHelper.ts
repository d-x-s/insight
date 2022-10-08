import Utility from "../Utility";
import {InsightError} from "./IInsightFacade";

export default class ValidateQueryHelper {

	// TODO: keys will be extended in future checkpoints
	protected valid: boolean;
	protected QKEYS = ["OPTIONS", "WHERE"];
	protected MKEYS = ["avg", "pass", "fail", "audit", "year"];
	protected SKEYS = ["dept", "id", "instructor", "title", "uuid"];

	constructor() {
		Utility.log("initializing ValidateQueryHelper", "trace");
		this.valid = true;
	}

	public getValid() {
		return this.valid;
	}

	// @TODO: see piazza@502, is this the right way to access? treat it like a JSON?
	// https://piazza.com/class/l7qenrnq7oy512/post/502
	// this query is not a JSON, but rather a Javascript Object
	public validateQuery(query: any, id: string) {
		try {

			// access query top level keys
			// grab a reference to JSON objects "WHERE" and "OPTIONS"
			const queryKeys = Object.keys(query);

			// 0) CHECK FOR VALID ARGUMENTS
			if (query === null || query === "undefined" || !(query instanceof Object)) {
				this.valid = false;
				return;
			}

			// 1) VALIDATE TOP LEVEL ACCESSORS
			// expect exactly 2 members (WHERE and OPTIONS)
			if (queryKeys.length !== 2) {
				Utility.log("isQueryValid: not exactly 2 top level members", "trace");
				this.valid = false;
				return;
			}
			// expect correct naming
			for (let k of queryKeys) {
				if(!this.QKEYS.includes(k)) {
					Utility.log("isQueryValid: typos or incorrect naming in WHERE and OPTIONS", "trace");
					this.valid = false;
					return;
				}
			}

			// 2) VALIDATE "WHERE" CLAUSE (FILTERING)
			this.validateFilter(query["WHERE"], id);

			// 3) VALIDATE "OPTIONS" CLAUSE (OUTPUT)
			this.isOptionsValid(query["OPTIONS"], id);

		} catch (error) {
			Utility.log("isQueryValid: error caught", "error");
		}
	}

	private validateFilter(query: any, id: string) {

		if (typeof query === "undefined" || !(query instanceof Object)) {
			this.valid = false;
			return;
		}

		const whereKeys = Object.keys(query);

		// empty WHERE is when you return the entire dataset (no filtering done)
		// so in this case it is trivially valid
		if (whereKeys.length === 0) {
			this.valid = true;
			return;
		}

		// access element one level deeper
		// WHERE should only have 1 key
		// there are 4 choices of top-level filter, and we pick 1
		// LOGICCOMPARISON | MCOMPARISON | SCOMPARISON | NEGATION
		let filterKey = whereKeys[0];

		switch (filterKey) {
			// LOGICCOMPARISON "Logic"
			case "AND":
			case "OR":
				this.validateLogicComparison(query[filterKey], id);
				break;

			// MCOMPARISON "Math Comparison"
			case "LT":
			case "GT":
			case "EQ":
				this.isValidMathComparison(query[filterKey], id);
				break;

			// SCOMPARISON "String Comparison"
			case "IS":
				this.isValidStringComparison(query[filterKey], id);
				break;

			// NEGATION "Negation"
			case "NOT":
				this.isValidNegation(query[filterKey], id);
				break;

			// an invalid filter has been encountered
			default:
				this.valid = false;
				break;
		}
	}

	private validateLogicComparison(query: any, id: string) {
		// note the square brackets, indicating an array
		// LOGIC ':[{' FILTER ('}, {' FILTER )* '}]'
		if(!Array.isArray(query)) {
			this.valid = false;
			return;
		}

		// need 1 or more elements in the array
		if(query.length === 0) {
			this.valid = false;
			return;
		}

		// query cannot be null
		if(query === null) {
			this.valid = false;
			return;
		}

		// query cannot be undefined
		if(typeof query === "undefined") {
			this.valid = false;
			return;
		}

		// query is an object
		if(typeof query !== "object") {
			this.valid = false;
			return;
		}

		// check each element in the LOGIC[] array
		for (let element of Object.values(query)) {
			this.validateFilter(element, id);
		}
	}

	private isValidMathComparison(query: any, id: string) {
		return;
	}

	private isValidStringComparison(query: any, id: string) {
		return;
	}

	private isValidNegation(query: any, id: string) {
		return;
	}

	private isOptionsValid(options: any, id: string) {
		return;
	}
}
