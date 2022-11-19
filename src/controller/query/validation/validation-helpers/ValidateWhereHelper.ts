import {InsightDatasetKind} from "../../../IInsightFacade";

export default class ValidateWhereHelper {
	protected isValid: any;
	protected isValidTransformation: any;
	protected kind: InsightDatasetKind;
	protected QKEYS = ["OPTIONS", "WHERE", "TRANSFORMATIONS"];
	protected OKEYS = ["ORDER", "COLUMNS"];
	protected COURSES_MFIELDS = ["avg", "pass", "fail", "audit", "year"];
	protected COURSES_SFIELDS = ["dept", "id", "instructor", "title", "uuid"];
	protected ROOMS_MFIELDS = ["lat", "lon", "seats"];
	protected ROOMS_SFIELDS = ["fullname", "shortname", "number", "name"];

	constructor(kind: InsightDatasetKind) {
		this.isValid = true;
		this.kind = kind; // initialize to sections by default
	}

	public getValidStatus() {
		return this.isValid;
	}

	public validateFilter(query: any, id: string) {
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
		// console.log(stringComparator);
		// console.log(id);
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
		console.log("etner validateSField");
		console.log("kind " + this.kind);
		if (this.kind === InsightDatasetKind.Sections) {
			console.log("examining the sfield of sections");
			if (!this.COURSES_SFIELDS.includes(sField)) {
				this.isValid = false;
				return;
			}
		} else {
			console.log("examining the sfield");
			if (!this.ROOMS_SFIELDS.includes(sField)) {
				console.log("it is being set to false?");
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

	private validateNegation(negation: any, id: string) {
		if (typeof negation === "undefined" || !(negation instanceof Object) || Object.keys(negation).length !== 1) {
			this.isValid = false;
			return;
		}
		this.validateFilter(negation, id);
	}

	private validateID(idToVerify: any, id: any) {
		if (idToVerify.includes("_") || idToVerify.trim().length === 0 || idToVerify !== id) {
			this.isValid = false;
			return;
		}
	}
}
