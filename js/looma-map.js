/*
Filename: looma-map.js
Description: Reads in data from a mongo document and from geojson documents to create a map

Programmer name: Morgan, Sophie, Henry, Kendall
Owner: VillageTech Solutions (villagetechsolutions.org)
Date: 2018 07, NOV 2020 [skip]
Revision: Looma 3.0
 */

"use strict";

// Cache-buster appended to geojson fetches. The chapter geojsons get
// re-enriched periodically (population / GDP / capital / timezone /
// highest_point) and the browser otherwise serves the stale copy from disk
// cache forever, which makes new properties look "missing" in popups.
var LOOMA_MAP_CACHE_BUSTER = 'v=20260513c';

// Create the layers for the map and the arrays that hold them
var data;        // the mongo DB description for this map
var baseLayers;  // Array storing the base layers
var currentBase =0; //index of the current selected base layer
var addOnLayers; // Array storing add-on layers
var popUpShowing; // Array storing true/false values for if each add-on layer is on/off
var info;       // Represents the information box
var addOnData;  // data describing the add-on layers from the database
var priorityOn; // If layers are brought to the front by priorities in database
var infoBoxOn;  //If the infoBox is on
var map, southWest, northEast;
var mapDefaultBounds;
var mapTitle;
var countryClickPanel;
var countryClickJustOpened = false;
var nepalSelectedLayer = null;
var nepalSelectedOutlineLayer = null;
var nepalSelectedBase = null;
var nepalSelectionPanel = null;
var nepalHoverPanel = null;
var supplementalCountryFacts = {};
var supplementalCountryFactsByIso2 = {};
var supplementalCountryFactsByName = {};
var supplementalCountryFactsByCapital = {};
var supplementalCountryFactsLoaded = false;
var supplementalCountryFactsRequest = null;
var LOOMA_MAP_COUNTRY_ALIASES = {
    'burma': 'myanmar',
    'east timor': 'timor leste',
    'macedonia': 'north macedonia',
    'ivory coast': 'cote d ivoire',
    'czech republic': 'czechia',
    'swaziland': 'eswatini',
    'cape verde': 'cabo verde',
    'laos': 'lao people s democratic republic',
    'south korea': 'korea republic of',
    'north korea': 'korea democratic people s republic of',
    'russia': 'russian federation',
    'bahamas': 'the bahamas',
    'u s virgin islands': 'united states virgin islands',
    'netherlands antilles': 'curacao',
    'saint barth lemy': 'saint barthelemy',
    'serbia': 'republic of serbia'
    ,'tanzania': 'united republic of tanzania'
};

