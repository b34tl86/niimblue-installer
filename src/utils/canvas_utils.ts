import * as fabric from "fabric";
import ArUcoMarker from "$/fabric-object/aruco";
import Barcode from "$/fabric-object/barcode";
import QRCode from "$/fabric-object/qrcode";
import { OBJECT_DEFAULTS_TEXT } from "$/defaults";

export class CanvasUtils {
  static equalSpacingFillText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, printWidth: number) {
    // calculate every character width, and spacing
    const widths = [];
    for (let i = 0; i < text.length; i++) {
      const char = text.charAt(i);
      const metrics = ctx.measureText(char);
      widths.push(metrics.width);
    }
    const totalWidth = widths.reduce((a, b) => a + b, 0);
    const spacing = (printWidth - totalWidth) / (text.length - 1);

    // print every character with calculated spacing
    let offset = 0;
    for (let i = 0; i < text.length; i++) {
      const char = text.charAt(i);
      ctx.fillText(char, x + offset, y);
      offset += widths[i] + spacing;
    }
  }

  static lineLength(line: fabric.Polyline): number {
    const xs = line.points.map((p) => p.x);
    return Math.round((Math.max(...xs) - Math.min(...xs)) * (line.scaleX ?? 1));
  }

  static isWavy(line: fabric.Polyline): boolean {
    return line.points.length > 2;
  }

  /** Rebuild a horizontal line as straight or wavy. Wave count is whole so both ends sit on the center line. */
  static setLineShape(line: fabric.Polyline, length: number, wavy: boolean) {
    const wavelength = 16;
    const amplitude = 4;
    const steps = 8; // points per wave
    length = Math.max(wavelength, Math.round(length));

    let points = [new fabric.Point(0, 0), new fabric.Point(length, 0)];
    if (wavy) {
      const n = Math.max(1, Math.round(length / wavelength)) * steps;
      points = [];
      for (let i = 0; i <= n; i++) {
        points.push(new fabric.Point((i * length) / n, -amplitude * Math.sin((2 * Math.PI * i) / steps)));
      }
    }

    const left = line.left;
    const top = line.top;
    line.set({ points, scaleX: 1, scaleY: 1, strokeLineJoin: "round" });
    line.setBoundingBox();
    line.set({ left: Math.round(left), top: Math.round(top) });
    line.setCoords();
  }

  static fixFabricObjectScale(obj: fabric.FabricObject) {
    if (obj instanceof fabric.Polyline && CanvasUtils.isWavy(obj)) {
      CanvasUtils.setLineShape(obj, CanvasUtils.lineLength(obj), true);
      return;
    }

    const isNotScalable = obj instanceof Barcode || obj instanceof fabric.Rect || obj instanceof QRCode || obj instanceof ArUcoMarker;

    if (isNotScalable) {
      obj.set({
        width: Math.round(obj.width * (obj.scaleX ?? 1)),
        height: Math.round(obj.height * (obj.scaleY ?? 1)),
        scaleX: 1,
        scaleY: 1,
        left: Math.round(obj.left),
        top: Math.round(obj.top),
      });

      if (obj instanceof QRCode || obj instanceof ArUcoMarker) {
        const qrMin = 42;
        const size = Math.max(obj.width + (obj.width % 2), qrMin);
        obj.set({
          width: size,
          height: size,
        });
      }
    }
  }

  static fitObjectIntoCanvas(canvas: fabric.Canvas, obj: fabric.FabricObject, xMargin: number, yMarin: number) {
    const widthRatio = canvas.width / (obj.width + xMargin * 2);
    const heightRatio = canvas.height / (obj.height + yMarin * 2);
    const scaleFactor = Math.min(widthRatio, heightRatio);
    obj.set({ left: xMargin, top: yMarin });
    obj.scale(scaleFactor);
    canvas.centerObjectV(obj);
    canvas.centerObjectH(obj);
  }

  static renderError(ctx: CanvasRenderingContext2D, width: number, height: number): void {
      ctx.save();
      ctx.fillStyle = "black";
      ctx.translate(-width / 2, -height / 2); // make top-left origin
      ctx.translate(-0.5, -0.5); // blurry rendering fix
      ctx.fillRect(0, 0, width + 1, height + 1);
      ctx.restore();
      
      ctx.save();
      ctx.fillStyle = "white";
      ctx.textAlign = "center";
      ctx.font = `16px ${OBJECT_DEFAULTS_TEXT.fontFamily}`;
      ctx.fillText("ERR", 0, 0);
      ctx.restore();
    }
}
