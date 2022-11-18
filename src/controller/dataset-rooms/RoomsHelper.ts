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
	public internalRooms: {[key: string]: IRoomData};
	public fileDirectory: string;

	constructor() {
		this.indexDirectory = "index.htm";
		this.findLocation = new GeoLocation();
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
		// console.log("1");
		return new Promise<string[]> ((resolve, reject) => {
			zipped.loadAsync(content, {base64: true})
				.then((loadedZipFiles) => {
					// console.log("point 1 reached loaded zipfiles" + loadedZipFiles);
					return this.handleRoomProcessing(loadedZipFiles);
				}).then((result) => {
					// console.log("result IroomData", result);
					console.log("result Iroomdata", result);
					resolve(this.setDataToModelAndDisk(id, result, kind, content, model));
				})
				.catch((err) => {
					reject(new InsightError("InsightError: failed to add" + err));
				});
		});
	}

	public handleRoomProcessing(zipped: JSZip): Promise<IRoomData[]> {
		return new Promise<IRoomData[]> ((resolve, reject) => {
			let file = zipped.file("index.htm");
			let parsedZip: any;
			if (file == null) {
				return new InsightError("file was null");
			}
			// console.log("point 2 reached");
			parsedZip = file.async("string").then((fileContent) => {
				// console.log("point 2.5 reached");
				let parsedFileContent = parse(fileContent);
				// console.log("point 2.6 reached");
				for (let contentNode of parsedFileContent.childNodes) {
					let currNodeName = contentNode.nodeName;
					if (currNodeName === "html") {
						this.parseNodeChildren(contentNode);
					}
				}
				// console.log("good");
				return;
			}).catch((err) => {
				reject(new InsightError("unable to async" + err));
			});

			// console.log("point 2.9 reached");
			Promise.all([parsedZip]).then(() => {
				// console.log("point 3 reached");
				this.findLocation.processLatAndLong(this.internalRooms)
					.then(() => {
						// console.log("point 4 reached");
						// console.log(zipped);
						resolve(this.processRooms(zipped));
					}).catch((err) => {
						reject(new InsightError("ERROR: unable to process lat" + err));
					});
			});

		});
	}

	public processRooms(zipped: any): Promise<IRoomData[]> {
		return new Promise<IRoomData[]> ((resolve, reject) => {
			// console.log("point 5");
			let dataToPush: Array<Promise<IRoomData>> = [];
			let fileFolder = zipped.folder("campus/discover/buildings-and-classrooms");

			if (fileFolder == null) {
				return new InsightError("InsightError: null file folder, could not load");
			}
			// console.log("point 5.5");

			fileFolder.forEach((buildingPath: any, file: any) => {
				// console.log("file", file);
				dataToPush.push(file.async("string")
					.then((result: any) => {
						// console.log("6.1 reached");
						this.processRoomsHelper(this.internalRooms[buildingPath], parse(result));
					}).catch((err: any) => {
						reject(new InsightError("Unable to process room" + err));
					}));
			});

			Promise.all(dataToPush).then(() => {
				// console.log("all");
				resolve(this.internalIndex);
			});
		});
	}


	public processRoomsHelper(roomToProcess: any, res: any) {
		// console.log("point 6.5");
		for (let resNode of res.childNodes) {
			if (resNode.nodeName === "html") {
				// console.log("point7");
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
									console.log("roomFullName", roomFullName);
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
					newRoom.seats = this.trimText(param);
				} else if (currAttrs === "views-field views-field-field-room-type") {
					newRoom.type = this.trimText(param);
				} else if (currAttrs === "views-field views-field-field-room-furniture") {
					newRoom.furniture = this.trimText(param);
				}
			}
		}
		this.internalIndex.push(newRoom);
	}


	public parseNodeChildren(contentNode: any) {
		// if (contentNode == null) {
		// 	return;
		// }
		if (contentNode != null) {
			let newRoom: IRoomData = {} as IRoomData;
			for (let contentChildNode of contentNode.childNodes) {
				let currName = contentChildNode.nodeName;
				if (currName === "tbody") {
					for (let child of contentChildNode.childNodes) {
						if (child.nodeName === "tr") {
							this.convertIntoBuilding(child, newRoom);
						}
					}
				} else if (currName === "body" || currName === "div" || currName === "table"
					|| currName === "section") {
					this.parseNodeChildren(contentChildNode);
				}
			}
		}
	}

	private convertIntoBuilding(child: any, newRoom: IRoomData) {
		for (let childNode of child.childNodes) {
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
					newRoom.shortname = this.trimText(childNode);
				} else if (tempAttrs === "views-field views-field-field-building-address") {
					newRoom.address = this.trimText(childNode);
				}
			}
		}

		if (newRoom.shortname != null) {
			this.internalRooms[newRoom.shortname] = newRoom;
		};
	}

	private trimText(paramToTrim: any) {
		// console.log("param", paramToTrim);
		for (let paramChild of paramToTrim.childNodes) {
			if (paramChild.nodeName === "#text") {
				let trimmed = (paramChild).value.replace("\n", "").trim();
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