function _loomaMapEscapeHtml(value) {
    return ('' + (value === null || value === undefined ? '' : value))
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function _loomaMapDisplayText(value) {
    if (value === null || value === undefined) return '';
    if (Array.isArray(value)) return value.join(', ');
    if (typeof value === 'object') {
        return Object.keys(value).map(function (k) { return value[k]; }).join(', ');
    }
    return '' + value;
}

function _loomaMapPickProp(props, keys) {
    if (!props) return null;
    for (var i = 0; i < keys.length; i++) {
        var k = keys[i];
        if (props[k] !== undefined && props[k] !== null && ('' + props[k]).trim() !== '') return props[k];
    }
    var lower = {};
    Object.keys(props).forEach(function (k) { lower[String(k).toLowerCase()] = k; });
    for (var j = 0; j < keys.length; j++) {
        var lk = String(keys[j]).toLowerCase();
        if (lower[lk]) {
            var kk = lower[lk];
            if (props[kk] !== undefined && props[kk] !== null && ('' + props[kk]).trim() !== '') return props[kk];
        }
    }
    return null;
}

function _loomaMapGuessCountryISO(props) {
    if (!props) return null;
    return _loomaMapPickProp(props, [
        'ISO_A3', 'ISO3', 'iso_a3', 'iso_alpha3', 'iso3', 'iso', 'ISO', 'cca3',
        'adm0_a3', 'sov_a3', 'brk_a3', 'gu_a3', 'wb_a3', 'su_a3', 'id'
    ]);
}

function _loomaMapNormalizeLookupName(value) {
    var normalized = '' + (value === null || value === undefined ? '' : value);
    if (normalized.normalize) normalized = normalized.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    return normalized.toLowerCase()
        .replace(/&/g, 'and')
        .replace(/[^a-z0-9]+/g, ' ')
        .trim();
}

function _loomaMapCountryNameCandidates(props) {
    if (!props) return [];
    var candidates = [];
    [
        'country_name', 'country', 'name', 'NAME', 'NAME_0', 'NAME_ENGLI',
        'admin', 'ADMIN', 'SOVEREIGN', 'sovereignt', 'geounit', 'subunit',
        'name_long', 'formal_en', 'brk_name'
    ].forEach(function (key) {
        var value = _loomaMapPickProp(props, [key]);
        if (value) candidates.push(value);
    });
    var combined = _loomaMapPickProp(props, ['combined']);
    if (combined && ('' + combined).indexOf(',') !== -1) {
        candidates.push(('' + combined).split(',').pop());
    } else if (combined && ('' + combined).indexOf('.') !== -1) {
        candidates.push(('' + combined).split('.').pop());
    }
    return candidates;
}

function _loomaMapSupplementalCountryFacts(props) {
    var iso = _loomaMapGuessCountryISO(props);
    if (iso) {
        var isoKey = ('' + iso).toUpperCase();
        if (supplementalCountryFacts[isoKey]) return supplementalCountryFacts[isoKey];
        if (supplementalCountryFactsByIso2[isoKey]) return supplementalCountryFactsByIso2[isoKey];
    }
    var names = _loomaMapCountryNameCandidates(props);
    for (var i = 0; i < names.length; i++) {
        var normalized = _loomaMapNormalizeLookupName(names[i]);
        if (normalized && supplementalCountryFactsByName[normalized]) {
            return supplementalCountryFactsByName[normalized];
        }
        if (normalized && LOOMA_MAP_COUNTRY_ALIASES[normalized] && supplementalCountryFactsByName[LOOMA_MAP_COUNTRY_ALIASES[normalized]]) {
            return supplementalCountryFactsByName[LOOMA_MAP_COUNTRY_ALIASES[normalized]];
        }
    }
    // Try matching by capital name (useful for capital point features)
    var cap = _loomaMapPickProp(props, ['capital', 'CAPITAL', 'name', 'NAME']);
    if (cap) {
        var capNorm = _loomaMapNormalizeLookupName(cap);
        if (capNorm && supplementalCountryFactsByCapital[capNorm]) {
            return supplementalCountryFactsByCapital[capNorm];
        }
    }
    return {};
}

function _loomaMapHydrateCountryProps(props) {
    props = props || {};
    var supplemental = _loomaMapSupplementalCountryFacts(props);
    var hydrated = {};
    Object.keys(props).forEach(function (key) { hydrated[key] = props[key]; });

    function firstPresent() {
        for (var i = 0; i < arguments.length; i++) {
            var value = arguments[i];
            if (value !== undefined && value !== null && ('' + value).trim() !== '') return value;
        }
        return null;
    }

    function assignIfPresent(key) {
        var values = Array.prototype.slice.call(arguments, 1);
        var value = firstPresent.apply(null, values);
        if (value !== null) hydrated[key] = value;
    }

    function gdpFromMillions(value) {
        var n = _loomaMapAsNumber(value);
        return n === null || n < 0 ? null : n * 1000000;
    }

    assignIfPresent('country_name', hydrated.country_name, hydrated.country, hydrated.admin, hydrated.ADMIN, hydrated.name, hydrated.NAME, hydrated.NAME_0, hydrated.NAME_ENGLI, hydrated.name_long, hydrated.formal_en);
    assignIfPresent('population', hydrated.population, hydrated.POP_EST, hydrated.pop_est, hydrated.pop);
    assignIfPresent('capital', hydrated.capital, hydrated.CAPITAL);
    assignIfPresent('gdp_usd', hydrated.gdp_usd, hydrated.gdp, hydrated.gdp_current_usd, hydrated.pib, gdpFromMillions(hydrated.gdp_md_est));
    assignIfPresent('highest_point_m', hydrated.highest_point_m, hydrated.highest_m, hydrated.elev_m, hydrated.elevation_m, hydrated.alt_m);
    assignIfPresent('currency', hydrated.currency, hydrated.currency_name, hydrated.curr_name, hydrated.money, hydrated.monetary_unit);
    assignIfPresent('language', hydrated.language, hydrated.languages, hydrated.official_language, hydrated.official_languages, hydrated.lang);
    assignIfPresent('area_km2', hydrated.area_km2, hydrated.area_sq_km, hydrated.area_sqkm, hydrated.area, hydrated.AREA_KM2, hydrated.SQKM);
    assignIfPresent('ISO_A3', hydrated.ISO_A3, hydrated.ISO3, hydrated.iso_a3, hydrated.iso_alpha3, hydrated.iso3, hydrated.iso, hydrated.ISO, hydrated.cca3, hydrated.adm0_a3, hydrated.sov_a3, hydrated.brk_a3, hydrated.gu_a3, hydrated.wb_a3, (('' + (hydrated.su_a3 || '')).length === 3 ? hydrated.su_a3 : null));
    assignIfPresent('ISO_A2', hydrated.ISO_A2, hydrated.ISO2, hydrated.iso_a2, hydrated.iso2, hydrated.cca2, hydrated.wb_a2, (('' + (hydrated.su_a3 || '')).length === 2 ? hydrated.su_a3 : null));
    assignIfPresent('tz_iana', hydrated.tz_iana, hydrated.timezone_iana, hydrated.timezone);
    assignIfPresent('tz_offset_minutes', hydrated.tz_offset_minutes, hydrated.tz_offset);

    if (supplemental && Object.keys(supplemental).length) {
        Object.keys(supplemental).forEach(function (key) {
            if (hydrated[key] === undefined || hydrated[key] === null || ('' + hydrated[key]).trim() === '') {
                hydrated[key] = supplemental[key];
            }
        });
        assignIfPresent('country_name', supplemental.name, supplemental.admin, hydrated.country, hydrated.admin, hydrated.ADMIN, hydrated.name, hydrated.NAME, hydrated.NAME_0, hydrated.NAME_ENGLI);
        // Prefer the feature's own population (city features carry city pop;
        // overriding with country supplemental would replace e.g. Chicago's
        // 2.7M with USA's 330M). Country features without `population` still
        // fall through to supplemental.
        assignIfPresent('population', hydrated.population, hydrated.POP_EST, hydrated.pop_est, hydrated.pop, supplemental.population);
        assignIfPresent('capital_population', supplemental.capital_population, hydrated.capital_population);
        assignIfPresent('capital', supplemental.capital, hydrated.capital, hydrated.CAPITAL);
        assignIfPresent('gdp_usd', supplemental.gdp_usd, hydrated.gdp_usd, hydrated.gdp, hydrated.gdp_current_usd, hydrated.pib);
        assignIfPresent('highest_point_m', supplemental.highest_point_m, hydrated.highest_point_m, hydrated.highest_m, hydrated.elev_m, hydrated.elevation_m, hydrated.alt_m);
        assignIfPresent('currency', supplemental.currency, hydrated.currency, hydrated.currency_name, hydrated.curr_name);
        assignIfPresent('language', supplemental.language, hydrated.language, hydrated.languages, hydrated.official_language, hydrated.official_languages, hydrated.lang);
        assignIfPresent('area_km2', supplemental.area_km2, hydrated.area_km2, hydrated.area_sq_km, hydrated.area_sqkm, hydrated.area, hydrated.AREA_KM2, hydrated.SQKM);
        assignIfPresent('ISO_A3', supplemental.iso, supplemental.ISO_A3, hydrated.ISO_A3, hydrated.ISO3, hydrated.iso_alpha3, hydrated.iso3, hydrated.iso, hydrated.ISO, hydrated.cca3);
        assignIfPresent('ISO_A2', supplemental.iso2, hydrated.ISO_A2, hydrated.ISO2, hydrated.iso2, hydrated.cca2, (('' + (hydrated.su_a3 || '')).length === 2 ? hydrated.su_a3 : null));
        // Prefer the feature's own tz_iana over the country supplemental: a US
        // city like San Francisco has its own America/Los_Angeles, distinct
        // from the country's default America/New_York.
        assignIfPresent('tz_iana', hydrated.tz_iana, supplemental.tz_iana, hydrated.timezone_iana, hydrated.timezone);
        assignIfPresent('tz_offset_minutes', hydrated.tz_offset_minutes, supplemental.tz_offset_minutes, hydrated.tz_offset);
    }

    return hydrated;
}

function _loomaMapHydrateGeoJsonFeatures(geojson) {
    if (!geojson || !geojson.features) return geojson;
    geojson.features.forEach(function (feature) {
        var props = feature.properties || {};
        if (feature.id !== undefined && feature.id !== null && props.id === undefined) props.id = feature.id;
        feature.properties = _loomaMapHydrateCountryProps(props);
    });
    return geojson;
}

function _loomaMapHydrateLoadedLayers() {
    function hydrateLayerGroup(group) {
        if (!group || !group.eachLayer) return;
        group.eachLayer(function (layer) {
            if (layer.feature && layer.feature.properties) {
                layer.feature.properties = _loomaMapHydrateCountryProps(layer.feature.properties);
            }
            if (layer.eachLayer) hydrateLayerGroup(layer);
        });
    }
    if (baseLayers) baseLayers.forEach(hydrateLayerGroup);
    if (addOnLayers) addOnLayers.forEach(hydrateLayerGroup);
}

function _loomaMapLocalTime(tzIana, tzOffsetMinutes) {
    try {
        if (tzIana) {
            return new Intl.DateTimeFormat([], {
                timeZone: tzIana, hour: '2-digit', minute: '2-digit', hour12: false
            }).format(new Date());
        }
    } catch (_) { /* invalid IANA, fall through to offset */ }
    var off = _loomaMapAsNumber(tzOffsetMinutes);
    if (off === null) return null;
    var d = new Date();
    var utcMs = d.getTime() + d.getTimezoneOffset() * 60000;
    var local = new Date(utcMs + off * 60000);
    var hh = String(local.getHours()).padStart(2, '0');
    var mm = String(local.getMinutes()).padStart(2, '0');
    return hh + ':' + mm;
}

function _loomaMapLocalDateTime(tzIana, tzOffsetMinutes) {
    try {
        if (tzIana) {
            return new Intl.DateTimeFormat([], {
                timeZone: tzIana,
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
            }).format(new Date());
        }
    } catch (_) { /* invalid IANA, fall through to offset */ }
    var off = _loomaMapAsNumber(tzOffsetMinutes);
    if (off === null) return null;
    var d = new Date();
    var utcMs = d.getTime() + d.getTimezoneOffset() * 60000;
    var local = new Date(utcMs + off * 60000);
    var yyyy = local.getFullYear();
    var mm = String(local.getMonth() + 1).padStart(2, '0');
    var dd = String(local.getDate()).padStart(2, '0');
    var hh = String(local.getHours()).padStart(2, '0');
    var min = String(local.getMinutes()).padStart(2, '0');
    return dd + '/' + mm + '/' + yyyy + ', ' + hh + ':' + min;
}

function _loomaMapFormatArea(areaKm2Raw) {
    var areaKm2 = _loomaMapAsNumber(areaKm2Raw);
    if (areaKm2 === null) {
        var raw = (areaKm2Raw === null || areaKm2Raw === undefined) ? '' : ('' + areaKm2Raw).trim();
        return raw ? _loomaMapEscapeHtml(raw) : '-';
    }
    var acres = areaKm2 * 247.105381;
    return toCommas('' + Math.round(areaKm2)) + ' km&sup2; / ' + toCommas('' + Math.round(acres)) + ' acres';
}

function _loomaMapSafeFactValueHtml(valueHtml) {
    if (valueHtml === null || valueHtml === undefined) return '-';
    var value = '' + valueHtml;
    return value.replace(/<[^>]*>/g, '').trim() === '' ? '-' : value;
}

function _loomaMapHasFactValueHtml(valueHtml) {
    if (valueHtml === null || valueHtml === undefined) return false;
    var value = ('' + valueHtml).replace(/<[^>]*>/g, '').trim();
    if (!value) return false;
    value = value.toLowerCase();
    return value !== '-' &&
           value !== '--' &&
           value !== 'n/a' &&
           value !== 'na' &&
           value !== 'null' &&
           value !== 'undefined';
}

function _loomaMapCountryFacts(props) {
    var hydrated = _loomaMapHydrateCountryProps(props);
    // For city features the feature's `population` is the city pop — the
    // country panel needs the country pop, so prefer the supplemental value
    // when present and fall back to the feature/hydrated population.
    var supplemental = _loomaMapSupplementalCountryFacts(props);
    var population = _loomaMapPickProp(supplemental, ['population']) ||
                     _loomaMapPickProp(hydrated, ['population', 'POP_EST', 'pop_est', 'pop']);
    var capital = _loomaMapPickProp(hydrated, ['capital', 'CAPITAL']);
    var gdp = _loomaMapPickProp(hydrated, ['gdp_usd', 'gdp', 'gdp_current_usd', 'pib']);
    var highest = _loomaMapPickProp(hydrated, ['highest_point_m', 'highest_m', 'elev_m', 'elevation_m', 'alt_m']);
    var currency = _loomaMapPickProp(hydrated, ['currency', 'currency_name', 'curr_name', 'money', 'monetary_unit']);
    var language = _loomaMapPickProp(hydrated, ['language', 'languages', 'official_language', 'official_languages', 'lang']);
    var areaKm2 = _loomaMapPickProp(hydrated, ['area_km2', 'area_sq_km', 'area_sqkm', 'area', 'AREA_KM2', 'sqkm']);
    var highestFormatted = highest !== null && highest !== undefined && ('' + highest).trim() !== '' ? _loomaMapFormatProp('highest_point_m', highest).valueHtml : '-';
    var areaFormatted = _loomaMapFormatArea(areaKm2);

    return [
        { label: 'Population', valueHtml: _loomaMapSafeFactValueHtml(population !== null && population !== undefined && ('' + population).trim() !== '' ? toCommas('' + population) : '-') },
        { label: 'Capital', valueHtml: _loomaMapSafeFactValueHtml(capital !== null && capital !== undefined && ('' + capital).trim() !== '' ? _loomaMapEscapeHtml(capital) : '-') },
        { label: 'GDP (USD)', valueHtml: _loomaMapSafeFactValueHtml(_loomaMapFormatProp('gdp_usd', gdp).valueHtml) },
        { label: 'Highest Point', valueHtml: _loomaMapSafeFactValueHtml(highestFormatted) },
        { label: 'Currency', valueHtml: _loomaMapSafeFactValueHtml(currency !== null && currency !== undefined && ('' + currency).trim() !== '' ? _loomaMapEscapeHtml(_loomaMapDisplayText(currency)) : '-') },
        { label: 'Language', valueHtml: _loomaMapSafeFactValueHtml(language !== null && language !== undefined && ('' + language).trim() !== '' ? _loomaMapEscapeHtml(_loomaMapDisplayText(language)) : '-') },
        { label: 'Total Area', valueHtml: _loomaMapSafeFactValueHtml(areaFormatted) }
    ].filter(function (fact) {
        return _loomaMapHasFactValueHtml(fact.valueHtml);
    });
}

function _loomaMapCountryDisplayName(props) {
    var hydrated = _loomaMapHydrateCountryProps(props || {});
    return _loomaMapPickProp(hydrated, [
        'country_name', 'country', 'admin', 'ADMIN',
        'name_long', 'formal_en', 'NAME_0', 'NAME_ENGLI', 'name', 'NAME',
        // World Map's continents.geojson features only carry `continent` —
        // fall through to it so the hover tooltip still shows a name.
        'continent', 'CONTINENT'
    ]);
}

function _loomaMapIsContinentFeatureProps(props) {
    // A feature is a continent when it carries the `continent` key but none
    // of the country identifiers (ISO code or country name). Used to switch
    // the click panel to a simpler "continent card" on the World Map.
    if (!props) return false;
    var continent = _loomaMapPickProp(props, ['continent', 'CONTINENT']);
    if (!continent) return false;
    var country = _loomaMapPickProp(props, [
        'country_name', 'country', 'admin', 'ADMIN', 'name', 'NAME',
        'name_long', 'formal_en', 'NAME_0', 'NAME_ENGLI'
    ]);
    var iso = _loomaMapPickProp(props, [
        'ISO_A3', 'iso_a3', 'iso3', 'ISO', 'iso', 'cca3', 'ISO_A2', 'iso_a2'
    ]);
    return !country && !iso;
}

function _loomaMapBuildContinentClickHtml(props) {
    // Minimal card for continent features: ONLY name, total population and
    // total area. The full country fact list (capital, GDP, currency, ...)
    // doesn't apply to a continent.
    if (!props) return null;
    var hydrated = _loomaMapHydrateCountryProps(props);
    var continent = _loomaMapPickProp(hydrated, ['continent', 'CONTINENT']);
    var population = _loomaMapPickProp(hydrated, ['population', 'POP_EST', 'pop_est', 'pop']);
    var areaKm2 = _loomaMapPickProp(hydrated, ['area_km2', 'area_sq_km', 'area_sqkm', 'area', 'AREA_KM2', 'sqkm']);

    var rows = [];
    if (continent) rows.push('<div class="country-card-title">' + _loomaMapEscapeHtml(continent) + '</div>');
    if (_loomaMapHasFactValueHtml(population)) {
        rows.push(
            '<div class="country-fact-card"><b>Population</b>' +
            '<span class="country-fact-value">' +
            _loomaMapSafeFactValueHtml(toCommas('' + population)) +
            '</span></div>'
        );
    }
    if (_loomaMapHasFactValueHtml(areaKm2)) {
        rows.push(
            '<div class="country-fact-card"><b>Total Area</b>' +
            '<span class="country-fact-value">' +
            _loomaMapSafeFactValueHtml(_loomaMapFormatArea(areaKm2)) +
            '</span></div>'
        );
    }
    return rows.join('');
}

function _loomaMapIsCapitalFeatureProps(props) {
    if (!props) return false;
    var cityName = _loomaMapPickProp(props, ['name', 'NAME', 'city', 'CITY']);
    var countryName = _loomaMapPickProp(props, ['country', 'country_name', 'admin', 'ADMIN']);
    return !!(
        _loomaMapPickProp(props, ['capital_population']) ||
        _loomaMapPickProp(props, ['combined']) ||
        (cityName && countryName && _loomaMapNormalizeLookupName(cityName) !== _loomaMapNormalizeLookupName(countryName))
    );
}

function _loomaMapBuildCountryClickHtml(props) {
    // Returns ONLY the country card body (name + the standard fact list).
    // The capital card is built independently by _loomaMapBuildCapitalCardHtml
    // and shown as a popup over the capital marker.
    if (!props) return null;

    // Continent features (no country/ISO, only `continent` + facts) use a
    // simpler card: name + total population + total area, nothing else.
    if (_loomaMapIsContinentFeatureProps(props)) {
        return _loomaMapBuildContinentClickHtml(props);
    }

    var hydrated = _loomaMapHydrateCountryProps(props);
    var supplemental = _loomaMapSupplementalCountryFacts(props);
    var name = _loomaMapCountryDisplayName(hydrated);
    var capital = _loomaMapPickProp(hydrated, ['capital', 'CAPITAL']);
    // When the click came from a city marker, hydrated.population is the city
    // pop — prefer supplemental.population so the country panel always shows
    // the country's population.
    var population = _loomaMapPickProp(supplemental, ['population']) ||
                     _loomaMapPickProp(hydrated, ['population', 'POP_EST', 'pop_est', 'pop']);
    var gdp = _loomaMapPickProp(hydrated, ['gdp_usd', 'gdp', 'gdp_current_usd', 'pib']);
    var highest = _loomaMapPickProp(hydrated, ['highest_point_m', 'highest_m', 'elev_m', 'elevation_m', 'alt_m']);
    var currency = _loomaMapPickProp(hydrated, ['currency', 'currency_name', 'curr_name', 'money', 'monetary_unit']);
    var language = _loomaMapPickProp(hydrated, ['language', 'languages', 'official_language', 'official_languages', 'lang']);
    var areaKm2 = _loomaMapPickProp(hydrated, ['area_km2', 'area_sq_km', 'area_sqkm', 'area', 'AREA_KM2', 'sqkm']);

    function hasValue(value) {
        return value !== null && value !== undefined && ('' + value).trim() !== '';
    }

    if (!hasValue(name)) {
        name = _loomaMapPickProp(props, ['combined', 'id', 'ISO_A3', 'iso3', 'iso']);
    }
    if (!hasValue(name) && !hasValue(capital) && !hasValue(population) && !hasValue(highest) &&
        !hasValue(gdp) && !hasValue(currency) && !hasValue(language) && !hasValue(areaKm2)) {
        name = 'Country';
    }

    var rows = [];
    if (name) rows.push('<div class="country-card-title">' + _loomaMapEscapeHtml(name) + '</div>');
    _loomaMapCountryFacts(hydrated).forEach(function (fact) {
        rows.push(
            '<div class="country-fact-card"><b>' + _loomaMapEscapeHtml(fact.label) +
            '</b><span class="country-fact-value">' + _loomaMapSafeFactValueHtml(fact.valueHtml) + '</span></div>'
        );
    });

    return rows.join('');
}

function _loomaMapFormatCapitalDateTime(tzIana, tzOffsetMinutes) {
    // dd:MM:YY HH:mm:ss in the capital's local time, ticking every second.
    var d = new Date();
    var f = null;
    if (tzIana) {
        try {
            var parts = new Intl.DateTimeFormat('en-GB', {
                timeZone: tzIana,
                year: '2-digit', month: '2-digit', day: '2-digit',
                hour: '2-digit', minute: '2-digit', second: '2-digit',
                hour12: false
            }).formatToParts(d);
            f = {};
            parts.forEach(function (p) { f[p.type] = p.value; });
        } catch (_) { /* fall through to offset */ }
    }
    if (!f) {
        var off = _loomaMapAsNumber(tzOffsetMinutes);
        if (off === null) return null;
        var utcMs = d.getTime() + d.getTimezoneOffset() * 60000;
        var local = new Date(utcMs + off * 60000);
        f = {
            day: String(local.getDate()).padStart(2, '0'),
            month: String(local.getMonth() + 1).padStart(2, '0'),
            year: String(local.getFullYear()).slice(-2),
            hour: String(local.getHours()).padStart(2, '0'),
            minute: String(local.getMinutes()).padStart(2, '0'),
            second: String(local.getSeconds()).padStart(2, '0')
        };
    }
    // Handle the rare "24" hour reported by Intl at midnight on some engines.
    if (f.hour === '24') f.hour = '00';
    return f.day + '/' + f.month + '/' + f.year + ' ' +
        f.hour + ':' + f.minute + ':' + f.second;
}

var _loomaMapCapitalTickerInterval = null;
var _loomaMapCapitalTickerTzIana = null;
var _loomaMapCapitalTickerTzOff = null;

function _loomaMapStartCapitalTimeTicker(tzIana, tzOff) {
    _loomaMapStopCapitalTimeTicker();
    _loomaMapCapitalTickerTzIana = tzIana || null;
    _loomaMapCapitalTickerTzOff = tzOff;
    _loomaMapCapitalTickerInterval = setInterval(function () {
        var els = document.querySelectorAll('.capital-marker-card .capital-local-time');
        if (!els.length) {
            _loomaMapStopCapitalTimeTicker();
            return;
        }
        var formatted = _loomaMapFormatCapitalDateTime(_loomaMapCapitalTickerTzIana, _loomaMapCapitalTickerTzOff);
        for (var i = 0; i < els.length; i++) {
            els[i].textContent = formatted || '-';
        }
    }, 1000);
}

function _loomaMapStopCapitalTimeTicker() {
    if (_loomaMapCapitalTickerInterval) {
        clearInterval(_loomaMapCapitalTickerInterval);
        _loomaMapCapitalTickerInterval = null;
    }
}

function _loomaMapBuildPlaceCardHtml(props, imageLink, opts) {
    // Generic place card: title (the feature name) + a fact row per property
    // listed in the layer's `inPop`. Used for Nepal lakes / mountains /
    // temples / cities so they share the same visual format as the world map
    // capital popups, but with the layer's own field set.
    if (!props) return null;
    opts = opts || {};
    var inPopStr = opts.inPop || '';
    var imageKey = opts.imageKey || 'name';

    var title = _loomaMapPickProp(props, ['name', 'NAME']) ||
                _loomaMapPickProp(props, ['title', 'TITLE']) ||
                'Place';

    var rows = [];
    Object.keys(props).forEach(function (k) {
        // Skip the title field, the image-source field, and anything not in inPop.
        if (k === 'name' || k === 'NAME' || k === 'title' || k === 'TITLE') return;
        if (k === imageKey) return;
        if (inPopStr && inPopStr.indexOf(k) === -1) return;
        var v = props[k];
        if (v === null || v === undefined || ('' + v).trim() === '') return;
        var formatted = _loomaMapFormatProp(k, v);
        if (!_loomaMapHasFactValueHtml(formatted.valueHtml)) return;
        rows.push(
            '<div class="country-fact-card place-fact-card"><b>' +
            _loomaMapEscapeHtml(formatted.label) +
            '</b><span class="country-fact-value">' +
            _loomaMapSafeFactValueHtml(formatted.valueHtml) +
            '</span></div>'
        );
    });

    var popExtension = (data && data.info && data.info.popExtension) || 'jpg';
    var photoCandidates = _loomaMapBuildCapitalPhotoCandidates(title, popExtension);
    if (imageLink && photoCandidates.indexOf(imageLink) === -1) photoCandidates.unshift(imageLink);
    var firstPhoto = photoCandidates[0] || imageLink || '';
    var candidatesAttr = _loomaMapEscapeHtml(JSON.stringify(photoCandidates));
    var imageHtml = firstPhoto
        ? '<img class="capital-card-photo" src="' + _loomaMapEscapeHtml(firstPhoto) +
          '" data-photo-candidates="' + candidatesAttr + '" data-photo-index="0" alt="">'
        : '';

    var infoHtml = '<div class="capital-card-title">' + _loomaMapEscapeHtml(title) + '</div>' + rows.join('');
    return (
        '<div class="capital-card-layout">' +
            imageHtml +
            '<div class="capital-card-info">' + infoHtml + '</div>' +
        '</div>'
    );
}

function _loomaMapBuildCapitalCardHtml(capitalProps, imageLink, opts) {
    // Capital popup body shown OVER the marker on the map.
    //   placeKind === 'capital' → name + capital_population(% of country) + local datetime
    //   placeKind === 'city'    → name + city population + local datetime
    //   placeKind === 'place'   → name + generic fact list driven by the layer's `inPop`
    //                             (used for Nepal lakes / temples / mountains / cities)
    // Layout in all cases: image on the LEFT, info column on the RIGHT.
    opts = opts || {};
    var placeKind = opts.placeKind || 'capital';
    if (!capitalProps) return null;

    if (placeKind === 'place') {
        return _loomaMapBuildPlaceCardHtml(capitalProps, imageLink, opts);
    }

    var hydrated = _loomaMapHydrateCountryProps(capitalProps);
    // City name: prefer the 'capital' field (always the city name across every
    // geojson schema we have), then fall back to 'name'/'city' which are only
    // set on Asia + world capitals. Never trust 'name' first — in some capital
    // geojsons there's no 'name' and we'd skip to country fields by accident.
    var cityName = (placeKind === 'city')
        ? (_loomaMapPickProp(capitalProps, ['name', 'NAME', 'city', 'CITY']) ||
            _loomaMapPickProp(capitalProps, ['capital', 'CAPITAL']) ||
            _loomaMapPickProp(hydrated, ['capital', 'CAPITAL']))
        : (_loomaMapPickProp(capitalProps, ['capital', 'CAPITAL']) ||
            _loomaMapPickProp(hydrated, ['capital', 'CAPITAL']) ||
            _loomaMapPickProp(capitalProps, ['name', 'NAME', 'city', 'CITY']));
    // Capital population: ONLY use the capital_population field. The bare
    // 'population' field in non-Asian capital geojsons is actually the country
    // population, so falling back to it shows the wrong ratio (100%). Better
    // to show '-' than wrong data when capital_population is unknown.
    var capPop = (placeKind === 'city')
        ? (_loomaMapPickProp(capitalProps, ['population', 'capital_population']) ||
            _loomaMapPickProp(hydrated, ['capital_population']))
        : (_loomaMapPickProp(capitalProps, ['capital_population']) ||
            _loomaMapPickProp(hydrated, ['capital_population']));
    // Country pop for the "(X%)" ratio after the city/capital pop. The
    // hydrated value can already be the city pop on city features — pull the
    // real country pop from supplemental directly.
    var supplementalForPop = _loomaMapSupplementalCountryFacts(capitalProps);
    var countryPop = _loomaMapPickProp(supplementalForPop, ['population']) ||
                     _loomaMapPickProp(hydrated, ['POP_EST', 'pop_est', 'pop']);

    var capPopN = _loomaMapAsNumber(capPop);
    var countryPopN = _loomaMapAsNumber(countryPop);
    var popHtml = '-';
    if (capPopN !== null) {
        popHtml = toCommas('' + capPopN);
        if (countryPopN !== null && countryPopN > 0) {
            popHtml += ' (' + ((capPopN / countryPopN) * 100).toFixed(2) + '%)';
        }
    }

    var tzIana = _loomaMapPickProp(hydrated, ['tz_iana', 'timezone_iana', 'timezone']);
    var tzOff = _loomaMapPickProp(hydrated, ['tz_offset_minutes', 'tz_offset']);
    var localDateTime = _loomaMapFormatCapitalDateTime(tzIana, tzOff);

    // Build a fallback chain of photo URLs so capitals whose photo exists
    // under a slightly different filename (case, accents, extension) still
    // resolve a picture. The originally-computed imageLink is tried first.
    var popExtension = (data && data.info && data.info.popExtension) || 'jpg';
    var photoCandidates = _loomaMapBuildCapitalPhotoCandidates(cityName, popExtension);
    if (imageLink && photoCandidates.indexOf(imageLink) === -1) photoCandidates.unshift(imageLink);
    var firstPhoto = photoCandidates[0] || imageLink || '';
    var candidatesAttr = _loomaMapEscapeHtml(JSON.stringify(photoCandidates));
    var imageHtml = firstPhoto
        ? '<img class="capital-card-photo" src="' + _loomaMapEscapeHtml(firstPhoto) +
          '" data-photo-candidates="' + candidatesAttr + '" data-photo-index="0" alt="">'
        : '';

    var infoRows = [];
    infoRows.push('<div class="capital-card-title">' + _loomaMapEscapeHtml(cityName || 'Capital') + '</div>');
    if (_loomaMapHasFactValueHtml(popHtml)) {
        infoRows.push(
            '<div class="country-fact-card capital-fact-card"><b>Population</b>' +
            '<span class="country-fact-value">' +
            _loomaMapSafeFactValueHtml(popHtml) +
            '</span></div>'
        );
    }
    if (_loomaMapHasFactValueHtml(localDateTime)) {
        infoRows.push(
            '<div class="country-fact-card capital-fact-card"><b>Local Date &amp; Time</b>' +
            '<span class="country-fact-value capital-local-time">' +
            _loomaMapSafeFactValueHtml(localDateTime) +
            '</span></div>'
        );
    }

    return (
        '<div class="capital-card-layout">' +
            imageHtml +
            '<div class="capital-card-info">' + infoRows.join('') + '</div>' +
        '</div>'
    );
}

function _loomaMapEnsureCountryClickPanel() {
    if (countryClickPanel) return countryClickPanel;

    countryClickPanel = L.control({position: 'topright'});
    countryClickPanel.onAdd = function () {
        var div = L.DomUtil.create('div', 'looma-country-panel leaflet-control');
        // Top-right panel: the flag + the country card.
        // The capital card is NOT here — it appears as a popup directly
        // over the capital marker on the map when the user clicks it.
        div.innerHTML =
            '<div class="flag-wrap empty"><img class="flag" alt=""></div>' +
            '<div class="panel-card country-card"><div class="card-body"></div></div>';
        L.DomEvent.disableClickPropagation(div);
        L.DomEvent.disableScrollPropagation(div);
        countryClickPanel._div = div;
        return div;
    };
    countryClickPanel.addTo(map);
    return countryClickPanel;
}

function _loomaMapUpdateCountryPanelFlag(props, extension, keepPanelVisible) {
    var panel = _loomaMapEnsureCountryClickPanel();
    var div = panel._div;
    var wrap = div.querySelector('.flag-wrap');
    var img = div.querySelector('.flag');
    var supplemental = _loomaMapSupplementalCountryFacts(props);
    var iso = _loomaMapGuessCountryISO(props) || supplemental.iso || supplemental.ISO_A3 || supplemental.iso3;
    var iso2 = _loomaMapPickProp(props, ['ISO_A2', 'iso_a2', 'iso2', 'cca2']) || supplemental.iso2;
    // Reset previous handlers/state
    try { img.onload = img.onerror = null; } catch (_) {}
    img.removeAttribute('src');
    delete img.dataset.flagFallback;
    wrap.classList.add('empty');
    div.classList.remove('has-flag');

    if (!iso) {
        if (keepPanelVisible) div.classList.add('open');
        else div.classList.remove('open');
        return;
    }
    if (!extension) extension = 'png';

    var isoName = ('' + iso).replace(/ /gi, '_');

    // Open the flag area immediately; onload/onerror below only refine the
    // loaded/fallback state. This keeps the country flag visible on selection
    // instead of waiting for the image event before the panel opens.
    div.classList.add('has-flag');
    wrap.classList.remove('empty');

    img.onload = function () {
        div.classList.add('has-flag');
        wrap.classList.remove('empty');
    };

    var flagCandidates = [
        getPhotoLink(isoName, extension),
        getPhotoLink(isoName, extension, '../content'),
        getPhotoLink(isoName, extension, 'content')
    ];
    if (extension.toLowerCase() !== 'png') {
        flagCandidates.push(getPhotoLink(isoName, 'png'));
        flagCandidates.push(getPhotoLink(isoName, 'png', '../content'));
        flagCandidates.push(getPhotoLink(isoName, 'png', 'content'));
    }
    if (extension.toLowerCase() !== 'jpg') {
        flagCandidates.push(getPhotoLink(isoName, 'jpg'));
        flagCandidates.push(getPhotoLink(isoName, 'jpg', '../content'));
        flagCandidates.push(getPhotoLink(isoName, 'jpg', 'content'));
    }
    // w640 (not w320) so the flag stays crisp at the larger classroom panel size.
    if (iso2) flagCandidates.push('https://flagcdn.com/w640/' + ('' + iso2).toLowerCase() + '.png');

    img.onerror = function () {
        var idx = Number(img.dataset.flagCandidateIndex || '0') + 1;
        if (idx < flagCandidates.length) {
            img.dataset.flagCandidateIndex = '' + idx;
            img.src = flagCandidates[idx];
            return;
        }
        wrap.classList.add('empty');
        div.classList.remove('has-flag');
        img.removeAttribute('src');
    };

    img.dataset.flagCandidateIndex = '0';
    img.src = flagCandidates[0];
    if (keepPanelVisible) div.classList.add('open');
}

function _loomaMapShowCountryHoverFlag(props) {
    if (!_loomaMapBuildCountryClickHtml(props)) return;
    if (countryClickPanel && countryClickPanel._div && countryClickPanel._div.classList.contains('open')) return;
    _loomaMapUpdateCountryPanelFlag(props, data && data.info ? data.info.infoExtension : null);
}

function _loomaMapShowCountryClickInfo(e) {
    try {
        if (!e || !e.target || !e.target.feature) return;
        if (e.originalEvent) L.DomEvent.stopPropagation(e.originalEvent);
        _loomaMapShowCountryClickProps(e.target.feature.properties || {});
    } catch (err) {
        console.warn('country click panel failed', err);
    }
}

function _loomaMapShowCountryClickProps(props) {
    // Click on a country shape: open ONLY the country card (and its flag).
    // Close any capital popup that was open over a marker.
    try {
        countryClickJustOpened = true;
        setTimeout(function () { countryClickJustOpened = false; }, 250);
        _loomaMapRenderCountryCard(props);
        if (typeof map !== 'undefined' && map && map.closePopup) map.closePopup();

        var iso = _loomaMapGuessCountryISO(props);
        var needLoadSupplemental = false;
        try {
            if (iso) {
                var isoU = ('' + iso).toUpperCase();
                if (!supplementalCountryFacts || !supplementalCountryFacts[isoU]) needLoadSupplemental = true;
            } else {
                if (!supplementalCountryFacts || Object.keys(supplementalCountryFacts).length === 0) needLoadSupplemental = true;
            }
        } catch (_) { needLoadSupplemental = true; }

        if (needLoadSupplemental) {
            _loomaMapLoadSupplementalCountryFacts().done(function () {
                _loomaMapHydrateLoadedLayers();
                _loomaMapRenderCountryCard(props);
            });
        }
    } catch (err) {
        console.warn('country click panel failed', err);
    }
}

function _loomaMapShowCapitalClickProps(capitalProps, imageLink, marker, opts) {
    // Click on a marker: open the country card (top-right) AND a popup
    // directly over the marker. Generic 'place' features (Nepal lakes,
    // temples, mountains, cities) don't have country-level facts — for those
    // we skip the country panel entirely and only show the marker popup.
    opts = opts || {};
    var popupOpts = {open: true, placeKind: opts.placeKind, inPop: opts.inPop, imageKey: opts.imageKey};
    try {
        countryClickJustOpened = true;
        setTimeout(function () { countryClickJustOpened = false; }, 250);

        if (opts.placeKind === 'place') {
            _loomaMapCloseCountryPanel();
            _loomaMapShowCapitalPopupAtMarker(capitalProps, marker, imageLink, popupOpts);
            return;
        }

        _loomaMapRenderCountryCard(capitalProps);
        _loomaMapShowCapitalPopupAtMarker(capitalProps, marker, imageLink, popupOpts);

        // If we don't yet have the supplemental country facts, load them and
        // re-render once they're available (capital markers usually carry
        // city props but rely on supplemental data for country fields).
        var needLoadSupplemental = !supplementalCountryFacts || Object.keys(supplementalCountryFacts).length === 0;
        if (!needLoadSupplemental) {
            var iso = _loomaMapGuessCountryISO(capitalProps);
            if (iso) {
                var isoU = ('' + iso).toUpperCase();
                if (!supplementalCountryFacts[isoU]) needLoadSupplemental = true;
            }
        }
        if (needLoadSupplemental) {
            _loomaMapLoadSupplementalCountryFacts().done(function () {
                _loomaMapHydrateLoadedLayers();
                _loomaMapRenderCountryCard(capitalProps);
                _loomaMapShowCapitalPopupAtMarker(capitalProps, marker, imageLink, {placeKind: opts.placeKind, inPop: opts.inPop, imageKey: opts.imageKey});
            });
        }
    } catch (err) {
        console.warn('capital click panel failed', err);
    }
}

function _loomaMapRenderCountryCard(props, opts) {
    opts = opts || {};
    var hydrated = _loomaMapHydrateCountryProps(props);
    var html = _loomaMapBuildCountryClickHtml(hydrated);
    var panel = _loomaMapEnsureCountryClickPanel();
    panel._div.classList.add('open');
    // Continents don't have a flag, so hide it for continent features even
    // when the caller didn't pass hideFlag explicitly.
    var hideFlag = opts.hideFlag || _loomaMapIsContinentFeatureProps(props);
    if (hideFlag) {
        _loomaMapHideFlag();
    } else {
        _loomaMapUpdateCountryPanelFlag(hydrated, data && data.info ? data.info.infoExtension : null, true);
    }
    var card = panel._div.querySelector('.country-card');
    if (!card) return;
    card.querySelector('.card-body').innerHTML = html || _loomaMapBuildCountryClickHtml({country_name: 'Country'});
    card.classList.remove('open');
    // Schedule the open transition so the CSS picks up the new max-height.
    setTimeout(function () { card.classList.add('open'); }, 20);
}

function _loomaMapHideFlag() {
    // Clear flag state but keep the panel visible so the country card can show.
    if (!countryClickPanel || !countryClickPanel._div) return;
    var div = countryClickPanel._div;
    var wrap = div.querySelector('.flag-wrap');
    var img = div.querySelector('.flag');
    try { if (img) img.onload = img.onerror = null; } catch (_) {}
    if (img) {
        img.removeAttribute('src');
        delete img.dataset.flagFallback;
    }
    if (wrap) wrap.classList.add('empty');
    div.classList.remove('has-flag');
    div.classList.add('open');
}

function _loomaMapShowCapitalPopupAtMarker(capitalProps, marker, imageLink, opts) {
    // Render the capital-info container as a Leaflet popup directly on top
    // of the capital marker. This is the ONLY place the capital card shows.
    if (!marker) return;
    opts = opts || {};
    var html = _loomaMapBuildCapitalCardHtml(capitalProps, imageLink, opts);
    if (!html) return;
    var isPlace = opts && opts.placeKind === 'place';
    var popupHtml = '<div class="capital-marker-card' + (isPlace ? ' place-marker-card' : '') + '">' + html + '</div>';
    var existingPopup = marker.getPopup ? marker.getPopup() : null;
    if (existingPopup) {
        existingPopup.setContent(popupHtml);
    } else {
        // Generic place cards (Nepal lakes/temples/mountains/cities) have
        // more fact rows than the capital card — let the popup grow wider so
        // long values like "Tectonic / largest in Nepal" don't overflow.
        marker.bindPopup(popupHtml, {
            className: 'capital-marker-popup',
            closeButton: true,
            autoClose: true,
            autoPan: true,
            keepInView: true,
            maxWidth: isPlace ? 720 : 480,
            minWidth: isPlace ? 320 : 360
        });
    }
    if (opts.open) marker.openPopup();

    // Wire up the photo onerror fallback chain after the popup DOM exists.
    // Without this, capitals with a slightly-off photo filename get a broken
    // image. The candidates were embedded by _loomaMapBuildCapitalCardHtml.
    setTimeout(function () {
        var imgs = document.querySelectorAll('.capital-marker-card img.capital-card-photo');
        for (var i = 0; i < imgs.length; i++) _loomaMapWireCapitalPhotoFallback(imgs[i]);
    }, 0);

    // Start the ticking clock for the capital's local date/time. Uses the
    // hydrated tz data so the value matches what's already painted in the DOM.
    var hydrated = _loomaMapHydrateCountryProps(capitalProps);
    var tzIana = _loomaMapPickProp(hydrated, ['tz_iana', 'timezone_iana', 'timezone']);
    var tzOff = _loomaMapPickProp(hydrated, ['tz_offset_minutes', 'tz_offset']);
    _loomaMapStartCapitalTimeTicker(tzIana, tzOff);
}

function _loomaMapWireCapitalPhotoFallback(img) {
    if (!img || img._loomaPhotoFallbackWired) return;
    img._loomaPhotoFallbackWired = true;
    var raw = img.getAttribute('data-photo-candidates') || '[]';
    var candidates;
    try { candidates = JSON.parse(raw); } catch (_) { candidates = []; }
    if (!candidates.length) return;
    function tryNext() {
        var idx = Number(img.getAttribute('data-photo-index') || '0') + 1;
        if (idx < candidates.length) {
            img.setAttribute('data-photo-index', '' + idx);
            img.src = candidates[idx];
            return;
        }
        img.onerror = null;
        img.style.display = 'none';
    }
    img.onerror = tryNext;
    // The IMG may have already failed before onerror was wired (we attach via
    // setTimeout after the popup HTML is injected). naturalWidth === 0 on a
    // completed image means it loaded with no pixels — i.e. it 404'd.
    if (img.complete && img.naturalWidth === 0) tryNext();
}

function _loomaMapCloseCountryPanel() {
    // Close everything — flag, country card, and any capital popup that may
    // be open over a marker. Called when the user clicks empty background.
    _loomaMapStopCapitalTimeTicker();
    if (typeof map !== 'undefined' && map && map.closePopup) map.closePopup();
    if (!countryClickPanel || !countryClickPanel._div) return;
    var div = countryClickPanel._div;
    var wrap = div.querySelector('.flag-wrap');
    var img = div.querySelector('.flag');
    var countryCard = div.querySelector('.country-card');
    div.classList.remove('has-flag', 'open');
    if (wrap) wrap.classList.add('empty');
    if (img) img.removeAttribute('src');
    if (countryCard) countryCard.classList.remove('open');
    // Clear the card body after the close animation finishes so subsequent
    // opens don't briefly flash the previous content.
    setTimeout(function () {
        if (countryCard && !countryCard.classList.contains('open')) {
            var b = countryCard.querySelector('.card-body');
            if (b) b.innerHTML = '';
        }
    }, 500);
}

function _loomaMapLoadSupplementalCountryFacts() {
    if (supplementalCountryFactsLoaded) return $.Deferred().resolve(supplementalCountryFacts).promise();
    if (supplementalCountryFactsRequest) return supplementalCountryFactsRequest;

    var urls = [
        '/content/maps/json/country_facts_restcountries.json?' + LOOMA_MAP_CACHE_BUSTER,
        '../content/maps/json/country_facts_restcountries.json?' + LOOMA_MAP_CACHE_BUSTER,
        'content/maps/json/country_facts_restcountries.json?' + LOOMA_MAP_CACHE_BUSTER
    ];
    var deferred = $.Deferred();
    supplementalCountryFactsRequest = deferred.promise();

    function indexFacts(facts) {
        supplementalCountryFacts = facts || {};
        supplementalCountryFactsByIso2 = {};
        supplementalCountryFactsByName = {};
        supplementalCountryFactsByCapital = {};
        Object.keys(supplementalCountryFacts).forEach(function (iso) {
            var fact = supplementalCountryFacts[iso] || {};
            if (fact.iso2) supplementalCountryFactsByIso2[('' + fact.iso2).toUpperCase()] = fact;
            [fact.name, fact.admin, fact.country, fact.official_name].forEach(function (name) {
                var normalized = _loomaMapNormalizeLookupName(name);
                if (normalized) supplementalCountryFactsByName[normalized] = fact;
            });
            var adminNorm = _loomaMapNormalizeLookupName(fact.admin || '');
            var nameNorm = _loomaMapNormalizeLookupName(fact.name || '');
            if (adminNorm.indexOf('republic of ') === 0 && nameNorm) {
                supplementalCountryFactsByName[adminNorm.replace(/^republic of /, '')] = fact;
            }
            if (adminNorm.indexOf('kingdom of ') === 0 && nameNorm) {
                supplementalCountryFactsByName[adminNorm.replace(/^kingdom of /, '')] = fact;
            }
            if (fact.capital) {
                var capNorm = _loomaMapNormalizeLookupName(fact.capital);
                if (capNorm) supplementalCountryFactsByCapital[capNorm] = fact;
            }
        });
        supplementalCountryFactsLoaded = Object.keys(supplementalCountryFacts).length > 0;
    }

    function tryUrl(index) {
        if (index >= urls.length) {
            console.error('[looma-map] FAILED to load supplemental country facts from all paths:', urls);
            supplementalCountryFactsRequest = null;
            deferred.reject();
            return;
        }
        $.getJSON(urls[index])
            .done(function (facts) {
                indexFacts(facts);
                console.log('[looma-map] supplemental loaded from ' + urls[index] + ' — ' +
                    Object.keys(supplementalCountryFacts).length + ' countries indexed');
                deferred.resolve(supplementalCountryFacts);
            })
            .fail(function () {
                tryUrl(index + 1);
            });
    }

    tryUrl(0);
    return supplementalCountryFactsRequest;
}

window._loomaMapShowCountryClickInfo = _loomaMapShowCountryClickInfo;
window._loomaMapBuildCountryClickHtml = _loomaMapBuildCountryClickHtml;
window._loomaMapCountryDisplayName = _loomaMapCountryDisplayName;

function _loomaMapSetInfoBoxVisible(visible) {
    if (!info || !info._div) return;
    info._div.style.display = visible ? '' : 'none';
    if (!visible) info._div.innerHTML = '';
}

// For a MultiPolygon feature, return the lat/lng bounds of the largest
// polygon part (by bounding-box area). Used to keep mainland-with-far-islands
// countries (Portugal + Azores/Madeira, France + Corsica, ...) from zooming
// out to a useless extent that just shows ocean.
function _loomaMapLargestPolygonBounds(geometry) {
    if (!geometry || geometry.type !== 'MultiPolygon' || !geometry.coordinates) return null;
    var bestBounds = null;
    var bestArea = 0;
    for (var i = 0; i < geometry.coordinates.length; i++) {
        var ring = geometry.coordinates[i] && geometry.coordinates[i][0];
        if (!ring || !ring.length) continue;
        var minLat = Infinity, maxLat = -Infinity, minLng = Infinity, maxLng = -Infinity;
        for (var j = 0; j < ring.length; j++) {
            var lng = ring[j][0], lat = ring[j][1];
            if (lat < minLat) minLat = lat;
            if (lat > maxLat) maxLat = lat;
            if (lng < minLng) minLng = lng;
            if (lng > maxLng) maxLng = lng;
        }
        var area = (maxLat - minLat) * (maxLng - minLng);
        if (area > bestArea) {
            bestArea = area;
            bestBounds = L.latLngBounds([minLat, minLng], [maxLat, maxLng]);
        }
    }
    return bestBounds;
}

function _loomaMapFocusFeature(layer) {
    if (!map || !layer || !layer.getBounds) return;
    try {
        var totalBounds = layer.getBounds();
        if (!totalBounds || !totalBounds.isValid || !totalBounds.isValid()) return;

        // 1. Clip to the map's panning bounds so outlying parts that fall
        //    outside the visible region (e.g. Spain's Canary Islands on the
        //    Europe map) don't drag the zoom out.
        var clippedBounds = totalBounds;
        if (mapDefaultBounds && mapDefaultBounds.isValid && mapDefaultBounds.isValid()) {
            var sw = totalBounds.getSouthWest(), ne = totalBounds.getNorthEast();
            var msw = mapDefaultBounds.getSouthWest(), mne = mapDefaultBounds.getNorthEast();
            var sLat = Math.max(sw.lat, msw.lat), nLat = Math.min(ne.lat, mne.lat);
            var wLng = Math.max(sw.lng, msw.lng), eLng = Math.min(ne.lng, mne.lng);
            if (sLat < nLat && wLng < eLng) {
                clippedBounds = L.latLngBounds([sLat, wLng], [nLat, eLng]);
            }
        }

        // 2. For MultiPolygons whose clipped extent still dwarfs the largest
        //    single polygon (e.g. Portugal mainland vs Azores), zoom to the
        //    largest part. Threshold 10x catches Portugal (12.5x) and USA
        //    (13.5x) without over-zooming archipelagos like Indonesia (~6x),
        //    Japan (~7x) or Philippines (~6x).
        var targetBounds = clippedBounds;
        var geom = layer.feature && layer.feature.geometry;
        if (geom && geom.type === 'MultiPolygon') {
            var largest = _loomaMapLargestPolygonBounds(geom);
            if (largest) {
                var cw = clippedBounds.getEast() - clippedBounds.getWest();
                var ch = clippedBounds.getNorth() - clippedBounds.getSouth();
                var lw = largest.getEast() - largest.getWest();
                var lh = largest.getNorth() - largest.getSouth();
                var clippedArea = cw * ch;
                var largestArea = lw * lh;
                if (largestArea > 0 && clippedArea > largestArea * 10) {
                    targetBounds = largest;
                }
            }
        }

        map.fitBounds(targetBounds, {
            animate: true,
            duration: 0.45,
            paddingTopLeft: [28, 28],
            paddingBottomRight: [360, 36]
        });
    } catch (_) { /* focus is best-effort */ }
}

function _loomaMapFocusDefaultBounds() {
    if (!map || !mapDefaultBounds) return;
    try {
        map.fitBounds(mapDefaultBounds, {
            animate: true,
            duration: 0.45,
            padding: [18, 18]
        });
    } catch (_) { /* focus is best-effort */ }
}

function _loomaMapIsNepalMap() {
    var title = ((data && data.title) || mapTitle || '').toLowerCase();
    return title.indexOf('nepal') !== -1 && title.indexOf('map') !== -1;
}

function _loomaMapExpandBoundsForPopupRoom(bounds) {
    if (!bounds || !bounds.isValid || !bounds.isValid()) return bounds;
    var sw = bounds.getSouthWest();
    var ne = bounds.getNorthEast();
    var latSpan = Math.max(0.1, ne.lat - sw.lat);
    var lngSpan = Math.max(0.1, ne.lng - sw.lng);
    var latPad = Math.max(2, latSpan * 1.0);
    var lngPad = Math.max(3, lngSpan * 1.0);

    return L.latLngBounds(
        L.latLng(Math.max(-85.0511, sw.lat - latPad), Math.max(-180, sw.lng - lngPad)),
        L.latLng(Math.min(85.0511, ne.lat + latPad), Math.min(180, ne.lng + lngPad))
    );
}

function _loomaMapIsNepalAdministrativeLayer() {
    return _loomaMapIsNepalMap() &&
        data && data.info && data.info.threeLayer === "true" &&
        currentBase >= 0 && currentBase <= 2;
}

function _loomaMapNepalFeatureName(layerOrProps) {
    var feature = layerOrProps && layerOrProps.feature;
    var props = feature ? feature.properties : layerOrProps;
    if (!props) return '';
    if (currentBase === 0) return _loomaMapPickProp(props, ['title', 'Province', 'PROVINCE', 'name', 'NAME']) || '';
    if (currentBase === 1) return _loomaMapPickProp(props, ['DISTRICT', 'District', 'district', 'name', 'NAME']) || '';

    var muniName = _loomaMapPickProp(props, ['Municipality', 'MUNICIPALITY', 'municipality', 'Name', 'name', 'NAME']) || '';
    var id = feature && feature.id !== undefined && feature.id !== null ? feature.id : _loomaMapPickProp(props, ['id', 'ID']);
    if (id !== undefined && id !== null && id !== '' && !isNaN(id)) id = Number(id) + 1;
    return id !== undefined && id !== null && id !== '' ? (id + ' - ' + muniName) : muniName;
}

function _loomaMapNepalTooltipName(feature) {
    var props = feature ? feature.properties : null;
    if (!props) return '';

    if (_loomaMapPickProp(props, ['Municipality', 'MUNICIPALITY', 'municipality', 'Name', 'name', 'NAME'])) {
        var muniName = _loomaMapPickProp(props, ['Municipality', 'MUNICIPALITY', 'municipality', 'Name', 'name', 'NAME']) || '';
        var id = feature.id !== undefined && feature.id !== null ? feature.id : _loomaMapPickProp(props, ['id', 'ID']);
        if (id !== undefined && id !== null && id !== '' && !isNaN(id)) id = Number(id) + 1;
        return id !== undefined && id !== null && id !== '' ? (id + ' - ' + muniName) : muniName;
    }

    return _loomaMapPickProp(props, ['DISTRICT', 'District', 'district']) ||
        _loomaMapPickProp(props, ['title', 'Province', 'PROVINCE', 'name', 'NAME']) ||
        '';
}

function _loomaMapEnsureNepalSelectionPanel() {
    if (nepalSelectionPanel || !map) return;
    nepalSelectionPanel = L.control({position: 'topright'});
    nepalSelectionPanel.onAdd = function () {
        this._div = L.DomUtil.create('div', 'info nepal-selection-panel');
        this._div.style.display = 'none';
        return this._div;
    };
    nepalSelectionPanel.addTo(map);
}

function _loomaMapEnsureNepalHoverPanel() {
    if (nepalHoverPanel || !map) return;
    nepalHoverPanel = L.control({position: 'topright'});
    nepalHoverPanel.onAdd = function () {
        this._div = L.DomUtil.create('div', 'info nepal-hover-panel');
        this._div.style.display = 'none';
        return this._div;
    };
    nepalHoverPanel.addTo(map);
}

function _loomaMapShowNepalHoverName(name) {
    _loomaMapEnsureNepalHoverPanel();
    if (!nepalHoverPanel || !nepalHoverPanel._div) return;
    nepalHoverPanel._div.innerHTML = _loomaMapEscapeHtml(name || '');
    nepalHoverPanel._div.style.display = name ? '' : 'none';
}

function _loomaMapHideNepalSelectionDetails() {
    if (!nepalSelectionPanel || !nepalSelectionPanel._div) return;
    nepalSelectionPanel._div.innerHTML = '';
    nepalSelectionPanel._div.style.display = 'none';
}

function _loomaMapNepalPickDetail(props, keys) {
    var value = _loomaMapPickProp(props, keys);
    if (value === null || value === undefined || ('' + value).trim() === '') return null;
    return value;
}

function _loomaMapNepalDetailRow(label, value) {
    if (value === null || value === undefined || ('' + value).trim() === '') return '';
    return '<div class="country-fact-card"><b>' + _loomaMapEscapeHtml(label) +
        '</b><span>' + _loomaMapEscapeHtml(toCommas('' + value)) + '</span></div>';
}

function _loomaMapNepalFormatDetailValue(key, value) {
    var raw = (value === null || value === undefined) ? '' : ('' + value).trim();
    if (!raw) return '';
    var lowerKey = ('' + key).toLowerCase();
    var numeric = _loomaMapAsNumber(raw);
    if ((lowerKey.indexOf('area') !== -1 || lowerKey.indexOf('km²') !== -1 || lowerKey.indexOf('kmâ²') !== -1) && numeric !== null) {
        var acres = numeric * 247.105381;
        return toCommas('' + Math.round(numeric * 100) / 100) + ' km² / ' + toCommas('' + Math.round(acres)) + ' acres';
    }
    if (numeric !== null && lowerKey !== 'sex ratio') {
        return toCommas('' + raw);
    }
    return raw;
}

function _loomaMapNepalPrettyKey(key) {
    var labels = {
        STATE_CODE: 'State code',
        Type_GN: 'Local level type',
        locallevel_fullcode: 'Local level full code',
        locallevel_code: 'Local level code',
        district_code: 'District code',
        CensusProvinceCode: 'Census province code',
        CensusDistrictCode: 'Census district code',
        CensusMunicipalityCode: 'Census municipality code',
        CensusName: 'Census name',
        Wards: 'Wards',
        Male: 'Male',
        Female: 'Female',
        'Sex ratio': 'Sex ratio',
        'Population (2021)': 'Population (2021)',
        'Population (2011)': 'Population (2011)',
        'Area (km²)': 'Area'
    };
    if (labels[key]) return labels[key];
    return ('' + key).replace(/_/g, ' ').replace(/\b\w/g, function (letter) { return letter.toUpperCase(); });
}

function _loomaMapNepalDetailRowFromProps(label, props, keys, shownKeys) {
    var value = _loomaMapNepalPickDetail(props, keys);
    if (value === null || value === undefined || ('' + value).trim() === '') return '';
    keys.forEach(function (key) { shownKeys[key] = true; });
    return _loomaMapNepalDetailRow(label, _loomaMapNepalFormatDetailValue(label, value));
}

function _loomaMapShowNepalSelectionDetails(layer) {
    _loomaMapEnsureNepalSelectionPanel();
    if (!nepalSelectionPanel || !nepalSelectionPanel._div || !layer || !layer.feature) return;
    var props = layer.feature.properties || {};
    var shownKeys = {};
    var html = '<div class="nepal-selection-title">' + _loomaMapEscapeHtml(_loomaMapNepalFeatureName(layer)) + '</div>';
    html += _loomaMapNepalDetailRowFromProps('Nepali', props, ['Nepali', 'NEPALI', 'nepali'], shownKeys);
    html += _loomaMapNepalDetailRowFromProps('Type', props, ['Type', 'Type_GN', 'type'], shownKeys);
    html += _loomaMapNepalDetailRowFromProps('District', props, ['DISTRICT', 'District', 'district'], shownKeys);
    html += _loomaMapNepalDetailRowFromProps('Province', props, ['Province', 'PROVINCE', 'province'], shownKeys);
    html += _loomaMapNepalDetailRowFromProps('Wards', props, ['Wards', 'wards', 'no_of_wards'], shownKeys);
    html += _loomaMapNepalDetailRowFromProps('Area', props, ['Area (km²)', 'Area (kmÂ²)', 'Area', 'AREA', 'area'], shownKeys);
    html += _loomaMapNepalDetailRowFromProps('Population (2021)', props, ['Population (2021)', 'Population', 'POPULATION', 'population'], shownKeys);
    html += _loomaMapNepalDetailRowFromProps('Male', props, ['Male', 'male'], shownKeys);
    html += _loomaMapNepalDetailRowFromProps('Female', props, ['Female', 'female'], shownKeys);
    html += _loomaMapNepalDetailRowFromProps('Sex ratio', props, ['Sex ratio', 'sex_ratio'], shownKeys);
    html += _loomaMapNepalDetailRowFromProps('Census name', props, ['CensusName'], shownKeys);

    Object.keys(props).forEach(function (key) {
        if (shownKeys[key]) return;
        if (['id', 'ID', 'fillColor', 'Municipality', 'MUNICIPALITY', 'Name', 'name', 'district', 'municipality', 'Province', 'province'].indexOf(key) !== -1) return;
        if (props[key] === null || props[key] === undefined || ('' + props[key]).trim() === '') return;
        html += _loomaMapNepalDetailRow(_loomaMapNepalPrettyKey(key), _loomaMapNepalFormatDetailValue(key, props[key]));
    });
    nepalSelectionPanel._div.classList.add('has-details');
    nepalSelectionPanel._div.innerHTML = html;
    nepalSelectionPanel._div.style.display = '';
}

function _loomaMapClearNepalSelection() {
    if (nepalSelectedLayer && nepalSelectedBase !== null && baseLayers && baseLayers[nepalSelectedBase]) {
        try { baseLayers[nepalSelectedBase].resetStyle(nepalSelectedLayer); } catch (_) { /* best-effort */ }
    }
    if (nepalSelectedOutlineLayer && map) {
        try { map.removeLayer(nepalSelectedOutlineLayer); } catch (_) { /* best-effort */ }
    }
    nepalSelectedLayer = null;
    nepalSelectedOutlineLayer = null;
    nepalSelectedBase = null;
    _loomaMapHideNepalSelectionDetails();
}

function _loomaMapSelectNepalFeature(layer) {
    if (!layer) return false;
    _loomaMapClearNepalSelection();
    nepalSelectedLayer = layer;
    nepalSelectedBase = currentBase;
    layer.setStyle({
        fillColor: '#ff3333',
        opacity: 1,
        fillOpacity: 0.78
    });
    nepalSelectedOutlineLayer = L.geoJson(layer.feature, {
        interactive: false,
        style: {
            color: '#d00000',
            fillOpacity: 0,
            opacity: 1,
            weight: 6
        }
    }).addTo(map);
    if (nepalSelectedOutlineLayer.bringToFront) nepalSelectedOutlineLayer.bringToFront();
    _loomaMapShowNepalSelectionDetails(layer);
    return true;
}
////////////////////////
// Create the Layers //
////////////////////////

// Sets the look of each map area
    function styleLayer(feature)
    {   var layerData = data.baseLayers;
        return {
            fillColor: getColor(feature, layerData[currentBase].style),
            weight:      layerData[currentBase].style.weight,
            opacity:     layerData[currentBase].style.opacity,
            color:       layerData[currentBase].style.color,
            fillOpacity: layerData[currentBase].style.fillOpacity
        };
    }
    
    function lookUpColor (feature) {
        return feature.properties.fillColor || "red";  //default color in case fillColor not specified
    }  //end lookUpColor
    
    // Assigns a color to a country/region/area
    function getColor(feature, style) {
        try {
            if (feature.properties.fillColor) return lookUpColor(feature); //some geoJSON has colors embedded in properties.fillColor
            
            var random = style.random, cutoffs = style.cutoffs, colors = style.colors;
            var featureUsedValue = feature.properties[style.colorFeature]; //the numerical feature used to determine the color
            var index = random?featureUsedValue % (cutoffs.length):featureUsedValue;
            
            for (var k = 0; k < colors.length - 1; k++) {
                if (index < cutoffs[k]) return colors[k];
            }
            return colors [colors.length - 1];
        }
        catch(err)
        {  //if any data is missing, just make them all blue so that the map still loads
            return 'blue';
        }
    }

////////////////////////
function loadBaseLayers (layerData) {
    
    var currentStyle = 0;
    //var arrayIndex = 0; //a counter for the array
    var nextBase = 0;
    var promises = [];
    for (var i = 0; i < layerData.length; i++) {    // Loads the base layers onto the map by reading geojson in
        //var baseLayer;
        var link = '/content/maps/json/' + layerData[i].geojson + '?' + LOOMA_MAP_CACHE_BUSTER;
        promises[i] = getMapJSON(link, i);
    }
    
    Promise.all(promises).then(function(){
            console.log('In baselayer, promises has ' + promises.length + ' entries');
            for (var j=0; j<Math.min(baseLayers.length, 2); j++) {
                if (baseLayers[j]) baseLayers[j].addTo(map);
            }
            if (baseLayers[0]) baseLayers[0].bringToFront();
            currentBase = 0;
            baseLayerButtons(layerData);}
        );
    
    
    function getMapJSON(url, index) {
        return $.getJSON(url, null)
            .done(function(result) {
                _loomaMapHydrateGeoJsonFeatures(result);
                var baseLayer = L.geoJson(result, {
                    style: styleLayer,
                    onEachFeature: onEachFeature
                });
                baseLayers[index] = baseLayer;
            })
            .fail(function(xhr, status, err) {
                console.error('Failed to load map layer geojson:', url, status, err);
                baseLayers[index] = null;
                if ($('#map-load-error').length === 0) {
                    $('#map').append(
                        "<div id='map-load-error' style='position:absolute;z-index:9999;left:10px;right:10px;top:10px;padding:8px;border-radius:6px;background:rgba(0,0,0,0.7);color:#fff;font-size:14px'>" +
                        "Map data missing/unreachable: " + url +
                        "</div>"
                    );
                }
            });
    }
    
    // Hovering listener. Calls highight/resethighlight functions
    function onEachFeature(feature, layer) {
        layer.on({
            mouseover: highlightFeature,
            mouseout:  resetHighlight,
            click: function (e) {
                if (_loomaMapIsNepalAdministrativeLayer()) {
                    countryClickJustOpened = true;
                    _loomaMapSelectNepalFeature(e.target);
                    _loomaMapFocusFeature(e.target);
                    return;
                }
                _loomaMapShowCountryClickInfo(e);
                _loomaMapFocusFeature(e.target);
            }
        });
        // Name tooltip on hover. Nepal admin layers use their local admin
        // fields; country maps use the hydrated country display name.
        try {
            var hoverName = (_loomaMapIsNepalMap() && data && data.info && data.info.threeLayer === "true") ?
                _loomaMapNepalTooltipName(feature) :
                (window._loomaMapCountryDisplayName ?
                window._loomaMapCountryDisplayName(feature.properties || {}) :
                _loomaMapPickProp(feature.properties || {}, ['country_name', 'country', 'admin', 'ADMIN', 'name', 'NAME']));
            if (hoverName) {
                layer.bindTooltip('' + hoverName, {
                    sticky: true,
                    direction: 'auto',
                    className: 'looma-country-tooltip',
                    opacity: 0.95
                });
            }
        } catch (_) { /* tooltip is non-critical */ }
    }

    // Click handler for layers where hover/highlight isn't appropriate (e.g. add-on layers).
    function _loomaMapOnEachFeatureClickInfo(feature, layer) {
        layer.on({
            click: function (e) {
                _loomaMapShowCountryClickInfo(e);
            }
        });
    }

    function _loomaMapGuessCountryISO(props) {
        if (!props) return null;
        return props.ISO_A3 || props.ISO3 || props.iso_a3 || props.iso3 || props.iso || props.cca3 || props.id || null;
    }

    function _loomaMapPickProp(props, keys) {
        if (!props) return null;
        for (var i = 0; i < keys.length; i++) {
            var k = keys[i];
            if (props[k] !== undefined && props[k] !== null && ('' + props[k]).trim() !== '') return props[k];
        }
        // try case-insensitive match
        var lower = {};
        Object.keys(props).forEach(function (k) { lower[String(k).toLowerCase()] = k; });
        for (var j = 0; j < keys.length; j++) {
            var lk = String(keys[j]).toLowerCase();
            if (lower[lk]) {
                var kk = lower[lk];
                if (props[kk] !== undefined && props[kk] !== null && ('' + props[kk]).trim() !== '') return props[kk];
            }
        }
        return null;
    }

    function _loomaMapFormatUSD(valueRaw) {
        var n = _loomaMapAsNumber(valueRaw);
        if (n === null) return (valueRaw === null || valueRaw === undefined) ? '—' : ('' + valueRaw);
        return '$' + toCommas(Math.round(n));
    }

    // Popup-specific USD formatter (use an ASCII-safe placeholder).
    function _loomaMapFormatUSDPopup(valueRaw) {
        var n = _loomaMapAsNumber(valueRaw);
        if (n === null) {
            var s = (valueRaw === null || valueRaw === undefined) ? '' : ('' + valueRaw).trim();
            return s === '' ? '-' : ('' + valueRaw);
        }
        return '$' + toCommas(Math.round(n));
    }

    // Avoid encoding issues when showing a placeholder dash in popups.
    function _loomaMapFormatUSDPlain(valueRaw) {
        var n = _loomaMapAsNumber(valueRaw);
        if (n === null) {
            var s = (valueRaw === null || valueRaw === undefined) ? '' : ('' + valueRaw).trim();
            return s === '' ? '—' : ('' + valueRaw);
        }
        return '$' + toCommas(Math.round(n));
    }

    // Compute the current local time in a country's primary timezone.
    // Uses an IANA name (e.g. "Asia/Kathmandu") when present (DST-aware),
    // and falls back to a fixed UTC offset in minutes otherwise.
    function _loomaMapLocalTime(tzIana, tzOffsetMinutes) {
        try {
            if (tzIana) {
                return new Intl.DateTimeFormat([], {
                    timeZone: tzIana, hour: '2-digit', minute: '2-digit', hour12: false
                }).format(new Date());
            }
        } catch (_) { /* invalid IANA — fall through to offset */ }
        var off = _loomaMapAsNumber(tzOffsetMinutes);
        if (off === null) return null;
        var d = new Date();
        var utcMs = d.getTime() + d.getTimezoneOffset() * 60000;
        var local = new Date(utcMs + off * 60000);
        var hh = String(local.getHours()).padStart(2, '0');
        var mm = String(local.getMinutes()).padStart(2, '0');
        return hh + ':' + mm;
    }

    function _loomaMapBuildCountryClickHtml(props) {
        return window._loomaMapBuildCountryClickHtml(props);
    }

    function _loomaMapShowCountryClickInfo(e) {
        window._loomaMapShowCountryClickInfo(e);
    }
    
    // Highlights the area that the mouse is hovering over in gray
    function highlightFeature(e) {
        var style = layerData[currentBase].style;
        var layer = e.target;
        if (layer === nepalSelectedLayer) return;
        
        if (style.onHover)
        {
            layer.setStyle({
                weight: style.onHover.weight,
                color: style.onHover.color,
                fillOpacity: style.onHover.fillOpacity
            });
        }
        else
        {
            //Default
            layer.setStyle({
                weight: 5,
                color: 'yellow',
                fillOpacity: 0.3
            });
        }
        
        if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge)
        {
            //layer.bringToFront();
            featureLayers();
        }

        if (_loomaMapIsNepalAdministrativeLayer()) {
            _loomaMapSetInfoBoxVisible(false);
            return;
        }
        
        if (window._loomaMapBuildCountryClickHtml(layer.feature.properties)) {
            _loomaMapSetInfoBoxVisible(false);
            _loomaMapShowCountryHoverFlag(layer.feature.properties);
            if (layer.openTooltip) layer.openTooltip();
        } else if (infoBoxOn) {
            _loomaMapSetInfoBoxVisible(true);
            info.update(layer.feature.properties);
        }
         
    }   //End of highlight function
    
    // Makes sure that once the country is deselected the gray is gone
    function resetHighlight(e)
    {
        var layer = e.target;
        if (layer.closeTooltip) layer.closeTooltip();
        if (layer === nepalSelectedLayer) return;
        //layer.resetStyle();
        baseLayers[currentBase].resetStyle(e.target);
        //baseLayers[currentBase].resetStyle();
        // layer.bringToBack(e.target);
        //info.update(); //Comment this out to avoid glitches when the mouse goes over the info box
    }
    
    
} // end loadBaseLayers()

