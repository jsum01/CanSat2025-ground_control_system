import React, { useState } from 'react';
import logo from "../static/images/cosmoLink.jpeg";
import { Telemetry } from './Telemetry';
import { CmdEcho } from './CmdEcho';
import { TelemetryData } from '../types/mission';

const Main = () => {
  const [activeTab, setActiveTab] = useState<'telemetry' | 'cmdecho'>('telemetry');
  const [viewMode, setViewMode] = useState<'charts' | 'table'>('charts');
  const [telemetryData] = useState<TelemetryData[]>([
    {
      TEAM_ID: '3167',
      MISSION_TIME: '12:45:03.00',
      PACKET_COUNT: '42',
      PACKET_TYPE: 'C',
      MODE: 'F',
      TP_RELEASED: 'N',
      ALTITUDE: '300.2',
      TEMP: '25.6',
      VOLTAGE: '3.7',
      PRESSURE: '6.9',
      AUTO_GYRO_ROTATION_RATE: '6.8',
      GPS_TIME: '12:45:03.00',
      GPS_LATITUDE: '37.123456',
      GPS_LONGITUDE: '127.123456',
      GPS_ALTITUDE: '300.2',
      GPS_SATS: '8',
      GYRO_R: '0.1',
      GYRO_P: '0.2',
      GYRO_Y: '0.3',
      ACCEL_R: '0.01',
      ACCEL_P: '0.02',
      ACCEL_Y: '0.03',
      MAG_R: '120',
      MAG_P: '130',
      MAG_Y: '140',
      SOFTWARE_STATE: 'LAUNCH_PAD',
      CMD_ECHO: 'CXON'
    },
    // ... 더 많은 데이터
  ]);

  const today = new Date();
  const time = `KST ${today.getHours()}:${today.getMinutes()}:${today.getSeconds()}.${today.getMilliseconds()}`;

  const renderTabContent = () => {
    switch (activeTab) {
      case 'telemetry':
        return <Telemetry viewMode={viewMode} missionData={telemetryData} />;
      case 'cmdecho':
        return <CmdEcho />;
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-200 font-sans overflow-hidden">
      {/* Header */}
      <header className="flex items-center px-8 py-2 bg-white border-b border-gray-300 h-[70px]">
        <img src={logo} alt="SAMMARD" className="w-[50px] h-[50px] mr-8" />
        <h1 className="text-blue-900 text-3xl m-0 flex-grow text-center">TEAM COSMOLINK</h1>
        <p className="text-blue-900 text-lg m-0">TEAM ID:3167</p>
      </header>

      {/* Status Bar */}
      <div className="flex justify-between items-center px-8 py-2 bg-gray-100 border-b border-gray-300 h-[50px]">
        <div className="flex flex-row justify-center items-center gap-4">
          <span>MISSION TIME</span>
          <span>{time}</span>
        </div>
        
        <div className="flex gap-4">
          <button className="px-4 py-2 rounded bg-blue-900 text-white font-bold hover:bg-blue-800">CALIBRATE</button>
          <button className="px-4 py-2 rounded bg-blue-900 text-white font-bold hover:bg-blue-800">SET UTC TIME</button>
          <button className="px-4 py-2 rounded bg-blue-900 text-white font-bold hover:bg-blue-800">START TELEMETRY</button>
          <button className="px-4 py-2 rounded bg-blue-900 text-white font-bold hover:bg-blue-800">STOP TELEMETRY</button>
        </div>

        <div className="flex items-center gap-2">
          <span>PACKET COUNT</span>
          <span>: 31</span>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-4 flex flex-col min-h-0">
        {/* Tabs */}
        <div className="flex gap-0.5 mb-2">
          {[
            { id: 'telemetry', label: 'TELEMETRY' },
            { id: 'cmdecho', label: 'CMD ECHO' },
          ].map((tab) => (
            <div 
              key={tab.id}
              className={`px-8 py-2 bg-white border-b-[3px] cursor-pointer ${
                activeTab === tab.id ? 'border-blue-900 text-blue-900 font-bold' : 'border-transparent'
              }`}
              onClick={() => setActiveTab(tab.id as 'telemetry' | 'cmdecho')}
            >
              {tab.label}
            </div>
          ))}
        </div>

        {/* Content Area */}
        <div className="flex gap-4 flex-1 min-h-0">
          {/* Main View Container */}
          <div className="flex-1 bg-white rounded-lg shadow-md p-4 flex min-h-0">
          {renderTabContent()}
          </div>

          {/* Side Panel */}
          <div className="w-[250px] bg-white p-4 rounded-lg shadow-md flex flex-col">
            {activeTab != 'cmdecho' && (
              <>
            <button 
              className={`w-full p-2 mb-2 rounded cursor-pointer ${viewMode === 'charts' ? 'bg-blue-900 text-white' : 'bg-gray-100'}`}
              onClick={() => setViewMode('charts')}
            >
              CHARTS
            </button>
            <button 
              className={`w-full p-2 mb-2 rounded cursor-pointer ${viewMode === 'table' ? 'bg-blue-900 text-white' : 'bg-gray-100'}`}
              onClick={() => setViewMode('table')}
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
                  ['Software State:', 'null'],
                  ['GPS TIME:', 'null'],
                  ['GPS LATITUDE:', 'null'],
                  ['GPS LONGITUDE:', 'null'],
                  ['GPS ALTITUDE:', 'null'],
                  ['GPS STATS:', 'null'],
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between mb-2 pb-2 border-b border-gray-200">
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