import {InsightDatasetKind, InsightError, InsightResult} from "../IInsightFacade";
import {IRoomDataset} from "./IRoomDataset";
import JSZip from "jszip";
// import parse5 from "parse5";
import {parse} from "parse5";
import {IRoomData} from "./IRoomData";
import {GeoLocation} from "./GeoLocation";
import path from "path";
import fs from "fs";

export default class RoomsHelper {

	public indexDirectory: string;
	public findLocation: GeoLocation;
	public internalIndex: any;
	public internalBuildings: any;
	public buildingListObject: {[key: string]: IRoomData};
	public fileDirectory: string;
	public datasetID: string;

	constructor(id: string) {
		this.indexDirectory = "index.htm";
		this.findLocation = new GeoLocation();
		this.internalIndex = [];
		this.internalBuildings = [];
		this.buildingListObject = {};
		this.fileDirectory = __dirname + "/../../data";
		this.datasetID = id;
	}

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
					return this.handleRoomProcessing(loadedZipFiles);
				}).then((result) => {
					// let processedResults = this.processResult(result);
					// console.log(processedResults);
					// CUT OUT OBJECTS WITH MISSING KEYS
					let filteredResult = result.filter((res) => {
						// console.log(Object.keys(res).length);
						let length: number = Object.keys(res).length;
						let lengthString = length.toString();
						if (lengthString === "11") {
							return true;
						} else {
							return false;
						}
					});
					// console.log(result);
					// console.log(filteredResult.length);
					resolve(this.setDataToModelAndDisk(id, filteredResult, kind, content, model));
				})
				.catch((err) => {
					reject(new InsightError("InsightError: failed to add" + err));
				});
		});
	}

	public processResult(result: any[]) {
		let retArray: any = [];

		result.forEach((room) => {
			let newRoom: any  = {};
			let objKeyArray = Object.keys(room);

			objKeyArray.forEach((key) => {
				let newKey = this.datasetID + "_" + key;
				newRoom[newKey] = room[key];
			});
			retArray.push(newRoom);
		});
		return retArray;
	}

	public handleRoomProcessing(zipped: JSZip): Promise<IRoomData[]> {
		return new Promise<IRoomData[]> ((resolve, reject) => {
			let indexHtmFile = zipped.file("index.htm");
			let parsedZip: any;
			if (indexHtmFile == null) {
				return new InsightError("file was null");
			}
			parsedZip = indexHtmFile.async("string").then((indexHtmFileContent) => {
				let parsedFileContentDocument = parse(indexHtmFileContent);
				for (let contentNode of parsedFileContentDocument.childNodes) {
					let currNodeName = contentNode.nodeName;
					if (currNodeName === "html") {
						this.indexHtmBuildingHelper(contentNode);
					}
				}
				return;
			}).catch((err) => {
				reject(new InsightError("unable to async" + err));
			});

			console.log("point 2.9 reached");
			Promise.all([parsedZip]).then(() => {
				console.log("point 3 reached");
				this.findLocation.processLatAndLong(this.buildingListObject)
					.then(() => {
						resolve(this.processRooms(zipped));
					}).catch((err) => {
						reject(new InsightError("ERROR: unable to process lat" + err));
					});
			});

		});
	}

	public processRooms(zipped: any): Promise<IRoomData[]> {
		return new Promise<IRoomData[]> ((resolve, reject) => {
			let dataToPush: Array<Promise<IRoomData>> = [];
			let fileFolder = zipped.folder("campus/discover/buildings-and-classrooms");
			if (fileFolder == null) {
				return new InsightError("InsightError: null file folder, could not load");
			}
			fileFolder.forEach((buildingPath: any, file: any) => {
				dataToPush.push(file.async("string")
					.then((result: any) => {
						let buildingPathNoHTM = buildingPath.split(".")[0];
						this.processRoomsHelper(this.buildingListObject[buildingPathNoHTM], parse(result));
					}).catch((err: any) => {
						reject(new InsightError("Unable to process room" + err));
					}));
			});
			Promise.all(dataToPush).then(() => {
				resolve(this.internalIndex);
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
		let newRoom = Object.assign({}, roomToAdd);
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
					newRoom.seats = Number(this.trimText(param));
				} else if (currAttrs === "views-field views-field-field-room-type") {
					newRoom.type = this.trimText(param);
				} else if (currAttrs === "views-field views-field-field-room-furniture") {
					newRoom.furniture = this.trimText(param);
				}
			}
		}
		this.internalIndex.push(newRoom);
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
				} else if (currName === "body" || currName === "div" || currName === "table"
					|| currName === "section") {
					this.indexHtmBuildingHelper(contentNodeChild);
				}
			}
		}
	}

	private convertIntoBuilding(child: any) {
		let newRoom: IRoomData = {} as IRoomData;
		for (let childNode of child.childNodes) {
			if (childNode.nodeName === "td") {
				let tempAttrs = childNode.attrs[0]["value"];
				if (tempAttrs === "views-field views-field-title") {
					for (let searchName of childNode.childNodes) {
						if (searchName.nodeName === "a") {
							if(searchName.attrs[1]["value"] === "Building Details and Map") {
								for (let searchNameChild of searchName.childNodes) {
									if (searchNameChild.nodeName === "#text") {
										let text = searchNameChild.value;
										// console.log("searchNameChild value be " + text);
										newRoom.fullname = text;
									}
								}
							}
						}
					}
				} else if (tempAttrs === "views-field views-field-field-building-code") {
					if (typeof this.trimText(childNode) === "string") {
						// console.log(this.trimText(childNode));
						newRoom.shortname = this.trimText(childNode);
					}
				} else if (tempAttrs === "views-field views-field-field-building-address") {
					newRoom.address = this.trimText(childNode);
				}
			}
		}
		if (newRoom.shortname != null) {
			this.internalBuildings.push(newRoom);
			this.buildingListObject[newRoom.shortname] = newRoom;
		};
	}

	private trimText(paramToTrim: any) {
		for (let paramChild of paramToTrim.childNodes) {
			if (paramChild.nodeName === "#text") {
				let trimmed = (paramChild).value.replace("\n", "").trim();
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
			// console.log("model");
			// console.log(model);
			model.set(id, newDataset);
			// console.log(model);
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
