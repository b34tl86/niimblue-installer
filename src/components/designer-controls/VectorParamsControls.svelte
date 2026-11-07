<script lang="ts">
  import { tr } from "$/utils/i18n";
  import MdIcon from "$/components/basic/MdIcon.svelte";
  import * as fabric from "fabric";
  import { CanvasUtils } from "$/utils/canvas_utils";

  interface Props {
    selectedObject: fabric.FabricObject;
    editRevision: number;
    valueUpdated: () => void;
  }

  let { selectedObject, editRevision, valueUpdated }: Props = $props();

  const roundRadiusChanged = (value: number) => {
    const rect = selectedObject as fabric.Rect;
    rect.set({
      rx: value,
      ry: value,
    });
    valueUpdated();
  };

  type DashStyle = "solid" | "dashed" | "dotted";

  const dashStyle = (obj: fabric.FabricObject): DashStyle =>
    !obj.strokeDashArray?.length ? "solid" : obj.strokeDashArray[0] === 0 ? "dotted" : "dashed";

  const applyDash = (style: DashStyle) => {
    const sw = selectedObject.strokeWidth || 1;
    selectedObject.set({
      strokeDashArray: style === "dashed" ? [sw * 3, sw * 2] : style === "dotted" ? [0, sw * 2] : null,
      strokeLineCap: style === "dotted" ? "round" : "butt",
    });
  };

  const dashChanged = (style: DashStyle) => {
    applyDash(style);
    valueUpdated();
  };

  const lineShapeChanged = (wavy: boolean) => {
    const line = selectedObject as fabric.Polyline;
    CanvasUtils.setLineShape(line, CanvasUtils.lineLength(line), wavy);
    valueUpdated();
  };

  const lineLengthChanged = (value: number) => {
    if (!value) return;
    const line = selectedObject as fabric.Polyline;
    CanvasUtils.setLineShape(line, value, CanvasUtils.isWavy(line));
    valueUpdated();
  };

  const strokeWidthChanged = (value: number) => {
    const style = dashStyle(selectedObject);
    selectedObject.set({ strokeWidth: value });
    applyDash(style); // keep dash spacing proportional
    valueUpdated();
  };

  const fillChanged = (value: string) => {
    selectedObject.set({ fill: value });
    valueUpdated();
  };

  const strokeChanged = (value: string) => {
    selectedObject.set({ stroke: value });
    valueUpdated();
  };
</script>

<input type="hidden" value={editRevision}>

{#if selectedObject instanceof fabric.Rect}
  <div class="input-group flex-nowrap input-group-sm">
    <span class="input-group-text" title={$tr("params.vector.round_radius")}>
      <MdIcon icon="rounded_corner" />
    </span>
    <input
      type="number"
      min="0"
      max={Math.min(selectedObject.width, selectedObject.height) / 2}
      class="form-control"
      value={selectedObject.rx}
      oninput={(e) => roundRadiusChanged(e.currentTarget.valueAsNumber)} />
  </div>
{/if}

{#if selectedObject instanceof fabric.Rect || selectedObject instanceof fabric.Circle || selectedObject instanceof fabric.Line || selectedObject instanceof fabric.Polyline || selectedObject instanceof fabric.Path}
  <div class="input-group flex-nowrap input-group-sm">
    <span class="input-group-text" title={$tr("params.vector.stroke_width")}>
      <MdIcon icon="line_weight" />
    </span>
    <input
      type="number"
      min="1"
      class="form-control"
      value={selectedObject.strokeWidth}
      oninput={(e) => strokeWidthChanged(e.currentTarget.valueAsNumber)} />
  </div>
{/if}

{#if selectedObject instanceof fabric.Polyline}
  <div class="input-group input-group-sm flex-nowrap fill">
    <span class="input-group-text" title={$tr("params.vector.line_shape")}>
      <MdIcon icon="waves" />
    </span>
    <select
      class="form-select"
      value={CanvasUtils.isWavy(selectedObject) ? "wavy" : "straight"}
      onchange={(e) => lineShapeChanged(e.currentTarget.value === "wavy")}>
      <option value="straight">{$tr("params.vector.straight")}</option>
      <option value="wavy">{$tr("params.vector.wavy")}</option>
    </select>
  </div>

  <div class="input-group flex-nowrap input-group-sm">
    <span class="input-group-text" title={$tr("params.vector.length")}>
      <MdIcon icon="straighten" />
    </span>
    <input
      type="number"
      min="16"
      class="form-control"
      value={CanvasUtils.lineLength(selectedObject)}
      onchange={(e) => lineLengthChanged(e.currentTarget.valueAsNumber)} />
  </div>
{/if}

{#if selectedObject instanceof fabric.Rect || selectedObject instanceof fabric.Circle || selectedObject instanceof fabric.Polyline || selectedObject instanceof fabric.Path}
  <div class="input-group input-group-sm flex-nowrap fill">
    <span class="input-group-text" title={$tr("params.vector.stroke_style")}>
      <MdIcon icon="line_style" />
    </span>
    <select
      class="form-select"
      value={dashStyle(selectedObject)}
      onchange={(e) => dashChanged(e.currentTarget.value as DashStyle)}>
      <option value="solid">{$tr("params.vector.solid")}</option>
      <option value="dashed">{$tr("params.vector.dashed")}</option>
      <option value="dotted">{$tr("params.vector.dotted")}</option>
    </select>
  </div>

  {#if !(selectedObject instanceof fabric.Polyline || selectedObject instanceof fabric.Path)}
    <div class="input-group input-group-sm flex-nowrap fill">
      <span class="input-group-text" title={$tr("params.vector.fill")}>
        <MdIcon icon="format_color_fill" />
      </span>
      <select
        class="form-select"
        value={selectedObject.fill}
        onchange={(e) => fillChanged(e.currentTarget.value)}>
        <option value="white">{$tr("params.color.white")}</option>
        <option value="black">{$tr("params.color.black")}</option>
        <option value="red">{$tr("params.color.red")}</option>
        <option value="transparent">{$tr("params.color.transparent")}</option>
      </select>
    </div>
  {/if}

  <div class="input-group input-group-sm flex-nowrap fill">
    <span class="input-group-text" title={$tr("params.vector.stroke_color")}>
      <MdIcon icon="border_color" />
    </span>
    <select
      class="form-select"
      value={selectedObject.stroke}
      onchange={(e) => strokeChanged(e.currentTarget.value)}>
      <option value="white">{$tr("params.color.white")}</option>
      <option value="black">{$tr("params.color.black")}</option>
      <option value="red">{$tr("params.color.red")}</option>
      <option value="transparent">{$tr("params.color.transparent")}</option>
    </select>
  </div>
{/if}

<style>
  .input-group {
    width: 7em;
  }
  .input-group.fill {
    width: 12em;
  }
</style>
