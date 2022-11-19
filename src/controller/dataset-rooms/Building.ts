

export class Building {

	constructor() {
		// console.log("building created");
	}

	public addBuildingToModel(building: any, cell: any) {

		if (cell["childNodes"].length === 0 || cell["attrs"].length === 0) {
			return;
		}

		let allNames = "";

		cell["attrs"].forEach((singleAttr: any) => {
			if (singleAttr["name"] === "class") {
				allNames += singleAttr["value"];
			}
		});

		// TODO: Handle difference cases here

	};
}
