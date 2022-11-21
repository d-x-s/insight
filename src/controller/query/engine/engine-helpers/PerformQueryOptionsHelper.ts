import {InsightResult} from "../../../IInsightFacade";

export default class PerformQueryOptionsHelper {
	protected kind: any;

	public processOptions(query: any, rawResult: any[], isTransformed: boolean): any[] {
		let options = query["OPTIONS"];
		let resultFiltered = this.processColumns(options["COLUMNS"], rawResult, isTransformed);

		let optionsKeys = Object.keys(options);
		if (optionsKeys.includes("ORDER")) {
			resultFiltered = this.processOrder(options["ORDER"], resultFiltered);
		}
		return resultFiltered;
	}

	private processColumns(columns: any[], rawResult: any[], isTransformed: boolean): any[] {
		let resultFiltered: any[] = [];
		for (let r of rawResult) {
			const processedSectionObject: InsightResult = {};

			for (let c of columns) {
				if (isTransformed) {
					return rawResult;
				} else {
					let columnPair = c.split("_");
					let columnKey = columnPair[0];
					let columnValue = columnPair[1];
					processedSectionObject[c] = r[columnValue];
				}
			}
			resultFiltered.push(processedSectionObject);
		}
		return resultFiltered;
	}

	private processOrder(order: any, resultUnsorted: any[]): any[] {
		if (typeof order === "string") {
			return resultUnsorted.sort((element1, element2) => {
				return this.orderStringSortHelper(element1, element2, order);
			});
		} else {
			let resultSorted: any[] = resultUnsorted.sort((element1, element2) => {
				return this.orderObjectSortHelper(element1, element2, order);
			});
			if (order["dir"] === "DOWN") {
				resultSorted.reverse();
			}
			return resultSorted;
		}
	}

	private orderStringSortHelper(e1: any, e2: any, order: any): number {
		if (e1[order] > e2[order]) {
			return 1;
		} else if (e1[order] < e2[order]) {
			return -1;
		} else {
			return 0;
		}
	}

	private orderObjectSortHelper(e1: any, e2: any, order: any): number {
		let orderKeys = order["keys"];
		for (let key of orderKeys) {
			if (e1[key] > e2[key]) {
				return 1;
			} else if (e1[key] < e2[key]) {
				return -1;
			}
		}
		return 0; // corresponds to case where two elements are identical across all the order keys
	}
}
