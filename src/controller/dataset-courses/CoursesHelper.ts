import JSZip from "jszip";
import {InsightDatasetKind, InsightError} from "../IInsightFacade";
import {ISectionData} from "./ISectionData";
import {ICourseDataset} from "./ICourseDataset";
import path from "path";
import fs from "fs";

export class CoursesHelper {
	public fileDirectory: string;

	constructor() {
		this.fileDirectory = __dirname + "/../../data";
	}

	// HELPER: Called by addDataset to handle parsing and adding dataset to model
	public addCoursesDatasetToModel(
		id: string,
		content: string,
		kind: InsightDatasetKind,
		model: Map<string, ICourseDataset>
	): Promise<string[]> {
		let zipped: JSZip = new JSZip();
		return new Promise<string[]>((resolve, reject) => {
			let dataToProcess: Array<Promise<string>> = [];
			zipped
				.loadAsync(content, {base64: true})
				.then((loadedZipFile) => {
					return this.loadAsyncHelper(loadedZipFile, dataToProcess);
				})
				.then((value: Array<Promise<string>> | InsightError) => {
					if (value instanceof InsightError) {
						return value;
					}
					if (value.length === 0) {
						reject(new InsightError("InsightError: empty directory"));
					}
					Promise.all(value)
						.then((arrayOfPromiseAllResults) => {
							return this.parseJSON(arrayOfPromiseAllResults);
						})
						.then((convertedSections) => {
							resolve(this.setDataToModelAndDisk(id, convertedSections, kind, content, model));
						});
				})
				.catch((err) => {
					reject(new InsightError("InsightError: failed to parse" + err));
				});
		});
	}

	private loadAsyncHelper(zipFile: JSZip, dataToPush: Array<Promise<string>>): any {
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
	}

	// HELPER: parse passed in JSON file and convert into SectionData
	private parseJSON(arrayOfPromiseAllResults: string[]): any {
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
	private setDataToModelAndDisk(
		id: string,
		convertedSections: ISectionData[],
		kind: InsightDatasetKind,
		content: string,
		model: Map<string, ICourseDataset>
	): Promise<string[]> {
		return new Promise<string[]>((resolve, reject) => {
			let newDataset: ICourseDataset = {
				id: id,
				data: convertedSections,
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
	private mapToSectionDataFormat(rawSection: any) {
		let newSection = {} as ISectionData;

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
			newSection.year   = 1900;
		} else {
			newSection.year   = Number(rawSection["Year"]);
		}

		return newSection;
	}
}
