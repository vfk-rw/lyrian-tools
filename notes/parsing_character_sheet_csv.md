Instructions for Parsing Character Sheets from CSV
Primary Data to Extract

Name
Race
Sub-race
Spirit Core
Classes and their levels

General Approach

Identify Data Structure First

Scan the first 20-30 rows to identify the structure of the sheet
Look for consistent patterns and section headers


Locate Key Headers

Search for headers like "Personal Info", "Name", "Race", "Sub-Race", "Spirit Core", "Class"
Be flexible with variations: "Personal Info" might be "Character Info", etc.


Handle Row-Column Format

The data appears to be in a key-value format where column A contains keys and column B contains values
For each key you're looking for, search column A and extract the value from column B



Specific Parsing Instructions
For Name, Race, Sub-Race

Search for rows where column A contains "Name", "Race", or "Sub-Race" (case-insensitive)
Extract the corresponding value from column B
If not found, try alternate labels like "Character Name", "Species", etc.

For Spirit Core

Search for "Spirit Core" in column A
Extract the value from column B
If not found:

Try "Core", "Soul Core", "SC"
Look for numerical values that might represent Spirit Core (around 1000-3000)



For Classes and Levels

Locate the "Class" section

This might be indicated by a header row with "Class", "Class Tier", "Class Level"
If headers aren't found, look for rows where column A contains class names (like "Mage", "Fighter", "Spellblade")


For each class row:

Extract the class name from column A
Look for the class level in column C or nearby
Class tier might be in column B


If structure varies:

Look for any row where column A contains a known class name
Check nearby cells (±3 columns, same row) for numerical values that could be levels



Fallback Strategies

For Missing Data

If name is missing, use filename or mark as "Unknown"
If race/sub-race missing, check for race-specific abilities elsewhere in sheet
If spirit core missing, estimate from character level or total XP if available


For Varying Formats

Try scanning the whole document for keywords
Consider the first 10-15 rows for personal info
Look at sections with numerical values for class levels
Check for patterns of indentation or grouping that might indicate related data


For Multiple Matches

If multiple "name" entries are found, prefer the one closest to other personal info
If multiple values found for the same field, prefer the one with a numerical value if appropriate (for levels/core)
For classes, capture all instances as some characters may have multiple classes


For Transposed Data

Some sheets might have keys in row 1 and values below rather than side by side
Check both orientations if standard parsing fails


By implementing these strategies with fallbacks, you should be able to extract the key information even when sheets vary somewhat in structure.