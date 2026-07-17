// Representative center coordinates and rough population density per region.
// These are reasonable approximations for a first-pass damage estimate, not
// live census data - real per-city/terrain data is a planned future upgrade
// (see build plan Phase 6.4).

export const REGION_COORDINATES: Record<string, { lat: number; lng: number }> = {
  "Southern Plains (TX/OK/KS)": { lat: 35.4676, lng: -97.5164 },
  "Central Plains (NE/IA/eastern CO)": { lat: 40.8136, lng: -96.7026 },
  "Northern Plains (ND/SD/MN)": { lat: 46.8083, lng: -100.7837 },
  "Upper Midwest (WI/MI/northern IL)": { lat: 43.0731, lng: -89.4012 },
  "Ohio Valley (OH/IN/KY)": { lat: 38.2527, lng: -85.7585 },
  "Mid-South / Dixie Alley (AR/MS/AL/TN)": { lat: 35.1495, lng: -90.0490 },
  "Southeast (GA/SC/FL panhandle)": { lat: 33.7490, lng: -84.3880 },
  "Mid-Atlantic (VA/NC/MD)": { lat: 37.5407, lng: -77.4360 },
  "Northeast (PA/NY/New England)": { lat: 40.2732, lng: -76.8867 },
  "Gulf Coast (LA/coastal MS-AL)": { lat: 29.9511, lng: -90.0715 },
  "Florida Peninsula": { lat: 28.5383, lng: -81.3792 },
  "Rocky Mountain Front Range (CO/WY)": { lat: 39.7392, lng: -104.9903 },
  "Desert Southwest (AZ/NM)": { lat: 35.0844, lng: -106.6504 },
  "California": { lat: 36.7378, lng: -119.7871 },
  "Pacific Northwest (WA/OR)": { lat: 45.5152, lng: -122.6784 },
};

// Rough average people per square km for the region - used only for a
// first-pass damage/exposure estimate.
export const REGION_POPULATION_DENSITY: Record<string, number> = {
  "Southern Plains (TX/OK/KS)": 45,
  "Central Plains (NE/IA/eastern CO)": 30,
  "Northern Plains (ND/SD/MN)": 15,
  "Upper Midwest (WI/MI/northern IL)": 70,
  "Ohio Valley (OH/IN/KY)": 90,
  "Mid-South / Dixie Alley (AR/MS/AL/TN)": 55,
  "Southeast (GA/SC/FL panhandle)": 80,
  "Mid-Atlantic (VA/NC/MD)": 120,
  "Northeast (PA/NY/New England)": 160,
  "Gulf Coast (LA/coastal MS-AL)": 65,
  "Florida Peninsula": 150,
  "Rocky Mountain Front Range (CO/WY)": 50,
  "Desert Southwest (AZ/NM)": 20,
  "California": 95,
  "Pacific Northwest (WA/OR)": 60,
};

// Great-circle destination point given a start point, bearing, and distance.
// Spherical-earth approximation - accurate enough for regional-scale tracks.
export function destinationPoint(
  lat: number,
  lng: number,
  bearingDeg: number,
  distanceKm: number
): { lat: number; lng: number } {
  const R = 6371;
  const bearing = (bearingDeg * Math.PI) / 180;
  const lat1 = (lat * Math.PI) / 180;
  const lng1 = (lng * Math.PI) / 180;
  const angularDistance = distanceKm / R;

  const lat2 = Math.asin(
    Math.sin(lat1) * Math.cos(angularDistance) +
      Math.cos(lat1) * Math.sin(angularDistance) * Math.cos(bearing)
  );
  const lng2 =
    lng1 +
    Math.atan2(
      Math.sin(bearing) * Math.sin(angularDistance) * Math.cos(lat1),
      Math.cos(angularDistance) - Math.sin(lat1) * Math.sin(lat2)
    );

  return {
    lat: (lat2 * 180) / Math.PI,
    lng: (((lng2 * 180) / Math.PI + 540) % 360) - 180,
  };
}
