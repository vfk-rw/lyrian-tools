To convert a Google Sheets URL to its CSV download link, you need to extract the spreadsheet ID and the specific sheet ID (gid), then format them correctly. Here's how to do it:

Extract the spreadsheet ID:

It's the long alphanumeric string in the URL
In your example: 1N46iNXUJx-7qmoa0myRIRrb-3wILMHZu
It usually appears between /d/ and /edit


Extract the gid (sheet ID):

Find the parameter gid= followed by numbers
In your example: 1997331408


Format the CSV download URL:
https://docs.google.com/spreadsheets/d/[SPREADSHEET_ID]/export?format=csv&gid=[GID]


For your specific example, the CSV download URL would be:
https://docs.google.com/spreadsheets/d/1N46iNXUJx-7qmoa0myRIRrb-3wILMHZu/export?format=csv&gid=1997331408
To handle different variations of Google Sheets URLs, your code should:

Search for the ID between /d/ and the next /
Look for gid= followed by numbers
Handle cases where gid might not be present (default to 0 in that case)
Deal with various URL formats (e.g., some might have #gid= instead of ?gid= or might have additional parameters)

This approach should work for most Google Sheets URLs, regardless of minor variations in formatting.