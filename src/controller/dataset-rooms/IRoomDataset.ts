import {InsightDatasetKind} from "../IInsightFacade";
import {IRoomData} from "./IRoomData";

export interface IRoomDataset {
	id: string;
	roomsData: IRoomData[];
	kind: InsightDatasetKind;
}