////////////////////////
// Creates the buttons to toggle between alternate base layers if there are multiple bases
function _loomaMapBaseLayerButtonName(layer, index) {
    if (layer && layer.name !== undefined && layer.name !== null && ('' + layer.name).trim() !== '') {
        return '' + layer.name;
    }

    var geojson = (layer && layer.geojson ? '' + layer.geojson : '').toLowerCase();
    if (geojson.indexOf('countries') !== -1) return 'Countries';
    if (geojson.indexOf('capitals') !== -1) return 'Capitals';
    if (geojson.indexOf('provinces') !== -1) return 'Provinces';
    if (geojson.indexOf('districts') !== -1) return 'Districts';
    if (geojson.indexOf('municipalities') !== -1) return 'Municipalities';
    if (geojson.indexOf('cities') !== -1) return 'Cities';
    if (geojson.indexOf('lakes') !== -1) return 'Lakes';
    if (geojson.indexOf('temples') !== -1) return 'Temples';
    if (geojson.indexOf('mountains') !== -1) return 'Mountains';

    return 'Layer ' + (index + 1);
}

function baseLayerButtons (layerData)
{
    var bases = baseLayers.length;
    var choice = L.control({position: 'bottomleft'});
    choice.onAdd = function(map)
    {
        var div = L.DomUtil.create("div", "info");
        var baseBoxes = new Array(bases);
        var baseLabels = new Array(bases);
        for (var i = 0; i < bases; i++)
        {
            baseBoxes[i] = document.createElement('input'); // Create button
            baseBoxes[i].type= "radio";
            baseBoxes[i].name = "choice";
            baseBoxes[i].id = "id" + i;
            
            baseLabels[i] = document.createElement('text');  // Create label
            baseLabels[i].htmlFor = "id" + i;
            baseLabels[i].appendChild(document.createTextNode(' ' + _loomaMapBaseLayerButtonName(layerData[i], i) + ' '));
            
            div.appendChild(baseBoxes[i]);
            div.appendChild(baseLabels[i]);
            
            
            // Brings the base layer to the front if its button is checked
            baseBoxes[i].addEventListener('change', function()
            {
                var checked = parseInt(this.id.charAt(2));
                
                if (data.info.threeLayer === "true") {
                    //special handling for 3-level map (province, district, municipality
                    _loomaMapClearNepalSelection();
                    if (checked === 0) {
                        map.removeLayer(baseLayers[2]);
                        baseLayers[0].bringToFront();
                        currentBase = 0;
                    } else if(checked=== 1){
                        map.addLayer(baseLayers[2]);
                        baseLayers[2].bringToFront();
                        baseLayers[1].bringToFront();
                        currentBase = 1;
                    } else {
                        map.addLayer(baseLayers[2]);
                        baseLayers[2].bringToFront();
                        currentBase = 2;
                    }
                    
               } else
                    if(this.checked) {
                    //for (var x = 0; x < bases; x++) map.removeLayer(baseLayers[x]);
                    
                    //baseLayers[checked].addTo(map);
    
                    baseLayers[(checked + 1) % bases].bringToFront();
                    baseLayers[checked].bringToFront();
                    currentBase = checked;
                   featureLayers();
                }
            });
        }
        // checks the box of the initial visible layer
        baseBoxes[0].checked = true;
        
        // //baseLayers[0].bringToFront();
        return div;
    }; // end choice.onAdd function
    
    choice.addTo(map);
} // end baseLayerButtons()


