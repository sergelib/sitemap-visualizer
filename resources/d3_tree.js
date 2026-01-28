// Tree Visualization Module

function renderTree(data, containerId, options = {}) {
    const margin = { top: 20, right: 120, bottom: 20, left: 120 };

    // Get actual container dimensions
    const container = d3.select(containerId);
    const rect = container.node().getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    let i = 0;
    const duration = 750;
    let root;

    // Clear previous SVG
    container.selectAll("*").remove();

    // Create the SVG container
    const zoom = d3.zoom().on("zoom", (event) => {
        g.attr("transform", event.transform);
    });

    // Create the SVG container
    const svg = container.append("svg")
        .attr("width", "100%")
        .attr("height", "100%")
        .call(zoom)
        .on("dblclick.zoom", null); // Disable double click zoom if desired

    const g = svg.append("g");

    // Set initial transform to center vertically
    svg.call(zoom.transform, d3.zoomIdentity.translate(margin.left, height / 2));

    const tree = d3.tree().nodeSize([30, 200]);
    const diagonal = d3.linkHorizontal().x(d => d.y).y(d => d.x);

    // Process Data
    root = d3.hierarchy(data, d => d.children);
    root.x0 = height / 2;
    root.y0 = 0;

    // Calculate node counts
    root.eachAfter(d => {
        d.direct = d.children ? d.children.length : 0;
        d.total = 0;
        if (d.children) {
            d.children.forEach(c => {
                d.total += 1 + c.total;
            });
        }
    });

    // Update global counter
    const totalNodes = root.descendants().length;
    const counterEl = document.getElementById("node-count");
    if (counterEl) counterEl.innerText = `Total nodes: ${totalNodes}`;

    // Collapse after second level
    // Check if we have saved state in the data. If not, apply default collapsing.
    root.children.forEach(collapse);

    update(root);

    function collapse(d) {
        // If state is explicitly expanded, don't collapse this node, but check children
        if (d.data._state === 'expanded') {
            if (d.children) {
                d.children.forEach(collapse);
            }
        }
        // If state is collapsed or undefined (default), collapse it if it has children
        else if (d.children) {
            d._children = d.children;
            d._children.forEach(collapse);
            d.children = null;
        }
    }

    function update(source) {
        tree(root);

        const nodes = root.descendants().reverse();
        const links = root.links();

        // Normalize for fixed-depth
        nodes.forEach(d => { d.y = d.depth * 180; });

        // Update Nodes
        const node = g.selectAll("g.node")
            .data(nodes, d => d.id || (d.id = ++i));

        const nodeEnter = node.enter().append("g")
            .attr("class", "node")
            .attr("transform", d => `translate(${source.y0},${source.x0})`)
            .on("click", (event, d) => {
                // Check for Root Click (Go Up)
                if (d.depth === 0) {
                    if (options.onBackToParent) {
                        options.onBackToParent(d.data);
                    }
                    event.stopPropagation();
                    return;
                }

                // Notify controller for normal selection
                if (options.onNodeClick) {
                    options.onNodeClick(d.data);
                }
                event.stopPropagation();

                if (d.children) {
                    d._children = d.children;
                    d.children = null;
                    d.data._state = 'collapsed'; // Save state
                } else {
                    d.children = d._children;
                    d._children = null;
                    d.data._state = 'expanded'; // Save state
                }
                update(d);
            });

        nodeEnter.append("title")
            .text(d => d.data.url ? `Name: ${d.data.name}\nURL: ${d.data.url}` : d.data.name);

        nodeEnter.append("circle")
            .attr("r", 1e-6)
            .style("fill", d => d._children ? "#38bdf8" : (d.data.url ? "#22c55e" : "#1e293b"));

        nodeEnter.append("text")
            .attr("dy", ".35em")
            .attr("x", d => d.children || d._children ? -13 : 13)
            .attr("text-anchor", d => d.children || d._children ? "end" : "start")
            .text(d => {
                let label = d.data.name;

                // If it's the root of the current view, try to use the URL pathname
                if (d.depth === 0) {
                    const fullUrl = d.data.url || d.data.computedUrl || d.data.name;
                    if (fullUrl) {
                        try {
                            const urlObj = new URL(fullUrl);
                            label = urlObj.pathname;
                            // Ensure it starts with / (pathname usually does, but just in case of weird parsing)
                            if (!label.startsWith('/')) label = '/' + label;
                        } catch (e) {
                            // If parsing fails (e.g. name is just "fr"), stick to name
                            // But usually computedUrl should be a full URL
                        }
                    }
                }

                if (d.children || d._children) {
                    return `${label} (${d.direct}/${d.total})`;
                }
                return label;
            })
            .style("fill-opacity", 1e-6);

        const nodeUpdate = nodeEnter.merge(node);

        nodeUpdate.transition()
            .duration(duration)
            .attr("transform", d => `translate(${d.y},${d.x})`);

        nodeUpdate.select("circle")
            .attr("r", 10)
            .style("fill", d => d._children ? "#38bdf8" : (d.data.url ? "#22c55e" : "#1e293b"))
            .attr("cursor", "pointer");

        nodeUpdate.select("text")
            .style("fill-opacity", 1);

        const nodeExit = node.exit().transition()
            .duration(duration)
            .attr("transform", d => `translate(${source.y},${source.x})`)
            .remove();

        nodeExit.select("circle").attr("r", 1e-6);
        nodeExit.select("text").style("fill-opacity", 1e-6);

        // Update Links
        const link = g.selectAll("path.link")
            .data(links, d => d.target.id);

        const linkEnter = link.enter().insert("path", "g")
            .attr("class", "link")
            .attr("d", d => {
                const o = { x: source.x0, y: source.y0 };
                return diagonal({ source: o, target: o });
            });

        const linkUpdate = linkEnter.merge(link);

        linkUpdate.transition()
            .duration(duration)
            .attr("d", diagonal);

        const linkExit = link.exit().transition()
            .duration(duration)
            .attr("d", d => {
                const o = { x: source.x, y: source.y };
                return diagonal({ source: o, target: o });
            })
            .remove();

        nodes.forEach(d => {
            d.x0 = d.x;
            d.y0 = d.y;
        });
    }
}
