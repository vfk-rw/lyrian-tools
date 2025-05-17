Building Character Sheets
Home » Building_Character_Sheets
Wiki-Logo 75x49.png
Page Updated:
  2024-12-11
Octicons-terminal.png
This page is related to Editing(coding) Character Sheets, which require Proinfo to be able to use.
Main Page: Building Character Sheets
Overview
Character Sheet Development
Getting Started

Using Custom Sheets
Building Sheets
(Main Page)
Glossary
Code Restrictions
Best Practice
Common Mistakes
Tutorials
Examples, Templates
Pattern Libraries
HTML & storing data
CSS & Styling
Sheet Layout
Images Use
Fonts & Icons
Dark Mode
Mobile
General

Updates & Changelog
Known Bugs
Character Sheet Enhancement(CSE)
Custom Roll Parsing
Legacy Sheet(LCS)
Beacon SDK
Reference

Buttons
Macro Guide
Repeating Sections
Sheetworkers
jQuery
Roll Templates
sheet.json
Default Settings
Translation
Auto-Calc
Advanced
All SheetDev Pages
Tools & Tips

Sheet Sandbox
Sheet Editor
Sheet Dev Tools
Sheet Author Tips
Git/GitHub Githublogo.png

Sheet Repository
Guide to GitHub
Short Git Guide
Submission Guidelines
Other

Sheet Authors
Character Sheet Index
Sheet Requests
Character Sheet(Forum)
About:Sheet Dev Documentation
This is the main article on how to create or edit Custom Character Sheet for Roll20. You need to be a Pro-user to access this feature.

It lists and describes many of the common elements of character sheet and how they function. Most larger concepts have a separate page that goes into larger detail which is linked here, such as the pages for Buttons, Designing Character Sheet Layout or Sheetworkers. The page is maintained/updated mostly by Roll20 community members.

The guide assumes some basic familiarity with HTML & CSS, so using other resources to learn the basics for those is advised. The Guides-sections have some links to tutorials & resource on HTML, CSS, and JavaScript in general..


The page haven't completely been updated to account for CSE, and assumes use of Legacy Sheet, unless otherwise specified(but should be fine for most cases).
You can help the Community Wiki by improving it. (July 2021)
Contents
1 Overview
2 Using Custom Character Sheets
2.1 Get Started
3 General
3.1 Sheet Structure
4 Complete Example
5 Restrictions
5.1 Security Filtering
5.2 CSE
5.3 Legacy Sheet
6 Javascript
7 Common Mistakes
8 HTML
8.1 Storing User Data
8.1.1 Text & Numbers
8.1.1.1 Default Values
8.1.1.2 type="text"
8.1.1.2.1 Character Name
8.1.1.3 type="number"
8.1.1.4 Spinner Arrows trick
8.1.1.4.1 Auto-Calculating Values
8.1.1.5 type="hidden"
8.1.2 type="range"
8.1.3 Dropdown menu
8.1.4 Checkboxes and Radio Buttons
8.2 Static Info
8.3 Sheet Rolls and Roll Buttons
8.4 Repeating Sections
8.5 Layout
8.6 Images
9 CSS
9.1 Tabs
9.2 Roll20 columns/rows
9.3 Google Fonts
10 JavaScript
10.1 Sheet Workers Scripts
10.2 API
11 Advanced Sheet Options
11.1 Sheet Layout
11.2 Roll Templates
11.3 Translating Character Sheets
11.4 Default Sheet Settings
11.5 Compendium Integration
11.6 Charactermancer
11.7 Other
12 Roll20 Character Sheets Repository
12.1 Minimum Requirements
12.1.1 1. Code of Conduct.
12.1.2 2. Good Code
12.1.3 3. A Satisfactory Experience
12.2 Beyond the Minimum
12.3 Patreon and Tipeee Linking Rules for Community Sheet Contributors
13 Best Practices
13.1 Attributes/Inputs
13.2 Sheetworkers & Roll Templates
13.3 Other Roll20-specific
13.4 General
14 Sheet Templates/Examples
14.1 Pattern Libraries
15 Related Pages
16 See Also
16.1 Guides
16.2 Forums Threads


Using Custom Character Sheets
Main Article: Using Custom Character Sheets

There are two methods of using Custom Character Sheets, The "The Sheet Editor", and the "Sheet Sandbox".

The former is accessed and used in campaign where the character sheet option have been set to "Custom" in the Game Settings page, and the latter is a tool used for character sheet development, where you upload (or literally cut and paste, the built-in editor is very basic) your code as files. Either one can only be accessed by the Creator of the game.

The source code to all community-created Roll20 sheets can be found on Github.

Get Started
What you need to get started with Sheet Editing/Creation

Access to a Proinfo account (to be able to test the sheet code in Roll20)
Ideally, get Pro for yourself, so you can use the Sheet Sandbox(much better for testing)
Alternatively, have someone with Pro host a Test game for you. The host would need to manually update the game's sheet code through the Sheet Editor, which is really cumbersome.
online html/css reference guides and tutorials
A good text editor e.g. VSCode, Notepad++
plenty of patience/free time
plenty of coffee
maybe a second monitor

If all you want to do is create a custom character sheet for use amongst your friends, you don't need to create a github account, learn how to submit code nor collaborate with others.

Only sign up to github once you have spent the hard time inside the sandbox writing/debugging your HTML and CSS code so it displays perfectly inside a Roll20 game, then its a matter of submitting your sheet via github if you want to make it widely available.

General
Character sheets for Roll20 are created with HTML & CSS,(and for more advanced features using Sheetworkers, a limited amount of JavaScript). Roll20 uses a number of changes to normal html/css, so they cannot properly be tested outside Roll20 in general web-dev environments such as Codepen or JSFiddle, and must be examined inside a game.

Plain HTML/CSS code taken from elsewhere does not work right away, as there exists a number of Roll20-specific feature and definitions that need to be used to make this work. There are also a good number of known Restrictions that limits what features of HMTL/CSS/JavaScript can be used. Converting character sheets from sources such as pdfs is not possible either, and sheets must be manually created, either from scratch, or based on existing Roll20 sheets.

In general, a Roll20 character sheet consists of an HTML-file, and a CSS-file. Some more advanced sheets also have a translation file.

Check BCS/Updates for latest updates & changes to the sheet creation framework, and BCS/Bugs for known bugs and issues.

Sheet Structure
A general description of how the code for a character sheet is structured:

The HTML file/code:

Contains no <body> or similar starting elements. (The html of a sheet is actually a part of a large <form>, which itself is inside an iframe.)
The HTML will automatically refer to the CSS code and classes, so no <include> or other standard steps to refer to css files or other sources can be used.
Any user-edited data in sheets are usually stored in <input>-elements or similar, and these elements must always have a name-attribute that starts with attr_ for them to be properly saved.
(LCS only) When referring to a CSS class from the CSS file, the sheet--prefix in the class' name is not needed.
Any JavaScript/Sheetworkers must be included in the html file in a separate <script type="text/worker">-element at the end, sheets don't support JavaScript outside that element.
Roll Templates are also defined inside the HTML file.


