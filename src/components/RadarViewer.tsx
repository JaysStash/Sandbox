"use client";

import { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { generateStormTrack, type StormFrame } from "@/lib/stormTrack";
import { destinationPoint } from "@/lib/regions";
import type { OutlookResult, TornadoParameters } from "@/lib/outlookEngine";
import { calculateDamageEstimate } from "@/lib/damageEstimator";
import DamageStatsPanel from "@/components/DamageStatsPanel";

type Props = {
  region: string;
  regionCenter: { lat: number; lng: number };
  parameters: TornadoParameters;
  outlook: OutlookResult;
  populationDensity: number;
};

const FRAME_INTERVAL_MS = 150;

export default function RadarViewer({
  region,
  regionCenter,
  parameters,
  outlook,
  populationDensity,
}: Props) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const framesRef = useRef<StormFrame[]>([]);

  const [ready, setReady] = useState(false);
  const [frameIndex, setFrameIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [overlay, setOverlay] = useState<"reflectivity" | "velocity">(
    "reflectivity"
  );
  const [showStats, setShowStats] = useState(false);

  // Generate the track once per storm
  useEffect(() => {
    framesRef.current = generateStormTrack(regionCenter, parameters, outlook);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Initialize the map once
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: {
        version: 8,
        sources: {
          carto: {
            type: "raster",
            tiles: [
              "https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png",
              "https://b.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png",
              "https://c.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png",
            ],
            tileSize: 256,
            attribution:
              '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors © <a href="https://carto.com/">CARTO</a>',
          },
        },
        layers: [{ id: "carto-tiles", type: "raster", source: "carto" }],
      },
      center: [regionCenter.lng, regionCenter.lat],
      zoom: 7,
    });

    map.addControl(new maplibregl.NavigationControl(), "top-right");

    map.on("load", () => {
      map.addSource("storm-cell", {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      });

      map.addLayer({
        id: "storm-reflectivity",
        type: "heatmap",
        source: "storm-cell",
        paint: {
          "heatmap-weight": ["get", "weight"],
          "heatmap-intensity": 1.5,
          "heatmap-radius": 45,
          "heatmap-opacity": 0.85,
          "heatmap-color": [
            "interpolate",
            ["linear"],
            ["heatmap-density"],
            0,
            "rgba(0,0,0,0)",
            0.2,
            "#2ecc71",
            0.4,
            "#f1c40f",
            0.6,
            "#e67e22",
            0.8,
            "#e74c3c",
            1,
            "#d500f9",
          ],
        },
      });

      map.addSource("storm-couplet", {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      });

      map.addLayer({
        id: "storm-velocity",
        type: "circle",
        source: "storm-couplet",
        paint: {
          "circle-radius": 18,
          "circle-blur": 0.6,
          "circle-opacity": 0.85,
          "circle-color": [
            "match",
            ["get", "kind"],
            "inbound",
            "#22c55e",
            "outbound",
            "#ef4444",
            "#888888",
          ],
        },
        layout: { visibility: "none" },
      });

      const frames = framesRef.current;
      if (frames.length > 0) {
        const bounds = new maplibregl.LngLatBounds();
        frames.forEach((f) => bounds.extend([f.lng, f.lat]));
        map.fitBounds(bounds, { padding: 60, duration: 0 });
      }

      setReady(true);
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Toggle overlay visibility
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    map.setLayoutProperty(
      "storm-reflectivity",
      "visibility",
      overlay === "reflectivity" ? "visible" : "none"
    );
    map.setLayoutProperty(
      "storm-velocity",
      "visibility",
      overlay === "velocity" ? "visible" : "none"
    );
  }, [overlay, ready]);

  // Update storm position/appearance each frame
  useEffect(() => {
    const map = mapRef.current;
    const frames = framesRef.current;
    if (!map || !ready || frames.length === 0) return;

    const frame = frames[frameIndex];

    const cellFeatures: any[] = [
      {
        type: "Feature",
        geometry: { type: "Point", coordinates: [frame.lng, frame.lat] },
        properties: { weight: frame.intensity },
      },
    ];

    if (outlook.supercellLikely) {
      const hookOffset = 0.008 + frame.intensity * 0.008;
      cellFeatures.push({
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: [frame.lng - hookOffset, frame.lat - hookOffset * 0.6],
        },
        properties: { weight: frame.intensity * 0.7 },
      });
    }

    const cellSource = map.getSource("storm-cell") as
      | maplibregl.GeoJSONSource
      | undefined;
    cellSource?.setData({
      type: "FeatureCollection",
      features: cellFeatures,
    });

    const coupletFeatures: any[] = [];
    if (frame.showMesocyclone) {
      const left = destinationPoint(
        frame.lat,
        frame.lng,
        frame.bearingDeg + 90,
        1.2
      );
      const right = destinationPoint(
        frame.lat,
        frame.lng,
        frame.bearingDeg - 90,
        1.2
      );
      coupletFeatures.push(
        {
          type: "Feature",
          geometry: { type: "Point", coordinates: [left.lng, left.lat] },
          properties: { kind: "inbound" },
        },
        {
          type: "Feature",
          geometry: { type: "Point", coordinates: [right.lng, right.lat] },
          properties: { kind: "outbound" },
        }
      );
    }

    const coupletSource = map.getSource("storm-couplet") as
      | maplibregl.GeoJSONSource
      | undefined;
    coupletSource?.setData({
      type: "FeatureCollection",
      features: coupletFeatures,
    });

    if (playing) {
      map.easeTo({
        center: [frame.lng, frame.lat],
        zoom: 9,
        duration: FRAME_INTERVAL_MS,
      });
    }
  }, [frameIndex, ready, playing, outlook.supercellLikely]);

  // Playback loop
  useEffect(() => {
    if (!playing) return;
    const interval = setInterval(() => {
      setFrameIndex((prev) => {
        if (prev >= framesRef.current.length - 1) {
          setPlaying(false);
          setShowStats(true);
          return prev;
        }
        return prev + 1;
      });
    }, FRAME_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [playing]);

  const damageEstimate = calculateDamageEstimate(
    parameters,
    outlook,
    populationDensity
  );

  return (
    <div>
      <div
        ref={mapContainerRef}
        className="h-[45vh] w-full sm:h-[55vh]"
      />

      <div className="border-t border-storm-700 bg-storm-900 p-3">
        <div className="flex gap-2">
          <button
            onClick={() => setOverlay("reflectivity")}
            className={`flex-1 rounded-lg py-2 text-sm font-medium ${
              overlay === "reflectivity"
                ? "bg-bolt-500 text-storm-950"
                : "bg-storm-800 text-gray-300"
            }`}
          >
            Reflectivity
          </button>
          <button
            onClick={() => setOverlay("velocity")}
            className={`flex-1 rounded-lg py-2 text-sm font-medium ${
              overlay === "velocity"
                ? "bg-bolt-500 text-storm-950"
                : "bg-storm-800 text-gray-300"
            }`}
          >
            Velocity
          </button>
        </div>

        <div className="mt-3 flex items-center gap-3">
          <button
            onClick={() => {
              if (frameIndex >= framesRef.current.length - 1) {
                setFrameIndex(0);
              }
              setPlaying((p) => !p);
            }}
            className="shrink-0 rounded-full bg-bolt-500 px-4 py-2 text-sm font-semibold text-storm-950"
          >
            {playing ? "Pause" : "Play"}
          </button>
          <input
            type="range"
            min={0}
            max={framesRef.current.length - 1 || 59}
            value={frameIndex}
            onChange={(e) => {
              setPlaying(false);
              setFrameIndex(Number(e.target.value));
            }}
            className="w-full accent-bolt-500"
          />
        </div>

        {!showStats && (
          <button
            onClick={() => setShowStats(true)}
            className="mt-3 w-full rounded-lg border border-storm-700 py-2 text-sm text-gray-300 hover:bg-storm-800"
          >
            View Damage Statistics
          </button>
        )}
      </div>

      {showStats && (
        <DamageStatsPanel
          estimate={damageEstimate}
          region={region}
          onClose={() => setShowStats(false)}
        />
      )}
    </div>
  );
}
