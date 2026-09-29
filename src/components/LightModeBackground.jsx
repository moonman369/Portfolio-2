// Light mode: a faint, static dot grid on the paper (see .paper-grid).
const LightModeBackground = () => {
  return (
    <div
      aria-hidden="true"
      className="paper-grid fixed inset-0 pointer-events-none z-0"
    />
  );
};

export default LightModeBackground;
