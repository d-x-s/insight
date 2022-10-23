import {InsightDatasetKind} from "./IInsightFacade";
import {RoomsData} from "./RoomsData";


export interface Rooms {

	"id": string;
	"roomsData": RoomsData[];
	"kind": InsightDatasetKind;

}
