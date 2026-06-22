#!/usr/bin/env python3
"""enrich_country_geojson.py

Fill in missing country properties (`capital`, `population`,
`highest_point_m`/`highest_point_ft`, `tz_offset_minutes`/`tz_iana`,
`gdp_usd`/`gdp_year`) across the Looma map geojson files.

Behaviour:
  • Read a curated, offline dataset embedded below (no network).
  • For every Feature in every input file, fill in any property that is
    currently absent / null / empty string. Existing values are NEVER
    overwritten — the script is enrich-only.
  • `highest_point_ft` is derived from `highest_point_m` (or vice versa)
    whenever exactly one side is known.

Usage:
    # Report what would be filled, no writes:
    python "enrich_country_geojson.py" --dry-run

    # Apply changes (writes back to the same files):
    python "enrich_country_geojson.py" --write

The script is meant to be run from anywhere — it resolves the project root
relative to its own location.
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path
from typing import Any


# Project root (Looma/Looma/Looma) is two parents above this script:
#   .../Looma/Looma/Looma/looma shell scripts/enrich_country_geojson.py
PROJECT_ROOT = Path(__file__).resolve().parent.parent

# We enrich every country geojson we know about, across BOTH the static
# /content/maps/json/ tree (what Apache actually serves to the browser) and
# the legacy /maps2018/json/ tree (kept in sync with the docker volume).
# Each tuple is (root_dir, relative_geojson_path). If a path doesn't exist
# the file is silently skipped — that lets the same script work on machines
# where one of the two trees is missing.
PROD_MAPS_ROOT   = PROJECT_ROOT.parent / 'content' / 'maps' / 'json'
LEGACY_MAPS_ROOT = PROJECT_ROOT.parent / 'maps2018' / 'json'

# Default "maps root" used by --maps-root for backwards compatibility.
MAPS_ROOT = PROD_MAPS_ROOT

# All country-shaped geojson files we know how to enrich. Sub-directories
# are explicit because the SAARC variants live under their own folder.
GEOJSON_FILES = [
    'countries.geojson',
    'africanCountries.geojson',
    'asianCountries.geojson',
    'europeanCountries.geojson',
    'northAmericanCountries.geojson',
    'southAmericanCountries.geojson',
    'SAARC/SAARC countries.json',
    'SAARC/SAARC countries with Maldives.json',
]

# Columns of the embedded dataset:
#   iso_a3, capital, population, highest_point_m,
#   tz_offset_minutes, tz_iana, gdp_usd, gdp_year
# population is the latest available UN/World Bank estimate (≤ 2023).
# highest_point_m is the country's tallest peak (or highest elevation).
# tz_offset_minutes is the *standard-time* UTC offset (DST ignored on purpose
# so the map stays stable year-round). tz_iana is the most-populated IANA zone.
# gdp_usd is nominal 2023 GDP in current USD; gdp_year is always 2023.
#
# Entries are sorted by ISO_A3 so diffs stay tidy.
COUNTRY_DATA: dict[str, dict[str, Any]] = {
    'AFG': {'capital': 'Kabul',          'population': 43844000, 'highest_point_m': 7492, 'tz_offset_minutes':  270, 'tz_iana': 'Asia/Kabul',          'gdp_usd':   17152234637, 'gdp_year': 2023},
    'AGO': {'capital': 'Luanda',         'population': 36684000, 'highest_point_m': 2620, 'tz_offset_minutes':   60, 'tz_iana': 'Africa/Luanda',       'gdp_usd':   84723900000, 'gdp_year': 2023},
    'ALB': {'capital': 'Tirana',         'population':  2832439, 'highest_point_m': 2764, 'tz_offset_minutes':   60, 'tz_iana': 'Europe/Tirane',      'gdp_usd':   22980080000, 'gdp_year': 2023},
    'AND': {'capital': 'Andorra la Vella','population':   80088, 'highest_point_m': 2942, 'tz_offset_minutes':   60, 'tz_iana': 'Europe/Andorra',     'gdp_usd':    3690000000, 'gdp_year': 2023},
    'ARE': {'capital': 'Abu Dhabi',      'population':  9890400, 'highest_point_m': 1934, 'tz_offset_minutes':  240, 'tz_iana': 'Asia/Dubai',          'gdp_usd':  504170000000, 'gdp_year': 2023},
    'ARG': {'capital': 'Buenos Aires',   'population': 45773884, 'highest_point_m': 6960, 'tz_offset_minutes': -180, 'tz_iana': 'America/Argentina/Buenos_Aires', 'gdp_usd':  640591410000, 'gdp_year': 2023},
    'ARM': {'capital': 'Yerevan',        'population':  2780469, 'highest_point_m': 4090, 'tz_offset_minutes':  240, 'tz_iana': 'Asia/Yerevan',        'gdp_usd':   24107880000, 'gdp_year': 2023},
    'ATG': {'capital': "St. John's",     'population':    93219, 'highest_point_m':  402, 'tz_offset_minutes': -240, 'tz_iana': 'America/Antigua',     'gdp_usd':    1880740000, 'gdp_year': 2023},
    'AUS': {'capital': 'Canberra',       'population': 26439000, 'highest_point_m': 2228, 'tz_offset_minutes':  600, 'tz_iana': 'Australia/Sydney',    'gdp_usd': 1723827270000, 'gdp_year': 2023},
    'AUT': {'capital': 'Vienna',         'population':  9132380, 'highest_point_m': 3798, 'tz_offset_minutes':   60, 'tz_iana': 'Europe/Vienna',       'gdp_usd':  516600000000, 'gdp_year': 2023},
    'AZE': {'capital': 'Baku',           'population': 10358074, 'highest_point_m': 4466, 'tz_offset_minutes':  240, 'tz_iana': 'Asia/Baku',           'gdp_usd':   72356420000, 'gdp_year': 2023},
    'BDI': {'capital': 'Gitega',         'population': 13238000, 'highest_point_m': 2670, 'tz_offset_minutes':  120, 'tz_iana': 'Africa/Bujumbura',    'gdp_usd':    3340000000, 'gdp_year': 2023},
    'BEL': {'capital': 'Brussels',       'population': 11754004, 'highest_point_m':  694, 'tz_offset_minutes':   60, 'tz_iana': 'Europe/Brussels',     'gdp_usd':  632220000000, 'gdp_year': 2023},
    'BEN': {'capital': 'Porto-Novo',     'population': 13352000, 'highest_point_m':  658, 'tz_offset_minutes':   60, 'tz_iana': 'Africa/Porto-Novo',   'gdp_usd':   19940000000, 'gdp_year': 2023},
    'BFA': {'capital': 'Ouagadougou',    'population': 23251000, 'highest_point_m':  747, 'tz_offset_minutes':    0, 'tz_iana': 'Africa/Ouagadougou',  'gdp_usd':   20780000000, 'gdp_year': 2023},
    'BGD': {'capital': 'Dhaka',          'population':171466000, 'highest_point_m': 1230, 'tz_offset_minutes':  360, 'tz_iana': 'Asia/Dhaka',          'gdp_usd':  446350000000, 'gdp_year': 2023},
    'BGR': {'capital': 'Sofia',          'population':  6447710, 'highest_point_m': 2925, 'tz_offset_minutes':  120, 'tz_iana': 'Europe/Sofia',        'gdp_usd':  101470000000, 'gdp_year': 2023},
    'BHR': {'capital': 'Manama',         'population':  1485000, 'highest_point_m':  134, 'tz_offset_minutes':  180, 'tz_iana': 'Asia/Bahrain',        'gdp_usd':   46060000000, 'gdp_year': 2023},
    'BHS': {'capital': 'Nassau',         'population':   412623, 'highest_point_m':   63, 'tz_offset_minutes': -300, 'tz_iana': 'America/Nassau',      'gdp_usd':   14430000000, 'gdp_year': 2023},
    'BIH': {'capital': 'Sarajevo',       'population':  3210847, 'highest_point_m': 2386, 'tz_offset_minutes':   60, 'tz_iana': 'Europe/Sarajevo',     'gdp_usd':   27018000000, 'gdp_year': 2023},
    'BLR': {'capital': 'Minsk',          'population':  9499000, 'highest_point_m':  346, 'tz_offset_minutes':  180, 'tz_iana': 'Europe/Minsk',        'gdp_usd':   72790000000, 'gdp_year': 2023},
    'BLZ': {'capital': 'Belmopan',       'population':   410825, 'highest_point_m': 1124, 'tz_offset_minutes': -360, 'tz_iana': 'America/Belize',      'gdp_usd':    3340000000, 'gdp_year': 2023},
    'BOL': {'capital': 'Sucre',          'population': 12388000, 'highest_point_m': 6542, 'tz_offset_minutes': -240, 'tz_iana': 'America/La_Paz',      'gdp_usd':   45850000000, 'gdp_year': 2023},
    'BRA': {'capital': 'Brasília',       'population':216422000, 'highest_point_m': 2994, 'tz_offset_minutes': -180, 'tz_iana': 'America/Sao_Paulo',   'gdp_usd': 2173666016000, 'gdp_year': 2023},
    'BRB': {'capital': 'Bridgetown',     'population':   281995, 'highest_point_m':  340, 'tz_offset_minutes': -240, 'tz_iana': 'America/Barbados',    'gdp_usd':    6580000000, 'gdp_year': 2023},
    'BRN': {'capital': 'Bandar Seri Begawan', 'population': 452524, 'highest_point_m': 1850, 'tz_offset_minutes': 480, 'tz_iana': 'Asia/Brunei',       'gdp_usd':   15154220000, 'gdp_year': 2023},
    'BTN': {'capital': 'Thimphu',        'population':   787424, 'highest_point_m': 7570, 'tz_offset_minutes':  360, 'tz_iana': 'Asia/Thimphu',        'gdp_usd':    2900000000, 'gdp_year': 2023},
    'BWA': {'capital': 'Gaborone',       'population':  2675000, 'highest_point_m': 1494, 'tz_offset_minutes':  120, 'tz_iana': 'Africa/Gaborone',     'gdp_usd':   19400000000, 'gdp_year': 2023},
    'CAF': {'capital': 'Bangui',         'population':  5742000, 'highest_point_m': 1410, 'tz_offset_minutes':   60, 'tz_iana': 'Africa/Bangui',       'gdp_usd':    2520000000, 'gdp_year': 2023},
    'CAN': {'capital': 'Ottawa',         'population': 40098000, 'highest_point_m': 5959, 'tz_offset_minutes': -300, 'tz_iana': 'America/Toronto',     'gdp_usd': 2139840000000, 'gdp_year': 2023},
    'CHE': {'capital': 'Bern',           'population':  8849000, 'highest_point_m': 4634, 'tz_offset_minutes':   60, 'tz_iana': 'Europe/Zurich',       'gdp_usd':  905680000000, 'gdp_year': 2023},
    'CHL': {'capital': 'Santiago',       'population': 19629590, 'highest_point_m': 6893, 'tz_offset_minutes': -240, 'tz_iana': 'America/Santiago',    'gdp_usd':  335530000000, 'gdp_year': 2023},
    'CHN': {'capital': 'Beijing',        'population':1410710000, 'highest_point_m': 8848, 'tz_offset_minutes': 480, 'tz_iana': 'Asia/Shanghai',       'gdp_usd':17794780000000, 'gdp_year': 2023},
    'CIV': {'capital': 'Yamoussoukro',   'population': 28873000, 'highest_point_m': 1752, 'tz_offset_minutes':    0, 'tz_iana': 'Africa/Abidjan',      'gdp_usd':   78890000000, 'gdp_year': 2023},
    'CMR': {'capital': 'Yaoundé',        'population': 28647000, 'highest_point_m': 4040, 'tz_offset_minutes':   60, 'tz_iana': 'Africa/Douala',       'gdp_usd':   49260000000, 'gdp_year': 2023},
    'COD': {'capital': 'Kinshasa',       'population':102263000, 'highest_point_m': 5109, 'tz_offset_minutes':   60, 'tz_iana': 'Africa/Kinshasa',     'gdp_usd':   67510000000, 'gdp_year': 2023},
    'COG': {'capital': 'Brazzaville',    'population':  6107000, 'highest_point_m': 1040, 'tz_offset_minutes':   60, 'tz_iana': 'Africa/Brazzaville',  'gdp_usd':   15310000000, 'gdp_year': 2023},
    'COL': {'capital': 'Bogotá',         'population': 52086000, 'highest_point_m': 5775, 'tz_offset_minutes': -300, 'tz_iana': 'America/Bogota',      'gdp_usd':  363540000000, 'gdp_year': 2023},
    'COM': {'capital': 'Moroni',         'population':   852075, 'highest_point_m': 2360, 'tz_offset_minutes':  180, 'tz_iana': 'Indian/Comoro',       'gdp_usd':    1320000000, 'gdp_year': 2023},
    'CPV': {'capital': 'Praia',          'population':   598682, 'highest_point_m': 2829, 'tz_offset_minutes':  -60, 'tz_iana': 'Atlantic/Cape_Verde', 'gdp_usd':    2520000000, 'gdp_year': 2023},
    'CRI': {'capital': 'San José',       'population':  5180000, 'highest_point_m': 3819, 'tz_offset_minutes': -360, 'tz_iana': 'America/Costa_Rica',  'gdp_usd':   85590000000, 'gdp_year': 2023},
    'CUB': {'capital': 'Havana',         'population': 11194000, 'highest_point_m': 1974, 'tz_offset_minutes': -300, 'tz_iana': 'America/Havana',      'gdp_usd':  107350000000, 'gdp_year': 2023},
    'CYP': {'capital': 'Nicosia',        'population':  1260138, 'highest_point_m': 1952, 'tz_offset_minutes':  120, 'tz_iana': 'Asia/Nicosia',        'gdp_usd':   32030000000, 'gdp_year': 2023},
    'CZE': {'capital': 'Prague',         'population': 10873689, 'highest_point_m': 1603, 'tz_offset_minutes':   60, 'tz_iana': 'Europe/Prague',       'gdp_usd':  330860000000, 'gdp_year': 2023},
    'DEU': {'capital': 'Berlin',         'population': 84482267, 'highest_point_m': 2962, 'tz_offset_minutes':   60, 'tz_iana': 'Europe/Berlin',       'gdp_usd': 4456080000000, 'gdp_year': 2023},
    'DJI': {'capital': 'Djibouti',       'population':  1136455, 'highest_point_m': 2028, 'tz_offset_minutes':  180, 'tz_iana': 'Africa/Djibouti',     'gdp_usd':    3873000000, 'gdp_year': 2023},
    'DMA': {'capital': 'Roseau',         'population':    73040, 'highest_point_m': 1447, 'tz_offset_minutes': -240, 'tz_iana': 'America/Dominica',    'gdp_usd':     656000000, 'gdp_year': 2023},
    'DNK': {'capital': 'Copenhagen',     'population':  5946952, 'highest_point_m':  171, 'tz_offset_minutes':   60, 'tz_iana': 'Europe/Copenhagen',   'gdp_usd':  407100000000, 'gdp_year': 2023},
    'DOM': {'capital': 'Santo Domingo',  'population': 11332972, 'highest_point_m': 3098, 'tz_offset_minutes': -240, 'tz_iana': 'America/Santo_Domingo','gdp_usd':  121670000000, 'gdp_year': 2023},
    'DZA': {'capital': 'Algiers',        'population': 45606000, 'highest_point_m': 3003, 'tz_offset_minutes':   60, 'tz_iana': 'Africa/Algiers',      'gdp_usd':  239900000000, 'gdp_year': 2023},
    'ECU': {'capital': 'Quito',          'population': 18190484, 'highest_point_m': 6263, 'tz_offset_minutes': -300, 'tz_iana': 'America/Guayaquil',   'gdp_usd':  118840000000, 'gdp_year': 2023},
    'EGY': {'capital': 'Cairo',          'population':112717000, 'highest_point_m': 2629, 'tz_offset_minutes':  120, 'tz_iana': 'Africa/Cairo',        'gdp_usd':  395920000000, 'gdp_year': 2023},
    'ERI': {'capital': 'Asmara',         'population':  3748902, 'highest_point_m': 3018, 'tz_offset_minutes':  180, 'tz_iana': 'Africa/Asmara',       'gdp_usd':    2080000000, 'gdp_year': 2023},
    'ESP': {'capital': 'Madrid',         'population': 48373336, 'highest_point_m': 3718, 'tz_offset_minutes':   60, 'tz_iana': 'Europe/Madrid',       'gdp_usd': 1580690000000, 'gdp_year': 2023},
    'EST': {'capital': 'Tallinn',        'population':  1366491, 'highest_point_m':  318, 'tz_offset_minutes':  120, 'tz_iana': 'Europe/Tallinn',      'gdp_usd':   41320000000, 'gdp_year': 2023},
    'ETH': {'capital': 'Addis Ababa',    'population':126527000, 'highest_point_m': 4533, 'tz_offset_minutes':  180, 'tz_iana': 'Africa/Addis_Ababa',  'gdp_usd':  159740000000, 'gdp_year': 2023},
    'FIN': {'capital': 'Helsinki',       'population':  5563970, 'highest_point_m': 1324, 'tz_offset_minutes':  120, 'tz_iana': 'Europe/Helsinki',     'gdp_usd':  295540000000, 'gdp_year': 2023},
    'FJI': {'capital': 'Suva',           'population':   924610, 'highest_point_m': 1324, 'tz_offset_minutes':  720, 'tz_iana': 'Pacific/Fiji',        'gdp_usd':    5470000000, 'gdp_year': 2023},
    'FRA': {'capital': 'Paris',          'population': 68170228, 'highest_point_m': 4810, 'tz_offset_minutes':   60, 'tz_iana': 'Europe/Paris',        'gdp_usd': 3030904000000, 'gdp_year': 2023},
    'FSM': {'capital': 'Palikir',        'population':   115000, 'highest_point_m':  791, 'tz_offset_minutes':  660, 'tz_iana': 'Pacific/Pohnpei',     'gdp_usd':     460000000, 'gdp_year': 2023},
    'GAB': {'capital': 'Libreville',     'population':  2436566, 'highest_point_m': 1575, 'tz_offset_minutes':   60, 'tz_iana': 'Africa/Libreville',   'gdp_usd':   20780000000, 'gdp_year': 2023},
    'GBR': {'capital': 'London',         'population': 67596000, 'highest_point_m': 1345, 'tz_offset_minutes':    0, 'tz_iana': 'Europe/London',       'gdp_usd': 3380840000000, 'gdp_year': 2023},
    'GEO': {'capital': 'Tbilisi',        'population':  3728282, 'highest_point_m': 5193, 'tz_offset_minutes':  240, 'tz_iana': 'Asia/Tbilisi',        'gdp_usd':   30780000000, 'gdp_year': 2023},
    'GHA': {'capital': 'Accra',          'population': 34121985, 'highest_point_m':  885, 'tz_offset_minutes':    0, 'tz_iana': 'Africa/Accra',        'gdp_usd':   76370000000, 'gdp_year': 2023},
    'GIN': {'capital': 'Conakry',        'population': 14190612, 'highest_point_m': 1752, 'tz_offset_minutes':    0, 'tz_iana': 'Africa/Conakry',      'gdp_usd':   23620000000, 'gdp_year': 2023},
    'GMB': {'capital': 'Banjul',         'population':  2773168, 'highest_point_m':   53, 'tz_offset_minutes':    0, 'tz_iana': 'Africa/Banjul',       'gdp_usd':    2370000000, 'gdp_year': 2023},
    'GNB': {'capital': 'Bissau',         'population':  2150842, 'highest_point_m':  300, 'tz_offset_minutes':    0, 'tz_iana': 'Africa/Bissau',       'gdp_usd':    1970000000, 'gdp_year': 2023},
    'GNQ': {'capital': 'Malabo',         'population':  1714672, 'highest_point_m': 3008, 'tz_offset_minutes':   60, 'tz_iana': 'Africa/Malabo',       'gdp_usd':   13310000000, 'gdp_year': 2023},
    'GRC': {'capital': 'Athens',         'population': 10394055, 'highest_point_m': 2918, 'tz_offset_minutes':  120, 'tz_iana': 'Europe/Athens',       'gdp_usd':  243580000000, 'gdp_year': 2023},
    'GRD': {'capital': "St. George's",   'population':   126183, 'highest_point_m':  840, 'tz_offset_minutes': -240, 'tz_iana': 'America/Grenada',     'gdp_usd':    1250000000, 'gdp_year': 2023},
    'GTM': {'capital': 'Guatemala City', 'population': 17602431, 'highest_point_m': 4220, 'tz_offset_minutes': -360, 'tz_iana': 'America/Guatemala',   'gdp_usd':  102310000000, 'gdp_year': 2023},
    'GUY': {'capital': 'Georgetown',     'population':   813834, 'highest_point_m': 2810, 'tz_offset_minutes': -240, 'tz_iana': 'America/Guyana',      'gdp_usd':   16330000000, 'gdp_year': 2023},
    'HND': {'capital': 'Tegucigalpa',    'population': 10593798, 'highest_point_m': 2870, 'tz_offset_minutes': -360, 'tz_iana': 'America/Tegucigalpa', 'gdp_usd':   34370000000, 'gdp_year': 2023},
    'HRV': {'capital': 'Zagreb',         'population':  3855641, 'highest_point_m': 1831, 'tz_offset_minutes':   60, 'tz_iana': 'Europe/Zagreb',       'gdp_usd':   82770000000, 'gdp_year': 2023},
    'HTI': {'capital': 'Port-au-Prince', 'population': 11724764, 'highest_point_m': 2680, 'tz_offset_minutes': -300, 'tz_iana': 'America/Port-au-Prince','gdp_usd':  19850000000, 'gdp_year': 2023},
    'HUN': {'capital': 'Budapest',       'population':  9676135, 'highest_point_m': 1014, 'tz_offset_minutes':   60, 'tz_iana': 'Europe/Budapest',     'gdp_usd':  212390000000, 'gdp_year': 2023},
    'IDN': {'capital': 'Jakarta',        'population':277534000, 'highest_point_m': 4884, 'tz_offset_minutes':  420, 'tz_iana': 'Asia/Jakarta',        'gdp_usd': 1371171780000, 'gdp_year': 2023},
    'IND': {'capital': 'New Delhi',      'population':1428628000, 'highest_point_m': 8586, 'tz_offset_minutes': 330, 'tz_iana': 'Asia/Kolkata',        'gdp_usd': 3567552010000, 'gdp_year': 2023},
    'IRL': {'capital': 'Dublin',         'population':  5256800, 'highest_point_m': 1041, 'tz_offset_minutes':    0, 'tz_iana': 'Europe/Dublin',       'gdp_usd':  545600000000, 'gdp_year': 2023},
    'IRN': {'capital': 'Tehran',         'population': 89172767, 'highest_point_m': 5610, 'tz_offset_minutes':  210, 'tz_iana': 'Asia/Tehran',         'gdp_usd':  401520000000, 'gdp_year': 2023},
    'IRQ': {'capital': 'Baghdad',        'population': 45504560, 'highest_point_m': 3611, 'tz_offset_minutes':  180, 'tz_iana': 'Asia/Baghdad',        'gdp_usd':  264130000000, 'gdp_year': 2023},
    'ISL': {'capital': 'Reykjavík',      'population':   393600, 'highest_point_m': 2110, 'tz_offset_minutes':    0, 'tz_iana': 'Atlantic/Reykjavik',  'gdp_usd':   30570000000, 'gdp_year': 2023},
    'ISR': {'capital': 'Jerusalem',      'population':  9510000, 'highest_point_m': 2236, 'tz_offset_minutes':  120, 'tz_iana': 'Asia/Jerusalem',      'gdp_usd':  509900000000, 'gdp_year': 2023},
    'ITA': {'capital': 'Rome',           'population': 58761146, 'highest_point_m': 4810, 'tz_offset_minutes':   60, 'tz_iana': 'Europe/Rome',         'gdp_usd': 2186080000000, 'gdp_year': 2023},
    'JAM': {'capital': 'Kingston',       'population':  2825544, 'highest_point_m': 2256, 'tz_offset_minutes': -300, 'tz_iana': 'America/Jamaica',     'gdp_usd':   18760000000, 'gdp_year': 2023},
    'JOR': {'capital': 'Amman',          'population': 11337052, 'highest_point_m': 1854, 'tz_offset_minutes':  180, 'tz_iana': 'Asia/Amman',          'gdp_usd':   50820000000, 'gdp_year': 2023},
    'JPN': {'capital': 'Tokyo',          'population':124516000, 'highest_point_m': 3776, 'tz_offset_minutes':  540, 'tz_iana': 'Asia/Tokyo',          'gdp_usd': 4212946000000, 'gdp_year': 2023},
    'KAZ': {'capital': 'Astana',         'population': 19771000, 'highest_point_m': 7010, 'tz_offset_minutes':  300, 'tz_iana': 'Asia/Almaty',         'gdp_usd':  261420000000, 'gdp_year': 2023},
    'KEN': {'capital': 'Nairobi',        'population': 55100586, 'highest_point_m': 5199, 'tz_offset_minutes':  180, 'tz_iana': 'Africa/Nairobi',      'gdp_usd':  108040000000, 'gdp_year': 2023},
    'KGZ': {'capital': 'Bishkek',        'population':  6735347, 'highest_point_m': 7439, 'tz_offset_minutes':  360, 'tz_iana': 'Asia/Bishkek',        'gdp_usd':   13990000000, 'gdp_year': 2023},
    'KHM': {'capital': 'Phnom Penh',     'population': 16944000, 'highest_point_m': 1813, 'tz_offset_minutes':  420, 'tz_iana': 'Asia/Phnom_Penh',     'gdp_usd':   31770000000, 'gdp_year': 2023},
    'KIR': {'capital': 'Tarawa',         'population':   133515, 'highest_point_m':   81, 'tz_offset_minutes':  720, 'tz_iana': 'Pacific/Tarawa',      'gdp_usd':     279000000, 'gdp_year': 2023},
    'KNA': {'capital': 'Basseterre',     'population':    47755, 'highest_point_m': 1156, 'tz_offset_minutes': -240, 'tz_iana': 'America/St_Kitts',    'gdp_usd':    1140000000, 'gdp_year': 2023},
    'KOR': {'capital': 'Seoul',          'population': 51713000, 'highest_point_m': 1950, 'tz_offset_minutes':  540, 'tz_iana': 'Asia/Seoul',          'gdp_usd': 1712790000000, 'gdp_year': 2023},
    'KWT': {'capital': 'Kuwait City',    'population':  4310108, 'highest_point_m':  306, 'tz_offset_minutes':  180, 'tz_iana': 'Asia/Kuwait',         'gdp_usd':  159690000000, 'gdp_year': 2023},
    'LAO': {'capital': 'Vientiane',      'population':  7634000, 'highest_point_m': 2820, 'tz_offset_minutes':  420, 'tz_iana': 'Asia/Vientiane',      'gdp_usd':   15370000000, 'gdp_year': 2023},
    'LBN': {'capital': 'Beirut',         'population':  5489739, 'highest_point_m': 3088, 'tz_offset_minutes':  120, 'tz_iana': 'Asia/Beirut',         'gdp_usd':   17940000000, 'gdp_year': 2023},
    'LBR': {'capital': 'Monrovia',       'population':  5418377, 'highest_point_m': 1440, 'tz_offset_minutes':    0, 'tz_iana': 'Africa/Monrovia',     'gdp_usd':    4350000000, 'gdp_year': 2023},
    'LBY': {'capital': 'Tripoli',        'population':  6888388, 'highest_point_m': 2267, 'tz_offset_minutes':  120, 'tz_iana': 'Africa/Tripoli',      'gdp_usd':   50390000000, 'gdp_year': 2023},
    'LCA': {'capital': 'Castries',       'population':   180251, 'highest_point_m':  950, 'tz_offset_minutes': -240, 'tz_iana': 'America/St_Lucia',    'gdp_usd':    2360000000, 'gdp_year': 2023},
    'LIE': {'capital': 'Vaduz',          'population':    39584, 'highest_point_m': 2599, 'tz_offset_minutes':   60, 'tz_iana': 'Europe/Vaduz',        'gdp_usd':    7700000000, 'gdp_year': 2023},
    'LKA': {'capital': 'Colombo',        'population': 21893579, 'highest_point_m': 2524, 'tz_offset_minutes':  330, 'tz_iana': 'Asia/Colombo',        'gdp_usd':   84360000000, 'gdp_year': 2023},
    'LSO': {'capital': 'Maseru',         'population':  2330000, 'highest_point_m': 3482, 'tz_offset_minutes':  120, 'tz_iana': 'Africa/Maseru',       'gdp_usd':    2200000000, 'gdp_year': 2023},
    'LTU': {'capital': 'Vilnius',        'population':  2857279, 'highest_point_m':  294, 'tz_offset_minutes':  120, 'tz_iana': 'Europe/Vilnius',      'gdp_usd':   77810000000, 'gdp_year': 2023},
    'LUX': {'capital': 'Luxembourg',     'population':   660809, 'highest_point_m':  560, 'tz_offset_minutes':   60, 'tz_iana': 'Europe/Luxembourg',   'gdp_usd':   89090000000, 'gdp_year': 2023},
    'LVA': {'capital': 'Riga',           'population':  1883008, 'highest_point_m':  312, 'tz_offset_minutes':  120, 'tz_iana': 'Europe/Riga',         'gdp_usd':   40550000000, 'gdp_year': 2023},
    'MAR': {'capital': 'Rabat',          'population': 37840000, 'highest_point_m': 4167, 'tz_offset_minutes':   60, 'tz_iana': 'Africa/Casablanca',   'gdp_usd':  144420000000, 'gdp_year': 2023},
    'MCO': {'capital': 'Monaco',         'population':    36297, 'highest_point_m':  161, 'tz_offset_minutes':   60, 'tz_iana': 'Europe/Monaco',       'gdp_usd':    8800000000, 'gdp_year': 2023},
    'MDA': {'capital': 'Chișinău',       'population':  2486891, 'highest_point_m':  430, 'tz_offset_minutes':  120, 'tz_iana': 'Europe/Chisinau',     'gdp_usd':   16540000000, 'gdp_year': 2023},
    'MDG': {'capital': 'Antananarivo',   'population': 30326000, 'highest_point_m': 2876, 'tz_offset_minutes':  180, 'tz_iana': 'Indian/Antananarivo', 'gdp_usd':   16040000000, 'gdp_year': 2023},
    'MDV': {'capital': 'Malé',           'population':   521021, 'highest_point_m':    5, 'tz_offset_minutes':  300, 'tz_iana': 'Indian/Maldives',     'gdp_usd':    6760000000, 'gdp_year': 2023},
    'MEX': {'capital': 'Mexico City',    'population':128456000, 'highest_point_m': 5636, 'tz_offset_minutes': -360, 'tz_iana': 'America/Mexico_City', 'gdp_usd': 1789114000000, 'gdp_year': 2023},
    'MHL': {'capital': 'Majuro',         'population':    41996, 'highest_point_m':   10, 'tz_offset_minutes':  720, 'tz_iana': 'Pacific/Majuro',      'gdp_usd':     279000000, 'gdp_year': 2023},
    'MKD': {'capital': 'Skopje',         'population':  1815000, 'highest_point_m': 2764, 'tz_offset_minutes':   60, 'tz_iana': 'Europe/Skopje',       'gdp_usd':   15860000000, 'gdp_year': 2023},
    'MLI': {'capital': 'Bamako',         'population': 23294000, 'highest_point_m': 1155, 'tz_offset_minutes':    0, 'tz_iana': 'Africa/Bamako',       'gdp_usd':   20910000000, 'gdp_year': 2023},
    'MLT': {'capital': 'Valletta',       'population':   563443, 'highest_point_m':  253, 'tz_offset_minutes':   60, 'tz_iana': 'Europe/Malta',        'gdp_usd':   22320000000, 'gdp_year': 2023},
    'MMR': {'capital': 'Naypyidaw',      'population': 54577000, 'highest_point_m': 5881, 'tz_offset_minutes':  390, 'tz_iana': 'Asia/Yangon',         'gdp_usd':   66800000000, 'gdp_year': 2023},
    'MNE': {'capital': 'Podgorica',      'population':   616177, 'highest_point_m': 2534, 'tz_offset_minutes':   60, 'tz_iana': 'Europe/Podgorica',    'gdp_usd':    7050000000, 'gdp_year': 2023},
    'MNG': {'capital': 'Ulaanbaatar',    'population':  3447157, 'highest_point_m': 4374, 'tz_offset_minutes':  480, 'tz_iana': 'Asia/Ulaanbaatar',    'gdp_usd':   18780000000, 'gdp_year': 2023},
    'MOZ': {'capital': 'Maputo',         'population': 33897354, 'highest_point_m': 2436, 'tz_offset_minutes':  120, 'tz_iana': 'Africa/Maputo',       'gdp_usd':   21270000000, 'gdp_year': 2023},
    'MRT': {'capital': 'Nouakchott',     'population':  4862989, 'highest_point_m':  915, 'tz_offset_minutes':    0, 'tz_iana': 'Africa/Nouakchott',   'gdp_usd':   10360000000, 'gdp_year': 2023},
    'MUS': {'capital': 'Port Louis',     'population':  1262605, 'highest_point_m':  828, 'tz_offset_minutes':  240, 'tz_iana': 'Indian/Mauritius',    'gdp_usd':   14820000000, 'gdp_year': 2023},
    'MWI': {'capital': 'Lilongwe',       'population': 20931000, 'highest_point_m': 3002, 'tz_offset_minutes':  120, 'tz_iana': 'Africa/Blantyre',     'gdp_usd':   13160000000, 'gdp_year': 2023},
    'MYS': {'capital': 'Kuala Lumpur',   'population': 33938000, 'highest_point_m': 4095, 'tz_offset_minutes':  480, 'tz_iana': 'Asia/Kuala_Lumpur',   'gdp_usd':  399649760000, 'gdp_year': 2023},
    'NAM': {'capital': 'Windhoek',       'population':  2604172, 'highest_point_m': 2606, 'tz_offset_minutes':  120, 'tz_iana': 'Africa/Windhoek',     'gdp_usd':   12640000000, 'gdp_year': 2023},
    'NER': {'capital': 'Niamey',         'population': 27202843, 'highest_point_m': 2022, 'tz_offset_minutes':   60, 'tz_iana': 'Africa/Niamey',       'gdp_usd':   16620000000, 'gdp_year': 2023},
    'NGA': {'capital': 'Abuja',          'population':223805000, 'highest_point_m': 2419, 'tz_offset_minutes':   60, 'tz_iana': 'Africa/Lagos',        'gdp_usd':  362810000000, 'gdp_year': 2023},
    'NIC': {'capital': 'Managua',        'population':  6850540, 'highest_point_m': 2438, 'tz_offset_minutes': -360, 'tz_iana': 'America/Managua',     'gdp_usd':   17260000000, 'gdp_year': 2023},
    'NLD': {'capital': 'Amsterdam',      'population': 17879500, 'highest_point_m':  877, 'tz_offset_minutes':   60, 'tz_iana': 'Europe/Amsterdam',    'gdp_usd': 1118010000000, 'gdp_year': 2023},
    'NOR': {'capital': 'Oslo',           'population':  5550203, 'highest_point_m': 2469, 'tz_offset_minutes':   60, 'tz_iana': 'Europe/Oslo',         'gdp_usd':  485700000000, 'gdp_year': 2023},
    'NPL': {'capital': 'Kathmandu',      'population': 30897000, 'highest_point_m': 8848, 'tz_offset_minutes':  345, 'tz_iana': 'Asia/Kathmandu',      'gdp_usd':   41339850000, 'gdp_year': 2023},
    'NRU': {'capital': 'Yaren',          'population':    12780, 'highest_point_m':   65, 'tz_offset_minutes':  720, 'tz_iana': 'Pacific/Nauru',       'gdp_usd':     154000000, 'gdp_year': 2023},
    'NZL': {'capital': 'Wellington',     'population':  5223100, 'highest_point_m': 3724, 'tz_offset_minutes':  720, 'tz_iana': 'Pacific/Auckland',    'gdp_usd':  253466660000, 'gdp_year': 2023},
    'OMN': {'capital': 'Muscat',         'population':  4644384, 'highest_point_m': 3009, 'tz_offset_minutes':  240, 'tz_iana': 'Asia/Muscat',         'gdp_usd':  108280000000, 'gdp_year': 2023},
    'PAK': {'capital': 'Islamabad',      'population':240485658, 'highest_point_m': 8611, 'tz_offset_minutes':  300, 'tz_iana': 'Asia/Karachi',        'gdp_usd':  374600000000, 'gdp_year': 2023},
    'PAN': {'capital': 'Panama City',    'population':  4468000, 'highest_point_m': 3475, 'tz_offset_minutes': -300, 'tz_iana': 'America/Panama',      'gdp_usd':   83320000000, 'gdp_year': 2023},
    'PER': {'capital': 'Lima',           'population': 34352720, 'highest_point_m': 6768, 'tz_offset_minutes': -300, 'tz_iana': 'America/Lima',        'gdp_usd':  264636000000, 'gdp_year': 2023},
    'PHL': {'capital': 'Manila',         'population':117337000, 'highest_point_m': 2954, 'tz_offset_minutes':  480, 'tz_iana': 'Asia/Manila',         'gdp_usd':  437132580000, 'gdp_year': 2023},
    'PLW': {'capital': 'Ngerulmud',      'population':    18055, 'highest_point_m':  242, 'tz_offset_minutes':  540, 'tz_iana': 'Pacific/Palau',       'gdp_usd':     268000000, 'gdp_year': 2023},
    'PNG': {'capital': 'Port Moresby',   'population': 10330000, 'highest_point_m': 4509, 'tz_offset_minutes':  600, 'tz_iana': 'Pacific/Port_Moresby','gdp_usd':   31360000000, 'gdp_year': 2023},
    'POL': {'capital': 'Warsaw',         'population': 36821000, 'highest_point_m': 2499, 'tz_offset_minutes':   60, 'tz_iana': 'Europe/Warsaw',       'gdp_usd':  811200000000, 'gdp_year': 2023},
    'PRK': {'capital': 'Pyongyang',      'population': 26161000, 'highest_point_m': 2744, 'tz_offset_minutes':  540, 'tz_iana': 'Asia/Pyongyang',      'gdp_usd':   28500000000, 'gdp_year': 2023},
    'PRT': {'capital': 'Lisbon',         'population': 10467366, 'highest_point_m': 2351, 'tz_offset_minutes':    0, 'tz_iana': 'Europe/Lisbon',       'gdp_usd':  287100000000, 'gdp_year': 2023},
    'PRY': {'capital': 'Asunción',       'population':  6861524, 'highest_point_m':  842, 'tz_offset_minutes': -240, 'tz_iana': 'America/Asuncion',    'gdp_usd':   45770000000, 'gdp_year': 2023},
    'PSE': {'capital': 'Ramallah',       'population':  5371230, 'highest_point_m': 1022, 'tz_offset_minutes':  120, 'tz_iana': 'Asia/Hebron',         'gdp_usd':   17420000000, 'gdp_year': 2023},
    'QAT': {'capital': 'Doha',           'population':  2716391, 'highest_point_m':  103, 'tz_offset_minutes':  180, 'tz_iana': 'Asia/Qatar',          'gdp_usd':  235500000000, 'gdp_year': 2023},
    'ROU': {'capital': 'Bucharest',      'population': 19053815, 'highest_point_m': 2544, 'tz_offset_minutes':  120, 'tz_iana': 'Europe/Bucharest',    'gdp_usd':  348900000000, 'gdp_year': 2023},
    'RUS': {'capital': 'Moscow',         'population':144444000, 'highest_point_m': 5642, 'tz_offset_minutes':  180, 'tz_iana': 'Europe/Moscow',       'gdp_usd': 2240420000000, 'gdp_year': 2023},
    'RWA': {'capital': 'Kigali',         'population': 13776698, 'highest_point_m': 4507, 'tz_offset_minutes':  120, 'tz_iana': 'Africa/Kigali',       'gdp_usd':   14100000000, 'gdp_year': 2023},
    'SAU': {'capital': 'Riyadh',         'population': 36947000, 'highest_point_m': 3133, 'tz_offset_minutes':  180, 'tz_iana': 'Asia/Riyadh',         'gdp_usd': 1068360000000, 'gdp_year': 2023},
    'SDN': {'capital': 'Khartoum',       'population': 48109000, 'highest_point_m': 3187, 'tz_offset_minutes':  120, 'tz_iana': 'Africa/Khartoum',     'gdp_usd':  109470000000, 'gdp_year': 2023},
    'SEN': {'capital': 'Dakar',          'population': 17763163, 'highest_point_m':  648, 'tz_offset_minutes':    0, 'tz_iana': 'Africa/Dakar',        'gdp_usd':   31140000000, 'gdp_year': 2023},
    'SGP': {'capital': 'Singapore',      'population':  5917648, 'highest_point_m':  164, 'tz_offset_minutes':  480, 'tz_iana': 'Asia/Singapore',      'gdp_usd':  501428770000, 'gdp_year': 2023},
    'SLB': {'capital': 'Honiara',        'population':   740424, 'highest_point_m': 2447, 'tz_offset_minutes':  660, 'tz_iana': 'Pacific/Guadalcanal', 'gdp_usd':    1700000000, 'gdp_year': 2023},
    'SLE': {'capital': 'Freetown',       'population':  8791092, 'highest_point_m': 1948, 'tz_offset_minutes':    0, 'tz_iana': 'Africa/Freetown',     'gdp_usd':    6190000000, 'gdp_year': 2023},
    'SLV': {'capital': 'San Salvador',   'population':  6364943, 'highest_point_m': 2730, 'tz_offset_minutes': -360, 'tz_iana': 'America/El_Salvador', 'gdp_usd':   33850000000, 'gdp_year': 2023},
    'SMR': {'capital': 'San Marino',     'population':    33745, 'highest_point_m':  749, 'tz_offset_minutes':   60, 'tz_iana': 'Europe/San_Marino',   'gdp_usd':    1855000000, 'gdp_year': 2023},
    'SOM': {'capital': 'Mogadishu',      'population': 18143378, 'highest_point_m': 2460, 'tz_offset_minutes':  180, 'tz_iana': 'Africa/Mogadishu',    'gdp_usd':   10420000000, 'gdp_year': 2023},
    'SRB': {'capital': 'Belgrade',       'population':  7149000, 'highest_point_m': 2169, 'tz_offset_minutes':   60, 'tz_iana': 'Europe/Belgrade',     'gdp_usd':   75200000000, 'gdp_year': 2023},
    'SSD': {'capital': 'Juba',           'population': 11088000, 'highest_point_m': 3187, 'tz_offset_minutes':  120, 'tz_iana': 'Africa/Juba',         'gdp_usd':    6011000000, 'gdp_year': 2023},
    'STP': {'capital': 'São Tomé',       'population':   231856, 'highest_point_m': 2024, 'tz_offset_minutes':    0, 'tz_iana': 'Africa/Sao_Tome',     'gdp_usd':     652000000, 'gdp_year': 2023},
    'SUR': {'capital': 'Paramaribo',     'population':   623236, 'highest_point_m': 1230, 'tz_offset_minutes': -180, 'tz_iana': 'America/Paramaribo',  'gdp_usd':    3470000000, 'gdp_year': 2023},
    'SVK': {'capital': 'Bratislava',     'population':  5428792, 'highest_point_m': 2655, 'tz_offset_minutes':   60, 'tz_iana': 'Europe/Bratislava',   'gdp_usd':  127530000000, 'gdp_year': 2023},
    'SVN': {'capital': 'Ljubljana',      'population':  2116972, 'highest_point_m': 2864, 'tz_offset_minutes':   60, 'tz_iana': 'Europe/Ljubljana',    'gdp_usd':   68390000000, 'gdp_year': 2023},
    'SWE': {'capital': 'Stockholm',      'population': 10551707, 'highest_point_m': 2097, 'tz_offset_minutes':   60, 'tz_iana': 'Europe/Stockholm',    'gdp_usd':  599050000000, 'gdp_year': 2023},
    'SWZ': {'capital': 'Mbabane',        'population':  1210822, 'highest_point_m': 1862, 'tz_offset_minutes':  120, 'tz_iana': 'Africa/Mbabane',      'gdp_usd':    4860000000, 'gdp_year': 2023},
    'SYC': {'capital': 'Victoria',       'population':   119773, 'highest_point_m':  905, 'tz_offset_minutes':  240, 'tz_iana': 'Indian/Mahe',         'gdp_usd':    2100000000, 'gdp_year': 2023},
    'SYR': {'capital': 'Damascus',       'population': 23227014, 'highest_point_m': 2814, 'tz_offset_minutes':  180, 'tz_iana': 'Asia/Damascus',       'gdp_usd':    9000000000, 'gdp_year': 2023},
    'TCD': {'capital': "N'Djamena",      'population': 17723000, 'highest_point_m': 3415, 'tz_offset_minutes':   60, 'tz_iana': 'Africa/Ndjamena',     'gdp_usd':   18570000000, 'gdp_year': 2023},
    'TGO': {'capital': 'Lomé',           'population':  9054000, 'highest_point_m':  986, 'tz_offset_minutes':    0, 'tz_iana': 'Africa/Lome',         'gdp_usd':    9180000000, 'gdp_year': 2023},
    'THA': {'capital': 'Bangkok',        'population': 71801000, 'highest_point_m': 2565, 'tz_offset_minutes':  420, 'tz_iana': 'Asia/Bangkok',        'gdp_usd':  514950000000, 'gdp_year': 2023},
    'TJK': {'capital': 'Dushanbe',       'population': 10143000, 'highest_point_m': 7495, 'tz_offset_minutes':  300, 'tz_iana': 'Asia/Dushanbe',       'gdp_usd':   12060000000, 'gdp_year': 2023},
    'TKM': {'capital': 'Ashgabat',       'population':  6516000, 'highest_point_m': 3139, 'tz_offset_minutes':  300, 'tz_iana': 'Asia/Ashgabat',       'gdp_usd':   80820000000, 'gdp_year': 2023},
    'TLS': {'capital': 'Dili',           'population':  1360596, 'highest_point_m': 2963, 'tz_offset_minutes':  540, 'tz_iana': 'Asia/Dili',           'gdp_usd':    2050000000, 'gdp_year': 2023},
    'TON': {'capital': "Nuku'alofa",     'population':   107773, 'highest_point_m': 1033, 'tz_offset_minutes':  780, 'tz_iana': 'Pacific/Tongatapu',   'gdp_usd':     500000000, 'gdp_year': 2023},
    'TTO': {'capital': 'Port of Spain',  'population':  1534937, 'highest_point_m':  940, 'tz_offset_minutes': -240, 'tz_iana': 'America/Port_of_Spain','gdp_usd':   28925000000, 'gdp_year': 2023},
    'TUN': {'capital': 'Tunis',          'population': 12458000, 'highest_point_m': 1544, 'tz_offset_minutes':   60, 'tz_iana': 'Africa/Tunis',        'gdp_usd':   48530000000, 'gdp_year': 2023},
    'TUR': {'capital': 'Ankara',         'population': 85816000, 'highest_point_m': 5137, 'tz_offset_minutes':  180, 'tz_iana': 'Europe/Istanbul',     'gdp_usd': 1108000000000, 'gdp_year': 2023},
    'TUV': {'capital': 'Funafuti',       'population':    11396, 'highest_point_m':    5, 'tz_offset_minutes':  720, 'tz_iana': 'Pacific/Funafuti',    'gdp_usd':      63000000, 'gdp_year': 2023},
    'TWN': {'capital': 'Taipei',         'population': 23923276, 'highest_point_m': 3952, 'tz_offset_minutes':  480, 'tz_iana': 'Asia/Taipei',         'gdp_usd':  751930000000, 'gdp_year': 2023},
    'TZA': {'capital': 'Dodoma',         'population': 67438000, 'highest_point_m': 5895, 'tz_offset_minutes':  180, 'tz_iana': 'Africa/Dar_es_Salaam','gdp_usd':   84030000000, 'gdp_year': 2023},
    'UGA': {'capital': 'Kampala',        'population': 48582000, 'highest_point_m': 5109, 'tz_offset_minutes':  180, 'tz_iana': 'Africa/Kampala',      'gdp_usd':   48770000000, 'gdp_year': 2023},
    'UKR': {'capital': 'Kyiv',           'population': 36744000, 'highest_point_m': 2061, 'tz_offset_minutes':  120, 'tz_iana': 'Europe/Kyiv',         'gdp_usd':  178760000000, 'gdp_year': 2023},
    'URY': {'capital': 'Montevideo',     'population':  3423108, 'highest_point_m':  514, 'tz_offset_minutes': -180, 'tz_iana': 'America/Montevideo',  'gdp_usd':   77240000000, 'gdp_year': 2023},
    'USA': {'capital': 'Washington, D.C.','population':334915000, 'highest_point_m': 6190, 'tz_offset_minutes': -300, 'tz_iana': 'America/New_York',   'gdp_usd':27360940000000, 'gdp_year': 2023},
    'UZB': {'capital': 'Tashkent',       'population': 35648000, 'highest_point_m': 4643, 'tz_offset_minutes':  300, 'tz_iana': 'Asia/Tashkent',       'gdp_usd':   90880000000, 'gdp_year': 2023},
    'VAT': {'capital': 'Vatican City',   'population':      882, 'highest_point_m':   75, 'tz_offset_minutes':   60, 'tz_iana': 'Europe/Vatican',      'gdp_usd':      21000000, 'gdp_year': 2023},
    'VCT': {'capital': 'Kingstown',      'population':   103948, 'highest_point_m': 1234, 'tz_offset_minutes': -240, 'tz_iana': 'America/St_Vincent',  'gdp_usd':    1140000000, 'gdp_year': 2023},
    'VEN': {'capital': 'Caracas',        'population': 28838499, 'highest_point_m': 4978, 'tz_offset_minutes': -240, 'tz_iana': 'America/Caracas',     'gdp_usd':   92210000000, 'gdp_year': 2023},
    'VNM': {'capital': 'Hanoi',          'population': 98859000, 'highest_point_m': 3147, 'tz_offset_minutes':  420, 'tz_iana': 'Asia/Ho_Chi_Minh',    'gdp_usd':  430000000000, 'gdp_year': 2023},
    'VUT': {'capital': 'Port Vila',      'population':   334506, 'highest_point_m': 1879, 'tz_offset_minutes':  660, 'tz_iana': 'Pacific/Efate',       'gdp_usd':    1126000000, 'gdp_year': 2023},
    'WSM': {'capital': 'Apia',           'population':   225681, 'highest_point_m': 1858, 'tz_offset_minutes':  780, 'tz_iana': 'Pacific/Apia',        'gdp_usd':     933000000, 'gdp_year': 2023},
    'YEM': {'capital': 'Sanaá',          'population': 34449825, 'highest_point_m': 3666, 'tz_offset_minutes':  180, 'tz_iana': 'Asia/Aden',           'gdp_usd':   21810000000, 'gdp_year': 2023},
    'ZAF': {'capital': 'Pretoria',       'population': 60414000, 'highest_point_m': 3450, 'tz_offset_minutes':  120, 'tz_iana': 'Africa/Johannesburg', 'gdp_usd':  377780000000, 'gdp_year': 2023},
    'ZMB': {'capital': 'Lusaka',         'population': 20570000, 'highest_point_m': 2329, 'tz_offset_minutes':  120, 'tz_iana': 'Africa/Lusaka',       'gdp_usd':   27620000000, 'gdp_year': 2023},
    'ZWE': {'capital': 'Harare',         'population': 16665000, 'highest_point_m': 2592, 'tz_offset_minutes':  120, 'tz_iana': 'Africa/Harare',       'gdp_usd':   26350000000, 'gdp_year': 2023},
    # --- Common dependencies / territories (not UN member states) ---
    'ABW': {'capital': 'Oranjestad',     'population':   107566, 'highest_point_m':  188, 'tz_offset_minutes': -240, 'tz_iana': 'America/Aruba',       'gdp_usd':    3834729616, 'gdp_year': 2023},
    'AIA': {'capital': 'The Valley',     'population':    16243, 'highest_point_m':   73, 'tz_offset_minutes': -240, 'tz_iana': 'America/Anguilla',    'gdp_usd':     350000000, 'gdp_year': 2023},
    'ALA': {'capital': 'Mariehamn',      'population':    30344, 'highest_point_m':  129, 'tz_offset_minutes':  120, 'tz_iana': 'Europe/Mariehamn',    'gdp_usd':    1850000000, 'gdp_year': 2023},
    'ASM': {'capital': 'Pago Pago',      'population':    44620, 'highest_point_m':  964, 'tz_offset_minutes': -660, 'tz_iana': 'Pacific/Pago_Pago',   'gdp_usd':     709000000, 'gdp_year': 2023},
    'ATA': {'capital': '',               'population':     4400, 'highest_point_m': 4892, 'tz_offset_minutes':    0, 'tz_iana': 'Antarctica/McMurdo',  'gdp_usd':             0, 'gdp_year': 2023},
    'ATF': {'capital': 'Port-aux-Français','population':     150, 'highest_point_m': 1850, 'tz_offset_minutes':  300, 'tz_iana': 'Indian/Kerguelen',    'gdp_usd':             0, 'gdp_year': 2023},
    'BES': {'capital': 'Kralendijk',     'population':    27148, 'highest_point_m':  240, 'tz_offset_minutes': -240, 'tz_iana': 'America/Kralendijk',  'gdp_usd':     400000000, 'gdp_year': 2023},
    'BMU': {'capital': 'Hamilton',       'population':    63938, 'highest_point_m':   76, 'tz_offset_minutes': -240, 'tz_iana': 'Atlantic/Bermuda',    'gdp_usd':    7700000000, 'gdp_year': 2023},
    'BVT': {'capital': '',               'population':        0, 'highest_point_m':  780, 'tz_offset_minutes':    0, 'tz_iana': 'Etc/GMT',             'gdp_usd':             0, 'gdp_year': 2023},
    'CCK': {'capital': 'West Island',    'population':      596, 'highest_point_m':    5, 'tz_offset_minutes':  390, 'tz_iana': 'Indian/Cocos',        'gdp_usd':      32000000, 'gdp_year': 2023},
    'COK': {'capital': 'Avarua',         'population':    17564, 'highest_point_m':  652, 'tz_offset_minutes': -600, 'tz_iana': 'Pacific/Rarotonga',   'gdp_usd':     384000000, 'gdp_year': 2023},
    'CUW': {'capital': 'Willemstad',     'population':   190338, 'highest_point_m':  372, 'tz_offset_minutes': -240, 'tz_iana': 'America/Curacao',     'gdp_usd':    3550000000, 'gdp_year': 2023},
    'CXR': {'capital': 'Flying Fish Cove','population':    1843, 'highest_point_m':  361, 'tz_offset_minutes':  420, 'tz_iana': 'Indian/Christmas',    'gdp_usd':      32000000, 'gdp_year': 2023},
    'CYM': {'capital': 'George Town',    'population':    69310, 'highest_point_m':   43, 'tz_offset_minutes': -300, 'tz_iana': 'America/Cayman',      'gdp_usd':    7100000000, 'gdp_year': 2023},
    'ESH': {'capital': 'El Aaiún',       'population':   587000, 'highest_point_m':  805, 'tz_offset_minutes':    0, 'tz_iana': 'Africa/El_Aaiun',     'gdp_usd':     900000000, 'gdp_year': 2023},
    'FLK': {'capital': 'Stanley',        'population':     3470, 'highest_point_m':  705, 'tz_offset_minutes': -180, 'tz_iana': 'Atlantic/Stanley',    'gdp_usd':     264000000, 'gdp_year': 2023},
    'FRO': {'capital': 'Tórshavn',       'population':    54077, 'highest_point_m':  882, 'tz_offset_minutes':    0, 'tz_iana': 'Atlantic/Faroe',      'gdp_usd':    3370000000, 'gdp_year': 2023},
    'GGY': {'capital': 'Saint Peter Port','population':    63950, 'highest_point_m':  114, 'tz_offset_minutes':    0, 'tz_iana': 'Europe/Guernsey',     'gdp_usd':    3400000000, 'gdp_year': 2023},
    'GIB': {'capital': 'Gibraltar',      'population':    33701, 'highest_point_m':  426, 'tz_offset_minutes':   60, 'tz_iana': 'Europe/Gibraltar',    'gdp_usd':    3300000000, 'gdp_year': 2023},
    'GLP': {'capital': 'Basse-Terre',    'population':   395700, 'highest_point_m': 1467, 'tz_offset_minutes': -240, 'tz_iana': 'America/Guadeloupe',  'gdp_usd':    9870000000, 'gdp_year': 2023},
    'GRL': {'capital': 'Nuuk',           'population':    56583, 'highest_point_m': 3694, 'tz_offset_minutes': -120, 'tz_iana': 'America/Nuuk',        'gdp_usd':    3160000000, 'gdp_year': 2023},
    'GUF': {'capital': 'Cayenne',        'population':   294071, 'highest_point_m':  851, 'tz_offset_minutes': -180, 'tz_iana': 'America/Cayenne',     'gdp_usd':    5230000000, 'gdp_year': 2023},
    'GUM': {'capital': 'Hagåtña',        'population':   168801, 'highest_point_m':  406, 'tz_offset_minutes':  600, 'tz_iana': 'Pacific/Guam',        'gdp_usd':    6360000000, 'gdp_year': 2023},
    'HKG': {'capital': 'Hong Kong',      'population':  7491609, 'highest_point_m':  957, 'tz_offset_minutes':  480, 'tz_iana': 'Asia/Hong_Kong',      'gdp_usd':  382000000000, 'gdp_year': 2023},
    'HMD': {'capital': '',               'population':        0, 'highest_point_m': 2745, 'tz_offset_minutes':  300, 'tz_iana': 'Indian/Kerguelen',    'gdp_usd':             0, 'gdp_year': 2023},
    'IMN': {'capital': 'Douglas',        'population':    84710, 'highest_point_m':  621, 'tz_offset_minutes':    0, 'tz_iana': 'Europe/Isle_of_Man',  'gdp_usd':    6800000000, 'gdp_year': 2023},
    'IOT': {'capital': 'Diego Garcia',   'population':     3000, 'highest_point_m':   15, 'tz_offset_minutes':  360, 'tz_iana': 'Indian/Chagos',       'gdp_usd':             0, 'gdp_year': 2023},
    'JEY': {'capital': 'Saint Helier',   'population':   100800, 'highest_point_m':  136, 'tz_offset_minutes':    0, 'tz_iana': 'Europe/Jersey',       'gdp_usd':    6300000000, 'gdp_year': 2023},
    'MAC': {'capital': 'Macao',          'population':   704149, 'highest_point_m':  170, 'tz_offset_minutes':  480, 'tz_iana': 'Asia/Macau',          'gdp_usd':   47710000000, 'gdp_year': 2023},
    'MAF': {'capital': 'Marigot',        'population':    38659, 'highest_point_m':  424, 'tz_offset_minutes': -240, 'tz_iana': 'America/Marigot',     'gdp_usd':     600000000, 'gdp_year': 2023},
    'MNP': {'capital': 'Saipan',         'population':    47329, 'highest_point_m':  965, 'tz_offset_minutes':  600, 'tz_iana': 'Pacific/Saipan',      'gdp_usd':    1180000000, 'gdp_year': 2023},
    'MSR': {'capital': 'Brades',         'population':     4390, 'highest_point_m':  930, 'tz_offset_minutes': -240, 'tz_iana': 'America/Montserrat',  'gdp_usd':      75000000, 'gdp_year': 2023},
    'MTQ': {'capital': 'Fort-de-France', 'population':   362508, 'highest_point_m': 1397, 'tz_offset_minutes': -240, 'tz_iana': 'America/Martinique',  'gdp_usd':    9290000000, 'gdp_year': 2023},
    'MYT': {'capital': 'Mamoudzou',      'population':   299500, 'highest_point_m':  660, 'tz_offset_minutes':  180, 'tz_iana': 'Indian/Mayotte',      'gdp_usd':    2840000000, 'gdp_year': 2023},
    'NCL': {'capital': 'Nouméa',         'population':   271407, 'highest_point_m': 1628, 'tz_offset_minutes':  660, 'tz_iana': 'Pacific/Noumea',      'gdp_usd':    9450000000, 'gdp_year': 2023},
    'NFK': {'capital': 'Kingston',       'population':     2188, 'highest_point_m':  319, 'tz_offset_minutes':  660, 'tz_iana': 'Pacific/Norfolk',     'gdp_usd':      36000000, 'gdp_year': 2023},
    'NIU': {'capital': 'Alofi',          'population':     1934, 'highest_point_m':   91, 'tz_offset_minutes': -660, 'tz_iana': 'Pacific/Niue',        'gdp_usd':      10000000, 'gdp_year': 2023},
    'PCN': {'capital': 'Adamstown',      'population':       47, 'highest_point_m':  347, 'tz_offset_minutes': -480, 'tz_iana': 'Pacific/Pitcairn',   'gdp_usd':       3000000, 'gdp_year': 2023},
    'PRI': {'capital': 'San Juan',       'population':  3260314, 'highest_point_m': 1338, 'tz_offset_minutes': -240, 'tz_iana': 'America/Puerto_Rico', 'gdp_usd':  117902000000, 'gdp_year': 2023},
    'PYF': {'capital': 'Papeete',        'population':   299356, 'highest_point_m': 2241, 'tz_offset_minutes': -600, 'tz_iana': 'Pacific/Tahiti',      'gdp_usd':    6080000000, 'gdp_year': 2023},
    'REU': {'capital': 'Saint-Denis',    'population':   871157, 'highest_point_m': 3070, 'tz_offset_minutes':  240, 'tz_iana': 'Indian/Reunion',      'gdp_usd':   23700000000, 'gdp_year': 2023},
    'SGS': {'capital': 'King Edward Point','population':      30, 'highest_point_m': 2934, 'tz_offset_minutes': -120, 'tz_iana': 'Atlantic/South_Georgia', 'gdp_usd':         0, 'gdp_year': 2023},
    'SHN': {'capital': 'Jamestown',      'population':     5314, 'highest_point_m':  823, 'tz_offset_minutes':    0, 'tz_iana': 'Atlantic/St_Helena',  'gdp_usd':      45000000, 'gdp_year': 2023},
    'SJM': {'capital': 'Longyearbyen',   'population':     2939, 'highest_point_m': 1717, 'tz_offset_minutes':   60, 'tz_iana': 'Arctic/Longyearbyen', 'gdp_usd':     400000000, 'gdp_year': 2023},
    'SPM': {'capital': 'Saint-Pierre',   'population':     5819, 'highest_point_m':  240, 'tz_offset_minutes': -180, 'tz_iana': 'America/Miquelon',    'gdp_usd':     261000000, 'gdp_year': 2023},
    'SXM': {'capital': 'Philipsburg',    'population':    41109, 'highest_point_m':  424, 'tz_offset_minutes': -240, 'tz_iana': 'America/Lower_Princes','gdp_usd':    1530000000, 'gdp_year': 2023},
    'TCA': {'capital': 'Cockburn Town',  'population':    45114, 'highest_point_m':   49, 'tz_offset_minutes': -300, 'tz_iana': 'America/Grand_Turk',  'gdp_usd':    1140000000, 'gdp_year': 2023},
    'TKL': {'capital': 'Nukunonu',       'population':     1647, 'highest_point_m':    5, 'tz_offset_minutes':  780, 'tz_iana': 'Pacific/Fakaofo',     'gdp_usd':       8000000, 'gdp_year': 2023},
    'UMI': {'capital': '',               'population':      300, 'highest_point_m':   10, 'tz_offset_minutes':  720, 'tz_iana': 'Pacific/Wake',        'gdp_usd':             0, 'gdp_year': 2023},
    'VGB': {'capital': 'Road Town',      'population':    31538, 'highest_point_m':  521, 'tz_offset_minutes': -240, 'tz_iana': 'America/Tortola',     'gdp_usd':    1150000000, 'gdp_year': 2023},
    'VIR': {'capital': 'Charlotte Amalie','population':   105870, 'highest_point_m':  474, 'tz_offset_minutes': -240, 'tz_iana': 'America/St_Thomas',   'gdp_usd':    4400000000, 'gdp_year': 2023},
    'WLF': {'capital': 'Mata-Utu',       'population':    11369, 'highest_point_m':  765, 'tz_offset_minutes':  720, 'tz_iana': 'Pacific/Wallis',      'gdp_usd':     195000000, 'gdp_year': 2023},
    # --- Non-standard / disputed ISO codes used by Natural Earth ---
    'BLM': {'capital': 'Gustavia',       'population':     7122, 'highest_point_m':  286, 'tz_offset_minutes': -240, 'tz_iana': 'America/St_Barthelemy','gdp_usd':     255000000, 'gdp_year': 2023},
    'KOS': {'capital': 'Pristina',       'population':  1622000, 'highest_point_m': 2656, 'tz_offset_minutes':   60, 'tz_iana': 'Europe/Belgrade',     'gdp_usd':    9990000000, 'gdp_year': 2023},
    'NCY': {'capital': 'North Nicosia',  'population':   382000, 'highest_point_m': 1024, 'tz_offset_minutes':  180, 'tz_iana': 'Asia/Nicosia',        'gdp_usd':    4940000000, 'gdp_year': 2023},
    'SML': {'capital': 'Hargeisa',       'population':  5700000, 'highest_point_m': 2416, 'tz_offset_minutes':  180, 'tz_iana': 'Africa/Mogadishu',    'gdp_usd':    2530000000, 'gdp_year': 2023},
}


# Additional country attributes added in a later pass (currency, official
# language, total area). Stored separately so the original COUNTRY_DATA block
# above stays diff-friendly. Values are merged into COUNTRY_DATA below at
# module-load time, and `area_acres` is auto-derived from `area_km2`.
COUNTRY_EXTRA: dict[str, dict[str, Any]] = {
    # --- UN member states ---
    'AFG': {'currency': 'Afghan Afghani (AFN)',          'language': 'Pashto',              'area_km2':   652864},
    'AGO': {'currency': 'Angolan Kwanza (AOA)',          'language': 'Portuguese',          'area_km2':  1246700},
    'ALB': {'currency': 'Albanian Lek (ALL)',            'language': 'Albanian',            'area_km2':    28748},
    'AND': {'currency': 'Euro (EUR)',                    'language': 'Catalan',             'area_km2':      468},
    'ARE': {'currency': 'UAE Dirham (AED)',              'language': 'Arabic',              'area_km2':    83600},
    'ARG': {'currency': 'Argentine Peso (ARS)',          'language': 'Spanish',             'area_km2':  2780400},
    'ARM': {'currency': 'Armenian Dram (AMD)',           'language': 'Armenian',            'area_km2':    29743},
    'ATG': {'currency': 'East Caribbean Dollar (XCD)',   'language': 'English',             'area_km2':      442},
    'AUS': {'currency': 'Australian Dollar (AUD)',       'language': 'English',             'area_km2':  7692024},
    'AUT': {'currency': 'Euro (EUR)',                    'language': 'German',              'area_km2':    83879},
    'AZE': {'currency': 'Azerbaijani Manat (AZN)',       'language': 'Azerbaijani',         'area_km2':    86600},
    'BDI': {'currency': 'Burundian Franc (BIF)',         'language': 'Kirundi',             'area_km2':    27834},
    'BEL': {'currency': 'Euro (EUR)',                    'language': 'Dutch',               'area_km2':    30528},
    'BEN': {'currency': 'West African CFA Franc (XOF)',  'language': 'French',              'area_km2':   114763},
    'BFA': {'currency': 'West African CFA Franc (XOF)',  'language': 'French',              'area_km2':   272967},
    'BGD': {'currency': 'Bangladeshi Taka (BDT)',        'language': 'Bengali',             'area_km2':   147570},
    'BGR': {'currency': 'Bulgarian Lev (BGN)',           'language': 'Bulgarian',           'area_km2':   110879},
    'BHR': {'currency': 'Bahraini Dinar (BHD)',          'language': 'Arabic',              'area_km2':      786},
    'BHS': {'currency': 'Bahamian Dollar (BSD)',         'language': 'English',             'area_km2':    13943},
    'BIH': {'currency': 'Bosnia Convertible Mark (BAM)', 'language': 'Bosnian',             'area_km2':    51197},
    'BLR': {'currency': 'Belarusian Ruble (BYN)',        'language': 'Belarusian',          'area_km2':   207600},
    'BLZ': {'currency': 'Belize Dollar (BZD)',           'language': 'English',             'area_km2':    22966},
    'BOL': {'currency': 'Bolivian Boliviano (BOB)',      'language': 'Spanish',             'area_km2':  1098581},
    'BRA': {'currency': 'Brazilian Real (BRL)',          'language': 'Portuguese',          'area_km2':  8515767},
    'BRB': {'currency': 'Barbadian Dollar (BBD)',        'language': 'English',             'area_km2':      430},
    'BRN': {'currency': 'Brunei Dollar (BND)',           'language': 'Malay',               'area_km2':     5765},
    'BTN': {'currency': 'Bhutanese Ngultrum (BTN)',      'language': 'Dzongkha',            'area_km2':    38394},
    'BWA': {'currency': 'Botswana Pula (BWP)',           'language': 'English',             'area_km2':   582000},
    'CAF': {'currency': 'Central African CFA Franc (XAF)','language': 'French',             'area_km2':   622984},
    'CAN': {'currency': 'Canadian Dollar (CAD)',         'language': 'English',             'area_km2':  9984670},
    'CHE': {'currency': 'Swiss Franc (CHF)',             'language': 'German',              'area_km2':    41285},
    'CHL': {'currency': 'Chilean Peso (CLP)',            'language': 'Spanish',             'area_km2':   756102},
    'CHN': {'currency': 'Chinese Yuan Renminbi (CNY)',   'language': 'Mandarin Chinese',    'area_km2':  9596961},
    'CIV': {'currency': 'West African CFA Franc (XOF)',  'language': 'French',              'area_km2':   322463},
    'CMR': {'currency': 'Central African CFA Franc (XAF)','language': 'French',             'area_km2':   475442},
    'COD': {'currency': 'Congolese Franc (CDF)',         'language': 'French',              'area_km2':  2344858},
    'COG': {'currency': 'Central African CFA Franc (XAF)','language': 'French',             'area_km2':   342000},
    'COL': {'currency': 'Colombian Peso (COP)',          'language': 'Spanish',             'area_km2':  1141748},
    'COM': {'currency': 'Comorian Franc (KMF)',          'language': 'Comorian',            'area_km2':     1862},
    'CPV': {'currency': 'Cape Verdean Escudo (CVE)',     'language': 'Portuguese',          'area_km2':     4033},
    'CRI': {'currency': 'Costa Rican Colón (CRC)',       'language': 'Spanish',             'area_km2':    51100},
    'CUB': {'currency': 'Cuban Peso (CUP)',              'language': 'Spanish',             'area_km2':   109884},
    'CYP': {'currency': 'Euro (EUR)',                    'language': 'Greek',               'area_km2':     9251},
    'CZE': {'currency': 'Czech Koruna (CZK)',            'language': 'Czech',               'area_km2':    78867},
    'DEU': {'currency': 'Euro (EUR)',                    'language': 'German',              'area_km2':   357114},
    'DJI': {'currency': 'Djiboutian Franc (DJF)',        'language': 'French',              'area_km2':    23200},
    'DMA': {'currency': 'East Caribbean Dollar (XCD)',   'language': 'English',             'area_km2':      750},
    'DNK': {'currency': 'Danish Krone (DKK)',            'language': 'Danish',              'area_km2':    43094},
    'DOM': {'currency': 'Dominican Peso (DOP)',          'language': 'Spanish',             'area_km2':    48671},
    'DZA': {'currency': 'Algerian Dinar (DZD)',          'language': 'Arabic',              'area_km2':  2381741},
    'ECU': {'currency': 'US Dollar (USD)',               'language': 'Spanish',             'area_km2':   283561},
    'EGY': {'currency': 'Egyptian Pound (EGP)',          'language': 'Arabic',              'area_km2':  1002450},
    'ERI': {'currency': 'Eritrean Nakfa (ERN)',          'language': 'Tigrinya',            'area_km2':   117600},
    'ESP': {'currency': 'Euro (EUR)',                    'language': 'Spanish',             'area_km2':   505992},
    'EST': {'currency': 'Euro (EUR)',                    'language': 'Estonian',            'area_km2':    45339},
    'ETH': {'currency': 'Ethiopian Birr (ETB)',          'language': 'Amharic',             'area_km2':  1104300},
    'FIN': {'currency': 'Euro (EUR)',                    'language': 'Finnish',             'area_km2':   338424},
    'FJI': {'currency': 'Fijian Dollar (FJD)',           'language': 'English',             'area_km2':    18272},
    'FRA': {'currency': 'Euro (EUR)',                    'language': 'French',              'area_km2':   643801},
    'FSM': {'currency': 'US Dollar (USD)',               'language': 'English',             'area_km2':      702},
    'GAB': {'currency': 'Central African CFA Franc (XAF)','language': 'French',             'area_km2':   267668},
    'GBR': {'currency': 'Pound Sterling (GBP)',          'language': 'English',             'area_km2':   243610},
    'GEO': {'currency': 'Georgian Lari (GEL)',           'language': 'Georgian',            'area_km2':    69700},
    'GHA': {'currency': 'Ghanaian Cedi (GHS)',           'language': 'English',             'area_km2':   238533},
    'GIN': {'currency': 'Guinean Franc (GNF)',           'language': 'French',              'area_km2':   245857},
    'GMB': {'currency': 'Gambian Dalasi (GMD)',          'language': 'English',             'area_km2':    10689},
    'GNB': {'currency': 'West African CFA Franc (XOF)',  'language': 'Portuguese',          'area_km2':    36125},
    'GNQ': {'currency': 'Central African CFA Franc (XAF)','language': 'Spanish',            'area_km2':    28051},
    'GRC': {'currency': 'Euro (EUR)',                    'language': 'Greek',               'area_km2':   131957},
    'GRD': {'currency': 'East Caribbean Dollar (XCD)',   'language': 'English',             'area_km2':      344},
    'GTM': {'currency': 'Guatemalan Quetzal (GTQ)',      'language': 'Spanish',             'area_km2':   108889},
    'GUY': {'currency': 'Guyanese Dollar (GYD)',         'language': 'English',             'area_km2':   214969},
    'HND': {'currency': 'Honduran Lempira (HNL)',        'language': 'Spanish',             'area_km2':   112492},
    'HRV': {'currency': 'Euro (EUR)',                    'language': 'Croatian',            'area_km2':    56594},
    'HTI': {'currency': 'Haitian Gourde (HTG)',          'language': 'French',              'area_km2':    27750},
    'HUN': {'currency': 'Hungarian Forint (HUF)',        'language': 'Hungarian',           'area_km2':    93028},
    'IDN': {'currency': 'Indonesian Rupiah (IDR)',       'language': 'Indonesian',          'area_km2':  1904569},
    'IND': {'currency': 'Indian Rupee (INR)',            'language': 'Hindi',               'area_km2':  3287263},
    'IRL': {'currency': 'Euro (EUR)',                    'language': 'English',             'area_km2':    70273},
    'IRN': {'currency': 'Iranian Rial (IRR)',            'language': 'Persian',             'area_km2':  1648195},
    'IRQ': {'currency': 'Iraqi Dinar (IQD)',             'language': 'Arabic',              'area_km2':   438317},
    'ISL': {'currency': 'Icelandic Króna (ISK)',         'language': 'Icelandic',           'area_km2':   103000},
    'ISR': {'currency': 'Israeli New Shekel (ILS)',      'language': 'Hebrew',              'area_km2':    20770},
    'ITA': {'currency': 'Euro (EUR)',                    'language': 'Italian',             'area_km2':   301340},
    'JAM': {'currency': 'Jamaican Dollar (JMD)',         'language': 'English',             'area_km2':    10991},
    'JOR': {'currency': 'Jordanian Dinar (JOD)',         'language': 'Arabic',              'area_km2':    89342},
    'JPN': {'currency': 'Japanese Yen (JPY)',            'language': 'Japanese',            'area_km2':   377975},
    'KAZ': {'currency': 'Kazakhstani Tenge (KZT)',       'language': 'Kazakh',              'area_km2':  2724900},
    'KEN': {'currency': 'Kenyan Shilling (KES)',         'language': 'Swahili',             'area_km2':   580367},
    'KGZ': {'currency': 'Kyrgyzstani Som (KGS)',         'language': 'Kyrgyz',              'area_km2':   199951},
    'KHM': {'currency': 'Cambodian Riel (KHR)',          'language': 'Khmer',               'area_km2':   181035},
    'KIR': {'currency': 'Australian Dollar (AUD)',       'language': 'English',             'area_km2':      811},
    'KNA': {'currency': 'East Caribbean Dollar (XCD)',   'language': 'English',             'area_km2':      261},
    'KOR': {'currency': 'South Korean Won (KRW)',        'language': 'Korean',              'area_km2':   100210},
    'KWT': {'currency': 'Kuwaiti Dinar (KWD)',           'language': 'Arabic',              'area_km2':    17818},
    'LAO': {'currency': 'Lao Kip (LAK)',                 'language': 'Lao',                 'area_km2':   236800},
    'LBN': {'currency': 'Lebanese Pound (LBP)',          'language': 'Arabic',              'area_km2':    10452},
    'LBR': {'currency': 'Liberian Dollar (LRD)',         'language': 'English',             'area_km2':   111369},
    'LBY': {'currency': 'Libyan Dinar (LYD)',            'language': 'Arabic',              'area_km2':  1759540},
    'LCA': {'currency': 'East Caribbean Dollar (XCD)',   'language': 'English',             'area_km2':      617},
    'LIE': {'currency': 'Swiss Franc (CHF)',             'language': 'German',              'area_km2':      160},
    'LKA': {'currency': 'Sri Lankan Rupee (LKR)',        'language': 'Sinhala',             'area_km2':    65610},
    'LSO': {'currency': 'Lesotho Loti (LSL)',            'language': 'Sesotho',             'area_km2':    30355},
    'LTU': {'currency': 'Euro (EUR)',                    'language': 'Lithuanian',          'area_km2':    65300},
    'LUX': {'currency': 'Euro (EUR)',                    'language': 'Luxembourgish',       'area_km2':     2586},
    'LVA': {'currency': 'Euro (EUR)',                    'language': 'Latvian',             'area_km2':    64589},
    'MAR': {'currency': 'Moroccan Dirham (MAD)',         'language': 'Arabic',              'area_km2':   446550},
    'MCO': {'currency': 'Euro (EUR)',                    'language': 'French',              'area_km2':        2},
    'MDA': {'currency': 'Moldovan Leu (MDL)',            'language': 'Romanian',            'area_km2':    33846},
    'MDG': {'currency': 'Malagasy Ariary (MGA)',         'language': 'Malagasy',            'area_km2':   587041},
    'MDV': {'currency': 'Maldivian Rufiyaa (MVR)',       'language': 'Dhivehi',             'area_km2':      298},
    'MEX': {'currency': 'Mexican Peso (MXN)',            'language': 'Spanish',             'area_km2':  1964375},
    'MHL': {'currency': 'US Dollar (USD)',               'language': 'Marshallese',         'area_km2':      181},
    'MKD': {'currency': 'Macedonian Denar (MKD)',        'language': 'Macedonian',          'area_km2':    25713},
    'MLI': {'currency': 'West African CFA Franc (XOF)',  'language': 'French',              'area_km2':  1240192},
    'MLT': {'currency': 'Euro (EUR)',                    'language': 'Maltese',             'area_km2':      316},
    'MMR': {'currency': 'Burmese Kyat (MMK)',            'language': 'Burmese',             'area_km2':   676578},
    'MNE': {'currency': 'Euro (EUR)',                    'language': 'Montenegrin',         'area_km2':    13812},
    'MNG': {'currency': 'Mongolian Tögrög (MNT)',        'language': 'Mongolian',           'area_km2':  1564110},
    'MOZ': {'currency': 'Mozambican Metical (MZN)',      'language': 'Portuguese',          'area_km2':   801590},
    'MRT': {'currency': 'Mauritanian Ouguiya (MRU)',     'language': 'Arabic',              'area_km2':  1030700},
    'MUS': {'currency': 'Mauritian Rupee (MUR)',         'language': 'English',             'area_km2':     2040},
    'MWI': {'currency': 'Malawian Kwacha (MWK)',         'language': 'English',             'area_km2':   118484},
    'MYS': {'currency': 'Malaysian Ringgit (MYR)',       'language': 'Malay',               'area_km2':   330803},
    'NAM': {'currency': 'Namibian Dollar (NAD)',         'language': 'English',             'area_km2':   825615},
    'NER': {'currency': 'West African CFA Franc (XOF)',  'language': 'French',              'area_km2':  1267000},
    'NGA': {'currency': 'Nigerian Naira (NGN)',          'language': 'English',             'area_km2':   923768},
    'NIC': {'currency': 'Nicaraguan Córdoba (NIO)',      'language': 'Spanish',             'area_km2':   130373},
    'NLD': {'currency': 'Euro (EUR)',                    'language': 'Dutch',               'area_km2':    41850},
    'NOR': {'currency': 'Norwegian Krone (NOK)',         'language': 'Norwegian',           'area_km2':   385207},
    'NPL': {'currency': 'Nepalese Rupee (NPR)',          'language': 'Nepali',              'area_km2':   147181},
    'NRU': {'currency': 'Australian Dollar (AUD)',       'language': 'Nauruan',             'area_km2':       21},
    'NZL': {'currency': 'New Zealand Dollar (NZD)',      'language': 'English',             'area_km2':   268838},
    'OMN': {'currency': 'Omani Rial (OMR)',              'language': 'Arabic',              'area_km2':   309500},
    'PAK': {'currency': 'Pakistani Rupee (PKR)',         'language': 'Urdu',                'area_km2':   881913},
    'PAN': {'currency': 'Panamanian Balboa (PAB)',       'language': 'Spanish',             'area_km2':    75417},
    'PER': {'currency': 'Peruvian Sol (PEN)',            'language': 'Spanish',             'area_km2':  1285216},
    'PHL': {'currency': 'Philippine Peso (PHP)',         'language': 'Filipino',            'area_km2':   300000},
    'PLW': {'currency': 'US Dollar (USD)',               'language': 'Palauan',             'area_km2':      459},
    'PNG': {'currency': 'Papua New Guinean Kina (PGK)',  'language': 'English',             'area_km2':   462840},
    'POL': {'currency': 'Polish Złoty (PLN)',            'language': 'Polish',              'area_km2':   312696},
    'PRK': {'currency': 'North Korean Won (KPW)',        'language': 'Korean',              'area_km2':   120538},
    'PRT': {'currency': 'Euro (EUR)',                    'language': 'Portuguese',          'area_km2':    92090},
    'PRY': {'currency': 'Paraguayan Guaraní (PYG)',      'language': 'Spanish',             'area_km2':   406752},
    'PSE': {'currency': 'Israeli New Shekel (ILS)',      'language': 'Arabic',              'area_km2':     6020},
    'QAT': {'currency': 'Qatari Riyal (QAR)',            'language': 'Arabic',              'area_km2':    11586},
    'ROU': {'currency': 'Romanian Leu (RON)',            'language': 'Romanian',            'area_km2':   238397},
    'RUS': {'currency': 'Russian Ruble (RUB)',           'language': 'Russian',             'area_km2': 17098246},
    'RWA': {'currency': 'Rwandan Franc (RWF)',           'language': 'Kinyarwanda',         'area_km2':    26338},
    'SAU': {'currency': 'Saudi Riyal (SAR)',             'language': 'Arabic',              'area_km2':  2149690},
    'SDN': {'currency': 'Sudanese Pound (SDG)',          'language': 'Arabic',              'area_km2':  1861484},
    'SEN': {'currency': 'West African CFA Franc (XOF)',  'language': 'French',              'area_km2':   196722},
    'SGP': {'currency': 'Singapore Dollar (SGD)',        'language': 'English',             'area_km2':      728},
    'SLB': {'currency': 'Solomon Islands Dollar (SBD)',  'language': 'English',             'area_km2':    28896},
    'SLE': {'currency': 'Sierra Leonean Leone (SLL)',    'language': 'English',             'area_km2':    71740},
    'SLV': {'currency': 'US Dollar (USD)',               'language': 'Spanish',             'area_km2':    21041},
    'SMR': {'currency': 'Euro (EUR)',                    'language': 'Italian',             'area_km2':       61},
    'SOM': {'currency': 'Somali Shilling (SOS)',         'language': 'Somali',              'area_km2':   637657},
    'SRB': {'currency': 'Serbian Dinar (RSD)',           'language': 'Serbian',             'area_km2':    88361},
    'SSD': {'currency': 'South Sudanese Pound (SSP)',    'language': 'English',             'area_km2':   644329},
    'STP': {'currency': 'São Tomé Dobra (STN)',          'language': 'Portuguese',          'area_km2':      964},
    'SUR': {'currency': 'Surinamese Dollar (SRD)',       'language': 'Dutch',               'area_km2':   163820},
    'SVK': {'currency': 'Euro (EUR)',                    'language': 'Slovak',              'area_km2':    49035},
    'SVN': {'currency': 'Euro (EUR)',                    'language': 'Slovenian',           'area_km2':    20273},
    'SWE': {'currency': 'Swedish Krona (SEK)',           'language': 'Swedish',             'area_km2':   450295},
    'SWZ': {'currency': 'Swazi Lilangeni (SZL)',         'language': 'Swazi',               'area_km2':    17364},
    'SYC': {'currency': 'Seychellois Rupee (SCR)',       'language': 'English',             'area_km2':      452},
    'SYR': {'currency': 'Syrian Pound (SYP)',            'language': 'Arabic',              'area_km2':   185180},
    'TCD': {'currency': 'Central African CFA Franc (XAF)','language': 'French',             'area_km2':  1284000},
    'TGO': {'currency': 'West African CFA Franc (XOF)',  'language': 'French',              'area_km2':    56785},
    'THA': {'currency': 'Thai Baht (THB)',               'language': 'Thai',                'area_km2':   513120},
    'TJK': {'currency': 'Tajikistani Somoni (TJS)',      'language': 'Tajik',               'area_km2':   143100},
    'TKM': {'currency': 'Turkmenistan Manat (TMT)',      'language': 'Turkmen',             'area_km2':   488100},
    'TLS': {'currency': 'US Dollar (USD)',               'language': 'Portuguese',          'area_km2':    14874},
    'TON': {'currency': 'Tongan Paʻanga (TOP)',          'language': 'Tongan',              'area_km2':      747},
    'TTO': {'currency': 'Trinidad & Tobago Dollar (TTD)','language': 'English',             'area_km2':     5130},
    'TUN': {'currency': 'Tunisian Dinar (TND)',          'language': 'Arabic',              'area_km2':   163610},
    'TUR': {'currency': 'Turkish Lira (TRY)',            'language': 'Turkish',             'area_km2':   783562},
    'TUV': {'currency': 'Australian Dollar (AUD)',       'language': 'Tuvaluan',            'area_km2':       26},
    'TWN': {'currency': 'New Taiwan Dollar (TWD)',       'language': 'Mandarin Chinese',    'area_km2':    36193},
    'TZA': {'currency': 'Tanzanian Shilling (TZS)',      'language': 'Swahili',             'area_km2':   945087},
    'UGA': {'currency': 'Ugandan Shilling (UGX)',        'language': 'English',             'area_km2':   241550},
    'UKR': {'currency': 'Ukrainian Hryvnia (UAH)',       'language': 'Ukrainian',           'area_km2':   603550},
    'URY': {'currency': 'Uruguayan Peso (UYU)',          'language': 'Spanish',             'area_km2':   181034},
    'USA': {'currency': 'US Dollar (USD)',               'language': 'English',             'area_km2':  9833517},
    'UZB': {'currency': 'Uzbekistani Som (UZS)',         'language': 'Uzbek',               'area_km2':   447400},
    'VAT': {'currency': 'Euro (EUR)',                    'language': 'Italian',             'area_km2':     0.49},
    'VCT': {'currency': 'East Caribbean Dollar (XCD)',   'language': 'English',             'area_km2':      389},
    'VEN': {'currency': 'Venezuelan Bolívar (VES)',      'language': 'Spanish',             'area_km2':   916445},
    'VNM': {'currency': 'Vietnamese Đồng (VND)',         'language': 'Vietnamese',          'area_km2':   331212},
    'VUT': {'currency': 'Vanuatu Vatu (VUV)',            'language': 'Bislama',             'area_km2':    12189},
    'WSM': {'currency': 'Samoan Tālā (WST)',             'language': 'Samoan',              'area_km2':     2842},
    'YEM': {'currency': 'Yemeni Rial (YER)',             'language': 'Arabic',              'area_km2':   527968},
    'ZAF': {'currency': 'South African Rand (ZAR)',      'language': 'Zulu',                'area_km2':  1221037},
    'ZMB': {'currency': 'Zambian Kwacha (ZMW)',          'language': 'English',             'area_km2':   752612},
    'ZWE': {'currency': 'Zimbabwean Dollar (ZWL)',       'language': 'English',             'area_km2':   390757},
    # --- Common dependencies / territories ---
    'ABW': {'currency': 'Aruban Florin (AWG)',           'language': 'Dutch',               'area_km2':      180},
    'AIA': {'currency': 'East Caribbean Dollar (XCD)',   'language': 'English',             'area_km2':       91},
    'ALA': {'currency': 'Euro (EUR)',                    'language': 'Swedish',             'area_km2':     1580},
    'ASM': {'currency': 'US Dollar (USD)',               'language': 'Samoan',              'area_km2':      199},
    'ATA': {'currency': 'None',                          'language': 'None',                'area_km2': 14000000},
    'ATF': {'currency': 'Euro (EUR)',                    'language': 'French',              'area_km2':     7747},
    'BES': {'currency': 'US Dollar (USD)',               'language': 'Dutch',               'area_km2':      328},
    'BMU': {'currency': 'Bermudian Dollar (BMD)',        'language': 'English',             'area_km2':       54},
    'BVT': {'currency': 'Norwegian Krone (NOK)',         'language': 'None',                'area_km2':       49},
    'CCK': {'currency': 'Australian Dollar (AUD)',       'language': 'English',             'area_km2':       14},
    'COK': {'currency': 'New Zealand Dollar (NZD)',      'language': 'English',             'area_km2':      237},
    'CUW': {'currency': 'Caribbean Guilder (XCG)',       'language': 'Dutch',               'area_km2':      444},
    'CXR': {'currency': 'Australian Dollar (AUD)',       'language': 'English',             'area_km2':      135},
    'CYM': {'currency': 'Cayman Islands Dollar (KYD)',   'language': 'English',             'area_km2':      264},
    'ESH': {'currency': 'Moroccan Dirham (MAD)',         'language': 'Arabic',              'area_km2':   266000},
    'FLK': {'currency': 'Falkland Islands Pound (FKP)',  'language': 'English',             'area_km2':    12173},
    'FRO': {'currency': 'Faroese Króna (FOK)',           'language': 'Faroese',             'area_km2':     1393},
    'GGY': {'currency': 'Guernsey Pound (GGP)',          'language': 'English',             'area_km2':       65},
    'GIB': {'currency': 'Gibraltar Pound (GIP)',         'language': 'English',             'area_km2':        7},
    'GLP': {'currency': 'Euro (EUR)',                    'language': 'French',              'area_km2':     1628},
    'GRL': {'currency': 'Danish Krone (DKK)',            'language': 'Greenlandic',         'area_km2':  2166086},
    'GUF': {'currency': 'Euro (EUR)',                    'language': 'French',              'area_km2':    83534},
    'GUM': {'currency': 'US Dollar (USD)',               'language': 'English',             'area_km2':      544},
    'HKG': {'currency': 'Hong Kong Dollar (HKD)',        'language': 'Cantonese Chinese',   'area_km2':     1106},
    'HMD': {'currency': 'Australian Dollar (AUD)',       'language': 'None',                'area_km2':      412},
    'IMN': {'currency': 'Manx Pound (IMP)',              'language': 'English',             'area_km2':      572},
    'IOT': {'currency': 'US Dollar (USD)',               'language': 'English',             'area_km2':       60},
    'JEY': {'currency': 'Jersey Pound (JEP)',            'language': 'English',             'area_km2':      116},
    'MAC': {'currency': 'Macanese Pataca (MOP)',         'language': 'Cantonese Chinese',   'area_km2':       33},
    'MAF': {'currency': 'Euro (EUR)',                    'language': 'French',              'area_km2':       54},
    'MNP': {'currency': 'US Dollar (USD)',               'language': 'English',             'area_km2':      464},
    'MSR': {'currency': 'East Caribbean Dollar (XCD)',   'language': 'English',             'area_km2':      102},
    'MTQ': {'currency': 'Euro (EUR)',                    'language': 'French',              'area_km2':     1128},
    'MYT': {'currency': 'Euro (EUR)',                    'language': 'French',              'area_km2':      374},
    'NCL': {'currency': 'CFP Franc (XPF)',               'language': 'French',              'area_km2':    18575},
    'NFK': {'currency': 'Australian Dollar (AUD)',       'language': 'English',             'area_km2':       36},
    'NIU': {'currency': 'New Zealand Dollar (NZD)',      'language': 'English',             'area_km2':      260},
    'PCN': {'currency': 'New Zealand Dollar (NZD)',      'language': 'English',             'area_km2':       47},
    'PRI': {'currency': 'US Dollar (USD)',               'language': 'Spanish',             'area_km2':     9104},
    'PYF': {'currency': 'CFP Franc (XPF)',               'language': 'French',              'area_km2':     4167},
    'REU': {'currency': 'Euro (EUR)',                    'language': 'French',              'area_km2':     2511},
    'SGS': {'currency': 'Pound Sterling (GBP)',          'language': 'English',             'area_km2':     3903},
    'SHN': {'currency': 'Saint Helena Pound (SHP)',      'language': 'English',             'area_km2':      394},
    'SJM': {'currency': 'Norwegian Krone (NOK)',         'language': 'Norwegian',           'area_km2':    62045},
    'SPM': {'currency': 'Euro (EUR)',                    'language': 'French',              'area_km2':      242},
    'SXM': {'currency': 'Caribbean Guilder (XCG)',       'language': 'Dutch',               'area_km2':       34},
    'TCA': {'currency': 'US Dollar (USD)',               'language': 'English',             'area_km2':      948},
    'TKL': {'currency': 'New Zealand Dollar (NZD)',      'language': 'Tokelauan',           'area_km2':       12},
    'UMI': {'currency': 'US Dollar (USD)',               'language': 'English',             'area_km2':       34},
    'VGB': {'currency': 'US Dollar (USD)',               'language': 'English',             'area_km2':      151},
    'VIR': {'currency': 'US Dollar (USD)',               'language': 'English',             'area_km2':      346},
    'WLF': {'currency': 'CFP Franc (XPF)',               'language': 'French',              'area_km2':      142},
    # --- Non-standard / disputed ISO codes ---
    'BLM': {'currency': 'Euro (EUR)',                    'language': 'French',              'area_km2':       21},
    'KOS': {'currency': 'Euro (EUR)',                    'language': 'Albanian',            'area_km2':    10887},
    'NCY': {'currency': 'Turkish Lira (TRY)',            'language': 'Turkish',             'area_km2':     3355},
    'SML': {'currency': 'Somaliland Shilling (SLSH)',    'language': 'Somali',              'area_km2':   137600},
}


# Merge extra attributes into COUNTRY_DATA at module-load time. We also derive
# `area_acres` from `area_km2` (1 km² == 247.10538 acres) so popups can show
# both units without callers needing to convert.
for _iso, _extra in COUNTRY_EXTRA.items():
    _base = COUNTRY_DATA.setdefault(_iso, {})
    for _k, _v in _extra.items():
        # `_base.setdefault` keeps existing values, EXCEPT when the existing
        # value is a non-positive sentinel for an area/GDP-like field — we
        # treat 0 as "missing" for these so curated positive values win.
        existing = _base.get(_k)
        is_zero_size = (
            _k in {'area_km2', 'gdp_usd'} and
            isinstance(existing, (int, float)) and existing <= 0 and
            isinstance(_v, (int, float)) and _v > 0
        )
        if _k not in _base or is_zero_size:
            _base[_k] = _v
    _km2 = _base.get('area_km2')
    if isinstance(_km2, (int, float)) and _km2 > 0:
        _base['area_acres'] = max(1, int(round(_km2 * 247.10538)))


# --- Non-country territories (Natural Earth `-99` ISO sentinel) --------------
#
# These features have no ISO_A3 because they aren't sovereign states: UK
# Sovereign Base Areas in Cyprus, the Vatican-style UN buffer zone, military
# leases (Baikonur, Guantanamo), Australian uninhabited territories, and
# disputed reefs/glaciers. Looma still surfaces them in the world map, so we
# populate sensible factual values keyed by the feature's `name` rather than
# by ISO. Uninhabited entries use `'(uninhabited)'` for the capital and 0 for
# population/GDP so the popup shows clearly that nobody lives there.
NON_COUNTRY_NAME_DATA: dict[str, dict[str, Any]] = {
    'akrotiri sovereign base area': {
        'capital': 'Episkopi Cantonment', 'population': 15700,
        'highest_point_m': 350, 'tz_offset_minutes': 120, 'tz_iana': 'Asia/Nicosia',
        'currency': 'Euro (EUR)', 'language': 'English',
        'area_km2': 123, 'gdp_usd': 0, 'gdp_year': 2023,
    },
    'ashmore and cartier islands': {
        'capital': '(uninhabited)', 'population': 0,
        'highest_point_m': 3, 'tz_offset_minutes': 480, 'tz_iana': 'Australia/Perth',
        'currency': 'Australian Dollar (AUD)', 'language': 'English',
        'area_km2': 5, 'gdp_usd': 0, 'gdp_year': 2023,
    },
    'baikonur cosmodrome': {
        'capital': 'Baikonur', 'population': 36000,
        'highest_point_m': 200, 'tz_offset_minutes': 300, 'tz_iana': 'Asia/Qyzylorda',
        'currency': 'Russian Ruble (RUB)', 'language': 'Russian',
        'area_km2': 6717, 'gdp_usd': 0, 'gdp_year': 2023,
    },
    'bajo nuevo bank petrel is': {
        'capital': '(uninhabited)', 'population': 0,
        'highest_point_m': 1, 'tz_offset_minutes': -300, 'tz_iana': 'America/Bogota',
        'currency': 'None', 'language': 'None',
        'area_km2': 1, 'gdp_usd': 0, 'gdp_year': 2023,
    },
    'clipperton island': {
        'capital': '(uninhabited)', 'population': 0,
        'highest_point_m': 29, 'tz_offset_minutes': -480, 'tz_iana': 'Pacific/Tahiti',
        'currency': 'Euro (EUR)', 'language': 'French',
        'area_km2': 6, 'gdp_usd': 0, 'gdp_year': 2023,
    },
    'coral sea islands': {
        'capital': '(uninhabited)', 'population': 4,
        'highest_point_m': 6, 'tz_offset_minutes': 600, 'tz_iana': 'Australia/Brisbane',
        'currency': 'Australian Dollar (AUD)', 'language': 'English',
        'area_km2': 10, 'gdp_usd': 0, 'gdp_year': 2023,
    },
    'cyprus no mans area': {
        'capital': 'Nicosia', 'population': 10000,
        'highest_point_m': 320, 'tz_offset_minutes': 120, 'tz_iana': 'Asia/Nicosia',
        'currency': 'Euro (EUR)', 'language': 'Greek',
        'area_km2': 346, 'gdp_usd': 0, 'gdp_year': 2023,
    },
    'dhekelia sovereign base area': {
        'capital': 'Episkopi Cantonment', 'population': 15500,
        'highest_point_m': 200, 'tz_offset_minutes': 120, 'tz_iana': 'Asia/Nicosia',
        'currency': 'Euro (EUR)', 'language': 'English',
        'area_km2': 130, 'gdp_usd': 0, 'gdp_year': 2023,
    },
    'indian ocean territories': {
        'capital': 'Flying Fish Cove', 'population': 2000,
        'highest_point_m': 361, 'tz_offset_minutes': 420, 'tz_iana': 'Indian/Christmas',
        'currency': 'Australian Dollar (AUD)', 'language': 'English',
        'area_km2': 149, 'gdp_usd': 0, 'gdp_year': 2023,
    },
    'scarborough reef': {
        'capital': '(uninhabited)', 'population': 0,
        'highest_point_m': 3, 'tz_offset_minutes': 480, 'tz_iana': 'Asia/Manila',
        'currency': 'None', 'language': 'None',
        'area_km2': 150, 'gdp_usd': 0, 'gdp_year': 2023,
    },
    'serranilla bank': {
        'capital': '(uninhabited)', 'population': 0,
        'highest_point_m': 2, 'tz_offset_minutes': -300, 'tz_iana': 'America/Bogota',
        'currency': 'None', 'language': 'None',
        'area_km2': 1, 'gdp_usd': 0, 'gdp_year': 2023,
    },
    'siachen glacier': {
        'capital': '(military positions)', 'population': 0,
        'highest_point_m': 7012, 'tz_offset_minutes': 330, 'tz_iana': 'Asia/Kolkata',
        'currency': 'None', 'language': 'None',
        'area_km2': 700, 'gdp_usd': 0, 'gdp_year': 2023,
    },
    'spratly islands': {
        'capital': '(disputed)', 'population': 250,
        'highest_point_m': 4, 'tz_offset_minutes': 480, 'tz_iana': 'Asia/Manila',
        'currency': 'None', 'language': 'None',
        'area_km2': 5, 'gdp_usd': 0, 'gdp_year': 2023,
    },
    'us naval base guantanamo bay': {
        'capital': 'Guantanamo Bay', 'population': 6000,
        'highest_point_m': 142, 'tz_offset_minutes': -300, 'tz_iana': 'America/Havana',
        'currency': 'US Dollar (USD)', 'language': 'English',
        'area_km2': 116, 'gdp_usd': 0, 'gdp_year': 2023,
    },
}


# Pre-compute area_acres for the non-country entries too.
for _nm, _ent in NON_COUNTRY_NAME_DATA.items():
    _km2 = _ent.get('area_km2')
    if isinstance(_km2, (int, float)) and _km2 > 0:
        _ent.setdefault('area_acres', max(1, int(round(_km2 * 247.10538))))

# Property aliases used by older geojsons; we normalise to the canonical keys
# (population, capital, highest_point_m, highest_point_ft, tz_offset_minutes,
# tz_iana, gdp_usd, gdp_year).
ISO_KEY_ALIASES = ('ISO_A3', 'iso_a3', 'iso_alpha3', 'ISO3', 'ISO', 'ADM0_A3', 'GU_A3', 'SU_A3', 'su_a3')


# Reverse name → ISO map built lazily from COUNTRY_DATA + a handful of common
# country-name aliases that show up in older Natural Earth feature names.
_NAME_TO_ISO: dict[str, str] | None = None

# Hand-curated name aliases for features whose `name` doesn't exactly match
# the canonical capital/country we used as the dict key. Keys here are
# normalised (lowercased, punctuation-stripped) so the lookup is forgiving.
_NAME_ALIASES = {
    'usa': 'USA', 'united states': 'USA', 'united states of america': 'USA',
    'uk': 'GBR', 'united kingdom': 'GBR', 'great britain': 'GBR',
    'south korea': 'KOR', 'republic of korea': 'KOR', 'korea': 'KOR',
    'north korea': 'PRK', 'dprk': 'PRK', "democratic people's republic of korea": 'PRK',
    'czech republic': 'CZE', 'czechia': 'CZE',
    'ivory coast': 'CIV', "cote d'ivoire": 'CIV', 'côte divoire': 'CIV',
    'cape verde': 'CPV', 'cabo verde': 'CPV',
    'eswatini': 'SWZ', 'swaziland': 'SWZ',
    'east timor': 'TLS', 'timorleste': 'TLS', 'timor leste': 'TLS',
    'myanmar': 'MMR', 'burma': 'MMR',
    'bosnia and herzegovina': 'BIH', 'bosnia': 'BIH',
    'macedonia': 'MKD', 'north macedonia': 'MKD',
    'russia': 'RUS', 'russian federation': 'RUS',
    'syria': 'SYR', 'syrian arab republic': 'SYR',
    'iran': 'IRN', 'islamic republic of iran': 'IRN',
    'taiwan': 'TWN', 'republic of china': 'TWN', 'chinese taipei': 'TWN',
    'vatican': 'VAT', 'holy see': 'VAT', 'vatican city': 'VAT',
    'palestine': 'PSE', 'palestinian territories': 'PSE', 'state of palestine': 'PSE',
    'congo (brazzaville)': 'COG', 'republic of the congo': 'COG', 'congo republic': 'COG',
    'congo (kinshasa)': 'COD', 'democratic republic of the congo': 'COD', 'dr congo': 'COD',
    'tanzania': 'TZA', 'united republic of tanzania': 'TZA',
    'venezuela': 'VEN', 'bolivarian republic of venezuela': 'VEN',
    'bolivia': 'BOL', 'plurinational state of bolivia': 'BOL',
    'micronesia': 'FSM', 'federated states of micronesia': 'FSM',
    'laos': 'LAO', "lao people's democratic republic": 'LAO',
    'vietnam': 'VNM', 'viet nam': 'VNM',
    'moldova': 'MDA', 'republic of moldova': 'MDA',
    'falkland islands': 'FLK', 'falkland islands (uk)': 'FLK',
    'turks and caicos': 'TCA', 'turks and caicos islands': 'TCA',
    'british virgin islands': 'VGB', 'us virgin islands': 'VIR',
    'wallis and futuna': 'WLF', 'wallis and futuna islands': 'WLF',
    'pitcairn islands': 'PCN',
    'saint helena': 'SHN', 'st helena': 'SHN',
    'saint kitts and nevis': 'KNA', 'st kitts and nevis': 'KNA',
    'saint lucia': 'LCA', 'st lucia': 'LCA',
    'saint vincent and the grenadines': 'VCT', 'st vincent and the grenadines': 'VCT',
    'antigua and barbuda': 'ATG',
    'trinidad and tobago': 'TTO',
    'sao tome and principe': 'STP', 'são tomé and príncipe': 'STP',
    'central african republic': 'CAF',
    'south sudan': 'SSD',
    'somaliland': 'SML',
    'northern cyprus': 'NCY', 'n. cyprus': 'NCY', 'turkish republic of northern cyprus': 'NCY',
    'kosovo': 'KOS', 'republic of kosovo': 'KOS',
    'aland islands': 'ALA', 'åland islands': 'ALA',
    'faroe islands': 'FRO', 'faeroe islands': 'FRO',
    'french guiana': 'GUF', 'french guiana (france)': 'GUF',
    'french polynesia': 'PYF',
    'new caledonia': 'NCL',
    'hong kong': 'HKG', 'hong kong sar': 'HKG',
    'macao': 'MAC', 'macau': 'MAC', 'macao sar': 'MAC',
    'curacao': 'CUW', 'curaçao': 'CUW',
    'sint maarten': 'SXM', 'st maarten': 'SXM',
    'saint martin': 'MAF', 'st martin (french part)': 'MAF',
    'saint barthelemy': 'BLM', 'saint barthélemy': 'BLM',
    'puerto rico': 'PRI',
    'guam': 'GUM',
    'samoa': 'WSM',
    'american samoa': 'ASM',
    'isle of man': 'IMN',
    'jersey': 'JEY',
    'guernsey': 'GGY',
    'gibraltar': 'GIB',
    'cayman islands': 'CYM',
    'cook islands': 'COK',
    'norfolk island': 'NFK',
    'niue': 'NIU',
    'tokelau': 'TKL',
    'tuvalu': 'TUV',
    'kiribati': 'KIR',
    'marshall islands': 'MHL',
    'palau': 'PLW',
    'solomon islands': 'SLB',
    'papua new guinea': 'PNG',
    'svalbard': 'SJM', 'svalbard and jan mayen': 'SJM',
    'greenland': 'GRL',
    'french southern and antarctic lands': 'ATF', 'french southern lands': 'ATF',
    'south georgia and the south sandwich islands': 'SGS',
    'british indian ocean territory': 'IOT',
    'western sahara': 'ESH',
    'bermuda': 'BMU',
    'aruba': 'ABW',
    'anguilla': 'AIA',
    'antarctica': 'ATA',
    'bonaire, sint eustatius and saba': 'BES',
    'bouvet island': 'BVT',
    'cocos (keeling) islands': 'CCK',
    'christmas island': 'CXR',
    'guadeloupe': 'GLP',
    'martinique': 'MTQ',
    'reunion': 'REU', 'réunion': 'REU',
    'mayotte': 'MYT',
    'montserrat': 'MSR',
    'saint pierre and miquelon': 'SPM',
    'us minor outlying islands': 'UMI', 'united states minor outlying islands': 'UMI',
    'vanuatu': 'VUT',
    'tonga': 'TON',
}


def _normalise_name(name: str) -> str:
    """Lowercase + strip punctuation/whitespace for forgiving name lookups."""
    s = (name or '').lower().strip()
    s = re.sub(r'[^a-z0-9\s]', '', s)
    s = re.sub(r'\s+', ' ', s).strip()
    return s


def _build_name_to_iso_index() -> dict[str, str]:
    """Build a normalised-name → ISO3 lookup from COUNTRY_DATA + aliases."""
    out: dict[str, str] = {}
    # Every ISO is also reachable by its own dict-key name field, if present.
    # We don't have a canonical English `name` per row, so we fall back to the
    # alias table — which already covers the most common feature spellings.
    for nm, iso in _NAME_ALIASES.items():
        out[_normalise_name(nm)] = iso
    return out


def _pick_iso3(props: dict) -> str:
    for key in ISO_KEY_ALIASES:
        v = props.get(key)
        if isinstance(v, str) and len(v.strip()) == 3 and v.strip() != '-99':
            return v.strip().upper()
    # Name-based fallback when the geojson has the sentinel '-99' or no ISO at
    # all — Natural Earth uses '-99' for disputed/non-state territories and for
    # some recognised states (e.g. Kosovo, N. Cyprus) that don't have an ISO3.
    global _NAME_TO_ISO
    if _NAME_TO_ISO is None:
        _NAME_TO_ISO = _build_name_to_iso_index()
    for key in ('name', 'NAME', 'country_name', 'admin', 'ADMIN', 'NAME_LONG', 'name_long'):
        v = props.get(key)
        if isinstance(v, str) and v.strip():
            iso = _NAME_TO_ISO.get(_normalise_name(v))
            if iso:
                return iso
    return ''


def _is_missing(value: Any) -> bool:
    if value is None:
        return True
    if isinstance(value, str) and value.strip() == '':
        return True
    return False


def _lookup_non_country_data(props: dict) -> dict | None:
    """Name-based fallback for features with no ISO_A3 (Natural Earth `-99`).
    Tries the feature's `name`/`country_name`/`admin` against the curated
    non-country territory table."""
    for key in ('name', 'NAME', 'country_name', 'admin', 'ADMIN', 'NAME_LONG', 'name_long'):
        v = props.get(key)
        if isinstance(v, str) and v.strip():
            entry = NON_COUNTRY_NAME_DATA.get(_normalise_name(v))
            if entry is not None:
                return entry
    return None


def enrich_feature(props: dict) -> list[str]:
    """Fill in missing fields in `props` and return the list of keys filled."""
    iso = _pick_iso3(props)
    filled: list[str] = []
    curated = COUNTRY_DATA.get(iso) if iso else None
    if curated is None:
        # No ISO match — try the non-country fallback (uninhabited reefs,
        # military bases, etc.) by feature name.
        curated = _lookup_non_country_data(props)
    if curated:
        for k, v in curated.items():
            if v is None or (isinstance(v, str) and not v.strip()):
                continue
            current = props.get(k)
            # Standard "fill when missing" path.
            if _is_missing(current):
                props[k] = v
                filled.append(k)
                continue
            # Special case: `area_km2 == 0` is a sentinel left over from an
            # earlier enrichment pass (Vatican). Replace with curated positive
            # value so the popup doesn't render "0 km²".
            if (
                k in {'area_km2', 'gdp_usd'}
                and isinstance(current, (int, float))
                and current <= 0
                and isinstance(v, (int, float))
                and v > 0
            ):
                props[k] = v
                filled.append(k)
    # Cross-derive metric/imperial heights when exactly one side is known.
    m  = props.get('highest_point_m')
    ft = props.get('highest_point_ft')
    if not _is_missing(m) and _is_missing(ft):
        try:
            props['highest_point_ft'] = int(round(float(m) * 3.28084))
            filled.append('highest_point_ft')
        except Exception:
            pass
    elif _is_missing(m) and not _is_missing(ft):
        try:
            props['highest_point_m'] = int(round(float(ft) / 3.28084))
            filled.append('highest_point_m')
        except Exception:
            pass
    # Cross-derive area_km2 <-> area_acres so the popup always has both.
    km2 = props.get('area_km2')
    acres = props.get('area_acres')
    if isinstance(km2, (int, float)) and km2 > 0 and (_is_missing(acres) or (isinstance(acres, (int, float)) and acres <= 0)):
        props['area_acres'] = max(1, int(round(float(km2) * 247.10538)))
        filled.append('area_acres')
    elif _is_missing(km2) and isinstance(acres, (int, float)) and acres > 0:
        props['area_km2'] = max(1, int(round(float(acres) / 247.10538)))
        filled.append('area_km2')
    return filled


def process_file(path: Path, write: bool) -> dict:
    if not path.exists():
        return {'path': str(path), 'error': 'not found'}
    with path.open('r', encoding='utf-8') as fh:
        data = json.load(fh)
    features = data.get('features') or []
    field_counts: dict[str, int] = {}
    unmatched: list[str] = []
    matched = 0
    for feat in features:
        if not isinstance(feat, dict):
            continue
        props = feat.get('properties') or {}
        if not isinstance(props, dict):
            continue
        iso = _pick_iso3(props)
        if iso and iso not in COUNTRY_DATA:
            name = props.get('name') or props.get('NAME') or iso
            unmatched.append(f'{iso} ({name})')
        filled = enrich_feature(props)
        feat['properties'] = props
        if filled:
            matched += 1
            for k in filled:
                field_counts[k] = field_counts.get(k, 0) + 1
    if write and field_counts:
        # Use the same compact formatting the original files ship with
        # (no spaces around separators) so the diff stays small.
        with path.open('w', encoding='utf-8') as fh:
            json.dump(data, fh, ensure_ascii=False, separators=(',', ':'))
    return {
        'path': str(path),
        'features': len(features),
        'features_filled': matched,
        'fields_filled': field_counts,
        'unmatched_iso': sorted(set(unmatched))[:20],
        'unmatched_count': len(set(unmatched)),
    }


def _process_root(label: str, root: Path, write_mode: bool) -> int:
    """Process every geojson under `root`, return the total fields filled."""
    if not root.exists():
        print(f'  (root not found, skipping: {root})')
        return 0
    print(f'\n--- {label}: {root} ---')
    subtotal = 0
    for name in GEOJSON_FILES:
        path = root / name
        if not path.exists():
            continue
        result = process_file(path, write=write_mode)
        if 'error' in result:
            print(f'! {name}: {result["error"]}')
            continue
        print(f'{name}')
        print(f'  features: {result["features"]}')
        print(f'  features filled: {result["features_filled"]}')
        if result['fields_filled']:
            for k, n in sorted(result['fields_filled'].items()):
                print(f'    {k}: {n}')
            subtotal += sum(result['fields_filled'].values())
        else:
            print('    (no gaps to fill — all fields already present)')
        if result['unmatched_count']:
            print(f'  ISO codes without curated data: {result["unmatched_count"]} '
                  f'(first 20: {", ".join(result["unmatched_iso"])})')
    return subtotal


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--write', action='store_true',
                        help='Apply changes (default is dry-run).')
    parser.add_argument('--dry-run', action='store_true',
                        help='Explicit dry-run flag (default mode).')
    parser.add_argument('--maps-root', default=None,
                        help='Override the maps directory location (defaults to'
                             ' processing BOTH content/maps/json and maps2018/json).')
    args = parser.parse_args(argv)

    write_mode = bool(args.write) and not args.dry_run

    if args.maps_root:
        roots = [('OVERRIDE', Path(args.maps_root))]
    else:
        roots = [
            ('Production (Apache-served)', PROD_MAPS_ROOT),
            ('Legacy maps2018',            LEGACY_MAPS_ROOT),
        ]

    print(f'Mode: {"WRITE" if write_mode else "DRY-RUN"}')
    print(f'Curated countries: {len(COUNTRY_DATA)}')

    total_filled = 0
    for label, root in roots:
        total_filled += _process_root(label, root, write_mode=write_mode)

    print(f'\nTotal field values filled across all files: {total_filled}')
    if not write_mode:
        print('Re-run with --write to apply the changes.')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
