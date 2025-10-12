import {Chess} from "@/app/Chess";
import Square from "@/app/Components/Square";
import {DndProvider} from 'react-dnd'
import {HTML5Backend} from 'react-dnd-html5-backend'
import React, {useState} from "react";
import {Board} from "@/app/utils";
import {Move} from "@/app/Move";

export default function ChessboardDisplay({ squareDim, chessboard, onMove, displayCoordinates, getHighlights, disable }: { squareDim: number, chessboard: Board, onMove: (move: Move) => void, displayCoordinates?: boolean, getHighlights: (r: number, c: number) => {row: number, col: number}[], disable?: boolean }) {
	const [hoveredCell, setHoveredCell] = useState<{ row: number; col: number } | null>(null);
	const [isMouseDown, setIsMouseDown] = useState(false);

	const [highlights, setHighlights] = useState<{ row: number; col: number }[]>([]);

	return (
		<DndProvider backend={HTML5Backend}>
			<div className="select-none">
				{
					chessboard.map((row, rowIndex) => (
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
											movePieceHere={(fromRow, fromCol) => onMove(new Move(fromRow, fromCol, rowIndex, colIndex))}
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
								Array.from({ length: chessboard[chessboard.length-1].length }).map((_, index) => (
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