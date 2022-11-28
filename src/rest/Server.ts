import express, {Application, NextFunction, Request, Response} from "express";
import * as http from "http";
import cors from "cors";
import InsightFacade from "../controller/InsightFacade";
import {InsightDatasetKind, InsightError} from "../controller/IInsightFacade";

export default class Server {
	private readonly port: number;
	private express: Application;
	private server: http.Server | undefined;
	private insightFacade: InsightFacade;
	private static insightFacade: InsightFacade;

	constructor(port: number) {
		console.info(`Server::<init>( ${port} )`);
		this.port = port;
		this.express = express();

		this.registerMiddleware();
		this.registerRoutes();

		this.insightFacade = new InsightFacade();

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
		// This is an example endpoint this you can invoke by accessing this URL in your browser:
		// http://localhost:4321/echo/hello
		this.express.get("/echo/:msg", Server.echo);

		// TODO: your other endpoints should go here

		// addDataset
		// use put instead of post:
		// https://stackoverflow.com/questions/107390/whats-the-difference-between-a-post-and-a-put-http-request
		this.express.put("/dataset/:id/:kind", Server.put);

		// removeDataset
		this.express.delete("/dataset/:id", Server.del);

		// performQuery
		this.express.post("/query", Server.post);

		// listDataset
		// this.express.get("/dataset");


	}

	// The next two methods handle the echo service.
	// These are almost certainly not the best place to put these, but are here for your reference.
	// By updating the Server.echo function pointer above, these methods can be easily moved.
	private static echo(req: Request, res: Response) {
		try {
			console.log(`Server::echo(..) - params: ${JSON.stringify(req.params)}`);
			const response = Server.performEcho(req.params.msg);
			res.status(200).json({result: response});
		} catch (err) {
			res.status(400).json({error: err});
		}
	}

	private static performEcho(msg: string): string {
		if (typeof msg !== "undefined" && msg !== null) {
			return `${msg}...${msg}`;
		} else {
			return "Message not provided";
		}
	}

	// refer to: https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods/PUT#:~:text=The%20HTTP%20PUT%20request%20method,resource%20with%20the%20request%20payload.
	// https://stackoverflow.com/questions/13133071/express-next-function-what-is-it-really-for
	private static put(req: Request, res: Response, next: NextFunction) {
		try {
			// console.log(`Server::echo(..) - params: ${JSON.stringify(req.params)}`);
			// const response = Server.performEcho(req.params.msg);
			// res.status(200).json({result: response});
			let requestKind: InsightDatasetKind;
			if (req.params.kind === "sections") {
				requestKind = InsightDatasetKind.Sections;
			} else if (req.params.kind === "rooms") {
				requestKind = InsightDatasetKind.Rooms;
			} else {
				throw new InsightError("Error parsing params.kind");
			}
			return this.insightFacade.addDataset(req.params.id, req.params.body, requestKind)
				.then((addDatasetResult) => {
					res.status(200).json({
						result: addDatasetResult,
					});
					return next();
				});
		} catch (err) {
			res.status(400).json({error: err});
		}
	}

	private static del(req: Request, res: Response, next: NextFunction) {
		try {
			// console.log(`Server::echo(..) - params: ${JSON.stringify(req.params)}`);
			// const response = Server.performEcho(req.params.msg);
			// res.status(200).json({result: response});
			return this.insightFacade.removeDataset(req.params.id)
				.then((removeDatasetResult) => {
					res.status(200).json({
						result: removeDatasetResult,
					});
					return next();
				});
		} catch (err) {
			res.status(400).json({error: err});
		}
	}

	private static post(req: Request, res: Response) {
		try {
			console.log(`Server::echo(..) - params: ${JSON.stringify(req.params)}`);
			const response = Server.performEcho(req.params.msg);
			res.status(200).json({result: response});
		} catch (err) {
			res.status(400).json({error: err});
		}
	}

	private static performPost(msg: string): string {
		if (typeof msg !== "undefined" && msg !== null) {
			return `${msg}...${msg}`;
		} else {
			return "Message not provided";
		}
	}

	private static get(req: Request, res: Response) {
		try {
			console.log(`Server::echo(..) - params: ${JSON.stringify(req.params)}`);
			const response = Server.performEcho(req.params.msg);
			res.status(200).json({result: response});
		} catch (err) {
			res.status(400).json({error: err});
		}
	}

	private static performGet(msg: string): string {
		if (typeof msg !== "undefined" && msg !== null) {
			return `${msg}...${msg}`;
		} else {
			return "Message not provided";
		}
	}

}
