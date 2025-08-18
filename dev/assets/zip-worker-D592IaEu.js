(function(){"use strict";self.importScripts("https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js");const p="gemini-adventure-saves",{JSZip:m}=self;async function b(r,e){try{return await(await(await(await(await(await navigator.storage.getDirectory()).getDirectoryHandle(p)).getDirectoryHandle(r)).getDirectoryHandle("images")).getFileHandle(`${e}.webp`)).getFile()}catch(n){return n.name!=="NotFoundError"&&console.warn(`Worker: Could not get image for node ${e}:`,n),null}}function i(r){return r?r.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;"):""}function f(r,e,n){const c=e.length>50?i(e.substring(0,50))+"...":i(e);let t=`<div class="story-container"><h1>${c}</h1><p class="theme">${i(e)}</p>`;for(const o of r){const a=i(o.sceneData.scene).replace(/\n/g,"<br>"),l=i(o.sceneData.imagePrompt),d=o.choiceText?`<p class="choice-text"><strong>${i(n.historyChoicePrefix)}:</strong> "${i(o.choiceText)}"</p>`:"";t+=`
            <div class="node">
                <img src="./images/${o.id}.webp" alt="${l}" class="scene-image" onerror="this.style.display='none'">
                <p class="scene-text">${a}</p>
                ${d}
            </div>
        `}return t+="</div>",`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${c}</title>
    <style>
        body { font-family: system-ui, -apple-system, sans-serif; line-height: 1.6; background-color: #111827; color: #d1d5db; margin: 0; padding: 20px; }
        .story-container { max-width: 800px; margin: 20px auto; background-color: #1f2937; padding: 20px 40px; border-radius: 8px; box-shadow: 0 4px 15px rgba(0,0,0,0.5); }
        h1 { font-size: 2.5em; text-align: center; color: #f9fafb; border-bottom: 1px solid #4b5563; padding-bottom: 10px; margin-top: 0; }
        .theme { text-align: center; font-style: italic; color: #9ca3af; margin-top: -10px; margin-bottom: 40px; }
        .node { margin-bottom: 40px; border-bottom: 1px solid #374151; padding-bottom: 40px; }
        .node:last-child { border-bottom: none; margin-bottom: 0; padding-bottom: 10px; }
        .scene-image { width: 100%; height: auto; border-radius: 8px; margin-bottom: 20px; aspect-ratio: 4 / 3; object-fit: cover; background-color: #374151; }
        .scene-text { font-size: 1.1em; }
        .choice-text { margin-top: 20px; padding: 15px; background-color: #374151; border-left: 4px solid #8b5cf6; border-radius: 4px; }
        strong { color: #c4b5fd; }
    </style>
</head>
<body>
    ${t}
</body>
</html>`}self.onmessage=async r=>{const{gameLog:e,endNodeId:n,t:c}=r.data;try{const t=new m,o=[];let a=n;for(;a;){const s=e.nodes[a];if(!s)break;o.unshift(s),a=s.parentId}const l=f(o,e.theme,c);t.file("index.html",l);const d=t.folder("images");for(const s of o){const g=await b(e.id,s.id);g&&d.file(`${s.id}.webp`,g)}const x=await t.generateAsync({type:"blob",compression:"DEFLATE",compressionOptions:{level:9}});self.postMessage({success:!0,blob:x})}catch(t){console.error("Worker error during ZIP generation:",t),self.postMessage({success:!1,error:t.message})}}})();
