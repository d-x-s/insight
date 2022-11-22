import {InsightDatasetKind, InsightError} from "../IInsightFacade";
import {IRoomDataset} from "./IRoomDataset";
import JSZip from "jszip";
import {parse} from "parse5";
import {IRoomData} from "./IRoomData";
import {GeoLocation} from "./GeoLocation";
import path from "path";
import fs from "fs";

export default class RoomsHelper {
	public indexDirectory: string;
	public findLocation: GeoLocation;
	public roomsList: any;
	public fileDirectory: string;
	public datasetID: string;
	protected kind: InsightDatasetKind;
	protected buildingsMap: Map<string, IRoomData>; // map of key:value pairs where the key is the building name and the value is an object with the building information

	constructor(id: string, kind: any) {
		this.datasetID = id;
		this.kind = kind;
		this.indexDirectory = "index.htm";
		this.fileDirectory = __dirname + "/../../data";
		this.findLocation = new GeoLocation();
		this.roomsList = [];
		this.buildingsMap = new Map();
	}

	public addRoomsDatasetToModel(
		id: string,
		content: string,
		kind: InsightDatasetKind,
		model: Map<string, IRoomDataset>
	): Promise<string[]> {
		let zipped: JSZip = new JSZip();
		return new Promise<string[]>((resolve, reject) => {
			zipped
				.loadAsync(content, {base64: true})
				.then((loadedZipFiles) => {
					return this.handleRoomProcessing(loadedZipFiles);
				})
				.then((result) => {
					if (result instanceof InsightError) {
						reject(new InsightError("InsightError: failed to add" + result));
					}
					let filteredResult = result.filter((res) => {
						// BUGNOTE
						let length: number = Object.keys(res).length;
						let lengthString = length.toString();
						return lengthString === "11";
					});
					resolve(this.setDataToModelAndDisk(id, filteredResult, kind, content, model));
				})
				.catch((err) => {
					reject(new InsightError("InsightError: failed to add" + err));
				});
		});
	}

	public handleRoomProcessing(zipped: JSZip): Promise<IRoomData[]> {
		return new Promise<IRoomData[]>((resolve, reject) => {
			let parsedZip: any;

			let indexHtmFile = zipped.file("index.htm");
			if (indexHtmFile !== null) {
				parsedZip = indexHtmFile
					.async("string")
					.then((indexHtmFileContent) => {
						let parsedFileContentDocument = parse(indexHtmFileContent);
						for (let contentNode of parsedFileContentDocument.childNodes) {
							let currNodeName = contentNode.nodeName;
							if (currNodeName === "html") {
								this.indexHtmBuildingHelper(contentNode);
							}
						}
					})
					.catch((err) => {
						reject(new InsightError("unable to async" + err));
					});
			} else {
				reject(new InsightError("file was null")); // BUGNOTE
			}

			// use square brackets to explicitly pass in parsedZip as object
			Promise.all([parsedZip]).then(() => {
				this.findLocation
					.setBuildingCoordinates(this.buildingsMap)
					.then(() => {
						resolve(this.processRooms(zipped));
					});
			});
		});
	}

	public processRooms(zipped: any): Promise<IRoomData[]> {
		return new Promise<IRoomData[]>((resolve, reject) => {
			let dataToPush: Array<Promise<IRoomData>> = [];
			let fileFolder = zipped.folder("campus/discover/buildings-and-classrooms"); // BUGNOTE
			if (fileFolder == null) {
				return new InsightError("InsightError: null file folder, could not load");
			}
			// for each building file
			// lookup the building in the buildingListObject (which is derived from Index.htm and is an Object of Objects)
			// then for that building Object, look up the associated building htm file (which is in buildings-and-classrooms directory)
			// traverse through that htm file, grabbing data for each room of the building and putting it into a newRoom object
			// combine the building Object (which contains general info) with the newRoom object
			// the result is a new result Object containing all 11 fields, representing a single room
			//
			// if you do this for all buildings and all their rooms, then you will end up with 364 entries in your dataset, each being a unique room
			fileFolder.forEach((buildingPath: any, file: any) => {
				dataToPush.push(
					file
						.async("string")
						.then((result: any) => {
							let buildingPathNoHTM = buildingPath.split(".")[0]; // BUGNOTE
							this.processRoomsHelper(this.buildingsMap.get(buildingPathNoHTM), parse(result));
						})
						.catch((err: any) => {
							reject(new InsightError("Unable to process room" + err));
						})
				);
			});
			Promise.all(dataToPush).then(() => {
				resolve(this.roomsList);
			});
		});
	}

