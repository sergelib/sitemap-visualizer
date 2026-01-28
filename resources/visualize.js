// Main Visualization Controller

// Data buffer
let globalData = null;
let currentRootData = null;
let selectedNode = null;

// Initial Load
document.addEventListener("DOMContentLoaded", () => {
    // Check if data is loaded
    if (typeof sitemapData !== 'undefined') {
        globalData = sitemapData;
        currentRootData = globalData;
        initialize();
    } else {
        document.getElementById("chart-container").innerHTML = `<p class="error">Error: Data not loaded.</p>`;
    }
});

function initialize() {
    const viewSelector = document.getElementById("view-selector");
    const selectionBar = document.getElementById("selection-bar");
    const currentPathEl = document.getElementById("current-path");
    const setRootBtn = document.getElementById("set-root-btn");

    // Pre-process data to add parent links for upward navigation
    addParentLinks(globalData, null);

    // Initial Render
    renderView(viewSelector.value);

    // Event Listener for View Selector
    viewSelector.addEventListener("change", (e) => {
        renderView(e.target.value);
    });

    // Event Listener for Set Root Button
    setRootBtn.addEventListener("click", () => {
        if (selectedNode) {
            currentRootData = selectedNode;
            renderView(viewSelector.value);

            // Hide selection bar after setting root to avoid confusion, or keep it to show what's selected?
            // Let's reset selection UI for clear feedback that view changed
            selectionBar.style.display = "none";
            selectedNode = null;
        }
    });

    // Event Listener for Reset Button
    document.getElementById("reset-btn").addEventListener("click", () => {
        // Reset to global data
        currentRootData = globalData;
        selectedNode = null;
        selectionBar.style.display = "none";

        // Re-render
        renderView(viewSelector.value);
    });

    // Resize optimization
    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            renderView(viewSelector.value);
        }, 250);
    });
}

function addParentLinks(node, parent) {
    // Use defineProperty to avoid enumerable cycles if we ever print/stringify
    Object.defineProperty(node, 'parent', {
        value: parent,
        writable: true,
        configurable: true,
        enumerable: false
    });
    if (node.children) {
        node.children.forEach(child => addParentLinks(child, node));
    }
}

function handleNodeClick(nodeData) {
    const selectionBar = document.getElementById("selection-bar");
    const currentPathEl = document.getElementById("current-path");

    selectedNode = nodeData;
    selectionBar.style.display = "flex";

    // Determine the URL to display
    const fullUrl = nodeData.url || nodeData.computedUrl;
    let displayUrl = nodeData.name;
    let urlToOpen = fullUrl;

    if (fullUrl) {
        try {
            const urlObj = new URL(fullUrl);
            displayUrl = urlObj.pathname + urlObj.search + urlObj.hash;
        } catch (e) {
            console.error("Invalid URL:", fullUrl);
            displayUrl = fullUrl; // Fallback
        }
    } else {
        // Fallback for root or nodes without any URL context (though computedUrl should handle most)
        urlToOpen = "#";
    }

    currentPathEl.innerHTML = `Selected: <a href="${urlToOpen}" target="_blank" style="color: #646cff; text-decoration: underline;">${displayUrl}</a>`;
}

function handleBackToParent(currentRoot) {
    if (currentRoot.parent) {
        currentRootData = currentRoot.parent;
        // When going up, we generally want to see the node we just came from represented in the tree
        // It's already expanded by our state preservation logic.
        renderView(document.getElementById("view-selector").value);

        // Update selection to the new root? Or keep previous selection?
        // Let's clear selection for clarity or select the new root.
        // Clearing selection seems safer visually.
        const selectionBar = document.getElementById("selection-bar");
        selectionBar.style.display = "none";
        selectedNode = null;
    }
}

function renderView(viewType) {
    const containerId = "#chart-container";
    const options = {
        onNodeClick: handleNodeClick,
        onBackToParent: handleBackToParent
    };

    // Clear container (handled inside functions but redundant valid check here)

    if (viewType === 'tree') {
        if (typeof renderTree === 'function') {
            renderTree(currentRootData, containerId, options);
        } else {
            console.error("renderTree function not found.");
        }
    } else if (viewType === 'sunburst') {
        // Sunburst doesn't support back-to-parent via root click yet, avoiding issues
        const sunburstOptions = { onNodeClick: handleNodeClick };
        if (typeof renderSunburst === 'function') {
            renderSunburst(currentRootData, containerId, sunburstOptions);
        } else {
            console.error("renderSunburst function not found.");
        }
    }
}
