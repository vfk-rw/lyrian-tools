// Script to generate a list of all class files in public/data/classes
const fs = require('fs');
const path = require('path');

// Path to the classes directory
const classesDir = path.join(__dirname, '../public/data/classes');
// Output file path
const outputFile = path.join(__dirname, '../public/data/class-list.json');

// Generate the list of files
try {
  console.log('Generating class file list...');
  
  // Check if classes directory exists
  if (!fs.existsSync(classesDir)) {
    console.error(`Error: Directory does not exist: ${classesDir}`);
    process.exit(1);
  }

  // Read all .yaml files from the directory
  const files = fs.readdirSync(classesDir)
    .filter(file => file.endsWith('.yaml'))
    .sort(); // Sort alphabetically for consistency
  
  // Write the list to the output JSON file
  fs.writeFileSync(outputFile, JSON.stringify(files, null, 2));
  
  console.log(`Success! Generated list of ${files.length} class files.`);
  console.log(`Output saved to: ${outputFile}`);
} catch (error) {
  console.error('Error generating class list:', error);
  process.exit(1);
}