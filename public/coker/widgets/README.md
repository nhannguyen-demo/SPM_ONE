# Coker widget images

Drop your prepared images here with **exact** filenames (replace with PNG, JPG, or WebP — update `lib/equipment-packs/coker-widget-images.ts` if you change extensions):

| File | Catalog template |
|------|------------------|
| `3d-model.png` | 3D model (`coker_model_3d`) |
| `bulging-inspection.png` | Bulging inspection / heatmap (`coker_bulging_heatmap`) |
| `total-fatigue-damage.png` | Total fatigue damage / shell heatmap (`coker_fatigue_vessel_heatmap`) |
| `crack-inspection.png` | Crack inspection / unwrapped map (`coker_crack_unwrapped_map`) |

After adding or changing files, refresh the app. No code change is needed if filenames match.

**Tip:** Use wide images (e.g. 1200×600) for best clarity; tiles use `object-contain` and scale to the grid cell.
