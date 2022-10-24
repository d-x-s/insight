import {InsightDatasetKind} from "../IInsightFacade";
import {SectionData} from "./SectionData";

export interface CourseDataset {
	id: string;
	sectionsData: SectionData[];
	kind: InsightDatasetKind;
}
