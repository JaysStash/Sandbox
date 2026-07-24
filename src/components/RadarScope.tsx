"use client";

import { useEffect, useRef, useState } from "react";
import { ValueNoise2D } from "@/lib/noise";
import {
  buildStormState,
  computeRadial,
  type RadarParams,
} from "@/lib/radarPhysics";
import { reflectivityColor, velocityColor } from "@/lib/nexradColors";
import { generateStormTrack, type StormFrame } from "@/lib/stormTrack";
import { destinationPoint } from "@/lib/regions";
import type { OutlookResult, TornadoParameters } from "@/lib/outlookEngine";

type Props = {
  regionCenter: { lat: number; lng: number };
  parameters: TornadoParameters;
  outlook: OutlookResult;
};

const AZIMUTH_BINS = 180; // 2-degree resolution
const RANGE_BINS = 120;
const DISPLAY_RANGE_KM = 65;
const CANVAS_SIZE = 320;
const NO_DATA = -9999;

export default function RadarScope({ regionCenter, parameters, outlook }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const noiseRef = useRef<ValueNoise2D>(new ValueNoise2D(777));
  const framesRef = useRef<StormFrame[]>([]);
  const dBZBufferRef = useRef<Float32Array>(
    new Float32Array(AZIMUTH_BINS * RANGE_BINS).fill(NO_DATA)
  );
  const velBufferRef = useRef<Float32Array>(
    new Float32Array(AZIMUTH_BINS * RANGE_BINS).fill(NO_DATA)
  );
  const foldedBufferRef = useRef<Uint8Array>(
    new Uint8Array(AZIMUTH_BINS * RANGE_BINS)
  );

  const sweepAzIndexRef = useRef(0);
  const stormFrameIndexRef = useRef(0);
  const timeCounterRef = useRef(0);
  const rotationsCompletedRef = useRef(0);

  const [tiltDeg, setTiltDeg] = useState(0.5);
  const [distanceOffsetKm, setDistanceOffsetKm] = useState(35);
  const [speedMultiplier, setSpeedMultiplier] = useState(1);
  const [product, setProduct] = useState<"reflectivity" | "velocity">(
    "reflectivity"
  );
  const [playing, setPlaying] = useState(true);
  const [radarSite, setRadarSite] = useState(() =>
    destinationPoint(regionCenter.lat, regionCenter.lng, 180, distanceOffsetKm)
  );

  // Rebuild the storm track relative to a radar site placed south of the
  // storm's starting point by the chosen distance.
  useEffect(() => {
    const site = destinationPoint(
      regionCenter.lat,
      regionCenter.lng,
      180,
      distanceOffsetKm
    );
    setRadarSite(site);
    framesRef.current = generateStormTrack(regionCenter, parameters, outlook);
    dBZBufferRef.current.fill(NO_DATA);
    velBufferRef.current.fill(NO_DATA);
    foldedBufferRef.current.fill(0);
    sweepAzIndexRef.current = 0;
    stormFrameIndexRef.current = 0;
    rotationsCompletedRef.current = 0;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [distanceOffsetKm, regionCenter, parameters, outlook]);

  // Reset the sweep (not the whole track) whenever tilt changes, since a
  // real radar needs a fresh scan to show a different elevation angle.
  useEffect(() => {
    dBZBufferRef.current.fill(NO_DATA);
    velBufferRef.current.fill(NO_DATA);
    foldedBufferRef.current.fill(0);
    sweepAzIndexRef.current = 0;
  }, [tiltDeg]);

  useEffect(() => {
    if (!playing) return;

    const radarParams: RadarParams = { tiltDeg, nyquistMs: 32 };
    const raysPerTick = Math.max(1, Math.round(3 * speedMultiplier));

    const interval = setInterval(() => {
      const frames = framesRef.current;
      if (frames.length === 0) return;

      const frame = frames[stormFrameIndexRef.current];
      const state = buildStormState(
        parameters,
        outlook,
        frame.lat,
        frame.lng,
        frame.intensity,
        frame.bearingDeg,
        radarSite,
        timeCounterRef.current
      );

      for (let i = 0; i < raysPerTick; i++) {
        const azIndex = sweepAzIndexRef.current;
        const azimuthRad = (azIndex / AZIMUTH_BINS) * Math.PI * 2;

        const rangeBinsKm: number[] = [];
        for (let r = 0; r < RANGE_BINS; r++) {
          rangeBinsKm.push(((r + 0.5) / RANGE_BINS) * DISPLAY_RANGE_KM);
        }

        const result = computeRadial(
          azimuthRad,
          rangeBinsKm,
          state,
          radarParams,
          noiseRef.current
        );

        for (let r = 0; r < RANGE_BINS; r++) {
          const idx = azIndex * RANGE_BINS + r;
          dBZBufferRef.current[idx] = result.dBZ[r];
          velBufferRef.current[idx] = result.velocityMs[r];
          foldedBufferRef.current[idx] = result.folded[r] ? 1 : 0;
        }

        sweepAzIndexRef.current = (azIndex + 1) % AZIMUTH_BINS;
        if (sweepAzIndexRef.current === 0) {
          rotationsCompletedRef.current += 1;
          stormFrameIndexRef.current =
            (stormFrameIndexRef.current + 1) % frames.length;
        }
      }

      timeCounterRef.current += 0.4 * speedMultiplier;

      draw();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, 60);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, tiltDeg, speedMultiplier, radarSite, parameters, outlook, product]);

  function draw() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const size = CANVAS_SIZE;
    const center = size / 2;
    const kmPerPixel = DISPLAY_RANGE_KM / center;

    const imageData = ctx.createImageData(size, size);
    const data = imageData.data;

    const dBZBuf = dBZBufferRef.current;
    const velBuf = velBufferRef.current;
    const foldedBuf = foldedBufferRef.current;

    for (let py = 0; py < size; py++) {
      for (let px = 0; px < size; px++) {
        const dx = px - center;
        const dy = center - py;
        const rangeKm = Math.sqrt(dx * dx + dy * dy) * kmPerPixel;

        const idx4 = (py * size + px) * 4;

        if (rangeKm > DISPLAY_RANGE_KM) {
          data[idx4 + 3] = 0;
          continue;
        }

        let azimuthRad = Math.atan2(dx, dy);
        if (azimuthRad < 0) azimuthRad += Math.PI * 2;

        const azIndex = Math.min(
          AZIMUTH_BINS - 1,
          Math.floor((azimuthRad / (Math.PI * 2)) * AZIMUTH_BINS)
        );
        const rangeIndex = Math.min(
          RANGE_BINS - 1,
          Math.floor((rangeKm / DISPLAY_RANGE_KM) * RANGE_BINS)
        );
        const bufIdx = azIndex * RANGE_BINS + rangeIndex;

        const dBZ = dBZBuf[bufIdx];
        const vel = velBuf[bufIdx];
        const folded = foldedBuf[bufIdx] === 1;

        if (dBZ === NO_DATA) {
          data[idx4 + 3] = 0;
          continue;
        }

        const color =
          product === "reflectivity"
            ? reflectivityColor(dBZ)
            : velocityColor(vel, folded);

        data[idx4] = color[0];
        data[idx4 + 1] = color[1];
        data[idx4 + 2] = color[2];
        data[idx4 + 3] = color[3];
      }
    }

    ctx.putImageData(imageData, 0, 0);

    // Range rings
    ctx.strokeStyle = "rgba(148,163,184,0.25)";
    ctx.lineWidth = 1;
    for (let ringKm = 15; ringKm < DISPLAY_RANGE_KM; ringKm += 15) {
      const ringPx = ringKm / kmPerPixel;
      ctx.beginPath();
      ctx.arc(center, center, ringPx, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Sweep line
    const sweepAngleRad = (sweepAzIndexRef.current / AZIMUTH_BINS) * Math.PI * 2;
    const sweepX = center + Math.sin(sweepAngleRad) * center;
    const sweepY = center - Math.cos(sweepAngleRad) * center;
    const sweepGradient = ctx.createLinearGradient(center, center, sweepX, sweepY);
    sweepGradient.addColorStop(0, "rgba(57,255,106,0.5)");
    sweepGradient.addColorStop(1, "rgba(57,255,106,0)");
    ctx.strokeStyle = sweepGradient;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(center, center);
    ctx.lineTo(sweepX, sweepY);
    ctx.stroke();

    // Radar site marker
    ctx.fillStyle = "#f5c518";
    ctx.beginPath();
    ctx.arc(center, center, 3, 0, Math.PI * 2);
    ctx.fill();
  }

  useEffect(() => {
    draw();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product]);

  return (
    <div className="rounded-2xl border border-storm-700 bg-storm-950 p-4">
      <div className="flex gap-2">
        <button
          onClick={() => setProduct("reflectivity")}
          className={`flex-1 rounded-lg py-2 text-sm font-medium ${
            product === "reflectivity"
              ? "bg-bolt-500 text-storm-950"
              : "bg-storm-800 text-gray-300"
          }`}
        >
          Base Reflectivity
        </button>
        <button
          onClick={() => setProduct("velocity")}
          className={`flex-1 rounded-lg py-2 text-sm font-medium ${
            product === "velocity"
              ? "bg-bolt-500 text-storm-950"
              : "bg-storm-800 text-gray-300"
          }`}
        >
          Base Velocity
        </button>
      </div>

      <div className="mt-4 flex justify-center">
        <canvas
          ref={canvasRef}
          width={CANVAS_SIZE}
          height={CANVAS_SIZE}
          className="h-auto w-full max-w-[320px] rounded-full border border-storm-700 bg-black"
        />
      </div>

      <button
        onClick={() => setPlaying((p) => !p)}
        className="mt-4 w-full rounded-lg bg-bolt-500 py-2 font-semibold text-storm-950 hover:bg-bolt-400"
      >
        {playing ? "Pause Sweep" : "Resume Sweep"}
      </button>

      <div className="mt-4 space-y-3 text-sm">
        <div>
          <div className="flex justify-between text-gray-400">
            <span>Radar Tilt</span>
            <span className="font-mono text-bolt-500">{tiltDeg.toFixed(2)}°</span>
          </div>
          <input
            type="range"
            min={0.5}
            max={4}
            step={0.05}
            value={tiltDeg}
            onChange={(e) => setTiltDeg(Number(e.target.value))}
            className="w-full accent-bolt-500"
          />
        </div>

        <div>
          <div className="flex justify-between text-gray-400">
            <span>Storm Distance from Radar</span>
            <span className="font-mono text-bolt-500">{distanceOffsetKm} km</span>
          </div>
          <input
            type="range"
            min={10}
            max={55}
            step={1}
            value={distanceOffsetKm}
            onChange={(e) => setDistanceOffsetKm(Number(e.target.value))}
            className="w-full accent-bolt-500"
          />
        </div>

        <div>
          <div className="flex justify-between text-gray-400">
            <span>Animation Speed</span>
            <span className="font-mono text-bolt-500">{speedMultiplier.toFixed(1)}x</span>
          </div>
          <input
            type="range"
            min={0.25}
            max={3}
            step={0.25}
            value={speedMultiplier}
            onChange={(e) => setSpeedMultiplier(Number(e.target.value))}
            className="w-full accent-bolt-500"
          />
        </div>
      </div>

      <p className="mt-3 text-center text-xs text-gray-500">
        Sweeping clockwise from the radar site (gold dot at center) — data
        persists per azimuth exactly as a real WSR-88D scan reveals it.
      </p>
    </div>
  );
}
