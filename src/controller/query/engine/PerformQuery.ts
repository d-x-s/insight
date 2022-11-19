import {InsightDatasetKind} from "../../IInsightFacade";
import PerformQueryOptionsHelper from "./engine-helpers/PerformQueryOptionsHelper";

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
			return this.options.processOptions(query, dataset.data, isTransformed);
		}
		this.kind = dataset.kind;
		// console.log("kind19");
		// console.log(this.kind);
		if (this.kind === InsightDatasetKind.Sections) {
			return this.filterQuery(query["WHERE"], dataset.data, this.kind);
		} else {
			// console.log(dataset.data);
			return this.filterQuery(query["WHERE"], dataset.data, this.kind);
		}
	}

	// key idea:
	// filter through SectionsData[], examining each individual section and seeing if it matches with the query
	// if it is valid, return true and keep it in the list
	// otherwise filter it out
	private filterQuery(query: any, sections: any[], kind: any): any[] {
		// console.log(sections);
		// for (let s of sections) {
		// 	// this.delay(1000).then(() => console.log(s));
		// 	setTimeout(function(){
		// 		console.log(s);
		// 	}, 1000);
		// }
		// sections.forEach((s) => {
		// 	this.delay(10000).then(() => console.log(s));
		// });
		// console.log(sections);
		// console.log(JSON.stringify(sections));
		let filtered = sections.filter((section) => {
			// console.log(section);
			return this.where(query, section, kind);
		});
		// console.log(filtered);
		return filtered;
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

	// TODO: hardcoded, epxand to rooms
	// MCOMPARISON ::= MCOMPARATOR ':{' mkey ':' number '}'
	// mkey ::= idstring '_' mfield
	// mfield ::= 'avg' | 'pass' | 'fail' | 'audit' | 'year'
	private mComparator(query: any, section: any, kind: any, comparator: string): boolean {
		// console.log(section);
		let mPair = query[comparator];
		let mKey = Object.keys(mPair)[0];
		let mNumber = mPair[mKey];
		let mField = mKey.split("_")[1];
		let sectionNumber = 0;

		if (this.kind === InsightDatasetKind.Sections) {
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
		} else {
			if (mField === "lat") {
				sectionNumber = section.lat;
			} else if (mField === "lon") {
				sectionNumber = section.lon;
			} else if (mField === "seats") {
				sectionNumber = section.seats;
			} else {
				throw new Error("invalid mField: " + mField + " encountered");
			}
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

	// TODO: hardcoded, expand to rooms
	// SCOMPARISON ::= 'IS:{' skey ':' [*]? inputstring [*]? '}'  // Asterisks should act as wildcards.
	// skey ::= idstring '_' sfield
	// sfield ::=  'dept' | 'id' | 'instructor' | 'title' | 'uuid'
	private sComparator(query: any, section: any, kind: any, comparator: string): boolean {
		// console.log("mComparator section");
		// console.log(section);
		let sPair = query[comparator];
		let sKey = Object.keys(sPair)[0];
		let sString = sPair[sKey];
		let sField = sKey.split("_")[1];
		let sectionString = "";

		if (this.kind === InsightDatasetKind.Sections) {
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
		} else {
			sectionString = this.roomStringHelper(section, sField);
			// console.log(section);
			// console.log("sectioNString");
			// console.log(section);
			// console.log(sectionString);
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

	private roomStringHelper(section: any, sField: string): string {
		let sFieldExplicit = sField.toString();
		if (sFieldExplicit === "shortname") {
			return section.shortname;
		} else if (sFieldExplicit === "fullname") {
			return section.fullname;
		} else if (sFieldExplicit === "address") {
			return section.address;
		} else if (sFieldExplicit === "name") {
			return section.name;
		} else if (sFieldExplicit === "href") {
			return section.href;
		} else if (sFieldExplicit === "number") {
			return section.number;
		} else if (sFieldExplicit === "furniture") {
			return section.furniture;
		} else if (sFieldExplicit === "type") {
			return section.type;
		} else {
			throw new Error("invalid SField: " + sField + " encountered");
		}
	}
}