The CSS file/code:

In the CSS file, all class-names must have a sheet--prefix in their name, or Roll20 won't recognize the classes. In the HTML file, this prefix is not needed.
(Optional) Translation file:

The translation file is a .json-file, that includes the each i18n language, and pairs it with the corresponding content that should be displayed for the tag.
Complete Example
Main: Complete Examples‎

On Complete Examples, there are a selected list of complete, working character sheets, which could be insightful to look at to get a general idea what goes into a sheet, and how some common things are implemented. These are fairly well structured & implemented sheets on the shorter side, making them more approachable than any randomly picked sheet from the repo's 1000+ sheets.

Sheet Templates are intended as generic starting points for people learning to create their own character sheets, rather than using existing sheets with all the baggage they come with. Most of these templates are barebones.

Pattern Libraries contains various snippets useful for creating/updating any sheet.

Restrictions
Main Page: Character Sheet Development/Restrictions


Generally speaking, character sheets are created with HTML, CSS, and JavaScript (for Sheetworkers), but there exist some constraints & security filtering that restricts what can be used, and where, in character sheet code.

Security Filtering
Using the word eval anywhere in the sheet code will stop everything from working. Roll20 have put this as a security measure to prevent eval from used even in a roundabout way. You cant have attribute or class names that includes it.
Known list of forbidden words: data:, eval, cookie, window, parent, this, behaviour, behavior, expression, moz-binding
this also prevent you from importing fonts that contain eval as part of the name, like "MedievalSharp"
All images will be passed through the Roll20 image proxy to prevent security attacks. This should be largely transparent to you and shouldn't affect anything, but it's something to be aware of. Images in Sheets
CSE
Character Sheet Enhancement is the new sheet code style that was released in March 2021. It has expanded features, is closer to baseline HTML/CSS, and is generally less restrictive compared to Legacy Sheets.

HTML:

