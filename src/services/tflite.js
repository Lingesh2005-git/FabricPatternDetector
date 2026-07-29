import { loadTensorflowModel } from 'react-native-fast-tflite';
import { CLASS_NAMES, DISPLAY_NAMES } from '../config/labels';
import { imageUriToFloat32Buffer } from '../utils/image';

let modelPromise;

const MODEL_ASSET = require('../../silk_model_v2_unknown.tflite');

export function loadModel() {
modelPromise ??= loadTensorflowModel(MODEL_ASSET, []);
return modelPromise;
}

export async function classifyImage(uri, base64) {
const [model, input] = await Promise.all([
loadModel(),
imageUriToFloat32Buffer(uri, base64),
]);

const [outputBuffer] = await model.run([input]);

const scores = Array.from(
new Float32Array(outputBuffer)
);

const classIndex = scores.indexOf(
Math.max(...scores)
);

const className = CLASS_NAMES[classIndex];

const result = {
classIndex,
className,
label: DISPLAY_NAMES[className],
confidence: scores[classIndex],
scores,
};

console.log('TFLite result:', result);

return result;
}
