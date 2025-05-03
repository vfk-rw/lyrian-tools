// Script to fix image URLs in all class YAML files
const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

// Path to the classes directory
const classesDir = path.join(__dirname, '../public/data/classes');
// Path to the images directory (for verification)
const imagesDir = path.join(__dirname, '../public/images/classes');

// Read the list of available image files
const availableImages = fs.readdirSync(imagesDir);
console.log(`Found ${availableImages.length} image files in ${imagesDir}`);

// Process each YAML file in the classes directory
try {
  // Get all YAML files
  const files = fs.readdirSync(classesDir).filter(f => f.endsWith('.yaml'));
  console.log(`Processing ${files.length} class files...`);
  
  let replacedCount = 0;
  let errorCount = 0;
  
  files.forEach(file => {
    try {
      const filePath = path.join(classesDir, file);
      
      // Read the file content
      const content = fs.readFileSync(filePath, 'utf8');
      
      // Parse the YAML
      const classData = yaml.load(content);
      
      // Get the class name and normalize it for image lookup
      const className = classData.class.name;
      const classId = classData.class.id || className.toLowerCase().replace(/\s+/g, '_');
      
      // Format the expected image name - capitalize first letter of each word and use hyphens
      const formattedName = classId
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join('_') + '.webp';
        
      // Check if the image exists
      if (availableImages.includes(formattedName)) {
        // Set the new image URL
        const oldUrl = classData.class.image_url;
        classData.class.image_url = `/images/classes/${formattedName}`;
        
        // Convert back to YAML and write to file
        const updatedContent = yaml.dump(classData);
        fs.writeFileSync(filePath, updatedContent, 'utf8');
        
        console.log(`Updated image for ${className}: ${oldUrl} → ${classData.class.image_url}`);
        replacedCount++;
      } else {
        console.warn(`⚠️ Warning: No matching image found for ${className} (expected: ${formattedName})`);
      }
    } catch (err) {
      console.error(`Error processing ${file}:`, err);
      errorCount++;
    }
  });
  
  console.log(`\nSummary:`);
  console.log(`- Successfully updated ${replacedCount} image URLs`);
  console.log(`- Encountered ${errorCount} errors`);
  console.log(`- ${files.length - replacedCount - errorCount} files were skipped`);
  
} catch (err) {
  console.error('Error reading class files directory:', err);
  process.exit(1);
}