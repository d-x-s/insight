import {InsightDatasetKind} from "../IInsightFacade";
import {RoomData} from "./RoomData";

export interface RoomDataset {
	id: string;
	roomsData: RoomData[];
	kind: InsightDatasetKind;
}
