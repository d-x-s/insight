import Utility from "../Utility";
import {InsightResult} from "./IInsightFacade";

export default class PerformQueryOptionsHelper {
	protected kind: any;

	constructor() {
		Utility.log("initializing PerformQueryOptionsHelper", "trace");
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
}
