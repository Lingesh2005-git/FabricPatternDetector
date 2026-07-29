const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');

const patches = [
  {
    file: 'node_modules/@shopify/react-native-skia/android/build.gradle',
    before: "arguments '-DANDROID_STL=c++_shared',",
    after:
      "arguments '-DANDROID_STL=c++_shared',\n" +
      "                          '-DCMAKE_ANDROID_STL_TYPE=c++_shared',",
  },
  {
    file: 'node_modules/@shopify/react-native-skia/android/CMakeLists.txt',
    before: 'target_link_libraries(${PACKAGE_NAME}\n        ${COMMON_LIBS}',
    after: 'target_link_libraries(${PACKAGE_NAME}\n        c++_shared\n        ${COMMON_LIBS}',
    occurrences: 2,
  },
  {
    file: 'node_modules/react-native-screens/android/CMakeLists.txt',
    before: 'target_link_libraries(rnscreens\n    ReactAndroid::reactnative',
    after: 'target_link_libraries(rnscreens\n    c++_shared\n    ReactAndroid::reactnative',
  },
  {
    file: 'node_modules/react-native-worklets/android/CMakeLists.txt',
    before: 'target_link_libraries(worklets android log ReactAndroid::reactnative',
    after: 'target_link_libraries(worklets c++_shared android log ReactAndroid::reactnative',
  },
  {
    file: 'node_modules/react-native-nitro-modules/android/CMakeLists.txt',
    before: '        NitroModules\n        ${LOG_LIB}',
    after: '        NitroModules\n        c++_shared\n        ${LOG_LIB}',
  },
  {
    file: 'node_modules/react-native-fast-tflite/android/CMakeLists.txt',
    before: '        ${PACKAGE_NAME}\n        ${LOG_LIB}',
    after: '        ${PACKAGE_NAME}\n        c++_shared\n        ${LOG_LIB}',
  },
  {
    file: 'node_modules/react-native-reanimated/android/CMakeLists.txt',
    before: '  reanimated\n  log',
    after: '  reanimated\n  c++_shared\n  log',
  },
  {
    file: 'node_modules/expo-modules-core/android/cmake/main.cmake',
    before: '  expo-modules-core\n  PRIVATE\n  ${LOG_LIB}',
    after: '  expo-modules-core\n  PRIVATE\n  c++_shared\n  ${LOG_LIB}',
  },
];

for (const patch of patches) {
  const file = path.join(root, patch.file);
  let source = fs.readFileSync(file, 'utf8');
  if (source.includes(patch.after)) continue;

  const expected = patch.occurrences ?? 1;
  const actual = source.split(patch.before).length - 1;
  if (actual !== expected) {
    throw new Error(`Cannot apply Android C++ runtime fix to ${patch.file}.`);
  }
  source = source.split(patch.before).join(patch.after);
  fs.writeFileSync(file, source);
}

console.log('Applied Android C++ runtime linker fix.');
