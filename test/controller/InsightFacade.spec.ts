import {
	InsightDatasetKind,
	InsightError,
	InsightResult, NotFoundError,
	ResultTooLargeError
} from "../../src/controller/IInsightFacade";
import InsightFacade from "../../src/controller/InsightFacade";

import * as fs from "fs-extra";
import {folderTest} from "@ubccpsc310/folder-test";

import {beforeEach, Context} from "mocha";
import {expect, use} from "chai";

describe("InsightFacade", function () {
	let insightFacade: InsightFacade;

	const persistDirectory = "./data";
	const datasetContents = new Map<string, string>();

	// Reference any datasets you've added to test/resources/archives here, and they will
	// automatically be loaded in the 'before' hook.
	const datasetsToLoad: {[key: string]: string} = {
		sections: "./test/resources/archives/pair.zip",
		// davis zips
		dsCourses: "./test/resources/archives/dscourses.zip",
		dsCoursesTypo: "./test/resources/archives/dscoursesTypo.zip",
		dsEmpty: "./test/resources/archives/dsempty.zip",
		dsInvalidJson: "./test/resources/archives/dsinvalidJson.zip",
		dsInvalidSections: "./test/resources/archives/dsinvalidSections.zip",
		dsNotInCourse: "./test/resources/archives/dsnotInCourse.zip",
		dsPNG: "./test/resources/archives/dspicture.png",
		dsPicture: "./test/resources/archives/dspicture.zip",
		dsPythonFiles: "./test/resources/archives/dspythonFiles.zip",
		dsSkipOverInvalid: "./test/resources/archives/dsskipOverInvalid.zip",
		// wesley zips
	};

	before(function () {
		// This section runs once and loads all datasets specified in the datasetsToLoad object
		for (const key of Object.keys(datasetsToLoad)) {
			const content = fs.readFileSync(datasetsToLoad[key]).toString("base64");
			datasetContents.set(key, content);
		}
		// Just in case there is anything hanging around from a previous run of the test suite
		fs.removeSync(persistDirectory);
	});

	describe("Add/Remove/List Dataset", function () {
		// ******************** PROVIDED FUNCTIONALITY ********************
		before(function () {
			console.info(`Before: ${this.test?.parent?.title}`);
		});

		beforeEach(function () {
			// This section resets the insightFacade instance
			// This runs before each test
			console.info(`BeforeTest: ${this.currentTest?.title}`);
			insightFacade = new InsightFacade();
		});

		after(function () {
			console.info(`After: ${this.test?.parent?.title}`);
		});

		afterEach(function () {
			// This section resets the data directory (removing any cached data)
			// This runs after each test, which should make each test independent of the previous one
			console.info(`AfterTest: ${this.currentTest?.title}`);
			fs.removeSync(persistDirectory);
		});

		// This is a unit test. You should create more like this!
		it("Should add a valid dataset", function () {
			const id: string = "sections";
			const content: string = datasetContents.get("sections") ?? "";
			const expected: string[] = [id];
			return insightFacade.addDataset(id, content, InsightDatasetKind.Sections)
				.then((result: string[]) => expect(result).to.deep.equal(expected));
		});

		// ******************** ADD DATASET ********************
		it ("should pass if we use a valid id", function () {
			const courses: string = datasetContents.get("dsCourses") ?? "";
			return insightFacade.addDataset("sections", courses, InsightDatasetKind.Sections)
				.then((addedIds) => {
					expect(addedIds).to.be.an.instanceOf(Array);
					expect(addedIds).to.have.length(1);
				}).catch((error: any) => {
					expect.fail("test failed, no error have been thrown");
				});
		});

		it("should be able to store multiple datasets", async function () {
			try {
				const courses: string = datasetContents.get("dsCourses") ?? "";
				const skipOverInvalid: string = datasetContents.get("dsSkipOverInvalid") ?? "";
				await insightFacade.addDataset("courses-id", courses, InsightDatasetKind.Sections);
				await insightFacade.addDataset("skipOverInvalid-id",
					skipOverInvalid,
					InsightDatasetKind.Sections);
			} catch(error: any) {
				expect.fail("test failed, no error should have been thrown");
			};
		});

		it("should maintain original datasets even if invalid is added", async function () {
			try {
				const courses: string = datasetContents.get("dsCourses") ?? "";
				const picture: string = datasetContents.get("dsSkipOverInvalid") ?? "";
				const result1 = await insightFacade.addDataset("id-1", courses, InsightDatasetKind.Sections);
				expect(result1).to.be.an.instanceOf(Array);
				expect(result1).to.have.length(1);
				expect(result1).to.deep.equal(["id-1"]);
				try {
					await insightFacade.addDataset("picture-id", picture, InsightDatasetKind.Sections);
				} catch (error: any) {
					const result2 = await insightFacade.addDataset("id-2", courses, InsightDatasetKind.Sections);
					expect(result2).to.be.an.instanceOf(Array);
					expect(result2).to.have.length(2);
				};
			} catch(error: any) {
				expect.fail("test failed, this line should be unreachable");
			};
		});

		it("should add a dataset and return a promise containing the ids of all current datasets", async function () {
			try {
				const courses: string = datasetContents.get("dsCourses") ?? "";
				const result = await insightFacade.addDataset("id", courses, InsightDatasetKind.Sections);
				expect(result).to.be.an.instanceOf(Array);
				expect(result).to.have.length(1);
				expect(result).to.deep.equal(["id"]);
			} catch(error: any) {
				expect.fail("test failed, no error should have been thrown");
			};
		});

		it("should add 2 datasets and return a promise containing the ids of all current datasets", async function () {
			try {
				const courses: string = datasetContents.get("dsCourses") ?? "";
				const result1 = await insightFacade.addDataset("id-1", courses, InsightDatasetKind.Sections);
				expect(result1).to.be.an.instanceOf(Array);
				expect(result1).to.have.length(1);

				const result2 = await insightFacade.addDataset("id-2", courses, InsightDatasetKind.Sections);
				expect(result2).to.be.an.instanceOf(Array);
				expect(result2).to.have.length(2);
			} catch(error: any) {
				expect.fail("test failed, no error should have been thrown");
			};
		});

		it("should fail if id contains an underscore and other characters", function () {
			const courses: string = datasetContents.get("dsCourses") ?? "";
			return insightFacade.addDataset("under_score", courses, InsightDatasetKind.Sections)
				.then((returnValue: string[]) => {
					expect.fail("test failed, InsightError should have been thrown");
				}).catch((error: any) => {
					expect(error).to.be.an.instanceof(InsightError);
				});
		});

		it("should fail if id contains only underscores", function () {
			const courses: string = datasetContents.get("dsCourses") ?? "";
			return insightFacade.addDataset("___", courses, InsightDatasetKind.Sections)
				.then((returnValue: string[]) => {
					expect.fail("test failed, InsightError should have been thrown");
				}).catch((error: any) => {
					expect(error).to.be.an.instanceof(InsightError);
				});
		});

		it("should pass if id contains whitespace and other characters", async function () {
			try {
				const courses: string = datasetContents.get("dsCourses") ?? "";
				await insightFacade.addDataset("white space", courses, InsightDatasetKind.Sections);
			} catch(error: any) {
				expect.fail("test failed");
			}
		});

		it("should fail if id contains only whitespace", async function () {
			// allows us to run async function within the same scope of a function
			// forces the line to wait, until we get the result back from addDataset
			// feels synchronous!
			try {
				const courses: string = datasetContents.get("dsCourses") ?? "";
				await insightFacade.addDataset("   ", courses, InsightDatasetKind.Sections);
				expect.fail("test failed, error should have been thrown");
			} catch(error: any) {
				expect(error).to.be.an.instanceof(InsightError);
			}
		});

		it("should fail if dataset with same id already exists", async function () {
			try {
				const courses: string = datasetContents.get("dsCourses") ?? "";
				await insightFacade.addDataset("id", courses, InsightDatasetKind.Sections);
				await insightFacade.addDataset("id", courses, InsightDatasetKind.Sections);
			} catch(error: any) {
				expect(error).to.be.an.instanceof(InsightError);
			};
		});

		it("should fail if we add wrong kind", async function () {
			try {
				const courses: string = datasetContents.get("dsCourses") ?? "";
				await insightFacade.addDataset("id", courses, InsightDatasetKind.Rooms);
				expect.fail("test failed, somehow added wrong kind");
			} catch(error: any) {
				expect(error).to.be.an.instanceof(InsightError);
			};
		});

		it("should fail if courses is misspelled as courzzes", async function () {
			try {
				const coursesTypo: string = datasetContents.get("dsCoursesTypo") ?? "";
				await insightFacade.addDataset("coursesTypo-id", coursesTypo, InsightDatasetKind.Sections);
				expect.fail("test failed, error should have been thrown");
			} catch(error: any) {
				expect(error).to.be.an.instanceof(InsightError);
			};
		});

		it("should fail if dataset is empty", async function () {
			try {
				const empty: string = datasetContents.get("dsEmpty") ?? "";
				await insightFacade.addDataset("empty-id", empty, InsightDatasetKind.Sections);
				expect.fail("test failed, error should have been thrown");
			} catch(error: any) {
				console.log("error", error);
				expect(error).to.be.an.instanceof(InsightError);
			};
		});

		it("should fail if it loads an invalid JSON", async function () {
			try {
				const invalidJson: string = datasetContents.get("dsInvalidJson") ?? "";
				await insightFacade.addDataset("invalidJson-id", invalidJson, InsightDatasetKind.Sections);
				expect.fail("test failed, error should have been thrown");
			} catch(error: any) {
				// the test catches an error as expected
			};
		});

		it("should fail if it loads dataset with only invalid sections", async function () {
			try {
				const invalidSections: string = datasetContents.get("dsInvalidSections") ?? "";
				await insightFacade.addDataset("invalidSections-id", invalidSections, InsightDatasetKind.Sections);
				expect.fail("test failed, error should have been thrown");
			} catch(error: any) {
				// the test catches an error as expected
			};
		});

		it("should fail if it loads a standalone JSON, no course directory", async function () {
			try {
				const notInCourse: string = datasetContents.get("dsNotInCourse") ?? "";
				await insightFacade.addDataset("notInCourse-id", notInCourse, InsightDatasetKind.Sections);
				expect.fail("test failed, error should have been thrown");
			} catch(error: any) {
				expect(error).to.be.an.instanceof(InsightError);
			};
		});

		it("should fail if JSON is not inside courses directory", async function () {
			try {
				const invalidJson: string = datasetContents.get("dsinvalidJson") ?? "";
				await insightFacade.addDataset("notInCourse-id", invalidJson, InsightDatasetKind.Sections);
				expect.fail("test failed, error should have been thrown");
			} catch(error: any) {
				expect(error).to.be.an.instanceof(InsightError);
			};
		});

		it("should reject courses with only pictures in it", async function () {
			try {
				const picture: string = datasetContents.get("dsPicture") ?? "";
				await insightFacade.addDataset("picture-id", picture, InsightDatasetKind.Sections);
				expect.fail("test failed, error should have been thrown");
			} catch(error: any) {
				// the test catches an error as expected
			};
		});

		it("should fail if there is a non-JSON file, like a python file", async function () {
			try {
				const picture: string = datasetContents.get("dsPythonFiles") ?? "";
				await insightFacade.addDataset("pythonFiles-id", picture, InsightDatasetKind.Sections);
				expect.fail("test failed, error should have been thrown");
			} catch(error: any) {
				// the test catches an error as expected
			};
		});

		it("should fail if loading a non-zip, like a png", async function () {
			try {
				const dsPNG: string = datasetContents.get("dsPNG") ?? "";
				await insightFacade.addDataset("picture-id", dsPNG, InsightDatasetKind.Sections);
			} catch(error: any) {
				// the test catches an error as expected
			};
		});

		it("should successfully skip over invalid entries and add valid ones", async function () {
			try {
				const skipOverInvalid: string = datasetContents.get("dsSkipOverInvalid") ?? "";
				await insightFacade.addDataset("skipOverInvalid-id", skipOverInvalid, InsightDatasetKind.Sections);
			} catch(error: any) {
				expect.fail("this line should not run if skipping over invalid entries");
			};
		});

		// ******************** REMOVE DATASET ********************
		it("should pass if we add and then remove the dataset", async function () {
			try {
				const courses: string = datasetContents.get("dsCourses") ?? "";
				await insightFacade.addDataset("id", courses, InsightDatasetKind.Sections);
				console.log("addDataset complete");
				await insightFacade.removeDataset("id");
			} catch(error: any) {
				console.log("error", error);
				expect.fail("test failed, should pass for simple add/remove");
			};
		});

		it("should fail if it removes a non-existent dataset", async function () {
			try {
				await insightFacade.removeDataset("id");
				expect.fail("test failed, successfully removed a non-existent dataset");
			} catch(error: any) {
				expect(error).to.be.an.instanceof(NotFoundError);
			};
		});

		it("should fail if the id has whitespace", async function () {
			try {
				await insightFacade.removeDataset("   ");
				expect.fail("test failed, a test with whitespace in the id should not exist");
			} catch(error: any) {
				expect(error).to.be.an.instanceof(InsightError);
			}
		});

		it("should fail if the id has underscores", async function () {
			try {
				await insightFacade.removeDataset("___");
				expect.fail("test failed, a test with underscores in the id should not exist");
			} catch(error: any) {
				expect(error).to.be.an.instanceof(InsightError);
			}
		});

		it("should only remove the dataset with matching id", async function () {
			try {
				const courses: string = datasetContents.get("dsCourses") ?? "";
				await insightFacade.addDataset("id-1", courses, InsightDatasetKind.Sections);
				await insightFacade.addDataset("id-2", courses, InsightDatasetKind.Sections);

				const insightDatasets1 = await insightFacade.listDatasets();
				expect(insightDatasets1).to.be.an.instanceof(Array);
				expect(insightDatasets1).to.have.length(2);

				const insightDatasetCourses1 = insightDatasets1.find((dataset) => dataset.id === "id-1");
				expect(insightDatasetCourses1).to.exist;
				expect (insightDatasetCourses1).to.deep.equal({
					id: "id-1",
					kind: InsightDatasetKind.Sections,
					numRows: 64612,
				});
				const insightDatasetCourses2 = insightDatasets1.find((dataset) => dataset.id === "id-2");
				expect(insightDatasetCourses2).to.exist;
				expect (insightDatasetCourses2).to.deep.equal({
					id: "id-2",
					kind: InsightDatasetKind.Sections,
					numRows: 64612,
				});

				await insightFacade.removeDataset("id-1");
				const insightDatasets2 = await insightFacade.listDatasets();
				expect(insightDatasets2).to.be.an.instanceof(Array);
				expect(insightDatasets2).to.have.length(1);

			} catch(error: any) {
				expect.fail("test failed, no errors expected");
			}
		});

		// ******************** LIST DATASET ********************
		it("should list no datasets", function (this: Context) {
			return insightFacade.listDatasets().then((insightDatasets) => {
				expect(insightDatasets).to.be.an.instanceOf(Array);
				expect(insightDatasets).to.have.length(0);
			});
		});

		it("should list one dataset", function() {
			const courses: string = datasetContents.get("dsCourses") ?? "";
			return insightFacade.addDataset("sections", courses, InsightDatasetKind.Sections)
				.then((addedIds) => {
					return insightFacade.listDatasets();
				}).then((insightDatasets) => {
					expect(insightDatasets).to.deep.equal([{
						id: "sections",
						kind: InsightDatasetKind.Sections,
						numRows: 64612,
					}]);
				});
		});

		it("should list multiple datasets", function() {
			const courses: string = datasetContents.get("dsCourses") ?? "";
			return insightFacade.addDataset("sections", courses, InsightDatasetKind.Sections)
				.then(() => {
					return insightFacade.addDataset("sections-2", courses, InsightDatasetKind.Sections);
				})
				.then(() => {
					return insightFacade.listDatasets();
				}).then((insightDatasets) => {
					expect(insightDatasets).to.be.an.instanceof(Array);
					expect(insightDatasets).to.have.length(2);
					const insightDatasetCourses = insightDatasets.find((dataset) => dataset.id === "sections");
					expect(insightDatasetCourses).to.exist;
					expect (insightDatasetCourses).to.deep.equal({
						id: "sections",
						kind: InsightDatasetKind.Sections,
						numRows: 64612,
					});
				});
		});
	});

	/*
	 * This test suite dynamically generates tests from the JSON files in test/resources/queries.
	 * You should not need to modify it; instead, add additional files to the queries directory.
	 * You can still make tests the normal way, this is just a convenient tool for a majority of queries.
	 */
	describe("PerformQuery", () => {
		before(function () {
			console.info(`Before: ${this.test?.parent?.title}`);

			insightFacade = new InsightFacade();

			// Load the datasets specified in datasetsToQuery and add them to InsightFacade.
			// Will *fail* if there is a problem reading ANY dataset.
			const loadDatasetPromises = [
				insightFacade.addDataset(
					"sections",
					datasetContents.get("sections") ?? "",
					InsightDatasetKind.Sections
				),
			];

			return Promise.all(loadDatasetPromises);
		});

		after(function () {
			console.info(`After: ${this.test?.parent?.title}`);
			fs.removeSync(persistDirectory);
		});

		type PQErrorKind = "ResultTooLargeError" | "InsightError";

		function assertResult(actual: any, expected: InsightResult[]): void {
			// expect(actual).to.deep.equal(expected);
			expect(actual).to.deep.members(expected);
		}

		folderTest<unknown, Promise<InsightResult[]>, PQErrorKind>(
			"Dynamic InsightFacade PerformQuery tests",
			(input) => insightFacade.performQuery(input),
			"./test/resources/queries",
			{assertOnResult: assertResult,
				assertOnError: (actual, expected) => {
					if (expected === "ResultTooLargeError") {
						expect(actual).to.be.instanceof(ResultTooLargeError);
					} else {
						expect(actual).to.be.instanceof(InsightError);
					}
				},
			}
		);
	});
});
