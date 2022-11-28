import express, {Application, Request, Response} from "express";
import * as http from "http";
import cors from "cors";
import InsightFacade from "../controller/InsightFacade";
import {InsightDatasetKind, InsightError, NotFoundError} from "../controller/IInsightFacade";

export default class Server {
	private readonly port: number;
	private express: Application;
	private server: http.Server | undefined;
	private static insightFacade: InsightFacade;

	constructor(port: number) {
		console.info(`Server::<init>( ${port} )`);
		this.port = port;
		this.express = express();

		this.registerMiddleware();
		this.registerRoutes();

		Server.insightFacade = new InsightFacade();

		// NOTE: you can serve static frontend files in from your express server
		// by uncommenting the line below. This makes files in ./frontend/public
		// accessible at http://localhost:<port>/
		// this.express.use(express.static("./frontend/public"))
	}

	/**
	 * Starts the server. Returns a promise that resolves if success. Promises are used
	 * here because starting the server takes some time and we want to know when it
	 * is done (and if it worked).
	 *
	 * @returns {Promise<void>}
	 */
	public start(): Promise<void> {
		return new Promise((resolve, reject) => {
			console.info("Server::start() - start");
			if (this.server !== undefined) {
				console.error("Server::start() - server already listening");
				reject();
			} else {
				this.server = this.express.listen(this.port, () => {
					console.info(`Server::start() - server listening on port: ${this.port}`);
					resolve();
				}).on("error", (err: Error) => {
					// catches errors in server start
					console.error(`Server::start() - server ERROR: ${err.message}`);
					reject(err);
				});
			}
		});
	}

	/**
	 * Stops the server. Again returns a promise so we know when the connections have
	 * actually been fully closed and the port has been released.
	 *
	 * @returns {Promise<void>}
	 */
	public stop(): Promise<void> {
		console.info("Server::stop()");
		return new Promise((resolve, reject) => {
			if (this.server === undefined) {
				console.error("Server::stop() - ERROR: server not started");
				reject();
			} else {
				this.server.close(() => {
					console.info("Server::stop() - server closed");
					resolve();
				});
			}
		});
	}

	// Registers middleware to parse request before passing them to request handlers
	private registerMiddleware() {
		// JSON parser must be place before raw parser because of wildcard matching done by raw parser below
		this.express.use(express.json());
		this.express.use(express.raw({type: "application/*", limit: "10mb"}));

		// enable cors in request headers to allow cross-origin HTTP requests
		this.express.use(cors());
	}

	// Registers all request handlers to routes
	private registerRoutes() {
		this.express.put(   "/dataset/:id/:kind", Server.add);
		this.express.delete("/dataset/:id",       Server.remove);
		this.express.post(  "/query",             Server.query);
		this.express.get(   "/datasets",          Server.list);
	}

	// add dataset
	private static async add(req: Request, res: Response) {
		try {
			console.log(`Server::add(..) - params: ${JSON.stringify(req.params)}`);
			let requestID      = req.params.id;
			let requestKind    = req.params.kind;
			let requestContent = req.body.toString("base64");
			const response     = await Server.performAddDataset(requestID, requestContent, requestKind);
			res.status(200).json({result: response});
		} catch (err: any) {
			res.status(400).json({error: err.message});
		}
	}

	private static performAddDataset(id: any, content: any, kindString: any) {
		let kind: InsightDatasetKind;
		if (kindString === "sections") {
			kind = InsightDatasetKind.Sections;
		} else {
			kind = InsightDatasetKind.Rooms;
		}
		return Server.insightFacade.addDataset(id, content, kind);
	}

	// remove dataset
	private static async remove(req: Request, res: Response) {
		try {
			console.log(`Server::remove(..) - params: ${JSON.stringify(req.params)}`);
			let deleteID = req.params.id;
			const response = await Server.performRemoveDataset(deleteID);
			res.status(200).json({result: response});
		} catch (err: any) {
			if (err instanceof InsightError) {
				res.status(400).json({error: err.message});
			}
			if (err instanceof NotFoundError) {
				res.status(404).json({error: err.message});
			}
		}
	}

	private static performRemoveDataset(id: any) {
		return Server.insightFacade.removeDataset(id);
	}

	// query dataset
	private static async query(req: Request, res: Response) {
		try {
			console.log(`Server::query(..) - params: ${JSON.stringify(req.params)}`);
			const response = await Server.performQuery(req.body);
			res.status(200).json({result: response});
		} catch (err: any) {
			res.status(400).json({error: err.message});
		}
	}

	private static performQuery(query: any) {
		return Server.insightFacade.performQuery(query);
	}

	// list datasets
	private static async list(req: Request, res: Response) {
		try {
			console.log(`Server::list(..) - params: ${JSON.stringify(req.params)}`);
			const response = await Server.performListDatasets();
			res.status(200).json({result: response});
		} catch (err: any) {
			res.status(400).json({error: err.message});
		}
	}

	private static performListDatasets() {
		return Server.insightFacade.listDatasets();
	}
}
