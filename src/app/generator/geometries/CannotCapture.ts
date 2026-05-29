import {MoveGeometry} from "@/app/generator/geometries/MoveGeometry";

export abstract class CannotCapture<T extends MoveGeometry> {
	public abstract getGeom(): T;
}
