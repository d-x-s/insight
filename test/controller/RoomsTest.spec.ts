import * as fs from "fs-extra";
import {beforeEach} from "mocha";
import InsightFacade from "../../src/controller/InsightFacade";
import {InsightDatasetKind, InsightError} from "../../src/controller/IInsightFacade";
import {expect} from "chai";


describe("Rooms", function() {

	let insightFacade: InsightFacade;

	const persistDirectory = "./data";
	const datasetContents = new Map<string, string>();

	// Reference any datasets you've added to test/resources/archives here, and they will
	// automatically be loaded in the 'before' hook.
	const datasetsToLoad: {[key: string]: string} = {
		rooms: "./test/resources/archives/rooms.zip",
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
			const rooms: string = datasetContents.get("Rooms") ?? "";
			return insightFacade.addDataset("rooms", rooms, InsightDatasetKind.Rooms)
				.then((addedIds) => {
					expect(addedIds).to.be.an.instanceOf(Array);
					expect(addedIds).to.have.length(1);
				}).catch((error: any) => {
					expect.fail("test failed, no error have been thrown" + error);
				});
		});

		it("should fail if id contains an underscore and other characters", function () {
			const courses: string = datasetContents.get("rooms") ?? "";
			return insightFacade.addDataset("under_score", courses, InsightDatasetKind.Rooms)
				.then((returnValue: string[]) => {
					expect.fail("test failed, InsightError should have been thrown");
				}).catch((error: any) => {
					expect(error).to.be.an.instanceof(InsightError);
				});
		});

		it("should fail if id contains only underscores", function () {
			const courses: string = datasetContents.get("rooms") ?? "";
			return insightFacade.addDataset("___", courses, InsightDatasetKind.Rooms)
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
				const courses: string = datasetContents.get("rooms") ?? "";
				await insightFacade.addDataset("   ", courses, InsightDatasetKind.Rooms);
				expect.fail("test failed, error should have been thrown");
			} catch(error: any) {
				expect(error).to.be.an.instanceof(InsightError);
			}
		});

		it("should fail if dataset with same id already exists", async function () {
			try {
				const courses: string = datasetContents.get("rooms") ?? "";
				await insightFacade.addDataset("id", courses, InsightDatasetKind.Rooms);
				await insightFacade.addDataset("id", courses, InsightDatasetKind.Rooms);
			} catch(error: any) {
				expect(error).to.be.an.instanceof(InsightError);
			};
		});

		it("should fail if we add wrong kind", async function () {
			try {
				const courses: string = datasetContents.get("rooms") ?? "";
				await insightFacade.addDataset("id", courses, InsightDatasetKind.Rooms);
				expect.fail("test failed, somehow added wrong kind");
			} catch(error: any) {
				expect(error).to.be.an.instanceof(InsightError);
			};
		});


	});
});
