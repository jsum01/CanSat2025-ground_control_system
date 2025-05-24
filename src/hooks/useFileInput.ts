import { useContext, useState } from 'react';
import { FileInputContext } from 'context/FileInputContext';
import { useLoading } from 'hooks/useLoading';

export const useFileInput = () => {
  const context = useContext(FileInputContext);
  const { showLoading, hideLoading } = useLoading();
  
  // 파일 선택 완료 후 호출할 콜백 함수 저장
  const [fileSelectCallback, setFileSelectCallback] = useState<((isValid: boolean) => void) | null>(null);
  
  if (!context) {
    throw new Error('useFileInput must be used within FileInputProvider');
  }
  
  // 파일 확장자 확인 함수
  const getFileExtension = (filename: string): string => {
    return filename.split('.').pop()?.toLowerCase() || '';
  };
  
  // 파일 선택 처리 함수
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const fileExtension = getFileExtension(file.name);
      
      try {
        showLoading("파일 로드 중...");
        
        // 파일 내용 읽기
        const text = await file.text();
        
        // 파일 정보 업데이트
        context.setSelectedFile(file);
        context.setFileContent(text);
        
        // 파일 유효성 검사
        const isValid = text.trim().length > 0;
        context.setHasValidFile(isValid);
        
        hideLoading();
        
        // 다이얼로그 상태 리셋
        context.setShowFileDialog(false);
        
        // 저장된 콜백 함수가 있으면 호출
        if (fileSelectCallback) {
          fileSelectCallback(isValid);
          setFileSelectCallback(null); // 콜백 사용 후 초기화
        }
        
        if (isValid) {
          const fileTypeMessage = fileExtension === 'csv' ? 'CSV' : 'TXT';
          alert(`${fileTypeMessage} 시뮬레이션 데이터 전송 준비가 완료되었습니다.\n\n${fileTypeMessage} simulation data is ready to be transmitted.`);
        }
        
        return { 
          file, 
          content: text,
          success: true,
          isValid,
          fileType: fileExtension
        };
      } catch (error) {
        console.error("Failed to load file:", error);
        hideLoading();
        context.setShowFileDialog(false);
        
        return {
          success: false,
          error
        };
      }
    }
    
    return {
      success: false,
      error: new Error("No file selected")
    };
  };
  
  // 파일 다이얼로그 열기
  const openFileDialog = (callback?: (isValid: boolean) => void) => {
    // 콜백 함수가 제공되면 저장
    if (callback) {
      setFileSelectCallback(callback);
    }
    context.setShowFileDialog(true);
  };
  
  // 파일 상태 리셋
  const resetFileInput = () => {
    context.setSelectedFile(null);
    context.setFileContent('');
    context.setHasValidFile(false);
    setFileSelectCallback(null); // 콜백도 초기화
  };
  
  // 파일 데이터 파싱 (시뮬레이션 전용 - TXT 및 CSV 지원)
  const parseSimulationFile = (content: string): string[] => {
    const lines = content
      .split("\n")
      .filter((line) => line.trim() && !line.startsWith("#"))
      .map((line) => line.trim());

    // CSV 파일인지 확인 (콤마가 포함된 라인이 있는지 체크)
    const hasCommas = lines.some(line => line.includes(','));
    
    if (hasCommas) {
      // CSV 형태의 데이터 처리
      return lines.map((line) => {
        // CSV 라인을 파싱하여 첫 번째 컬럼을 사용하거나
        // 전체 라인을 명령어로 사용 (프로젝트 요구사항에 따라 조정)
        const columns = line.split(',').map(col => col.trim());
        
        // 만약 첫 번째 컬럼이 '$'로 시작하면 팀 ID로 교체
        if (columns[0] && columns[0].startsWith("$")) {
          columns[0] = columns[0].replace("$", "3167");
          return columns.join(',');
        }
        
        // 아니면 전체 라인에서 '$'를 팀 ID로 교체
        return line.replace(/\$/g, "3167");
      });
    } else {
      // TXT 형태의 데이터 처리 (기존 로직)
      return lines.map((line) => line.replace("$", "3167"));
    }
  };

  return {
    ...context,
    handleFileSelect,
    openFileDialog,
    resetFileInput,
    parseSimulationFile,
    getFileExtension
  };
};