const fs = require('fs');
const path = require('path');

const inputPath = path.join(__dirname, 'sitemap.xml');
const outputPath = path.join(__dirname, '..', 'resources', 'generated', 'sitemap.js');

function convert() {
    try {
        console.log(`Reading ${inputPath}...`);
        const xmlContent = fs.readFileSync(inputPath, 'utf8');

        // Extract URLs using <loc> tags
        const locRegex = /<loc>(.*?)<\/loc>/g;
        const urls = [];
        let match;
        while ((match = locRegex.exec(xmlContent)) !== null) {
            urls.push(match[1]);
        }

        console.log(`Extracted ${urls.length} URLs.`);

        if (urls.length === 0) {
            console.error('No URLs found in sitemap.xml');
            return;
        }

        // Initialize the tree structure
        // We assume all URLs start with the same base domain
        const firstUrl = new URL(urls[0]);
        const rootName = `${firstUrl.protocol}//${firstUrl.host}`;
        const root = { name: rootName, children: [] };

        urls.forEach(urlStr => {
            const url = new URL(urlStr);
            // Splitting pathname and filtering out empty segments
            const segments = url.pathname.split('/').filter(s => s.length > 0);

            let currentNode = root;
            segments.forEach(segment => {
                if (!currentNode.children) {
                    currentNode.children = [];
                }

                let nextNode = currentNode.children.find(c => c.name === segment);
                if (!nextNode) {
                    nextNode = { name: segment };
                    currentNode.children.push(nextNode);
                }
                currentNode = nextNode;
            });

            // Attach the full URL to the leaf node (or intermediate node if it's a valid page)
            currentNode.url = urlStr;
        });

        // Recursively compute URLs for nodes that don't have one
        function enrichWithComputedUrls(node, parentUrl) {
            // Determine current node's URL base
            // If it's the root, use its name. Otherwise append name to parent.
            // Be careful with slashes.
            let currentUrl;
            if (node === root) {
                currentUrl = node.name;
            } else {
                // Remove trailing slash from parent if present (though usually we won't have it on segment names)
                // Append / and current name
                currentUrl = parentUrl.endsWith('/') ? parentUrl + node.name : parentUrl + '/' + node.name;
            }

            // If no explicit URL, set computedUrl
            if (!node.url) {
                node.computedUrl = currentUrl;
            }

            if (node.children) {
                node.children.forEach(child => enrichWithComputedUrls(child, currentUrl));
            }
        }

        enrichWithComputedUrls(root, "");

        console.log('Writing output to sitemap.js...');
        const jsContent = `const sitemapData = ${JSON.stringify(root, null, 2)};`;
        fs.writeFileSync(outputPath, jsContent);
        console.log('Done!');

    } catch (error) {
        console.error('Error during conversion:', error);
    }
}

convert();
