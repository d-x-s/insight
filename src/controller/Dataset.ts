import {InsightDatasetKind} from "./IInsightFacade";
import {SectionsData} from "./SectionsData";

export interface Dataset {

	"id": string;
	"sectionData": SectionsData[];
	"kind": InsightDatasetKind;

}
