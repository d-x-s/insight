export default class TransformationsHelper {
	constructor() {
		console.log("Hello");
	}

	public transform(query: any, rawResult: any[]): any {
		let transformationsObject = query["TRANSFORMATIONS"];
		let group = transformationsObject["GROUP"];
		let apply = transformationsObject["APPLY"];

		let groupedResult = this.processGroup(group, rawResult);
		let appliedResult = this.processApply(apply, groupedResult);

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
		for (const[groupKey, group] of mapOfGroups) {
			if (this.isMatchingGroup(dataObject, group[0], groupVariablesArray)) {
				return groupKey;
			}
			throw new Error("group was not found");
		}
	}

	private isMatchingGroup(dataObject: any, groupMember: any, groupVariablesArray: any): boolean {
		for (let key of groupVariablesArray) {
			if (dataObject[key] !== groupMember[key]) {
				return false;
			}
		}

		return true;
	}

	private processApply(applyArray: any[], rawResult: any[]): any {
		// stub
	}
}

