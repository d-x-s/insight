import {InsightDatasetKind} from "./IInsightFacade";
import {RoomsData} from "./RoomsData";


export interface Rooms {

	"id": string;
	"sectionData": RoomsData[];
	"kind": InsightDatasetKind;

}
