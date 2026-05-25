// ENGINES
import {Engine} from "@/app/engines/Engine";
import Engine_v1 from "@/app/engines/Engine_v1";
import Engine_v2 from "@/app/engines/Engine_v2";
import Engine_v3 from "@/app/engines/Engine_v3";
import Engine_v4 from "@/app/engines/Engine_v4";
import Engine_v5 from "@/app/engines/Engine_v5";

export type EngineVersion = "1" | "2" | "3" | "4" | "5" | "6";

export interface EngineDetail {
	version: EngineVersion,
	name: string,
	getEngine: () => Engine
}

export const allEngines: EngineDetail[] =
	[
		{
			version: "1",
			name: "Random Move",
			getEngine: () => new Engine_v1(),
		},
		{
			version: "2",
			name: "Prioritize Capture Moves",
			getEngine: () => new Engine_v2(),
		},
		{
			version: "3",
			name: "Prioritize Valuable Piece Captures",
			getEngine: () => new Engine_v3(),
		},
		{
			version: "4",
			name: "Eval board with point count",
			getEngine: () => new Engine_v4(),
		},
		{
			version: "5",
			name: "Search v1",
			getEngine: () => new Engine_v5(),
		},
		{
			version: "6",
			name: "Search with PST",
			getEngine: () => new Engine_v5(),
		},
	];

export function getEngineDetail(ver: string) {
	return allEngines.find(e => e.version === ver) ?? null;
}
