// @ts-nocheck
/* global uPlot, acquireVsCodeApi */
(function () {
  "use strict";

  const vscode = acquireVsCodeApi();
  const chartEl = document.getElementById("chart");
  const emptyEl = document.getElementById("empty");
  const pauseBtn = document.getElementById("pause");
  const MAX_POINTS = 1000;

  let xs = [];
  let ys = [];
  let labels = [];
  let seriesCount = 0;
  let paused = false;
  let plot = null;
  let frame = 0;
  // while the user has zoomed in, new data must not reset the view
  let zoomed = false;
  // samples that arrive after a clear while paused, shown on resume
  let held = [];

  function readVars(names, fallback) {
    const style = getComputedStyle(document.body);
    const out = names
      .map((n) => style.getPropertyValue(n).trim())
      .filter(Boolean);

    return out.length ? out : fallback;
  }

  function seriesColors() {
    return readVars(
      [
        "--vscode-charts-blue",
        "--vscode-charts-red",
        "--vscode-charts-green",
        "--vscode-charts-orange",
        "--vscode-charts-purple",
        "--vscode-charts-yellow",
      ],
      ["#3794ff", "#f14c4c", "#89d185", "#e07b00", "#c586c0", "#cca700"]
    );
  }

  // the space inside the chart's padding, minus the legend below the plot
  function chartSize() {
    const style = getComputedStyle(chartEl);
    const padX = parseFloat(style.paddingLeft) + parseFloat(style.paddingRight);
    const padY = parseFloat(style.paddingTop) + parseFloat(style.paddingBottom);
    const legend = chartEl.querySelector(".u-legend");
    const legendHeight = legend ? legend.offsetHeight : 0;

    return {
      width: chartEl.clientWidth - padX,
      height: chartEl.clientHeight - padY - legendHeight,
    };
  }

  // Follows the panel size. The chart can be built before the view has its
  // final size (e.g. right after it becomes visible), so it must not keep the
  // size measured at that moment.
  function fit() {
    if (!plot) {
      return;
    }
    const size = chartSize();
    if (size.width > 0 && size.height > 0) {
      plot.setSize(size);
    }
  }

  function showEmptyState(show) {
    emptyEl.hidden = !show;
    chartEl.hidden = show;
  }

  function build(count) {
    if (plot) {
      plot.destroy();
      plot = null;
    }
    showEmptyState(false);
    seriesCount = count;
    zoomed = false;
    xs = [];
    ys = Array.from({ length: count }, () => []);

    const colors = seriesColors();
    const axisStroke =
      readVars(["--vscode-foreground"], ["#cccccc"])[0] || "#cccccc";
    const gridStroke =
      readVars(["--vscode-panel-border"], ["#3c3c3c"])[0] || "#3c3c3c";

    const series = [{}];
    for (let i = 0; i < count; i++) {
      series.push({
        label: labels[i] || "series " + (i + 1),
        stroke: colors[i % colors.length],
        width: 1.5,
      });
    }

    const axis = {
      stroke: axisStroke,
      grid: { stroke: gridStroke, width: 1 },
      ticks: { stroke: gridStroke, width: 1 },
    };

    const initial = chartSize();
    plot = new uPlot(
      {
        width: Math.max(initial.width, 100),
        height: Math.max(initial.height, 80),
        series,
        scales: { x: { time: false } },
        axes: [axis, axis],
        legend: { show: count > 1 },
        hooks: {
          setSelect: [
            (u) => {
              if (u.select.width > 0) {
                zoomed = true;
              }
            },
          ],
        },
      },
      [xs].concat(ys),
      chartEl
    );
    // double-click resets the zoom inside uPlot
    plot.over.addEventListener("dblclick", () => {
      zoomed = false;
    });
    // the legend exists now, so fit again without it overflowing
    fit();
  }

  function redraw() {
    if (plot && !paused) {
      plot.setData([xs].concat(ys), !zoomed);
    }
  }

  // at most one redraw per frame, however many batches arrive
  function scheduleRedraw() {
    if (!frame) {
      frame = requestAnimationFrame(() => {
        frame = 0;
        redraw();
      });
    }
  }

  function addSample(values) {
    if (values.length !== seriesCount) {
      build(values.length);
    }
    const x = xs.length ? xs[xs.length - 1] + 1 : 0;
    xs.push(x);
    for (let i = 0; i < seriesCount; i++) {
      // nan/inf arrive as null (JSON); uPlot draws null as a gap
      const v = values[i];
      ys[i].push(typeof v === "number" && isFinite(v) ? v : null);
    }
  }

  function addSamples(samples) {
    if (paused && !plot) {
      // cleared while paused: keep the hint up until the user resumes
      for (const values of samples) {
        held.push(values);
      }
      if (held.length > MAX_POINTS) {
        held.splice(0, held.length - MAX_POINTS);
      }

      return;
    }

    for (const values of samples) {
      addSample(values);
    }
    const extra = xs.length - MAX_POINTS;
    if (extra > 0) {
      xs.splice(0, extra);
      for (const arr of ys) {
        arr.splice(0, extra);
      }
    }
    scheduleRedraw();
  }

  function reset() {
    if (plot) {
      plot.destroy();
      plot = null;
    }
    xs = [];
    ys = [];
    held = [];
    seriesCount = 0;
    zoomed = false;
    showEmptyState(true);
  }

  window.addEventListener("message", (event) => {
    const msg = event.data;
    switch (msg.command) {
      case "labels":
        labels = msg.labels || [];
        if (plot && labels.length === seriesCount) {
          build(seriesCount);
        }
        break;
      case "samples":
        addSamples(msg.samples || []);
        break;
      case "clear":
        reset();
        break;
    }
  });

  new ResizeObserver(fit).observe(chartEl);

  pauseBtn.addEventListener("click", () => {
    paused = !paused;
    pauseBtn.textContent = paused ? "Resume" : "Pause";
    if (!paused && held.length > 0) {
      const samples = held;
      held = [];
      addSamples(samples);
    }
    redraw();
  });

  document.getElementById("resetZoom").addEventListener("click", () => {
    zoomed = false;
    if (plot) {
      plot.setData([xs].concat(ys), true);
    }
  });

  document.getElementById("clear").addEventListener("click", () => {
    vscode.postMessage({ command: "clear" });
  });

  document.getElementById("csv").addEventListener("click", () => {
    vscode.postMessage({ command: "exportCsv" });
  });

  document.getElementById("png").addEventListener("click", () => {
    if (!plot) {
      return;
    }
    vscode.postMessage({
      command: "exportPng",
      dataUrl: plot.ctx.canvas.toDataURL("image/png"),
    });
  });

  showEmptyState(true);
  vscode.postMessage({ command: "ready" });
})();
