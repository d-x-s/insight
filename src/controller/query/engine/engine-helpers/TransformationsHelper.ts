import Decimal from "decimal.js";
import {InsightResult} from "../../../IInsightFacade";

export default class TransformationsHelper {
	constructor() {
		/**/
	}

	public transform(query: any, rawResult: any[]): any[] {
		let transformationsObject = query["TRANSFORMATIONS"];
		let optionsObject = query["OPTIONS"];
		let group = transformationsObject["GROUP"];
		let apply = transformationsObject["APPLY"];

		let groupedResult = this.processGroup(group, rawResult);
		let appliedResult = this.processApply(apply, groupedResult, optionsObject);

		return appliedResult;
	}

	/*
	Optimization Idea:
	It would be an interesting challenge to encode the values of the group key fields
	of each dataObject as the key of the map itself
	Then when we need to match a new dataObject to a group, we can extract a key
	from the values of the dataObject and check if it is the key for some existing
	group in the map; otherwise create a new group based on that key

	At the moment keys are set as integers from 0 to X groups, so we have to waste
	time traversing the list of the map keys each time
	*/
	private processGroup(groupVariablesArray: any[], rawResult: any[]): any {
		let mapOfGroups = new Map();
		let indexForNewGroup = 0;
		for (const dataObject of rawResult) {
			try {
				let groupKey = this.findGroup(dataObject, mapOfGroups, groupVariablesArray);
				mapOfGroups.get(groupKey).push(dataObject);
			} catch (groupNotFound) {
				let emptyGroup: any[] = [];
				mapOfGroups.set(indexForNewGroup, emptyGroup);
				mapOfGroups.get(indexForNewGroup).push(dataObject);
				indexForNewGroup++;
			}
		}
		return mapOfGroups;
	}

	private findGroup(dataObject: any, mapOfGroups: any, groupVariablesArray: any) {
		for (const [groupKey, group] of mapOfGroups) {
			if (this.isMatchingGroup(dataObject, group[0], groupVariablesArray)) {
				return groupKey;
			}
		}
		throw new Error("group was not found");
	}

	private isMatchingGroup(dataObject: any, groupMember: any, groupVariablesArray: any): boolean {
		for (let key of groupVariablesArray) {
			let keyString = String(key.split("_")[1]);
			if (dataObject[keyString] !== groupMember[keyString]) {
				return false;
			}
		}
		return true;
	}

	private processApply(applyArray: any[], mapOfGroups: any, optionsObject: any): any {
		let resultApplied: any[] = [];
		let columns = optionsObject["COLUMNS"];

		let applyTokens: any[] = [];
		applyArray.forEach((applyRule) => {
			applyTokens.push(Object.keys(applyRule)[0]);
		});

		for (const [groupKey, group] of mapOfGroups) {
			const processedDataObject: InsightResult = {};
			for (let column of columns) {
				let field = column.split("_")[1];
				if (applyTokens.includes(column)) {
					let applyRule: any = applyArray.find((element) => Object.keys(element)[0] === column);
					let applyRuleInnerObject: any = Object.values(applyRule)[0];
					let applyKey: any = Object.keys(applyRuleInnerObject)[0];
					let applyID: any = Object.values(applyRuleInnerObject)[0];
					let applyIDSplit: any = applyID.split("_")[1];

					let appliedResult = this.computeAppliedKeyForSingleGroup(applyKey, applyIDSplit, group);
					if (appliedResult === -1) {
						throw new Error("invalid apply key was encountered");
					}
					processedDataObject[column] = appliedResult;
				} else {
					processedDataObject[column] = group[0][field];
				}
			}
			resultApplied.push(processedDataObject);
		}
		return resultApplied;
	}

	private computeAppliedKeyForSingleGroup(apply: string, key: string, group: any): number {
		switch (apply) {
			case "MAX": {
				let maxAccumulator: number = group[0][key];
				for (let element of group) {
					if (element[key] > maxAccumulator) {
						maxAccumulator = element[key];
					}
				}
				return maxAccumulator;
			}
			case "MIN": {
				let minAccumulator: number = group[0][key];
				for (let element of group) {
					if (element[key] < minAccumulator) {
						minAccumulator = element[key];
					}
				}
				return minAccumulator;
			}
			case "AVG": {
				let total: Decimal = new Decimal(0);
				for (let element of group) {
					total = total.add(new Decimal(element[key]));
				}
				let avg: number = total.toNumber() / group.length;
				return Number(avg.toFixed(2));
			}
			case "SUM": {
				let sum: Decimal = new Decimal(0);
				for (let element of group) {
					sum = sum.add(new Decimal(element[key]));
				}
				return Number(sum.toFixed(2));
			}
			case "COUNT": {
				let uniqueFields: any[] = [];
				for (let element of group) {
					if (!uniqueFields.includes(element[key])) {
						uniqueFields.push(element[key]);
					}
				}
				return uniqueFields.length;
			}
			default:
				return -1;
		}
	}
}
