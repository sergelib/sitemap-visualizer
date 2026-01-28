# Sitemap Tree Visualizer

An interactive D3.js visualization tool to explore sitemaps in a tree or sunburst hierarchy.

## Features
- **Collapsible Tree View**: Navigate through paths, expand and collapse nodes.
- **Sunburst View**: See the relative size and structure of sections.
- **Drill Down**: Set any node as the root to focus on a specific branch.
- **Parent Navigation**: Click the current root node to navigate back up.
- **Contextual Links**: Click a selected node's label to open the real page.
- **Automatic Sitemap Conversion**: Script to convert `sitemap.xml` into the required `json` format for D3.

## Usage
1. Place your `sitemap.xml` into the `scripts/` folder.
2. Run `node scripts/convert-sitemap.js` to generate the data.
3. Open `index.html` in a local server (e.g., via `npx serve .`) to view the visualization.

## Project Structure
- `index.html`: Main application page.
- `resources/`: Contains styles and JavaScript visualization modules (`d3_tree.js`, `visualize.js`, etc.).
- `resources/generated/`: Contains the generated `sitemap.js` data.
- `scripts/`: Contains the conversion script and input XML.
