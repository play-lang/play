import { FunctionInfo } from "../function-info";
import { SymbolTable } from "../symbol-table";

export interface Environment {
	/** Symbol table for use in the type-checking environment */
	symbolTable: SymbolTable;
	/** Function table for use in the type-checking environment */
	functionTable: Map<string, FunctionInfo>;
}
