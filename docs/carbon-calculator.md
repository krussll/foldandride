# Travel Carbon Calculator MVP Reference

## Summary
This guide captures the current inputs, data sources, and maths that drive the Travel Carbon Offset Calculator. Use it as a quick reference when refining the front-end form, wiring up serverless functions, or briefing partners on the methodology.

## Input fields
| Field | Location/Name | Notes |
| --- | --- | --- |
| Travel mode | `<select name="travelMode">` | Required. Unlocks the rest of the form and maps to `flight`, `train`, `bus`, `car`, or `ferry` in the calculator logic. |
| Travel class | Derived from mode-specific controls | Defaults to `standard`. For flights the logic supports `economy`, `premium`, `business`, `first`; for trains `standard`/`highspeed`; for cars `petrol`, `diesel`, `hybrid`, `ev`. |
| Distance (km) | `<input name="distance">` | Optional numeric override. When empty the script attempts a lookup via `data-routes` or preset options. |
| Route ID | `<select name="route">` (optional) | Provides canonical distances when we ship preset journeys. Serialised via `data-routes` on the form. |
| Passengers | `<input name="passengers">` | Defaults to 1. Parsed as an integer and clamped to a minimum of one traveller. |
| Trip type | Dataset / radio group | Accepts `one-way`, `return`, or `roundtrip`. Controls the `tripMultiplier`. |
| Trips per year | `<input name="tripsPerYear">` | Defaults to 1. Multiplies the annualised total when the user flies the same route multiple times. |

## Emission-factor sources
The default emission factors (`EMISSION_FACTORS`) in `assets/js/carbon-calculator.js` map to reputable open datasets so travellers can trust the totals:

- **Flights:** Values mirror the UK Department for Energy Security & Net Zero (formerly BEIS) 2023 long-haul factors with radiative forcing uplift applied per passenger-km.
- **Rail & coach:** Based on the European Environment Agency (EEA) average electric and diesel performance for continental services (2022 snapshot).
- **Cars:** Adapted from the UK DESNZ greenhouse gas reporting tables (medium car averages for petrol, diesel, hybrid, and battery electric).
- **Ferry:** Uses the International Maritime Organization (IMO) small passenger ferry baseline published in the Fourth GHG Study.

When we localise the tool or wire in real-time APIs we can swap these constants while keeping the same units (kg CO₂e per passenger-km).

## Formulas
The MVP keeps the calculations intentionally transparent:

1. **Distance resolution:** For each leg we prefer user-entered kilometres. If absent we attempt to resolve a preset route distance from `data-routes` metadata. Fallback is zero.
2. **Leg emissions:**
   ```text
   leg_emissions_kg = distance_km * emission_factor(mode, class) * passengers
   ```
3. **Trip aggregation:**
   ```text
   single_trip_kg = Σ leg_emissions_kg
   total_emissions_kg = single_trip_kg * tripMultiplier * tripsPerYear
   ```
4. **Offset guidance:** Convert kilograms to tonnes (`total_emissions_kg / 1000`) and round up to the nearest 0.1 t to produce the recommended offset volume.

All outputs surface in kilograms (kg CO₂e) with helper formatters handling display-friendly rounding.

## Refactor plan for shared utilities
To reuse the pure maths inside a Google Cloud Function, split the current module into two layers:

1. **Core utilities (`assets/js/modules/carbon/calculations.js`):** Export the data constants and pure helpers:
   - `EMISSION_FACTORS`, `RETURN_TRIP_MULTIPLIERS`, and any preset offsets.
   - Parsing helpers that do not touch the DOM (`parseNumber`, `normaliseMode`, `normaliseClass`).
   - Calculation helpers (`resolveRouteDistance`, `calculateDistanceForLeg`, `getEmissionFactor`, `calculateEmissionsForLeg`, `calculateTripBreakdown`, `calculateRecommendedTonnes`).
   - Formatting utilities that only depend on ECMAScript Intl (safe both client-side and in Node 18 runtimes).
   Bundle this file as an ES module so it can be imported in the front end and transpiled for Cloud Functions (Node 18+ understands ESM when "type": "module").
2. **Browser adapter (`assets/js/carbon-calculator.js`):** Keep DOM-specific pieces (`extractPresetRoutes`, `parseCalculatorForm`, `renderBreakdown`, `renderOffsetSuggestions`, and event bindings). This adapter imports the shared utilities.
3. **Cloud Function entry (`functions/calcCarbon/index.mjs` or similar):** Import `calculateTripBreakdown` and friends, then accept a plain JSON payload:
   ```json
   {
     "legs": [{"mode": "flight", "travelClass": "economy", "distanceKm": 935, "passengers": 1}],
     "tripType": "return",
     "tripsPerYear": 2
   }
   ```
   Respond with serialisable JSON (`totalEmissionsKg`, `singleTripEmissionsKg`, `legs` breakdown) so the front end can render identical results.

### Serialization considerations
- Ensure any objects exported from the core module use only primitives, arrays, and plain objects so they survive `JSON.stringify`/`JSON.parse` without loss.
- Avoid passing `Intl.NumberFormat` instances across the wire—perform currency/number formatting at the edge (browser) after the Cloud Function responds with raw numbers.
- When sharing constants such as `OFFSET_PROJECTS`, keep URLs and price ranges as JSON-friendly strings/numbers to support both the static site and future API responses.

Following this split keeps the user experience snappy while unlocking serverless reuse with zero duplication.

