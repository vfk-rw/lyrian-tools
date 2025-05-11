#!/usr/bin/env python3
import csv
import argparse
from collections import OrderedDict
import re
import os
import yaml

# load class info from YAML
SCRIPT_DIR = os.path.dirname(__file__)
CLASS_LIST_PATH = os.path.join(SCRIPT_DIR, 'class_list.yaml')
with open(CLASS_LIST_PATH, encoding='utf-8') as f:
    class_items = yaml.safe_load(f) or []
CLASS_INFO = {item['class_name']: item for item in class_items}
VALID_CLASSES = set(CLASS_INFO.keys())

def parse_tsv(path):
    with open(path, newline='', encoding='utf-8') as f:
        reader = csv.DictReader(f, delimiter='\t')
        return list(reader)

def build_class_map(rows):
    classes = {}
    for col in ('Tier 1 Class', 'Tier 2 Class', 'Tier 3 Class'):
        for row in rows:
            for raw in row.get(col, '').split(','):
                name = raw.strip()
                # only include known valid classes
                if not name or name not in VALID_CLASSES:
                    continue
                tier = CLASS_INFO[name]['tier']
                if name not in classes or tier < classes[name]:
                    classes[name] = tier
    return OrderedDict(sorted(classes.items(), key=lambda x: x[0]))

def escape(s):
    return s.replace("'", "''")

def generate_sql(rows, class_map):
    stmts = []
    # DDL
    stmts.append("CREATE TABLE classes(id SERIAL PRIMARY KEY, name TEXT UNIQUE NOT NULL, tier INT NOT NULL);")
    stmts.append("CREATE TABLE characters(id SERIAL PRIMARY KEY, created_at TIMESTAMP NOT NULL DEFAULT now(), player_name TEXT, adventurer_name TEXT, adventurer_url TEXT, spirit_core_current INT, race TEXT, sub_race TEXT, expedition_departure DATE, expedition_return DATE, ip_lockout_end DATE);")
    stmts.append("CREATE TABLE character_classes(character_id INT REFERENCES characters(id), class_id INT REFERENCES classes(id), PRIMARY KEY(character_id, class_id));")
    # insert classes
    stmts.append("\n-- insert classes")
    for name, tier in class_map.items():
        stmts.append(f"INSERT INTO classes(name,tier) VALUES('{escape(name)}',{tier});")
    # insert characters
    stmts.append("\n-- insert characters and relationships")
    for idx, row in enumerate(rows, 1):
        vals = {
            'player': escape(row.get('Player Name','')),
            'adv': escape(row.get('Adventurer Name','')),
            'url': escape(row.get('Adventurer URL','')),
            'spirit': row.get('Spirit Core (Current)','') or None,
            'race': escape(row.get('Race','')),
            'sub': escape(row.get('Sub-Race','')),
            'dep': row.get('Exepdition Departure','') or None,
            'ret': row.get('Expedition Return','') or None,
            'lock': row.get('IP Lockout End','') or None,
        }
        spirit = vals['spirit'] if vals['spirit'] is not None else 'NULL'
        dep = f"'{vals['dep']}'" if vals['dep'] else 'NULL'
        ret = f"'{vals['ret']}'" if vals['ret'] else 'NULL'
        lock = f"'{vals['lock']}'" if vals['lock'] else 'NULL'
        stmts.append(f"-- row {idx}")
        stmts.append("WITH c AS ("
                     f"INSERT INTO characters(player_name,adventurer_name,adventurer_url,spirit_core_current,race,sub_race,expedition_departure,expedition_return,ip_lockout_end) VALUES('"+
                     f"{vals['player']}','{vals['adv']}','{vals['url']}',{spirit},'"+f"{vals['race']}','{vals['sub']}',{dep},{ret},{lock}) RETURNING id)"
                    )
        # relationship
        class_list = []
        for col in ('Tier 1 Class','Tier 2 Class','Tier 3 Class'):
            for raw in row.get(col, '').split(','):
                cname = raw.strip()
                if cname and cname in VALID_CLASSES:
                    class_list.append(cname)
        names = ",".join(f"'{escape(c)}'" for c in class_list)
        stmts.append(f"INSERT INTO character_classes(character_id,class_id) SELECT c.id, cl.id FROM c, classes cl WHERE cl.name IN ({names});")
    return "\n".join(stmts)

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('tsv', help='input TSV path')
    parser.add_argument('sql', help='output SQL file path')
    args = parser.parse_args()
    rows = parse_tsv(args.tsv)
    classes = build_class_map(rows)
    sql = generate_sql(rows, classes)
    with open(args.sql, 'w', encoding='utf-8') as f:
        f.write(sql)
    print(f'SQL written to {args.sql}')

if __name__ == '__main__':
    main()
