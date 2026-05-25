"use client";

import { useState } from "react";
import { Color, makePiece, PieceName } from "@/app/bitboardHelpers";
import { GameStage, swapColor } from "@/app/utils";
import { PST as StaticPST } from "@/app/engines/pst";

export default function PstVis() {
	const [piece, setPiece] = useState<PieceName>(PieceName.Pawn);
	const [color, setColor] = useState<Color>(Color.White);
	const [stage, setStage] = useState<Exclude<GameStage, GameStage.Opening>>(GameStage.Midgame);

	const [editablePst, setEditablePst] = useState(() => JSON.parse(JSON.stringify(StaticPST)));

	// Track multi-selection visually by grid index
	const [selectedVisualIndices, setSelectedVisualIndices] = useState<Set<number>>(new Set());
	const [isDragging, setIsDragging] = useState<boolean>(false);
	const [inputValue, setInputValue] = useState<string>("0");

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

	// Handle initial square interaction
	const handleSquareMouseDown = (visualIndex: number) => {
		setIsDragging(true);
		const newSelection = new Set(selectedVisualIndices);
		if (newSelection.has(visualIndex)) {
			newSelection.delete(visualIndex);
		} else {
			newSelection.add(visualIndex);
		}
		setSelectedVisualIndices(newSelection);
	};

	// Handle drag selection expansion
	const handleSquareMouseEnter = (visualIndex: number) => {
		if (!isDragging) return;
		const newSelection = new Set(selectedVisualIndices);
		newSelection.add(visualIndex);
		setSelectedVisualIndices(newSelection);
	};

	// Apply the on-screen input value to all selected nodes
	const applyValueToSelected = () => {
		const newValue = parseInt(inputValue);
		if (isNaN(newValue) || selectedVisualIndices.size === 0) return;

		const updatedPst = { ...editablePst };
		const targetPieceKey = makePiece(piece, color);
		const oppositeColor = swapColor(color);
		const oppositePieceKey = makePiece(piece, oppositeColor);

		selectedVisualIndices.forEach((visualIndex) => {
			const actualIndex = color === Color.Black ? visualIndex ^ 56 : visualIndex;

			// Mutate active piece
			updatedPst[stage][targetPieceKey][actualIndex] = newValue;

			// Maintain mirrored symmetry values
			updatedPst[stage][oppositePieceKey][actualIndex ^ 56] = newValue;
		});

		setEditablePst(updatedPst);
		setSelectedVisualIndices(new Set()); // Clear selection after apply
	};

	const deselectAll = () => {
		setSelectedVisualIndices(new Set());
	}

	const generateExportString = (): string => {
		const currentData: number[] = editablePst[stage][makePiece(piece, color)];
		const orientedData = [...currentData];

		const rows: string[] = [];
		for (let i = 0; i < 64; i += 8) {
			const rowChunk = orientedData.slice(i, i + 8);
			const formattedRow = rowChunk.map(v => String(v).padStart(4, ' ')).join(',');
			rows.push(`    [${formattedRow}]`);
		}

		// @ts-expect-error PieceName is a const enum for optimization, and you can't use [piece] to index a const enum...
		const tableName = `${GameStage[stage]}_${PieceName[piece]}_PST`.toUpperCase();
		return `const ${tableName} = [\n${rows.join(",\n")}\n].flat();`;
	};

	const activePieceKey = makePiece(piece, color);
	const visibleArray: number[] = editablePst[stage][activePieceKey] || [];

	return (
		<div className="p-4" onMouseUp={() => setIsDragging(false)}>
			<h1 className="text-2xl font-bold mb-4">PST Visualization</h1>

			<div className="flex flex-row justify-center gap-10 margin-auto">
				<div>
					<h1 className="text-xl">{color === Color.White ? "White" : "Black"} PST</h1>
					<p className="font-bold bg-white text-black">White side</p>
					<div className="grid grid-cols-8 grid-rows-8 gap-0 w-fit select-none">
						{
							visibleArray.map((n, i) => {
								const isSelected = selectedVisualIndices.has(i);
								return (
									<button
										key={i}
										onMouseDown={() => handleSquareMouseDown(i)}
										onMouseEnter={() => handleSquareMouseEnter(i)}
										className={`w-12 h-12 flex flex-col items-center justify-center border transition-all ${
											isSelected ? "border-3 border-blue-500" : ""
										}`}
										style={{
											backgroundColor: getColor(n),
										}}
										title={`Array Index: ${color === Color.Black ? i ^ 56 : i}\nVisual Grid Index: ${i}`}
									>
                               <span className="text-black text-[10px] opacity-40 leading-none">
                                  #{color === Color.Black ? i ^ 56 : i}
                               </span>
										<span className="text-black text-lg font-semibold">{n}</span>
									</button>
								);
							})
						}
					</div>
					<p className="font-bold bg-black text-white">Black side</p>
				</div>

				<div>
					<p>Select piece</p>
					<select className="bg-white text-black text-lg" onChange={(e) => { setPiece(parseInt(e.target.value)); setSelectedVisualIndices(new Set()); }}>
						<option value={PieceName.Pawn}>Pawn</option>
						<option value={PieceName.Knight}>Knight</option>
						<option value={PieceName.Bishop}>Bishop</option>
						<option value={PieceName.Rook}>Rook</option>
						<option value={PieceName.King}>King</option>
						<option value={PieceName.Queen}>Queen</option>
					</select>

					<p>Select stage</p>
					<select className="bg-white text-black text-lg" onChange={(e) => { setStage(parseInt(e.target.value)); setSelectedVisualIndices(new Set()); }}>
						<option value={GameStage.Midgame}>Opening/midgame</option>
						<option value={GameStage.Endgame}>Endgame</option>
					</select>

					<p>Color</p>
					<button className="bg-white text-black text-lg p-1 border rounded mb-4" onClick={() => { setColor(swapColor(color)); setSelectedVisualIndices(new Set()); }}>
						Flip to {swapColor(color) === Color.White ? "white" : "black"}
					</button>

					{/* Unified On-Screen Multi-Square Value Editor */}
					<div className="mt-4 p-3 bg-white text-black">
						<p>
							Selected Squares: {selectedVisualIndices.size}
						</p>
						<div className="flex gap-2">
							<input
								type="number"
								value={inputValue}
								onChange={(e) => setInputValue(e.target.value)}
								className="bg-white text-black text-lg w-24 p-1 border"
								placeholder="Value"
							/>
							<button
								onClick={applyValueToSelected}
								disabled={selectedVisualIndices.size === 0}
								className="bg-black hover:bg-slate-800 text-white font-bold px-3 py-1 text-sm disabled:opacity-40"
							>
								Apply to Selected
							</button>
							<button
								onClick={deselectAll}
								disabled={selectedVisualIndices.size === 0}
								className="bg-black hover:bg-slate-800 text-white font-bold px-3 py-1 text-sm disabled:opacity-40"
							>
								Deselect all
							</button>
						</div>
					</div>

					<div className="mt-4">
						<p className="font-bold text-sm text-green-400">PST Code Output</p>
						<textarea
							readOnly
							value={generateExportString()}
							className="w-full h-48 bg-black text-green-400 font-mono p-2 text-xs rounded border resize-none mt-1"
							onClick={(e) => (e.target as HTMLTextAreaElement).select()}
						/>
					</div>
				</div>
			</div>
		</div>
	);
}
