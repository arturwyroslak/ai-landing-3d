import { init as initScene, dispose as disposeScene } from './scene/three-scene.js';

function safeGet(id){
  const el = document.getElementById(id);
  if(!el) console.warn(`Element with id ${id} not found`);
  return el;
}

async function boot(){
  try{
    const mount = safeGet('three-root');
    if(mount){
      await initScene(mount);
      console.log('Three scene initialized');
    }

    // basic UI handlers
    document.querySelectorAll('.nav a, .cta').forEach(link=>{
      link.addEventListener('click', e=>{
        // basic smooth scroll
        const href = link.getAttribute('href');
        if(href && href.startsWith('#')){
          e.preventDefault();
          document.querySelector(href)?.scrollIntoView({behavior:'smooth'});
        }
      })
    });

    // graceful dispose on pagehide
    window.addEventListener('pagehide', ()=>{
      try{ disposeScene(); }catch(err){ console.error('Failed to dispose scene', err); }
    });
  }catch(err){
    console.error('Boot failed', err);
  }
}

// Start when DOM ready
if(document.readyState==='loading'){
  document.addEventListener('DOMContentLoaded', boot);
}else boot();
