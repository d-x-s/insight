export default class TransformationsHelper {
	constructor() {
		console.log("Hello");
	}

	public transform(query: any, result: any[]): any {
		console.log(query["TRANSFORMATIONS"]);
	}
}

