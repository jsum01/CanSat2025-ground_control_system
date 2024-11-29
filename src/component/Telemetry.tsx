import React, { useEffect, useRef, useState } from "react";
import { Chart } from "chart.js/auto";
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { TelemetryData } from "../types/mission";
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

interface TelemetryProps {
  viewMode: "charts" | "table";
  missionData: TelemetryData[];
}

// 마커 아이콘 설정
const icon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

export const Telemetry: React.FC<TelemetryProps> = ({
  viewMode,
  missionData,
}) => {
  const altitudeChartRef = useRef<Chart | null>(null);
  const temperatureChartRef = useRef<Chart | null>(null);
  const voltageChartRef = useRef<Chart | null>(null);
  const pressureChartRef = useRef<Chart | null>(null);
  const accelChartRef = useRef<Chart | null>(null);
  const magChartRef = useRef<Chart | null>(null);
  const gyroChartRef = useRef<Chart | null>(null);

  const [position, setPosition] = useState<[number, number]>([37.5665, 126.9780]);

  useEffect(() => {
    if (missionData.length > 0) {
      const latestData = missionData[missionData.length - 1];
      if (latestData.GPS_LATITUDE && latestData.GPS_LONGITUDE) {
        setPosition([
          parseFloat(latestData.GPS_LATITUDE),
          parseFloat(latestData.GPS_LONGITUDE)
        ]);
      }
    }
  }, [missionData]);

  useEffect(() => {
    if (viewMode === "charts") {
      const timeLabels = Array.from({ length: 50 }, (_, i) => i.toString());

      const createChart = (canvasId: string, datasets: { data: number[], color: string, label: string }[]) => {
        const canvas = document.getElementById(canvasId) as HTMLCanvasElement;
        if (!canvas) return null;

        return new Chart(canvas, {
          type: "line",
          data: {
            labels: timeLabels,
            datasets: datasets.map(dataset => ({
              label: dataset.label,
              data: dataset.data,
              borderColor: dataset.color,
              borderWidth: 2,
              tension: 0,
              pointRadius: 0,
              fill: false,
            })),
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: false,
            plugins: {
              legend: {
                display: true,
                position: 'top',
                labels: {
                  font: {
                    size: 10
                  }
                }
              }
            },
            scales: {
              y: {
                beginAtZero: true,
                grid: {
                  color: "#E5E5E5",
                },
                ticks: {
                  font: {
                    size: 10,
                  },
                },
              },
              x: {
                grid: {
                  color: "#E5E5E5",
                },
                ticks: {
                  font: {
                    size: 10,
                  },
                  maxTicksLimit: 10,
                },
              },
            },
          },
        });
      };

      // 단일 데이터셋 차트 데이터
      const attitudeData = Array.from({ length: 50 }, (_, i) => i * 2);
      const temperatureData = Array.from({ length: 50 }, (_, i) => 20 + Math.sin(i / 5) * 5);
      const voltageData = Array.from({ length: 50 }, (_, i) => 12 + i / 10);
      const pressureData = Array.from({ length: 50 }, (_, i) => 100 + i * 3);

      // 다중 데이터셋 차트 데이터
      const accelData = {
        r: Array.from({ length: 50 }, (_, i) => Math.sin(i / 10) * 5),
        p: Array.from({ length: 50 }, (_, i) => Math.cos(i / 10) * 5),
        y: Array.from({ length: 50 }, (_, i) => Math.sin((i + 2) / 10) * 5)
      };

      const magData = {
        r: Array.from({ length: 50 }, (_, i) => Math.sin(i / 8) * 10),
        p: Array.from({ length: 50 }, (_, i) => Math.cos(i / 8) * 10),
        y: Array.from({ length: 50 }, (_, i) => Math.sin((i + 3) / 8) * 10)
      };

      const gyroData = {
        r: Array.from({ length: 50 }, (_, i) => Math.sin(i / 12) * 15),
        p: Array.from({ length: 50 }, (_, i) => Math.cos(i / 12) * 15),
        y: Array.from({ length: 50 }, (_, i) => Math.sin((i + 4) / 12) * 15)
      };

      // 단일 데이터셋 차트 생성
      altitudeChartRef.current = createChart("altitudeGraph", [{ data: attitudeData, color: "#0000FF", label: "Altitude" }]);
      temperatureChartRef.current = createChart("temperatureGraph", [{ data: temperatureData, color: "#FF0000", label: "Temperature" }]);
      voltageChartRef.current = createChart("voltageGraph", [{ data: voltageData, color: "#00FF00", label: "Voltage" }]);
      pressureChartRef.current = createChart("pressureGraph", [{ data: pressureData, color: "#00FFFF", label: "Pressure" }]);

      // 다중 데이터셋 차트 생성
      accelChartRef.current = createChart("accelGraph", [
        { data: accelData.r, color: "#FF0000", label: "ACCEL R" },
        { data: accelData.p, color: "#00FF00", label: "ACCEL P" },
        { data: accelData.y, color: "#0000FF", label: "ACCEL Y" }
      ]);

      magChartRef.current = createChart("magGraph", [
        { data: magData.r, color: "#FF0000", label: "MAG R" },
        { data: magData.p, color: "#00FF00", label: "MAG P" },
        { data: magData.y, color: "#0000FF", label: "MAG Y" }
      ]);

      gyroChartRef.current = createChart("gyroGraph", [
        { data: gyroData.r, color: "#FF0000", label: "GYRO R" },
        { data: gyroData.p, color: "#00FF00", label: "GYRO P" },
        { data: gyroData.y, color: "#0000FF", label: "GYRO Y" }
      ]);

      return () => {
        altitudeChartRef.current?.destroy();
        temperatureChartRef.current?.destroy();
        voltageChartRef.current?.destroy();
        pressureChartRef.current?.destroy();
        accelChartRef.current?.destroy();
        magChartRef.current?.destroy();
        gyroChartRef.current?.destroy();
      };
    }
  }, [viewMode]);

  const MapComponent = () => (
    <div className="bg-white border border-gray-200 rounded p-2 flex flex-col min-h-0">
      <h3 className="m-0 mb-2 text-sm text-blue-900">GPS Location</h3>
      <div className="flex-1 min-h-0 relative">
        <MapContainer
          center={position}
          zoom={13}
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Marker position={position} icon={icon}>
            <Popup>
              Current Location<br />
              Lat: {position[0]}<br />
              Lng: {position[1]}
            </Popup>
          </Marker>
        </MapContainer>
      </div>
    </div>
  );

  return (
    <>
      {viewMode === "charts" ? (
        <div className="grid grid-cols-4 grid-rows-2 gap-4 w-full h-full">
          {[
            { id: "altitudeGraph", title: "Attitude vs Time Graph" },
            { id: "temperatureGraph", title: "Temperature vs Time Graph" },
            { id: "voltageGraph", title: "Voltage vs Time Graph" },
            { id: "pressureGraph", title: "Pressure vs Time Graph" },
            { id: "accelGraph", title: "ACCEL_R, ACCEL_P, ACCEL_Y vs Time Graph" },
            { id: "magGraph", title: "MAG_R, MAG_P, MAG_Y vs Time Graph" },
            { id: "gyroGraph", title: "GYRO_R, GYRO_P, GYRO_Y vs Time Graph" },
          ].map((graph) => (
            <div
              key={graph.id}
              className="bg-white border border-gray-200 rounded p-2 flex flex-col min-h-0"
            >
              <h3 className="m-0 mb-2 text-sm text-blue-900">{graph.title}</h3>
              <div className="flex-1 min-h-0 relative">
                <canvas id={graph.id}></canvas>
              </div>
            </div>
          ))}
          <MapComponent />
        </div>
      ) : (
        <div className="w-full h-full">
          <div
            className="w-full h-full overflow-x-auto overflow-y-auto"
            style={{ maxWidth: "calc(100vw - 320px)" }}
          >
            <div className="min-w-max">
              <table className="w-full border-collapse bg-white">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="sticky left-0 z-10 bg-gray-50 border border-gray-300 p-2 text-left">#</th>
                    {Object.keys(missionData[0] || {}).map((key) => (
                      <th
                        key={key}
                        className="border border-gray-300 p-2 text-left whitespace-nowrap"
                      >
                        {key}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {missionData.map((row, index) => (
                    <tr
                      key={index}
                      className={index % 2 === 0 ? "bg-gray-50" : "bg-white"}
                    >
                      <td className="sticky left-0 z-10 border border-gray-300 p-2 bg-inherit">
                        {index + 1}
                      </td>
                      {Object.keys(row).map((key) => (
                        <td
                          key={key}
                          className="border border-gray-300 p-2 text-blue-900 whitespace-nowrap"
                        >
                          {row[key as keyof TelemetryData]}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </>
  );
};