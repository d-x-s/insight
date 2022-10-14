import Utility from "../Utility";
import {Dataset} from "./Dataset";

export default class PerformQueryHelper {
	constructor() {
		Utility.log("initializing PerformQueryHelper", "trace");
	}

	public processFilter(query: any, data: Dataset | undefined): any[] {

		if (data === undefined) {
			throw Error("The dataset being queried on is undefined");
		}

		return [];
	}

	public processOptions(): any[] {
		return [];
	}
}
