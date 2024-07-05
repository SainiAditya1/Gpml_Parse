const fs = require('fs');
const parseString = require('xml2js').parseString;

const gpmlFilePath = process.argv[2];

if (!gpmlFilePath) {
  console.error('Usage: node runConverter.js <gpmlFilePath>');
  process.exit(1);
}

const cxDescriptor = {
  "CXVersion": "2.0",
  "hasFragments": false
};


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
      cxDescriptor: {
      "CXVersion": "2.0",
      "hasFragments": false
    },
    
    elements: {
        nodes: [],
        edges: []
      }
    };

        if (pathway.DataNode) {
      pathway.DataNode.forEach(dataNode => {
         const xref = dataNode.Xref && dataNode.Xref[0] ? dataNode.Xref[0].$ : null;
         const xrefId = xref ? xref.ID : null;
         const xrefDatasource = xref ? xref.Database : null;
        const cx2Node = {
          id: dataNode.$.GraphId, 
          x: parseFloat(dataNode.Graphics[0].$.CenterX), 
          y: parseFloat(dataNode.Graphics[0].$.CenterY), 
          z: parseInt(dataNode.Graphics[0].$.ZOrder), 
          v: {
            GraphId: dataNode.$.GraphId,
            CenterX: parseFloat(dataNode.Graphics[0].$.CenterX),
            CenterY: parseFloat(dataNode.Graphics[0].$.CenterY),
            ZOrder: parseInt(dataNode.Graphics[0].$.ZOrder),
            label: dataNode.$.TextLabel,
            type: dataNode.$.Type,
            XrefId: xrefId,
            XrefDatasource: xrefDatasource,
            Width: parseFloat(dataNode.Graphics[0].$.Width),
            Height: parseFloat(dataNode.Graphics[0].$.Height),
            Color: dataNode.Graphics[0].$.Color,
            Shape: dataNode.Graphics[0].$.Shape
          }
        };
        cx2Data.elements.nodes.push(cx2Node);
      });
    }


     if (pathway.Interaction) {
      pathway.Interaction.forEach(interaction => {
        const points = interaction.Graphics[0].Point;
        const start = points[0];
        const end = points[1];
        const xref = interaction.Xref ? { database: interaction.Xref[0].$.Database, id: interaction.Xref[0].$.ID } : { database: '', id: '' };
        const cx2Edge = {
          id: interaction.$.GraphId,
          source: start.$.GraphRef,
          target: end.$.GraphRef,
          z: parseInt(interaction.Graphics[0].$.ZOrder),
          v: {
            lineThickness: parseFloat(interaction.Graphics[0].$.LineThickness),
            arrowHead: end.$.ArrowHead ? end.$.ArrowHead : 'None',
            startPoint: {
              x: parseFloat(start.$.X),
              y: parseFloat(start.$.Y),
              relX: parseFloat(start.$.RelX),
              relY: parseFloat(start.$.RelY)
            },
            endPoint: {
              x: parseFloat(end.$.X),
              y: parseFloat(end.$.Y),
              relX: parseFloat(end.$.RelX),
              relY: parseFloat(end.$.RelY),
              arrowHead: end.$.ArrowHead ? end.$.ArrowHead : 'None'
            },
            xref: xref
          }
        };
        cx2Data.elements.edges.push(cx2Edge);
      });
    }


    // Convert CX2 data to JSON string
    const cx2JsonString = JSON.stringify(cx2Data, null, 2);

    // Write CX2 data to file
    const outputPath = `${gpmlFilePath}.cx2`;
    fs.writeFile(outputPath, cx2JsonString, 'utf-8', (err) => {
      if (err) {
        console.error(`Error writing CX2 file: ${err.message}`);
        process.exit(1);
      }
      console.log(`CX2 data successfully written to: ${outputPath}`);
    });
  });
});
