import e, {raw} from "express";
import Utility from "../Utility";
import {Dataset} from "./Dataset";
import {InsightError, InsightResult} from "./IInsightFacade";
import {SectionsData} from "./SectionsData";

export default class PerformQueryHelper {
	protected kind: any;

	constructor() {
		Utility.log("initializing PerformQueryHelper", "trace");
	}

	public processQuery(query: any, dataset: Dataset | undefined): any[] {
		if (dataset === undefined) {
			throw Error("The dataset being queried on is undefined");
		}

		if(Object.keys(query["WHERE"]).length === 0) {
			return this.processOptions(query, dataset.sectionData);
		}

		this.kind = dataset.kind;
		return this.filterQuery(query["WHERE"], dataset.sectionData, this.kind);
	}

	public processOptions(query: any, rawResult: any[]): any[] {
		let options = query["OPTIONS"];
		let resultFiltered = this.processColumns(options["COLUMNS"], rawResult);

		let optionsKeys = Object.keys(options);
		if(optionsKeys.includes("ORDER")) {
			resultFiltered = this.processOrder(options["ORDER"], resultFiltered);
		}
		return resultFiltered;
	}

	private processColumns(columns: any[], rawResult: any[]): any[] {
		let resultFiltered: any[] = [];
		rawResult.forEach((r) => {
			const processedSectionObject: InsightResult = {};
			columns.forEach((c: string) => {
				let columnPair = c.split("_");
				let columnKey = columnPair[0];
				let columnValue = columnPair[1];
				processedSectionObject[c] = r[columnValue];
			});
			resultFiltered.push(processedSectionObject);
		});
		return resultFiltered;
	}

	private processOrder(order: any, resultUnsorted: any[]): any[] {
		return resultUnsorted.sort((element1, element2) => {
			if (element1[order] > element2[order]) {
				return 1;
			} else if (element1[order] < element2[order]) {
				return -1;
			} else {
				return 0;
			}
		});
	}


	// key idea:
	// filter through SectionsData[], examining each individual section and seeing if it matches with the query
	// if it is valid, return true and keep it in the list
	// otherwise filter it out
	private filterQuery(query: any, sections: SectionsData[], kind: any): any[] {
		return sections.filter((section) => {
			return this.where(query, section, kind);
		});
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
				return this.sComparator(query, section, kind, key);
			case "NOT":
				return this.not(query, section, kind);
			default:
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

		switch (mField) {
			case "avg":
				sectionNumber = section.avg;
			case "pass":
				sectionNumber = section.pass;
			case "fail":
				sectionNumber = section.fail;
			case "audit":
				sectionNumber = section.audit;
			case "year":
				sectionNumber = section.year;
		}

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

		switch (sField) {
			case "dept":
				sectionString = section.dept;
			case "id":
				sectionString = section.id;
			case "instructor":
				sectionString = section.instructor;
			case "title":
				sectionString = section.title;
			case "uuid":
				sectionString = section.uuid;
		}

		if (sString === "*" || sString === "**") {
			return true;

		} else if (sString.startsWIth("*") && sString.endsWith("*")) {
			let sStringTrim = sString.substring(1, sString.length - 1);
			return sectionString.includes(sStringTrim);

		} else if (sString.startsWIth("*")) {
			let sStringTrim = sString.substring(1, sString.length - 0);
			return sectionString.includes(sStringTrim);

		} else if (sString.endsWith("*")) {
			let sStringTrim = sString.substring(0, sString.length - 1);
			return sectionString.includes(sStringTrim);

		} else {
			return sectionString === sString;
		}
	}

}
