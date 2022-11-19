/* eslint-disable max-lines */
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

	constructor() {
		this.indexDirectory = "index.htm";
		this.findLocation = new GeoLocation();
		this.internalIndex = [];
		this.internalBuildings = [];
		this.buildingListObject = {};
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
					console.log(result);
					// console.log("result IroomData", result);
					// console.log(this.buildingListObject);
					// console.log(this.internalBuildings);
					// console.log(result);
					resolve(this.setDataToModelAndDisk(id, result, kind, content, model));
				})
				.catch((err) => {
					reject(new InsightError("InsightError: failed to add" + err));
				});
		});
	}

	public handleRoomProcessing(zipped: JSZip): Promise<IRoomData[]> {
		return new Promise<IRoomData[]> ((resolve, reject) => {
			let indexHtmFile = zipped.file("index.htm");
			let parsedZip: any;
			if (indexHtmFile == null) {
				return new InsightError("file was null");
			}
			// console.log("point 2 reached");
			parsedZip = indexHtmFile.async("string").then((indexHtmFileContent) => {
				// console.log(indexHtmFileContent);
				// console.log("point 2.5 reached");
				let parsedFileContentDocument = parse(indexHtmFileContent);
				// console.log(parsedFileContentDocument);
				// console.log("point 2.6 reached");
				// this.indexHtmBuildingHelper(parsedFileContent);
				// console.log(this.buildingListObject);
				for (let contentNode of parsedFileContentDocument.childNodes) {
					let currNodeName = contentNode.nodeName;
					if (currNodeName === "html") {
						// console.log("line 69");
						// console.log(contentNode);
						this.indexHtmBuildingHelper(contentNode);
						// console.log(this.buildingListObject);
						// console.log(this.internalBuildings);
					}
				}
				// console.log(this.buildingListObject);
				// console.log("good");
				return;
			}).catch((err) => {
				reject(new InsightError("unable to async" + err));
			});

			console.log("point 2.9 reached");
			// console.log(this.buildingListObject);
			Promise.all([parsedZip]).then(() => {
				console.log("point 3 reached");
				// NOTE: SOMETHING IS FILLING THIS UP I DONT KNOW WHAT?
				// console.log(this.internalRooms);
				this.findLocation.processLatAndLong(this.buildingListObject)
					.then(() => {
						// console.log(this.buildingListObject);
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
		// console.log(this.internalRooms);
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
						// console.log("buidlingPath is " + buildingPath);
						let buildingPathNoHTM = buildingPath.split(".")[0];
						// console.log("buidlingPathNoHTM is " + buildingPathNoHTM);
						// console.log(this.buildingListObject[buildingPathNoHTM]);
						this.processRoomsHelper(this.buildingListObject[buildingPathNoHTM], parse(result));
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

	// NOTE: THIS IS GOOD< RETURNING A LIST OF ROOMS
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
					newRoom.seats = this.trimText(param);
				} else if (currAttrs === "views-field views-field-field-room-type") {
					newRoom.type = this.trimText(param);
				} else if (currAttrs === "views-field views-field-field-room-furniture") {
					newRoom.furniture = this.trimText(param);
				}
			}
		}
		// console.log(newRoom);
		this.internalIndex.push(newRoom);
	}


	public indexHtmBuildingHelper(contentNode: any) {
		// if (contentNode == null) {
		// 	return;
		// }
		// console.log(this.buildingListObject);
		if (contentNode != null) {
			// let newRoom: IRoomData = {} as IRoomData;
			for (let contentNodeChild of contentNode.childNodes) {
				let currName = contentNodeChild.nodeName;
				if (currName === "tbody") {
					for (let tr of contentNodeChild.childNodes) {
						if (tr.nodeName === "tr") {
							// this.convertIntoBuilding(tr, newRoom);
							this.convertIntoBuilding(tr);
						}
					}
				} else if (currName === "body" || currName === "div" || currName === "table"
					|| currName === "section") {
						// console.log("enter line 221");
					this.indexHtmBuildingHelper(contentNodeChild);
				}
			}
		}
	}

	private convertIntoBuilding(child: any) {
		let newRoom: IRoomData = {} as IRoomData;
		for (let childNode of child.childNodes) {
			// console.log(childNode);
			// console.log("inside Convert Into building");
			if (childNode.nodeName === "td") {
				let tempAttrs = childNode.attrs[0]["value"];
				if (tempAttrs === "views-field views-field-title") {

					// console.log("line 224");

					for (let searchName of childNode.childNodes) {

						// console.log("line 228");

						if (searchName.nodeName === "a") {

							// console.log("line 232");
							// console.log(searchName);
							// console.log(searchName.attrs[1]["value"]);

							if(searchName.attrs[1]["value"] === "Building Details and Map") {

								// console.log("line 236");

								for (let searchNameChild of searchName.childNodes) {
									if (searchNameChild.nodeName === "#text") {
										let text = searchNameChild.value;
										// console.log("searchNameChild value be " + text);
										newRoom.fullname = text;
									}
								}

								// for (let searchNameChild of searchName.nodeName) {

								// 	console.log("line 242");
								// 	console.log(searchNameChild);

								// 	if (searchNameChild.nodeName === "#text") {
								// 		console.log(searchNameChild.value);
								// 		newRoom.fullname = (searchNameChild).value as string;
								// 	}
								// }
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
		// console.log(this.buildingListObject);
		if (newRoom.shortname != null) {
			// console.log(newRoom.shortname);
			// console.log(this.buildingListObject);
			this.internalBuildings.push(newRoom);
			// console.log(newRoom);
			this.buildingListObject[newRoom.shortname] = newRoom;
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
