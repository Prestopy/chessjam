import Square from "@/app/Components/Square";
import {DndProvider} from 'react-dnd'
import {HTML5Backend} from 'react-dnd-html5-backend'
import React, {useEffect, useState} from "react";
import {Board, lsb, Move, Piece, squareIndex} from "@/app/bitboardHelpers";
import {makeMove} from "@/app/Move";

export default function ChessboardDisplay({ squareDim, chessboard, onMove, displayCoordinates, getHighlights, disable }: { squareDim: number, chessboard: Board, onMove: (move: Move) => void, displayCoordinates?: boolean, getHighlights: (r: number, c: number) => {row: number, col: number}[], disable?: boolean }) {
	const [hoveredCell, setHoveredCell] = useState<{ row: number; col: number } | null>(null);
	const [isMouseDown, setIsMouseDown] = useState(false);

	const [highlights, setHighlights] = useState<{ row: number; col: number }[]>([]);

	const [structuredBoard, setStructuredBoard] = useState<(Piece | null)[][]>([]);

	function boardToGrid(board: Board, ranks: number, files: number): (Piece | null)[][] {
		const grid: (Piece | null)[][] = Array.from({ length: ranks }, () => Array(files).fill(null));
		for (let p = 0; p < 12; p++) {
			let bb = board[p] < 0n ? board[p] + (1n << 64n) : board[p];
			while (bb) {
				const sq = lsb(bb);
				bb &= bb - 1n; // clear LSB
				grid[sq >> 3][sq & 7] = p as Piece;
			}
		}
		return grid;
	}

	useEffect(() => {
		setStructuredBoard(boardToGrid(chessboard, 8, 8));
	}, [chessboard]);

	return (
		<DndProvider backend={HTML5Backend}>
			<div className="select-none">
				{
					structuredBoard.map((row, rowIndex) => (
						<div key={rowIndex} className="flex flex-row">
							{
								displayCoordinates &&
                                <div className="flex items-end justify-end">
                                    <p className={`pr-3 font-mono ${hoveredCell?.row == rowIndex ? (isMouseDown ? "text-orange-400" : "text-white") : "text-slate-400"}`}>{chessboard.length-rowIndex}</p>
                                </div>
							}

							{
								row.map((piece, colIndex) => {
									const isWhiteSquare = (rowIndex + colIndex) % 2 === 0;

									return <div
										key={colIndex}
										onMouseEnter={() => setHoveredCell({ row: rowIndex, col: colIndex })}
										onMouseLeave={() => setHoveredCell(null)}
									>
										<Square
											movePieceHere={(fromRow, fromCol) => {
												if (disable) return;
												onMove(makeMove(squareIndex(fromRow, fromCol), squareIndex(rowIndex, colIndex)));
											}}
											row={rowIndex}
											col={colIndex}
											squareDim={squareDim}
											white={isWhiteSquare}
											piece={piece}
											setIsMouseDown={setIsMouseDown}
											onDrag={() => {
												if (disable) return;

												const newHighlights = getHighlights(rowIndex, colIndex);
												setHighlights(newHighlights);
											}}
									        highlight={disable ? "none" : highlights.some(h => h.row === rowIndex && h.col === colIndex) ? (piece === null ? "possible" : "danger") : "none"}
											disabled={disable ?? false}
										/>
									</div>
								})
							}
						</div>
					))
				}
				{
					displayCoordinates && (
						<div className="flex items-end justify-end">
							{
								Array.from({ length: 8 }).map((_, index) => (
									<p key={index} className={`inline-block font-mono pt-2 ${hoveredCell?.col == index ? (isMouseDown ? "text-orange-400" : "text-white") : "text-slate-400"}`} style={{ width: squareDim }}>
										{String.fromCharCode(97 + index).toUpperCase()}
									</p>
								))
							}
						</div>
					)
				}
			</div>
		</DndProvider>
	);
}
