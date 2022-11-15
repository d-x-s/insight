/* eslint-disable max-lines */
import e from "express";
import {InsightDatasetKind} from "../IInsightFacade";
import ValidateTransformationsHelper from "./ValidateTransformationsHelper";

export default class ValidateQueryHelper {
	protected isValid: boolean;
	protected isTransformed: boolean;
	protected kind: InsightDatasetKind;
	protected QKEYS = ["OPTIONS", "WHERE", "TRANSFORMATIONS"];
	protected OKEYS = ["ORDER", "COLUMNS"];
	protected COURSES_MFIELDS = ["avg", "pass", "fail", "audit", "year"];
	protected COURSES_SFIELDS = ["dept", "id", "instructor", "title", "uuid"];
	protected ROOMS_MFIELDS = ["lat", "lon", "seats"];
	protected ROOMS_SFIELDS = ["fullname", "shortname", "number", "name"];

	constructor() {
		this.isValid = true;
		this.isTransformed = false;
		this.kind = InsightDatasetKind.Sections; // initialize to sections by default
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
		// TODO: MIGHT NOT BE ABLE TO ALWAYS TAKE THE FIRST VALUE!
		// for (let i = 0; i < columnsValueArray.length; i++) {
		// 	if (columnsValueArray[i].includes("_")) {
		// 		return columnsValueArray[i].split("_")[0];
		// 	}
		// }

		// columnsValueArray.forEach((key) => {
		// 	if (key.includes("_")) {
		// 		return key.split("_")[0];
		// 	}
		// });

		// look for the first valid id in columns
		for (const columnKey of columnsValueArray) {
			if (columnKey.includes("_")) {
				return columnKey.split("_")[0];
			}
		}
		throw new Error("could not find a valid key in COLUMNS");
	}

	public validateQuery(query: any, id: string, kind: InsightDatasetKind) {
		this.kind = kind;
		const queryKeys = Object.keys(query);

		if (query === null || query === "undefined" || !(query instanceof Object)) {
			console.log("Fail at 1");
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
			// console.log(k);
			// console.log(this.isTransformed);
			if (k === "TRANSFORMATIONS") {
				this.isTransformed = true;
			}
			// console.log("this line is running?");
			// console.log(this.isTransformed);
		}

		this.validateFilter(query["WHERE"], id);
		console.log("Status of query after Filter is " + this.getValidStatus());
		this.validateOptions(query["OPTIONS"], query, id);
		console.log("Status of query after Options is " + this.getValidStatus());

		// if transformed we need to do some special handling as the structure of query is different
		console.log("This query is transformed? " + this.isTransformed);
		if (this.isTransformed) {
			let transformationsHelper = new ValidateTransformationsHelper();
			this.isValid = transformationsHelper.validateTransformations(
				query["TRANSFORMATIONS"],
				query["OPTIONS"]["COLUMNS"],
				id,
				kind
			);
			console.log("Status of query after Transformations is " + this.getValidStatus());
		}
	}

	private validateFilter(query: any, id: string) {
		if (typeof query === "undefined" || !(query instanceof Object)) {
			this.isValid = false;
			return;
		}
		const whereKeys = Object.keys(query);
		if (whereKeys.length === 0) {
			return; // empty where clause
		}

		if (whereKeys.length !== 1) {
			this.isValid = false;
			return;
		}

		let filterKey = whereKeys[0];
		switch (filterKey) {
			case "AND":
			case "OR":
				this.validateLogicComparison(query[filterKey], id);
				break;
			case "LT":
			case "GT":
			case "EQ":
				this.validateMathComparison(query[filterKey], id);
				break;
			case "IS":
				this.validateStringComparison(query[filterKey], id);
				break;
			case "NOT":
				this.validateNegation(query[filterKey], id);
				break;
			default:
				this.isValid = false;
				break;
		}
	}

	private validateLogicComparison(queryLogicArray: any, id: string) {
		if (
			!Array.isArray(queryLogicArray) ||
			queryLogicArray.length === 0 ||
			typeof queryLogicArray === "undefined" ||
			typeof queryLogicArray !== "object"
		) {
			this.isValid = false;
			return;
		}

		queryLogicArray.forEach((element: any) => {
			let logicComparisonKeys = Object.keys(element);
			if (logicComparisonKeys.length !== 1) {
				this.isValid = false;
				return;
			}
			this.validateFilter(element, id);
		});
	}

	private validateMathComparison(mathComparator: any, id: string) {
		if (typeof mathComparator === "undefined" || typeof mathComparator !== "object") {
			this.isValid = false;
			return;
		}
		const pairMComparatorKeys = Object.keys(mathComparator);
		if (pairMComparatorKeys.length !== 1) {
			this.isValid = false;
			return;
		}
		const keyMComparator = pairMComparatorKeys[0];
		const valueMComparator = mathComparator[keyMComparator];
		this.validateMKey(keyMComparator, id);
		this.validateMValue(valueMComparator);
	}

