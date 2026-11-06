"""Country -> primary official language, for two things:

  1. The Odroid installer's "Country / curriculum" field (looma-installer.sh)
     passes the country name straight through as LOOMA_CURRICULUM_COUNTRY;
     this is where that name resolves to a language to generate in.
  2. The generation layer (exams/lessons/quizzes): every piece of generated
     content is produced in English AND in the box's country's official
     language -- this table says which language that is and which NLLB-200
     FLORES-200 code to translate into (see translate_text() below).

Keys are the same country names used in documents.country (schema.sql) --
whatever string a --country run of ingest_looma.py was tagged with, e.g.
"Nepal". This is deliberately not exhaustive: a country with no entry here
still installs and runs fine, it just gets English-only generation until an
entry is added (translate_text() returns the English text unchanged for an
unknown language).

lang_code is the short code the rest of the codebase already uses in
`language=` query params (looma-utilities.js LOOMA.translate, /generate_exam,
...). nllb is the FLORES-200 code translate_text() passes to NLLB-200 as
tgt_lang (src_lang is always 'eng_Latn' -- all source curriculum content here
is English first).
"""

COUNTRY_LANGUAGES = {
    # South Asia
    "Nepal":        {"lang_code": "ne", "lang_name": "Nepali",     "nllb": "npi_Deva"},
    "India":        {"lang_code": "hi", "lang_name": "Hindi",      "nllb": "hin_Deva"},
    "Pakistan":     {"lang_code": "ur", "lang_name": "Urdu",       "nllb": "urd_Arab"},
    "Bangladesh":   {"lang_code": "bn", "lang_name": "Bengali",    "nllb": "ben_Beng"},
    "Sri Lanka":    {"lang_code": "si", "lang_name": "Sinhala",    "nllb": "sin_Sinh"},
    "Bhutan":       {"lang_code": "dz", "lang_name": "Dzongkha",   "nllb": "dzo_Tibt"},
    "Afghanistan":  {"lang_code": "ps", "lang_name": "Pashto",     "nllb": "pbt_Arab"},

    # Sub-Saharan Africa -- Francophone
    "Senegal":              {"lang_code": "fr", "lang_name": "French", "nllb": "fra_Latn"},
    "Mali":                 {"lang_code": "fr", "lang_name": "French", "nllb": "fra_Latn"},
    "Burkina Faso":         {"lang_code": "fr", "lang_name": "French", "nllb": "fra_Latn"},
    "Niger":                {"lang_code": "fr", "lang_name": "French", "nllb": "fra_Latn"},
    "Guinea":               {"lang_code": "fr", "lang_name": "French", "nllb": "fra_Latn"},
    "Ivory Coast":          {"lang_code": "fr", "lang_name": "French", "nllb": "fra_Latn"},
    "Benin":                {"lang_code": "fr", "lang_name": "French", "nllb": "fra_Latn"},
    "Togo":                 {"lang_code": "fr", "lang_name": "French", "nllb": "fra_Latn"},
    "Cameroon":             {"lang_code": "fr", "lang_name": "French", "nllb": "fra_Latn"},
    "Chad":                 {"lang_code": "fr", "lang_name": "French", "nllb": "fra_Latn"},
    "Democratic Republic of the Congo": {"lang_code": "fr", "lang_name": "French", "nllb": "fra_Latn"},
    "Republic of the Congo": {"lang_code": "fr", "lang_name": "French", "nllb": "fra_Latn"},
    "Madagascar":           {"lang_code": "fr", "lang_name": "French", "nllb": "fra_Latn"},
    "Rwanda":               {"lang_code": "rw", "lang_name": "Kinyarwanda", "nllb": "kin_Latn"},
    "Burundi":              {"lang_code": "rn", "lang_name": "Kirundi",     "nllb": "run_Latn"},

    # Sub-Saharan Africa -- Anglophone
    "Nigeria":      {"lang_code": "en", "lang_name": "English (Hausa widely spoken)", "nllb": "hau_Latn"},
    "Ghana":        {"lang_code": "en", "lang_name": "English"},
    "Kenya":        {"lang_code": "sw", "lang_name": "Swahili", "nllb": "swh_Latn"},
    "Tanzania":     {"lang_code": "sw", "lang_name": "Swahili", "nllb": "swh_Latn"},
    "Uganda":       {"lang_code": "sw", "lang_name": "Swahili", "nllb": "swh_Latn"},
    "Ethiopia":     {"lang_code": "am", "lang_name": "Amharic", "nllb": "amh_Ethi"},
    "South Sudan":  {"lang_code": "en", "lang_name": "English"},
    "Zambia":       {"lang_code": "en", "lang_name": "English"},
    "Zimbabwe":     {"lang_code": "en", "lang_name": "English"},
    "Malawi":       {"lang_code": "en", "lang_name": "English"},
    "Sierra Leone": {"lang_code": "en", "lang_name": "English"},
    "Liberia":      {"lang_code": "en", "lang_name": "English"},
    "South Africa": {"lang_code": "zu", "lang_name": "Zulu", "nllb": "zul_Latn"},
    "Somalia":      {"lang_code": "so", "lang_name": "Somali", "nllb": "som_Latn"},

    # Sub-Saharan Africa -- Lusophone
    "Mozambique":        {"lang_code": "pt", "lang_name": "Portuguese", "nllb": "por_Latn"},
    "Angola":            {"lang_code": "pt", "lang_name": "Portuguese", "nllb": "por_Latn"},
    "Guinea-Bissau":     {"lang_code": "pt", "lang_name": "Portuguese", "nllb": "por_Latn"},
    "Cape Verde":        {"lang_code": "pt", "lang_name": "Portuguese", "nllb": "por_Latn"},
    "Sao Tome and Principe": {"lang_code": "pt", "lang_name": "Portuguese", "nllb": "por_Latn"},

    # North Africa / Middle East
    "Egypt":        {"lang_code": "ar", "lang_name": "Arabic", "nllb": "arb_Arab"},
    "Morocco":      {"lang_code": "ar", "lang_name": "Arabic", "nllb": "arb_Arab"},
    "Tunisia":      {"lang_code": "ar", "lang_name": "Arabic", "nllb": "arb_Arab"},
    "Algeria":      {"lang_code": "ar", "lang_name": "Arabic", "nllb": "arb_Arab"},
    "Libya":        {"lang_code": "ar", "lang_name": "Arabic", "nllb": "arb_Arab"},
    "Sudan":        {"lang_code": "ar", "lang_name": "Arabic", "nllb": "arb_Arab"},
    "Jordan":       {"lang_code": "ar", "lang_name": "Arabic", "nllb": "arb_Arab"},
    "Yemen":        {"lang_code": "ar", "lang_name": "Arabic", "nllb": "arb_Arab"},
    "Syria":        {"lang_code": "ar", "lang_name": "Arabic", "nllb": "arb_Arab"},
    "Iraq":         {"lang_code": "ar", "lang_name": "Arabic", "nllb": "arb_Arab"},

    # Southeast / East Asia
    "Vietnam":      {"lang_code": "vi", "lang_name": "Vietnamese", "nllb": "vie_Latn"},
    "Cambodia":     {"lang_code": "km", "lang_name": "Khmer",      "nllb": "khm_Khmr"},
    "Laos":         {"lang_code": "lo", "lang_name": "Lao",        "nllb": "lao_Laoo"},
    "Myanmar":      {"lang_code": "my", "lang_name": "Burmese",    "nllb": "mya_Mymr"},
    "Thailand":     {"lang_code": "th", "lang_name": "Thai",       "nllb": "tha_Thai"},
    "Indonesia":    {"lang_code": "id", "lang_name": "Indonesian", "nllb": "ind_Latn"},
    "Philippines":  {"lang_code": "tl", "lang_name": "Filipino",  "nllb": "tgl_Latn"},
    "Mongolia":     {"lang_code": "mn", "lang_name": "Mongolian",  "nllb": "khk_Cyrl"},
    "Timor-Leste":  {"lang_code": "pt", "lang_name": "Portuguese", "nllb": "por_Latn"},

    # Latin America
    "Mexico":       {"lang_code": "es", "lang_name": "Spanish", "nllb": "spa_Latn"},
    "Guatemala":    {"lang_code": "es", "lang_name": "Spanish", "nllb": "spa_Latn"},
    "Honduras":     {"lang_code": "es", "lang_name": "Spanish", "nllb": "spa_Latn"},
    "Nicaragua":    {"lang_code": "es", "lang_name": "Spanish", "nllb": "spa_Latn"},
    "El Salvador":  {"lang_code": "es", "lang_name": "Spanish", "nllb": "spa_Latn"},
    "Peru":         {"lang_code": "es", "lang_name": "Spanish", "nllb": "spa_Latn"},
    "Bolivia":      {"lang_code": "es", "lang_name": "Spanish", "nllb": "spa_Latn"},
    "Colombia":     {"lang_code": "es", "lang_name": "Spanish", "nllb": "spa_Latn"},
    "Ecuador":      {"lang_code": "es", "lang_name": "Spanish", "nllb": "spa_Latn"},
    "Paraguay":     {"lang_code": "es", "lang_name": "Spanish", "nllb": "spa_Latn"},
    "Brazil":       {"lang_code": "pt", "lang_name": "Portuguese", "nllb": "por_Latn"},
    "Haiti":        {"lang_code": "ht", "lang_name": "Haitian Creole", "nllb": "hat_Latn"},

    # Europe (mostly for completeness / Portuguese-speaking dev/testing boxes)
    "Portugal":     {"lang_code": "pt", "lang_name": "Portuguese", "nllb": "por_Latn"},
    "Spain":        {"lang_code": "es", "lang_name": "Spanish",    "nllb": "spa_Latn"},
    "France":       {"lang_code": "fr", "lang_name": "French",     "nllb": "fra_Latn"},
}


def country_language(country: str | None) -> dict:
    """Look up the official-language entry for `country`.

    Always returns a dict with at least lang_code/lang_name -- an unknown or
    empty country falls back to English (so an unmapped country still works,
    just without a second generated-language version).
    """
    if not country:
        return {"lang_code": "en", "lang_name": "English"}
    entry = COUNTRY_LANGUAGES.get(country.strip())
    if not entry:
        return {"lang_code": "en", "lang_name": "English"}
    return entry
