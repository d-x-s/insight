import {InsightDatasetKind} from "../../IInsightFacade";
import ValidateTransformationsHelper from "./validation-helpers/ValidateTransformationsHelper";
import ValidateWhereHelper from "./validation-helpers/ValidateWhereHelper";

export default class ValidateQueryHelper {
	protected isValid: any;
	protected isValidTransformation: any;
	protected isTransformed: boolean;
	protected kind: InsightDatasetKind;
	protected validateTransformationsHelper: ValidateTransformationsHelper;
	protected QKEYS = ["OPTIONS", "WHERE", "TRANSFORMATIONS"];
	protected OKEYS = ["ORDER", "COLUMNS"];
	protected COURSES_MFIELDS = ["avg", "pass", "fail", "audit", "year"];
	protected COURSES_SFIELDS = ["dept", "id", "instructor", "title", "uuid"];
	protected ROOMS_MFIELDS = ["lat", "lon", "seats"];
	protected ROOMS_SFIELDS = ["fullname", "shortname", "number", "name"];

	constructor() {
		this.isValid = true;
		this.isValidTransformation = true;
		this.isTransformed = false;
		this.kind = InsightDatasetKind.Sections; // initialize to sections by default
		this.validateTransformationsHelper = new ValidateTransformationsHelper();
	}

	public getValidStatus() {
		return this.isValid;
	}

	public getTransformedStatus() {
		return this.isTransformed;
	}

	/**
	 * extracts an id from a query object
	 * @param query  A query object
	 * @return string  The id of the dataset associated with this query, "" if not erroneous or not found
	 */
	public extractDatasetID(query: any): string {
		if (query === null || query === "undefined" || !(query instanceof Object)) {
			throw new Error("query is null, undefined, or not an object");
		}

		let keys = Object.keys(query);
		if (!keys.includes("OPTIONS")) {
			throw new Error("OPTIONS clause is missing from query");
		}

		let optionsKeys = Object.keys(query["OPTIONS"]);
		if (!optionsKeys.includes("COLUMNS")) {
			throw new Error("COLUMNS clause is missing from query");
		}

		let columnsValueArray = query["OPTIONS"]["COLUMNS"];
		if (
			!Array.isArray(columnsValueArray) ||
			columnsValueArray.length === 0 ||
			typeof columnsValueArray === "undefined" ||
			typeof columnsValueArray !== "object"
		) {
			throw new Error("the value of COLUMNS is not an array, is empty, undefined, or not an object");
		}

		// look for the first valid id in columns
		for (const columnKey of columnsValueArray) {
			// console.log("look at column key");
			if (columnKey.includes("_")) {
				// console.log(columnKey);
				return columnKey.split("_")[0];
			}
		}
		throw new Error("could not find a valid key in COLUMNS");
	}

	public validateQuery(query: any, id: string, kind: InsightDatasetKind) {
		this.kind = kind;
		const queryKeys = Object.keys(query);

		if (query === null || query === "undefined" || !(query instanceof Object)) {
			this.isValid = false;
			return;
		}

		if (queryKeys.length > 3) {
			this.isValid = false;
			return;
		}

		for (let k of queryKeys) {
			if (!this.QKEYS.includes(k)) {
				this.isValid = false;
				return;
			}

			if (k === "TRANSFORMATIONS") {
				this.isTransformed = true;
			}
		}
		console.log("Before validating where");
		console.log(this.isValid);
		let validateWhereHelper = new ValidateWhereHelper(kind);
		validateWhereHelper.validateFilter(query["WHERE"], id);
		this.isValid = validateWhereHelper.getValidStatus();
		console.log("After validating where");
		console.log(this.isValid);
		// if (!this.validateWhereHelper.getValidStatus) {
		// 	return;
		// }
		// TODO: TECHINCAL DEBT
		// validateOptions should also be moved into its own class to respect Single Responsibility Principle
		// unfortunately right now there is tight coupling between validateOptions and transformations, so I need to separate it out ASAP
		this.validateOptions(query["OPTIONS"], query, id);

		// TODO: TECHNICAL DEBT
		// previously, execution would flow such that Transformations would ALWAYS be checked
		// due to the design of ValidateTransformationsHelper, it will sometimes return true,
		// which resulted in a bug this.isValid would be reset to true
		// therefore I have added an additional variable "isValidTransformation" to prevent this
		// this is necessary because ValidateQueryHelper does some checking related to TRANSFORMATIONS,
		// such as checking that COLUMNS key matches to GROUP/APPLY keys if TRANSFORMATIONS is present
		// in retrospect, this violates SRP, and all Transformatiosn related checking in this class
		// needs to be moved to ValidateTransformationsHelper
		if (this.isTransformed && this.isValidTransformation) {
			this.validateTransformationsHelper.validateTransformations(
				query["TRANSFORMATIONS"],
				query["OPTIONS"]["COLUMNS"],
				id,
				kind
			);
			this.isValid = this.validateTransformationsHelper.getValidStatus();
		}
	}

