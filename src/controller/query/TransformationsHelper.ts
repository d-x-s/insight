import Decimal from "decimal.js";
import {InsightResult} from "../IInsightFacade";

export default class TransformationsHelper {
	constructor() {
		// console.log("Hello");
	}

	public transform(query: any, rawResult: any[]): any[] {
		let transformationsObject = query["TRANSFORMATIONS"];
		let optionsObject = query["OPTIONS"];
		let group = transformationsObject["GROUP"];
		let apply = transformationsObject["APPLY"];

		let groupedResult = this.processGroup(group, rawResult);
		// console.log(groupedResult);
		// console.log(groupedResult.keys());
		let appliedResult = this.processApply(apply, groupedResult, optionsObject);

		return appliedResult;
	}


	/*
	TODO:
	ideally, we want to encode the fields of interest as the key itsel, allowing for quick map lookup times
	currently I am using the most convenient method of iterating over the map of groups each time, searching for a match
	we group based on certain keys
	then of course in each group, for those keys, all members will have the same values
	these values could be encoded directly as our key
	by setting it to an object, then using stringify, and using that object string as a key
	then this unique object string identifies that group
	this would speed up search considerably
	however there may be a learning curve associated with this implementation so I choose to do it the easier way for now
	*/
	private processGroup(groupVariablesArray: any[], rawResult: any[]): any {
		let mapOfGroups = new Map();
		console.log(mapOfGroups);
		let indexForNewGroup = 0;
		for (const dataObject of rawResult) {
			try {
				let groupKey = this.findGroup(dataObject, mapOfGroups, groupVariablesArray);
				// console.log(groupKey);
				mapOfGroups.get(groupKey).push(dataObject);
			} catch (groupNotFound) {
				// console.log("group not found so make a new group");
				let emptyGroup: any[] = [];
				mapOfGroups.set(indexForNewGroup, emptyGroup);
				mapOfGroups.get(indexForNewGroup).push(dataObject);
				indexForNewGroup++;
			}
		}
		// console.log(indexForNewGroup);
		// console.log(mapOfGroups);
		return mapOfGroups;
	}

	private findGroup(dataObject: any, mapOfGroups: any, groupVariablesArray: any) {
		for (const[groupKey, group] of mapOfGroups) {
			if (this.isMatchingGroup(dataObject, group[0], groupVariablesArray)) {
				return groupKey;
			}
		}
		throw new Error("group was not found");
	}

	private isMatchingGroup(dataObject: any, groupMember: any, groupVariablesArray: any): boolean {
		// console.log("groupVariablesARray looks like " + groupVariablesArray);
		for (let key of groupVariablesArray) {
			// console.log("a key of group variables array: " + key);
			// console.log(String(key.split("_")[1]));
			let keyString = String(key.split("_")[1]);
			// console.log(dataObject);
			// console.log(groupMember);
			// console.log(dataObject[keyString]);
			// console.log(groupMember[keyString]);
			if (dataObject[keyString] !== groupMember[keyString]) {
				// console.log("No match");
				return false;
			}
		}

		// console.log("it is a match");
		return true;
	}

	// TODO: finish apply by doing the APPLY operation on each value (an array) of the map
	// transform into list of results (unsorted) given the APPLY and COLUMNS
	private processApply(applyArray: any[], mapOfGroups: any, optionsObject: any): any {
		console.log("ENTERED PROCESS APPLY");
		let resultApplied: any[] = [];
		let columns = optionsObject["COLUMNS"];

		let applyTokens: any[] = [];
		// for (let applyRule in applyArray) {
		// 	let applyKey = Object.keys(applyRule)[0];
		// 	applyTokens.push(applyKey);
		// }
		applyArray.forEach((applyRule) => {
			// console.log(applyRule);
			applyTokens.push(Object.keys(applyRule)[0]);
		});
		// console.log("applyTokens looks like" + applyTokens);

		for (const[groupKey, group] of mapOfGroups) {
			const processedDataObject: InsightResult = {};
			for (let column of columns) {
				let field = column.split("_")[1];
				if (applyTokens.includes(column)) {
					// console.log("applyToken is being computed");
					let applyRule: any = applyArray.find((element) => (Object.keys(element)[0] === column));
					let applyRuleInnerObject: any = Object.values(applyRule)[0];
					let applyKey: any = Object.keys(applyRuleInnerObject)[0];
					let applyID: any = Object.values(applyRuleInnerObject)[0];
					let applyIDSplit: any = applyID.split("_")[1];
					// console.log("the apply key is " + applyKey);
					// console.log("tje field is " + field);
					// console.log("the applyIDSplit is " + applyIDSplit);
					processedDataObject[column] = this.computeAppliedKeyForSingleGroup(applyKey, applyIDSplit, group);
				} else {
					processedDataObject[column] = group[0][field];
				}
			}
			// console.log(processedDataObject);
			resultApplied.push(processedDataObject);
		}
		return resultApplied;
	}

	private computeAppliedKeyForSingleGroup(apply: string, key: string, group: any): number {
		// console.log(apply);
		switch(apply) {
			// MIN/MAX should return the same number that is in the originating dataset.
			case "MAX": {
				let maxAccumulator: number = group[0][key];
				for (let element of group) {
					if (element[key] > maxAccumulator) {
						maxAccumulator = element[key];
					}
				}
				return maxAccumulator;
			}
			// MIN/MAX should return the same number that is in the originating dataset.
			case "MIN": {
				let minAccumulator: number = group[0][key];
				for (let element of group) {
					if (element[key] < minAccumulator) {
						minAccumulator = element[key];
					}
				}
				return minAccumulator;
			}
			/*
			Convert your each value to Decimal (e.g., new Decimal(num)).
			Add the numbers being averaged using Decimal's .add() method (e.g., building up a variable called total).
			Calculate the average (let avg = total.toNumber() / numRows).  numRows should not be converted to Decimal.
			Round the average to the second decimal digit with toFixed(2) and cast the result back to number type (let res = Number(avg.toFixed(2)))1.
			*/
			case "AVG": {
				let total: Decimal = new Decimal(0);
				for (let element of group) {
					total = total.add(new Decimal(element[key]));
				}
				let avg: number = total.toNumber() / group.length;
				return Number(avg.toFixed(2));
			}
			// SUM should return a number rounded to two decimal places using Number(sum.toFixed(2))1.
			case "SUM": {
				let sum: Decimal = new Decimal(0);
				for (let element of group) {
					sum = sum.add(new Decimal(element[key]));
				}
				return Number(sum.toFixed(2));
			}
			// COUNT should return whole numbers.
			// Count the number of unique occurrences of a field. For both numeric and string fields.
			case "COUNT": {
				let uniqueFields: any[] = [];
				for (let element of group) {
					if (!uniqueFields.includes(element[key])) {
						uniqueFields.push(element[key]);
					}
				}
				return uniqueFields.length;
			}
			default: return -1;
		}
	}
}