	public processRoomsHelper(roomToProcess: any, res: any) {
		for (let resNode of res.childNodes) {
			if (resNode.nodeName === "html") {
				return this.addProcessedRooms(roomToProcess, resNode);
			}
		}
	}

	public addProcessedRooms(roomToAdd: any, res: any) {
		for (let child of res.childNodes) {
			let currName = child.nodeName;
			if (currName === "tbody") {
				for (let childLayer of child.childNodes) {
					if (childLayer.nodeName === "tr") {
						this.populateIRoomData(roomToAdd, childLayer);
					}
				}
			} else if (currName === "body" || currName === "div" || currName === "table" || currName === "section") {
				this.addProcessedRooms(roomToAdd, child);
			}
		}
	}

	public populateIRoomData(roomToAdd: any, node: any) {
		if (node === null) {
			return;
		}
		let newRoom = Object.assign({}, roomToAdd); // BUGNOTE
		for (let param of node.childNodes) {
			if (param.nodeName === "td") {
				let currAttrs = param.attrs[0]["value"];

				if (currAttrs === "views-field views-field-field-room-number") {
					let retrieveAttrs = {name: "", href: ""};
					let roomFullName = "";
					for (let paramChild of param.childNodes) {
						if (paramChild.nodeName === "a") {
							for (let t of paramChild.childNodes) {
								if (t.nodeName === "#text") {
									roomFullName = t.value;
								}
							}
							retrieveAttrs["name"] = roomFullName;
							retrieveAttrs["href"] = paramChild.attrs[0].value;
						}
					}
					newRoom.name = newRoom.shortname + "_" + roomFullName;
					newRoom.number = roomFullName;
					newRoom.href = retrieveAttrs["href"];
				} else if (currAttrs === "views-field views-field-field-room-capacity") {
					newRoom.seats = Number(this.trimText(param)); // BUGNOTE
				} else if (currAttrs === "views-field views-field-field-room-type") {
					newRoom.type = this.trimText(param);
				} else if (currAttrs === "views-field views-field-field-room-furniture") {
					newRoom.furniture = this.trimText(param);
				}
			}
		}
		this.roomsList.push(newRoom);
	}

	public indexHtmBuildingHelper(contentNode: any) {
		if (contentNode != null) {
			for (let contentNodeChild of contentNode.childNodes) {
				let currName = contentNodeChild.nodeName;
				if (currName === "tbody") {
					for (let tr of contentNodeChild.childNodes) {
						if (tr.nodeName === "tr") {
							this.convertIntoBuilding(tr);
						}
					}
				} else if (
					currName === "body" ||
					currName === "div" ||
					currName === "table" ||
					currName === "section"
				) {
					this.indexHtmBuildingHelper(contentNodeChild);
				}
			}
		}
	}

	private convertIntoBuilding(tr: any) {
		let newBuilding: IRoomData = {} as IRoomData;
		for (let childNode of tr.childNodes) {
			if (childNode.nodeName === "td") {
				let tempAttrs = childNode.attrs[0]["value"];
				if (tempAttrs === "views-field views-field-title") {
					for (let searchName of childNode.childNodes) {
						if (searchName.nodeName === "a") {
							if (searchName.attrs[1]["value"] === "Building Details and Map") {
								for (let searchNameChild of searchName.childNodes) {
									if (searchNameChild.nodeName === "#text") {
										let text = searchNameChild.value;
										newBuilding.fullname = text;
									}
								}
							}
						}
					}
				} else if (tempAttrs === "views-field views-field-field-building-code") {
					if (typeof this.trimText(childNode) === "string") {
						newBuilding.shortname = this.trimText(childNode);
					}
				} else if (tempAttrs === "views-field views-field-field-building-address") {
					newBuilding.address = this.trimText(childNode);
				}
			}
		}
		if (newBuilding.shortname != null) {
			this.buildingsMap.set(newBuilding.shortname, newBuilding);
		}
	}

	private trimText(paramToTrim: any) {
		for (let paramChild of paramToTrim.childNodes) {
			if (paramChild.nodeName === "#text") {
				let trimmed = paramChild.value.replace("\n", "").trim();
				return trimmed as string;
			}
		}
		return "";
	}

	private setDataToModelAndDisk(
		id: string,
		convertedRooms: IRoomData[],
		kind: InsightDatasetKind,
		content: string,
		model: Map<string, IRoomDataset>
	): Promise<string[]> {
		return new Promise<string[]>((resolve, reject) => {
			let newDataset: IRoomDataset = {
				id: id,
				data: convertedRooms,
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
