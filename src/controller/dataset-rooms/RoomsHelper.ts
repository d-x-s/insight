import {InsightDatasetKind, InsightError, InsightResult} from "../IInsightFacade";
import {IRoomDataset} from "./IRoomDataset";
import JSZip from "jszip";
import parse5 from "parse5";
import {IRoomData} from "./IRoomData";
import {GeoLeocation} from "./GeoLocation";
import {ISectionData} from "../dataset-courses/ISectionData";
import {ICourseDataset} from "../dataset-courses/ICourseDataset";
import path from "path";
import fs from "fs";

export default class RoomsHelper {

	public indexDirectory: string;
	public findLocation: GeoLeocation;
	public internalIndex: any;
	public fileDirectory: string;

	constructor() {
		this.indexDirectory = "rooms/index.htm";
		this.findLocation = new GeoLeocation();
		this.internalIndex = {};
		this.fileDirectory = __dirname + "/../../data";
		console.log("Rooms Helper created");
	}

	// TODO!!!!!!!!!!!!!!!
	// please make RoomsHelper a mirror of CoursesHelper
	// note: remember that CoursesHelper used to be AddDatasetHelpers, which I have refactored
	// code duplication is OK
	// I think that if we mirror CoursesHelper and RoomsHelper, it will be far easier than adapting AddDatasetHelpers to accept both the Sections and Rooms kinds of datasets

	// think about this, if we have separate INTERNALMODELS then when we remove a dataset, we need to check both because an id does not encode the kind of dataset
	// but if we have separate datasets, then wheenver we add a new dataset, we need to check the other map so that the ids are unique across both
	// I think this is not intuitive and will add a lot of unneccesary checking logic
	// therefore we go with the string:any key value pair for our Map and this preserve the majority of our original code (OCP)

	// EFFECTS: After parsing, resolves id's of successfully pushed rooms
	// analogous to addCoursesDatasetToModel
	public addRoomsDatasetToModel(
		id: string,
		content: string,
		kind: InsightDatasetKind,
		model: Map<string, IRoomDataset>
	): Promise<string[]> {
		let zipped: JSZip = new JSZip();
		return new Promise<string[]> ((resolve, reject) => {
			zipped.loadAsync(content, {base64: true})
				.then((loadedZipFiles) => {
					console.log(loadedZipFiles);
					console.log("async done1");
					let temp = this.loadAsyncHelper(loadedZipFiles);
					console.log("bla");
					return temp;
				})
				.then((value: Array<Promise<string>> | InsightError) => {
					console.log("async done2");
					if (value instanceof InsightError) {
						return value;
					}
					if (value.length === 0) {
						reject(new InsightError("InsightError: empty directory"));
					}
					console.log("async done3");
					Promise.all(value)
						.then((arrayOfPromiseAllResults) => {
							return this.parseHtm(arrayOfPromiseAllResults);
						})
						.then((convertedRooms) => {
							resolve(this.setDataToModelAndDisk(id, convertedRooms, kind, content, model));
						});
				})
				.catch((err) => {
					reject(new InsightError("InsightError: failed to parse" + err));
				});
		});
	}

	private loadAsyncHelper(zipFiles: any): any {
		console.log("async done1.5");

		let dataToPush: Array<Promise<IRoomData>> = [];

		let fileFolder = zipFiles.folder("rooms").file("index.htm").async("string");
		console.log("fileFolder", fileFolder);
		if (fileFolder == null) {
			return new InsightError("InsightError: null file folder, could not load");
		}
		fileFolder.forEach((jsonFile: any) => {
			if (fileFolder == null || fileFolder === undefined) {
				return new InsightError("InsightError: null file folder, could not load");
			}
			let currFile = fileFolder.file(jsonFile);
			if (currFile == null) {
				return new InsightError("InsightError: current course being added is null");
			}
			dataToPush.push(currFile.async("text"));
		});

		console.log("data", dataToPush);
		return dataToPush;
	}

	public parseHtm(filesToParse: string[]): Promise<IRoomData[]> {

		console.log("Parse htm called");
		return new Promise<IRoomData[]> ((resolve, reject) => {

			filesToParse.forEach((jsonPromise) => {
				let parsedResult = parse5.parse(jsonPromise);
				let parsedResultToHTMLTable = this.processParsedResult(parsedResult);
				this.htmlIndexTable(parsedResultToHTMLTable);

				this.findLocation.processLatAndLong(this.internalIndex).then(() => {
					return resolve(parsedResultToHTMLTable);
				});
			});
		});
	}

