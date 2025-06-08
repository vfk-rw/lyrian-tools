#!/usr/bin/env python3

import os
import csv
import argparse
from bs4 import BeautifulSoup, Tag

# Column indices (0-based) from the HTML <td> elements
COL_PLAYER_NAME = 0         # Column A: Player
COL_ADVENTURER_NAME = 1     # Column B: Adventurer Name  
COL_SPIRIT_CORE = 3         # Column C: Spirit Core (skip freezebar at index 2)
COL_RACE = 4               # Column D: Race
COL_SUB_RACE = 5           # Column E: Sub-Race  
COL_TIER_1_CLASS = 6       # Column F: Tier 1 Class
COL_TIER_2_CLASS = 7       # Column G: Tier 2 Class
COL_TIER_3_CLASS = 8       # Column H: Tier 3 Class
COL_EXPEDITION_DEPARTURE = 10  # Column K: Expedition Departure (not 11)
COL_EXPEDITION_RETURN = 12     # Column L: Expedition Return  
COL_IP_LOCKOUT_END = 13        # Column M: IP Lockout End

MAX_EXPECTED_CELL_INDEX = max(
    COL_PLAYER_NAME, COL_ADVENTURER_NAME, COL_SPIRIT_CORE, COL_RACE,
    COL_SUB_RACE, COL_TIER_1_CLASS, COL_TIER_2_CLASS, COL_TIER_3_CLASS,
    COL_EXPEDITION_DEPARTURE, COL_EXPEDITION_RETURN, COL_IP_LOCKOUT_END
)

def sanitize_text(text: str | None) -> str:
    if text is None:
        return ""
    return ' '.join(text.split()).strip()

def get_cell_text(cell_tag: Tag | None) -> str:
    if not cell_tag:
        return ""
    span_s6 = cell_tag.find('span', class_='s6')
    if span_s6:
        text_content = span_s6.get_text(separator=' ', strip=True)
    else:
        text_content = cell_tag.get_text(separator=' ', strip=True)
    return sanitize_text(text_content)

def convert_html_to_tsv(input_html_path: str, output_tsv_path: str):
    if not os.path.exists(input_html_path):
        print(f"Error: Input HTML file not found at {input_html_path}")
        return

    all_rows_data = []

    with open(input_html_path, 'r', encoding='utf-8') as f:
        html_content = f.read()

    soup = BeautifulSoup(html_content, 'html.parser')

    table = soup.find('table', class_='waffle')
    if not table:
        print("Error: Could not find the table with class 'waffle'.")
        return

    tbody = table.find('tbody')
    if not tbody:
        print("Error: Could not find tbody in the table.")
        return

    data_table_rows = tbody.find_all('tr', recursive=False)[2:]

    for row_idx, row in enumerate(data_table_rows):
        cells = row.find_all('td', recursive=False)
        if not cells or len(cells) <= MAX_EXPECTED_CELL_INDEX:
            continue

        def get_text_from_cell_idx(idx: int) -> str:
            return get_cell_text(cells[idx]) if idx < len(cells) else ""

        player_name_raw = cells[COL_PLAYER_NAME].get_text(strip=True) if COL_PLAYER_NAME < len(cells) else ""
        player_name = sanitize_text(player_name_raw)

        if not player_name:
            all_cells_empty_looking = all(not sanitize_text(cell.get_text()) for cell in cells)
            if all_cells_empty_looking:
                continue

        adventurer_name = ""
        adventurer_url = ""
        if COL_ADVENTURER_NAME < len(cells):
            adv_name_cell = cells[COL_ADVENTURER_NAME]
            link_tag = adv_name_cell.find('a')
            if link_tag:
                adventurer_name = sanitize_text(link_tag.get_text())
                adventurer_url = link_tag.get('href', '')
            else:
                adventurer_name = get_cell_text(adv_name_cell)

        spirit_core = get_text_from_cell_idx(COL_SPIRIT_CORE)
        race = get_text_from_cell_idx(COL_RACE)
        sub_race = get_text_from_cell_idx(COL_SUB_RACE)
        tier1_class = get_text_from_cell_idx(COL_TIER_1_CLASS)
        tier2_class = get_text_from_cell_idx(COL_TIER_2_CLASS)
        tier3_class = get_text_from_cell_idx(COL_TIER_3_CLASS)
        expedition_departure = get_text_from_cell_idx(COL_EXPEDITION_DEPARTURE)
        expedition_return = get_text_from_cell_idx(COL_EXPEDITION_RETURN)
        ip_lockout_end = get_text_from_cell_idx(COL_IP_LOCKOUT_END)

        if player_name:
            all_rows_data.append([
                player_name,
                adventurer_name,
                adventurer_url,
                spirit_core,
                race,
                sub_race,
                tier1_class,
                tier2_class,
                tier3_class,
                expedition_departure,
                expedition_return,
                ip_lockout_end,
            ])

    headers = [
        "Player Name", "Adventurer Name", "Adventurer URL", "Spirit Core (Current)",
        "Race", "Sub-Race", "Tier 1 Class", "Tier 2 Class", "Tier 3 Class",
        "Exepdition Departure", "Expedition Return", "IP Lockout End"
    ]

    with open(output_tsv_path, 'w', newline='', encoding='utf-8') as tsvfile:
        writer = csv.writer(tsvfile, delimiter='\t')
        writer.writerow(headers)
        writer.writerows(all_rows_data)

    print(f"Successfully converted HTML to TSV at {output_tsv_path}")

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description="Convert Mirane Census HTML to TSV.")
    parser.add_argument("input_html", help="Path to the input HTML file")
    parser.add_argument("-o", "--output", help="Path to output TSV file (default: mirane_census_output.tsv)", default="mirane_census_output.tsv")
    args = parser.parse_args()
    convert_html_to_tsv(args.input_html, args.output)
