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
	GROUP: Group the list of results into sets by some matching criteria.
	First, note that WHERE is completely independent of GROUP/APPLY.  WHERE filtering happens first, then GROUP/APPLY are performed on those filtered results.\

	GROUP: [term1, term2, ...] signifies that a group should be created for every unique set of all N-terms.
	For example, GROUP: [sections_dept, sections_id] would create a group for every unique (department, id) pair in the sections dataset.
	Every member of a group will always have the same values for each key in the GROUP array (e.g. in the previous example, all members of a group would share the same values for sections_dept and sections_id).

	How can I group an array of objects by key?
	https://stackoverflow.com/questions/40774697/how-can-i-group-an-array-of-objects-by-key
	Why are you passing Object.create(null)?

	How to group an array of objects through a key using Array reduce in javascript:
	https://learnwithparam.com/blog/how-to-group-by-array-of-objects-using-a-key/
	> it creates an empty object without prototypes
	> empty object is the initial value for result object

	Regarding maps: https://github.com/microsoft/TypeScript/issues/41045
	*/

	/*
		TODO: ideally, we want to encode the fields of interest as the key itsel, allowing for quick map lookup times
		currently I am using the most convenient method of iterating over the map of groups each time, searching for a match
		we group based on certain keys
		then of course in each group, for those keys, all members will have the same values
		these values could be encoded directly as our key
		by setting it to an object, then using stringify, and using that object string as a key
		then this unique object string identifies that group
		this would speed up search considerably
		however there may be a learning curve associated with this implementation so I choose to do it the easier way for now
	*/
	private processGroup(groupArray: any[], rawResult: any[]): any {
		// create a 2D array (an array of arrays), call this "groupedResult"
		// that is, each element is an array of sections/rooms
		// therefore each element in the array represents a unique group

		// iterate over rawResult, examining each section (note we will traverse rawResult only once, so it is O(n))
		// given GROUPS and its keys, look at the corresponding keys in the section
		// Does the section match an existing group? If so add it to that group
		// Otherwise, the section does not match any existing group. Add a new element (a group) to groupedResult

		// internalModel: Map<string, any>;
		// let groupedResultMap: Map<number, any[]> = new Map();
		// let groupedResult: any[][] = [];

				// create new group and add the result element to it
				// groupedResult[indexForNewGroup] = [];
				// groupedResult[indexForNewGroup].push(dataObject);
				// indexForNewGroup++;

				// let groupKeyObject = {};
				// let emptyGroup: any[] = [];
				// for (let key of groupArray) {
				// 	groupKeyObject[key] = 0; // assign to a dummy value
				// }

		let mapOfGroups = new Map();
		let indexForNewGroup = 0; // the first group will be created at index 0, the next at index 1, and so on
		for (const dataObject of rawResult) {
			try {
				let groupKey = this.findGroup(dataObject, mapOfGroups, groupArray);
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

	private findGroup(dataObject: any, mapOfGroups: any, groupArray: any) {
		for (const[groupKey, group] of mapOfGroups) {
			if (this.isMatchingExistingGroup(dataObject, group[0], groupArray)) {
				return groupKey; // obtain the groupKey of the group the dataObject belongs in, you will add the datasetObject to the group above
			};
		}
		throw new Error("group was not found");
	}

	private isMatchingExistingGroup(dataObject: any, groupMember: any, groupArray: any): boolean {
		for (let key of groupArray) {
			if (dataObject[key] !== groupMember[key]) {
				return false;
			}
		}
		// then you have a match between the fields of the dataObject and a member of some group
		// this means you should add that datasetObject to the group
		return true;
	}

	/*
	APPLY: Perform calculations across a set of results (ie. across a GROUP).
	MAX: Find the maximum value of a field. For numeric fields only.
	MIN: Find the minimum value of a field. For numeric fields only.
	AVG: Find the average value of a field. For numeric fields only.
	SUM: Find the sum of a field. For numeric fields only.
	COUNT: Count the number of unique occurrences of a field. For both numeric and string fields.
	*/
	private processApply(applyArray: any[], rawResult: any[]): any {
		// stub
	}
}

