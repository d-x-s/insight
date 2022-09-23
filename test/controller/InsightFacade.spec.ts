import {
	IInsightFacade,
	InsightDatasetKind,
	InsightError,
	InsightResult,
	ResultTooLargeError
} from "../../src/controller/IInsightFacade";
import InsightFacade from "../../src/controller/InsightFacade";

import * as fs from "fs-extra";

import {folderTest} from "@ubccpsc310/folder-test";
import {expect} from "chai";
import {clearDisk, getContentFromArchives} from "../TestUtil";

describe("InsightFacade", function () {
	let insightFacade: InsightFacade;

	const persistDirectory = "./data";
	const datasetContents = new Map<string, string>();

	// Reference any datasets you've added to test/resources/archives here, and they will
	// automatically be loaded in the 'before' hook.
	const datasetsToLoad: {[key: string]: string} = {
		sections: "./test/resources/archives/pair.zip",
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
	});

	/*
	 * This test suite dynamically generates tests from the JSON files in test/resources/queries.
	 * You should not need to modify it; instead, add additional files to the queries' directory.
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

		folderTest<unknown, Promise<InsightResult[]>, PQErrorKind>(
			"Dynamic InsightFacade PerformQuery tests",
			(input) => insightFacade.performQuery(input),
			"./test/resources/queries",
			{
				errorValidator: (error): error is PQErrorKind =>
					error === "ResultTooLargeError" || error === "InsightError",
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

	describe("addDataset test", function () {

		// runs before tests below. Refactored to retrieve content from archives
		let courses: string;
		before(function () {
			courses = getContentFromArchives("courses.zip");
		});

		// instantiate newFacade, reset after every test
		let newFacade: IInsightFacade;

		beforeEach(function () {
			clearDisk();
			newFacade = new InsightFacade();
		});

		describe("should fulfill for valid ids", function () {
			it("should fulfill for adding a dataset for the first time", function () {
				return newFacade.addDataset("sections", courses, InsightDatasetKind.Sections)
					.then((addedIds) => {
						expect(addedIds).to.be.an.instanceof(Array);
						expect(addedIds).to.have.length(1);
					}).catch((err) => {
						expect.fail("addDataset failed, promise should fulfill and return string array");
					});
			});

			it("should fulfill for an id with a whitespace but other characters", function () {
				return newFacade.addDataset("sections test", courses, InsightDatasetKind.Sections)
					.then((addedIds) => {
						expect(addedIds).to.be.an.instanceof(Array);
						expect(addedIds).to.have.length(1);
					}).catch((err) => {
						expect.fail("addDataset failed, promise should fulfill and return string array");
					});
			});
		});

		describe("should reject for invalid ids", function () {
			it("should reject sections id with underscore", function () {
				// create dataset with underscore in id
				return newFacade.addDataset("fakeId_0", courses, InsightDatasetKind.Sections)
					.then((returnArray: string[]) => {
						expect.fail("Expected error was not thrown");
					}).catch((err) => {
						expect(err).to.be.an.instanceof(InsightError);
					});
			});

			it("should reject rooms id with underscore", function () {
				// create dataset with underscore in id
				return newFacade.addDataset("fakeId_0", courses, InsightDatasetKind.Rooms)
					.then((returnArray: string[]) => {
						expect.fail("Expected error was not thrown");
					}).catch((err) => {
						expect(err).to.be.an.instanceof(InsightError);
					});
			});

			it("should reject for sections id with only whitespace characters", function () {
				// create dataset with only whitespace characters in id
				return newFacade.addDataset("   ", courses, InsightDatasetKind.Sections)
					.then((returnArray: string[]) => {
						expect.fail("Expected error was not thrown");
					}).catch((err) => {
						expect(err).to.be.an.instanceof(InsightError);
					});
			});

			it("should reject for rooms id with only whitespace characters", function () {
				// create dataset with only whitespace characters in id
				return newFacade.addDataset("   ", courses, InsightDatasetKind.Rooms)
					.then((returnArray: string[]) => {
						expect.fail("Expected error was not thrown");
					}).catch((err) => {
						expect(err).to.be.an.instanceof(InsightError);
					});
			});

			it("should reject for existing sections ids", function () {
				return newFacade.addDataset("firstId", courses, InsightDatasetKind.Sections)
					.then((returnArray: string[]) => {
						return newFacade.addDataset("firstId", courses, InsightDatasetKind.Sections);
						expect.fail("Expected error was not thrown");
					}).catch((err) => {
						expect(err).to.be.an.instanceof(InsightError);
					});
			});

			it("should reject for existing rooms ids", function () {
				return newFacade.addDataset("firstId", courses, InsightDatasetKind.Rooms)
					.then((returnArray: string[]) => {
						return newFacade.addDataset("firstId", courses, InsightDatasetKind.Rooms);
						expect.fail("Expected error was not thrown");
					}).catch((err) => {
						expect(err).to.be.an.instanceof(InsightError);
					});
			});
		});

		// file is empty
		it("should reject empty zip files", async function() {
			try{
				let emptyZip = getContentFromArchives("emptyZip.zip");
				await newFacade.addDataset("emptyZip", emptyZip, InsightDatasetKind.Sections);
				expect.fail("Expected error was not thrown");
			} catch(err: any) {
				console.log("error");
			}
		});

		// file does not exist
		it("should reject files that cannot be found", async function() {
			try{
				let nonExistingFile = getContentFromArchives("nonExistingFile.json");
				await newFacade.addDataset("nonExistingFile", nonExistingFile, InsightDatasetKind.Sections);
				expect.fail("Expected error was not thrown");
			} catch(err: any) {
				console.log("error");
			}
		});

		it("should reject files that are not of type .zip", async function() {
			try{
				let notOfTypeZip = getContentFromArchives("testNonZipFile.json");
				await newFacade.addDataset("notOfTypeZip", notOfTypeZip, InsightDatasetKind.Sections);
				expect.fail("Expected error was not thrown");
			} catch(err: any) {
				console.log("error");
			}
		});

		it("should reject for misspelled course directory", async function () {
			try{
				let misSpelledCourse = getContentFromArchives("course.zip");
				await newFacade.addDataset("misSpelledCourse", misSpelledCourse, InsightDatasetKind.Sections);
				expect.fail("Expected error was not thrown");
			} catch(err: any) {
				console.log("error");
			}
		});

		it("should reject for zips with wrong files", async function () {
			try{
				let wrongFile = getContentFromArchives("emptyTxt.zip");
				await newFacade.addDataset("wrongFile", wrongFile, InsightDatasetKind.Sections);
				expect.fail("Expected error was not thrown");
			} catch(err: any) {
				console.log("error");
			}
		});

		it("should reject for zips with empty courses file", async function () {
			try{
				let emptyCourses = getContentFromArchives("emptyCourses.zip");
				await newFacade.addDataset("emptyCourses", emptyCourses, InsightDatasetKind.Sections);
				expect.fail("Expected error was not thrown");
			} catch(err: any) {
				console.log("error");
			}
		});
	});

	describe("removeDataset additional tests", function () {

		// runs before tests below. Refactored to retrieve content from archives
		let courses: string;
		before(function () {
			courses = getContentFromArchives("courses.zip");
		});

		describe("removeDataset tests for sections", function () {
			// instantiate newFacade, reset after every test
			let newFacade: IInsightFacade;

			// add Dataset to newFacade before running each test
			beforeEach(function () {
				clearDisk();
				newFacade = new InsightFacade();
				newFacade.addDataset("testId", courses, InsightDatasetKind.Sections);
			});

			it("should reject for sections id with underscore", function () {
				// create dataset with underscore in id
				return newFacade.removeDataset("fakeId_0")
					.then((returnString: string) => {
						expect.fail("Expected error was not thrown");
					}).catch((err) => {
						expect(err).to.be.an.instanceof(InsightError);
					});
			});

			it("should reject for sections id with only whitespace characters", function () {
				// remove dataset with only whitespace characters in id
				return newFacade.removeDataset("   ")
					.then((returnString: string) => {
						expect.fail("Expected error was not thrown");
					}).catch((err) => {
						expect(err).to.be.an.instanceof(InsightError);
					});
			});

		});

		describe("removeDataset tests for rooms", function () {
			// instantiate newFacade, reset after every test
			let newFacade: IInsightFacade;

			// add Dataset to newFacade before running each test
			beforeEach(function () {
				clearDisk();
				newFacade = new InsightFacade();
				newFacade.addDataset("testId", courses, InsightDatasetKind.Rooms);
			});

			it("should reject for rooms id with underscore", function () {
				// create dataset with underscore in id
				return newFacade.removeDataset("fakeId_0")
					.then((returnString: string) => {
						expect.fail("Expected error was not thrown");
					}).catch((err) => {
						expect(err).to.be.an.instanceof(InsightError);
					});
			});

			it("should reject for rooms id with only whitespace characters", function () {
				// remove dataset with only whitespace characters in id
				return newFacade.removeDataset("   ")
					.then((returnString: string) => {
						expect.fail("Expected error was not thrown");
					}).catch((err) => {
						expect(err).to.be.an.instanceof(InsightError);
					});
			});
		});
	});
});
