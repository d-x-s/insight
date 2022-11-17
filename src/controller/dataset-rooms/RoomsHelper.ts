import {InsightDatasetKind, InsightError, InsightResult} from "../IInsightFacade";
import {IRoomDataset} from "./IRoomDataset";
import JSZip from "jszip";
import parse5 from "parse5";
import {IRoomData} from "./IRoomData";
import {GeoLeocation} from "./GeoLocation";

export default class RoomsHelper {

	public indexDirectory: string;
	public findLocation: GeoLeocation;
	public internalIndex: any;

	constructor() {
		this.indexDirectory = "rooms/index.htm";
		this.findLocation = new GeoLeocation();
		this.internalIndex = {};
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

		return new Promise<string[]> ((resolve, reject) => {
			let newRoom: IRoomDataset = {
				id: id,
				roomsData: [],
				kind: kind,
			};
			this.parseRoom(content).then((result) => {
				newRoom.roomsData = result;
				model.set(id, newRoom);
				let updateKeysAfterAdd: string[] = Array.from(model.keys());
				resolve(updateKeysAfterAdd);
			}).catch((err: any) => {
				reject(new InsightError("Error unable to parse room dataset"));
			});
		});
	}

	public parseRoom(content: string): Promise<IRoomData[]> {
		return new Promise((resolve, reject) => {
			JSZip.loadAsync(content, {base64: true})
				.then((result) => {
					this.parseHtm(result)
						.then((parsed) => {
							this.getRoomsFromParsedData(parsed);
							resolve(parsed);
						}).catch((err) => {
							reject(new InsightError("ERROR: Unable to parse Htm document"));
						});
				}).catch((err) => {
					reject(new InsightError("Error: Error while trying to parse Htm document"));
				});
		});

		return Promise.reject(new InsightError("ERROR: "));
	}

	public parseHtm(zipped: JSZip): Promise<IRoomData[]> {

		return new Promise<IRoomData[]> ((resolve, reject) => {

			let rawData = zipped.file(this.indexDirectory);

			if (rawData == null || rawData === undefined) {
				return new InsightError("ERROR: rawData was empty or undefined");
			}

			rawData.async("string").then((result) => {
				let parsedResult = parse5.parse(result);
				let parsedResultToHTMLTable = this.processParsedResult(parsedResult);
				this.htmlIndexTable(parsedResultToHTMLTable);

				// TODO: Finish GeoLocation function below
				this.findLocation.processLatAndLong(this.internalIndex).then(() => {
					return resolve(parsedResultToHTMLTable);
				});
			}).catch((err) => {
				reject(new InsightError("ERROR: could not parse Htm" + err));
			});

		});

	}

	public processParsedResult(parsedResult: any): any {

		if (parsedResult["nodeName"] === "tbody") {
			if (this.verifyParsedResult(parsedResult)) {
				return parsedResult;
			}
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

}
