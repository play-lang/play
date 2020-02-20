import { LinkedHashMap } from "src/common/linked-hash-map";
import {
	Collection,
	FunctionType,
	ModelType,
	Num,
	RecordType,
	Type,
} from "src/language/types/type-system";

/**
 * Create a collection model type based on the type of collection and element
 * being stored
 */
export function collectionModelType(
	collection: Collection,
	elementType: Type
): ModelType {
	switch (collection) {
		case Collection.List:
			return new ModelType(
				"list",
				[
					new FunctionType(
						"pop",
						new RecordType(new LinkedHashMap([])),
						elementType
					),
					new FunctionType(
						"push",
						new RecordType(new LinkedHashMap([["element", elementType]])),
						Num
					),
					new FunctionType(
						"shift",
						new RecordType(new LinkedHashMap([])),
						elementType
					),
					new FunctionType(
						"unshift",
						new RecordType(new LinkedHashMap([["element", elementType]])),
						Num
					),
				],
				new Map([["length", Num]])
			);
		case Collection.Map:
			return new ModelType("map", [], new Map([["size", Num]]));
	}
}
