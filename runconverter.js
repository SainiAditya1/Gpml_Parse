const fs = require('fs');
const parseString = require('xml2js').parseString;

const gpmlFilePath = process.argv[2];

if (!gpmlFilePath) {
  console.error('Usage: node runConverter.js <gpmlFilePath>');
  process.exit(1);
}

// Read GPML file content
fs.readFile(gpmlFilePath, 'utf-8', (err, gpmlContent) => {
  if (err) {
    console.error(`Error reading GPML file: ${err.message}`);
    process.exit(1);
  }

  // Parse GPML XML
  parseString(gpmlContent, (err, result) => {
    if (err) {
      console.error(`Error parsing GPML XML: ${err.message}`);
      process.exit(1);
    }

    // Extract Pathway information
    const pathway = result.Pathway;
    if (!pathway) {
      console.error('Pathway element not found in GPML XML.');
      process.exit(1);
    }

    // Convert to CX2 format
    const cx2Data = {
      elements: {
        nodes: [],
        edges: []
      }
    };

    // Process DataNodes
    if (pathway.DataNode) {
      pathway.DataNode.forEach(dataNode => {
        const cx2Node = {
          data: {
            GraphId: dataNode.$.GraphId,
            TextLabel: dataNode.$.TextLabel,
            Type: dataNode.$.Type,
            graphics: {
              CenterX: dataNode.Graphics[0].$.CenterX,
              CenterY: dataNode.Graphics[0].$.CenterY,
              Width: dataNode.Graphics[0].$.Width,
              Height: dataNode.Graphics[0].$.Height,
              ZOrder: dataNode.Graphics[0].$.ZOrder,
              FontSize: dataNode.Graphics[0].$.FontSize,
              Valign: dataNode.Graphics[0].$.Valign
            },
            states: [] // Assuming states are not present in this example
          }
        };

        cx2Data.elements.nodes.push(cx2Node);
      });
    }
    console.log(cx2Data.elements.nodes);



    
    const cx2JsonString = JSON.stringify(cx2Data, null, 2);

    // Write CX2 data to file
    const outputPath = `${gpmlFilePath}.cx2.json`;
    fs.writeFile(outputPath, cx2JsonString, 'utf-8', (err) => {
      if (err) {
        console.error(`Error writing CX2 file: ${err.message}`);
        process.exit(1);
      }
      console.log(`CX2 data successfully written to: ${outputPath}`);
    });
  });
});
