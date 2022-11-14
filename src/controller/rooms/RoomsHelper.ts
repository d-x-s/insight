// import {InsightDatasetKind, InsightError, InsightResult} from "../IInsightFacade";
// import parse5 = require ("parse5");
// import {RoomData} from "./RoomData";
// import JSZip from "jszip";
//
// export default class RoomsHelper {
//
// 	public indexDirectory: string;
//
// 	constructor() {
// 		this.indexDirectory = "rooms/index.htm";
// 		console.log("Roome Helper created");
// 	}
//
// 	// TODO: After addRooms is completed
// 	private findGeolocation() {
// 		// TODO: send a get request to http://cs310.students.cs.ubc.ca:11316/api/v1/project_team<TEAM NUMBER>/<ADDRESS>
//
// 		// use http://cs310.students.cs.ubc.ca:11316/api/v1/project_team132 + append room
// 	}
//
// 	private verifyValidityOfRooms(content: any) {
// 		// check if valid zip file
//
// 		// check if single .htm file per dataset in root of zip
//
// 		// check if rooms c
//
// 		return false;
// 	}
//
// 	// HELPER: takes in content and adds
// 	public addRooms(id: string, content: string, kind: InsightDatasetKind): Promise<string[]> {
//
// 		// TODO: Retrieve geolocation of each building
//
// 		if (this.verifyValidityOfRooms(content)){
// 			return Promise.reject(new InsightError("ERROR: Invalid room"));
// 		}
//
// 		return Promise.reject(new InsightError("reject"));
// 	}
//
// 	public parseRoom(content: string): Promise<RoomData[]> {
//
// 		return new Promise((resolve, reject) => {
//
// 			JSZip.loadAsync(content, {base64: true})
// 				.then((result) => {
// 					this.parseHtm(result)
// 						.then((parsed) => {
// 							resolve(parsed);
// 						}).catch((err) => {
// 							reject(new InsightError("ERROR: Unable to parse Htm document"));
// 						});
// 				}).catch((err) => {
// 					reject(new InsightError("Error: Error while trying to parse Htm document"));
// 				});
// 		});
//
// 		return Promise.reject(new InsightError("ERROR: "));
// 	}
//
// 	public parseHtm(zipped: JSZip): Promise<RoomData[]> {
//
// 		return new Promise<RoomData[]> ((resolve, reject) => {
//
// 			let rawData = zipped.file(this.indexDirectory);
//
// 			if (rawData == null || rawData === undefined) {
// 				return new InsightError("ERROR: rawData was empty or undefined");
// 			}
//
// 			let parseFile = rawData.async("string").then((result) => {
// 				let parsedResult = parse5.parse(result);
// 				for (let node of parsedResult.childNodes) {
// 					if (node.nodeName === "html") {
// 						this.htmlHelper(node);
// 					}
// 				}
// 			}).catch((err) => {
// 				reject(new InsightError("ERROR: could not parse Htm"));
// 			});
//
// 			Promise.all(parseFile).then(() => {
// 				// TODO: add geolocation getters
// 				resolve(this)
// 			})
// 		});
//
// 	}
//
// 	private htmlHelper(element: parse5.) {
// 		if (element == undefined || element == null) {
// 			return;
// 		}
//
//
// 		for (let node of element.childNodes) {
//
// 		}
// 	}
//
//
// 	// SPEC:
// 	// (i) extend the query language to accommodate queries to a new dataset, i.e. Rooms; and
// 	// (ii) enable more comprehensive queries about the datasets, i.e. aggregate results.
// 	public performRoomQuery(): Promise<InsightResult[]> {
// 		return Promise.reject(new InsightError("reject"));
// 	}
// }
