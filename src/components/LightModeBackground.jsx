import SkyMotion from "./SkyMotion";

// Light mode: a faint, static dot grid on the paper (see .paper-grid), with
// the occasional meteor drawn in ink.
const LightModeBackground = () => {
  return (
    <>
      <div
        aria-hidden="true"
        className="paper-grid fixed inset-0 pointer-events-none z-0"
      />
      <SkyMotion twinkles={false} />
    </>
  );
};

export default LightModeBackground;
