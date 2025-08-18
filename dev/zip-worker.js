self.importScripts('https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js');

const SAVE_DIR = 'gemini-adventure-saves';
const { JSZip } = self;

async function getNodeImageAsFile(logId, nodeId) {
    try {
        const root = await navigator.storage.getDirectory();
        const saveDir = await root.getDirectoryHandle(SAVE_DIR);
        const logDir = await saveDir.getDirectoryHandle(logId);
        const imageDir = await logDir.getDirectoryHandle('images');
        const imageFileHandle = await imageDir.getFileHandle(`${nodeId}.webp`);
        return await imageFileHandle.getFile();
    } catch (e) {
        if (e.name !== 'NotFoundError') {
            console.warn(`Worker: Could not get image for node ${nodeId}:`, e);
        }
        return null;
    }
}

function escapeHtml(unsafe) {
    if (!unsafe) return '';
    return unsafe
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;");
}

function generateHtml(storyPath, theme, t) {
    const title = theme.length > 50 ? escapeHtml(theme.substring(0, 50)) + '...' : escapeHtml(theme);
    let bodyContent = `<div class="story-container"><h1>${title}</h1><p class="theme">${escapeHtml(theme)}</p>`;
    
    for (const node of storyPath) {
        const sceneText = escapeHtml(node.sceneData.scene).replace(/\n/g, '<br>');
        const imagePrompt = escapeHtml(node.sceneData.imagePrompt);
        const choiceText = node.choiceText ? `<p class="choice-text"><strong>${escapeHtml(t.historyChoicePrefix)}:</strong> "${escapeHtml(node.choiceText)}"</p>` : '';

        bodyContent += `
            <div class="node">
                <img src="./images/${node.id}.webp" alt="${imagePrompt}" class="scene-image" onerror="this.style.display='none'">
                <p class="scene-text">${sceneText}</p>
                ${choiceText}
            </div>
        `;
    }
    bodyContent += '</div>';

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
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
    ${bodyContent}
</body>
</html>`;
}

self.onmessage = async (event) => {
    const { gameLog, endNodeId, t } = event.data;
    try {
        const zip = new JSZip();

        // Reconstruct the story path
        const storyPath = [];
        let currentNodeId = endNodeId;
        while (currentNodeId) {
            const node = gameLog.nodes[currentNodeId];
            if (!node) break;
            storyPath.unshift(node);
            currentNodeId = node.parentId;
        }

        // Generate HTML
        const htmlContent = generateHtml(storyPath, gameLog.theme, t);
        zip.file('index.html', htmlContent);

        // Add images to a folder in the zip
        const imageFolder = zip.folder('images');
        for (const node of storyPath) {
            const imageFile = await getNodeImageAsFile(gameLog.id, node.id);
            if (imageFile) {
                imageFolder.file(`${node.id}.webp`, imageFile);
            }
        }

        // Generate the zip file as a blob
        const zipBlob = await zip.generateAsync({
            type: 'blob',
            compression: "DEFLATE",
            compressionOptions: {
                level: 9
            }
        });

        // Send it back to the main thread
        self.postMessage({ success: true, blob: zipBlob });
    } catch (error) {
        console.error('Worker error during ZIP generation:', error);
        self.postMessage({ success: false, error: error.message });
    }
};