	public processParsedResult(parsedResult: any): any {

		if (parsedResult["nodeName"] === "tbody" && this.verifyParsedResult(parsedResult)) {
			return parsedResult;
		}

		if (parsedResult["childNodes"].length === 0) {
			return;
		}

		let trackCurr = 0;
		while (trackCurr < parsedResult["childNodes"][trackCurr]) {
			let curr = this.processParsedResult(parsedResult["childNodes"][trackCurr]);
			if (curr) {
				return curr;
			}
			trackCurr += 1;
		}
	}

	public verifyParsedResult(parsedResult: any): boolean {
		parsedResult["childNodes"].forEach((node: any) => {
			if (node["nodeName"] === "tr") {
				node["childNodes"].forEach((nodeCell: any) => {
					if (nodeCell["nodeName"] === "td") {
						return true;
					}
				});
			}
		});
		return false;
	}

	// HELPER: Passes in htmlTable and creates table to populate internalIndex
	public htmlIndexTable(htmlTable: any) {
		htmlTable.forEach((row: any) => {
			if (row["nodeName"] === "tr") {
				let currRow: any;
				let address = "";
				row["childNodes"].forEach((cell: any) => {
					if (cell["attrs"].length > 0 && cell["nodeName"] === "td") {
						this.searchCell(cell, currRow);
						address = this.verifyAddress(cell, address);
					}
				});
				this.internalIndex[address] = {...currRow};
			}
		});
	}

	// HELPER: called to
	public searchCell(cell: any, row: any) {
		let allNames = "";

		cell["attrs"].forEach((singleAttr: any) => {
			if (singleAttr["name"] === "class") {
				allNames += singleAttr["value"];
			}
		});

		allNames.split(" ");

		let fullName: string = "";
		// check which index the name falls under
		if (allNames.indexOf("views-field-title")) {
			fullName = this.handleFieldTitle(cell);
		} else if (allNames.indexOf("views-field-field-building-code")) {
			this.handleFieldBuildingCode(cell, row);
		}

		row["fullname"] = fullName;
	}

	public handleFieldTitle(cell: any): string {
		cell["childNodes"].forEach((singleCell: any) => {
			if (singleCell["nodeName"] === "a") {
				singleCell["childNodes"].forEach((childNode: any) => {
					if (childNode["nodeName"] === "#text") {
						return childNode["value"];
					}
				});
			}
		});
		return "";
	}

	public handleFieldBuildingCode(cell: any, row: any) {
		row["shortname"] = cell["childNodes"][0]["value"].trim();
	}

	// HELPER
	public verifyAddress(cell: any, address: string): string {

		let allValidAttrs = "";

		cell["attrs"].forEach((singleAttr: any) => {
			if (singleAttr["name"] === "class") {
				allValidAttrs += singleAttr["value"];
			}
		});

		allValidAttrs.split(" ");

		if (allValidAttrs.indexOf("views-field-field-building-address") > -1) {
			return cell["childNodes"][0]["value"].trim();
		}
		return address;
	}

	// HELPER:
	public getRoomsFromParsedData(parsedData: IRoomData[]) {
		// empty comment
	}


	// // HELPER: parse passed in JSON file and convert into SectionData
	// private parseJSON(arrayOfPromiseAllResults: string[]): any {
	// 	let convertedSections: any = [];
	// 	try {
	// 		arrayOfPromiseAllResults.forEach((jsonPromise) => {
	// 			let arrayOfSections = JSON.parse(jsonPromise)["result"];
	// 			arrayOfSections.forEach((section: any) => {
	// 				let mappedSection = this.mapToSectionDataFormat(section);
	// 				convertedSections.push(mappedSection);
	// 			});
	// 		});
	// 	} catch {
	// 		return new InsightError("InsightError: could not parse JSON (invalid)");
	// 	}
	// 	return convertedSections;
	// }
	//
	// HELPER: Sets data to internal model and to disk
	private setDataToModelAndDisk(
		id: string,
		convertedSections: IRoomData[],
		kind: InsightDatasetKind,
		content: string,
		model: Map<string, IRoomDataset>
	): Promise<string[]> {
		return new Promise<string[]>((resolve, reject) => {
			let newDataset: IRoomDataset = {
				id: id,
				roomsData: convertedSections,
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


}
