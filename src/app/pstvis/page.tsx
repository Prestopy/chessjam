"use client";

import { useState } from "react";
import { Color, makePiece, PieceName } from "@/app/bitboardHelpers";
import { GameStage, swapColor } from "@/app/utils";
import { PST as StaticPST } from "@/app/engines/pst";

// Map our 0 and 1 state variables safely back to the GameStage enum variants
const STAGE_MAP: Record<number, GameStage> = {
	0: GameStage.Midgame,
	1: GameStage.Endgame,
};

export default function PstVis() {
	const [piece, setPiece] = useState<PieceName>(PieceName.Pawn);
	const [color, setColor] = useState<Color>(Color.White);

	// Changed to allow decimals for interpolation view (e.g. 0.35)
	const [stage, setStage] = useState<number>(0);

	// Seed editable PST data with clean structures pointing to the correct enum targets
	const [editablePst, setEditablePst] = useState(() => {
		const initial = {
			[GameStage.Midgame]: JSON.parse(JSON.stringify(StaticPST[GameStage.Midgame])),
			[GameStage.Endgame]: JSON.parse(JSON.stringify(StaticPST[GameStage.Endgame]))
		};
		return initial;
	});

	const [selectedVisualIndices, setSelectedVisualIndices] = useState<Set<number>>(new Set());
	const [isDragging, setIsDragging] = useState<boolean>(false);
	const [inputValue, setInputValue] = useState<string>("0");

	// Check if the current stage is an absolute 0 or 1 state
	const isAbsoluteStage = stage === 0 || stage === 1;
	const currentEnumStage = STAGE_MAP[stage as 0 | 1];

	const getPST = (targetPiece: PieceName) => {
		const v1 = editablePst[GameStage.Midgame][makePiece(targetPiece, color)] || [];
		const v2 = editablePst[GameStage.Endgame][makePiece(targetPiece, color)] || [];

		// Interpolate dynamically between midgame and endgame arrays
		// @ts-expect-error lazy
		return v1.map((val, idx) => Math.round(val * (1 - stage) + (v2[idx] ?? 0) * stage));
	};

	const getColor = (v: number): string => {
		const clampedV = Math.max(-100, Math.min(100, v));
		let r = 0;
		let g = 0;

		if (clampedV < 0) {
			r = 255;
			g = Math.round(((100 + clampedV) / 100) * 255);
		} else {
			r = Math.round(((100 - clampedV) / 100) * 255);
			g = 255;
		}

		const toHex = (c: number) => c.toString(16).padStart(2, '0');
		return `#${toHex(r)}${toHex(g)}00`;
	};

	const handleSquareMouseDown = (visualIndex: number) => {
		if (!isAbsoluteStage) return; // Disallow interaction if editing is locked
		setIsDragging(true);
		const newSelection = new Set(selectedVisualIndices);
		if (newSelection.has(visualIndex)) {
			newSelection.delete(visualIndex);
		} else {
			newSelection.add(visualIndex);
		}
		setSelectedVisualIndices(newSelection);
	};

	const handleSquareMouseEnter = (visualIndex: number) => {
		if (!isDragging || !isAbsoluteStage) return;
		const newSelection = new Set(selectedVisualIndices);
		newSelection.add(visualIndex);
		setSelectedVisualIndices(newSelection);
	};

	const applyValueToSelected = () => {
		const newValue = parseInt(inputValue);
		if (isNaN(newValue) || selectedVisualIndices.size === 0 || !isAbsoluteStage) return;

		const updatedPst = { ...editablePst };
		const targetPieceKey = makePiece(piece, color);
		const oppositeColor = swapColor(color);
		const oppositePieceKey = makePiece(piece, oppositeColor);

		selectedVisualIndices.forEach((visualIndex) => {
			const actualIndex = color === Color.Black ? visualIndex ^ 56 : visualIndex;

			// Mutate active piece at the absolute active variant stage
			// @ts-expect-error lazy
			updatedPst[currentEnumStage][targetPieceKey][actualIndex] = newValue;

			// Maintain mirrored symmetry values
			// @ts-expect-error lazy
			updatedPst[currentEnumStage][oppositePieceKey][actualIndex ^ 56] = newValue;
		});

		setEditablePst(updatedPst);
		setSelectedVisualIndices(new Set());
	};

	const deselectAll = () => {
		setSelectedVisualIndices(new Set());
	};

	const generateExportString = (): string => {
		if (!isAbsoluteStage) {
			return `// Export unavailable while interpolating.\n// Snap back to 0 (Midgame) or 1 (Endgame) to export code.`;
		}

		// @ts-expect-error lazy
		const currentData: number[] = editablePst[currentEnumStage][makePiece(piece, color)];
		const orientedData = [...currentData];

		const rows: string[] = [];
		for (let i = 0; i < 64; i += 8) {
			const rowChunk = orientedData.slice(i, i + 8);
			const formattedRow = rowChunk.map(v => String(v).padStart(4, ' ')).join(',');
			rows.push(`    [${formattedRow}]`);
		}

		// @ts-expect-error PieceName is a const enum for optimization
		const tableName = `${GameStage[currentEnumStage]}_${PieceName[piece]}_PST`.toUpperCase();
		return `const ${tableName} = [\n${rows.join(",\n")}\n].flat();`;
	};

	// Use current absolute state array if exact, otherwise build the interpolated view structure
	const visibleArray: number[] = isAbsoluteStage
		// @ts-expect-error lazy
		? (editablePst[currentEnumStage][makePiece(piece, color)] || [])
		: getPST(piece);

	return (
		<div className="p-4" onMouseUp={() => setIsDragging(false)}>
			<h1 className="text-2xl font-bold mb-4">PST Visualization Matrix</h1>

			<div className="flex flex-row justify-center gap-10 margin-auto">
				<div>
					<h2 className="text-xl font-semibold mb-2">
						{color === Color.White ? "White" : "Black"} Perspective
						{!isAbsoluteStage && <span className="ml-2 text-sm text-amber-500 font-bold">(Interpolated View)</span>}
					</h2>
					<p className="font-bold bg-white text-black px-2 py-0.5 text-xs uppercase">White Back Rank</p>
					<div className="grid grid-cols-8 grid-rows-8 gap-0 w-fit select-none border-2 border-slate-700">
						{
							visibleArray.map((n, i) => {
								const isSelected = selectedVisualIndices.has(i);
								return (
									<button
										key={i}
										disabled={!isAbsoluteStage}
										onMouseDown={() => handleSquareMouseDown(i)}
										onMouseEnter={() => handleSquareMouseEnter(i)}
										className={`w-12 h-12 flex flex-col items-center justify-center border transition-all ${
											isSelected ? "ring-4 ring-blue-500 z-10 scale-105 border-transparent" : "border-slate-800"
										} ${!isAbsoluteStage ? "cursor-not-allowed" : "cursor-crosshair"}`}
										style={{
											backgroundColor: getColor(n),
										}}
										title={`Array Index: ${color === Color.Black ? i ^ 56 : i}\nVisual Grid Index: ${i}`}
									>
		                               <span className="text-black text-[9px] opacity-50 font-mono leading-none mb-1">
		                                  #{color === Color.Black ? i ^ 56 : i}
		                               </span>
										<span className="text-black text-sm font-bold">{n}</span>
									</button>
								);
							})
						}
					</div>
					<p className="font-bold bg-black text-white px-2 py-0.5 text-xs uppercase">Black Back Rank</p>
				</div>

				<div className="flex flex-col gap-4 w-80">
					<div>
						<label className="block text-sm font-medium mb-1">Select Piece Architecture</label>
						<select
							value={piece}
							className="bg-zinc-800 text-white rounded p-1.5 text-md w-full border border-zinc-700"
							onChange={(e) => { setPiece(parseInt(e.target.value)); setSelectedVisualIndices(new Set()); }}
						>
							<option value={PieceName.Pawn}>Pawn</option>
							<option value={PieceName.Knight}>Knight</option>
							<option value={PieceName.Bishop}>Bishop</option>
							<option value={PieceName.Rook}>Rook</option>
							<option value={PieceName.King}>King</option>
							<option value={PieceName.Queen}>Queen</option>
						</select>
					</div>

					<div>
						<div className="flex justify-between text-sm mb-1">
							<span>Midgame (0.0)</span>
							<span className="font-mono text-cyan-400 font-bold">{stage.toFixed(2)}</span>
							<span>Endgame (1.0)</span>
						</div>
						<input
							type="range"
							min={0}
							max={1}
							step={0.01}
							value={stage}
							className="w-full accent-cyan-500"
							onChange={(e) => {
								const val = parseFloat(e.target.value);
								setStage(val);
								// Instantly deselect nodes if moving out of absolute values
								if (val !== 0 && val !== 1) setSelectedVisualIndices(new Set());
							}}
						/>
					</div>

					<div>
						<label className="block text-sm font-medium mb-1">Perspective Alignment</label>
						<button
							className="w-full bg-zinc-800 hover:bg-zinc-700 text-white text-sm p-2 border border-zinc-700 rounded transition-colors"
							onClick={() => { setColor(swapColor(color)); setSelectedVisualIndices(new Set()); }}
						>
							Flip to {swapColor(color) === Color.White ? "White" : "Black"}
						</button>
					</div>

					{/* Unified On-Screen Multi-Square Value Editor */}
					<div className="p-3 bg-zinc-800 border border-zinc-700 rounded">
						<p className="text-sm font-medium mb-2">
							Selected Nodes: <span className="font-bold text-cyan-400">{selectedVisualIndices.size}</span>
						</p>

						{!isAbsoluteStage ? (
							<div className="text-xs text-amber-400 bg-amber-950/40 p-2 rounded border border-amber-800/50">
								Editing is locked while tracking an active interpolation slider position. Return stage back to 0.00 or 1.00 to alter values.
							</div>
						) : (
							<div className="flex flex-col gap-2">
								<div className="flex gap-2">
									<input
										type="number"
										value={inputValue}
										onChange={(e) => setInputValue(e.target.value)}
										className="bg-zinc-900 text-white rounded text-sm w-full p-1.5 border border-zinc-700"
										placeholder="Centipawns"
									/>
									<button
										onClick={applyValueToSelected}
										disabled={selectedVisualIndices.size === 0}
										className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold px-3 py-1.5 text-xs rounded disabled:opacity-30 disabled:pointer-events-none transition-colors whitespace-nowrap"
									>
										Apply Matrix
									</button>
								</div>
								<button
									onClick={deselectAll}
									disabled={selectedVisualIndices.size === 0}
									className="text-zinc-400 hover:text-white text-xs underline text-left disabled:opacity-30 disabled:pointer-events-none"
								>
									Clear Multi-Selection
								</button>
							</div>
						)}
					</div>

					<div>
						<p className="font-bold text-xs text-green-400 mb-1">Engine Macro Output</p>
						<textarea
							readOnly
							value={generateExportString()}
							className="w-full h-40 bg-zinc-950 text-green-400 font-mono p-2 text-[11px] rounded border border-zinc-800 resize-none"
							onClick={(e) => (e.target as HTMLTextAreaElement).select()}
						/>
					</div>
				</div>
			</div>
		</div>
	);
}
