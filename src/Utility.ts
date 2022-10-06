export default class Utility {

	/**
	 * debugger tool
	 *
	 * @param message  a string describing the information you want to log
	 * @param logType  "trace", "info", "warn", "error", "test"
	 *
	 */
	public static log(message: string, logType: string) {
		switch(logType) {
			case "trace":
				console.log(`trace; ${ new Date().toString() }:${ message }`);
				break;
			case "info":
				console.log(`info; ${ new Date().toString() }:${ message }`);
				break;
			case "warn":
				console.log(`warn; ${ new Date().toString() }:${ message }`);
				break;
			case "error":
				console.log(`error; ${ new Date().toString() }:${ message }`);
			case "test":
				console.log(`test; ${ new Date().toString() }:${ message }`);
				break;
			default:
				break;
		}
	}
}
