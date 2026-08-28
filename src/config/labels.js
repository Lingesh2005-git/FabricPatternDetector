// Centralized model labels, class orders, and confidence thresholds.

export const MATERIAL_CLASSES = ['cotton', 'silk'];

export const MATERIAL_DISPLAY_NAMES = {
  cotton: 'Cotton',
  silk: 'Silk',
};

export const SILK_CLASSES = [
  'banarasi_silk',
  'chanderi_silk',
  'kanjeevaram_silk',
  'muga_silk',
  'mysore_silk',
  'pochampally_silk',
];

export const SILK_DISPLAY_NAMES = {
  banarasi_silk: 'Banarasi Silk',
  chanderi_silk: 'Chanderi Silk',
  kanjeevaram_silk: 'Kanjeevaram Silk',
  muga_silk: 'Muga Silk',
  mysore_silk: 'Mysore Silk',
  pochampally_silk: 'Pochampally Silk',
};

export const COTTON_CLASSES = [
  'cotton_fabric',
  'khadi',
  'ikat',
  'cotton_sarees',
  'handloom',
];

export const COTTON_DISPLAY_NAMES = {
  cotton_fabric: 'Cotton (Fabric)',
  khadi: 'Khadi',
  ikat: 'Ikat',
  cotton_sarees: 'Cotton Sarees',
  handloom: 'Handloom',
};

export const CONFIDENCE_THRESHOLDS = {
  material: 0.65,
  subtype: 0.65,
};

export const UNCERTAIN_MESSAGES = {
  material: 'Uncertain material type (low confidence)',
  subtype: 'Uncertain fabric subtype (low confidence)',
};
