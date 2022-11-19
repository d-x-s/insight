import {InsightDatasetKind} from "../IInsightFacade";
import {IRoomData} from "./IRoomData";

export interface IRoomDataset {
	id: string;
	data: IRoomData[];
	kind: InsightDatasetKind;
}
