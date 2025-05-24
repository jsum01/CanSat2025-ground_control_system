import React, { useState, useRef, useEffect } from 'react';
import { Chart } from 'chart.js/auto';

interface CsvVisualizerProps {
  isVisible: boolean;
  onClose: () => void;
}

interface TelemetryRow {
  TEAM_ID: string;
  MISSION_TIME: string;
  PACKET_COUNT: string;
  MODE: string;
  STATE: string;
  ALTITUDE: string;
  TEMPERATURE: string;
  PRESSURE: string;
  VOLTAGE: string;
  GYRO_R: string;
  GYRO_P: string;
  GYRO_Y: string;
  ACCEL_R: string;
  ACCEL_P: string;
  ACCEL_Y: string;
  MAG_R: string;
  MAG_P: string;
  MAG_Y: string;
  AUTO_GYRO_ROTATION_RATE: string;
  GPS_TIME: string;
  GPS_ALTITUDE: string;
  GPS_LATITUDE: string;
  GPS_LONGITUDE: string;
  GPS_SATS: string;
  CMD_ECHO: string;
}

declare global {
  interface Window {
    Plotly: any;
  }
}

export const CsvVisualizer: React.FC<CsvVisualizerProps> = ({ isVisible, onClose }) => {
  const [csvData, setCsvData] = useState<TelemetryRow[]>([]);
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>(['ALTITUDE', 'TEMPERATURE', 'PRESSURE', 'VOLTAGE']);
  const [chartType, setChartType] = useState<'line' | 'bar' | '3d'>('line');
  const [altitudeSource, setAltitudeSource] = useState<'ALTITUDE' | 'GPS_ALTITUDE'>('ALTITUDE');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const plotlyDivRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<Chart | null>(null);

  const numericFields = [
    'ALTITUDE', 'TEMPERATURE', 'PRESSURE', 'VOLTAGE',
    'GYRO_R', 'GYRO_P', 'GYRO_Y',
    'ACCEL_R', 'ACCEL_P', 'ACCEL_Y',
    'MAG_R', 'MAG_P', 'MAG_Y',
    'GPS_ALTITUDE', 'GPS_LATITUDE', 'GPS_LONGITUDE'
  ];

  const fieldColors = {
    ALTITUDE: '#FF6384',
    TEMPERATURE: '#36A2EB',
    PRESSURE: '#FFCE56',
    VOLTAGE: '#4BC0C0',
    GYRO_R: '#9966FF',
    GYRO_P: '#FF9F40',
    GYRO_Y: '#FF6384',
    ACCEL_R: '#C9CBCF',
    ACCEL_P: '#4BC0C0',
    ACCEL_Y: '#36A2EB',
    MAG_R: '#FF6384',
    MAG_P: '#36A2EB',
    MAG_Y: '#FFCE56',
    GPS_ALTITUDE: '#00FF00',
    GPS_LATITUDE: '#0000FF',
    GPS_LONGITUDE: '#FF0000'
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split('\n').filter(line => line.trim());
      
      if (lines.length < 2) {
        alert('CSV 파일이 비어있거나 형식이 올바르지 않습니다.');
        return;
      }

      const headers = lines[0].split(',').map(h => h.trim());
      const rows = lines.slice(1).map(line => {
        const values = line.split(',').map(v => v.trim());
        const row: any = {};
        headers.forEach((header, index) => {
          row[header] = values[index] || '';
        });
        return row as TelemetryRow;
      });

      setCsvData(rows);
      alert(`${rows.length}개의 데이터 행을 성공적으로 로드했습니다.`);
    };

    reader.readAsText(file);
  };

  const create3DChart = () => {
    if (!plotlyDivRef.current || csvData.length === 0 || !window.Plotly) return;

    // GPS 궤적 시각화
    const hasGPSData = selectedMetrics.includes('GPS_LATITUDE') && 
                       selectedMetrics.includes('GPS_LONGITUDE');

    if (hasGPSData) {
      // GPS 3D 궤적 생성
      const validData = csvData.filter(row => 
        parseFloat(row.GPS_LATITUDE) && parseFloat(row.GPS_LONGITUDE)
      );

      if (validData.length === 0) {
        alert('유효한 GPS 데이터가 없습니다.');
        return;
      }

      const x = validData.map(row => parseFloat(row.GPS_LONGITUDE));
      const y = validData.map(row => parseFloat(row.GPS_LATITUDE));
      const z = validData.map(row => parseFloat(row[altitudeSource]) || 0);

      const trace = {
        x: x,
        y: y,
        z: z,
        mode: 'lines+markers',
        type: 'scatter3d',
        line: {
          color: '#2E86AB',
          width: 5
        },
        marker: {
          size: 4,
          color: z,
          colorscale: [
            [0, '#440154'],
            [0.1, '#31688e'],
            [0.3, '#35b779'],
            [0.6, '#fde725'],
            [1, '#ff6b6b']
          ],
          showscale: true,
          colorbar: {
            title: {
              text: `${altitudeSource} (m)`,
              font: { size: 12, color: '#333' }
            },
            titleside: 'right',
            thickness: 15,
            len: 0.7,
            x: 1.02,
            xpad: 10,
            bgcolor: 'rgba(255,255,255,0.8)',
            bordercolor: '#ddd',
            borderwidth: 1
          }
        },
        name: 'Flight Path',
        hovertemplate: 
          '<b>비행 경로</b><br>' +
          'Longitude: %{x:.6f}°<br>' +
          'Latitude: %{y:.6f}°<br>' +
          'Altitude: %{z:.1f}m<br>' +
          '<extra></extra>',
        showlegend: true
      };

      // 시작점과 끝점 마커
      const startPoint = {
        x: [x[0]],
        y: [y[0]],
        z: [z[0]],
        mode: 'markers',
        type: 'scatter3d',
        marker: {
          size: 12,
          color: '#28a745',
          symbol: 'circle',
          line: {
            color: '#fff',
            width: 2
          }
        },
        name: '🚀 Launch',
        hovertemplate: '<b>🚀 발사점</b><br>Lon: %{x:.6f}°<br>Lat: %{y:.6f}°<br>Alt: %{z:.1f}m<extra></extra>',
        showlegend: true
      };

      const endPoint = {
        x: [x[x.length - 1]],
        y: [y[y.length - 1]],
        z: [z[z.length - 1]],
        mode: 'markers',
        type: 'scatter3d',
        marker: {
          size: 12,
          color: '#dc3545',
          symbol: 'square',
          line: {
            color: '#fff',
            width: 2
          }
        },
        name: '🎯 Landing',
        hovertemplate: '<b>🎯 착륙점</b><br>Lon: %{x:.6f}°<br>Lat: %{y:.6f}°<br>Alt: %{z:.1f}m<extra></extra>',
        showlegend: true
      };

      const layout = {
        title: {
          text: `3D Flight Trajectory - ${altitudeSource}`,
          font: { 
            size: 18, 
            color: '#2c3e50',
            family: 'Arial, sans-serif'
          },
          x: 0.5,
          xanchor: 'center'
        },
        scene: {
          xaxis: { 
            title: {
              text: 'Longitude (°)',
              font: { size: 12, color: '#555' }
            },
            gridcolor: '#888888',
            gridwidth: 2,
            zerolinecolor: '#666666',
            zerolinewidth: 3,
            showgrid: true,
            showline: true,
            linecolor: '#888888',
            linewidth: 2,
            backgroundcolor: 'rgba(255,255,255,0.1)',
            showbackground: true
          },
          yaxis: { 
            title: {
              text: 'Latitude (°)',
              font: { size: 12, color: '#555' }
            },
            gridcolor: '#888888',
            gridwidth: 2,
            zerolinecolor: '#666666',
            zerolinewidth: 3,
            showgrid: true,
            showline: true,
            linecolor: '#888888',
            linewidth: 2,
            backgroundcolor: 'rgba(255,255,255,0.1)',
            showbackground: true
          },
          zaxis: { 
            title: {
              text: `${altitudeSource} (m)`,
              font: { size: 12, color: '#555' }
            },
            gridcolor: '#888888',
            gridwidth: 2,
            zerolinecolor: '#666666',
            zerolinewidth: 3,
            showgrid: true,
            showline: true,
            linecolor: '#888888',
            linewidth: 2,
            backgroundcolor: 'rgba(255,255,255,0.1)',
            showbackground: true
          },
          camera: {
            eye: { x: 1.8, y: 1.8, z: 1.2 }
          },
          bgcolor: 'rgba(245,245,245,0.9)'
        },
        showlegend: true,
        legend: {
          x: 0.02,
          y: 0.98,
          bgcolor: 'rgba(255,255,255,0.9)',
          bordercolor: '#ddd',
          borderwidth: 1,
          font: { size: 11 }
        },
        margin: { 
          l: 10, 
          r: 80, 
          b: 10, 
          t: 50,
          pad: 5
        },
        paper_bgcolor: 'rgba(255,255,255,1.0)',
        plot_bgcolor: 'rgba(250,250,250,1.0)'
      };

      const config = {
        responsive: true,
        displayModeBar: true,
        displaylogo: false,
        modeBarButtonsToRemove: [
          'pan2d', 
          'lasso2d', 
          'select2d',
          'autoScale2d',
          'hoverClosestCartesian',
          'hoverCompareCartesian',
          'toggleSpikelines'
        ],
        modeBarButtons: [
          ['zoom3d', 'pan3d', 'orbitRotation', 'tableRotation'],
          ['resetCameraDefault3d', 'resetCameraLastSave3d'],
          ['hoverClosest3d'],
          ['toImage']
        ],
        toImageButtonOptions: {
          format: 'png',
          filename: `flight_trajectory_${new Date().toISOString().slice(0, 10)}`,
          height: 800,
          width: 1200,
          scale: 2
        }
      };

      window.Plotly.newPlot(plotlyDivRef.current, [trace, startPoint, endPoint], layout, config);

    } else {
      // 일반 센서 데이터 3D 시각화
      const maxMetrics = Math.min(selectedMetrics.length, 3);
      const traces: {
        x: number[];
        y: number[];
        z: number[];
        mode: string;
        type: string;
        line: { color: string; width: number };
        marker: { size: number; color: string; opacity: number };
        name: string;
        hovertemplate: string;
      }[] = [];

      const colors = ['#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6'];

      for (let i = 0; i < maxMetrics; i++) {
        const metric = selectedMetrics[i];
        const yValues = csvData.map(row => {
          const value = parseFloat(row[metric as keyof TelemetryRow] as string);
          return isNaN(value) ? 0 : value;
        });
        
        const xValues = csvData.map((_, index) => index);
        const zValues = csvData.map(() => i * 30); // 메트릭별로 Z축 분리

        const trace = {
          x: xValues,
          y: yValues,
          z: zValues,
          mode: 'lines+markers',
          type: 'scatter3d',
          line: {
            color: colors[i % colors.length],
            width: 4
          },
          marker: {
            size: 3,
            color: colors[i % colors.length],
            opacity: 0.8
          },
          name: metric,
          hovertemplate: `<b>${metric}</b><br>Value: %{y:.2f}<br>Time Index: %{x}<extra></extra>`
        };

        traces.push(trace);
      }

      const layout = {
        title: {
          text: `3D Sensor Data Visualization`,
          font: { 
            size: 18, 
            color: '#2c3e50',
            family: 'Arial, sans-serif'
          },
          x: 0.5,
          xanchor: 'center'
        },
        scene: {
          xaxis: { 
            title: {
              text: 'Time Index',
              font: { size: 12, color: '#555' }
            },
            gridcolor: '#888888',
            gridwidth: 2,
            zerolinecolor: '#666666',
            zerolinewidth: 3,
            showgrid: true,
            showline: true,
            linecolor: '#888888',
            linewidth: 2,
            backgroundcolor: 'rgba(255,255,255,0.1)',
            showbackground: true
          },
          yaxis: { 
            title: {
              text: 'Sensor Values',
              font: { size: 12, color: '#555' }
            },
            gridcolor: '#888888',
            gridwidth: 2,
            zerolinecolor: '#666666',
            zerolinewidth: 3,
            showgrid: true,
            showline: true,
            linecolor: '#888888',
            linewidth: 2,
            backgroundcolor: 'rgba(255,255,255,0.1)',
            showbackground: true
          },
          zaxis: { 
            title: {
              text: 'Metric Separation',
              font: { size: 12, color: '#555' }
            },
            gridcolor: '#888888',
            gridwidth: 2,
            zerolinecolor: '#666666',
            zerolinewidth: 3,
            showgrid: true,
            showline: true,
            linecolor: '#888888',
            linewidth: 2,
            backgroundcolor: 'rgba(255,255,255,0.1)',
            showbackground: true
          },
          camera: {
            eye: { x: 1.5, y: 1.5, z: 1.2 }
          },
          bgcolor: 'rgba(245,245,245,0.9)'
        },
        showlegend: true,
        legend: {
          x: 0.02,
          y: 0.98,
          bgcolor: 'rgba(255,255,255,0.9)',
          bordercolor: '#ddd',
          borderwidth: 1,
          font: { size: 11 }
        },
        margin: { 
          l: 10, 
          r: 40, 
          b: 10, 
          t: 50,
          pad: 5
        },
        paper_bgcolor: 'rgba(255,255,255,1.0)',
        plot_bgcolor: 'rgba(250,250,250,1.0)'
      };

      const config = {
        responsive: true,
        displayModeBar: true,
        displaylogo: false,
        modeBarButtonsToRemove: [
          'pan2d', 
          'lasso2d', 
          'select2d',
          'autoScale2d'
        ],
        toImageButtonOptions: {
          format: 'png',
          filename: `sensor_data_3d_${new Date().toISOString().slice(0, 10)}`,
          height: 800,
          width: 1200,
          scale: 2
        }
      };

      window.Plotly.newPlot(plotlyDivRef.current, traces, layout, config);
    }
  };

  const create2DChart = () => {
    if (!canvasRef.current || csvData.length === 0) return;

    // 기존 차트 삭제
    if (chartRef.current) {
      chartRef.current.destroy();
    }

    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    // 시간 라벨 생성 (MISSION_TIME 또는 PACKET_COUNT 사용)
    const labels = csvData.map((row, index) => 
      row.MISSION_TIME || `Packet ${row.PACKET_COUNT || index + 1}`
    );

    // 선택된 메트릭에 대한 데이터셋 생성
    const datasets = selectedMetrics.map(metric => ({
      label: metric,
      data: csvData.map(row => {
        const value = parseFloat(row[metric as keyof TelemetryRow] as string);
        return isNaN(value) ? 0 : value;
      }),
      borderColor: fieldColors[metric as keyof typeof fieldColors] || '#000000',
      backgroundColor: (fieldColors[metric as keyof typeof fieldColors] || '#000000') + '20',
      borderWidth: 2,
      fill: false,
      tension: 0.1
    }));

    chartRef.current = new Chart(ctx, {
      type: chartType as 'line' | 'bar',
      data: {
        labels,
        datasets
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: `텔레메트리 데이터 시각화 - ${selectedMetrics.join(', ')}`,
            font: {
              size: 16
            }
          },
          legend: {
            display: true,
            position: 'top'
          }
        },
        scales: {
          x: {
            title: {
              display: true,
              text: 'Time / Packet'
            },
            ticks: {
              maxTicksLimit: 20
            }
          },
          y: {
            title: {
              display: true,
              text: 'Values'
            }
          }
        }
      }
    });
  };

  const downloadChart = () => {
    if (chartType === '3d' && plotlyDivRef.current && window.Plotly) {
      // 3D 차트 다운로드 (Plotly)
      window.Plotly.downloadImage(plotlyDivRef.current, {
        format: 'png',
        filename: `telemetry_3d_chart_${new Date().toISOString().slice(0, 10)}`,
        width: 1200,
        height: 800
      });
    } else if (canvasRef.current) {
      // 2D 차트 다운로드
      const link = document.createElement('a');
      link.download = `telemetry_chart_${new Date().toISOString().slice(0, 10)}.png`;
      link.href = canvasRef.current.toDataURL();
      link.click();
    }
  };

  const handleMetricToggle = (metric: string) => {
    setSelectedMetrics(prev => 
      prev.includes(metric)
        ? prev.filter(m => m !== metric)
        : [...prev, metric]
    );
  };

  useEffect(() => {
    if (csvData.length > 0) {
      if (chartType === '3d') {
        // Plotly.js 스크립트 로드
        if (!window.Plotly) {
          const script = document.createElement('script');
          script.src = 'https://cdnjs.cloudflare.com/ajax/libs/plotly.js/2.26.0/plotly.min.js';
          script.onload = () => create3DChart();
          document.head.appendChild(script);
        } else {
          create3DChart();
        }
      } else {
        create2DChart();
      }
    }
  }, [csvData, selectedMetrics, chartType, altitudeSource]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-6xl max-h-[90vh] w-full mx-4 overflow-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-blue-900">CSV 데이터 시각화</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
          >
            ×
          </button>
        </div>

        {/* 파일 업로드 섹션 */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            CSV 파일 선택:
          </label>
          <input
            type="file"
            accept=".csv"
            onChange={handleFileUpload}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
        </div>

        {csvData.length > 0 && (
          <>
            {/* 컨트롤 섹션 */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* 차트 타입 선택 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    차트 타입:
                  </label>
                  <select
                    value={chartType}
                    onChange={(e) => setChartType(e.target.value as 'line' | 'bar' | '3d')}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  >
                    <option value="line">2D 선 그래프</option>
                    <option value="bar">2D 막대 그래프</option>
                    <option value="3d">3D 궤적 그래프</option>
                  </select>
                </div>

                {/* 고도 데이터 소스 선택 (3D 모드에서만) */}
                {chartType === '3d' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      고도 데이터 소스:
                    </label>
                    <select
                      value={altitudeSource}
                      onChange={(e) => setAltitudeSource(e.target.value as 'ALTITUDE' | 'GPS_ALTITUDE')}
                      className="w-full p-2 border border-gray-300 rounded-md"
                    >
                      <option value="ALTITUDE">기압계 고도</option>
                      <option value="GPS_ALTITUDE">GPS 고도</option>
                    </select>
                  </div>
                )}

                {/* 다운로드 버튼 */}
                <div className="flex items-end">
                  <button
                    onClick={downloadChart}
                    className="w-full bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
                  >
                    📊 차트 이미지 다운로드
                  </button>
                </div>
              </div>

              {/* 메트릭 선택 */}
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  표시할 데이터 선택 {chartType === '3d' ? '(GPS 궤적을 위해 GPS_LATITUDE, GPS_LONGITUDE 선택 권장)' : ''}:
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {numericFields.map(field => (
                    <label key={field} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={selectedMetrics.includes(field)}
                        onChange={() => handleMetricToggle(field)}
                        className="rounded"
                      />
                      <span className={`text-sm ${field.startsWith('GPS') ? 'font-semibold text-blue-600' : ''}`}>
                        {field}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* 3D 차트 안내 */}
              {chartType === '3d' && (
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                  <h4 className="font-semibold text-blue-800 mb-2">3D 시각화 안내 (Plotly.js 사용):</h4>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• <strong>GPS 궤적 모드:</strong> GPS_LATITUDE, GPS_LONGITUDE를 선택하면 실제 비행 경로를 3D로 표시</li>
                    <li>• <strong>일반 데이터 모드:</strong> 선택한 센서 데이터를 3차원 공간에 시간순으로 표시</li>
                    <li>• 마우스로 드래그하여 회전, 휠로 줌, 우클릭으로 팬 가능</li>
                    <li>• 고품질 인터랙티브 3D 시각화 제공</li>
                  </ul>
                </div>
              )}
            </div>

            {/* 차트 영역 */}
            <div className="mb-4">
              <div className="bg-white p-4 rounded-lg border" style={{ height: '500px' }}>
                {chartType === '3d' ? (
                  <div 
                    ref={plotlyDivRef} 
                    className="w-full h-full"
                  />
                ) : (
                  <canvas ref={canvasRef}></canvas>
                )}
              </div>
            </div>

            {/* 데이터 정보 */}
            <div className="text-sm text-gray-600">
              <p>총 데이터 행: {csvData.length}개</p>
              <p>선택된 메트릭: {selectedMetrics.join(', ')}</p>
              {chartType === '3d' && (
                <p>3D 시각화 모드: {
                  selectedMetrics.includes('GPS_LATITUDE') && selectedMetrics.includes('GPS_LONGITUDE') 
                    ? 'GPS 궤적 표시' 
                    : '일반 센서 데이터 표시'
                } (Plotly.js)</p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};