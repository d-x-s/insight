import * as fs from "fs";
import {Dataset} from "./Dataset";
import {InsightError} from "./IInsightFacade";
import {SectionConverter} from "./SectionConverter";

export class Persistence {
	public fileDirectory: string;

	constructor() {
		this.fileDirectory = __dirname + "/../../data";
	}

	public loadExistingData(model: Map<string, Dataset>) {
		if (this.fileDirectory.length !== 0) {
			console.log("length", this.fileDirectory.length);
			try {
				fs.readdir(this.fileDirectory, function (err, files) {
					files.forEach(function (file) {
						let results = fs.readFileSync(file);
						let idToAdd: string = "";

						// parse into Dataset object
						let newDataset: any = [];
						let sectionConverter = new SectionConverter();
						try {
							for (let result in results) {
								let dataFromJSON = JSON.parse(result)["result"];
								dataFromJSON.forEach((x: any) => {
									let y = sectionConverter.convertToSectionFormat(x);
									idToAdd = y.id;
									newDataset.push(y);
								});
							}
							model.set(idToAdd, newDataset);
						} catch {
							return new InsightError("ERROR: could not parse JSON (invalid)");
						}
					});
				});
			} catch {
				return new InsightError("ERROR: could not read directory");
			}
		}
	}
};
