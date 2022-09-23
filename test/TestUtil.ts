import * as fs from "fs-extra";

const persistDir = "./data";

function getContentFromArchives(name: string): string {
	return fs.readFileSync("test/resources/archives/" + name).toString("base64");
}

function clearDisk(): void {
	fs.removeSync(persistDir);
}

export {getContentFromArchives, persistDir, clearDisk};
