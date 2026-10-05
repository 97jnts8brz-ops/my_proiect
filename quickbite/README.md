# Quick Bite (كويك بايت) – 3D reference package

- `scene.js`, `main.js`, `render.mjs`: Three.js model + headless render (`node render.mjs [shot...]`).
- `renders/`: six 1920x1080 reference renders (layout and proportions are the source of truth).

## Higgsfield prompts (use each render as the reference image, image-to-image, 16:9)

Common suffix for all: "Keep the exact building layout, proportions, signage positions, bay numbers and equipment placement from the reference. Photorealistic architectural visualization, 35mm lens, high detail, no faces visible. Do not add extra rooms, equipment or tables. No real brand logos."

| File | Prompt |
|---|---|
| front_golden.png | Small modern drive-up fast-food restaurant in Saudi Arabia, charcoal aluminium cladding with red accents, projecting canopy with yellow LED edge, red illuminated Arabic sign, four numbered car bays, staff member in a red cap handing a bag to a driver, clean asphalt, palm trees, soft golden-hour light. |
| front_night.png | Same restaurant at night, glowing red sign band, warm canopy downlights, yellow LED edge, street lamps, wet-look asphalt reflections, deep blue sky. |
| aerial.png | Aerial view of the whole site: building roof with exhaust fan and three AC condensers, parking bays 1-4 plus the delivery bay, street in front, palm trees, late-afternoon light. |
| delivery.png | Left side wall: delivery-app window with small red awning, black sign with three white tiles, yellow ground pad, delivery bay in front, golden hour. |
| kitchen_cook.png | Compact commercial kitchen toward the cooking line: two stainless gas grills, one electric single-basket fryer, stainless hood, white ceramic walls, light non-slip tile floor, recessed LED panels. |
| kitchen_hand.png | Kitchen toward the handover counter: service window, POS terminals, order printer, tablet, fridge, three wall-mounted split ACs above and beside the window, staff door on the right. |

## Arabic text check (fix in post/overlay if garbled)
«كويك بايت» · «اطلب من سيارتك» · «منطقة استلام طلبات التطبيقات» · «هنقرستيشن» · «كيتا» · «جاهز» · «استلام طلبات التطبيقات - للسائقين فقط - ممنوع الوقوف»

Note: the delivery-app names are plain text only, no real logos.
