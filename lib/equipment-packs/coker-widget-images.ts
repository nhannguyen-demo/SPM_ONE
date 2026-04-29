/**
 * Static raster assets for Coker v1 templates that render as full-tile images.
 * Place image files in `public/coker/widgets/` (see README there).
 */
export const COKER_WIDGET_IMAGE = {
  /** `coker_model_3d` */
  model3d: "/coker/widgets/3d-model.png",
  /** `coker_bulging_heatmap` */
  bulgingInspection: "/coker/widgets/bulging-inspection.png",
  /** `coker_fatigue_vessel_heatmap` — “Total fatigue damage (shell)” */
  totalFatigueDamage: "/coker/widgets/total-fatigue-damage.png",
  /** `coker_crack_unwrapped_map` — crack inspection / unwrapped shell map */
  crackInspection: "/coker/widgets/crack-inspection.png",
} as const
