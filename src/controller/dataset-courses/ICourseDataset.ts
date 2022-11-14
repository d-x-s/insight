import {InsightDatasetKind} from "../IInsightFacade";
import {ISectionData} from "./ISectionData";

export interface ICourseDataset {
	id: string;
	sectionsData: ISectionData[];
	kind: InsightDatasetKind;
}
