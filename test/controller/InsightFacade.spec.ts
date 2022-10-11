import {
	IInsightFacade,
	InsightDataset,
	InsightDatasetKind,
	InsightResult,
	InsightError,
	NotFoundError,
	ResultTooLargeError
} from "../../src/controller/IInsightFacade";
import InsightFacade from "../../src/controller/InsightFacade";
import {beforeEach, Context} from "mocha";
import {expect, use} from "chai";
import {clearDisk, getContentFromArchives} from "../TestUtil";
import {folderTest} from "@ubccpsc310/folder-test";

// FOLDERTEST
type Input = unknown;
type Output = Promise<InsightResult[]>; // changing to any makes the types agree?
// type Output = Promise<any>;
type Error = "InsightError" | "ResultTooLargeError";

describe("InsightFacade", function() {
	let courses: string;
	let coursesTypo: string;
	let empty: string;
	let invalidJson: string;
	let invalidSections: string;
	let notInCourse: string;
	let picture: string;
	let pythonFiles: string;
	let nonZip: string;
	let skipOverInvalid: string;

	before(function() {
		courses = getContentFromArchives("courses.zip");
		coursesTypo = getContentFromArchives("coursesTypo.zip");
		empty = getContentFromArchives("empty.zip");
		invalidJson = getContentFromArchives("invalidJson.zip");
		invalidSections = getContentFromArchives("invalidSections.zip");
		notInCourse = getContentFromArchives("notInCourse.zip");
		picture = getContentFromArchives("picture.zip");
		pythonFiles = getContentFromArchives("pythonFiles.zip");
		nonZip = getContentFromArchives("picture.png");
		skipOverInvalid = getContentFromArchives("skipOverInvalid.zip");
	});

	describe("listDataSet", function() {
		let facade: IInsightFacade;

		beforeEach(function () {
			clearDisk();
			facade = new InsightFacade();
		});

		it("should list no datasets", function (this: Context) {
			return facade.listDatasets().then((insightDatasets) => {
				expect(insightDatasets).to.be.an.instanceOf(Array);
				expect(insightDatasets).to.have.length(0);
			});
		});

		it("should list one dataset", function() {
			return facade.addDataset("sections", courses, InsightDatasetKind.Sections)
				.then((addedIds) => {
					return facade.listDatasets();
				}).then((insightDatasets) => {
					expect(insightDatasets).to.deep.equal([{
						id: "sections",
						kind: InsightDatasetKind.Sections,
						numRows: 64612,
					}]);
				});
		});

		it("should list multiple datasets", function() {
			return facade.addDataset("sections", courses, InsightDatasetKind.Sections)
				.then(() => {
					return facade.addDataset("sections-2", courses, InsightDatasetKind.Sections);
				})
				.then(() => {
					return facade.listDatasets();
				}).then((insightDatasets) => {
					expect(insightDatasets).to.be.an.instanceof(Array);
					expect(insightDatasets).to.have.length(2);
					const insightDatasetCourses = insightDatasets.find(
						(dataset) => dataset.id === "sections");
					expect(insightDatasetCourses).to.exist;
					expect (insightDatasetCourses).to.deep.equal({
						id: "sections",
						kind: InsightDatasetKind.Sections,
						numRows: 64612,
					});
				});
		});
	});

	// @param id, content, kind
	// id is the id of the dataset being added
	// content is the base64 content of any dataset, in a serialized zip file
	// kind is the kind of the dataset

	// return Promise<string> if succesful
	// the promise should reject with an InsightError describing the error
	describe("Add Datasets", function() {
		let facade: IInsightFacade;

		beforeEach(function () {
			clearDisk();
			facade = new InsightFacade();
		});
		// ******************** BASIC ADD ********************
		it ("should pass if we use a valid id", function () {
			return facade.addDataset("sections", courses, InsightDatasetKind.Sections)
				.then((addedIds) => {
					expect(addedIds).to.be.an.instanceOf(Array);
					expect(addedIds).to.have.length(1);
				}).catch((error: any) => {
					expect.fail("test failed, no error have been thrown");
				});
		});

		it("should be able to store multiple datasets", async function () {
			try {
				const result1 = await facade.addDataset("courses-id", courses, InsightDatasetKind.Sections);
				const result2 = await facade.addDataset("skipOverInvalid-id",
					skipOverInvalid,
					InsightDatasetKind.Sections);
			} catch(error: any) {
				expect.fail("test failed, no error should have been thrown");
			};
		});

		it("should maintain original datasets even if invalid is added", async function () {
			try {
				const result1 = await facade.addDataset("id-1", courses, InsightDatasetKind.Sections);
				expect(result1).to.be.an.instanceOf(Array);
				expect(result1).to.have.length(1);
				// expect(result1).contain(["id-1"]);
				expect(result1).to.deep.equal(["id-1"]);
				try {
					await facade.addDataset("picture-id", picture, InsightDatasetKind.Sections);
				} catch (error: any) {
					const result2 = await facade.addDataset("id-2", courses, InsightDatasetKind.Sections);
					expect(result2).to.be.an.instanceOf(Array);
					expect(result2).to.have.length(2);
					// expect(result1).to.deep.equal(["id-1","id-2"]);
					// expect(result1).contain(["id-1"]);
					// expect(result1).contain(["id-2"]);
				};
			} catch(error: any) {
				expect.fail("test failed, this line should be unreachable");
			};
		});

		// ******************** ID CHECKS ********************
		it("should add a dataset and return a promise containing the ids of all current datasets",
			async function () {
				try {
					const result = await facade.addDataset("id", courses, InsightDatasetKind.Sections);
					expect(result).to.be.an.instanceOf(Array);
					expect(result).to.have.length(1);
					expect(result).to.deep.equal(["id"]);
				} catch(error: any) {
					expect.fail("test failed, no error should have been thrown");
				};
			});

		it("should add 2 datasets and return a promise containing the ids of all current datasets",
			async function () {
				try {
					const result1 = await facade.addDataset("id-1", courses, InsightDatasetKind.Sections);
					expect(result1).to.be.an.instanceOf(Array);
					expect(result1).to.have.length(1);
				// expect(result1).to.deep.equal(["id-1"]);
				// expect(result1).contain("id-1");

					const result2 = await facade.addDataset("id-2", courses, InsightDatasetKind.Sections);
					expect(result2).to.be.an.instanceOf(Array);
					expect(result2).to.have.length(2);
				// expect(result1).to.deep.equal(["id-1","id-2"]);
				} catch(error: any) {
					expect.fail("test failed, no error should have been thrown");
				};
			});

		it("should fail if id contains an underscore and other characters", function () {
			return facade.addDataset("under_score", courses, InsightDatasetKind.Sections)
				.then((returnValue: string[]) => {
					expect.fail("test failed, InsightError should have been thrown");
				}).catch((error: any) => {
					expect(error).to.be.an.instanceof(InsightError);
				});
		});

		it("should fail if id contains only underscores", function () {
			return facade.addDataset("___", courses, InsightDatasetKind.Sections)
				.then((returnValue: string[]) => {
					expect.fail("test failed, InsightError should have been thrown");
				}).catch((error: any) => {
					expect(error).to.be.an.instanceof(InsightError);
				});
		});

		it("should pass if id contains whitespace and other characters", async function () {
			try {
				await facade.addDataset("white space", courses, InsightDatasetKind.Sections);
			} catch(error: any) {
				expect.fail("test failed");
			}
		});

		it("should fail if id contains only whitespace", async function () {
			// allows us to run async function within the same scope of a function
			// forces the line to wait, until we get the result back from addDataset
			// feels synchronous!
			try {
				await facade.addDataset("   ", courses, InsightDatasetKind.Sections);
				expect.fail("test failed, error should have been thrown");
			} catch(error: any) {
				expect(error).to.be.an.instanceof(InsightError);
			}
		});

		it("should fail if dataset with same id already exists", async function () {
			try {
				await facade.addDataset("id", courses, InsightDatasetKind.Sections);
				await facade.addDataset("id", courses, InsightDatasetKind.Sections);
			} catch(error: any) {
				expect(error).to.be.an.instanceof(InsightError);
			};
		});

		// DOES NOT COMPILE
		// it("should fail if id is null", async function () {
		//     try {
		//         await facade.addDataset(null, courses, InsightDatasetKind.Sections);
		//     } catch(error: any) {
		//         expect(error).to.be.an.instanceof(InsightError);
		//     }
		// });

		// ******************** KIND CHECKS ********************
		it("should fail if we add wrong kind", async function () {
			try {
				await facade.addDataset("id", courses, InsightDatasetKind.Rooms);
				expect.fail("test failed, somehow added wrong kind");
			} catch(error: any) {
				expect(error).to.be.an.instanceof(InsightError);
			};
		});

		// ******************** ZIP FILE CASES ********************
		// courses = getContentFromArchives("courses.zip");
		// coursesTypo = getContentFromArchives("coursesTypo.zip");
		// empty = getContentFromArchives("empty.zip");
		// invalidJson = getContentFromArchives("invalidJson.zip");
		// invalidSections = getContentFromArchives("invalidSections.zip");
		// notInCourse = getContentFromArchives("notInCourse.zip");
		// picture = getContentFromArchives("picture.zip");
		// nonZip = getContentFromArchives("picture.png");
		// skipOverInvalid = getContentFromArchives("skipOverInvalid.zip");

		// X has to be valid zip file, directory always has courses
		// X valid courses always in JSON format
		// X each JSON file represents a course, can contain zero or more course valid sections
		// X contains every field which can be used by a query
		// X a valid dataset has to contain at least one valid course section
		// X skip over invalid files

		it("should fail if courses is mispelled as courzzes", async function () {
			try {
				await facade.addDataset("coursesTypo-id", coursesTypo, InsightDatasetKind.Sections);
				expect.fail("test failed, error should have been thrown");
			} catch(error: any) {
				expect(error).to.be.an.instanceof(InsightError);
			};
		});

		it("should fail if dataset is empty", async function () {
			try {
				await facade.addDataset("empty-id", empty, InsightDatasetKind.Sections);
				expect.fail("test failed, error should have been thrown");
			} catch(error: any) {
				expect(error).to.be.an.instanceof(InsightError);
			};
		});

		it("should fail if it loads an invalid JSON", async function () {
			try {
				await facade.addDataset("invalidJson-id", invalidJson, InsightDatasetKind.Sections);
				expect.fail("test failed, error should have been thrown");
			} catch(error: any) {
				// expect(error).to.be.an.instanceof(InsightError);
				// expect(error);
			};
		});

		it("should fail if it loads dataset with only invalid sections", async function () {
			try {
				await facade.addDataset("invalidSections-id", invalidSections, InsightDatasetKind.Sections);
				expect.fail("test failed, error should have been thrown");
			} catch(error: any) {
				// expect(error).to.be.an.instanceof(InsightError);
			};
		});

		it("should fail if it loads a standalone JSON, no course directory", async function () {
			try {
				await facade.addDataset("notInCourse-id", notInCourse, InsightDatasetKind.Sections);
				expect.fail("test failed, error should have been thrown");
			} catch(error: any) {
				expect(error).to.be.an.instanceof(InsightError);
			};
		});

		it("should fail if JSON is not inside courses directory", async function () {
			try {
				await facade.addDataset("notInCourse-id", notInCourse, InsightDatasetKind.Sections);
				expect.fail("test failed, error should have been thrown");
			} catch(error: any) {
				expect(error).to.be.an.instanceof(InsightError);
			};
		});

		it("should fail if there is a non-JSON file, like a picture", async function () {
			try {
				await facade.addDataset("picture-id", picture, InsightDatasetKind.Sections);
				expect.fail("test failed, error should have been thrown");
			} catch(error: any) {
				// expect(error).to.be.an.instanceof(InsightError);
			};
		});

		it("should fail if there is a non-JSON file, like a python file", async function () {
			try {
				await facade.addDataset("pythonFiles-id", pythonFiles, InsightDatasetKind.Sections);
				expect.fail("test failed, error should have been thrown");
			} catch(error: any) {
				// expect(error).to.be.an.instanceof(InsightError);
			};
		});

		it("should fail if loading a non-zip, like a png", async function () {
			try {
				await facade.addDataset("picture-nonZip", nonZip, InsightDatasetKind.Sections);
				expect.fail("test failed, error should have been thrown");
			} catch(error: any) {
				expect(error).to.be.an.instanceof(InsightError);
			};
		});

		it("should reject courses with only pictures in it", async function () {
			try {
				await facade.addDataset("picture-id", picture, InsightDatasetKind.Sections);
			} catch(error: any) {
				// expect.fail("error should be thrown only invalid file in directory");
			};
		});

		it("should successfully skip over invalid entries and add valid ones", async function () {
			try {
				await facade.addDataset("skipOverInvalid-id", skipOverInvalid, InsightDatasetKind.Sections);
			} catch(error: any) {
				expect.fail("this line should not run if skipping over invalid entries");
			};
		});

		// ******************** ENOENT ZIP FILE CASES ********************
		// it("ENOENT should fail if courses is mispelled as courzzes", async function () {
		//     try {
		//         await facade.addDataset("coursesTypo-id", coursesTypo, InsightDatasetKind.Sections);
		//         expect.fail("test failed, error should have been thrown");
		//     } catch(error: any) {
		//         expect(error).to.be.an.instanceof(InsightError);
		//     };
		// });
		//
		// it("ENOENT should fail if dataset is empty", async function () {
		//     try {
		//         await facade.addDataset("empty-id", empty, InsightDatasetKind.Sections);
		//         expect.fail("test failed, error should have been thrown");
		//     } catch(error: any) {
		//         expect(error).to.be.an.instanceof(InsightError);
		//     };
		// });
		//
		// it("ENOENT should fail if it loads an invalid JSON", async function () {
		//     try {
		//         await facade.addDataset("invalidJson-id", invalidJson, InsightDatasetKind.Sections);
		//         expect.fail("test failed, error should have been thrown");
		//     } catch(error: any) {
		//         expect(error).to.be.an.instanceof(InsightError);
		//     };
		// });
		//
		// it("ENOENT should fail if it loads dataset with only invalid sections", async function () {
		//     try {
		//         await facade.addDataset("invalidSections-id", invalidSections, InsightDatasetKind.Sections);
		//         expect.fail("test failed, error should have been thrown");
		//     } catch(error: any) {
		//         expect(error).to.be.an.instanceof(InsightError);
		//     };
		// });
		//
		// it("ENOENT should fail if it loads a standalone JSON, no course directory", async function () {
		//     try {
		//         await facade.addDataset("notInCourse-id", notInCourse, InsightDatasetKind.Sections);
		//         expect.fail("test failed, error should have been thrown");
		//     } catch(error: any) {
		//         expect(error).to.be.an.instanceof(InsightError);
		//     };
		// });
		//
		// it("ENOENT should fail if JSON is not inside courses directory", async function () {
		//     try {
		//         await facade.addDataset("notInCourse-id", notInCourse, InsightDatasetKind.Sections);
		//         expect.fail("test failed, error should have been thrown");
		//     } catch(error: any) {
		//         expect(error).to.be.an.instanceof(InsightError);
		//     };
		// });
		//
		// it("ENOENT should fail if there is a non-JSON file, like a picture", async function () {
		//     try {
		//         await facade.addDataset("picture-id", picture, InsightDatasetKind.Sections);
		//         expect.fail("test failed, error should have been thrown");
		//     } catch(error: any) {
		//         expect(error).to.be.an.instanceof(InsightError);
		//     };
		// });
		//
		// it("ENOENT should fail if there is a non-JSON file, like a python file", async function () {
		//     try {
		//         await facade.addDataset("pythonFiles-id", pythonFiles, InsightDatasetKind.Sections);
		//         expect.fail("test failed, error should have been thrown");
		//     } catch(error: any) {
		//         expect(error).to.be.an.instanceof(InsightError);
		//     };
		// });
		//
		// it("ENOENT should fail if loading a non-zip, like a png", async function () {
		//     try {
		//         await facade.addDataset("picture-nonZip", nonZip, InsightDatasetKind.Sections);
		//         expect.fail("test failed, error should have been thrown");
		//     } catch(error: any) {
		//         expect(error).to.be.an.instanceof(InsightError);
		//     };
		// });
		//
		// it("ENOENT should skip over invalid files in the zip", async function () {
		//     try {
		//         await facade.addDataset("picture-id", picture, InsightDatasetKind.Sections);
		//     } catch(error: any) {
		//         Log.error(err);
		//     };
		// });

	});

	// @param id
	// id is the id of the dataset to be removed

	// return Promise <string> if succesful
	// reject with NotFoundError (if a valid id not yet added)
	// otherwise reject with InsightError

	// deletes disk and memory caches, so subsequent queries for
	// said id should fail, unless a new adddataset happens first
	describe("Remove Datasets", function() {
		let facade: IInsightFacade;

		beforeEach(function () {
			clearDisk();
			facade = new InsightFacade();
		});

		it("should pass if we add and then remove the dataset", async function () {
			try {
				await facade.addDataset("id", courses, InsightDatasetKind.Sections);
				await facade.removeDataset("id");
			} catch(error: any) {
				expect.fail("test failed, should pass for simple add/remove");
			};
		});

		it("should fail if it removes a non-existent dataset", async function () {
			try {
				await facade.removeDataset("id");
				expect.fail("test failed, successfully removed a non-existent dataset");
			} catch(error: any) {
				expect(error).to.be.an.instanceof(NotFoundError);
			};
		});

		it("should fail if the id has whitespace", async function () {
			try {
				await facade.removeDataset("   ");
				expect.fail("test failed, a test with whitespace in the id should not exist");
			} catch(error: any) {
				// expect(error).to.be.an.instanceof(NotFoundError) || expect(error).to.be.an.instanceOf(InsightError);
				// expect(error).to.be.oneOf([NotFoundError, InsightError]);
				// expect(error).to.be.an.instanceof(NotFoundError)
				expect(error).to.be.an.instanceof(InsightError);
			}
		});

		it("should fail if the id has underscores", async function () {
			try {
				await facade.removeDataset("___");
				expect.fail("test failed, a test with underscores in the id should not exist");
			} catch(error: any) {
				// expect(error).to.be.an.instanceof(NotFoundError) || expect(error).to.be.an.instanceOf(InsightError);
				// expect(error).to.be.oneOf([NotFoundError, InsightError]);
				// expect(error).to.be.an.instanceof(NotFoundError)
				expect(error).to.be.an.instanceof(InsightError);
			}
		});

		it("should only remove the dataset with matching id", async function () {
			try {
				await facade.addDataset("id-1", courses, InsightDatasetKind.Sections);
				await facade.addDataset("id-2", courses, InsightDatasetKind.Sections);

				const insightDatasets1 = await facade.listDatasets();
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

				await facade.removeDataset("id-1");
				const insightDatasets2 = await facade.listDatasets();
				expect(insightDatasets2).to.be.an.instanceof(Array);
				expect(insightDatasets2).to.have.length(1);

			} catch(error: any) {
				expect.fail("test failed, no errors expected");
			}
		});

	});

	describe("Perform Query", function() {
		let facade: IInsightFacade;

		// called before all the test runs
		before(async function () {
			clearDisk();
			facade = new InsightFacade();

			// BUG? MISMATCHED ID KEYS PASSED IN BY USER
			// SHOULD BE "sections" NOT "id"
			// await facade.addDataset("id", courses, InsightDatasetKind.Sections);
			await facade.addDataset("sections", courses, InsightDatasetKind.Sections);
		});

		// checking for the time when there is no error
		// that is, we expect our actual value to be equal to our expected value
		// just a simple expect statement
		function assertResult(actual: any, expected: InsightResult[]): void {
			expect(actual).to.deep.equal(expected);
		}

		// there are two possible errors that can be thrown by performQuery
		function assertError(actual: any, expected: Error): void {
			if (expected === "InsightError") {
				expect(actual).to.be.an.instanceOf(InsightError);
			} else {
				expect(actual).to.be.an.instanceOf(ResultTooLargeError);
			}
		}

		folderTest<Input, Output, Error>(
			// SUITE NAME
			// name of the mocha describe that will be created
			"Perform Query Dynamic Tests",

			// TARGET
			// function that invokes the code under test
			// if target returns a promise, it is resolved before the result is passed to `assertOnResult` function
			(input: Input): Output => {
				return facade.performQuery(input);
			},

			// PATH
			// A path where the json schemata are located (includes json schemata in subdirectories)
			"./test/resources/queries",

			// OPTIONS
			{
				assertOnResult: assertResult,
				assertOnError: assertError,
			}
		);
	});
});

