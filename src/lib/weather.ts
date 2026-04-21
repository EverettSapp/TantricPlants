export interface WeatherContext {
  city: string;
  temp_c: number;
  humidity_pct: number;
  description: string; // e.g. "Hot and dry (32°C, 18% humidity)"
}

// Geocode a city name to lat/lng using Open-Meteo's free geocoding API
export async function geocodeCity(city: string): Promise<{ lat: number; lng: number; display_name: string } | null> {
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const data = await res.json() as { results?: { latitude: number; longitude: number; name: string; country: string }[] };
  if (!data.results?.length) return null;
  const r = data.results[0];
  return { lat: r.latitude, lng: r.longitude, display_name: `${r.name}, ${r.country}` };
}

// Fetch current weather from Open-Meteo (no API key required)
export async function getCurrentWeather(lat: number, lng: number): Promise<WeatherContext | null> {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,weather_code&temperature_unit=celsius&timezone=auto`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const data = await res.json() as {
    current: { temperature_2m: number; relative_humidity_2m: number; weather_code: number };
  };
  const temp = data.current.temperature_2m;
  const humidity = data.current.relative_humidity_2m;
  const desc = weatherCodeToDesc(data.current.weather_code);
  return {
    city: "",
    temp_c: temp,
    humidity_pct: humidity,
    description: `${desc} (${temp}°C, ${humidity}% humidity)`,
  };
}

function weatherCodeToDesc(code: number): string {
  if (code === 0) return "Clear sky";
  if (code <= 3) return "Partly cloudy";
  if (code <= 9) return "Foggy";
  if (code <= 19) return "Drizzle";
  if (code <= 29) return "Rain";
  if (code <= 39) return "Snow";
  if (code <= 49) return "Foggy";
  if (code <= 59) return "Drizzle";
  if (code <= 69) return "Rain";
  if (code <= 79) return "Snow";
  if (code <= 84) return "Rain showers";
  if (code <= 94) return "Thunderstorm";
  return "Severe weather";
}
