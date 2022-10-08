import Utility from "../Utility";

export default class ValidateQueryHelper {

	// TODO: keys will be extended in future checkpoints
	protected valid: boolean;
	protected QKEYS = ["OPTIONS", "WHERE"];
	protected MFIELDS = ["avg", "pass", "fail", "audit", "year"];
	protected SFIELDS = ["dept", "id", "instructor", "title", "uuid"];

	constructor() {
		Utility.log("initializing ValidateQueryHelper", "trace");
		this.valid = true;
	}

	public getValid() {
		return this.valid;
	}

	// @TODO: see piazza@502, is this the right way to access? treat it like a JSON?
	// https://piazza.com/class/l7qenrnq7oy512/post/502
	// this query is not a JSON, but rather a Javascript Object
	public validateQuery(query: any, id: string) {
		try {

			// access query top level keys
			// grab a reference to JSON objects "WHERE" and "OPTIONS"
			const queryKeys = Object.keys(query);

			// 0) CHECK FOR VALID ARGUMENTS
			if (query === null || query === "undefined" || !(query instanceof Object)) {
				this.valid = false;
				return;
			}

			// 1) VALIDATE TOP LEVEL ACCESSORS
			// expect exactly 2 members (WHERE and OPTIONS)
			if (queryKeys.length !== 2) {
				Utility.log("isQueryValid: not exactly 2 top level members", "trace");
				this.valid = false;
				return;
			}
			// expect correct naming
			for (let k of queryKeys) {
				if(!this.QKEYS.includes(k)) {
					Utility.log("isQueryValid: typos or incorrect naming in WHERE and OPTIONS", "trace");
					this.valid = false;
					return;
				}
			}

			// 2) VALIDATE "WHERE" CLAUSE (FILTERING)
			this.validateFilter(query["WHERE"], id);

			// 3) VALIDATE "OPTIONS" CLAUSE (OUTPUT)
			this.isOptionsValid(query["OPTIONS"], id);

		} catch (error) {
			Utility.log("isQueryValid: error caught", "error");
		}
	}

	private validateFilter(query: any, id: string) {

		if (typeof query === "undefined" || !(query instanceof Object)) {
			this.valid = false;
			return;
		}

		const whereKeys = Object.keys(query);

		// empty WHERE is when you return the entire dataset (no filtering done)
		// so in this case it is trivially valid
		if (whereKeys.length === 0) {
			return;
		}

		// access element one level deeper
		// WHERE should only have 1 key, which is the FILTER
		// 'WHERE:{' FILTER? '}'
		// Unexpected response status 400: WHERE should only have 1 key, has 2
		// there are 4 choices of top-level filter, and we pick 1
		// LOGICCOMPARISON | MCOMPARISON | SCOMPARISON | NEGATION
		let filterKey = whereKeys[0];

		switch (filterKey) {
			// LOGICCOMPARISON "Logic"
			case "AND":
			case "OR":
				this.validateLogicComparison(query[filterKey], id);
				break;

			// MCOMPARISON "Math Comparison"
			case "LT":
			case "GT":
			case "EQ":
				this.validateMathComparison(query[filterKey], id);
				break;

			// SCOMPARISON "String Comparison"
			case "IS":
				this.validateStringComparison(query[filterKey], id);
				break;

			// NEGATION "Negation"
			case "NOT":
				this.isValidNegation(query[filterKey], id);
				break;

			// an invalid filter has been encountered
			default:
				this.valid = false;
				break;
		}
	}

	private validateLogicComparison(queryLogicArray: any, id: string) {
		// note the square brackets, indicating an array
		// LOGIC ':[{' FILTER ('}, {' FILTER )* '}]'
		if(
			!Array.isArray(queryLogicArray) ||
			queryLogicArray.length === 0 ||
			typeof queryLogicArray === "undefined" ||
			typeof queryLogicArray !== "object") {
			this.valid = false;
			return;
		}

		// check each element in the LOGIC[] array
		// access each element in the array, once again filter on it
		queryLogicArray.forEach((element: any) => {
			this.validateFilter(element, id);
		});
	}

