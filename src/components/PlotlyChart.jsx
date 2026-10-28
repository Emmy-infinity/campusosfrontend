// src/components/PlotlyChart.jsx
import createPlotlyComponent from "react-plotly.js/factory";
import Plotly from "plotly.js-dist-min";

const Plot = createPlotlyComponent(Plotly);

export default function PlotlyChart({ data, layout, config, style }) {
  return (
    <Plot
      data={data}
      layout={{
        autosize: true,
        margin: { l: 40, r: 20, t: 30, b: 40 },
        paper_bgcolor: "transparent",
        plot_bgcolor: "transparent",
        font: { family: "inherit", size: 12 },
        ...layout,
      }}
      config={{
        displayModeBar: false,
        responsive: true,
        ...config,
      }}
      style={{ width: "100%", height: 280, ...style }}
      useResizeHandler
    />
  );
}