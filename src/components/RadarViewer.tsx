"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { generateStormTrack, type StormFrame } from "@/lib/stormTrack";
import { destinationPoint } from "@/lib/regions";
import type { OutlookResult, TornadoParameters } from "@/lib/outlookEngine";
import { calculateDamageEstimate } from "@/lib/damageEstimator";
import { ValueNoise2D, clamp } from "@/lib/noise";
import { drawReflectivity, drawVelocity } from "@/lib/stormShapeRenderer";
import DamageStatsPanel from "@/components/DamageStatsPanel";

type Props = {
  region: string;
  regionCenter: { lat: number; lng: number };
  parameters: TornadoParameters;
  outlook: OutlookResult;
  populationDensity: number;
};

const FRAME_INTERVAL_MS = 150;
const CANVAS_SIZE = 128;
const DEG2RAD = Math.PI / 180;

function seedFromString(s: string): number {
  let hash = 0;
  for (let i = 0; i < s.length; i++) {
    hash = (hash * 31 + s.charCodeAt(i)) | 0;
  }
  return hash || 42;
}

function boundsFromCenter(
  center: { lat: number; lng: number },
  boxSizeKm: number
): [[number, number], [number, number], [number, number], [number, number]] {
  const halfDiag = (boxSizeKm * Math.SQRT2) / 2;
  const nw = destinationPoint(center.lat, center.lng, 315, halfDiag);
  const ne = destinationPoint(center.lat, center.lng, 45, halfDiag);
  const se = destinationPoint(center.lat, center.lng, 135, halfDiag);
  const sw = destinationPoint(center.lat, center.lng, 225, halfDiag);
  return [
    [nw.lng, nw.lat],
    [ne.lng, ne.lat],
    [se.lng, se.lat],
    [sw.lng, sw.lat],
  ];
}

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
  const reflectivityCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const velocityCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const noiseRef = useRef<ValueNoise2D | null>(null);

  const [ready, setReady] = useState(false);
  const [frameIndex, setFrameIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [overlay, setOverlay] = useState<"reflectivity" | "velocity">(
    "reflectivity"
  );
  const [showStats, setShowStats] = useState(false);

  // Derived "potential" for this storm - fixed for its whole life, driven by
  // its actual parameters. Lifecycle intensity (per-frame) modulates these.
  const shapePotential = useMemo(() => {
    const sizeFactor = clamp(parameters.sbcape / 4000, 0.2, 1);
    const elongation = clamp(parameters.shear_0_6km / 70, 0.1, 1);
    const hookStrengthBase = outlook.supercellLikely
      ? clamp(parameters.srh_0_1km / 400, 0.15, 1)
      : 0;
    const precipShieldBreadth = clamp(parameters.pwat / 2.0, 0.2, 1);
    const coreIntensity = clamp(parameters.mucape / 5000, 0.3, 1);
    const velocitySizeFactor = clamp(parameters.srh_0_1km / 400, 0.2, 1);
    const velocityStrengthBase = outlook.supercellLikely
      ? clamp(
          (parameters.srh_0_1km / 400 + parameters.shear_0_6km / 70) / 2,
          0.15,
          1
        )
      : 0.03;
    // Real-world box sizes in km - a supercell's precip shield is roughly
    // 20-60km across; its mesocyclone/couplet is a much smaller feature.
    const reflectivityBoxKm = 20 + sizeFactor * 45;
    const velocityBoxKm = 8 + velocitySizeFactor * 14;

    return {
      sizeFactor,
      elongation,
      hookStrengthBase,
      precipShieldBreadth,
      coreIntensity,
      velocitySizeFactor,
      velocityStrengthBase,
      reflectivityBoxKm,
      velocityBoxKm,
    };
  }, [parameters, outlook.supercellLikely]);

  useEffect(() => {
    framesRef.current = generateStormTrack(regionCenter, parameters, outlook);
    noiseRef.current = new ValueNoise2D(seedFromString(region));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Initialize the map + canvas sources once
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    if (!reflectivityCanvasRef.current) {
      reflectivityCanvasRef.current = document.createElement("canvas");
      reflectivityCanvasRef.current.width = CANVAS_SIZE;
      reflectivityCanvasRef.current.height = CANVAS_SIZE;
    }
    if (!velocityCanvasRef.current) {
      velocityCanvasRef.current = document.createElement("canvas");
      velocityCanvasRef.current.width = CANVAS_SIZE;
      velocityCanvasRef.current.height = CANVAS_SIZE;
    }

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
      const frames = framesRef.current;
      const first = frames[0] ?? { lat: regionCenter.lat, lng: regionCenter.lng };

      const reflectivityCoords = boundsFromCenter(
        { lat: first.lat, lng: first.lng },
        shapePotential.reflectivityBoxKm
      );
      const velocityCoords = boundsFromCenter(
        { lat: first.lat, lng: first.lng },
        shapePotential.velocityBoxKm
      );

      map.addSource("reflectivity-canvas", {
        type: "canvas",
        canvas: reflectivityCanvasRef.current!,
        coordinates: reflectivityCoords,
        animate: true,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);

      map.addLayer({
        id: "reflectivity-layer",
        type: "raster",
        source: "reflectivity-canvas",
        paint: { "raster-opacity": 0.92, "raster-fade-duration": 0 },
      });

      map.addSource("velocity-canvas", {
        type: "canvas",
        canvas: velocityCanvasRef.current!,
        coordinates: velocityCoords,
        animate: true,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);

      map.addLayer({
        id: "velocity-layer",
        type: "raster",
        source: "velocity-canvas",
        paint: { "raster-opacity": 0.92, "raster-fade-duration": 0 },
        layout: { visibility: "none" },
      });

      if (frames.length > 0) {
        const bounds = new maplibregl.LngLatBounds();
        frames.forEach((f) => bounds.extend([f.lng, f.lat]));
        map.fitBounds(bounds, { padding: 80, duration: 0 });
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
      "reflectivity-layer",
      "visibility",
      overlay === "reflectivity" ? "visible" : "none"
    );
    map.setLayoutProperty(
      "velocity-layer",
      "visibility",
      overlay === "velocity" ? "visible" : "none"
    );
  }, [overlay, ready]);

  // Redraw the canvases and reposition them each frame
  useEffect(() => {
    const map = mapRef.current;
    const frames = framesRef.current;
    const noise = noiseRef.current;
    const reflCanvas = reflectivityCanvasRef.current;
    const velCanvas = velocityCanvasRef.current;
    if (!map || !ready || !noise || !reflCanvas || !velCanvas) return;
    if (frames.length === 0) return;

    const frame = frames[frameIndex];
    const orientationRad = frame.bearingDeg * DEG2RAD;

    const reflCtx = reflCanvas.getContext("2d");
    if (reflCtx) {
      drawReflectivity(reflCtx, CANVAS_SIZE, noise, {
        sizeFactor: shapePotential.sizeFactor,
        elongation: shapePotential.elongation,
        hookStrength: shapePotential.hookStrengthBase * frame.intensity,
        precipShieldBreadth: shapePotential.precipShieldBreadth,
        coreIntensity: shapePotential.coreIntensity,
        orientationRad,
        lifecycleIntensity: frame.intensity,
        time: frameIndex * 0.5,
      });
    }

    const velCtx = velCanvas.getContext("2d");
    if (velCtx) {
      drawVelocity(velCtx, CANVAS_SIZE, {
        sizeFactor: shapePotential.velocitySizeFactor,
        strength: shapePotential.velocityStrengthBase,
        orientationRad,
        lifecycleIntensity: frame.intensity,
        active: outlook.supercellLikely,
      });
    }

    const reflSource = map.getSource("reflectivity-canvas");
    const velSource = map.getSource("velocity-canvas");
    const center = { lat: frame.lat, lng: frame.lng };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (reflSource as any)?.setCoordinates(
      boundsFromCenter(center, shapePotential.reflectivityBoxKm)
    );
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (velSource as any)?.setCoordinates(
      boundsFromCenter(center, shapePotential.velocityBoxKm)
    );

    if (playing) {
      // Pan only - never zoom in tight, so the storm stays visible within
      // its full regional context rather than filling the whole screen.
      map.easeTo({ center: [frame.lng, frame.lat], duration: FRAME_INTERVAL_MS });
    }
  }, [frameIndex, ready, playing, outlook.supercellLikely, shapePotential]);

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
      <div ref={mapContainerRef} className="h-[45vh] w-full sm:h-[55vh]" />

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