	private validateMathComparison(mathComparator: any, id: string) {
		// we do need to check that LT/GT/EQ are well-formed, because the switch in validateFilter handles it,
		// I.E. "GT":{ "sections_avg":90 }, we now check what is directly within the curly braces
		// it is a singleton key/value pair, so expect a length 1
		// "Unexpected response status 400: GT should only have 1 key, has 2"

		//                      pair
		// MCOMPARATOR ':{' mkey ':' number '}'
		//                  key      value

		if(
			typeof mathComparator === "undefined" ||
			typeof mathComparator !== "object") {
			this.valid = false;
			return;
		}

		const pairMComparator = Object.keys(mathComparator);

		if (pairMComparator.length !== 1) {
			this.valid = false;
			return;
		}

		const keyMComparator = pairMComparator[0]; // grab the key of the pair
		const valueMComparator = mathComparator[keyMComparator]; // grab the value of the pair

		this.validateMKey(keyMComparator, id);
		this.validateMValue(valueMComparator);
	}

	private validateMKey(keyMComparator: string, id: string) {
		// mkey ::= idstring '_' mfield
		//   ^
		this.validateID(keyMComparator.split("_")[0], id);
		this.validateMField(keyMComparator.split("_")[1]);
	}

	private validateMValue(valueMComparator: any) {
		// MCOMPARATOR ':{' mkey ':' number '}'
		//                             ^
		if (!(typeof valueMComparator !== "number")) {
			this.valid = false;
			return;
		}
	}

	private validateMField(keyMField: any) {
		// mkey ::= idstring '_' mfield
		//                          ^
		if(!this.MFIELDS.includes(keyMField)) {
			this.valid = false;
		}
	}

	private validateStringComparison(stringComparator: any, id: string) {
		// SCOMPARISON ::= 'IS:{' skey ':' [*]? inputstring [*]? '}'  // Asterisks should act as wildcards.
		//                  ^ already accessed value inside IS at this point
		if(
			typeof stringComparator === "undefined" ||
			typeof stringComparator !== "object") {
			this.valid = false;
			return;
		}
		return;

		const pairSComparator = Object.keys(stringComparator);

		if (pairSComparator.length !== 1) {
			this.valid = false;
			return;
		}

		const sKey = pairSComparator[0];
		const inputString = stringComparator[sKey];

		this.validateSKey(sKey, id);
		this.validateSValue(inputString);
	}

	private validateSKey(sKey: string, id: string) {
		// skey ::= idstring '_' sfield
		//  ^
		this.validateID(sKey.split("_")[0], id);
		this.validateSField(sKey.split("_")[1]);
	}

	private validateSField(sField: any) {
		// skey ::= idstring '_' sfield
		//                          ^
		if(!this.SFIELDS.includes(sField)) {
			this.valid = false;
			return;
		}
	}

	private validateSValue(inputString: any) {
		// zero or more of any characters except asterisk
		// Unexpected response status 400: Asterisks (*) can only be the first or last characters of input strings
		// SCOMPARISON ::= 'IS:{' skey ':' [*]? inputstring [*]? '}'  // Asterisks should act as wildcards.
		//                                           ^
		if (typeof inputString !== "string") {
			this.valid = false;
		}

		let asteriskCheck = inputString;

		// covers "", "*", "**", and will fail "***" etc.
		if (asteriskCheck.endsWith("*")) {
			asteriskCheck = asteriskCheck.substring(0, asteriskCheck.length - 1);
		}

		if (asteriskCheck.startsWith("*")) {
			asteriskCheck = asteriskCheck.substring(1, asteriskCheck.length);
		}

		if (asteriskCheck.includes("*")) {
			this.valid = false;
			return;
		}
	}

	private validateID(idToVerify: string, id: string) {
		// id that is ONLY whitespace is invalid
		// id that contains an underscore is invalid
		// trim removes all leading and trailing whitespace characters
		// TODO: maybe need to check that it matches dataset id
		if (idToVerify.includes("_") || idToVerify.trim().length === 0) {
			this.valid = false;
		}
	}

	private isValidNegation(negation: any, id: string) {
		// NEGATION ::= 'NOT :{' FILTER '}'
		//                         ^
		// not contains exactly one key/value pair,
		// so we are actually just checking whatever is inside the NOT{}
		//       {
		//         "NOT": {
		//           "LT": {                      <-- LT/section_avg pair
		//             "sections_avg": 90
		//           }
		//         }
		//       }
		if (typeof negation === "undefined" || !(negation instanceof Object) || Object.keys(negation).length !== 1) {
			this.valid = false;
			return;
		}
		this.validateFilter(negation, id);
	}

	private isOptionsValid(options: any, id: string) {
		return;
	}
}
