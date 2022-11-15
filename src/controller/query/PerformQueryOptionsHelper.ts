import {InsightResult} from "../IInsightFacade";

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
		if (isTransformed) {
			// proceed directly
		}

		for (let r of rawResult) {
			const processedSectionObject: InsightResult = {};

			for (let c of columns) {
				if (isTransformed) {
					// TODO: cleanup
					// receive a map here
					// do map stuff
					// console.log("Transformed, don't do anything");
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

		// rawResult.forEach((r) => {

		// 	const processedSectionObject: InsightResult = {};
		// 	columns.forEach((c: string) => {

		// 		// TODO: HANDLE TRANSFORM KEYS
		// 		// if its transformed, TransformationsHelper should handle everything
		// 		// what we get back is a singular result object
		// 		// {

		// 		// 	"result": [{

		// 		// 		 "rooms_shortname": "OSBO",

		// 		// 		 "maxSeats": 442

		// 		// 	},  {

		// 		// 		"rooms_shortname": "HEBB",

		// 		// 		"maxSeats": 375

		// 		//    }, {

		// 		// 	   "rooms_shortname": "LSC",

		// 		// 	   "maxSeats": 350

		// 		//    }]

		// 		//   }
		// 		// you can return it right away
		// 		if (isTransformed) {
		// 			processedSectionObject[c] = r[c];
		// 		} else {
		// 			let columnPair = c.split("_");
		// 			let columnKey = columnPair[0];
		// 			let columnValue = columnPair[1];
		// 			processedSectionObject[c] = r[columnValue];
		// 		}
		// 	});
		// 	resultFiltered.push(processedSectionObject);
		// });
		// return resultFiltered;
	}

	private processOrder(order: any, resultUnsorted: any[]): any[] {
		// TODO: if ORDER is an object then we need a special type of sorting
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