function makeGeoJson(data) {
        var geoJson =
        {   "type": "FeatureCollection",
            "features": []
        };
        
        var feature = {"type": "Feature",
            "properties" : {"ip": "<IP>",
                "country": "<country>",
                "province": "<province>",
                "city":    "<city>",
                "lat":     "<lat>",
                "long":    "<long>",
                "visits":  "<visits>" },
            "geometry":{"coordinates":[],
                        "type":"Point"}
                    };
        
        data.forEach(function(datum) {
            //TO CLONE an OBJECT: let cloneObj = JSON.parse(JSON.stringify(obj));
            var temp =  JSON.parse(JSON.stringify(feature));
            temp['properties']['ip'] = datum['ip'];
            temp['properties']['country'] = "Nepal";
            temp['properties']['province'] = datum['province'];
            temp['properties']['city'] = datum['city'];
            temp['properties']['lat'] = datum['lat'];
            temp['properties']['long'] = datum['long'];
            temp['properties']['visits'] = datum['visits'];
            temp['geometry']['coordinates'].push( datum['long'], datum['lat'] );
            
            geoJson['features'].push(temp);
        });
        return geoJson;
};  // end makeGeoJson

////////////////////////
// Loads the add-on layers onto the map by reading geojson in if they exist
function loadAddOnLayers (layerData, information) {
    
            ///////////////////
            function createAddOnLayer (data, layerIndex) {
                var idx = layerIndex;
                _loomaMapHydrateGeoJsonFeatures(data);
                var addOnLayer = L.geoJson(data, {
                    pointToLayer: function (feature, latlng) {
                        feature.properties = _loomaMapHydrateCountryProps(feature.properties || {});
                        
                        var localMarker = L.circleMarker(latlng, {
                            radius: layerData[idx].style.radius,
                            color : layerData[idx].style.color,
                            weight : layerData[idx].style.weight,
                            opacity : layerData[idx].style.opacity,
                            fillOpacity : layerData[idx].style.fillOpacity,
                            fillColor : layerData[idx].style.fillColor
                        });
                        marker = localMarker;
                 
                        var popText = "";
                        var counter = 0;
                        var imageKey = "";
                        var imageData = "";
                        if (layerData[idx].image) imageKey = layerData[idx].image;
                        
                        // Same "always show population/highest point" rule as in the info-box path.
                        var POPUP_ALWAYS_SHOW = ['population', 'highest_point_m'];
                        function popupIsAlwaysShown(k) {
                            return POPUP_ALWAYS_SHOW.indexOf(String(k).toLowerCase()) !== -1;
                        }
                        Object.keys(feature.properties).forEach(function(key)
                        {
                            if(layerData[idx].inPop) {
                                var inPop = layerData[idx].inPop;
                                if (counter == 0) //the first feature is the name, and we don't need context for that
                                {
                                    if (inPop.indexOf(key) != -1)
                                    {
                                        popText += feature.properties[key].bold();
                                        popText += '<br>';
                                        counter++;
                                    }
                                } else {
                                    if (inPop.indexOf(key) != -1 || popupIsAlwaysShown(key)) {
                                        var formatted = _loomaMapFormatProp(key, feature.properties[key]);
                                        popText += formatted.label.bold() + ": " + formatted.valueHtml;
                                        popText += '<br>';
                                    }
                                }
                            } else { //if they have not specified which features to include, include all of them
                                if (counter == 0) { //the first feature is the name, and we don't need context for that
                                    popText += feature.properties[key].bold();
                                    popText += '<br>';
                                    counter++;
                                } else {
                                    var formatted = _loomaMapFormatProp(key, feature.properties[key]);
                                    popText += formatted.label.bold() + ": " + formatted.valueHtml;
                                    popText += '<br>';
                                }
                            }
                            if(imageKey == key) imageData = feature.properties[key];
                        });

                        if (!imageData && layerData[idx].image) {
                            // The configured `image` key (e.g. 'capital') isn't always
                            // present — European/Asian/world capitals expose the city
                            // name under `name` instead. Fall back to common keys so
                            // every capital can still resolve a photo.
                            imageData = _loomaMapPickProp(feature.properties, [
                                'capital', 'CAPITAL', 'name', 'NAME', 'city', 'CITY'
                            ]) || '';
                        }

                        if(imageData && imageData.indexOf(' ') !== -1) imageData = imageData.replace(/ /gi, "_")

                        if (layerData[idx].image && information.popExtension && imageData) {
                            try {
                                var imageLink = getPhotoLink(imageData, information.popExtension);
                                popText += "<img class='pop-image' src = " + imageLink + " alt = ''>";
                            }
                            catch (err) {
                                console.log("error caught!");
                            }
                        }

                        var layerKindName = String(layerData[idx].name || layerData[idx].geojson || '').toLowerCase();
                        var layerGeojson = String(layerData[idx].geojson || '').toLowerCase();
                        var isCapitalLayer  = layerKindName.indexOf('capital')  !== -1;
                        var isCityLayer     = layerKindName.indexOf('cities')   !== -1 || layerKindName.indexOf('city')    !== -1;
                        var isLakeLayer     = layerKindName.indexOf('lake')     !== -1;
                        var isMountainLayer = layerKindName.indexOf('mountain') !== -1;
                        var isTempleLayer   = layerKindName.indexOf('temple')   !== -1;
                        // Nepal Map's Cities (and lakes/temples/mountains) share the
                        // generic 'place' card so all the Nepal-specific fields
                        // (Nepali name, Province, District, Elevation, …) show up.
                        // The world map's Capitals/Cities keep the slimmer
                        // population+local-time card.
                        var isNepalAddOn = layerGeojson.indexOf('nepal') === 0;
                        var isPlaceLayer = isCapitalLayer || isCityLayer || isLakeLayer || isMountainLayer || isTempleLayer;

                        if (isPlaceLayer) {
                            var capturedImageLink = (typeof imageLink !== 'undefined') ? imageLink : '';
                            var capturedInPop = layerData[idx].inPop || '';
                            var capturedImageKey = layerData[idx].image || 'name';
                            var placeKind;
                            if (isCapitalLayer) placeKind = 'capital';
                            else if (isCityLayer && !isNepalAddOn) placeKind = 'city';
                            else placeKind = 'place';
                            localMarker.on('click', function (e) {
                                if (e.originalEvent) L.DomEvent.stopPropagation(e.originalEvent);
                                _loomaMapShowCapitalClickProps(feature.properties || {}, capturedImageLink, localMarker, {
                                    placeKind: placeKind,
                                    inPop: capturedInPop,
                                    imageKey: capturedImageKey
                                });
                            });
                        } else {
                            // Unknown layer type — keep the legacy centred Leaflet popup.
                            localMarker.bindPopup(popText, {
                                className: 'capital-popup',
                                keepInView: true,
                                width: 600, minWidth: 600, maxWidth: 600,
                            });
                        }
                        
                        // markers.addLayer(marker);
                        
                        return localMarker;
                    }
                });
                addOnLayers[idx] = addOnLayer;
                // addOnLayers[arrIndex] = markers;
                //arrIndex ++;
            }; // end createAddOnlayer()
    
            function createMarkerClusterAddOnLayer(data) {
                var markers = L.markerClusterGroup();
                var geojson = L.geoJson(data,
                    {
                        onEachFeature:function(feature, layer) {
                        var popupText = feature.properties.ip + '<br>' + feature.properties.city;
                        layer.bindPopup(popupText);
                        }
                    }
                );
                markers.addLayer(geojson);
                
                addOnLayers[0] = markers;
            }; // end createMarkerClusterAddOnLayer()
    
    //// start of loadAddOnLayers()  ////
    var promises = [];
    var marker;
    //var markers = new L.MarkerClusterGroup();
    
    if (mapTitle === 'Looma User Locations') {
        promises[0] = new Promise(function (resolve) {
            $.post("looma-database-utilities.php", {cmd: 'getLogLocations'})
                .done(function (data) {
                    try {
                        var parsed = typeof data === 'string' ? JSON.parse(data) : data;
                        var geojson = makeGeoJson(parsed || []);
                        createMarkerClusterAddOnLayer(geojson);
                    } catch (err) {
                        console.error('getLogLocations parse failed', err);
                    }
                    resolve();
                })
                .fail(function (xhr, status, err) {
                    console.error('getLogLocations failed', status, err);
                    resolve();
                });
        });
    }
    else for (var i = 0; i < layerData.length; i++)
        { var link = '/content/maps/json/' + layerData[i].geojson + '?' + LOOMA_MAP_CACHE_BUSTER;
                // Wrap in a Promise that always resolves so a single 404 doesn't
                // break Promise.all — otherwise the post-load auto-show loop
                // (which turns on the Capitals layer) never runs.
                promises[i] = (function (layerIndex, linkUrl) {
                    return new Promise(function (resolve) {
                        $.getJSON(linkUrl, function (data) {
                            createAddOnLayer(data, layerIndex);
                            resolve();
                        }).fail(function (xhr, status, err) {
                            console.error('Failed to load add-on layer geojson:', linkUrl, status, err);
                            if ($('#map-load-error').length === 0) {
                                $('#map').append(
                                    "<div id='map-load-error' style='position:absolute;z-index:9999;left:10px;right:10px;top:10px;padding:8px;border-radius:6px;background:rgba(0,0,0,0.7);color:#fff;font-size:14px'>" +
                                    "Map data missing/unreachable: " + linkUrl +
                                    "</div>"
                                );
                            }
                            resolve();
                        });
                    });
                })(i, link);
        }  // end for (i)
    
    
    Promise.all(promises).then(function() {
        console.log('In addonlayer, promises has ' + promises.length + ' entries');
        //for (var layer of addOnLayers) layer.addTo(map); //not needed. checking the box will do addTo()
        
        for (var i = 0; i < addOnLayers.length; i++) {
            var shouldShow = layerData[i] && (
                layerData[i].pre_check ||
                String(layerData[i].name || '').toLowerCase() === 'capitals'
            );
            if (addOnLayers[i] && shouldShow) {
                addOnLayers[i].addTo(map).bringToFront();
                popUpShowing[i] = true;
            }
        }
        addOnButtons(layerData);}
    );
} // end loadAddOnLayers()

