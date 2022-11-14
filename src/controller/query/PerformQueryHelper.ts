import {ICourseDataset} from "../dataset-courses/ICourseDataset";
import PerformQueryOptionsHelper from "./PerformQueryOptionsHelper";
import {ISectionData} from "../dataset-courses/ISectionData";

export default class PerformQueryHelper {
	protected kind: any;
	protected options: PerformQueryOptionsHelper;

	constructor() {
		this.options = new PerformQueryOptionsHelper();
	}

	public processQuery(query: any, dataset: any, isTransformed: boolean): any[] {
		if (dataset === undefined) {
			throw Error("the dataset being queried on is undefined");
		}
		if (Object.keys(query["WHERE"]).length === 0) {
			return this.options.processOptions(query, dataset.sectionsData, isTransformed);
		}
		this.kind = dataset.kind;
		return this.filterQuery(query["WHERE"], dataset.sectionsData, this.kind);
	}

	// key idea:
	// filter through SectionsData[], examining each individual section and seeing if it matches with the query
	// if it is valid, return true and keep it in the list
	// otherwise filter it out
	private filterQuery(query: any, sections: any[], kind: any): any[] {
		return sections.filter((section) => {
			return this.where(query, section, kind);
		});
	}

	private where(query: any, section: any, kind: any): boolean {
		let key = Object.keys(query)[0];

		switch (key) {
			case "AND":
				return this.and(query, section, kind);
			case "OR":
				return this.or(query, section, kind);
			case "LT":
			case "GT":
			case "EQ":
				return this.mComparator(query, section, kind, key);
			case "IS":
				return this.sComparator(query, section, kind, key);
			case "NOT":
				return this.not(query, section, kind);
			default:
				throw new Error("invalid where key: " + key + " encountered");
		}
	}

	// if any of the sub-elements don't match the query, return false
	private and(query: any, section: any, kind: any): boolean {
		let resultAnd = true;
		for (let element of query["AND"]) {
			if (this.where(element, section, kind) === false) {
				resultAnd = false;
			}
		}
		return resultAnd;
	}

	// if any of the sub-elements do match the query, return true
	private or(query: any, section: any, kind: any): boolean {
		let resultOr = false;
		for (let element of query["OR"]) {
			if (this.where(element, section, kind) === true) {
				resultOr = true;
			}
		}
		return resultOr;
	}

	// simply return the negated result of the check on the sub-elements
	private not(query: any, section: any, kind: any): boolean {
		return !this.where(query["NOT"], section, kind);
	}

	// MCOMPARISON ::= MCOMPARATOR ':{' mkey ':' number '}'
	// mkey ::= idstring '_' mfield
	// mfield ::= 'avg' | 'pass' | 'fail' | 'audit' | 'year'
	private mComparator(query: any, section: any, kind: any, comparator: string): boolean {
		let mPair = query[comparator];
		let mKey = Object.keys(mPair)[0];
		let mNumber = mPair[mKey];
		let mField = mKey.split("_")[1];
		let sectionNumber = 0;

		if (mField === "avg") {
			sectionNumber = section.avg;
		} else if (mField === "pass") {
			sectionNumber = section.pass;
		} else if (mField === "fail") {
			sectionNumber = section.fail;
		} else if (mField === "audit") {
			sectionNumber = section.audit;
		} else if (mField === "year") {
			sectionNumber = section.year;
		} else {
			throw new Error("invalid mField: " + mField + " encountered");
		}

		switch (comparator) {
			case "GT":
				return sectionNumber > mNumber;
			case "LT":
				return sectionNumber < mNumber;
			case "EQ":
				return sectionNumber === mNumber;
			default:
				throw new Error("invalid mComparator: " + comparator + " encountered");
		}
	}

	// SCOMPARISON ::= 'IS:{' skey ':' [*]? inputstring [*]? '}'  // Asterisks should act as wildcards.
	// skey ::= idstring '_' sfield
	// sfield ::=  'dept' | 'id' | 'instructor' | 'title' | 'uuid'
	private sComparator(query: any, section: any, kind: any, comparator: string): boolean {
		let sPair = query[comparator];
		let sKey = Object.keys(sPair)[0];
		let sString = sPair[sKey];
		let sField = sKey.split("_")[1];
		let sectionString = "";

		if (sField === "dept") {
			sectionString = section.dept;
		} else if (sField === "id") {
			sectionString = section.id;
		} else if (sField === "instructor") {
			sectionString = section.instructor;
		} else if (sField === "title") {
			sectionString = section.title;
		} else if (sField === "uuid") {
			sectionString = section.uuid;
		} else {
			throw new Error("invalid SField: " + sField + " encountered");
		}

		if (sString === "*" || sString === "**") {
			return true;
		} else if (sString.startsWith("*") && sString.endsWith("*")) {
			let sStringTrim = sString.substring(1, sString.length - 1);
			return sectionString.includes(sStringTrim);
		} else if (sString.startsWith("*")) {
			let sStringTrim = sString.substring(1, sString.length);
			return sectionString.endsWith(sStringTrim);
		} else if (sString.endsWith("*")) {
			let sStringTrim = sString.substring(0, sString.length - 1);
			return sectionString.startsWith(sStringTrim);
		} else {
			return sectionString === sString;
		}
	}
}
