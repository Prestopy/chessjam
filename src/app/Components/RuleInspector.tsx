"use client";
import {PieceName} from "@/app/utils/types";
import {FullStrategy, Generator} from "@/app/generator/Generator";

// Dynamic map to translate your numeric enum keys to readable strings
const STRING_PIECE_NAMES: Record<number, string> = {
	[PieceName.Pawn]: "Pawn",
	[PieceName.Knight]: "Knight",
	[PieceName.Bishop]: "Bishop",
	[PieceName.Rook]: "Rook",
	[PieceName.Queen]: "Queen",
	[PieceName.King]: "King",
};

interface RuleInspectorProps {
	registeredStrategies: Map<PieceName, FullStrategy> | undefined;
	highlightDifferences?: boolean; // Optional prop to enable difference highlighting
}

export default function RuleInspector({registeredStrategies, highlightDifferences}: RuleInspectorProps) {
	const standardStrats = Generator.standardRules().getStrategies();

	const piecesList = [
		PieceName.Pawn,
		PieceName.Knight,
		PieceName.Bishop,
		PieceName.Rook,
		PieceName.Queen,
		PieceName.King
	];

	const isStandardRule = (piece: PieceName) => {
		if (!registeredStrategies) return true; // If no strategies, consider them the same
		const current = registeredStrategies.get(piece);
		const standard = standardStrats.get(piece);
		if (!current || !standard) return true; // If either is missing, consider them the same

		// Simple comparison: check if move and capture geometries are identical
		const movesEqual = JSON.stringify(current.move.map(m => m.getGeometry().getDetails())) ===
		                   JSON.stringify(standard.move.map(m => m.getGeometry().getDetails()));

		const capturesEqual = JSON.stringify(current.capture.map(c => c.getGeometry().getDetails())) ===
		                      JSON.stringify(standard.capture.map(c => c.getGeometry().getDetails()));

		const modsEqual = JSON.stringify(current.modifiers?.map(mod => mod.constructor.name)) ===
		                  JSON.stringify(standard.modifiers?.map(mod => mod.constructor.name));

		return movesEqual && capturesEqual && modsEqual;
	}

	return (
		<div className="space-y-5 animate-fadeIn flex flex-col min-h-0 flex-1 min-w-0">
			{/* Dynamic Rule Inspector Output Board */}
			<div
				className="flex-1 space-y-3 overflow-y-auto pr-1 border border-zinc-800/80 bg-zinc-950/40 p-4 rounded-xl"
			>
				<span className="text-xs font-mono uppercase tracking-widest text-zinc-500 font-bold block mb-2">
					Active Manifest
				</span>

				{piecesList.map((piece, i) => {
					const strategy = registeredStrategies?.get(piece);
					if (!strategy) return null;

					const moves: string[] = strategy.move.map((m) => m.getGeometry().getDetails().moveDesc).filter(Boolean);
					const captures: string[] = strategy.capture.map((c) => c.getGeometry().getDetails().captureDesc).filter(Boolean);
					const modsDesc = strategy.modifiers?.map((mod) => mod.constructor.name).join(", ");

					return (
						<div key={i}
						     className="bg-zinc-950/90 border border-zinc-800 p-3.5 rounded-xl font-mono text-sm space-y-3 min-w-0 shadow-lg"
						     id={STRING_PIECE_NAMES[piece].toLowerCase()}
						>
							{/* Header Row */}
							<div
								className={`${highlightDifferences && !isStandardRule(piece) ? "text-purple-500" : "text-zinc-100"} text-base font-bold uppercase tracking-wide border-b border-zinc-800/80 pb-2 flex flex-row justify-between items-center gap-2`}>
								<span className="truncate">{STRING_PIECE_NAMES[piece] ?? "Unknown"}</span>
								{modsDesc && (
									<span
										className="text-purple-300 normal-case font-medium text-xs bg-purple-950/80 px-2 py-0.5 rounded-md border border-purple-800 shrink-0 truncate">
                                        ✨ {modsDesc}
									</span>
								)}
							</div>

							{/* Moves & Captures Block Split */}
							<div className="grid grid-cols-2 gap-4 pt-0.5">
								{/* Quiet Moves List */}
								<div className="space-y-1.5 min-w-0">
									<span
										className="text-xs text-zinc-500 font-bold tracking-wider uppercase block">Movement</span>
									{moves.length > 0 ? (
										<ul className="space-y-1.5 text-zinc-300 list-none pl-0">
											{moves.map((desc, idx) => (
												<li key={idx} className="flex items-start gap-2 leading-normal">
													<span
														className="text-zinc-600 shrink-0 select-none font-bold text-base line-clamp-1">·</span>
													<span className="break-words min-w-0 font-medium">{desc}</span>
												</li>
											))}
										</ul>
									) : (
										<span className="text-zinc-600 italic block text-xs">None</span>
									)}
								</div>

								{/* Captures List */}
								<div className="space-y-1.5 min-w-0">
									<span
										className="text-xs text-red-400/80 font-bold tracking-wider uppercase block">Captures</span>
									{captures.length > 0 ? (
										<ul className="space-y-1.5 text-zinc-300 list-none pl-0">
											{captures.map((desc, idx) => (
												<li key={idx} className="flex items-start gap-2 leading-normal">
													<span
														className="text-red-800 shrink-0 select-none font-bold text-base line-clamp-1">·</span>
													<span className="break-words min-w-0 font-medium">{desc}</span>
												</li>
											))}
										</ul>
									) : (
										<span className="text-zinc-600 italic block text-xs">None</span>
									)}
								</div>
							</div>
						</div>
					);
				})}
			</div>
		</div>
	);
}
