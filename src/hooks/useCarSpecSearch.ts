import { useState, useCallback } from "react";

export interface CarSpec {
  brand?: string;
  model?: string;
  year?: number;
  trim?: string;
  segment?: string; // тип кузова
  fuel_type?: string;
  cylinders?: number;
  power_hp?: number;
  torque_nm?: number;
  transmission_type?: string;
  drive_type?: string;
  curb_weight_kg?: number;
  acceleration_0_100_s?: string;
  top_speed_kmh?: number;
  engine_size_l?: number;
  aspiration?: string | null;
}

interface SearchState {
  loading: boolean;
  error: string | null;
  results: CarSpec[];
  hasSearched: boolean;
}

const TRANSMISSION_MAP: Record<string, string> = {
  "automatic": "Автомат",
  "manual": "Механика",
  "cvt": "Вариатор",
  "dual_clutch": "Робот",
};

const DRIVE_MAP: Record<string, string> = {
  "front-wheel": "Передний",
  "rear-wheel": "Задний",
  "all-wheel": "Полный",
  "4wd": "Полный",
};

const FUEL_MAP: Record<string, string> = {
  "gasoline": "Бензиновый",
  "diesel": "Дизельный",
  "hybrid": "Гибридный",
  "electric": "Электрический",
  "plug-in_hybrid": "Гибридный",
};

const SEGMENT_TO_BODY: Record<string, string> = {
  "Sedan": "Седан",
  "Hatchback": "Хэтчбек",
  "Estate": "Универсал",
  "Wagon": "Универсал",
  "Coupe": "Купе",
  "Convertible": "Кабриолет",
  "SUV": "Внедорожник",
  "Crossover": "Кроссовер",
  "Minivan": "Минивэн",
  "Van": "Фургон",
  "Pickup": "Пикап",
};

export function useCarSpecSearch() {
  const [state, setState] = useState<SearchState>({
    loading: false,
    error: null,
    results: [],
    hasSearched: false,
  });

  const search = useCallback(async (brand: string, model?: string, year?: number) => {
    if (!brand.trim()) {
      setState({ loading: false, error: null, results: [], hasSearched: false });
      return;
    }

    setState((s) => ({ ...s, loading: true, error: null }));

    try {
      const params = new URLSearchParams({ brand: brand.trim() });
      if (model?.trim()) params.append("model", model.trim());
      if (year) params.append("year", String(year));

      const url = `https://api.carsdataset.com/api/v1/preview/search?${params.toString()}`;
      const res = await fetch(url);
      
      if (!res.ok) {
        throw new Error(`Ошибка API: ${res.status}`);
      }

      const data = await res.json();
      setState({
        loading: false,
        error: null,
        results: data.results || [],
        hasSearched: true,
      });
    } catch (err) {
      setState({
        loading: false,
        error: err instanceof Error ? err.message : "Ошибка поиска",
        results: [],
        hasSearched: true,
      });
    }
  }, []);

  const reset = useCallback(() => {
    setState({ loading: false, error: null, results: [], hasSearched: false });
  }, []);

  return { ...state, search, reset };
}

export function mapApiSpecToForm(spec: CarSpec) {
  const mapped: Partial<{
    engine: string;
    power: string;
    fuel: string;
    gearbox: string;
    drive: string;
    bodyType: string;
    trim: string;
  }> = {};

  if (spec.engine_size_l) {
    mapped.engine = `${spec.engine_size_l.toFixed(1)} л`;
  } else if (spec.cylinders) {
    mapped.engine = `${spec.cylinders} цилиндр.`;
  }

  if (spec.power_hp) {
    mapped.power = String(spec.power_hp);
  }

  if (spec.fuel_type) {
    mapped.fuel = FUEL_MAP[spec.fuel_type] || "Бензиновый";
  }

  if (spec.transmission_type) {
    mapped.gearbox = TRANSMISSION_MAP[spec.transmission_type] || "Автомат";
  }

  if (spec.drive_type) {
    mapped.drive = DRIVE_MAP[spec.drive_type] || "Передний";
  }

  if (spec.segment) {
    mapped.bodyType = SEGMENT_TO_BODY[spec.segment] || "Седан";
  }

  if (spec.trim) {
    mapped.trim = spec.trim;
  }

  return mapped;
}
