import {InsightDatasetKind} from "../../IInsightFacade";
import PerformQueryOptionsHelper from "./engine-helpers/PerformQueryOptionsHelper";

export default class PerformQueryHelper {
	protected kind: any;
	protected options: PerformQueryOptionsHelper;

	constructor() {
		this.options = new PerformQueryOptionsHelper();
	}

	public processQuery(query: any, dataset: any, isTransformed: boolean): any[] {
		if (dataset === undefined || dataset.data === undefined) {
			throw Error("the dataset being queried on is undefined");
		}

		if (Object.keys(query["WHERE"]).length === 0) {
			return dataset.data;
		}

		this.kind = dataset.kind;
		return this.filterQuery(query["WHERE"], dataset.data);
	}

	// key idea:
	// filter through SectionsData[], examining each individual section and seeing if it matches with the query
	// if it is valid, return true and keep it in the list
	// otherwise filter it out
	private filterQuery(query: any, dataList: any[]): any[] {
		return dataList.filter((dataElement) => {
			return this.where(query, dataElement);
		});
	}

	private where(query: any, dataElement: any): boolean {
		let key = Object.keys(query)[0];

		switch (key) {
			case "AND":
				return this.and(query, dataElement);
			case "OR":
				return this.or(query, dataElement);
			case "LT":
			case "GT":
			case "EQ":
				return this.mComparator(query, dataElement, key);
			case "IS":
				return this.sComparator(query, dataElement, key);
			case "NOT":
				return this.not(query, dataElement);
			default:
				throw new Error("invalid where key: " + key + " encountered");
		}
	}

	// if any of the sub-elements don't match the query, return false
	private and(query: any, dataElement: any): boolean {
		let resultAnd = true;
		for (let element of query["AND"]) {
			if (this.where(element, dataElement) === false) {
				resultAnd = false;
			}
		}
		return resultAnd;
	}

	// if any of the sub-elements do match the query, return true
	private or(query: any, dataElement: any): boolean {
		let resultOr = false;
		for (let element of query["OR"]) {
			if (this.where(element, dataElement) === true) {
				resultOr = true;
			}
		}
		return resultOr;
	}

	// simply return the negated result of the check on the sub-elements
	private not(query: any, dataElement: any): boolean {
		return !this.where(query["NOT"], dataElement);
	}

	// MCOMPARISON ::= MCOMPARATOR ':{' mkey ':' number '}'
	// mkey ::= idstring '_' mfield
	// mfield ::= 'avg' | 'pass' | 'fail' | 'audit' | 'year'
	private mComparator(query: any, dataElement: any, comparator: string): boolean {
		let mComparatorObject = query[comparator];

		let mKey: any         = Object.keys(mComparatorObject)[0];
		let mNumber: any      = Object.values(mComparatorObject)[0];

		let mField            = mKey.split("_")[1];
		let elementFieldValue = 0;

		if (this.kind === InsightDatasetKind.Sections) {
			elementFieldValue = this.getSectionElementMathFieldValue(dataElement, mField);
		} else {
			elementFieldValue = this.getRoomElementMathFieldValue(dataElement, mField);
		}

		switch (comparator) {
			case "GT":
				return elementFieldValue > mNumber;
			case "LT":
				return elementFieldValue < mNumber;
			case "EQ":
				return elementFieldValue === mNumber;
			default:
				throw new Error("invalid mComparator: " + comparator + " encountered");
		}
	}

	private getSectionElementMathFieldValue(sectionElement: any, mField: string): number {
		if (mField === "avg") {
			return sectionElement.avg;

		} else if (mField === "pass") {
			return sectionElement.pass;

		} else if (mField === "fail") {
			return sectionElement.fail;

		} else if (mField === "audit") {
			return sectionElement.audit;

		} else if (mField === "year") {
			return sectionElement.year;

		} else {
			throw new Error("invalid mField: " + mField + " encountered");
		}
	};

	private getRoomElementMathFieldValue(roomElement: any, mField: string): number {
		if (mField === "lat") {
			return roomElement.lat;

		} else if (mField === "lon") {
			return roomElement.lon;

		} else if (mField === "seats") {
			return roomElement.seats;

		} else {
			throw new Error("invalid mField: " + mField + " encountered");
		}
	};

	// SCOMPARISON ::= 'IS:{' skey ':' [*]? inputstring [*]? '}'  // Asterisks should act as wildcards.
	// skey ::= idstring '_' sfield
	// sfield ::=  'dept' | 'id' | 'instructor' | 'title' | 'uuid'
	private sComparator(query: any, dataElement: any, comparator: string): boolean {
		let sComparisonObject = query[comparator];

		let sKey: any         = Object.keys(sComparisonObject)[0];
		let inputString: any  = Object.values(sComparisonObject)[0];

		let sField            = sKey.split("_")[1];
		let elementFieldValue = "";

		if (this.kind === InsightDatasetKind.Sections) {
			elementFieldValue = this.getSectionElementStringFieldValue(dataElement, sField);
		} else {
			elementFieldValue = this.getRoomElementStringFieldValue(dataElement, sField);
		}

		if (inputString === "*" || inputString === "**") {
			return true;

		} else if (inputString.startsWith("*") && inputString.endsWith("*")) {
			let sStringTrim = inputString.substring(1, inputString.length - 1);
			return elementFieldValue.includes(sStringTrim);

		} else if (inputString.startsWith("*")) {
			let sStringTrim = inputString.substring(1, inputString.length);
			return elementFieldValue.endsWith(sStringTrim);

		} else if (inputString.endsWith("*")) {
			let sStringTrim = inputString.substring(0, inputString.length - 1);
			return elementFieldValue.startsWith(sStringTrim);

		} else {
			return elementFieldValue === inputString;
		}
	}

	private getSectionElementStringFieldValue(sectionElement: any, sField: string): string {
		if (sField === "dept") {
			return sectionElement.dept;

		} else if (sField === "id") {
			return sectionElement.id;

		} else if (sField === "instructor") {
			return sectionElement.instructor;

		} else if (sField === "title") {
			return sectionElement.title;

		} else if (sField === "uuid") {
			return sectionElement.uuid;

		} else {
			throw new Error("invalid SField: " + sField + " encountered");
		}
	};

	private getRoomElementStringFieldValue(roomElement: any, sField: string): string {
		if (sField === "shortname") {
			return roomElement.shortname;

		} else if (sField === "fullname") {
			return roomElement.fullname;

		} else if (sField === "address") {
			return roomElement.address;

		} else if (sField === "name") {
			return roomElement.name;

		} else if (sField === "href") {
			return roomElement.href;

		} else if (sField === "number") {
			return roomElement.number;

		} else if (sField === "furniture") {
			return roomElement.furniture;

		} else if (sField === "type") {
			return roomElement.type;

		} else {
			throw new Error("invalid SField: " + sField + " encountered");
		}
	}
}
