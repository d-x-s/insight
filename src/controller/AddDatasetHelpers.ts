import JSZip from "jszip";
import {InsightDatasetKind, InsightError} from "./IInsightFacade";
import {SectionsData} from "./SectionsData";
import {Dataset} from "./Dataset";
import path from "path";
import fs from "fs";


export class AddDatasetHelpers {
	public fileDirectory: string;

	constructor() {
		this.fileDirectory = __dirname + "/../../data";
	}

	public loadAsyncHelper(zipFile: JSZip, dataToPush: Array<Promise<string>>): any {
		// TODO: expand to process "rooms" data
		let fileFolder = zipFile.folder("courses");
		if (fileFolder == null || fileFolder === undefined) {
			return new InsightError("InsightError: null file folder, could not load");
		}
		fileFolder.forEach((jsonFile) => {
			if (fileFolder == null || fileFolder === undefined) {
				return new InsightError("InsightError: null file folder, could not load");
			}
			let currFile = fileFolder.file(jsonFile);
			if (currFile == null) {
				return new InsightError("InsightError: current course being added is null");
			}
			dataToPush.push(currFile.async("text"));
		});
		return dataToPush;
	};

	// HELPER: parse passed in JSON file and convert into SectionData
	public parseJSON(arrayOfPromiseAllResults: string[]): any {
		let convertedSections: any = [];
		try {
			arrayOfPromiseAllResults.forEach((jsonPromise) => {
				let arrayOfSections = JSON.parse(jsonPromise)["result"];
				arrayOfSections.forEach((section: any) => {
					let mappedSection = this.mapToSectionDataFormat(section);
					convertedSections.push(mappedSection);
				});
			});
		} catch {
			return new InsightError("InsightError: could not parse JSON (invalid)");
		}
		return convertedSections;
	}

	// HELPER: Sets data to internal model and to disk
	public setDataToModelAndDisk(id: string, convertedSections: SectionsData[],
								  kind: InsightDatasetKind, content: string,
								 model: Map<string, Dataset>): Promise<string[]> {
		return new Promise<string[]>((resolve, reject) => {
			let newDataset: Dataset = {
				id: id,
				sectionData: convertedSections,
				kind: kind,
			};
			model.set(id, newDataset);
			let updateKeysAfterAdd: string[] = Array.from(model.keys());
			let datasetFile = path.join(this.fileDirectory, "/" + id + ".zip");
			try {
				fs.writeFile(datasetFile, content, "base64", (err) => {
					if (err) {
						reject(new InsightError("InsightError: could not write to file"));
					}
				});
			} catch {
				return new InsightError("InsightError: could not delete dataset");
			}
			return resolve(updateKeysAfterAdd);
		});
	}

	// HELPER: Convert JSON to SectionData format
	public mapToSectionDataFormat(rawSection: any) {
		let newSection        = {} as SectionsData;
		newSection.audit      = rawSection["Audit"];
		newSection.avg        = rawSection["Avg"];
		newSection.dept       = rawSection["Subject"];
		newSection.fail       = rawSection["Fail"];
		newSection.id         = rawSection["Course"];
		newSection.instructor = rawSection["Professor"];
		newSection.pass       = rawSection["Pass"];
		newSection.title      = rawSection["Title"];
		newSection.uuid       = String(rawSection["id"]);
		if (rawSection["Section"] === "overall") {
			newSection.year = 1900;
		} else {
			newSection.year = Number(rawSection["Year"]);
		}
		return newSection;
	}
}
