import Utility from "../Utility";
import {Dataset} from "./Dataset";
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
		this.kind = dataset.kind;
		return this.filterQuery(query["WHERE"], dataset.sectionData, this.kind);
		// return this.where(query["WHERE"], dataset.sectionData, this.kind);
	}

	public processOptions(): any[] {
		return [];
	}

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
	private and(query: any, section: SectionsData, kind: any): boolean {
		throw new Error("Method not implemented.");
	}

	private or(query: any, section: SectionsData, kind: any): boolean {
		throw new Error("Method not implemented.");
	}

	private mComparator(query: any, section: SectionsData, kind: any, key: string): boolean {
		throw new Error("Method not implemented.");
	}

	private sComparator(query: any, section: SectionsData, kind: any, key: string): boolean {
		throw new Error("Method not implemented.");
	}

	private not(query: any, section: SectionsData, kind: any): boolean {
		throw new Error("Method not implemented.");
	}

}
