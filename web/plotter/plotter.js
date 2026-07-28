// @ts-nocheck
/* global uPlot, acquireVsCodeApi */
(function () {
  "use strict";

  const vscode = acquireVsCodeApi();
  const chartEl = document.getElementById("chart");
  const pauseBtn = document.getElementById("pause");
  const MAX_POINTS = 1000;

  let xs = [];
  let ys = [];
  let labels = [];
  let seriesCount = 0;
  let paused = false;
  let plot = null;

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

  function chartSize() {
    return {
      width: chartEl.clientWidth || 400,
      height: Math.max(120, chartEl.clientHeight || 260),
    };
  }

  function build(count) {
    if (plot) {
      plot.destroy();
      plot = null;
    }
    seriesCount = count;
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

    const size = chartSize();
    plot = new uPlot(
      {
        width: size.width,
        height: size.height,
        series,
        scales: { x: { time: false } },
        axes: [axis, axis],
        legend: { show: count > 1 },
      },
      [xs].concat(ys),
      chartEl
    );
  }

  function redraw() {
    if (plot && !paused) {
      plot.setData([xs].concat(ys));
    }
  }

  function addSample(values) {
    if (values.length !== seriesCount) {
      build(values.length);
    }
    const x = xs.length ? xs[xs.length - 1] + 1 : 0;
    xs.push(x);
    for (let i = 0; i < seriesCount; i++) {
      ys[i].push(Number(values[i]));
    }
    if (xs.length > MAX_POINTS) {
      xs.shift();
      for (const arr of ys) {
        arr.shift();
      }
    }
    redraw();
  }

  function reset() {
    if (plot) {
      plot.destroy();
      plot = null;
    }
    xs = [];
    ys = [];
    seriesCount = 0;
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
      case "sample":
        addSample(msg.values);
        break;
      case "bulk":
        (msg.samples || []).forEach(addSample);
        break;
      case "clear":
        reset();
        break;
    }
  });

  window.addEventListener("resize", () => {
    if (plot) {
      plot.setSize(chartSize());
    }
  });

  pauseBtn.addEventListener("click", () => {
    paused = !paused;
    pauseBtn.textContent = paused ? "Resume" : "Pause";
    redraw();
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

  vscode.postMessage({ command: "ready" });
})();
