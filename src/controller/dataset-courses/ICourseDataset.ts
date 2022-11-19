import {InsightDatasetKind} from "../IInsightFacade";
import {ISectionData} from "./ISectionData";

export interface ICourseDataset {
	id: string;
	data: ISectionData[];
	kind: InsightDatasetKind;
}
