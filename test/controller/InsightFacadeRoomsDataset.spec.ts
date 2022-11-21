import * as fs from "fs-extra";
import {beforeEach, Context} from "mocha";
import InsightFacade from "../../src/controller/InsightFacade";
import {InsightDatasetKind,
	NotFoundError,
	InsightError
} from "../../src/controller/IInsightFacade";
import {expect} from "chai";

describe("Rooms", function() {

	let insightFacade: InsightFacade;

	const persistDirectory = "./data";
	const datasetContents = new Map<string, string>();

	// Reference any datasets you've added to test/resources/archives here, and they will
	// automatically be loaded in the 'before' hook.
	const datasetsToLoad: {[key: string]: string} = {
		rooms: "./test/resources/archives/rooms.zip",
		courses: "./test/resources/archives/pair.zip",
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

	describe("Add/Remove/List Rooms", function () {
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
		it("Should add a valid room", function () {
			const id: string = "rooms";
			const content: string = datasetContents.get("rooms") ?? "";
			const expected: string[] = [id];

			return insightFacade.addDataset(id, content, InsightDatasetKind.Rooms)
				.then((result: string[]) => expect(result).to.deep.equal(expected));
		});

		it ("should pass if we use a valid id", function () {
			const rooms: string = datasetContents.get("rooms") ?? "";
			return insightFacade.addDataset("rooms", rooms, InsightDatasetKind.Rooms)
				.then((addedIds) => {
					expect(addedIds).to.be.an.instanceOf(Array);
					expect(addedIds).to.have.length(1);
				}).catch((error: any) => {
					expect.fail("test failed, no error have been thrown" + error);
				});
		});

		it("should fail if id contains an underscore and other characters", function () {
			const rooms: string = datasetContents.get("rooms") ?? "";
			return insightFacade.addDataset("under_score", rooms, InsightDatasetKind.Rooms)
				.then((returnValue: string[]) => {
					expect.fail("test failed, InsightError should have been thrown");
				}).catch((error: any) => {
					expect(error).to.be.an.instanceof(InsightError);
				});
		});

		it("should fail if id contains only underscores", function () {
			const rooms: string = datasetContents.get("rooms") ?? "";
			return insightFacade.addDataset("___", rooms, InsightDatasetKind.Rooms)
				.then((returnValue: string[]) => {
					expect.fail("test failed, InsightError should have been thrown");
				}).catch((error: any) => {
					expect(error).to.be.an.instanceof(InsightError);
				});
		});

		it("should fail if id contains only whitespace", async function () {
			// allows us to run async function within the same scope of a function
			// forces the line to wait, until we get the result back from addDataset
			// feels synchronous!
			try {
				const rooms: string = datasetContents.get("rooms") ?? "";
				await insightFacade.addDataset("   ", rooms, InsightDatasetKind.Rooms);
				expect.fail("test failed, error should have been thrown");
			} catch(error: any) {
				expect(error).to.be.an.instanceof(InsightError);
			}
		});

		it("should fail if dataset with same id already exists", async function () {
			try {
				const rooms: string = datasetContents.get("rooms") ?? "";
				await insightFacade.addDataset("id", rooms, InsightDatasetKind.Rooms);
				await insightFacade.addDataset("id", rooms, InsightDatasetKind.Rooms);
			} catch(error: any) {
				expect(error).to.be.an.instanceof(InsightError);
			};
		});

		it("should fail if loading a non-zip, like a png", async function () {
			try {
				const dsPNG: string = datasetContents.get("dsPNG") ?? "";
				await insightFacade.addDataset("picture-id", dsPNG, InsightDatasetKind.Rooms);
			} catch(error: any) {
				// the test catches an error as expected
			};
		});

		it("should fail if dataset with same id already exists", async function () {
			try {
				const rooms: string = datasetContents.get("rooms") ?? "";
				await insightFacade.addDataset("id", rooms, InsightDatasetKind.Rooms);
				await insightFacade.addDataset("id", rooms, InsightDatasetKind.Rooms);
			} catch(error: any) {
				expect(error).to.be.an.instanceof(InsightError);
			};
		});

		// ******************** REMOVE DATASET ********************
		it("should pass if we add and then remove the dataset", async function () {
			try {
				const rooms: string = datasetContents.get("rooms") ?? "";
				await insightFacade.addDataset("id", rooms, InsightDatasetKind.Rooms);
				await insightFacade.removeDataset("id");
			} catch(error: any) {
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
				const rooms: string = datasetContents.get("rooms") ?? "";
				await insightFacade.addDataset("id-1", rooms, InsightDatasetKind.Rooms);
				await insightFacade.addDataset("id-2", rooms, InsightDatasetKind.Rooms);

				const insightDatasets1 = await insightFacade.listDatasets();
				expect(insightDatasets1).to.be.an.instanceof(Array);
				expect(insightDatasets1).to.have.length(2);

				const insightDatasetRooms1 = insightDatasets1.find((dataset) => dataset.id === "id-1");
				expect(insightDatasetRooms1).to.exist;

				expect (insightDatasetRooms1).to.deep.equal({
					id: "id-1",
					kind: InsightDatasetKind.Rooms,
					numRows: 364,
				});
				const insightDatasetRooms2 = insightDatasets1.find((dataset) => dataset.id === "id-2");
				expect(insightDatasetRooms2).to.exist;
				expect (insightDatasetRooms2).to.deep.equal({
					id: "id-2",
					kind: InsightDatasetKind.Rooms,
					numRows: 364,
				});

				await insightFacade.removeDataset("id-1");
				const insightDatasets2 = await insightFacade.listDatasets();
				expect(insightDatasets2).to.be.an.instanceof(Array);
				expect(insightDatasets2).to.have.length(1);

			} catch(error: any) {
				expect.fail("test failed, no errors expected" + error);
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
			const rooms: string = datasetContents.get("rooms") ?? "";
			return insightFacade.addDataset("rooms", rooms, InsightDatasetKind.Rooms)
				.then((addedIds) => {
					return insightFacade.listDatasets();
				}).then((insightDatasets) => {
					expect(insightDatasets).to.deep.equal([{
						id: "rooms",
						kind: InsightDatasetKind.Rooms,
						numRows: 364,
					}]);
				});
		});

		it("should list Rooms and Courses datasets", function() {
			const courses: string = datasetContents.get("courses") ?? "";
			const rooms: string = datasetContents.get("rooms") ?? "";
			return insightFacade.addDataset("sections", courses, InsightDatasetKind.Sections)
				.then(() => {
					return insightFacade.addDataset("rooms", rooms, InsightDatasetKind.Rooms);
				})
				.then(() => {
					return insightFacade.listDatasets();
				}).then((insightDatasets) => {
					expect(insightDatasets).to.deep.members([
						{
							id: "rooms",
							kind: InsightDatasetKind.Rooms,
							numRows: 364,
						},
						{
							id: "sections",
							kind: InsightDatasetKind.Sections,
							numRows: 64612,
						},
					]);
				});
		});
	});
});
