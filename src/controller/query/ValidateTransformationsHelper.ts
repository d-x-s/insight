import {InsightDatasetKind} from "../IInsightFacade";
import ValidateQueryHelper from "./ValidateQueryHelper";

export default class ValidateTransformationsHelper {
	protected COURSES_MFIELDS = ["avg", "pass", "fail", "audit", "year"];
	protected COURSES_SFIELDS = ["dept", "id", "instructor", "title", "uuid"];
	protected ROOMS_MFIELDS = ["lat", "lon", "seats"];
	protected ROOMS_SFIELDS = ["fullname", "shortname", "number", "name"];
	protected APPLYTOKENS = ["MAX", "MIN", "AVG", "COUNT", "SUM"];
	protected columnsArray: any;
	protected datasetID: any;
	protected kind: any;
	protected validateQueryHelper: ValidateQueryHelper;
	protected applyKeys: any[];

	constructor() {
		this.validateQueryHelper = new ValidateQueryHelper();
		this.applyKeys = [];
	}

	public validateTransformations(transformationsObject: any,
								   columnsArray: any,
								   id: string,
								   kind: InsightDatasetKind): boolean {

		this.columnsArray = columnsArray;
		this.datasetID = id;
		this.kind = kind;

		let transformationElements = Object.keys(transformationsObject);
		if (!(transformationElements.includes("GROUP")) || !(transformationElements.includes("APPLY"))) {
			return false;
		}

		for (let applyObject in transformationsObject["APPLY"]) {
			this.applyKeys.push(Object.keys(applyObject)[0]);
		}

		// at this point we are guaranteed the GROUP and APPLY arrays
		if (!this.validateTransformationsAgainstColumns(transformationsObject, columnsArray)) {
			return false;
		}

		for (let objectKey of transformationElements) {
			if (objectKey === "GROUP") {
				return this.validateGroup(transformationsObject["GROUP"]);
			} else if (objectKey === "APPLY") {
				return this.validateApply(transformationsObject["APPLY"]);
			} else {
				return false;
			}
		};
		throw new Error("error when validating transformations, unreachable code");
	}

	private validateGroup(groupArray: any): boolean {
		if (!this.isValidArray(groupArray)) {
			return false;
		}
		if (groupArray.length === 0) {
			return false;
		}
		for (let key of groupArray) {
			if(!this.isValidQueryKey(key)) {
				return false;
			}
		}

		throw new Error("error when validating groups, unreachable code");
	}

	// The applykey in an APPLYRULE should be unique (no two APPLYRULEs should share an applykey with the same name).
	private validateApply(applyArray: any): boolean {
		let applyKeys = [];

		if (!this.isValidArray(applyArray)) {
			return false;
		}
		if (applyArray.length === 0) {
			return false;
		}

		for (let applyRule in applyArray) {
			if (Object.keys(applyRule).length !== 1) {
				return false;
			}
			let applyKey = Object.keys(applyRule)[0];
			applyKeys.push(applyKey);
		}

		// https://stackoverflow.com/questions/19655975/check-if-an-array-contains-duplicate-values
		if (applyKeys.length !== new Set(applyKeys).size) {
			return false;
		}

		if (!this.isValidApplyClause(applyArray)) {
			return false;
		}
		throw new Error("error when validating apply, unreachable code");
	}

	private isValidApplyClause(applyArray: any): boolean {
		// APPLYRULE ::= '{' applykey ': {' APPLYTOKEN ':' key '}}' where key ::= mkey | skey
		// now we go thru each ApplyRule (which is an individual object in the APPLY array)
		// and make sure:
		// 1) the APPLYTOKEN is valid
		// 2) the "key" value is valid (use isValidQueryKey)

		// recall that COUNT can be used on both numeric and string fields
		// so for any APPLYTOKEN that is NOT COUNT, then you need to check that it is paired with a numeric field
		for (let applyRule in applyArray) {
			let applyTokenAndKeyArray = Object.values(applyRule);
			if (applyTokenAndKeyArray.length !== 1) {
				return false;
			}
			let applyTokenAndKey = applyTokenAndKeyArray[0];

			if (Object.keys(applyTokenAndKey).length !== 1 || Object.values(applyTokenAndKey).length !== 1) {
				return false;
			}

			let applyToken = Object.keys(applyTokenAndKey)[0];
			let key = Object.values(applyTokenAndKey)[1];

			if (!this.APPLYTOKENS.includes(applyToken)) {
				return false;
			}

			if (applyToken !== "COUNT") {
				let keyField = key.split("_")[1];
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
		}
		return true;
	}

	// If a GROUP is present, all COLUMNS keys must correspond to one of the GROUP keys or to applykeys defined in the APPLY block.
	// so loop over each of COLUMNS KEY, and verify that it is either in GROUP array or APPLY array
	private validateTransformationsAgainstColumns(transformationsObject: any, columnsArray: any,): boolean {
		let groupArray = transformationsObject["GROUP"];
		let applyArray = this.applyKeys;
		for (let key in columnsArray) {
			if (!groupArray.includes(key) && !applyArray.includes(key)) {
				return false;
			}
		}
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

		// otherwise we are looking at some standarad keys
		let keyID = key.split("_")[0];
		let keyField = key.split("_")[1];

		if (keyID !== this.datasetID) {
			return false;
		}

		if (this.kind === InsightDatasetKind.Sections) {
			if (!this.COURSES_MFIELDS.includes(keyField) && !(this.COURSES_SFIELDS.includes(keyField))) {
				return false;
			};
		} else {
			if (!this.ROOMS_MFIELDS.includes(keyField) && !(this.ROOMS_SFIELDS.includes(keyField))) {
				return false;
			};
		}

		// otherwise you've come across an invalid string
		return false;
	}

	private isValidArray(a: any): boolean {
		return !(
			!Array.isArray(a) ||
			a.length === 0 ||
			typeof a === "undefined" ||
			typeof a !== "object"
		);
	}
};