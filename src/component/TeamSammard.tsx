import React, { useState, useEffect } from 'react';
import { Chart } from 'chart.js/auto';
import mapboxgl from 'mapbox-gl';

const TeamSammard: React.FC = () => {
  const [startTelemetry, setStartTelemetry] = useState(false);
  const [stopTelemetry, setStopTelemetry] = useState(false);
  const [calibrate, setCalibrate] = useState(false);
  const [setTime, setSetTime] = useState(false);

  const [attitudeGraph, setAttitudeGraph] = useState<Chart | null>(null);
  const [temperatureGraph, setTemperatureGraph] = useState<Chart | null>(null);
  const [voltageGraph, setVoltageGraph] = useState<Chart | null>(null);
  const [altitudeGraph, setAltitudeGraph] = useState<Chart | null>(null);

  useEffect(() => {
    initializeCharts();
    initializeMap();
  }, []);

  const initializeCharts = () => {
    destroyCharts();
    createAttitudeGraph();
    createTemperatureGraph();
    createVoltageGraph();
    createAltitudeGraph();
  };

  const destroyCharts = () => {
    if (attitudeGraph) attitudeGraph.destroy();
    if (temperatureGraph) temperatureGraph.destroy();
    if (voltageGraph) voltageGraph.destroy();
    if (altitudeGraph) altitudeGraph.destroy();
  };

  const createAttitudeGraph = () => {
    setAttitudeGraph(
      new Chart(document.getElementById('attitudeGraph') as HTMLCanvasElement, {
        type: 'line',
        data: {
          labels: ['January', 'February', 'March', 'April', 'May', 'June', 'July'],
          datasets: [
            {
              label: 'Attitude',
              data: [65, 59, 80, 81, 56, 55, 40],
              backgroundColor: 'blue',
              borderColor: 'blue',
              borderWidth: 1,
            },
          ],
        },
        options: {
          scales: {
            y: {
              beginAtZero: true,
            },
          },
        },
      })
    );
  };

  const createTemperatureGraph = () => {
    setTemperatureGraph(
      new Chart(document.getElementById('temperatureGraph') as HTMLCanvasElement, {
        type: 'line',
        data: {
          labels: ['January', 'February', 'March', 'April', 'May', 'June', 'July'],
          datasets: [
            {
              label: 'Temperature',
              data: [20, 22, 24, 26, 25, 23, 21],
              backgroundColor: 'red',
              borderColor: 'red',
              borderWidth: 1,
            },
          ],
        },
        options: {
          scales: {
            y: {
              beginAtZero: true,
            },
          },
        },
      })
    );
  };

  const createVoltageGraph = () => {
    setVoltageGraph(
      new Chart(document.getElementById('voltageGraph') as HTMLCanvasElement, {
        type: 'line',
        data: {
          labels: ['January', 'February', 'March', 'April', 'May', 'June', 'July'],
          datasets: [
            {
              label: 'Voltage',
              data: [12, 12.5, 13, 13.2, 13.1, 12.9, 12.7],
              backgroundColor: 'green',
              borderColor: 'green',
              borderWidth: 1,
            },
          ],
        },
        options: {
          scales: {
            y: {
              beginAtZero: true,
            },
          },
        },
      })
    );
  };

  const createAltitudeGraph = () => {
    setAltitudeGraph(
      new Chart(document.getElementById('altitudeGraph') as HTMLCanvasElement, {
        type: 'line',
        data: {
          labels: ['January', 'February', 'March', 'April', 'May', 'June', 'July'],
          datasets: [
            {
              label: 'Altitude',
              data: [100, 120, 150, 180, 200, 220, 240],
              backgroundColor: 'purple',
              borderColor: 'purple',
              borderWidth: 1,
            },
          ],
        },
        options: {
          scales: {
            y: {
              beginAtZero: true,
            },
          },
        },
      })
    );
  };

  const initializeMap = () => {
    mapboxgl.accessToken = 'YOUR_MAPBOX_ACCESS_TOKEN';
    const map = new mapboxgl.Map({
      container: 'map',
      style: 'mapbox://styles/mapbox/streets-v11',
      center: [72.8777, 19.0760],
      zoom: 12,
    });
  };

  const handleStartTelemetry = () => {
    setStartTelemetry(true);
    // Start telemetry logic
  };

  const handleStopTelemetry = () => {
    setStopTelemetry(true);
    // Stop telemetry logic
  };

  const handleCalibrate = () => {
    setCalibrate(true);
    // Calibrate logic
  };

  const handleSetTime = () => {
    setSetTime(true);
    // Set time logic
  };

  return (
    <div className="container">
      <header>
        <h1>TEAM SAMMARD</h1>
        <p>TEAM ID:1007</p>
      </header>
      <main>
        <section className="container">
          <div className="graph-container">
            <h2>Attitude vs Time Graph</h2>
            <canvas id="attitudeGraph"></canvas>
          </div>
          <div className="graph-container">
            <h2>Temperature vs Time Graph</h2>
            <canvas id="temperatureGraph"></canvas>
          </div>
          <div className="graph-container">
            <h2>Voltage vs Time Graph</h2>
            <canvas id="voltageGraph"></canvas>
          </div>
          <div className="graph-container">
            <h2>GPS Altitude vs Time Graph</h2>
            <canvas id="altitudeGraph"></canvas>
          </div>
        </section>
        <section className="map">
          <h2>MAP</h2>
          <div id="map"></div>
        </section>
        <section className="controls">
          <button onClick={handleStartTelemetry}>START TELEMETRY</button>
          <button onClick={handleStopTelemetry}>STOP TELEMETRY</button>
          <button onClick={handleCalibrate}>CALIBRATE</button>
          <button onClick={handleSetTime}>SET TIME</button>
        </section>
        <section className="info">
          <p>MISSION TIME: 11:58:01.00</p>
          <p>PACKET COUNT: 33</p>
        </section>
      </main>
    </div>
  );
};

export default TeamSammard;