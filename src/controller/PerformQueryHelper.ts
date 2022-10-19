import Utility from "../Utility";
import {Dataset} from "./Dataset";
import {InsightError, InsightResult} from "./IInsightFacade";
import PerformQueryOptionsHelper from "./PerformQueryOptionsHelper";
import {SectionsData} from "./SectionsData";

export default class PerformQueryHelper {
	protected kind: any;
	protected options: PerformQueryOptionsHelper;

	constructor() {
		Utility.log("initializing PerformQueryHelper", "trace");
		this.options = new PerformQueryOptionsHelper();
	}

	public processQuery(query: any, dataset: Dataset | undefined): any[] {
		if (dataset === undefined) {
			console.log("processQuery::the dataset being on is undefined");
			throw Error("The dataset being queried on is undefined");
		}
		if(Object.keys(query["WHERE"]).length === 0) {
			console.log("processQuery::where is empty");
			return this.options.processOptions(query, dataset.sectionData);
		}
		this.kind = dataset.kind;
		return this.filterQuery(query["WHERE"], dataset.sectionData, this.kind);
	}

	// key idea:
	// filter through SectionsData[], examining each individual section and seeing if it matches with the query
	// if it is valid, return true and keep it in the list
	// otherwise filter it out
	private filterQuery(query: any, sections: SectionsData[], kind: any): any[] {
		// console.log("filterQuery:: is being run");
		let trueCount = 0;
		return sections.filter((section) => {
			// console.log(this.where(query, section, kind)); everything output to true?
			trueCount++;
			return this.where(query, section, kind);
		});
		console.log(trueCount);
	}

	private where(query: any, section: SectionsData, kind: any): boolean {
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
				// console.log("the value of sCompartoar is: " + this.sComparator(query, section, kind, key));
				// console.log(key);
				// console.log(query);
				return this.sComparator(query, section, kind, key);
			case "NOT":
				return this.not(query, section, kind);
			default:
				console.log("where::switch case error thrown");
				throw new Error("Malformed operator key name");
		}
	}

	// if any of the sub-elements don't match the query, return false
	private and(query: any, section: SectionsData, kind: any): boolean {
		let resultAnd = true;
		for (let element of query["AND"]) {
			if(this.where(element, section, kind) === false) {
				resultAnd = false;
			}
		}
		return resultAnd;
	}

	// if any of the sub-elements do match the query, return true
	private or(query: any, section: SectionsData, kind: any): boolean {
		let resultOr = false;
		for (let element of query["OR"]) {
			if(this.where(element, section, kind) === true) {
				resultOr = true;
			}
		}
		return resultOr;
	}

	// simply return the negated result of the check on the sub-elements
	private not(query: any, section: SectionsData, kind: any): boolean {
		return !this.where(query["NOT"], section, kind);
	}

	// MCOMPARISON ::= MCOMPARATOR ':{' mkey ':' number '}'
	// mkey ::= idstring '_' mfield
	// mfield ::= 'avg' | 'pass' | 'fail' | 'audit' | 'year'
	private mComparator(query: any, section: SectionsData, kind: any, comparator: string): boolean {
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
			// console.log(mField);
			console.log("mComparator:: this line should not be run");
		}

		// switch (mField) {
		// 	case "avg":
		// 		sectionNumber = section.avg;
		// 	case "pass":
		// 		sectionNumber = section.pass;
		// 	case "fail":
		// 		sectionNumber = section.fail;
		// 	case "audit":
		// 		sectionNumber = section.audit;
		// 	case "year":
		// 		sectionNumber = section.year;
		// }
		// console.log(section);
		// console.log(sectionNumber);
		// console.log(mNumber);

		switch (comparator) {
			case "GT":
				return sectionNumber > mNumber;
			case "LT":
				return sectionNumber < mNumber;
			case "EQ":
				return sectionNumber === mNumber;
			default:
				throw new InsightError("mComparator::invalid comparator");
		}
	}

	// SCOMPARISON ::= 'IS:{' skey ':' [*]? inputstring [*]? '}'  // Asterisks should act as wildcards.
	// skey ::= idstring '_' sfield
	// sfield ::=  'dept' | 'id' | 'instructor' | 'title' | 'uuid'
	private sComparator(query: any, section: SectionsData, kind: any, comparator: string): boolean {
		let sPair = query[comparator];
		let sKey = Object.keys(sPair)[0];
		let sString = sPair[sKey];
		let sField = sKey.split("_")[1];
		let sectionString = "";
		// console.log(sPair, sKey, sString, sField, sectionString);

		// console.log("sComparator is being reached");

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
			// console.log(sField);
			console.log(query, sPair, sKey, sString, sField, sectionString);
			console.log("sComparator:: this line should not be run");
		}

		// switch (sField) {
		// 	case "dept":
		// 		sectionString = section.dept;
		// 	case "id":
		// 		sectionString = section.id;
		// 	case "instructor":
		// 		sectionString = section.instructor;
		// 	case "title":
		// 		sectionString = section.title;
		// 	case "uuid":
		// 		sectionString = section.uuid;
		// }

		// console.log(sPair, sKey, sString, sField, sectionString, section);
		// return sectionString === sString;

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
			// console.log("sectionString and ssString arebeing evaluated");
			return sectionString === sString;
		}
	}
}
