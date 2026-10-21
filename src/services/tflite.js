import { loadTensorflowModel } from 'react-native-fast-tflite';
import {
  MATERIAL_CLASSES,
  MATERIAL_DISPLAY_NAMES,
  SILK_CLASSES,
  SILK_DISPLAY_NAMES,
  COTTON_CLASSES,
  COTTON_DISPLAY_NAMES,
  CONFIDENCE_THRESHOLDS,
  TEXTILE_REJECTION_MESSAGE,
  UNCERTAIN_MESSAGES,
} from '../config/labels';
import { imageUriToFloat32Buffer } from '../utils/image';

const TEXTILE_GATE_MODEL_ASSET = require('../../textile_gate_efficientnetb0_v1.tflite');
const MATERIAL_MODEL_ASSET = require('../../material_classifier.tflite');
const SILK_MODEL_ASSET = require('../../silk_classifier.tflite');
const COTTON_MODEL_ASSET = require('../../cotton_classifier.tflite');

let materialModelPromise;
let silkModelPromise;
let cottonModelPromise;
let textileGateModelPromise;

export function loadTextileGateModel() {
  textileGateModelPromise ??= loadTensorflowModel(TEXTILE_GATE_MODEL_ASSET, []).catch((error) => {
    throw new Error(`Unable to load the Textile Gate model. Confirm the bundled TFLite asset is available. ${error.message || ''}`.trim());
  });
  return textileGateModelPromise;
}

export function loadMaterialModel() {
  materialModelPromise ??= loadTensorflowModel(MATERIAL_MODEL_ASSET, []).catch((error) => {
    throw new Error(`Unable to load the material classifier model. ${error.message || ''}`.trim());
  });
  return materialModelPromise;
}

export function loadSilkModel() {
  silkModelPromise ??= loadTensorflowModel(SILK_MODEL_ASSET, []).catch((error) => {
    throw new Error(`Unable to load the silk subtype model. ${error.message || ''}`.trim());
  });
  return silkModelPromise;
}

export function loadCottonModel() {
  cottonModelPromise ??= loadTensorflowModel(COTTON_MODEL_ASSET, []).catch((error) => {
    throw new Error(`Unable to load the cotton subtype model. ${error.message || ''}`.trim());
  });
  return cottonModelPromise;
}

/**
 * Runs the textile gate before the existing material and subtype classifiers.
 */
export async function classifyImage(uri, base64) {
  const inputBuffer = imageUriToFloat32Buffer(uri, base64);
  const textileGateModel = await loadTextileGateModel();
  const [textileGateOutputBuffer] = await textileGateModel.run([inputBuffer]);
  const textileProbability = Array.from(new Float32Array(textileGateOutputBuffer))[0];
  if (!Number.isFinite(textileProbability) || textileProbability < 0 || textileProbability > 1) {
    throw new Error('The textile gate returned an invalid probability. Please try another image.');
  }

  const textileAccepted = textileProbability >= CONFIDENCE_THRESHOLDS.textile;
  if (!textileAccepted) {
    return {
      textileAccepted,
      textileProbability,
      textileThreshold: CONFIDENCE_THRESHOLDS.textile,
      rejectionMessage: TEXTILE_REJECTION_MESSAGE,
    };
  }

  const materialModel = await loadMaterialModel();

  // Stage 1: Material prediction
  const [materialOutputBuffer] = await materialModel.run([inputBuffer]);
  const materialScores = Array.from(new Float32Array(materialOutputBuffer));
  const materialIndex = materialScores.indexOf(Math.max(...materialScores));
  const material = MATERIAL_CLASSES[materialIndex] || 'silk';
  const materialLabel = MATERIAL_DISPLAY_NAMES[material] || material;
  const materialConfidence = materialScores[materialIndex] ?? 0;

  // Stage 2: Subtype classification based on material
  let subtypeModel;
  let classes;
  let displayNames;
  let modelUsed;

  if (material === 'silk') {
    subtypeModel = await loadSilkModel();
    classes = SILK_CLASSES;
    displayNames = SILK_DISPLAY_NAMES;
    modelUsed = 'silk_classifier';
  } else {
    subtypeModel = await loadCottonModel();
    classes = COTTON_CLASSES;
    displayNames = COTTON_DISPLAY_NAMES;
    modelUsed = 'cotton_classifier';
  }

  // Run the second stage using the exact same preprocessed inputBuffer
  const [subtypeOutputBuffer] = await subtypeModel.run([inputBuffer]);
  const scores = Array.from(new Float32Array(subtypeOutputBuffer));
  const classIndex = scores.indexOf(Math.max(...scores));
  const className = classes[classIndex];
  const label = displayNames[className] || className;
  const confidence = scores[classIndex] ?? 0;

  const isMaterialUncertain = materialConfidence < CONFIDENCE_THRESHOLDS.material;
  const isSubtypeUncertain = confidence < CONFIDENCE_THRESHOLDS.subtype;
  const isUncertain = isMaterialUncertain || isSubtypeUncertain;

  let uncertaintyReason = null;
  if (isMaterialUncertain) {
    uncertaintyReason = UNCERTAIN_MESSAGES.material;
  } else if (isSubtypeUncertain) {
    uncertaintyReason = UNCERTAIN_MESSAGES.subtype;
  }

  const result = {
    textileAccepted,
    textileProbability,
    textileThreshold: CONFIDENCE_THRESHOLDS.textile,
    material,
    materialLabel,
    materialConfidence,
    materialScores,
    classIndex,
    className,
    label,
    confidence,
    scores,
    modelUsed,
    isUncertain,
    uncertaintyReason,
  };

  console.log('Staged TFLite classification result:', result);
  return result;
}
