import {InsightDatasetKind, InsightError, InsightResult} from "../IInsightFacade";
import {IRoomDataset} from "./IRoomDataset";
import JSZip from "jszip";
import parse5 from "parse5";
import {IRoomData} from "./IRoomData";
import {GeoLeocation} from "./GeoLocation";
import path from "path";
import fs from "fs";

export default class RoomsHelper {

	public indexDirectory: string;
	public findLocation: GeoLeocation;
	public internalIndex: any;
	public internalRooms: {[key: string]: IRoomData};
	public fileDirectory: string;

	constructor() {
		this.indexDirectory = "rooms/index.htm";
		this.findLocation = new GeoLeocation();
		this.internalIndex = [];
		this.internalRooms = {};
		this.fileDirectory = __dirname + "/../../data";
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
					resolve(this.setDataToModelAndDisk(id, result, kind, content, model));
				})
				.catch((err) => {
					reject(new InsightError("InsightError: failed to add" + err));
				});
		});
	}

	public handleRoomProcessing(zipped: JSZip): Promise<IRoomData[]> {
		return new Promise<IRoomData[]> ((resolve, reject) => {
			let file = zipped.file(this.indexDirectory);
			let parsedZip: any;
			if (file == null) {
				return new InsightError("file was null");
			}
			parsedZip = file.async("string").then((fileContent) => {
				let parsedFileContent = parse5.parse(fileContent);
				for (let contentNode of parsedFileContent.childNodes) {
					let currNodeName = contentNode.nodeName;
					if (currNodeName === "html") {
						this.parseNodeChildren(currNodeName);
					}
				}
			});

			Promise.all([parsedZip]).then(() => {
				this.findLocation.processLatAndLong(this.internalRooms)
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
			let fileFolder = zipped.folder("rooms/campus/discover/buildings-and-classrooms");

			if (fileFolder == null) {
				return new InsightError("InsightError: null file folder, could not load");
			}
			fileFolder.forEach((buildingPath: any, file: any) => {
				dataToPush.push(file.async("string")
					.then((result: any) => {
						this.processRoomsHelper(buildingPath, parse5.parse(result));
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
		for (let resNode of res) {
			if (resNode.nodeName === "html") {
				return this.addProcessedRooms(roomToProcess, resNode);
			}
		}
	}

	public addProcessedRooms(roomToAdd: any, res: any) {
		for (let child of res) {
			if (child.nodeName === "tbody") {
				for (let childLayer of child.childNodes) {
					if (childLayer.nodeName === "tr") {
						this.populateIRoomData(roomToAdd, childLayer);
					}
				}
			} else if (child.nodeName === "section") {
				this.processRoomsHelper(roomToAdd, child);
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
					for (let paramChild of param) {
						if (paramChild.nodeName === "a") {
							for (let t of paramChild) {
								if (t.nodeName === "#text") {
									roomFullName = t.value;
								}
							}
							retrieveAttrs["name"] = roomFullName;
							retrieveAttrs["href"] = paramChild.attrs[0].value;
						}
					}
					newRoom.name = roomFullName;
				} else if (currAttrs === "views-field views-field-field-room-capacity") {
					newRoom.seats = this.trimText(param);
				} else if (currAttrs === "views-field views-field-field-room-type") {
					newRoom.type = this.trimText(param);
				} else if (currAttrs === "views-field views-field-field-room-furniture") {
					newRoom.furniture = this.trimText(param);
				}
			}
		}
		return newRoom;
	}


	public parseNodeChildren(contentNode: any) {
		if (contentNode == null) {
			return;
		}
		let newRoom: IRoomData = {} as IRoomData;
		for (let contentChildNode of contentNode.childNodes) {
			if (contentChildNode.nodeName === "section") {
				this.parseNodeChildren(contentChildNode);
			} else if (contentChildNode.nodeName === "tbody") {
				for (let child of contentChildNode.childNodes) {
					if (child.nodeName === "tr") {
						this.convertIntoBuilding(child, newRoom);
					}
				}
			}
		}
	}

	private convertIntoBuilding(child: any, newRoom: IRoomData) {
		for (let childNode of child) {
			if (childNode.nodeName === "td") {
				let tempAttrs = childNode.attrs[0]["value"];
				if (tempAttrs === "views-field views-field-title") {
					for (let searchName of childNode.childNodes) {
						if (searchName.nodeName === "a") {
							for (let searchNameChild of searchName.nodeName) {
								if (searchNameChild.nodeName === "#text") {
									newRoom.fullname = (searchNameChild).value as string;
								}
							}
						}
					}
				} else if (tempAttrs === "views-field views-field-field-building-code") {
					newRoom.shortname = this.trimText(tempAttrs);
				} else if (tempAttrs === "views-field views-field-field-building-address") {
					newRoom.address = this.trimText(tempAttrs);
				}
			}
		}
	}

	private trimText(paramToTrim: any) {
		for (let paramChild of paramToTrim) {
			if (paramChild.nodeName === "#text") {
				let trimmed = (paramToTrim).value.replace("\n", "").trim();
				return trimmed as string;
			}
		}
		return "";
	}

	// HELPER: Sets data to internal model and to disk
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
				roomsData: convertedRooms,
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
