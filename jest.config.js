module.exports = {
	preset: "ts-jest",
	testEnvironment: "node",
	collectCoverageFrom: [
		"src/**/*.ts"
	],
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
