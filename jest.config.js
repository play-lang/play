module.exports = {
	preset: "ts-jest",
	testEnvironment: "node",
	collectCoverageFrom: [
		"src/**/*.ts"
	],
	// Thanks to https://stackoverflow.com/a/50863753/4615448
	roots: [
		"<rootDir>",
	],
	modulePaths: [
		"<rootDir>",
	],
	moduleDirectories: [
		"node_modules"
	],
};
