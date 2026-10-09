// Recharts takes colors as props rather than classes, so every value here is a CSS
// variable reference to a ui-tokens.md token — never a hex literal.
export const CHART_GRID_STROKE = "var(--color-border)";

export const CHART_AXIS_TICK = {
  fill: "var(--color-text-muted)",
  fontSize: 12,
};

export const CHART_TOOLTIP_STYLE = {
  backgroundColor: "var(--color-surface)",
  border: "1px solid var(--color-border)",
  borderRadius: "var(--radius-md)",
  fontSize: 12,
  color: "var(--color-text-primary)",
};
