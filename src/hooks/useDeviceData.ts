
import { useState, useEffect } from 'react';
import { captureDeviceData, saveDeviceData, type DeviceDataCapture } from '@/services/deviceDataService';

export const useDeviceData = (phone?: string) => {
  const [deviceData, setDeviceData] = useState<DeviceDataCapture | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Capturar dados do dispositivo automaticamente quando o hook é usado
  useEffect(() => {
    const loadDeviceData = async () => {
      setIsLoading(true);
      try {
        const data = await captureDeviceData(phone);
        setDeviceData(data);
        
        // Salvar automaticamente se tiver telefone
        if (phone) {
          await saveDeviceData(data);
          console.log('📱 Dados do dispositivo capturados e salvos automaticamente para:', phone);
        }
      } catch (error) {
        console.error('Erro ao capturar dados do dispositivo:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadDeviceData();
  }, [phone]);

  // Função para capturar e salvar dados com telefone
  const captureAndSave = async (phoneNumber?: string) => {
    setIsLoading(true);
    try {
      const data = await captureDeviceData(phoneNumber);
      setDeviceData(data);
      
      if (phoneNumber) {
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
