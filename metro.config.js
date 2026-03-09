const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Support 3D model file formats (GLB/GLTF) for Three.js assets
config.resolver.assetExts.push('glb', 'gltf');

module.exports = config;
