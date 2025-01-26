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

// 마커 아이콘 설정 - Leaflet의 기본 마커 아이콘 사용
const icon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

export const Telemetry: React.FC<TelemetryProps> = ({
  viewMode,
  missionData,
}) => {
  // 차트 인스턴스를 저장할 ref 객체들
  const altitudeChartRef = useRef<Chart | null>(null);
  const temperatureChartRef = useRef<Chart | null>(null);
  const voltageChartRef = useRef<Chart | null>(null);
  const pressureChartRef = useRef<Chart | null>(null);
  const accelChartRef = useRef<Chart | null>(null);
  const magChartRef = useRef<Chart | null>(null);
  const gyroChartRef = useRef<Chart | null>(null);

  // GPS 위치 상태 관리
  const [position, setPosition] = useState<[number, number]>([37.5665, 126.9780]);

  // GPS 위치 업데이트 효과
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

  // 차트 생성 및 업데이트 효과
  useEffect(() => {
    if (viewMode === "charts" && missionData.length > 0) {
      // 최근 50개의 데이터만 사용하여 차트 가독성 유지
      const recentData = missionData.slice(-50);
      const timeLabels = recentData.map(d => d.MISSION_TIME);

      // 차트 생성 함수
      const createChart = (canvasId: string, datasets: { data: number[], color: string, label: string }[]) => {
        const canvas = document.getElementById(canvasId) as HTMLCanvasElement;
        if (!canvas) return null;

        // 기존 차트가 있다면 제거
        const existingChart = Chart.getChart(canvas);
        if (existingChart) {
          existingChart.destroy();
        }

        return new Chart(canvas, {
          type: "line",
          data: {
            labels: timeLabels,
            datasets: datasets.map(dataset => ({
              label: dataset.label,
              data: dataset.data,
              borderColor: dataset.color,
              borderWidth: 2,
              tension: 0.1,
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

      // 각 센서 데이터에 대한 차트 생성
      altitudeChartRef.current = createChart("altitudeGraph", [{
        data: recentData.map(d => parseFloat(d.ALTITUDE) || 0),
        color: "#0000FF",
        label: "Altitude"
      }]);

      temperatureChartRef.current = createChart("temperatureGraph", [{
        data: recentData.map(d => parseFloat(d.TEMPERATURE) || 0),
        color: "#FF0000",
        label: "Temperature"
      }]);

      voltageChartRef.current = createChart("voltageGraph", [{
        data: recentData.map(d => parseFloat(d.VOLTAGE) || 0),
        color: "#00FF00",
        label: "Voltage"
      }]);

      pressureChartRef.current = createChart("pressureGraph", [{
        data: recentData.map(d => parseFloat(d.PRESSURE) || 0),
        color: "#00FFFF",
        label: "Pressure"
      }]);

      // 3축 센서 데이터 차트 생성
      accelChartRef.current = createChart("accelGraph", [
        {
          data: recentData.map(d => parseFloat(d.ACCEL_R) || 0),
          color: "#FF0000",
          label: "ACCEL R"
        },
        {
          data: recentData.map(d => parseFloat(d.ACCEL_P) || 0),
          color: "#00FF00",
          label: "ACCEL P"
        },
        {
          data: recentData.map(d => parseFloat(d.ACCEL_Y) || 0),
          color: "#0000FF",
          label: "ACCEL Y"
        }
      ]);

      magChartRef.current = createChart("magGraph", [
        {
          data: recentData.map(d => parseFloat(d.MAG_R) || 0),
          color: "#FF0000",
          label: "MAG R"
        },
        {
          data: recentData.map(d => parseFloat(d.MAG_P) || 0),
          color: "#00FF00",
          label: "MAG P"
        },
        {
          data: recentData.map(d => parseFloat(d.MAG_Y) || 0),
          color: "#0000FF",
          label: "MAG Y"
        }
      ]);

      gyroChartRef.current = createChart("gyroGraph", [
        {
          data: recentData.map(d => parseFloat(d.GYRO_R) || 0),
          color: "#FF0000",
          label: "GYRO R"
        },
        {
          data: recentData.map(d => parseFloat(d.GYRO_P) || 0),
          color: "#00FF00",
          label: "GYRO P"
        },
        {
          data: recentData.map(d => parseFloat(d.GYRO_Y) || 0),
          color: "#0000FF",
          label: "GYRO Y"
        }
      ]);

      // 컴포넌트 언마운트 시 차트 정리
      return () => {
        [
          altitudeChartRef, temperatureChartRef, voltageChartRef,
          pressureChartRef, accelChartRef, magChartRef, gyroChartRef
        ].forEach(chartRef => {
          chartRef.current?.destroy();
        });
      };
    }
  }, [viewMode, missionData]);

  // GPS 지도 컴포넌트
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
            { id: "altitudeGraph", title: "Attitude" },
            { id: "temperatureGraph", title: "Temperature" },
            { id: "voltageGraph", title: "Voltage" },
            { id: "pressureGraph", title: "Pressure" },
            { id: "accelGraph", title: "ACCEL_R, ACCEL_P, ACCEL_Y" },
            { id: "magGraph", title: "MAG_R, MAG_P, MAG_Y" },
            { id: "gyroGraph", title: "GYRO_R, GYRO_P, GYRO_Y" },
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