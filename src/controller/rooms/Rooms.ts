// import {RoomDataset} from "./RoomDataset";
// import {InsightDatasetKind, InsightError} from "../IInsightFacade";
// import RoomsHelper from "./RoomsHelper";
//
//
// export default class Rooms {
//
// 	public roomMap: Map<string, RoomDataset> = new Map();
// 	public roomsHelper: RoomsHelper;
//
// 	constructor() {
// 		this.roomsHelper = new RoomsHelper();
// 	}
//
// 	public addDatasetRoom(id: string, content: string, kind: InsightDatasetKind): Promise<string[]> {
//
// 		return new Promise<string[]> ((resolve, reject) => {
// 			let newRoom: RoomDataset = {
// 				id: id,
// 				roomsData: [],
// 				kind: kind,
// 			};
// 			this.roomsHelper.parseRoom(content).then((result) => {
// 				newRoom.roomsData = result;
// 				this.roomMap.set(id, newRoom);
// 				let updateKeysAfterAdd: string[] = Array.from(this.roomMap.keys());
// 				resolve(updateKeysAfterAdd);
// 			}).catch((err: any) => {
// 				reject(new InsightError("Error unable to parse room dataset"));
// 			});
// 		});
// 	}
// }
//
// // You must also write a copy of the data structure to disk, and should be able to load these files to be queried if necessary.
//
// // These files should be saved to the <PROJECT_DIR>/data directory as before.