///////////////////////////////////////////////////
// Creating Toggle Buttons, Info Box, and Legend //
///////////////////////////////////////////////////

////////////////////////
// Creates the checkboxes to toggle add-on layers on and off if add-on layers exist
function addOnButtons (layerData)
{
    var addOnCount = addOnLayers.length;
    var layers = L.control({position: 'bottomleft'});
    layers.onAdd = function(map) {
        var div = L.DomUtil.create("div", "info");
        var boxes = new Array(addOnLayers.length);
        var labels = new Array(addOnLayers.length);
        for (var i = 0; i < addOnCount; i++)
        {
            boxes[i] = document.createElement('input'); // Create the box
            boxes[i].type = "checkbox";
            boxes[i].id = "id" + i;
            boxes[i].checked = !!popUpShowing[i];
            labels[i] = document.createElement('text'); // Create the label
            labels[i].appendChild(document.createTextNode(' ' + layerData[i].name + ' '));

            div.appendChild(boxes[i]); // Add to map
            div.appendChild(labels[i]);
            
            boxes[i].addEventListener('change', function () {
                var numChecked = this.id.charAt(2);
                if (this.checked) {
                    popUpShowing[numChecked] = true;
                    map.addLayer(addOnLayers[numChecked]);
                } else {
                    map.removeLayer(addOnLayers[numChecked]);
                    popUpShowing[numChecked] = false;
                }
                featureLayers();
            });
        }
        
                    /*
                    for (var x = 0; x < addOnCount; x++)
                    {
                        boxes[x].addEventListener('change', function () {
            
                            var numChecked = this.id.charAt(2);
                            if (this.checked)  {
                                popUpShowing[numChecked] = true;
                                map.addLayer(addOnLayers[numChecked]);
                            } else {
                                map.removeLayer(addOnLayers[numChecked]);
                                popUpShowing[numChecked] = false;
                            }
                            featureLayers();
                        });
                    }
                    */
    /* */
        if (addOnCount > 0 && layerData[0].pre_check) {
            $(boxes[0]).prop( "checked", true );
            popUpShowing[0] = true;
            map.addLayer(addOnLayers[0]);
            addOnLayers[0].bringToFront();
        }
    /* */
        
        return div;
    };
    layers.addTo(map);
 
} // end addOnButtons()

