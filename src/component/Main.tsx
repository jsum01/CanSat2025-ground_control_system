import React, { useEffect, useRef } from 'react';
import { Chart } from 'chart.js/auto';
import './Main.css';
import logo from "../static/images/cosmoLink.jpeg"

const Main: React.FC = () => {
  const attitudeChartRef = useRef<Chart | null>(null);
  const temperatureChartRef = useRef<Chart | null>(null);
  const voltageChartRef = useRef<Chart | null>(null);
  const altitudeChartRef = useRef<Chart | null>(null);

  const today = new Date();
  let hours = today.getHours(); // 시
  let minutes = today.getMinutes();  // 분
  let seconds = today.getSeconds();  // 초
  let milliseconds = today.getMilliseconds(); // 밀리초
  const time = `KST ${hours}:${minutes}:${seconds}.${milliseconds}`
  useEffect(() => {
    const timeLabels = Array.from({ length: 50 }, (_, i) => i.toString());
    
    const createChart = (
      canvasId: string,
      data: number[],
      color: string
    ): Chart | null => {
      const canvas = document.getElementById(canvasId) as HTMLCanvasElement;
      if (!canvas) return null;

      return new Chart(canvas, {
        type: 'line',
        data: {
          labels: timeLabels,
          datasets: [{
            data: data,
            borderColor: color,
            borderWidth: 2,
            tension: 0,
            pointRadius: 0,
            fill: false
          }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          animation: false,
          plugins: {
            legend: {
              display: false
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              grid: {
                color: '#E5E5E5'
              },
              ticks: {
                font: {
                  size: 10
                }
              }
            },
            x: {
              grid: {
                color: '#E5E5E5'
              },
              ticks: {
                font: {
                  size: 10
                },
                maxTicksLimit: 10
              }
            }
          }
        },
      });
    };

    // 정적 데이터
    const attitudeData = Array.from({ length: 50 }, (_, i) => i * 2);
    const temperatureData = Array.from({ length: 50 }, (_, i) => 20 + Math.sin(i / 5) * 5);
    const voltageData = Array.from({ length: 50 }, (_, i) => 12 + (i / 10));
    const altitudeData = Array.from({ length: 50 }, (_, i) => 100 + i * 3);

    // 차트 생성
    attitudeChartRef.current = createChart('attitudeGraph', attitudeData, '#0000FF');
    temperatureChartRef.current = createChart('temperatureGraph', temperatureData, '#FF0000');
    voltageChartRef.current = createChart('voltageGraph', voltageData, '#00FF00');
    altitudeChartRef.current = createChart('altitudeGraph', altitudeData, '#800080');

    return () => {
      attitudeChartRef.current?.destroy();
      temperatureChartRef.current?.destroy();
      voltageChartRef.current?.destroy();
      altitudeChartRef.current?.destroy();
    };
  }, []);

  return (
    <div className="app-container">
      <header className="app-header">
        <img src={logo} alt="SAMMARD" className="team-logo" />
        <h1 className="team-title">TEAM COSMOLINC 3.0</h1>
        <p className="team-id">TEAM ID:안나왔잖아</p>
      </header>

      <div className="status-bar">
        <div className="mission-info">
          <span className="info-label">MISSION TIME</span>
          <span className="info-value">{time}</span>
        </div>
        
        <div className="control-buttons">
        <button className="control-btn">SET UTC TIME</button>
        <button className="control-btn">CALIBRATE</button>
          <button className="control-btn">START TELEMETRY</button>
          <button className="control-btn">STOP TELEMETRY</button>
        </div>

        <div className="packet-info">
          <span className="info-label">PACKET COUNT</span>
          <span className="info-value">:   null</span>
        </div>
      </div>

      <div className="main-content">
        <div className="content-tabs">
          <div className="tab active">CONTAINER</div>
          <div className="tab">PAYLOAD</div>
        </div>

        <div className="content-area">
          <div className="graphs-container">
            <div className="graph-grid">
              <div className="graph-item">
                <h3>Attitude vs Time Graph</h3>
                <div className="canvas-container">
                  <canvas id="attitudeGraph"></canvas>
                </div>
              </div>
              <div className="graph-item">
                <h3>Temperature vs Time Graph</h3>
                <div className="canvas-container">
                  <canvas id="temperatureGraph"></canvas>
                </div>
              </div>
              <div className="graph-item">
                <h3>Voltage vs Time Graph</h3>
                <div className="canvas-container">
                  <canvas id="voltageGraph"></canvas>
                </div>
              </div>
              <div className="graph-item">
                <h3>GPS Altitude vs Time Graph</h3>
                <div className="canvas-container">
                  <canvas id="altitudeGraph"></canvas>
                </div>
              </div>
            </div>
          </div>

          <div className="side-panel">
            <button className="panel-btn active">TABLE</button>
            <button className="panel-btn">CHARTS</button>
            
            <div className="simulation-section">
              <div className="simulation-container">
                <p>SIMULATION MODE</p>
                <p style={{fontWeight:'bold'}}>DISABLED</p>
                <div className="simulation-buttons">
                  <button className="sim-btn">ENABLE</button>
                  <button className="sim-btn">ACTIVATE</button>
                  <button className="sim-btn">DISABLE</button>
                </div>
              </div>
              
              <div className="gps-info">
                <div className="info-row">
                  <span>Software State:</span>
                  <span>null</span>
                </div>
                <div className="info-row">
                  <span>GPS TIME:</span>
                  <span>null</span>
                </div>
                <div className="info-row">
                  <span>GPS LATITUDE:</span>
                  <span>null</span>
                </div>
                <div className="info-row">
                  <span>GPS LONGITUDE:</span>
                  <span>null</span>
                </div>
                <div className="info-row">
                  <span>GPS ALTITUDE:</span>
                  <span>null</span>
                </div>
                <div className="info-row">
                  <span>GPS STATS:</span>
                  <span>null</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Main;