	private validateMKey(keyMComparator: string, id: string) {
		this.validateID(keyMComparator.split("_")[0], id);
		this.validateMField(keyMComparator.split("_")[1]);
	}

	private validateMValue(valueMComparator: any) {
		if (typeof valueMComparator !== "number") {
			this.isValid = false;
			return;
		}
	}

	private validateMField(keyMField: any) {
		if (this.kind === InsightDatasetKind.Sections) {
			if (!this.COURSES_MFIELDS.includes(keyMField)) {
				this.isValid = false;
				return;
			}
		} else {
			if (!this.ROOMS_MFIELDS.includes(keyMField)) {
				this.isValid = false;
				return;
			}
		}
	}

	private validateStringComparison(stringComparator: any, id: string) {
		if (typeof stringComparator === "undefined" || typeof stringComparator !== "object") {
			this.isValid = false;
			return;
		}

		const keySComparator = Object.keys(stringComparator);
		if (keySComparator.length !== 1) {
			this.isValid = false;
			return;
		}

		const sKey = keySComparator[0];
		const inputString = stringComparator[sKey];
		this.validateSKey(sKey, id);
		this.validateSValue(inputString);
	}

	private validateSKey(sKey: string, id: string) {
		this.validateID(sKey.split("_")[0], id);
		this.validateSField(sKey.split("_")[1]);
		return;
	}

	private validateSField(sField: any) {
		if (this.kind === InsightDatasetKind.Sections) {
			if (!this.COURSES_SFIELDS.includes(sField)) {
				this.isValid = false;
				return;
			}
		} else {
			if (!this.ROOMS_SFIELDS.includes(sField)) {
				this.isValid = false;
				return;
			}
		}
	}

	private validateSValue(inputString: any) {
		if (typeof inputString !== "string") {
			this.isValid = false;
			return;
		}
		let asteriskCheck = inputString;
		if (asteriskCheck.endsWith("*")) {
			asteriskCheck = asteriskCheck.substring(0, asteriskCheck.length - 1);
		}
		if (asteriskCheck.startsWith("*")) {
			asteriskCheck = asteriskCheck.substring(1, asteriskCheck.length);
		}
		if (asteriskCheck.includes("*")) {
			this.isValid = false;
			return;
		}
	}

	// TODO, FIT TO ROOMS SPECIFICATION (think it is OK tho)
	private validateID(idToVerify: any, id: any) {
		if (idToVerify.includes("_") || idToVerify.trim().length === 0 || idToVerify !== id) {
			this.isValid = false;
			return;
		}
	}

	private validateNegation(negation: any, id: string) {
		if (typeof negation === "undefined" || !(negation instanceof Object) || Object.keys(negation).length !== 1) {
			this.isValid = false;
			return;
		}
		this.validateFilter(negation, id);
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
			console.log("Status of query after Columns is " + this.getValidStatus());
		} else {
			this.validateColumns(options["COLUMNS"], query, id);
			this.validateOrder(options["ORDER"], options["COLUMNS"]);
		}
	}

	// TODO: in c2, ValidateTransformationsHelepr will take care of checking that keys match to GROUP and APPLY
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
				console.log(applyRule);
				applyTokens.push(Object.keys(applyRule)[0]);
			}
		}


		columnsArray.forEach((element: any) => {
			// console.log(element);
			// if there is an apply key in columns you need to check that is also in teh apply array
			if (applyTokens.includes(element)) {
				return;
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

	// TODO: in C2, the order can either be a string or an object
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
			throw new Error("ORDER value is neither a string nor an object");
		}

		// if (typeof orderValue !== "string" || !columnsArray.includes(orderValue)) {
		// 	this.isValid = false;
		// 	return;
		// }
	}

	private validateOrderObject(orderElement: any, columnsArray: any) {
		let orderObjectKeys = Object.keys(orderElement);
		if (orderObjectKeys.length !== 2) {
			this.isValid = false;
			return;
		}

		for (let objectKey of orderObjectKeys) {
			if (objectKey !== "dir" && objectKey !== "keys") {
				this.isValid = false;
				return;
			}

			if (objectKey === "dir") {
				if (typeof orderElement["dir"] !== "string") {
					this.isValid = false;
					return;
				}
				if (orderElement["dir"] !== "UP" && orderElement["dir"] !== "DOWN") {
					this.isValid = false;
					return;
				}
			}

			if (objectKey === "keys") {
				if (!Array.isArray(orderElement["keys"])) {
					this.isValid = false;
					return;
				}

				// ORDER KEYS MUST BE NON EMPTY ARRAY
				let orderKeysArray = orderElement["keys"];
				if (orderKeysArray.length === 0) {
					this.isValid = false;
					return;
				}

				// (ALL SORT KEYS MUST ALSO BE IN COLUMNS)
				// ALL ORDER KEYS MUST BE IN COLUMNS
				for (let key of orderKeysArray) {
					if (!columnsArray.includes(key)) {
						this.isValid = false;
						return;
					}
				}
			}
		}
	}
}
