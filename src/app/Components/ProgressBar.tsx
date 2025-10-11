interface ProgressBarSegment {
	value: number; // percentage (0-100)
	color: string;
	label?: string | number;
	labelColor?: string;
}

interface ProgressBarProps {
	progress?: number; // 0-100
	color?: string;
	background?: string;
	width?: number;
	height?: number;
	segments?: ProgressBarSegment[];
}

export default function ProgressBar({
	                                    progress = 0,
	                                    color = "#4ade80",
	                                    background = "#e5e7eb",
	                                    width = 200,
	                                    height = 8,
	                                    segments,
                                    }: ProgressBarProps) {
	return (
		<div
			className="select-none"
			style={{
				width: width + "px",
				background,
				height: height + "px",
				position: "relative",
				overflow: "hidden",
				display: "flex",
			}}
		>
			{segments && segments.length > 0 ? (
				segments.map((seg, idx) => (
					<div
						key={idx}
						style={{
							width: `${Math.min(Math.max(seg.value, 0), 100) / 100 * width}px`,
							background: seg.color,
							height: "100%",
							transition: "width 0.3s",
						}}
						className="flex items-center justify-center"
					>
						{
							seg.label !== undefined && seg.value > 0 ? (
								<span
									style={{
										color: seg.labelColor ? seg.labelColor : "#000000",
										fontSize: height * 0.75,
										fontWeight: "bold",
										whiteSpace: "nowrap",
									}}
								>
									{seg.label}
								</span>
							) : null
						}
					</div>
				))
			) : (
				<div
					style={{
						width: `${Math.min(Math.max(progress, 0), 100)}%`,
						background: color,
						height: "100%",
						transition: "width 0.3s",
					}}
				/>
			)}
		</div>
	);
}