////////////////////////
// Creates the legend for the map
function loadLegend (legendData)
{
    var legend = L.control({position: 'bottomleft'});   //Where it is
    legend.onAdd = function (map) {                     //Adds the legend
        var div = L.DomUtil.create('div', 'info legend')
        div.innerHTML += '<b>' + legendData.title + '<br></b>';//Title
        for(var i = 0; i < legendData.labels.length; i++){
            div.innerHTML += '<i style="background:' + legendData.colors[i] + '"></i> '
                + legendData.labels[i] + '<br>';
        }
        return div;
    };
    legend.addTo(map);
} // end loadLegend()

////////////////////////
// Creates the information control box in the top right
function loadInfoBox(data)
{
    // Creates the info box (Upper Right)
    info = L.control(); //Custom info for each country
    info.onAdd = function (map) {
        this._div = L.DomUtil.create('div', 'info'); //Creates a div with class "info"
        this.update();
        return this._div;
    };

    info.update = function (props)
    {
        this._div.innerHTML = ""; // Clear the div
        if (props && _loomaMapBuildCountryClickHtml(props)) {
            return;
        }
        if (props) // If a feature is passed in, evaluate what properties has and then display them
        {
            var imageKey = "";
            var counter = 0;
            var imageData = "";
            var s = "";

            if(data.baseLayers[currentBase].image)
            {//get the key for the image, if it exists
                imageKey = data.baseLayers[currentBase].image;
            }

            if(data.baseLayers[currentBase].inInfo)
            { //if we have a list of the information to include, only use the first label here
                var inInfo = data.baseLayers[currentBase].inInfo;
                Object.keys(props).forEach(function (key) {
                    if (counter == 0)
                    {//if its the first one, no key and bold
                        if (inInfo.indexOf(key) != -1)
                        {
                            s += toCommas(props[key]).bold();
                            s += '<br>'
                            counter++;
                        }
                    }

                    if(key == imageKey) //can't use else if in case the image key is first
                    { //the name of the image is in the image key, getting it
                        imageData = props[key];
                    }
                });
                // Skip the highest_point_ft field — _loomaMapFormatProp emits
                // both metres and feet from the `_m` field, so showing `_ft`
                // separately would duplicate the value.
            }
            else //if there is nothing selected in the mongo to include, print everything
            {
                Object.keys(props).forEach(function (key) {
                    if (counter == 0) {//if its the first one, no key and bold
                        s += toCommas(props[key]).bold();
                        s += '<br>'
                        counter++;
                    }
                    else
                    {
                        var formatted = _loomaMapFormatProp(key, props[key]);
                        s += formatted.label.bold() + ": " + formatted.valueHtml;
                        s += '<br>';
                    }
                    if(key == imageKey)
                    { //the name of the image is in the image key, getting it
                        imageData = props[key];
                    }
                });
            }

            if (data.baseLayers[currentBase].inInfo && _loomaMapBuildCountryClickHtml(props)) {
                s += '<div class="hover-country-facts">';
                _loomaMapCountryFacts(props).forEach(function (fact) {
                    s += '<div class="country-fact-card"><b>' + _loomaMapEscapeHtml(fact.label) +
                        '</b><span>' + fact.valueHtml + '</span></div>';
                });
                s += '</div>';
            }

            if (data.baseLayers[currentBase].image && data.info.infoExtension && !_loomaMapBuildCountryClickHtml(props))
            {//get the image if there is an image and an extension
                var imageLink = getPhotoLink(imageData, data.info.infoExtension);
                s += "<img class='info-image' src = " + imageLink + " alt = ''>" + '<br>';
            }

            this._div.innerHTML = s; //assigning the innerHTML to s
        }

        else // If no feature is passed in (undefined at the beginning) tell the user to hover over an area
        {
            this._div.innerHTML = 'Hover over an area'
        }


    }; // Used to update the control based on feature properties passed
    info.addTo(map);
} // end loadInfoBox()