	private validateID(idToVerify: any, id: any) {
		if (idToVerify.includes("_") || idToVerify.trim().length === 0 || idToVerify !== id) {
			this.isValid = false;
			return;
		}
	}

	private validateOptions(options: any, query: any, id: string) {
		if (typeof options === "undefined" || typeof options !== "object") {
			this.isValid = false;
			return;
		}
		const optionsKeys = Object.keys(options);
		optionsKeys.forEach((element: any) => {
			if (!this.OKEYS.includes(element)) {
				this.isValid = false;
				return;
			}
		});

		if (optionsKeys.length === 1) {
			if (optionsKeys[0] !== "COLUMNS") {
				this.isValid = false;
				return;
			}
			this.validateColumns(options["COLUMNS"], query, id);
		} else {
			this.validateColumns(options["COLUMNS"], query, id);
			this.validateOrder(options["ORDER"], options["COLUMNS"]);
		}
	}

	private validateColumns(columnsArray: any, query: any, id: string) {
		if (
			!Array.isArray(columnsArray) ||
			columnsArray.length === 0 ||
			typeof columnsArray === "undefined" ||
			typeof columnsArray !== "object"
		) {
			this.isValid = false;
			return;
		}

		let applyTokens: any[] = [];
		if (this.isTransformed) {
			let applyArray = query["TRANSFORMATIONS"]["APPLY"];
			for (let applyRule of applyArray) {
				applyTokens.push(Object.keys(applyRule)[0]);
			}
		}

		columnsArray.forEach((element: any) => {
			if (this.isTransformed) {
				let groupsArray = query["TRANSFORMATIONS"]["GROUP"];
				if (!groupsArray.includes(element) && !applyTokens.includes(element)) {
					this.isValid = false;
					this.isValidTransformation = false;
					return;
				}
			}

			let key = element.split("_");
			this.validateID(key[0], id);
			if (this.kind === InsightDatasetKind.Sections) {
				if (!this.COURSES_MFIELDS.includes(key[1]) && !this.COURSES_SFIELDS.includes(key[1])) {
					this.isValid = false;
					return;
				}
			} else {
				if (!this.ROOMS_MFIELDS.includes(key[1]) && !this.ROOMS_SFIELDS.includes(key[1])) {
					this.isValid = false;
					return;
				}
			}
		});
	}

	private validateOrder(orderElement: any, columnsArray: any) {
		if (typeof orderElement === "string") {
			if (!columnsArray.includes(orderElement)) {
				this.isValid = false;
				return;
			}
		} else if (typeof orderElement === "object") {
			this.validateOrderObject(orderElement, columnsArray);
		} else {
			this.isValid = false;
			this.isValidTransformation = false;
			throw new Error("ORDER value is neither a string nor an object");
		}
	}

	private validateOrderObject(orderElement: any, columnsArray: any) {
		let orderObjectKeys = Object.keys(orderElement);
		if (orderObjectKeys.length !== 2) {
			this.isValid = false;
			this.isValidTransformation = false;
			return;
		}
		for (let objectKey of orderObjectKeys) {
			if (objectKey !== "dir" && objectKey !== "keys") {
				this.isValid = false;
				this.isValidTransformation = false;
				return;
			}
			if (objectKey === "dir") {
				if (typeof orderElement["dir"] !== "string") {
					this.isValid = false;
					this.isValidTransformation = false;
					return;
				}
				if (orderElement["dir"] !== "UP" && orderElement["dir"] !== "DOWN") {
					this.isValid = false;
					this.isValidTransformation = false;
					return;
				}
			}
			if (objectKey === "keys") {
				if (!Array.isArray(orderElement["keys"])) {
					this.isValid = false;
					this.isValidTransformation = false;
					return;
				}
				let orderKeysArray = orderElement["keys"];
				if (orderKeysArray.length === 0) {
					this.isValid = false;
					this.isValidTransformation = false;
					return;
				}
				for (let key of orderKeysArray) {
					if (!columnsArray.includes(key)) {
						this.isValid = false;
						this.isValidTransformation = false;
						return;
					}
				}
			}
		}
	}
}
