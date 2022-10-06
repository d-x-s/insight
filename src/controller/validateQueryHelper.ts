import Utility from "../Utility";

export default class ValidateQueryHelper {

	constructor() {
		Utility.log("initializing validateQueryHelper", "trace");
	}

	// @TODO: see piazza@502, is this the right way to access? treat it like a JSON?
	// https://piazza.com/class/l7qenrnq7oy512/post/502
	// this query is not a JSON, but rather a Javascript Object
	public static isValidObject(query: any): boolean {
		const keys = Object.keys(query);
		return true;
	}

	public static isValidQuery(): boolean {
		return true;
	}

	public static isValidFilter(): boolean {
		return true;
	}

	public static isValidKey(): boolean {
		return true;
	}

	public static isValidAnyKey(): boolean {
		return true;
	}

	public static isValidApplyKey(): boolean {
		return true;
	}

	public static validateQuery(query: unknown) {
		return "";
	}
}
