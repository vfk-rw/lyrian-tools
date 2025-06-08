#!/usr/bin/env python3

import sys
from bs4 import BeautifulSoup

def prettify_html(input_file, output_file):
    with open(input_file, 'r', encoding='utf-8') as f:
        html_content = f.read()
    
    soup = BeautifulSoup(html_content, 'html.parser')
    
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(soup.prettify())
    
    print(f"Prettified HTML written to {output_file}")

if __name__ == '__main__':
    if len(sys.argv) != 3:
        print("Usage: python prettify_html.py input.html output.html")
        sys.exit(1)
    
    prettify_html(sys.argv[1], sys.argv[2])