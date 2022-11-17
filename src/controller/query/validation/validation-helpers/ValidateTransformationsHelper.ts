import {InsightDatasetKind} from "../../../IInsightFacade";

export default class ValidateTransformationsHelper {
	protected COURSES_MFIELDS = ["avg", "pass", "fail", "audit", "year"];
	protected COURSES_SFIELDS = ["dept", "id", "instructor", "title", "uuid"];
	protected ROOMS_MFIELDS = ["lat", "lon", "seats"];
	protected ROOMS_SFIELDS = ["fullname", "shortname", "number", "name"];
	protected APPLYTOKENS = ["MAX", "MIN", "AVG", "COUNT", "SUM"];
	protected columnsArray: any;
	protected datasetID: any;
	protected kind: any;
	protected applyKeys: any[];
	protected isValid: boolean;

	constructor() {
		this.applyKeys = [];
		this.isValid = true;
	}

	public getValidStatus() {
		return this.isValid;
	}

	public validateTransformations(
		transformationsObject: any,
		columnsArray: any,
		id: string,
		kind: InsightDatasetKind
	) {
		this.columnsArray = columnsArray;
		this.datasetID = id;
		this.kind = kind;
		let transformationElements = Object.keys(transformationsObject);
		if (!transformationElements.includes("GROUP") || !transformationElements.includes("APPLY")) {
			this.isValid = false;
			return;
		}

		let applyArray: any[] = transformationsObject["APPLY"];
		applyArray.forEach((applyRule) => {
			this.applyKeys.push(Object.keys(applyRule)[0]);
		});
		if (!this.validateTransformationsAgainstColumns(transformationsObject, columnsArray)) {
			this.isValid = false;
			return;
		}
		for (let objectKey of transformationElements) {
			if (objectKey === "GROUP") {
				this.validateGroup(transformationsObject["GROUP"]);
			} else if (objectKey === "APPLY") {
				this.validateApply(transformationsObject["APPLY"]);
			} else {
				this.isValid = false;
				return;
			}
		}
	}

	private validateGroup(groupArray: any) {
		if (!this.isValidArray(groupArray)) {
			this.isValid = false;
			return;
		}
		if (groupArray.length === 0) {
			this.isValid = false;
			return;
		}
		for (let key of groupArray) {
			if (!this.isValidQueryKey(key)) {
				this.isValid = false;
				return;
			}
		}
	}

	// The applykey in an APPLYRULE should be unique (no two APPLYRULEs should share an applykey with the same name).
	private validateApply(applyArray: any) {
		let applyKeys: any[] = [];

		if (!this.isValidArray(applyArray)) {
			this.isValid = false;
			return;
		}
		if (applyArray.length === 0) {
			this.isValid = false;
			return;
		}
		applyArray.forEach((applyRule: any) => {
			if (Object.keys(applyRule).length !== 1) {
				this.isValid = false;
				return;
			}
			let applyKey = Object.keys(applyRule)[0];
			applyKeys.push(applyKey);
		});

		// https://stackoverflow.com/questions/19655975/check-if-an-array-contains-duplicate-values
		let applyKeysSetSize = new Set(applyKeys).size;
		if (applyKeys.length !== applyKeysSetSize) {
			this.isValid = false;
			return;
		}

		if (!this.isValidApplyClause(applyArray)) {
			this.isValid = false;
			return;
		}
	}

	private isValidApplyClause(applyArray: any): boolean {
		applyArray.forEach((applyRule: any) => {
			let applyTokenAndKeyArray: any = Object.values(applyRule);
			if (applyTokenAndKeyArray.length !== 1) {
				return false;
			}
			let applyTokenAndKey = applyTokenAndKeyArray[0];

			if (Object.keys(applyTokenAndKey).length !== 1 || Object.values(applyTokenAndKey).length !== 1) {
				return false;
			}

			let applyKey = Object.keys(applyTokenAndKey)[0];
			let key: any = Object.values(applyTokenAndKey)[0];
			if (!this.APPLYTOKENS.includes(applyKey)) {
				return false;
			}
			if (applyKey !== "COUNT") {
				let keyField: any = key.split("_")[1];
				if (this.kind === InsightDatasetKind.Sections) {
					if (!this.COURSES_MFIELDS.includes(keyField)) {
						return false;
					}
				} else {
					if (!this.ROOMS_MFIELDS.includes(keyField)) {
						return false;
					}
				}
			}
			if (!this.isValidQueryKey(key)) {
				return false;
			}
		});
		return true;
	}

	// If a GROUP is present, all COLUMNS keys must correspond to one of the GROUP keys or to applykeys defined in the APPLY block.
	// so loop over each of COLUMNS KEY, and verify that it is either in GROUP array or APPLY array
	private validateTransformationsAgainstColumns(transformationsObject: any, columnsArray: any): boolean {
		let groupArray = transformationsObject["GROUP"];
		let applyArray = this.applyKeys;

		columnsArray.forEach((column: any) => {
			if (!groupArray.includes(column) && !applyArray.includes(column)) {
				return false;
			}
		});

		return true;
	}

	// called from validate GROUP
	// given some key like rooms_fullname, check that the dataset id and fields are valid
	private isValidQueryKey(key: any): boolean {
		if (typeof key !== "string") {
			return false;
		}

		// if we encounter a key that is one of the apply keys
		if (this.applyKeys.includes(key)) {
			return true;
		}
		// otherwise we are looking at some standard keys
		let keyID = key.split("_")[0];
		let keyField = key.split("_")[1];

		if (keyID !== this.datasetID) {
			return false;
		}

		if (this.kind === InsightDatasetKind.Sections) {
			if (!this.COURSES_MFIELDS.includes(keyField) && !this.COURSES_SFIELDS.includes(keyField)) {
				return false;
			}
		} else {
			if (!this.ROOMS_MFIELDS.includes(keyField) && !this.ROOMS_SFIELDS.includes(keyField)) {
				return false;
			}
		}
		return true;
	}

	private isValidArray(a: any): boolean {
		return !(!Array.isArray(a) || a.length === 0 || typeof a === "undefined" || typeof a !== "object");
	}
}
