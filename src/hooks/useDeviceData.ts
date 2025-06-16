
import { useState, useEffect } from 'react';
import { captureDeviceData, saveDeviceData, type DeviceDataCapture } from '@/services/deviceDataService';

export const useDeviceData = () => {
  const [deviceData, setDeviceData] = useState<DeviceDataCapture | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Capturar dados do dispositivo automaticamente quando o hook é usado
  useEffect(() => {
    const loadDeviceData = async () => {
      setIsLoading(true);
      try {
        const data = await captureDeviceData();
        setDeviceData(data);
      } catch (error) {
        console.error('Erro ao capturar dados do dispositivo:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadDeviceData();
  }, []);

  // Função para capturar e salvar dados com telefone
  const captureAndSave = async (phone?: string) => {
    setIsLoading(true);
    try {
      const data = await captureDeviceData(phone);
      setDeviceData(data);
      
      if (phone) {
        await saveDeviceData(data);
      }
      
      return data;
    } catch (error) {
      console.error('Erro ao capturar e salvar dados:', error);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    deviceData,
    isLoading,
    captureAndSave
  };
};