//////////////////////////////
// Layer and Info Functions //
//////////////////////////////

////////////////////////
//Loops through all addOnLayers and their priorities starting with the lowest priority to highest, and brings them to the front
function featureLayers()
{
    if(addOnData)
    {
        for (var x = addOnData.length - 1; x >= 0; x--)
        {
            if (priorityOn)
            {
                var indexOfPriority = findPriority(x); //Index of the layer with the matching priority to x in the array of addOnLayers
                if (popUpShowing[indexOfPriority] == true)
                {
                    addOnLayers[indexOfPriority].bringToFront();
                }
            }
            else
            {
                //For maps with no specified priorities
                if (popUpShowing[x] == true)
                {
                    addOnLayers[x].bringToFront();
                }
            }
        }
    }
} // end featureLayers()

////////////////////////
//Finds the correct layer that has the given priority, if none matching returns value
function findPriority(value) {
    var i;
    for (i = 0; i < addOnData.length; i++)
        if (addOnData[i].priority == value) return i;
    return value;
} // end findPriority()

////////////////////////
// Gets the flag link based on the country (photo link is (country id).png)
function getPhotoLink(iso, extension, contentRoot) {
    contentRoot = contentRoot || '/content';
    return (contentRoot.replace(/\/$/, '') + '/maps/photos/' + iso + "." + extension).toString();
} // end getPhotoLink()

