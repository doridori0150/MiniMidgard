// The rig template contract (tools/rig-template.html draws it; the painter draws characters over it).
// Every class is painted in this pose at this size, then cut into parts along these joints.
export type Pt = readonly [number, number];
export const J = {
  size: 1024,
  ground: 968,
  originX: 515,                       // feet centre on the ground line = sprite origin
  head: { cx: 520, cy: 255, rx: 210, ry: 195 },
  neck: [512, 448] as Pt,
  shoulderF: [600, 478] as Pt, shoulderB: [418, 482] as Pt,
  handF: [668, 700] as Pt, handB: [352, 700] as Pt,
  hipF: [560, 660] as Pt, hipB: [462, 660] as Pt,
  footF: [600, 960] as Pt, footB: [430, 960] as Pt,
  /** torso quad (shoulders → hem) */
  torso: [[430, 470], [604, 470], [626, 700], [400, 700]] as Pt[],
};
/** rest angles of the painted limbs, in the code pose convention (0 = straight down, + = toward the front) */
export const REST = {
  armF: Math.atan2(J.handF[0] - J.shoulderF[0], J.handF[1] - J.shoulderF[1]) * 180 / Math.PI,
  armB: Math.atan2(J.handB[0] - J.shoulderB[0], J.handB[1] - J.shoulderB[1]) * 180 / Math.PI,
  legF: Math.atan2(J.footF[0] - J.hipF[0], J.footF[1] - J.hipF[1]) * 180 / Math.PI,
  legB: Math.atan2(J.footB[0] - J.hipB[0], J.footB[1] - J.hipB[1]) * 180 / Math.PI,
};
