import {SectionsData} from "./SectionsData";

export class SectionConverter {
	constructor() {
		console.log("section converter created");
	};

	public convertToSectionFormat(x: any) {
		let newSection = {} as SectionsData;
		newSection.audit = x["Audit"];
		newSection.avg = x["Avg"];
		newSection.dept = x["Subject"];
		newSection.fail = x["Fail"];
		newSection.id = x["Course"];
		newSection.instructor = x["Professor"];
		newSection.pass = x["Pass"];
		newSection.title = x["Title"];
		newSection.uuid = String(x["id"]);
		if (x["Section"] === "overall") {
			newSection.year = 1900;
		} else {
			newSection.year = Number(x["Year"]);
		}
		return newSection;
	}
}