// Build a fallback chain of photo URLs for a capital name. Photos on disk
// don't follow a single convention: case differs ("Andorra_La_Vella" vs
// "Andorra la Vella"), extensions vary (`Skopje.JPG`, `Hagatna.JPG`), and
// some files keep accents while others don't. Try several variants so a
// missing/mis-cased match doesn't leave the popup with no photo.
function _loomaMapBuildCapitalPhotoCandidates(cityName, extension) {
    if (!cityName) return [];
    var rawExt = ((extension || 'jpg') + '').replace(/^\./, '');
    var raw = ('' + cityName).trim();
    if (!raw) return [];

    function tryNormalize(s, form) {
        try { return s.normalize(form); } catch (_) { return s; }
    }
    function stripAccents(s) {
        try { return s.normalize('NFKD').replace(new RegExp('[\\u0300-\\u036f]', 'g'), ''); }
        catch (_) { return s; }
    }
    function titleCase(s) {
        return s.replace(/(^|[\s_\-])([a-z])/g, function (m, sep, c) {
            return sep + c.toUpperCase();
        });
    }

    var underscored = raw.replace(/ /g, '_');
    var names = [];
    var nameSet = {};
    // NFC (composed) and NFD (decomposed) variants: photos on disk are a mix
    // of both forms, and Linux treats them as different filenames — try each
    // so 'São Tomé' resolves whichever encoding the photo uses.
    [underscored, raw].forEach(function (seed) {
        [
            seed,
            titleCase(seed),
            tryNormalize(seed, 'NFC'),
            titleCase(tryNormalize(seed, 'NFC')),
            tryNormalize(seed, 'NFD'),
            titleCase(tryNormalize(seed, 'NFD')),
            stripAccents(seed),
            titleCase(stripAccents(seed))
        ].forEach(function (v) {
            if (v && !nameSet[v]) { nameSet[v] = true; names.push(v); }
        });
    });

    var extCandidates = [rawExt, rawExt.toUpperCase(), rawExt.toLowerCase(), 'jpg', 'JPG', 'png', 'PNG', 'jpeg', 'JPEG'];
    var extSet = {};
    var exts = [];
    extCandidates.forEach(function (e) {
        if (e && !extSet[e]) { extSet[e] = true; exts.push(e); }
    });

    var urls = [];
    var urlSet = {};
    for (var n = 0; n < names.length; n++) {
        for (var e = 0; e < exts.length; e++) {
            var url = '/content/maps/photos/' + encodeURI(names[n]) + '.' + exts[e];
            if (!urlSet[url]) { urlSet[url] = true; urls.push(url); }
        }
    }
    return urls;
}


//////////////////////
// Number functions //
//////////////////////

    // Inserts commas to long numbers to improve readability
    function toCommas(numRaw) {
        if(isNaN(numRaw)) {
            //if it's not a number, don't add commas
            return numRaw;
        } else {
            var num = "";
            if (numRaw.length >= 10)
            { //Adds comma for 1 billion+, so on and so forth. Length of 10+ == billion
                num += numRaw.substring(0, numRaw.length - 9) + ",";
                numRaw = numRaw.substring(numRaw.length - 9, numRaw.length);
            }
            if (numRaw.length >= 7)
            {        // length of 7+ == million (1,000,000)
                num += numRaw.substring(0, numRaw.length - 6) + ",";
                numRaw = numRaw.substring(numRaw.length - 6, numRaw.length);
            }
            if (numRaw.length >= 4)
            {           // length of 4+ == thousand (1,000)
                num += numRaw.substring(0, numRaw.length - 3) + ",";
                numRaw = numRaw.substring(numRaw.length - 3, numRaw.length);
            }
            num += numRaw;
            return num;
        }
    } // end toCommas()
    
    // Instead of displaying full number, prints out "billion" or "million" for readability
    function toWords(numRaw) {
        if (numRaw >= 1000000000000)
            return (numRaw / 1000000000000 + ' trillion');
        else if (numRaw >= 1000000000)
            return (numRaw / 1000000000 + ' billion');
        else if (numRaw >= 1000000)
            return (numRaw / 1000000 + ' million');
        else if (numRaw >= 1000)
            return (numRaw / 1000 + ' thousand');
        return numRaw;
    } // end toWords()
    
    //Turns a number into date form with BCE/CE
    function toDate(dateRaw) {
        if (dateRaw < 0) return Math.abs(dateRaw) + ' BCE';
        else if (dateRaw < 1000) return dateRaw + ' CE';
        return dateRaw;
    } // end toDate()
    
    //Correctly capitalizes a word by capitalizing first letter
    function capitalize(wordRaw) {
    return wordRaw.charAt(0).toUpperCase() + wordRaw.substring(1);
    } // end capitalize()

    function _loomaMapAsNumber(value) {
        if (value === null || value === undefined) return null;
        if (typeof value === 'number' && isFinite(value)) return value;
        var s = ('' + value).replace(/,/g, '').trim();
        if (s === '') return null;
        var n = Number(s);
        return isFinite(n) ? n : null;
    }

    function _loomaMapFormatProp(keyRaw, valueRaw) {
        var key = (keyRaw === null || keyRaw === undefined) ? '' : ('' + keyRaw);
        var keyLower = key.toLowerCase();
        var value = valueRaw;

        // Normalize continent naming: some datasets incorrectly use "Australia" as a continent.
        if (keyLower === 'continent' && ('' + value).toLowerCase() === 'australia') {
            value = 'Oceania';
        }

        // Normalize GDP naming: some datasets/localizations use "PIB" (Portuguese) for GDP.
        // Always display as "GDP (USD)" and format as a USD number when possible.
        var isGdp =
            keyLower === 'gdp' ||
            keyLower === 'gdp_usd' ||
            keyLower === 'gdp_current_usd' ||
            keyLower === 'pib';
        if (isGdp) {
            var gdpNum = _loomaMapAsNumber(value);
            return {
                label: 'GDP (USD)',
                valueHtml: gdpNum === null ? (value === null || value === undefined || ('' + value).trim() === '' ? '-' : ('' + value)) : ('$' + toCommas(Math.round(gdpNum)))
            };
        }

        // Population field normalization (keep this conservative to avoid false positives).
        var isPopulation =
            keyLower === 'population' ||
            keyLower === 'pop_est' ||
            keyLower === 'pop' ||
            keyLower === 'pop_estimate' ||
            keyLower === 'pop2020' ||
            keyLower === 'pop2019' ||
            keyLower === 'pop2018' ||
            keyLower === 'pop2005' ||
            keyLower === 'pop2000' ||
            keyLower === 'pop1990' ||
            keyLower === 'pop1980';

        if (isPopulation) {
            return { label: 'Population', valueHtml: toCommas('' + value) };
        }

        // Highest point / elevation (meters + feet).
        var isElevationMeters =
            keyLower === 'elev_m' ||
            keyLower === 'elevation_m' ||
            keyLower === 'alt_m' ||
            keyLower === 'altitude_m' ||
            keyLower === 'highest_m' ||
            keyLower === 'highest_point_m' ||
            keyLower === 'highestpoint_m';

        if (isElevationMeters) {
            var meters = _loomaMapAsNumber(value);
            if (meters !== null) {
                var feet = meters * 3.28084;
                return {
                    label: 'Highest point',
                    valueHtml: Math.round(meters) + ' m / ' + Math.round(feet) + ' ft'
                };
            }
            return { label: 'Highest point', valueHtml: '' + value };
        }

        return { label: capitalize(key), valueHtml: toCommas(value) };
    }
    
    //turns spaces into underscores for the names of images (so that we can use more generic names to  call the image)
    function spaceToUnderscore(wordRaw) {
        var toReturn = "";
        while(true) {
            toReturn += wordRaw.substring(0, wordRaw.indexOf(' '));
            toReturn += "_";
            wordRaw = wordRaw.substring(wordRaw.indexOf(' ') + 1);
    
            if(wordRaw.indexOf(' ') == -1) {
                toReturn += wordRaw;
                return toReturn;
            }
        }
        return toReturn;
    } // end spaceToUnderscore()

//////////////////////////////////////////////

window.onload = function () {
    
    var mapid = $("#map").data()['id'];
    var collection = 'maps';
    
    $.post("looma-database-utilities.php",
        {cmd: 'openByID', collection: collection, id: mapid},
        function(mapdata) {
            data = mapdata;
            L.Circle.prototype._checkIfEmpty = function () { return false; };
            //Fixes a Leaflet glitch that the circle markers
            //would disappear on pan or zoom
            
            mapTitle = data.title;
            
            if (data.baseLayers) baseLayers = new Array(data.baseLayers.length); // array of feature layers
            
            if (data.addOnLayers)
            {
                addOnData = data.addOnLayers;
                addOnLayers = new Array(data.addOnLayers.length);
                popUpShowing = new Array(data.addOnLayers.length);
                
                if (addOnData[0].priority) priorityOn = true;
                else priorityOn = true;  //??? was false?
            }
            
            // Starting map view
            if (data.info.start) {
                map = L.map('map').setView(
                    [data.info.start.startLat, data.info.start.startLong],
                    data.info.start.startZoom
                );
            } else {
                // Heuristic defaults for city street maps if mongo start coords weren't set.
                var titleLower = ((data.title || mapTitle || '') + '').toLowerCase();
                if (titleLower.indexOf('pokhara') !== -1) {
                    map = L.map('map').setView([28.2096, 83.9856], 13);
                } else if (titleLower.indexOf('kathmandu') !== -1) {
                    map = L.map('map').setView([27.7172, 85.3240], 13);
                } else {
                    map = L.map('map').setView([27, 85], 3);
                }
            }
            
            if (data.info.backgroundColor)
            {   var bColor = data.info.backgroundColor;
                var el = document.getElementsByClassName('leaflet-container');
                for (var i = 0; i < el.length; i++) el[i].style.backgroundColor = bColor;
            }
            
            //Zoom levels
            if (data.info.zoom) {
                map.options.minZoom = data.info.zoom.minZoom;
                map.options.maxZoom = data.info.zoom.maxZoom;
                if (((data.title || mapTitle || '') + '').toLowerCase().indexOf('pokhara') !== -1) {
                    map.options.minZoom = Math.max(0, Number(map.options.minZoom) - 2);
                }
            } else {   //Default numbers for if they are not set in mongo
                map.options.minZoom = 2.5;
                map.options.maxZoom = 7;
            }
            
            //If the map has tiles, add them as a background for the map
            if (data.tileLayer && data.tileExtension)
            {
                var zoomCfg = (data.info && data.info.zoom) || {};
                var tileOpts = {
                    minZoom: map.options.minZoom || zoomCfg.minZoom || 1,
                    maxZoom: zoomCfg.maxZoom || 18,
                };
                // `en-worldmap` ships with a local tile pyramid. City street
                // maps (Pokhara, Kathmandu, generic streetMap) fall back to
                // OpenStreetMap because they genuinely need real-world tiles.
                // Continent/region maps (Europe, Asia, ...) intentionally have
                // NO tile background — they should show only the drawn region
                // over the map background color, not the rest of the world.
                var LOCAL_TILE_LAYERS = ['en-worldmap'];
                var OSM_FALLBACK_LAYERS = ['streetMap', 'PokharaCity', 'KathmanduCity'];
                // The World Topography map ships only a partial Nepal-region
                // tile pyramid at zoom 9. Serve OpenTopoMap instead — it's a
                // real topographic tile layer that covers the whole globe.
                var TOPO_FALLBACK_LAYERS = ['en-worldmap/tile', 'topography', 'topo'];
                if (LOCAL_TILE_LAYERS.indexOf(data.tileLayer) !== -1) {
                    var link = '/maps2018/tiles/' + data.tileLayer + '/{z}/{x}/{y}.' + data.tileExtension;
                    L.tileLayer(link, tileOpts).addTo(map);
                } else if (TOPO_FALLBACK_LAYERS.indexOf(data.tileLayer) !== -1) {
                    L.tileLayer(
                        'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
                        Object.assign({}, tileOpts, {
                            subdomains: 'abc',
                            attribution: 'Map data: &copy; OpenStreetMap, SRTM | Map style: &copy; OpenTopoMap (CC-BY-SA)',
                            maxZoom: Math.min(17, tileOpts.maxZoom || 17),
                            crossOrigin: true,
                        })
                    ).addTo(map);
                } else if (OSM_FALLBACK_LAYERS.indexOf(data.tileLayer) !== -1) {
                    L.tileLayer(
                        'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                        Object.assign({}, tileOpts, {
                            attribution: '&copy; OpenStreetMap contributors',
                            maxZoom: Math.min(19, tileOpts.maxZoom || 19),
                            crossOrigin: true,
                        })
                    ).addTo(map);
                }
            }
            
            //Sets boundaries for the distance the user can span in pixels
            var southWest, northEast;
            if (data.info.mapBounds) {
                southWest = L.latLng(data.info.mapBounds.SWLat, data.info.mapBounds.SWLong);
                northEast = L.latLng(data.info.mapBounds.NELat, data.info.mapBounds.NELong);
            }
            else {  //Default (whole globe, centered on Nepal)
                southWest = L.latLng(-85.0511, -180);
                northEast = L.latLng(85.0511, 180);
            }
            var bounds = L.latLngBounds(southWest, northEast);
            mapDefaultBounds = bounds;
            var panningBounds = _loomaMapIsNepalMap()
                ? _loomaMapExpandBoundsForPopupRoom(bounds)
                : bounds;
            map.setMaxBounds(panningBounds);
            
            map.on('drag', function () {
                map.panInsideBounds(panningBounds, {animate: false});
            });

            _loomaMapEnsureCountryClickPanel();

            map.on('click', function () {
                if (countryClickJustOpened) {
                    countryClickJustOpened = false;
                    return;
                }
                _loomaMapClearNepalSelection();
                _loomaMapCloseCountryPanel();
                _loomaMapFocusDefaultBounds();
            });

            // Stop the local-time ticker the moment any popup closes (X, auto-close,
            // or map click). The ticker self-stops when the DOM element disappears,
            // but explicit stop avoids one wasted tick.
            map.on('popupclose', function () {
                _loomaMapStopCapitalTimeTicker();
            });

            _loomaMapLoadSupplementalCountryFacts().always(function () {
                if (data.baseLayers) loadBaseLayers(data.baseLayers);

                if (data.addOnLayers) loadAddOnLayers(data.addOnLayers, data.info);

                // Creates the info control box that displays information about a location when the user hovers over it
                if (data.info.hasInfoBox && data.info.hasInfoBox == true) {
                    loadInfoBox(data);
                    infoBoxOn = true;
                } else
                    infoBoxOn = false;

                if (data.legend) loadLegend(data.legend);
            });
            
        }, // end of getJSON function
        'json'
    );
    
        toolbar_button_activate("maps");

}; // End of window.onload()