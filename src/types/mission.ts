/**
* 텔레메트리 데이터 인터페이스
* 데이터 형식: 
* TEAM_ID,
* MISSION_TIME,
* PACKET_COUNT,
* MODE,
* STATE,
* ALTITUDE,
* TEMPERATURE,
* PRESSURE,
* VOLTAGE,
* GYRO_R,
* GYRO_P,
* GYRO_Y,
* ACCEL_R,
* ACCEL_P,
* ACCEL_Y,
* MAG_R,
* MAG_P,
* MAG_Y,
* AUTO_GYRO_ROTATION_RATE,
* GPS_TIME,
* GPS_ALTITUDE,
* GPS_LATITUDE,
* GPS_LONGITUDE,
* GPS_SATS,
* CMD_ECHO,
// * OPTIONAL_DATA(선택)
// * - 각 필드는 콤마(,)로 구분
// * - 패킷은 캐리지 리턴(CR) 문자로 종료
// * - 데이터 필드 내에 콤마 사용 금지
*/
export interface TelemetryData {
  // 기본 식별 및 시간 정보
  TEAM_ID: string;            // 4자리 팀 ID (예: '1000')
  MISSION_TIME: string;       // UTC 시간 (형식: hh:mm:ss, 예: '13:14:02')
  PACKET_COUNT: string;       // 전송된 패킷 수 (발사대 설치 시 0으로 리셋)
  MODE: 'F' | 'S';            // 'F': Flight mode, 'S': Simulation mode
 
  // 상태 정보
  STATE: 
    // 발사대에 설치된 초기 상태
    'LAUNCH_PAD' |
    // 로켷 발사 후 상승 중인 상태
    'ASCENT' | 
    // 최고점(정점)에 도달한 상태
    'APOGEE' | 
    // 최고점 도달 후 하강 중인 상태
    'DESCENT' | 
    // 프로브(탐사체) 방출 상태
    'PROBE_RELEASE' | 
    // 착륙 완료 상태
    'LANDED';
 
  // 센서 데이터
  ALTITUDE: string;         // 지상 기준 고도 (미터, 0.1m 해상도)
  TEMPERATURE: string;      // 온도 (섭씨, 0.1도 해상도)
  PRESSURE: string;         // 압력 (kPa, 0.1kPa 해상도)
  VOLTAGE: string;          // Cansat 전원 버스 전압 (0.1V 해상도)
 
  // 자이로스코프 데이터
  GYRO_R: string;          // Roll 축 회전 속도 (degrees/second)
  GYRO_P: string;          // Pitch 축 회전 속도 (degrees/second)
  GYRO_Y: string;          // Yaw 축 회전 속도 (degrees/second)
 
  // 가속도계 데이터
  ACCEL_R: string;         // Roll 축 가속도 (degrees/second^2)
  ACCEL_P: string;         // Pitch 축 가속도 (degrees/second^2)
  ACCEL_Y: string;         // Yaw 축 가속도 (degrees/second^2)
 
  // 자기계 데이터
  MAG_R: string;           // Roll 축 자기장 (gauss)
  MAG_P: string;           // Pitch 축 자기장 (gauss)
  MAG_Y: string;           // Yaw 축 자기장 (gauss)
 
  // 자동 자이로 회전 속도
  AUTO_GYRO_ROTATION_RATE: string;  // Cansat 구조체 기준 회전 속도 (degrees/second, 1도 해상도)
 
  // GPS 데이터
  GPS_TIME: string;         // GPS UTC 시간 (1초 해상도)
  GPS_ALTITUDE: string;     // 평균 해수면 기준 고도 (미터, 0.1m 해상도)
  GPS_LATITUDE: string;     // 위도 (decimal degrees, 0.0001도 North 해상도)
  GPS_LONGITUDE: string;    // 경도 (decimal degrees, 0.0001도 West 해상도)
  GPS_SATS: string;         // 추적 중인 GPS 위성 수 (정수)
 
  // 명령어 에코
  CMD_ECHO: string;         // 마지막으로 수신 및 처리된 명령어 (예: 'CXON', 'SP101325')
 
  // // 선택적 데이터 (콤마로 구분된 추가 필드)
  // OPTIONAL_DATA?: string;   // 팀이 중요하다고 판단하는 추가 데이터 필드
 }