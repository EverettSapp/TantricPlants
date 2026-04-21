// Direction → fraction of daylight hours that window receives direct sun
// Northern hemisphere: south-facing gets the most, north gets none
// We flip S↔N for southern hemisphere (lat < 0)
const DIRECTION_FACTORS_NORTH: Record<string, number> = {
  S:  0.60,
  SE: 0.45,
  SW: 0.45,
  E:  0.35,
  W:  0.35,
  NE: 0.12,
  NW: 0.12,
  N:  0.00,
};

const DIRECTION_FACTORS_SOUTH: Record<string, number> = {
  N:  0.60,
  NE: 0.45,
  NW: 0.45,
  E:  0.35,
  W:  0.35,
  SE: 0.12,
  SW: 0.12,
  S:  0.00,
};

const OBSTRUCTION_MULTIPLIERS: Record<string, number> = {
  open:        1.0,
  partial:     0.55,
  shaded:      0.25,
  overhanging: 0.45,
};

export interface LightProfile {
  day_length_hours: number;       // total daylight today
  estimated_direct_hours: number; // direct sun hitting this window
  light_label: string;            // "Bright Direct", "Bright Indirect", etc.
  sunrise: string;                // e.g. "6:42 AM"
  sunset: string;                 // e.g. "7:58 PM"
}

export async function getLightProfile(
  lat: number,
  lng: number,
  direction: string,
  obstruction: string
): Promise<LightProfile | null> {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&daily=sunrise,sunset&timezone=auto&forecast_days=1`;
    const res = await fetch(url);
    if (!res.ok) return null;

    const data = await res.json() as {
      daily: { sunrise: string[]; sunset: string[] };
    };

    const sunriseISO = data.daily.sunrise[0];
    const sunsetISO  = data.daily.sunset[0];
    const sunriseDate = new Date(sunriseISO);
    const sunsetDate  = new Date(sunsetISO);
    const dayLengthHours = (sunsetDate.getTime() - sunriseDate.getTime()) / 3600000;

    const factors = lat >= 0 ? DIRECTION_FACTORS_NORTH : DIRECTION_FACTORS_SOUTH;
    const dirFactor  = factors[direction] ?? 0;
    const obstFactor = OBSTRUCTION_MULTIPLIERS[obstruction] ?? 1;
    const directHours = Math.round(dayLengthHours * dirFactor * obstFactor * 10) / 10;

    const label = lightLabel(directHours, direction, obstruction);

    const fmt = (d: Date) =>
      d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });

    return {
      day_length_hours: Math.round(dayLengthHours * 10) / 10,
      estimated_direct_hours: directHours,
      light_label: label,
      sunrise: fmt(sunriseDate),
      sunset: fmt(sunsetDate),
    };
  } catch {
    return null;
  }
}

function lightLabel(directHours: number, direction: string, obstruction: string): string {
  if (direction === "N" || direction === "S" && obstruction === "shaded") {
    return "Low light";
  }
  if (directHours >= 4) return "Bright direct";
  if (directHours >= 1.5) return "Bright indirect";
  if (directHours >= 0.5) return "Medium indirect";
  return "Low light";
}
