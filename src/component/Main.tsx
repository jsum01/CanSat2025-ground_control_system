import React, { useState, useEffect, useRef } from "react";
import logo from "../static/images/cosmoLink.jpeg";
import { Telemetry } from "./Telemetry";
import { CmdEcho } from "./CmdEcho";
import { TelemetryData } from "../types/mission";
const { ipcRenderer } = window.require("electron");

const Main = () => {
  const CMD_TEL_ON = "CMD,3167,CX,ON";
  const CMD_TEL_OFF = "CMD,3167,CX,OFF";
  const CMD_ST_GPS = "CMD,3167,ST,GPS";
  const CMD_ST_UTC = "CMD,3167,ST,";
  const CMD_SIM_ACTIVATE = "CMD,3167,SIM,ACTIVATE";
  const CMD_SIM_ENABLE = "CMD,3167,SIM,ENABLE";
  const CMD_SIM_DISABLE = "CMD,3167,SIM,DISABLE";
  const CMD_SIMP = "CMD,3167,SIMP,";
  const CMD_CAL = "CMD,3167,CAL";
  const CMD_MEC_ON = "CMD,3167,MEC,UC,ON";
  const CMD_MEC_OFF = "CMD,3167,MEC,UC,OFF";

  // ===== UI 상태 =====
  // 현재 탭
  const [activeTab, setActiveTab] = useState<"telemetry" | "cmdecho">(
    "telemetry"
  );
  // 데이터 표시 방식
  const [viewMode, setViewMode] = useState<"charts" | "table">("charts");

  // ===== 시리얼 통신 =====
  // 포트 목록
  const [serialPorts, setSerialPorts] = useState<Array<{ path: string }>>([]);
  // 선택된 포트
  const [selectedPort, setSelectedPort] = useState<string>("");
  // 포트 연결 상태
  const [isConnected, setIsConnected] = useState<boolean>(false);
  // MEC 시스템 상태
  const [isMec, setIsMec] = useState<boolean>(false);

  // ===== 시간 설정 =====
  // 시간 설정 모드
  const [isToggleTime, setIsToggleTime] = useState<boolean>(false);
  // UTC 시간 입력값
  const [UTCTime, setUTCTime] = useState<string>("");

  // ===== 시뮬레이션 =====
  // 시뮬레이션 상태
  const [simStatus, setSimStatus] = useState<"DISABLED" | "ENABLED" | "ACTIVE">(
    "DISABLED"
  );
  // 시뮬레이션 데이터 파일 저장
  const [simFile, setSimFile] = useState<string[]>([]);
  // 파일 Uploaded 상태 확인
  const [hasValidSimFile, setHasValidSimFile] = useState(false);
  // 시뮬레이션 데이터 수신 "가능여부" 상태
  const [canReceiveSimData, setCanReceiveSimData] = useState<boolean>(false);
  // 파일 입력 참조
  const fileInputRef = useRef<HTMLInputElement>(null);
  // 명령어 실행 타이머
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // ===== 데이터 =====
  // 텔레메트리 데이터
  const [telemetryData, setTelemetryData] = useState<TelemetryData[]>([]);

  const handleSerialData = (_event: any, data: string) => {
    try {
      // 캐리지 리턴 제거 및 데이터 분리
      const values = data
        .trim()
        .split(",")
        .map((value) => value.trim());

      // 데이터 검증을 위한 기본 체크
      if (values.length < 24) {
        console.warn("Insufficient number of fields in telemetry data");
        return;
      }

      if (values[3] !== "F" && values[3] !== "S") {
        console.warn(`Invalid MODE value: ${values[3]}`);
        return;
      }

      const validStates = [
        "LAUNCH_WAIT",
        "LAUNCH_PAD",
        "ASCENT",
        "APOGEE",
        "DESCENT",
        "PROBE_RELEASE",
        "LANDED",
      ];
      if (!validStates.includes(values[4])) {
        console.warn(`Invalid STATE value: ${values[4]}`);
        return;
      }

      const parsedData: TelemetryData = {
        TEAM_ID: values[0],
        MISSION_TIME: values[1],
        PACKET_COUNT: values[2],
        MODE: values[3] as "F" | "S",
        STATE: values[4] as TelemetryData["STATE"],
        ALTITUDE: values[5],
        TEMPERATURE: values[6],
        PRESSURE: values[7],
        VOLTAGE: values[8],
        GYRO_R: values[9],
        GYRO_P: values[10],
        GYRO_Y: values[11],
        ACCEL_R: values[12],
        ACCEL_P: values[13],
        ACCEL_Y: values[14],
        MAG_R: values[15],
        MAG_P: values[16],
        MAG_Y: values[17],
        AUTO_GYRO_ROTATION_RATE: "0", // This field is not present in the incoming data
        GPS_TIME: values[18],
        GPS_ALTITUDE: values[19],
        GPS_LATITUDE: values[20],
        GPS_LONGITUDE: values[21],
        GPS_SATS: values[22],
        CMD_ECHO: values[23],
      };

      if (!parsedData.TEAM_ID || !parsedData.MISSION_TIME) {
        console.warn("Missing required fields (TEAM_ID or MISSION_TIME)");
        return;
      }

      const timeRegex = /^([0-1][0-9]|2[0-3]):([0-5][0-9]):([0-5][0-9])$/;
      if (!timeRegex.test(parsedData.MISSION_TIME)) {
        console.warn(`Invalid MISSION_TIME format: ${parsedData.MISSION_TIME}`);
        return;
      }

      setTelemetryData((prev) => [...prev, parsedData]);
    } catch (error) {
      console.error("Failed to parse telemetry data:", error);
      console.log("Raw data:", data);
    }
  };

  const handleSerialError = (_event: any, error: string) => {
    console.error("Serial error:", error);
    alert(`Serial Error: ${error}`);
    setIsConnected(false);
    setSelectedPort("");
  };

  useEffect(() => {
    const getPorts = async () => {
      try {
        const portStatus = await ipcRenderer.invoke("check-port-status");

        if (portStatus.isConnected) {
          setIsConnected(true);
          setSelectedPort(portStatus.currentPort);
        }

        const ports = await ipcRenderer.invoke("get-ports");
        setSerialPorts(ports);
      } catch (error) {
        console.error("Failed to get port status:", error);
      }
    };

    getPorts();

    ipcRenderer.on("serial-data", handleSerialData);
    ipcRenderer.on("serial-error", handleSerialError);

    return () => {
      ipcRenderer.removeAllListeners("serial-data");
      ipcRenderer.removeAllListeners("serial-error");
    };
  }, []);

  const handleConnect = async () => {
    if (!isConnected && selectedPort) {
      try {
        const portStatus = await ipcRenderer.invoke("check-port-status");

        if (portStatus.isConnected && portStatus.currentPort !== selectedPort) {
          alert(
            `다른 포트(${portStatus.currentPort})가 이미 연결되어 있습니다.`
          );
          setIsConnected(true);
          setSelectedPort(portStatus.currentPort);
          return;
        }

        const result = await ipcRenderer.invoke("connect-port", selectedPort);
        if (result.success) {
          setIsConnected(true);
          setSelectedPort(selectedPort);
        } else {
          alert(`연결 실패: ${result.error}`);
        }
      } catch (error) {
        console.error("Connection error:", error);
        alert("연결 중 오류가 발생했습니다.");
      }
    } else if (isConnected) {
      try {
        const result = await ipcRenderer.invoke("disconnect-port");
        if (result.success) {
          setIsConnected(false);
          setSelectedPort("");

          const ports = await ipcRenderer.invoke("get-ports");
          setSerialPorts(ports);
        } else {
          alert("연결 해제 실패");
        }
      } catch (error) {
        console.error("Disconnection error:", error);
        alert("연결 해제 중 오류가 발생했습니다.");
      }
    }
  };

  const handleCalToZero = async () => {
    if (isConnected) {
      try {
        await ipcRenderer.invoke("send-data", CMD_CAL);
      } catch (error) {
        console.error("Failed to stop telemetry:", error);
        alert("텔레메트리 중지 실패");
      }
    }
  };

  const handleToggleTime = async () => {
    if (isConnected) {
      setIsToggleTime(true);
    }
  };

  const handleSetGPSTime = async () => {
    if (isConnected) {
      try {
        await ipcRenderer.invoke("send-data", CMD_ST_GPS);
        setIsToggleTime(false);
      } catch (error) {
        console.error("Failed to stop telemetry:", error);
        alert("텔레메트리 중지 실패");
      }
    }
  };

  const handleSetUTCTime = async (e: React.FormEvent) => {
    if (isConnected) {
      try {
        e.preventDefault();
        if (UTCTime.trim()) {
          await ipcRenderer.invoke("send-data", CMD_ST_UTC + UTCTime);
          setUTCTime("");
          setIsToggleTime(false);
        }
      } catch (error) {
        console.error("Failed to stop telemetry:", error);
        alert("텔레메트리 중지 실패");
      }
    }
  };

  const handleToggleMEC = async () => {
    if (isConnected) {
      try {
        if (!isMec) {
          await ipcRenderer.invoke("send-data", CMD_MEC_ON);
          setIsMec(true);
        } else {
          await ipcRenderer.invoke("send-data", CMD_MEC_OFF);
          setIsMec(false);
        }
      } catch (error) {
        console.error("Failed to stop telemetry:", error);
        alert("텔레메트리 중지 실패");
      }
    }
  };

  const handleStartTelemetry = async () => {
    if (isConnected) {
      try {
        await ipcRenderer.invoke("send-data", CMD_TEL_ON);
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
        await ipcRenderer.invoke("send-data", CMD_TEL_OFF);

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

      setSimFile(commands);
      setHasValidSimFile(commands.length > 0);
    }
  };

  // SIMP 명령 실행을 위한 인터벌 핸들러
  const startSimulation = async () => {
    let index = 0;

    intervalRef.current = setInterval(async () => {
      if (index >= simFile.length) {
        clearInterval(intervalRef.current!);
        handleSimDisable(); // 모든 데이터 전송 후 자동 비활성화
        return;
      }

      try {
        await ipcRenderer.invoke("send-data", simFile[index]);
        index++;
      } catch (error) {
        console.error("Failed to send simulation command:", error);
        clearInterval(intervalRef.current!);
      }
    }, 1000);
  };

  // 버튼 핸들러 수정
  const handleSimEnable = async () => {
    if (isConnected) {
      try {
        await ipcRenderer.invoke("send-data", CMD_SIM_ENABLE);
        setSimStatus("ENABLED");
        // 파일 선택 트리거
        fileInputRef.current?.click();
      } catch (error) {
        console.error("Failed to enable simulation:", error);
        alert("시뮬레이션 모드 활성화 실패");
      }
    }
  };

  const handleSimActivate = async () => {
    if (isConnected && hasValidSimFile) {
      try {
        await ipcRenderer.invoke("send-data", CMD_SIM_ACTIVATE);
        setSimStatus("ACTIVE");
        startSimulation();
      } catch (error) {
        console.error("Failed to activate simulation:", error);
        alert("시뮬레이션 실행 실패");
      }
    }
  };

  // 시뮬레이션 모드 해제
  const handleSimDisable = async () => {
    if (isConnected) {
      try {
        await ipcRenderer.invoke("send-data", CMD_SIM_DISABLE);
        setSimStatus("DISABLED");
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      } catch (error) {
        console.error("Failed to disable simulation:", error);
        alert("시뮬레이션 모드 비활성화 실패");
      }
    }
  };

  // 시뮬레이션 데이터 전송
  const handleSendSimData = async (pressureValue: string) => {
    if (isConnected && canReceiveSimData) {
      try {
        await ipcRenderer.invoke("send-data", `${CMD_SIMP}${pressureValue}`);
      } catch (error) {
        console.error("Failed to send simulation data:", error);
        alert("시뮬레이션 데이터 전송 실패");
      }
    }
  };

  const today = new Date();
  const time = `KST ${String(today.getHours()).padStart(2, "0")}:${String(
    today.getMinutes()
  ).padStart(2, "0")}:${String(today.getSeconds()).padStart(2, "0")}`;

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
          {!isToggleTime && (
            <button
              className="px-4 py-2 rounded bg-blue-900 text-white font-bold hover:bg-blue-800"
              disabled={!isConnected}
              onClick={handleToggleTime}
            >
              SET TIME
            </button>
          )}

          {isToggleTime && (
            <div className="flex items-center gap-2">
              <form onSubmit={handleSetUTCTime} className="flex-1">
                <input
                  type="text"
                  onChange={(e) => setUTCTime(e.target.value)}
                  value={UTCTime}
                  placeholder="Enter UTC Time"
                  className="w-full px-3 py-2 rounded border border-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-900 focus:border-transparent placeholder-gray-400 font-mono"
                />
              </form>
              <button
                className="px-4 py-2 rounded bg-blue-900 text-white font-bold hover:bg-blue-800 whitespace-nowrap transition-colors duration-200"
                disabled={!isConnected}
                onClick={handleSetGPSTime}
              >
                SET GPS TIME
              </button>
            </div>
          )}
          <button
            className="px-4 py-2 rounded bg-blue-900 text-white font-bold hover:bg-blue-800"
            disabled={!isConnected}
            onClick={handleCalToZero}
          >
            CALIBRATE
          </button>
          <button
            className={`px-4 py-1 rounded text-white font-bold hover:bg-blue-800 ${
              isMec ? "bg-red-600 hover:bg-red-700" : "bg-blue-900"
            }`}
            disabled={!isConnected}
            onClick={handleToggleMEC}
          >
            {isMec ? "MEC OFF" : "MEC ON"}
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
                <p className="font-bold m-0">{simStatus}</p>
                <div className="flex gap-1">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    className="hidden"
                    accept=".txt"
                  />
                  <button
                    className={`flex-1 p-2 rounded cursor-pointer text-sm ${
                      simStatus === "ENABLED"
                        ? "bg-blue-900 text-white"
                        : "bg-gray-100"
                    }`}
                    onClick={handleSimEnable}
                    disabled={!isConnected}
                  >
                    ENABLE
                  </button>
                  <button
                    className={`flex-1 p-2 rounded cursor-pointer text-sm ${
                      simStatus === "ACTIVE"
                        ? "bg-blue-900 text-white"
                        : "bg-gray-100"
                    }`}
                    onClick={handleSimActivate}
                    disabled={
                      !isConnected ||
                      !hasValidSimFile ||
                      simStatus !== "ENABLED"
                    }
                  >
                    ACTIVATE
                  </button>
                  <button
                    className={`flex-1 p-2 rounded cursor-pointer text-sm ${
                      simStatus === "DISABLED"
                        ? "bg-blue-900 text-white"
                        : "bg-gray-100"
                    }`}
                    onClick={handleSimDisable}
                    disabled={!isConnected}
                  >
                    DISABLE
                  </button>
                </div>
              </div>

              <div className="text-sm p-2">
                {[
                  ["STATE:", isConnected ? "CONNECTED" : "DISCONNECTED"],
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
