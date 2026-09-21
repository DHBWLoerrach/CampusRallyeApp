// three.js is only needed for the navigation arrow. Load it lazily so it is not
// evaluated for rallyes (or phases) that never show the 3D compass.
const loadCompass3DArrow = () => import('./Compass3DArrow');

export default loadCompass3DArrow;