In the Roll20, the character sheet code is basically wrapped inside a giant <form> tag(so don't use it).

Most DOM functionalities can't be used.
Do not use Root HTML elements such as <html> <head>, <title>, or <body> in your HTML. Doing so will prevent your character sheet from loading in the virtual tabletop.
HTML Elements that don't work: <meter>, <progress>, link, video, iframe, meta, input type="color". Trying to add any of these to a sheet will either result in Roll20 removing them or behave like they are a <div>.
Restricted attributes examples: autoplay, download, onclick
Elements that now work: <datalist>, <details>, <summary>, <a href>, main, section
Enable use of #id in HTML elements, & <a href=#>
Attribute names are case-insensitive when checked for uniqueness. All <input>, <select>, <textarea> etc. should have unique attribute names if intended to be independent. Two inputs with same attr name will mirror each other and update if the other one is changed.
To create a section where you can dynamically add new entries, the Repeating Sections method is used through the <fieldset>-element.
<input> and <button> elements are restricted to a limited number of types. This is likely true with other elements.
All images will be passed through the Roll20 image proxy to prevent security attacks. This should be largely transparent to you and shouldn't affect anything, but it's something to be aware of. Images in Sheets
<svg>-element aren't supported directly, but they can be used if saved as separate.svg files: Example
All attributes in Roll Templates need to be written with double quotes, as single quotes results in roll template code being completely ignored.
classes called in Roll Templates must use the sheet-classname format, like is used with Legacy Sheet
If using the roll20-made rows & columns, need to prefix sheet- to their use in the HTML(likely in the CSS also).
You cannot refer to external CSS stylesheets. Everything needs to be in the CSS file.


CSS:

Certain(?) Media queries can now be used
Do not use .sheet-new-window as a CSS class name, as Roll20 already uses it and will block you from trying to override it. Forum thread
Roll20 have some predefined CSS classes for its custom row/column system and other default, so very generic class names like: .sheet-row, .sheet-col, .sheet-3colrow, .sheet-2colrow.
.sheet-character is best to be avoided when naming your own CSS classes. If you use the predefined classes, you need to call them by their full name in the HTML.
Repeating Sections Restrictions
Default Fonts: The following fonts can be accessed by default: Arial, Patrick Hand, Contrail One, Shadows Into Light and Candal
Google Fonts: can be used with the @import-function [Note: If you use @import with Google’s own generated URL, you may see the following error: Potential CSS security violation; character sheet template styling thrown out. To work around this issue, change css2?family to css?family in the URL (i.e., remove the “2”).]
Enable use of #id in HTML elements
You can't refer to external CSS stylesheets. Everything needs to be in the CSS file.
Legacy Sheet
Legacy Sheet is the old sheet coding framework/method, which is more restrictive than CSE.

See Legacy Sheet#Legacy Sheet Restrictions for details.

Javascript
Main Section: Sheetworkers - Restrictions

Many JavaScript functions or functionalities can't be used within Roll20, are limited to the Sheetworker framework.

If you're attempting to do any slightly more advanced data-handling, check existing sheet for user-cases. There shouldn't be any differences between Legacy Sheet and CSE for sheetworkers.



Common Mistakes
main page: Common Mistakes - Sheet Development

A list of common mistakes by old and new sheet creators.

1. Forgetting to start attribute names with attr_ (e.g. <input type="number" name="attr_dexterity"> vs. <input type="number" name="dexterity">). To store any information on a character sheet, this prefix is needed in the name. If it is left out, no data being saved in the field after the sheet is closed.

2. Thinking the Preview Panel shows all the changes/is accurate. The preview panel does not show an accurate view of how the sheet will look/work in an actual game, and completely ignores sheetworkers. You need to login to the campaign and open a character sheet there to be sure of sheet visuals/functionality, or use the Sheet Sandbox.

3. Check/Uncheck "Legacy Sanitization" when using custom code. Depending on if you have sheet code formatted for Legacy sheets or CSE, you need to check the box found in the Sheet Editor, or when using Sheet Sandbox, update the sheet.json-section.

4. (Legacy Sheet only)Forgetting to add sheet- to the class names in your .css file. This is not need in the .html file, Roll20 automatically assumes all classes have that prefix there. (Doesn't apply to CSE sheets) See CSS Styling

5. Using an underscore in the name/class of repeating sections. Each <fieldset> needs to have unique classname that starts with repeating_, and the rest of the name cannot have underscores or the section won't save any information.

6. CSS: Not understanding how General Sibling Selector ~ works, and how it applies in making tabs/hideable areas on the sheet. The CSS Wizardry examples on show/hide areas & creating tabs relies on the correct positioning of elements, and if the html elements are thrown in a different order or withing other elements, the conditions aren't met for things to trigger.

7. Not using a linter/code validator on your HTML/CSS/Sheetworker/Translation files. Often with HTML/CSS things can seemingly work fine for a long time even when you have mistakes, and cause trouble way later. Running your Sheetworker's code through a JavaScript validator is a critical step to finding why it might not work. Checking any translation.json or sheet.json files is also important.

8. Google Fonts Follow the Roll20 guide to the letter, and don't use urls generated by google, you need the remove the "2" from the url, among things. Google Fonts on Roll20 Sheets

9. Do not submit a new sheet that uses <table> for layout. It's the most common reason for new sheets being rejected/delayed, use better methods for layout instead. There are old sheets in the repo using them, but they were created before this rule against <table> was made.

General coding mistakes (not directly related to how Roll20 code works)
G-1. Not reading the Roll20 documentation. Roll20 sheet code isn't straight up just regular HTML/CSS/JavaScript, but has a number of differences. Much of the quirks & basics related to Character Sheet Creation is documented/linked on this page, and the docs are regularly getting updated. It's always a good idea to check pages again, even if you read them in the past. BCS/Updates & BCS/Bugs are good to keep updated on recent things. List of all pages related to "Character Sheet Creation"

G-2. Not looking at existing sheets. Seeing how existing sheets have been made and structured can help you avoid reinventing the wheel or making mistakes as result of knowing HTML/CSS/JavaScript but having little familiarity with how character sheets are created. All sheets in the Character sheet repository are under MIT license so are free(and encouraged) to be used as templates for creating your own sheet, instead of making everything from scratch.


G-3. Not asking for help when you get stuck. Roll20 has a small but active community who works with creating and improving character sheets, and are often eager to help out if you got stuck on some feature you've tried to figure out. Roll20 Character Sheet & Compendium Forums(Forum)

HTML
Main Page: Character Sheet Development/HTML


HTML is used to define the Character Sheet, and Roll20 have a couple of differences in how this work from baseline HTML, which are described in this section. You can use most of the basic HTML elements, such as p, div, span, textarea, input, select, img as normal, while some, such as <button> works noticeably differently.

Note: You cannot use JavaScript on your sheet outside of sheetworkers, and their <script type="text/worker">-element.

Storing User Data
Most HTML-elements used for storing user input can be used in Roll20 sheet, with an notable distinction. For each element, you must include a name-attribute which begins with attr_. This defines the unique attribute-name for the element, and tells that it's an attribute that should be saved to the character. This must also be done for values & attributes that the user can't edit, for that data to be usable in calculations or similar. All these attributes( except from repeating sections) will show up in the Attributes & Abilities-tab on the character sheet, after having been edited for the first time.

Text & Numbers
To create a field for saving text or numbers entered by the user, the following elements can be used:

<input type="text"> MDN documentation
<input type="number"> MDN documentation
<textarea> MDN documentation
Note: <input>-elements must have a specified type, and the input types that work on Roll20 are: (text, number, hidden, checkbox, radio and range).

Example:

<input type="text" name="attr_class" value="fighter" >   // leave as value="" if you don't want the user to need to delete the default value
<input type="number" name="attr_healthpoints" value="10" >
<input type="number" name="attr_healthpoints_max" value="10" >
<textarea name="attr_notes" value=""></textarea>
<input type="range" name="attr_hp" min="0" max="10" value="10">  // max value can't be edited by user
If you want the field to utilize the max of an attribute instead of the normal value, you can append _max to the name of the field, e.g. <input type="number" name="attr_healthpoints_max" /> represents the max value for <input type="number" name="attr_healthpoints" value="10" >.

You can also use a <span>-element to display a read-only attribute on your sheet, e.g. < span name="attr_strength_mod"></ span>.

It is possible to use a <span>-element to show the same value as an exiting attribute <input>-element with the same name. Updating the value in the <input>-element will update the displayed value of the <span>-element. (For a <span>-attribute to show properly, it needs to be saved on the sheet in some form, either with a normal input or a <input type="hidden">

Default Values
You can optionally include a value-attribute on any input text/number element, which will define the default value for the field.

For example, the following would define an "AC" field with a default value of "0". If no default value is specified, it is an empty string ("").

<input type="number" name="attr_AC" value="0" />
type="text"
For storing text on the sheet. Also good for any input that is used for a mix of numbers and characters.

<input type="text"> MDN Web Docs
<input type="text" name="attr_class" value="fighter" > 
Character Name
When making an <input type="text"> for the character name, it's adviced to use attr_character_name as it's name attribute, as this will automatically link/update with the name displayed on the N Journal's character name.

<input type="text" name="attr_character_name" />
type="number"
By default, small up/down arrows are displayed at the end of the field when it's selected, that can be used to increase/decrease it's value by increments of 1. By default the number field prefers whole integers, and on hover might complain if there is decimal numbers there. By default, there appears up-down arrows on the input when it's selected.

To allow decimals in the field, add step="any" to the input.

step: defines in what increments the input is increase/decrease, and what numbers it allows. When not defined, it's default is "1". Ex. step="0.2"more info
min, max: can be used to define the minimum and maximum values allowed in the field. Ex. min="0" max="10" more info
<input type="number" name="attr_hp" step="any" value="10" min="0" max="20" />


Spinner Arrows trick
The "Spinner arrows" that show up inside input fields type="number" can sometimes be disruptive, especially if they do not go away if the field is not focused, this behavior is not universal across different web browsers, however adding these CSS rules will set them to only show up when you hover over the input fields:

Trick by Mago

/*Firefox spinner buttons mod*/
/*by default is not visible*/
.charsheet input[Type="number"]{
    -moz-appearance: textfield;
}
/* hover over reveals buttons*/
.charsheet input[Type="number"]:hover{
    -moz-appearance: initial;
}
/* Chrome, Safari, Edge, Opera spinner buttons*/
/*by default is not visible*/
.charsheet input[type="number"]::-webkit-inner-spin-button, 
.charsheet input[type="number"]::-webkit-outer-spin-button {
    display: none;
}
/* hover over reveals buttons*/
.charsheet input[type="number"]:hover::-webkit-inner-spin-button, 
.charsheet input[type="number"]:hover::-webkit-outer-spin-button {
    display: inline
}


Auto-Calculating Values
Main Page: Auto-Calc

!!!WARNING!!!

This feature is HIGHLY discouraged in modern sheets as it is not compatible with sheetworkers. If you add a sheetworker to your sheet, you will most likely wind up needing to change all of your auto-calcs to sheetworker calculated attributes.

You can include a formula in the default value for the field, and specify either disabled="true" for the input. If you do so, the sheet will display the result of the formula instead of the formula itself.

For example, this would create a StrMod-attribute, which shows half the Strength value.

<input type="number" name="attr_StrMod" value="(@{Strength}/2)" disabled="true" />
Auto-Calc a more simple method than using sheetworkers, but have several drawbacks. Most sheet authors recommend against using auto-calc in anything but the most simple sheets, and instead use sheetworkers.

These auto-calculating attributes can be used in Sheet Rolls, Macros, and Abilities as normal.

type="hidden"
Using <input type="hidden"> can be useful to save hidden variables on the character sheet, that the user doesn't need to see. It will save the value of the input, but won't be shown on the character sheet in any way, making it easier to user than having to hide the input with CSS.

Example:

<input type="hidden" value="10" name="attr_str_mod" value="0" />
Usercases for type="hidden":

Sheetworkers make good use of them to calculate & save various info and secondary stats sheet users don't need to see
storing the value of an read-only attribute displayed with a <span>
Advanced Character Sheet Translation options
A number of CSS Wizardry examples
type="range"
input range -MDN docs – Style Input range

<input type="range"> can be used for displaying a progress bar, but doesn't work for it's intended. See Custom Progress Bar for examples.

Dragging the range's "thumb" to other values doesn't update the actual value saved on the char sheet, so it only works as a display.


Example:


<input type="range" name="attr_hp" min="0" max="10" value="10">
<input type="number" name="attr_hp">
<span name="attr_hp"></span>
Dropdown menu
The <select>-element can be used to save info a pre-determined list of options the user can access from a dropdown menu, which are split into separate <option>-elements. The multiple-tag for <select> doesn't seem to work in Roll20.forum post(Forum)

<select> on MDN
<option> on MDN
<optgroup> on MDN
Example:

<select name="attr_woundlevel">
  <option value="0" selected="selected">Healthy</option>
  <option value="1">Stunned</option>
  <option value="1">Wounded</option>
  <option value="2">Wounded Twice</option>
  <option value="5">Incapacitated</option>
  <option value="10">Mortally Wounded</option>
</select>
To choose which option is selected by default, include the selected="selected" like in the example.

Optgroup


It seems optgroups are currently stripped from sheets since May 2021, see discussion(Forum)+BCS/Bugs. workaround: CSS_Wizardry#Optgroup

You can use <optgroup> to group selections in your <select>-element. Example of optgroup - Free Spacer sheet

<select name="attr_selectedsheet">
  <optgroup label="Player">
    <option value="1" selected>PC</option>
    <option value="2">Ship</option>
  </optgroup>
  <optgroup label="Gamemaster">
    <option value="3">NPC</option>
    <option value="4">Monster</option>
  </optgroup>
</select>
Checkboxes and Radio Buttons
For checkboxes and radio buttons, you must always specify a value-attribute.

For checkboxes, if the box is checked the attribute will be set to the value of the checkbox. The value can be anything, and doesn't have to be defined as "1" or "yes". If it is not checked, the value for that attribute is "0".

If you would like a checkbox to be checked by default, or choose what radio button is selected as default, add the checked-attribute to the input(checked="true" also works).

<input type="checkbox"> on MDN
<input type="radio"> on MDN

Example:

<input type="checkbox" name="attr_HasShield" value="1" checked >
For radio inputs, if one of them is selected, the attribute will be set to the value of that radio input. If no radio input is selected, the value will be an empty string. It's recommended that of the radio inputs should have the checked attribute to set a default value. Radio inputs are the only type of field where it is meant to have more then one field with the same name-attribute, as they are meant to be linked.

Example:

<input type="radio" value="10" name="attr_Multiplier" >
<input type="radio" value="25" name="attr_Multiplier" checked>
See also the CSS Wizardry page for some clever uses for checkboxes and radio inputs, or how to change their looks.

Static Info
General text, such as names & labels for different fields & other info can be displayed with mostly any of the common HTML tags. The default looks of most tags varies a bit, but can be be changed with CSS when wanted.

Example:

<h2>Stats</h2>
<span>Character Name:</span>
<input type="text" name="attr_character_name" />
<h1> - <h5>: Good for section titles
<span>, <p>: Good for a block of text, doesn't have much formatting
<label>: Good for labelling input fields. Is by default bold font and leaves extra space under itself
<div>: Generally best tag for structuring the sheet. Contains no styling, can be used for text.
Sheet Rolls and Roll Buttons
Main Article: Button

You can include pre-defined rolls on your sheet. This is a great way to add the rolls that will be needed by the player when using the standard rolls in the game system.

For example, you may want to add a "Roll Check" button next to each skill on the sheet. To define a roll button, use the <button> tag. The type-attribute is set to "roll". The roll itself is defined in the value-attribute. You can also add a name attribute which allows the roll to be referenced in external Macros, Abilities or the Chat. The name needs to have the roll_-prefix to work.

Example of a "Bluff check" roll button:

<button type="roll" value="/roll 1d20 + @{Bluff}" name="roll_BluffCheck"></button>
Referencing attributes/fields on the sheet is done with the @{AttributeName} syntax. You could also then roll that example in other Macros or Abilities using %{BoB|BluffCheck}.

Note: The names you give your roll buttons must be unique from any Ability or other roll button on your characters, if you want to reference them in Abilities or Macros. If a character sheet have several roll buttons with identical names but different values, calling the roll button name will prompt the last entry in the sheet's HTML.

See also:

Complete Guide to Macros & Rolls - Definitive guide for constructing any kind of macros, for general use, or for roll buttons
Initiative Roll
Roll Queries - How to use Roll Queries in your buttons
Dice Reference - The Roll20 dice/math syntax
Select Attributes for Sheet Roll - An advanced technique for a dynamic roll button
Repeating Sections
Main Page: BCS/Repeating Sections


Sometimes you may have a type of object where there may be one or more of them, and it's not known ahead of time how many there are. A good example of this is the Skills listing for a Character in Official Savage Worlds. Roll20's sheets allow you to define a template for each item in the section, and the player can then add as many of these in the listing as they need.
Example:


<h3>Skills</h3>
<fieldset class="repeating_skills">
  <button type="roll" "name="roll_skill" value="/em uses @{skillname}, and rolls [[@{dtype}]]"></button>
  <input type="text" name="attr_skillname" value="">
  <select name="attr_dtype" class="dtype"> 
    <option value="d4">d4</option>
    <option value="d6">d6</option>
    <option value="d8">d8</option>
    <option value="d10">d10</option>
    <option value="d12">d12</option>
  </select>
</fieldset>
A more detailed explanation of repeating sections including styling, naming restrictions, sheetworkers counting rows and filtering can be found on Styling Repeating Sections.

In many cases, things inside a Repeating Section behaves differently than if you'd create the same thing in a normal part of the sheet, so adjustments to CSS & sheetworkers is very likely needed to get the same behaviour.

The naming restrictions will be of particular interest as uppercase characters can cause issues with draggable buttons.

Layout
Main Article: Designing Character Sheet Layout

Many sheet authors recommend using your own CSS for styling and to layout the sheet using CSS Flexbox and/or CSS Grid instead of the built-in column/rows option, or HTML tables.


Roll20 don't accept new sheet submissions that rely on HTML tables for design(Minimum Requirements -Sheet Code), so you shouldn't be using <table> if you want your sheet published in the dropdown. There are old sheets in the repo using them, but they where created before this rule against <table> was made.

Roll20 provides a few basic classes you can use to organize things into a simple column-based layout. To use them, just create a div with a class of 3colrow, 2colrow, or row. Then inside of that div, create a div for each column with a class of col. For example, to create a 3-column layout, you would could:

<div class='3colrow'>
  <div class='col'>
    <!-- Put the content for the first column here -->
  </div>
  <div class='col'>
    <!-- Second column -->
  </div>
  <div class='col'>
    <!-- Third column -->
  </div>
</div>
Images
Main Page: Image use in character sheets


You can have static images on your character sheet, such as placing the logo for the game at the top or having an image in the background to make the sheet look nicer overall. To show an image on a character sheet, you need to refer to the exact URL of where it's located on the internet.

If you're creating a character sheet that will be added to Roll20 for everybody's use, it's highly recommended to upload the images to GitHub along with the sheet code, so the image is secure and doesn't risk disappearing like is possible with free image hosting sources or directly linking to some website.

New Oct. 2021: You can now also show a character's Avatar & Token on the sheet.

Details: Sheet Images - Avatar & Token
Logo Example:

<img src="https://raw.githubusercontent.com/Roll20/roll20-character-sheets/master/kitchensink/logo.png" />
img {
  max-height: 100px;
}
In Roll20's kitchensink character sheet template, the image source is directly linked to the version existing in Roll20's Github and works because the image exists in that exact place. The image's size is defined in the .css-file to be max 100px height, otherwise it would have retained it's original size.

Background Example:

.charsheet {
  background-image: url(https://cdn.pixabay.com/photo/2015/09/29/15/12/stars-964022_960_720.png); /*black space with tiny white stars*/
  background-color: black;
  background-repeat: repeat;
  color: white;
}
The Star Wars D6-character sheet displays in the background an black image with tiny white stars. By defining background-repeat: repeat;, the image repeats as a pattern in the background if it doesn't cover the entire character sheet. The background-color: black; is a backup in case the image stops working, keeping the sheet background almost identical without causing readability issues. color: white; sets the default text color of the sheet as white, which is much more readable against the black background.



CSS
Main Article: CSS Wizardry

You can & should use custom CSS to style the way that your sheet looks to players. You can use nearly any CSS styling that you want, including background images, colors, font sizes, tabs, etc.

CSS Quirks in Roll20:

On a Legacy sheet, all class-names in the CSS file must have a sheet--prefix in their name, or Roll20 won't recognize the classes. In the HTML file, this prefix is not needed. This is no longer a requirement in CSE.
All of your CSS styles will be restricted to the .charsheet parent class. So if you put a style called input, the system will automatically prefix that with .charsheet input. This shouldn't affect you in general, but it prevents you from changing any of the Roll20 application CSS outside of the character sheets.
Note that by default, any HTML classes defined in your HTML layout which don't begin with attr_, roll_ or repeating_ will be prefixed with sheet- on Legacy sheets. So for example, if you want to style some of your input tags to be shorter than others and you define the HTML as <input class='shortfield'>, when processing your layout it will be changed to <input class='sheet-shortfield'>.

See Also: Character Sheet templates

Tabs
Main Article: Tabs on character sheets

Many character sheets have multiple pages, which many organize into separate tabs on Roll20 character sheets. The CSS Wizardry page show two methods used by existing sheets.

Can be used for creating an "NPC" page, or to split up character sheet content on several pages it it gets too big.

Roll20 columns/rows
Main Article: Roll20 columns/rows

Roll20 provides a few basic classes you can use to organize things into a simple column-based layout. To use them, just create a div with a class of '3colrow', '2colrow', or 'row'. Then inside of that div, create a div for each column with a class of 'col'.

Google Fonts
Full guide: Sheet Styling: Google Fonts

You can use Google Fonts on your sheets.
Example:


// imports the "Sigmar One"
@import url('https://fonts.googleapis.com/css?family=Sigmar+One&display=swap');

.charsheet span{
    // sets all spans to use "Sigmar One" font.
    font-family: 'Sigmar One', Arial;
   //  sets "Arial"(one of the default fonts) as a fallback font, if Sigmar-font doesn't work
}
NOTE: Do NOT use any fonts that contain eval in the name (e.g. MedievalSharp). That string (even when in the middle of a font name) causes security issues with Roll20 and the CSS will get thrown out completely.

JavaScript
JavaScript can be utilized in two very limited ways for Roll20 Character sheets, through built in sheet workers that are defined inside a single <script type="text/worker">-element, or indirectly through the use of API scripts(requires Pro subscription).

Roll20 sheetworkers & API can make use of the Underscore.js-library.

Sheet Workers Scripts
Main Article: Sheet Worker Scripts

Sheet Worker Scripts, (aka. Sheetworkers), are an advanced feature of the Character Sheets system which allows the sheet author to specify JavaScript, which will execute during certain events, such as whenever the values on a sheet are modified. It is highly recommended to use these in place of Auto-Calculating Fields whenever you have values that infrequently change, such as when a Character levels up or adds a new spell or attack.

Broadly speaking, sheetworkers can only edit character sheet values, and not interact with DOM in any other way. It can listen in and react to attributes changing values or activate on an Action Button.

Example(Ambition & Avarice):

<script type="text/worker">
const int = score => parseInt(score, 10) || 0;

const stats = ["str", "dex", "con", "wis", "int", "cha"];
stats.forEach(stat => {
    on(`change:${stat}`, () => {
        getAttrs([stat], values => {
            const stat_base = parseInt(values[stat]);
            //console.log(stat_base);
            let stat_mod = 0;
            if (stat_base >= 19) stat_mod = "+4";
            else if (stat_base >= 18) stat_mod = "+3";
            else if (stat_base >= 16) stat_mod = "+2";
            else if (stat_base >= 14) stat_mod = "+1";
            else if (stat_base >= 12) stat_mod = "+0";
            else if (stat_base >= 8) stat_mod = "-1";
            else if (stat_base >= 6) stat_mod = "-2";
            else stat_mod = "-3";
            
            setAttrs({
                [`${stat}_mod`]: stat_mod
            });
        });
    });
});
</script>
The above sheetworker automatically checks & updates an Attribute's(Str, Dex, Con etc.) modifier, any time the Attributes changes values. This makes it easy for the player as they don't need to update both the attribute & it's modifier, just the attribute, and the sheetworker does the rest. So if the str attribute is changed to 6, str_mod is set to be -2.

API
API scripts are something that are installed into campaign separately, which can do much more powerful and versatile things than the sheetworkers.

These are very advanced things, and to be able to use APIs with a sheet in a game, the Game Creator need to be a Pro subscriber to have access to them, so generally sheets shouldn't be designed to require API to work.

API Scripts can check to make sure that rules are followed, change properties on objects and tokens, and even provide custom chat commands. The scripts you write run across the entire game, and affect things the GM does as well as all the players. Advanced scripts can also run independently, performing automatic actions such as moving a token on a patrol route or nudging players when their turn is taking too long.

Examples of API use with character sheets:

Creating complicated or conditional roll output that the normal macro system can't handle, or to roll dice that aren't normal/numerical ones. Example: To roll Fantasy Flight Games' dice for their Star Wars or Genesys game, you need to use an API, as they use a unique dice system.
Editing stats based on rolls Normal macros can only read stats form character sheets, but APIs can edit them. Example: you can integrate API like Script:ChatSetAttr into buttons rolls to automatically heal characters when heath rolls are made, or to automatically subtract ammo/spellslots/arrows when they are used, or to apply the damage done on a roll directly to some other character
Reading/Syncing/Editing attributes between character sheets Sheetworkers can only edit and read stats of the character they are tied to, while API can look & edit stats for any character, enabling connections that otherwise aren't possible. Example: A sheet for the party's ship could sync/read some attribute of the party members and save them on the ship in relevant places so for example ship manuvers made by the captain could be done from the ship sheet, as an API have read the captain's stats and copied them to the captain's section. Then the same have been done for the Gunner, which would make it possible to make all the ship-related rolls that rely on character stats from the ship sheet as it syncs the relevant things with the party members.
Advanced Sheet Options
The following Advanced Sheet Options & Guides are not required for a basic character sheet, but can be great for enhancing your sheet's capability and usability. These things use more than one type code (HTML/CSS/JavaScript) so are not goruped under the core and basic HTML, CSS and JavaScript sections previously mentioned on this page.

See Also: Sheet Author Tips

Sheet Layout
Main Article: Designing Character Sheet Layout

Many sheet authors recommend using your own CSS for styling and layout of the sheet, mostly either CSS Grid or Flexbox. Roll20 provides a few basic classes you can use to organize things into a simple column-based layout.

There are also ways to have a character sheet have several pages, two examples on how to implement can be seen in the Tabs-section of the CSS Wizardry-article.

Roll Templates
Main Article: Roll Templates

Roll Templates allow you to fully customize how the rolls from your sheet appear in the chat window to all players. It's a great way to make the rolls in the chat better fit with the looks of the character sheet itself, as well as making the roll results be shown in more varied ways than just using /roll commands or the default roll template.

Translating Character Sheets
Main Page: Character Sheet Translation


Character sheets can be adapted to have translation capabilities, which makes it possible for everyone help translate the sheet to other languages, with the help of CrowdIn, if the sheet have the necessary translation tags. Character sheet authors have a number of controls over how the sheet is translated, and how the translation is displayed, even changing list order depending on language.

To update Translations for Community- or offical sheets on CrowdIn, you only need to register and account and join the projects, but to help translate the main site, you need to send it a ticket.

Default Sheet Settings
Main Article: Default Sheet Settings

Selectable options can be specified in the sheet.json file provided with your Custom Character Sheet. These options provide default settings across all Characters when your Character Sheet is in use. These are only usable if the sheet is in the sheet dropdown menu, as there are currently no method of using sheet.json with a Custom Character Sheet in the Sheet Editor

These can then be applied on the Game Settings-page to apply for character sheets created after the Default Settings are changed(Only accessible to the Game's Creator), or update all existing sheets in a campaign on the yMy Settings-tab(available for any Gamemaster in the campaign).

Compendium Integration
Main Article: Compendium Integration

The Roll20 Compendium feature is a repository of information such as rules, spells, items, and monsters for select open-license gaming systems. By designating that your sheet is compatible with a Compendium, players will have direct access to that Compendium in the right sidebar during gameplay.

Other advanced options for Compendium Integration includes drag-and-drop & compendium buttons.

Charactermancer
Main Article: Charactermancer Development

The Charactermancer is Roll20 system for guiding a user through a decision making process on the Virtual Tabletop. It has been implemented in the D&D 5E by Roll20, Official Roll20 Pathfinder 1E, Burn Bryte, and Call of Cthulhu character sheets, with plans for Pathfinder Second Edition & Starfinder.

Note: Community sheets should not include character creation or advancement due to potential copyright restrictions. 'By Roll20' sheets may include this content thanks to our partnerships with game creators. Sheets that are developed from the code of a 'By Roll20' sheet will need to ensure any character creation or advancement options code is removed. It's okay to have attributes that auto-calculate based on other attributes (including the current level). We'll let you know if your submitted sheet violates this rule.

However, the Charactermancer framework could also be used for other purposes, such as creating a character sheet importer framework.

Shadowrun 5E sheet(Forum) uses Charamancer for character import
Simplest Charamancer use(Forum) - thread discussing how simple implementations
Other
Additional advanced sheet features & ideas:

Make sheets Print-Friendly - if you want your roll20 sheet to be easy to print out for offline play
Integrated Sheet Update Notification & Changelog
so users easily notice & read sheet updates when looking at their sheet in-game
Mobile-friendly - optimize sheet for use with the Mobile app
Dark Mode
Statblock Importer
GM Screen
Roll20 Character Sheets Repository
The Roll20 sheet repository is a collection of all the community-contributed character sheets that are available for use on Roll20. Its intended purpose is to provide fans a way of creating system-specific support of games that Roll20 doesn't have an official character sheet for.

Source code of many official character sheets exists in the repository, but they are no longer updated. This is due to Roll20 having changed their workflow to keep their own sheets in a separate (private) repository. A number of older sheets (that don't show up in Roll20's sheet selection dropdown) also exist in the repository.

See Beginner's Guide to GitHub and/or Short Git Guide for how to use Git/GitHub for submitting your sheets to Roll20, or making updates for existing ones.

Minimum Requirements
"Minimum Requirements"

To ensure a consistent quality of character sheets in the repository, all submissions must meet the minimum requirements below. Before submitting a pull request on GitHub, test your code in Roll20 using either the Sheet Editor or Sheet Sandbox.

Ideally, don't submit sheets for games that already has a sheet. Preferably seek to improve the existing sheet.

"There will ideally be a single character sheet in the repository for any given game. And we allow a duplicate sheet if it is created and maintained by the Publisher [...] However, like any simple rule, there are some grey areas around what constitutes a "game"." Sept. 2021 - Nic B., Roll20 Team
1. Code of Conduct.
The Roll20's Code of Conduct applies to character sheets and they must adhere to it.
Do not infringe on intellectual property. Community sheets should not include character creation or advancement due to potential copyright restrictions. 'By Roll20' sheets may include this content thanks to our partnerships with game creators. Publisher-created/backed sheets are obvious free to include whatever they want. Sheets that are developed from the code of a 'By Roll20' sheet will need to ensure any character creation or advancement options code is removed. It's okay to have attributes that auto-calculate based on other attributes (including the current level). We'll let you know if your submitted sheet violates this rule.
There is one specific requirement for Character Sheets. All submissions of new pull requests for any character sheet containing an area for “gender” will need to make that a open text input (as opposed to a drop down menu containing a predefined list of options). This guideline is reflective of our ongoing efforts to be inclusive in our approach to facilitating gaming -- we want the maximum amount of people to be able to game the way that provides them the most fun. In this case, taking the time to address this small programming change makes a huge difference to our community.
2. Good Code
Do NOT use <⁠table> for sheet layout. As a general standard a <⁠table> element should only be used for tabular data. The <⁠table> shall not be used for layouts. See Designing Character Sheet Layout for better methods, or
This is the most common reason for new sheets being rejected/delayed by Roll20. There are old sheets in the repo using them, but they where created before this rule against <table> was made.
Minimum styling. All character sheets should have a small amount of CSS & HTML styling to make them aesthetically pleasing and usable. For example elements should not unintentionally overlap when a window is resized. The sheet should be familiar to players who are used to seeing the paper version of that sheet. It need not be identical to the paper version and should avoid violating any copyright, but it also shouldn't be laid out in such a crazy way that players will have a hard time understanding how to use it. Design for ease of use first and foremost.
Proper HTML Syntax. Proper HTML syntax is encouraged to increase accessibility and make the code maintainable for community contributions. All new sheets are expected to use proper containers elements such as <⁠div> and <⁠span> elements. Your HTML file must not use <⁠head> or <⁠body> tag, or your character sheet may not load in the virtual tabletop.
Save the files with Unix line endings (LF). Required for all .css, .html/.htm, and .json files. A Google search can tell you how to set this up in your favorite text editor, so it's automatic.
Every submission must include a valid sheet.json-file and a preview image. Directions for creating a proper sheet.json can be found on the GitHub README.
Chrome & Firefox Compatible. The two official supported browsers of Roll20 are Chrome & Firefox. All character sheets need to be tested for functionality and styling in these two browsers.
3. A Satisfactory Experience
Character Sheets must be standalone by default. All basic sheet functionality must be usable without external requirements such as images or fonts hosted outside Roll20, or companion API Scripts. API companions are a welcome supplement for character sheets, but to ensure accessibility & functionality to community members at all of subscription levels the sheet must be usable by default without outside requirements.
Functional Roll Buttons. The best sheets not only keep track of character stats, they have the most common rolls for the game system embedded in them. This makes it much easier for new players to play the game by adding intuitive functionality. While you don't have to include every roll in the whole system, including frequently used rolls where appropriate can elevate your sheet to the next level. Games that do not have rolls such as Amber Diceless Roleplaying Game are not required to meet this standard. If you are designing a sheet for a system where this requirement does not apply, please address this in your pull request.
Inputs & Textfields for data tracking. Character sheets for game systems which have attributes and stats should include <input> elements for users to keep track of their data. Whenever possible, use standard names for attributes, spelled out. For example, "intelligence", "strength", and "wisdom". This is important so that if a character is imported into a game with a different sheet, most of the values will be able to transition. If the attribute names are all different, then nothing can be imported. Your best bet is to look at existing sheets for that system and whenever possible use the same attribute names that are already in use. Similarly <textarea> tags should be included were applicable for users to add notes or descriptions. This requirement is highly variable based on the system and if this requirement is not applicable to the game system you are creating a sheet for please include a comment in your pull request.
Rules must be readily available. Sheets can even be submitted for independent games and homebrew systems. Homebrew games will need to ensure they are not violating copyright for their respective game system. In both cases the rules need to be readily available online to the public (i.e. if you do a web search for the name of the game, you should be able to find free or paid versions of the rules in some form). Yet unreleased games that have public beta or quickstart rules available are fine.
Beyond the Minimum
The suggestions below are not required for new character sheets requesting to be added to the repository. Aspiring sheet authors new to front-end development should focus on meeting the minimum requirements for their sheet's version one. When you are comfortable with the basics, the suggestions below can take the sheet one step further to shine as beacons of high-quality fun.

CSS Wizardry. Our community of sheet authors is exceptionally clever and creative. They offer here examples of ways to leverage the character sheet system.
Customized Roll Templates. Roll templates can be customized to match the color scheme & style of your character sheet. Additionally, they can be utilized to help users achieve a roll output that matches the game system's specific mechanics.
Sheet Workers are a powerful tool!. These scripts are an advanced feature of the Character Sheets system, which allows the sheet author to specify JavaScript to execute during certain events, such as whenever the values on an input are modified.
Character Sheet Translation/internationalization (i18n), will allow you to design your character sheet in such a way that our community of translators will be able to translate your sheet into their language, making that language available to anyone on Roll20. As of September 2016, we will no longer be accepting new character sheets that are simply alternate translations of already-existing character sheets.
Default Sheet Settings. Selectable options can be specified in the sheet.json-file provided with your Custom Character Sheet. These options provide default settings across all Characters when your Character Sheet is in use, making it easier for the GM to make adjustments on what base settings sheets have when created.
Compendium Integration. By designating that your sheet is compatible with a Compendium, players will have direct access to that Compendium in the right sidebar during gameplay. i Compendium are still a growing feature on Roll20, and integration is not yet available to most game systems.
Include attribute names in Titles. Adding title=@{attribute_name} helps macro creators find the name of attributes easier. Titles are occasionally used for other purposes, so use your best judgment. See Using REGEX for an example.
Link to a wiki page(or a Readme-file in the GitHub repo ) If you have created a wiki page for your sheet, you could link to it in the sheet.json's instructions-section using Markdown.
(E.g. "instructions": "This is a basic character sheet for Stargate RPG by Wyvern Gaming. See [Stargate RPG](https://wiki.roll20.net/Stargate) for more info on how to use the sheet.")
Patreon and Tipeee Linking Rules for Community Sheet Contributors
For sheet authors that are contributing to the Roll20 community character sheet repository, they are approved to advertise via subscription/donation service sites: Patreon and Tipeee. Roll20 is not responsible for any payment transactions and cannot enforce any private arrangements.

In order to qualify, a sheet author must first have their sheet contribution approved by the Roll20 staff and included into the community character Sheet repository.

You will want to include your Patreon or Tipeee account information in the sheet.json file that should be included with your sheet submission on GitHub.

The json file should have one of these fields added to it if you wish to advertise with Patreon or Tipeee:

patreon: Place the URL for a Patreon campaign here, and it will appear under your sheet's description when selected. (e.g."https://www.patreon.com/<name>")
tipeee: Place the URL for a Tipeee here, and it will appear under your sheet's description when selected. (e.g. "https://www.tipeee.com/<name>")
For more information, see github.com/Roll20/roll20-character-sheets#contributing

Linking to Patreon/Tipeee on the Roll20 Forums

Linking to Patreon or Tipeee on the Roll20 Forums are only permitted for pre-approved community members who have contributing either Character Sheets or API Scripts. If you wish to solicit users directly for funding you may do so privately, but no such links are permitted in a public forum without any contributed material.

Best Practices
These are general best practice guidelines to help increase consistency among sheet authors, in order to make more maintainable code repository for the community. Some of these are generic, while others are specific to how the Roll20 Character Sheet Framework functions.

Attributes/Inputs
Attribute names should be lowercase. For the sake of consistency & to avoid some quirks related to sheetworkers, it's best to always give lowercase attribute names, such as attr_strength, attr_strength_mod, which will then be called in macros and sheetworkers as strength, strength_mod. It might be a good idea to limit them to alphanumerical + _ and -.
RPGs have weird words. Utilize spellcheck="false" for text inputs and <textarea>, to prevent the browser from indicating spell errors.
Use fewer Attributes & Inputs. The more attributes and inputs you have the slower the sheet will load. This is not a concern for the average sheet but robust sheets such as the D&D 5E Sheet by Roll20- or the Pathfinder (Community)-sheets large amount of attributes & inputs can lead to performance issues if left unmanaged. If sheetworkers need to process many attributes often, or the game relies on characters having many entires in Repeating Sections, it might impact performance.
Spans over disabled inputs. Attribute-backed spans are more efficient than disabled inputs.
Sheetworkers & Roll Templates
Avoid Asynchronous cascades. Whenever possible avoid asynchronous cascades for sheet workers. An example of this is, getAttrs -> calculations -> setAttrs -> getAttrs -> calculations -> setAttrs… A better way to do this is getAttrs for everything you'll need then do all necessarily calculations before finally using a single setAttrs.
Use Sheetworkers over Auto Calculated attributes. Sheetworkers only trigger when events happen ,which improves performance for character sheets over auto calculated attributes since these events occur less frequently.
Place Roll Templates and sheetworker code at bottom of the html page It's considered best practice to place JavaScript at end of pages. This also means the rolltemplates won't mess with the Preview Pane if you're using the Sheet Editor.
Other Roll20-specific
Include a minimum width. Including a minimum width on the sheet will help with resizing. Try to not exceed the default width when a sheet opens for the first time, approximately 800px-900px. Character sheets with an NPC view may be smaller and elaborate PC sheets are sometimes bigger. Currently[May 2022] it's not possible to change the default width of the char sheet window, so if your sheet is much wider than the window, it might be annoying for users to have to resize them each time they are opened.
Use Supported Fonts. Either use the five named fonts (Arial, Patrick Hand, Contrail One, Shadows Into Light, and Candal), or Google Fonts. Roll20 also comes with some Icon Fonts, and it's possible to us Google's Material Icons.
Use ^{ } for translations in button macros. In your button macros using ^{key} will insert the appropriate key from the appropriate language's translation.json. This makes roll templates more adaptable to other languages, and avoid hardcoding words.
(Applies to Legacy Sheet, not CSE)Don't include sheet- for CSS Class names in the HTML. sheet- is automatically added to the CSS classes in the HTML, so it's redundant to repeat it there. Leaving it out also increases readability if lots of classes are used.
For example in the HTML, instead of class="sheet-strRow", just do class="strRow".
WARNING: the above is untrue for classes of <rolltemplate> elements. For those, you do need to specify the full class name (i.e. starting with sheet-) or your rolltemplates will simply stop working.
General
Avoid using !important in CSS. Whenever possible try to avoid using !important in CSS as it can create a cascading effect of needing to use ever more !important to fix things.
Follow general HTML/CSS best practices. Google's HTML/CSS Style Guide is a good one to follow. Roll20's sheet framework is less forgiving than HTML/CSS in general, so following the style guide is a good way to avoid several minor pitfalls.


Sheet Templates/Examples
Roll20's "kitchensink" - Roll20's template (fairly old)
SPConlin/Roll20_Sheet_Template
Anduh/Roll20-grid-template - simple sheet layout using CSS Grid, by Andreas J.
clevett/SheetTemplate - sheet skeleton that uses PUG & SCSS, not recommended for beginners - by Cassie
Blades-template - by Jakob - based on Blades in the Dark-sheet
aureyia/roll20-character-sheet-boilerplate - Uses PUG, Stylus(CSS) & Gulp


Pattern Libraries
K-Scaffold - A Roll20 sheet framework - by Scott C.
Examples & Demo(Forum)
Sheet Author's Journey - a sheet dev tutorial using K-Scaffold
Roll20 Snippets - Char sheet & API code snippets - maintained by Scott C.
Roll20Async - framework to support for asynchronous code in Roll20 Sheetworkers
The Aaron Sheet - A facade for Sheet Worker Tasks and Utility Functions, including stylized console.log messaging.
RepeatingSum - sheetworker snippets to make it simple to sum up info on repeating sections
Cassie's pattern library - various HTML/CSS/JS snippets & design patterns. Feb 2020, LCS
Roll20 Sheet Dev (VS Code Extension) - contains some code snippets for common roll20 sheet components - by Andreas J.


Related Pages
Character Sheet Development/Tutorial
Sheet Author Tips - Misc. Sheet Author tips
Sheet Sandbox – the better editor to use when you code your character sheets
List of Character Sheet Requests (that don't yet exist on Roll20)
Character Sheet Index - List of Character Sheets on Roll20 (not always up to date)
Accessibility (a11y)
Git/GitHub
Beginner's Guide to GitHub(Roll20)
Short Git Guide - A guide to using the command line version of Git to work on your computer, instead of GitHub Desktop
Andreas Guide to Sheet Development
List of all pages related to "Character Sheet Creation"
Complete Guide to Macros & Rolls
Dice Reference - how the Roll20 dice/math works
Macros
Reusing Rolls
Chat Menus
See Also
Roll20 Forums - Character Sheets & Compendiums(Forum) - Best place for discussing Sheets with other Sheet Creators, and to get current info
Unofficial Roll20 Discord - The Discord server have two channels for discussing Character Sheet Creation, and many active Sheet Authors are present.
Roll20 Community Character Sheet repo - source-code of all Roll20 Community character sheets, as well as old code for some sheets made by Roll20
SublimeSettings - Roll20-specific HTML Syntax highlight for Sublime Text
ACSI - Automation for adding translation attributes/tags to a sheet
Building Char Sheets - Almost always outdated/lacking compared to any pages on sheet development on the wiki
Guides
General Web development Guides

Introduction to HTML
Introduction to CSS
CSS Diner learn to use CSS Selectors
Introduction to JavaScript
executeprogram.com - Learn JavaScript
Google's HTML/CSS Style Guide
Forums Threads
Insightful stuff

Any Science Behind Sheet Performance? March 2022
