import {MoveGeometry} from "@/app/generator/geometries/MoveGeometry";

export abstract class CanOnlyCapture<T extends MoveGeometry> {
	public abstract getGeom(): T;
}
