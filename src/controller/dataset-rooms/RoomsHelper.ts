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
	public geoLocationHelper: GeoLocation;
	public roomsList: any;
	public fileDirectory: string;
	protected buildingsMap: Map<string, IRoomData>; // map of key:value pairs where the key is the building name and the value is an object with the building information

	constructor() {
		this.indexDirectory = "index.htm";
		this.fileDirectory = __dirname + "/../../data";
		this.geoLocationHelper = new GeoLocation();
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
			zipped.loadAsync(content, {base64: true}).then((loadedZipFiles) => {
				return this.loadAsyncHelper(loadedZipFiles);
			}).then((result) => {
				if (result instanceof InsightError) {
					reject(new InsightError("InsightError: failed to add" + result));
				}
				let filteredResult = result.filter((res) => {
					let length: number = Object.keys(res).length;
					let lengthString = length.toString();
					return lengthString === "11";
				});
				resolve(this.setDataToModelAndDisk(id, filteredResult, kind, content, model));
			}).catch((err) => {
				reject(new InsightError("InsightError: failed to add" + err));
			});
		});
	}

	private loadAsyncHelper(zipped: JSZip): Promise<IRoomData[]> {
		return new Promise<IRoomData[]>((resolve, reject) => {
			let parsedZip: any;
			let indexHtmFile                 = zipped.file("index.htm");
			let buildingsAndClassRoomsFolder = zipped.folder("campus/discover/buildings-and-classrooms");

			if (indexHtmFile !== null) {
				parsedZip = indexHtmFile.async("string").then((indexHtmFileStringified) => {
					let indexHtmFileObject = parse(indexHtmFileStringified);
					for (let contentNode of indexHtmFileObject.childNodes) {
						let currNodeName = contentNode.nodeName;
						if (currNodeName === "html") {
							this.processBuildingsHelper(contentNode);
						}
					}
				}).catch((err) => {
					reject(new InsightError("unable to async" + err));
				});
			} else {
				reject(new InsightError("file was null"));
			}

			Promise.all([parsedZip]).then(() => { // use square brackets to explicitly pass in parsedZip as object
				this.geoLocationHelper.setBuildingCoordinates(this.buildingsMap).then(() => {
					resolve(this.mergeBuildingsAndRooms(buildingsAndClassRoomsFolder));
				});
			});
		});
	}

	private mergeBuildingsAndRooms(buildingsAndClassRoomsFolder: any): Promise<IRoomData[]> {
		return new Promise<IRoomData[]>((resolve, reject) => {
			let dataToPush: Array<Promise<IRoomData>> = [];
			if (buildingsAndClassRoomsFolder == null) {
				return new InsightError("InsightError: null file folder, could not load");
			}
			buildingsAndClassRoomsFolder.forEach((buildingFileName: any, file: any) => {
				dataToPush.push(file.async("string").then((buildingClassRoomsHtm: any) => {
					let buildingName = buildingFileName.split(".")[0];
					this.combineBuildingWithRooms(this.buildingsMap.get(buildingName), parse(buildingClassRoomsHtm));
				}).catch((err: any) => {
					reject(new InsightError("Unable to process room" + err));
				})
				);
			});
			Promise.all(dataToPush).then(() => {
				resolve(this.roomsList);
			});
		});
	}

	// BUILDING HELPERS (deals with the index.htm object)
	private processBuildingsHelper(htmlNode: any) {
		if (htmlNode != null) {
			for (let htmlSearchNode of htmlNode.childNodes) {
				let currName = htmlSearchNode.nodeName;
				if (currName === "tbody") {
					for (let trSearchNode of htmlSearchNode.childNodes) {
						if (trSearchNode.nodeName === "tr") {
							this.addBuildingToMap(trSearchNode);
						}
					}
				} else if (currName === "body"
				        || currName === "div"
				        || currName === "table"
			        	|| currName === "section") {
					this.processBuildingsHelper(htmlSearchNode);
				}
			}
		}
	}

	private addBuildingToMap(trNode: any) {
		let newBuilding: IRoomData = {} as IRoomData;
		for (let tdSearchNode of trNode.childNodes) {
			if (tdSearchNode.nodeName === "td") {
				let attributeType = tdSearchNode.attrs[0]["value"];
				this.extractBuildingDatafromTableCell(tdSearchNode, attributeType, newBuilding);
				if (newBuilding.shortname !== null) { // you cannot set a map with a null key
					this.buildingsMap.set(newBuilding.shortname, newBuilding);
				}
			}
		}
	}

	private extractBuildingDatafromTableCell(tdNode: any, attributeType: any, newBuilding: any) {
		if (attributeType === "views-field views-field-title") {
			for (let anchorSearchNode of tdNode.childNodes) {
				if (anchorSearchNode.nodeName === "a") {
					this.extractBuildingDataFromAnchor(anchorSearchNode, newBuilding);
				}
			}
		} else if (attributeType === "views-field views-field-field-building-code") {
			if (typeof this.trimText(tdNode) === "string") {
				newBuilding.shortname = this.trimText(tdNode);
			}
		} else if (attributeType === "views-field views-field-field-building-address") {
			newBuilding.address = this.trimText(tdNode);
		}
	}

	private extractBuildingDataFromAnchor(a: any, newBuilding: any) {
		if (a.attrs[1]["value"] === "Building Details and Map") {
			for (let textSearchNode of a.childNodes) {
				if (textSearchNode.nodeName === "#text") {
					newBuilding.fullname = textSearchNode.value;
				}
			}
		}
	}

	// ROOM HELPERS (deals with a single room object from buildings-and-classrooms)
	private combineBuildingWithRooms(building: any, buildingWithClassRooms: any) {
		for (let htmlSearchNode of buildingWithClassRooms.childNodes) {
			if (htmlSearchNode.nodeName === "html") {
				return this.processRoomsHelper(building, htmlSearchNode);
			}
		}
	}

	private processRoomsHelper(building: any, buildingWithClassRoomsObject: any) {
		for (let tbodySearchNode of buildingWithClassRoomsObject.childNodes) {
			let currName = tbodySearchNode.nodeName;
			if (currName === "tbody") {
				for (let trSearchNode of tbodySearchNode.childNodes) {
					if (trSearchNode.nodeName === "tr") {
						this.addRoomToList(building, trSearchNode);
					}
				}
			} else if (currName === "body"
			        || currName === "div"
	             	|| currName === "table"
		         	|| currName === "section") {
	 			this.processRoomsHelper(building, tbodySearchNode);
			}
		}
	}

	private addRoomToList(building: any, trNode: any) {
		if (trNode === null) {
			return;
		}
		let newRoom = Object.assign({}, building);
		for (let tdSearchNode of trNode.childNodes) {
			if (tdSearchNode.nodeName === "td") {
				let attributeType = tdSearchNode.attrs[0]["value"];
				this.extractRoomDataFromTableCell(tdSearchNode, attributeType, newRoom);
			}
		}
		this.roomsList.push(newRoom);
	}

	private extractRoomDataFromTableCell(tdNode: any, attributeType: any, newRoom: any) {
		if (attributeType === "views-field views-field-field-room-number") {
			this.extractRoomDataFromAnchor(tdNode, newRoom);
		} else if (attributeType === "views-field views-field-field-room-capacity") {
			newRoom.seats = Number(this.trimText(tdNode));
		} else if (attributeType === "views-field views-field-field-room-type") {
			newRoom.type = this.trimText(tdNode);
		} else if (attributeType === "views-field views-field-field-room-furniture") {
			newRoom.furniture = this.trimText(tdNode);
		}
	}

	private extractRoomDataFromAnchor(tdNode: any, newRoom: any) {
		let name:     string = "";
		let href:     string = "";
		let fullName: string = "";
		for (let anchorSearchNode of tdNode.childNodes) {
			if (anchorSearchNode.nodeName === "a") {
				let anchorNode = anchorSearchNode;
				for (let textNode of anchorNode.childNodes) {
					if (textNode.nodeName === "#text") {
						fullName = textNode.value;
					}
				}
				name = fullName;
				href = anchorSearchNode.attrs[0].value;
			}
		}
		newRoom.name = newRoom.shortname + "_" + fullName;
		newRoom.number = name;
		newRoom.href = href;
	}

	// Utility function for helping with data extraction from htm files
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
