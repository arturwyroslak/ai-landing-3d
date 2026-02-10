import initScene from './scene/three-scene.js';

document.addEventListener('DOMContentLoaded',()=>{
  const mount = document.getElementById('three-root');
  if(!mount){
    console.error('Three mount point not found');
    return;
  }

  const scene = initScene({mount});

  // Expose for debugging in dev
  window.__AI_LANDING__ = {scene};
});
