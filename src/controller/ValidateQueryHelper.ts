import Utility from "../Utility";

export default class ValidateQueryHelper {
	protected valid: boolean;
	protected QKEYS = ["OPTIONS", "WHERE"];
	protected OKEYS = ["ORDER", "COLUMNS"];
	protected MFIELDS = ["avg", "pass", "fail", "audit", "year"];
	protected SFIELDS = ["dept", "id", "instructor", "title", "uuid"];

	constructor() {
		this.valid = true;
	}

	public getValid() {
		return this.valid;
	}

	/**
	 * extracts an id from a query object
	 * @param query  A query object
	 * @return string  The id of the dataset associated with this query, "" if not erroneous or not found
	 */
	public extractDatasetID(query: any): string {
		if (query === null || query === "undefined" || !(query instanceof Object)) {
			return "";
		}

		let keys = Object.keys(query);
		if (!keys.includes("OPTIONS")) {
			return "";
		}

		let optionsKeys = Object.keys(query["OPTIONS"]);
		if (!optionsKeys.includes("COLUMNS")) {
			return "";
		}

		let columnsValue = query["OPTIONS"]["COLUMNS"];
		if (
			!Array.isArray(columnsValue) ||
			columnsValue.length === 0 ||
			typeof columnsValue === "undefined" ||
			typeof columnsValue !== "object"
		) {
			return "";
		}
		return columnsValue[0].split("_")[0];
	}

	public validateQuery(query: any, id: string) {
		try {
			const queryKeys = Object.keys(query);

			if (query === null || query === "undefined" || !(query instanceof Object)) {
				this.valid = false;
				return;
			}

			if (queryKeys.length !== 2) {
				this.valid = false;
				return;
			}

			for (let k of queryKeys) {
				if (!this.QKEYS.includes(k)) {
					this.valid = false;
					return;
				}
			}

			this.validateFilter(query["WHERE"], id);
			this.validateOptions(query["OPTIONS"], id);
		} catch (error) {
			Utility.log("isQueryValid::validateQuery::error caught", "error");
		}
	}

	private validateFilter(query: any, id: string) {
		if (typeof query === "undefined" || !(query instanceof Object)) {
			this.valid = false;
			return;
		}
		const whereKeys = Object.keys(query);
		if (whereKeys.length === 0) {
			return; // empty where clause
		}

		if (whereKeys.length !== 1) {
			this.valid = false;
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
				this.valid = false;
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
			this.valid = false;
			return;
		}

		queryLogicArray.forEach((element: any) => {
			let logicComparisonKeys = Object.keys(element);
			if (logicComparisonKeys.length !== 1) {
				this.valid = false;
				return;
			}
			this.validateFilter(element, id);
		});
	}

	private validateMathComparison(mathComparator: any, id: string) {
		if (typeof mathComparator === "undefined" || typeof mathComparator !== "object") {
			this.valid = false;
			return;
		}
		const pairMComparatorKeys = Object.keys(mathComparator);
		if (pairMComparatorKeys.length !== 1) {
			this.valid = false;
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
			this.valid = false;
			return;
		}
	}

	private validateMField(keyMField: any) {
		if (!this.MFIELDS.includes(keyMField)) {
			this.valid = false;
			return;
		}
	}

	private validateStringComparison(stringComparator: any, id: string) {
		if (typeof stringComparator === "undefined" || typeof stringComparator !== "object") {
			this.valid = false;
			return;
		}

		const keySComparator = Object.keys(stringComparator);
		if (keySComparator.length !== 1) {
			this.valid = false;
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
		if (!this.SFIELDS.includes(sField)) {
			this.valid = false;
			return;
		}
	}

	private validateSValue(inputString: any) {
		if (typeof inputString !== "string") {
			this.valid = false;
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
			this.valid = false;
			return;
		}
	}
	private validateID(idToVerify: any, id: any) {
		if (idToVerify.includes("_") || idToVerify.trim().length === 0 || idToVerify !== id) {
			this.valid = false;
			return;
		}
	}
	private validateNegation(negation: any, id: string) {
		if (typeof negation === "undefined" || !(negation instanceof Object) || Object.keys(negation).length !== 1) {
			this.valid = false;
			return;
		}
		this.validateFilter(negation, id);
	}
	private validateOptions(options: any, id: string) {
		if (typeof options === "undefined" || typeof options !== "object") {
			this.valid = false;
			return;
		}
		const optionsKeys = Object.keys(options);
		optionsKeys.forEach((element: any) => {
			if (!this.OKEYS.includes(element)) {
				this.valid = false;
				return;
			}
		});

		if (optionsKeys.length === 1) {
			if (optionsKeys[0] !== "COLUMNS") {
				this.valid = false;
				return;
			}
			this.validateColumns(options["COLUMNS"], id);
		} else {
			this.validateColumns(options["COLUMNS"], id);
			this.validateOrder(options["ORDER"], options["COLUMNS"]);
		}
	}

	private validateColumns(columnsArray: any, id: string) {
		if (
			!Array.isArray(columnsArray) ||
			columnsArray.length === 0 ||
			typeof columnsArray === "undefined" ||
			typeof columnsArray !== "object"
		) {
			this.valid = false;
			return;
		}
		columnsArray.forEach((element: any) => {
			let key = element.split("_");
			this.validateID(key[0], id);
			if (!this.MFIELDS.includes(key[1]) && !this.SFIELDS.includes(key[1])) {
				this.valid = false;
				return;
			}
		});
	}

	private validateOrder(orderValue: any, columnsArray: any) {
		if (typeof orderValue === "undefined") {
			this.valid = false;
			return;
		}

		if (typeof orderValue !== "string" || !columnsArray.includes(orderValue)) {
			this.valid = false;
			return;
		}
	}
}
