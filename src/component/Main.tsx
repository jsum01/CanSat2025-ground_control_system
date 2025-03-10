import React, { useState, useEffect, useRef } from "react";
import logo from "../static/images/cosmoLink.jpeg";
import { Telemetry } from "./Telemetry";
import { CmdEcho } from "./CmdEcho";
import { TelemetryData } from "../types/mission";
import { useTime } from "hooks/useTime";
import { useSerial } from "hooks/useSerial";
import { useSimulation } from "hooks/useSimulation";
import { CMD } from "constants/commands";
const { ipcRenderer } = window.require("electron");

const Main = () => {
  // constants 변수
  const cmd = CMD;

  // ===== UI 상태 =====
  // 현재 탭
  const [activeTab, setActiveTab] = useState<"telemetry" | "cmdecho">(
    "telemetry"
  );
  // 데이터 표시 방식
  const [viewMode, setViewMode] = useState<"charts" | "table">("charts");

  // Custom hooks (Hk: Hook)
  const simulationHk = useSimulation();
  const serialHk = useSerial();
  const timeHk = useTime();

  // ===== 데이터 =====
  // 텔레메트리 데이터
  const [telemetryData, setTelemetryData] = useState<TelemetryData[]>([]);


  const handleSerialError = (_event: any, error: string) => {
    console.error("Serial error:", error);
    alert(`Serial Error: ${error}`);
    serialHk.setIsConnected(false);
    serialHk.setSelectedPort("");
  };

  useEffect(() => {
    const getPorts = async () => {
      try {
        const portStatus = await ipcRenderer.invoke("check-port-status");

        if (portStatus.isConnected) {
          serialHk.setIsConnected(true);
          serialHk.setSelectedPort(portStatus.currentPort);
        }

        const ports = await ipcRenderer.invoke("get-ports");
        serialHk.setSerialPorts(ports);
      } catch (error) {
        console.error("Failed to get port status:", error);
      }
    };

    getPorts();

    ipcRenderer.on("serial-data", serialHk.handleSerialData(telemetryData, setTelemetryData));
    ipcRenderer.on("serial-error", handleSerialError);

    return () => {
      ipcRenderer.removeAllListeners("serial-data");
      ipcRenderer.removeAllListeners("serial-error");
    };
  }, []);

  const handleConnect = async () => {
    if (!serialHk.isConnected && serialHk.selectedPort) {
      try {
        const portStatus = await ipcRenderer.invoke("check-port-status");
        if (
          portStatus.isConnected &&
          portStatus.currentPort !== serialHk.selectedPort
        ) {
          // alert: 이미 다른 포트(현재포트 번호 출력)가 연결되어 있습니다.
          alert(
            `Another port (${portStatus.currentPort}) is already connected`
          );
          serialHk.setIsConnected(true);
          serialHk.setSelectedPort(portStatus.currentPort);
          return;
        }
        const result = await ipcRenderer.invoke(
          "connect-port",
          serialHk.selectedPort
        );
        if (result.success) {
          serialHk.setIsConnected(true);
          serialHk.setSelectedPort(serialHk.selectedPort);
        } else {
          // alert: 연결 실패: 에러 메시지 출력
          alert(`Connection failed: ${result.error}`);
        }
      } catch (error) {
        console.error("Connection error:", error);
        // alert: 연결 중 오류가 발생했습니다.
        alert("An error occurred during connection");
      }
    } else if (serialHk.isConnected) {
      try {
        const result = await ipcRenderer.invoke("disconnect-port");
        if (result.success) {
          serialHk.setIsConnected(false);
          serialHk.setSelectedPort("");
          const ports = await ipcRenderer.invoke("get-ports");
          serialHk.setSerialPorts(ports);
        } else {
          // alert: 연결 해제 실패
          alert("Failed to disconnect");
        }
      } catch (error) {
        console.error("Disconnection error:", error);
        // alert: 연결 해제 중 오류가 발생했습니다.
        alert("An error occurred during disconnection");
      }
    }
  };

  const handleCalToZero = async () => {
    if (serialHk.isConnected) {
      try {
        await ipcRenderer.invoke("send-data", cmd.CAL);
      } catch (error) {
        console.error("Failed to calibrate:", error);
        alert(
          `캘리브레이션 실패
  
          Calibration failed`
        );
      }
    }
  };

  const handleSetGPSTime = async () => {
    if (serialHk.isConnected) {
      try {
        await ipcRenderer.invoke("send-data", cmd.TIME.GPS);
        timeHk.setIsToggleTime(false);
      } catch (error) {
        console.error("Failed to set GPS time:", error);
        alert(
          `GPS 시간 설정 실패
   
   Failed to set GPS time`
        );
      }
    }
  };

  const handleSetUTCTime = async (e: React.FormEvent) => {
    if (serialHk.isConnected) {
      try {
        e.preventDefault();
        if (timeHk.UTCTime.trim()) {
          await ipcRenderer.invoke("send-data", cmd.TIME.UTC + timeHk.UTCTime);
          timeHk.setUTCTime("");
          timeHk.setIsToggleTime(false);
        }
      } catch (error) {
        console.error("Failed to stop telemetry:", error);
        alert("텔레메트리 중지 실패");
      }
    }
  };

  const handleToggleTime = () => {
    if (serialHk.isConnected) {
      timeHk.setIsToggleTime(true);
    }
  };

  const handleToggleMEC = async () => {
    if (serialHk.isConnected) {
      try {
        if (!serialHk.isMec) {
          await ipcRenderer.invoke("send-data", cmd.MEC.ON);
          serialHk.setIsMec(true);
        } else {
          await ipcRenderer.invoke("send-data", cmd.MEC.OFF);
          serialHk.setIsMec(false);
        }
      } catch (error) {
        console.error("Failed to stop telemetry:", error);
        alert("텔레메트리 중지 실패");
      }
    }
  };

  const handleStartTelemetry = async () => {
    if (serialHk.isConnected) {
      try {
        await ipcRenderer.invoke("send-data", cmd.TEL.ON);
      } catch (error) {
        console.error("Failed to start telemetry:", error);
        alert("텔레메트리 시작 실패");
      }
    } else {
      alert("시리얼 포트에 연결되어 있지 않습니다.");
    }
  };

  const handleStopTelemetry = async () => {
    if (serialHk.isConnected) {
      try {
        await ipcRenderer.invoke("send-data", cmd.TEL.OFF);

        const saveResult = await ipcRenderer.invoke(
          "save-telemetry",
          telemetryData
        );

        if (saveResult.success) {
          alert(
            `텔레메트리 데이터가 저장되었습니다.\n저장 위치: ${saveResult.filePath}`
          );
        } else {
          console.error("텔레메트리 데이터 저장 실패:", saveResult.error);
          alert("텔레메트리 데이터 저장 실패");
        }
      } catch (error) {
        console.error("텔레메트리 중지 실패:", error);
        alert("텔레메트리 중지 실패");
      }
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const text = await file.text();

      // 파일 파싱 (#으로 시작하는 줄과 빈 줄 제외)
      const commands = text
        .split("\n")
        .filter((line) => line.trim() && !line.startsWith("#"))
        .map((line) => line.replace("$", "3167"));

      simulationHk.setSimFile(commands);
      simulationHk.setHasValidSimFile(commands.length > 0);
    }
  };

  // SIMP 명령 실행을 위한 인터벌 핸들러
  const startSimulation = async () => {
    let index = 0;

    simulationHk.intervalRef.current = setInterval(async () => {
      if (index >= simulationHk.simFile.length) {
        clearInterval(simulationHk.intervalRef.current!);
        handleSimDisable(); // 모든 데이터 전송 후 자동 비활성화
        return;
      }

      try {
        await ipcRenderer.invoke("send-data", simulationHk.simFile[index]);
        index++;
      } catch (error) {
        console.error("Failed to send simulation command:", error);
        clearInterval(simulationHk.intervalRef.current!);
      }
    }, 1000);
  };

  // 버튼 핸들러 수정
  const handleSimEnable = async () => {
    if (serialHk.isConnected) {
      try {
        await ipcRenderer.invoke("send-data", cmd.SIM.ENABLE);
        simulationHk.setSimStatus("ENABLED");
        // 파일 선택 트리거
        simulationHk.fileInputRef.current?.click();
      } catch (error) {
        console.error("Failed to enable simulation:", error);
        alert("시뮬레이션 모드 활성화 실패");
      }
    }
  };

  const handleSimActivate = async () => {
    if (serialHk.isConnected && simulationHk.hasValidSimFile) {
      try {
        await ipcRenderer.invoke("send-data", cmd.SIM.ACTIVATE);
        simulationHk.setSimStatus("ACTIVE");
        startSimulation();
      } catch (error) {
        console.error("Failed to activate simulation:", error);
        alert("시뮬레이션 실행 실패");
      }
    }
  };

  // 시뮬레이션 모드 해제
  const handleSimDisable = async () => {
    if (serialHk.isConnected) {
      try {
        await ipcRenderer.invoke("send-data", cmd.SIM.DISABLE);
        simulationHk.setSimStatus("DISABLED");
        if (simulationHk.intervalRef.current) {
          clearInterval(simulationHk.intervalRef.current);
          simulationHk.intervalRef.current = null;
        }
      } catch (error) {
        console.error("Failed to disable simulation:", error);
        alert("시뮬레이션 모드 비활성화 실패");
      }
    }
  };

  // 시뮬레이션 데이터 전송
  const handleSendSimData = async (pressureValue: string) => {
    if (serialHk.isConnected && simulationHk.canReceiveSimData) {
      try {
        await ipcRenderer.invoke(
          "send-data",
          `${cmd.SIM.PRESSURE}${pressureValue}`
        );
      } catch (error) {
        console.error("Failed to send simulation data:", error);
        alert("시뮬레이션 데이터 전송 실패");
      }
    }
  };

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const formattedTime = `${String(now.getUTCHours()).padStart(2, "0")}:${String(
        now.getUTCMinutes()
      ).padStart(2, "0")}:${String(now.getUTCSeconds()).padStart(2, "0")}`;
      
      timeHk.setUTCTime(formattedTime);
    }, 1000);
    
    // 컴포넌트 언마운트 시 인터벌 정리
    return () => {
      clearInterval(timer);
    };
  }, []);

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
            value={serialHk.selectedPort}
            onChange={(e) => serialHk.setSelectedPort(e.target.value)}
            className="px-2 py-1 border rounded"
            disabled={serialHk.isConnected}
          >
            <option value="">포트 선택</option>
            {serialHk.serialPorts.map((port) => (
              <option key={port.path} value={port.path}>
                {port.path}
              </option>
            ))}
          </select>
          <button
            onClick={handleConnect}
            className={`px-4 py-1 rounded text-white font-bold hover:bg-blue-800 ${
              serialHk.isConnected
                ? "bg-red-600 hover:bg-red-700"
                : "bg-blue-900"
            }`}
          >
            {serialHk.isConnected ? "DISCONNECT" : "CONNECT"}
          </button>
        </div>
        <p className="text-blue-900 text-lg m-0 ml-4">TEAM ID:3167</p>
      </header>

      <div className="flex justify-between items-center px-8 py-2 bg-gray-100 border-b border-gray-300 h-[50px]">
        <div className="flex flex-row justify-center items-center gap-4">
          <span>MISSION TIME</span>
          <span>{`UTC ${timeHk.UTCTime}`}</span>
        </div>

        <div className="flex gap-4">
          {!timeHk.isToggleTime && (
            <button
              className="px-4 py-2 rounded bg-blue-900 text-white font-bold hover:bg-blue-800"
              disabled={!serialHk.isConnected}
              onClick={handleToggleTime}
            >
              SET TIME
            </button>
          )}

          {timeHk.isToggleTime && (
            <div className="flex items-center gap-2">
              <form onSubmit={handleSetUTCTime} className="flex-1">
                <input
                  type="text"
                  onChange={(e) => timeHk.setUTCTime(e.target.value)}
                  value={timeHk.UTCTime}
                  placeholder="Enter UTC Time"
                  className="w-full px-3 py-2 rounded border border-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-900 focus:border-transparent placeholder-gray-400 font-mono"
                />
              </form>
              <button
                className="px-4 py-2 rounded bg-blue-900 text-white font-bold hover:bg-blue-800 whitespace-nowrap transition-colors duration-200"
                disabled={!serialHk.isConnected}
                onClick={handleSetGPSTime}
              >
                SET GPS TIME
              </button>
            </div>
          )}
          <button
            className="px-4 py-2 rounded bg-blue-900 text-white font-bold hover:bg-blue-800"
            disabled={!serialHk.isConnected}
            onClick={handleCalToZero}
          >
            CALIBRATE
          </button>
          <button
            className={`px-4 py-1 rounded text-white font-bold hover:bg-blue-800 ${
              serialHk.isMec ? "bg-red-600 hover:bg-red-700" : "bg-blue-900"
            }`}
            disabled={!serialHk.isConnected}
            onClick={handleToggleMEC}
          >
            {serialHk.isMec ? "MEC OFF" : "MEC ON"}
          </button>
          <button
            className="px-4 py-2 rounded bg-blue-900 text-white font-bold hover:bg-blue-800"
            onClick={handleStartTelemetry}
            disabled={!serialHk.isConnected}
          >
            START TELEMETRY
          </button>
          <button
            className="px-4 py-2 rounded bg-blue-900 text-white font-bold hover:bg-blue-800"
            onClick={handleStopTelemetry}
            disabled={!serialHk.isConnected}
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
                <p className="font-bold m-0">{simulationHk.simStatus}</p>
                <div className="flex gap-1">
                  <input
                    type="file"
                    ref={simulationHk.fileInputRef}
                    onChange={handleFileUpload}
                    className="hidden"
                    accept=".txt"
                  />
                  <button
                    className={`flex-1 p-2 rounded cursor-pointer text-sm ${
                      simulationHk.simStatus === "ENABLED"
                        ? "bg-blue-900 text-white"
                        : "bg-gray-100"
                    }`}
                    onClick={handleSimEnable}
                    disabled={!serialHk.isConnected}
                  >
                    ENABLE
                  </button>
                  <button
                    className={`flex-1 p-2 rounded cursor-pointer text-sm ${
                      simulationHk.simStatus === "ACTIVE"
                        ? "bg-blue-900 text-white"
                        : "bg-gray-100"
                    }`}
                    onClick={handleSimActivate}
                    disabled={
                      !serialHk.isConnected ||
                      !simulationHk.hasValidSimFile ||
                      simulationHk.simStatus !== "ENABLED"
                    }
                  >
                    ACTIVATE
                  </button>
                  <button
                    className={`flex-1 p-2 rounded cursor-pointer text-sm ${
                      simulationHk.simStatus === "DISABLED"
                        ? "bg-blue-900 text-white"
                        : "bg-gray-100"
                    }`}
                    onClick={handleSimDisable}
                    disabled={!serialHk.isConnected}
                  >
                    DISABLE
                  </button>
                </div>
              </div>

              <div className="text-sm p-2">
                {[
                  [
                    "STATE:",
                    serialHk.isConnected ? "CONNECTED" : "DISCONNECTED",
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
                    "GPS SATS:",
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
