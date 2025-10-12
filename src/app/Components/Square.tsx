import {Piece} from "@/app/utils";
import {useDrag, useDrop} from "react-dnd";
import {useEffect} from "react";
import {pieceSymbols} from "@/app/utils";
import {getEmptyImage} from "react-dnd-html5-backend";

export default function Square({ movePieceHere, row, col, squareDim, white, piece, setIsMouseDown, onDrag, highlight, disabled }: { movePieceHere: (row: number, col: number) => void, row: number, col: number, squareDim: number, white: boolean, piece: Piece | null, setIsMouseDown: (isDown: boolean) => void, onDrag: () => void, highlight: "none" | "possible" | "danger", disabled: boolean }) {
	const WHITE = "#f0d9b5";
	const BLACK = "#b58863";

	const squarePadding = 5;

	const squareStyle = {
		width: squareDim+"px",
		height: squareDim+"px",
		backgroundColor: white ? WHITE : BLACK,
		display: 'flex',
		justifyContent: 'center',
		alignItems: 'center',
		fontSize: '24px'
	};

	const [{ isDragging }, drag, dragPreview] = useDrag(() => ({
		type: "piece",
		item: { fromRow: row, fromCol: col },
		collect: (monitor) => ({
			isDragging: monitor.isDragging()
		}),
		canDrag: () => !disabled && piece !== null,
	}), [disabled, piece])

	useEffect(() => {
		if (piece === null) return;
		// const img = new Image();
		// img.src = pieceSymbols[piece.name][piece.color];
		// img.width = squareDim-squarePadding;
		// dragPreview(img, { captureDraggingState: true });

		const img = new Image();
		img.src = pieceSymbols[piece.name][piece.color];

		// ChatGPTed the scaling and centering logic
		img.onload = () => {
			// Create a scaled canvas version
			const scale = (squareDim - squarePadding) / img.naturalWidth;
			const canvas = document.createElement("canvas");
			canvas.width = img.naturalWidth * scale;
			canvas.height = img.naturalHeight * scale;

			const ctx = canvas.getContext("2d");
			ctx!.drawImage(img, 0, 0, canvas.width, canvas.height);

			dragPreview(canvas, {
				anchorX: canvas.width / 2,
				anchorY: canvas.height / 2,
			});
		};
	}, [dragPreview, piece, squareDim]);

	const [{ isOver }, drop] = useDrop(
		() => ({
			accept: "piece",
			drop: (item: { fromRow: number, fromCol: number}) => movePieceHere(item.fromRow, item.fromCol),
			collect: (monitor) => ({
				isOver: monitor.isOver()
			})
		}),
		[row, col]
	)

	useEffect(() => {
		setIsMouseDown(isDragging);
		onDrag();
	}, [isDragging])

	return (
		<div ref={(node) => {drop(drag(node))}} style={squareStyle}>
			<div className="w-full h-full flex items-center justify-center" style={{
				backgroundColor: highlight === "danger" ? "rgba(181,0,0,0.75)" : highlight === "possible" ? 'rgba(255,244,0,0.25)' :  "transparent", opacity: isDragging ? 0.25 : 1, cursor: "move",
				boxShadow: isOver ? (highlight !== "none" ? "inset 0 0 0 4px rgb(0, 255, 255)" : "inset 0 0 0 4px rgb(255, 0, 0)") : "none"
			}}>
				{
					piece === null ? null : <img width={squareDim-squarePadding} src={pieceSymbols[piece.name][piece.color]} draggable={!disabled}/>
				}
			</div>
		</div>
	);
}