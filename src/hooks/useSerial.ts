import { useSerialContext } from "context/SerialContext";
import { TelemetryData } from "types/mission";

export const useSerial = () => {
  const {
    isConnected,
    setIsConnected,
    serialPorts,
    setSerialPorts,
    setSelectedPort,
    selectedPort,
  } = useSerialContext();

  // GPS 좌표 변환 함수: 도분(DDMM.MMMM) → 십진도(DD.DDDDDD)
  const convertGPSCoordinate = (coordinate: string, isLongitude: boolean = false): string => {
    const numValue = parseFloat(coordinate);
    if (isNaN(numValue) || numValue === 0) return coordinate;

    const coordinateStr = coordinate.toString();
    const dotIndex = coordinateStr.indexOf('.');
    
    let degrees: number;
    let minutes: number;
    
    if (isLongitude) {
      if (dotIndex >= 5) {
        degrees = Math.floor(numValue / 100);
        minutes = numValue - (degrees * 100);
      } else {
        return coordinate;
      }
    } else {
      if (dotIndex >= 4) {
        degrees = Math.floor(numValue / 100);
        minutes = numValue - (degrees * 100);
      } else {
        return coordinate;
      }
    }
    
    const decimalDegrees = degrees + (minutes / 60);
    return decimalDegrees.toFixed(4);
  };

  // 텔레메트리 데이터 유효성 검사 함수 (분리)
  const validateTelemetryData = (data: string): { isValid: boolean; parsedData?: TelemetryData; errorReason?: string } => {
    try {
      const values = data
        .trim()
        .split(",")
        .map((value) => value.trim());

      // 기본 필드 수 검사
      if (values.length < 25) {
        return {
          isValid: false,
          errorReason: `Insufficient fields: expected 25, got ${values.length}`
        };
      }

      // MODE 검증
      if (values[3] !== "F" && values[3] !== "S") {
        return {
          isValid: false,
          errorReason: `Invalid MODE: ${values[3]} (expected F or S)`
        };
      }

      // STATE 검증
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
        return {
          isValid: false,
          errorReason: `Invalid STATE: ${values[4]}`
        };
      }

      // 필수 필드 검증
      if (!values[0] || !values[1]) {
        return {
          isValid: false,
          errorReason: "Missing TEAM_ID or MISSION_TIME"
        };
      }

      // 시간 형식 검증
      const timeRegex = /^([0-1][0-9]|2[0-3]):([0-5][0-9]):([0-5][0-9])$/;
      if (!timeRegex.test(values[1])) {
        return {
          isValid: false,
          errorReason: `Invalid MISSION_TIME format: ${values[1]}`
        };
      }

      // 모든 검증 통과 시 파싱된 데이터 반환
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
        AUTO_GYRO_ROTATION_RATE: values[18],
        GPS_TIME: values[19],
        GPS_ALTITUDE: values[20],
        GPS_LATITUDE: convertGPSCoordinate(values[21], false),
        GPS_LONGITUDE: convertGPSCoordinate(values[22], true),
        GPS_SATS: values[23],
        CMD_ECHO: values[24],
      };

      return {
        isValid: true,
        parsedData
      };

    } catch (error) {
      return {
        isValid: false,
        errorReason: `Parse error: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  };

  const handleSerialError = (_event: any, error: string) => {
    if (isConnected) {
      alert("Serial port already connected");
      return;
    }
    console.error("Serial error:", error);
    alert(`Serial Error: ${error}`);
    setIsConnected(false);
    setSelectedPort("");
  };

  // 수정된 handleSerialData - 모든 메시지를 처리하되 유효성에 따라 다르게 처리
  const handleSerialData =
    (telemetryData: TelemetryData[], setTelemetryData: Function) =>
    (_event: any, data: string) => {
      // 유효성 검사 수행
      const validationResult = validateTelemetryData(data);

      if (validationResult.isValid && validationResult.parsedData) {
        // 유효한 데이터인 경우 텔레메트리 데이터에 추가
        setTelemetryData((prev) => [...prev, validationResult.parsedData!]);
        console.log("✅ Valid telemetry data processed");
      } else {
        // 유효하지 않은 데이터인 경우 로깅
        console.warn("❌ Invalid telemetry data:", validationResult.errorReason);
        console.log("Raw data:", data);
      }

      // MessageContext에서 처리할 수 있도록 유효성 정보와 함께 이벤트 발송
      // 기존 serial-data 이벤트는 그대로 유지하되, 추가 정보 포함
      const messageData = {
        rawData: data,
        isValid: validationResult.isValid,
        errorReason: validationResult.errorReason
      };

      // 커스텀 이벤트로 메시지 컨텍스트에 전달
      window.dispatchEvent(new CustomEvent('telemetry-message', { 
        detail: messageData 
      }));
    };

  return {
    serialPorts,
    setSerialPorts,
    selectedPort,
    setSelectedPort,
    isConnected,
    setIsConnected,
    handleSerialData,
    handleSerialError,
  };
};