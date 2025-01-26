import React, { useState, useEffect } from "react";
import logo from "../static/images/cosmoLink.jpeg";
import { Telemetry } from "./Telemetry";
import { CmdEcho } from "./CmdEcho";
import { TelemetryData } from "../types/mission";
const { ipcRenderer } = window.require("electron");

const Main = () => {
  const [activeTab, setActiveTab] = useState<"telemetry" | "cmdecho">(
    "telemetry"
  );
  const [viewMode, setViewMode] = useState<"charts" | "table">("charts");
  const [serialPorts, setSerialPorts] = useState<Array<{ path: string }>>([]);
  const [selectedPort, setSelectedPort] = useState<string>("");
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [telemetryData, setTelemetryData] = useState<TelemetryData[]>([
    {
      TEAM_ID: "3167",
      MISSION_TIME: "12:45:03",
      PACKET_COUNT: "42",
      MODE: "F",
      STATE: "LAUNCH_PAD",
      ALTITUDE: "300.2",
      TEMPERATURE: "25.6",
      PRESSURE: "101.3",
      VOLTAGE: "3.7",
      GYRO_R: "0.1",
      GYRO_P: "0.2",
      GYRO_Y: "0.3",
      ACCEL_R: "0.01",
      ACCEL_P: "0.02",
      ACCEL_Y: "0.03",
      MAG_R: "120",
      MAG_P: "130",
      MAG_Y: "140",
      AUTO_GYRO_ROTATION_RATE: "6.8",
      GPS_TIME: "12:45:03",
      GPS_ALTITUDE: "300.2",
      GPS_LATITUDE: "37.1234",
      GPS_LONGITUDE: "-84.4268",
      GPS_SATS: "8",
      CMD_ECHO: "CXON",
      OPTIONAL_DATA: "",
    },
  ]);

  useEffect(() => {
    const getPorts = async () => {
      try {
        const ports = await ipcRenderer.invoke("get-ports");
        setSerialPorts(ports);
      } catch (error) {
        console.error("Failed to get ports:", error);
      }
    };

    ipcRenderer.on("serial-data", (event, data) => {
      try {
        const parsed = typeof data === "string" ? JSON.parse(data) : data;
        setTelemetryData((prev) => [...prev, parsed]);
      } catch (error) {
        console.error("Serial data parse error:", error, data);
      }
    });

    ipcRenderer.on("serial-error", (event, error) => {
      console.error("Serial error:", error);
      alert(`Serial Error: ${error}`);
      setIsConnected(false);
      setSelectedPort("");
    });

    getPorts();

    return () => {
      ipcRenderer.removeAllListeners("serial-data");
      ipcRenderer.removeAllListeners("serial-error");
    };
  }, []);

  const handleConnect = async () => {
    if (!isConnected && selectedPort) {
      const result = await ipcRenderer.invoke("connect-port", selectedPort);
      if (result.success) {
        setIsConnected(true);
      } else {
        alert(`연결 실패: ${result.error}`);
      }
    } else {
      const result = await ipcRenderer.invoke("disconnect-port");
      if (result.success) {
        setIsConnected(false);
        setSelectedPort("");
      }
    }
  };

  const handleStartTelemetry = async () => {
    if (isConnected) {
      try {
        await ipcRenderer.invoke("send-data", "CMD,3167,CX,ON");
      } catch (error) {
        console.error("Failed to start telemetry:", error);
        alert("텔레메트리 시작 실패");
      }
    } else {
      alert("시리얼 포트에 연결되어 있지 않습니다.");
    }
  };

  const handleStopTelemetry = async () => {
    if (isConnected) {
      try {
        await ipcRenderer.invoke("send-data", "STOP");
      } catch (error) {
        console.error("Failed to stop telemetry:", error);
        alert("텔레메트리 중지 실패");
      }
    }
  };

  const today = new Date();
  const time = `KST ${today.getHours()}:${today.getMinutes()}:${today.getSeconds()}.${today.getMilliseconds()}`;

  const renderTabContent = () => {
    switch (activeTab) {
      case "telemetry":
        return <Telemetry viewMode={viewMode} missionData={telemetryData} />;
      case "cmdecho":
        return <CmdEcho />;
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-200 font-sans overflow-hidden">
      <header className="flex items-center px-8 py-2 bg-white border-b border-gray-300 h-[70px]">
        <img src={logo} alt="SAMMARD" className="w-[50px] h-[50px] mr-8" />
        <h1 className="text-blue-900 text-3xl m-0 flex-grow text-center">
          TEAM COSMOLINK
        </h1>
        <div className="flex items-center gap-2">
          <select
            value={selectedPort}
            onChange={(e) => setSelectedPort(e.target.value)}
            className="px-2 py-1 border rounded"
            disabled={isConnected}
          >
            <option value="">포트 선택</option>
            {serialPorts.map((port) => (
              <option key={port.path} value={port.path}>
                {port.path}
              </option>
            ))}
          </select>
          <button
            onClick={handleConnect}
            className={`px-4 py-1 rounded text-white font-bold hover:bg-blue-800 ${
              isConnected ? "bg-red-600 hover:bg-red-700" : "bg-blue-900"
            }`}
          >
            {isConnected ? "DISCONNECT" : "CONNECT"}
          </button>
        </div>
        <p className="text-blue-900 text-lg m-0 ml-4">TEAM ID:3167</p>
      </header>

      <div className="flex justify-between items-center px-8 py-2 bg-gray-100 border-b border-gray-300 h-[50px]">
        <div className="flex flex-row justify-center items-center gap-4">
          <span>MISSION TIME</span>
          <span>{time}</span>
        </div>

        <div className="flex gap-4">
          <button
            className="px-4 py-2 rounded bg-blue-900 text-white font-bold hover:bg-blue-800"
            disabled={!isConnected}
          >
            SET UTC TIME
          </button>
          <button
            className="px-4 py-2 rounded bg-blue-900 text-white font-bold hover:bg-blue-800"
            disabled={!isConnected}
          >
            CALIBRATE
          </button>
          <button
            className="px-4 py-2 rounded bg-blue-900 text-white font-bold hover:bg-blue-800"
            disabled={!isConnected}
          >
            MEC ON
          </button>
          <button
            className="px-4 py-2 rounded bg-blue-900 text-white font-bold hover:bg-blue-800"
            onClick={handleStartTelemetry}
            disabled={!isConnected}
          >
            START TELEMETRY
          </button>
          <button
            className="px-4 py-2 rounded bg-blue-900 text-white font-bold hover:bg-blue-800"
            onClick={handleStopTelemetry}
            disabled={!isConnected}
          >
            STOP TELEMETRY
          </button>
        </div>

        <div className="flex items-center gap-2">
          <span>PACKET COUNT</span>
          <span>: {telemetryData.length}</span>
        </div>
      </div>

      <div className="flex-1 p-4 flex flex-col min-h-0">
        <div className="flex gap-0.5 mb-2">
          {[
            { id: "telemetry", label: "TELEMETRY" },
            { id: "cmdecho", label: "CMD ECHO" },
          ].map((tab) => (
            <div
              key={tab.id}
              className={`px-8 py-2 bg-white border-b-[3px] cursor-pointer ${
                activeTab === tab.id
                  ? "border-blue-900 text-blue-900 font-bold"
                  : "border-transparent"
              }`}
              onClick={() => setActiveTab(tab.id as "telemetry" | "cmdecho")}
            >
              {tab.label}
            </div>
          ))}
        </div>

        <div className="flex gap-4 flex-1 min-h-0">
          <div className="flex-1 bg-white rounded-lg shadow-md p-4 flex min-h-0">
            {renderTabContent()}
          </div>

          <div className="w-[250px] bg-white p-4 rounded-lg shadow-md flex flex-col">
            {activeTab != "cmdecho" && (
              <>
                <button
                  className={`w-full p-2 mb-2 rounded cursor-pointer ${
                    viewMode === "charts"
                      ? "bg-blue-900 text-white"
                      : "bg-gray-100"
                  }`}
                  onClick={() => setViewMode("charts")}
                >
                  CHARTS
                </button>
                <button
                  className={`w-full p-2 mb-2 rounded cursor-pointer ${
                    viewMode === "table"
                      ? "bg-blue-900 text-white"
                      : "bg-gray-100"
                  }`}
                  onClick={() => setViewMode("table")}
                >
                  TABLE
                </button>
              </>
            )}
            <div className="mt-2">
              <div className="flex flex-col justify-center items-center bg-gray-100 p-4 gap-2">
                <p className="m-0">SIMULATION MODE</p>
                <p className="font-bold m-0">DISABLED</p>
                <div className="flex gap-1">
                  <button className="flex-1 p-2 rounded bg-gray-100 cursor-pointer text-sm">
                    ENABLE
                  </button>
                  <button className="flex-1 p-2 rounded bg-gray-100 cursor-pointer text-sm">
                    ACTIVATE
                  </button>
                  <button className="flex-1 p-2 rounded bg-blue-900 text-white cursor-pointer text-sm">
                    DISABLE
                  </button>
                </div>
              </div>

              <div className="text-sm p-2">
                {[
                  [
                    "Software State:",
                    isConnected ? "CONNECTED" : "DISCONNECTED",
                  ],
                  [
                    "GPS TIME:",
                    telemetryData[telemetryData.length - 1]?.GPS_TIME || "null",
                  ],
                  [
                    "GPS LATITUDE:",
                    telemetryData[telemetryData.length - 1]?.GPS_LATITUDE ||
                      "null",
                  ],
                  [
                    "GPS LONGITUDE:",
                    telemetryData[telemetryData.length - 1]?.GPS_LONGITUDE ||
                      "null",
                  ],
                  [
                    "GPS ALTITUDE:",
                    telemetryData[telemetryData.length - 1]?.GPS_ALTITUDE ||
                      "null",
                  ],
                  [
                    "GPS STATS:",
                    telemetryData[telemetryData.length - 1]?.GPS_SATS || "null",
                  ],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="flex justify-between mb-2 pb-2 border-b border-gray-200"
                  >
                    <span className="text-blue-900 font-bold">{label}</span>
                    <span>{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Main;
