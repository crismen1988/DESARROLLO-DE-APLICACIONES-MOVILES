import React, { useEffect, useRef, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { Camera as NativeCamera, CameraResultType, CameraSource } from '@capacitor/camera';
import { AlertCircle, Camera, CheckCircle, Image, QrCode, RefreshCw, Settings, X } from 'lucide-react';
import {
  CapacitorNativeBridge,
  finishExpectedNativeInteraction,
  markExpectedNativeInteraction,
  type RuntimePermissionState,
} from '../services/capacitor';
import { saveOffline } from '../services/offlineCache';

interface CameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'scan' | 'photo';
  title?: string;
  onCapture?: (dataUrl: string) => void;
  onScanResult?: (ticketCode: string) => void;
}

type CameraStage = 'checking' | 'explanation' | 'active' | 'denied' | 'blocked' | 'unavailable';

export const CameraModal: React.FC<CameraModalProps> = ({ isOpen, onClose, mode, title, onCapture }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [stage, setStage] = useState<CameraStage>('checking');
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach(track => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  };

  const saveCapture = async (dataUrl: string) => {
    setCapturedPhoto(dataUrl);
    await saveOffline('native:last-camera-photo', { dataUrl, capturedAt: new Date().toISOString() });
    onCapture?.(dataUrl);
  };

  const startWebCamera = async () => {
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        setStage('unavailable');
        return;
      }
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false });
      streamRef.current = mediaStream;
      setStage('active');
      if (videoRef.current) videoRef.current.srcObject = mediaStream;
    } catch (error) {
      const name = error instanceof DOMException ? error.name : '';
      setStage(name === 'NotAllowedError' ? 'denied' : 'unavailable');
    }
  };

  const takeNativePhoto = async () => {
    markExpectedNativeInteraction();
    try {
      const image = await NativeCamera.getPhoto({
        source: CameraSource.Camera,
        resultType: CameraResultType.DataUrl,
        quality: 78,
        width: 1200,
        height: 1200,
        correctOrientation: true,
        saveToGallery: false,
      });
      if (!image.dataUrl) throw new Error('La cámara no devolvió una imagen.');
      setStage('active');
      await saveCapture(image.dataUrl);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (/cancel/i.test(message)) {
        setStage('active');
        return;
      }
      const state = await CapacitorNativeBridge.getRuntimePermissionState('camera');
      setStage(state === 'blocked' ? 'blocked' : state === 'denied' ? 'denied' : 'unavailable');
    } finally {
      finishExpectedNativeInteraction();
    }
  };

  const activateCamera = async () => {
    setCapturedPhoto(null);
    if (Capacitor.isNativePlatform() && mode === 'photo') {
      setStage('active');
      await takeNativePhoto();
      return;
    }
    await startWebCamera();
  };

  const inspectPermission = async () => {
    setStage('checking');
    if (!Capacitor.isNativePlatform()) {
      setStage('explanation');
      return;
    }
    const permission = await CapacitorNativeBridge.getRuntimePermissionState('camera');
    if (permission === 'granted') {
      await activateCamera();
    } else if (permission === 'blocked') {
      setStage('blocked');
    } else {
      setStage(permission === 'denied' ? 'denied' : 'explanation');
    }
  };

  const requestCamera = async () => {
    if (!Capacitor.isNativePlatform()) {
      await startWebCamera();
      return;
    }
    markExpectedNativeInteraction();
    let permission: RuntimePermissionState = 'denied';
    try {
      await NativeCamera.requestPermissions({ permissions: ['camera'] });
      await CapacitorNativeBridge.markPermissionRequested('camera');
      permission = await CapacitorNativeBridge.getRuntimePermissionState('camera');
    } finally {
      finishExpectedNativeInteraction();
    }
    if (permission === 'granted') await activateCamera();
    else setStage(permission === 'blocked' ? 'blocked' : 'denied');
  };

  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      setCapturedPhoto(null);
      return;
    }
    void inspectPermission();
    return stopCamera;
  }, [isOpen, mode]);

  const takeWebPhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;
    canvas.getContext('2d')?.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    void saveCapture(canvas.toDataURL('image/jpeg', 0.82));
  };

  const handleFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => typeof reader.result === 'string' && void saveCapture(reader.result);
    reader.readAsDataURL(file);
    event.target.value = '';
  };

  if (!isOpen) return null;
  const needsDecision = stage !== 'active' || (!capturedPhoto && mode === 'photo' && Capacitor.isNativePlatform());

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        <div className="p-4 bg-slate-800/80 border-b border-slate-700 flex items-center justify-between text-white">
          <div className="flex items-center space-x-2">
            <Camera className="w-5 h-5 text-teal-400" />
            <h3 className="font-bold text-sm tracking-wide">{title || (mode === 'scan' ? 'Escáner de pases QR' : 'Cámara turística')}</h3>
          </div>
          <button onClick={onClose} aria-label="Cerrar" className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-slate-300 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="relative bg-black flex-1 min-h-[300px] flex items-center justify-center overflow-hidden">
          {capturedPhoto ? (
            <div className="relative w-full h-full">
              <img src={capturedPhoto} alt="Fotografía tomada" className="w-full h-full object-cover" />
              <div className="absolute bottom-3 left-3 right-3 bg-black/70 backdrop-blur-md p-3 rounded-xl flex items-center justify-between text-white text-xs">
                <span className="flex items-center gap-1.5 text-teal-300 font-semibold"><CheckCircle className="w-4 h-4" /> Foto guardada localmente</span>
                <button onClick={() => { setCapturedPhoto(null); void activateCamera(); }} className="px-3 py-1 bg-slate-700 rounded-lg hover:bg-slate-600">Repetir</button>
              </div>
            </div>
          ) : stage === 'active' && (!Capacitor.isNativePlatform() || mode === 'scan') ? (
            <>
              <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
              {mode === 'scan' && (
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <div className="w-64 h-64 border-2 border-teal-400 rounded-2xl relative">
                    <div className="w-full h-0.5 bg-teal-400/80 absolute top-1/2 -translate-y-1/2 animate-pulse" />
                  </div>
                  <p className="text-xs font-semibold text-teal-200 mt-4 bg-black/60 px-3 py-1 rounded-full">Apunta al código QR del pase turístico</p>
                </div>
              )}
            </>
          ) : (
            <div className="p-6 text-center text-slate-300">
              {stage === 'checking' ? <RefreshCw className="w-12 h-12 text-teal-400 mx-auto mb-3 animate-spin" /> : <AlertCircle className="w-12 h-12 text-teal-400 mx-auto mb-3" />}
              <h4 className="text-sm font-bold text-white">
                {stage === 'explanation' ? 'Permitir acceso a la cámara' : stage === 'blocked' ? 'Permiso de cámara bloqueado' : stage === 'denied' ? 'Permiso de cámara denegado' : stage === 'unavailable' ? 'Cámara no disponible' : 'Comprobando cámara'}
              </h4>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                {stage === 'explanation'
                  ? 'BañosTour usará la cámara solamente cuando elijas tomar una fotografía o validar un pase. No graba en segundo plano.'
                  : stage === 'blocked'
                    ? 'La denegación es permanente. Activa Cámara desde los ajustes de BañosTour o selecciona una imagen existente.'
                    : stage === 'denied'
                      ? 'Puedes volver a solicitar el permiso o elegir una imagen con el selector del sistema.'
                      : stage === 'unavailable'
                        ? 'Puedes continuar seleccionando una imagen almacenada en el dispositivo.'
                        : 'Espera un momento.'}
              </p>
              {(stage === 'explanation' || stage === 'denied') && (
                <button onClick={() => void requestCamera()} className="mt-4 min-h-10 rounded-xl bg-teal-600 px-4 text-xs font-bold text-white hover:bg-teal-500">
                  {stage === 'explanation' ? 'Continuar y solicitar permiso' : 'Volver a solicitar permiso'}
                </button>
              )}
              {stage === 'blocked' && (
                <button onClick={() => void CapacitorNativeBridge.openAppSettings()} className="mt-4 min-h-10 rounded-xl bg-teal-600 px-4 text-xs font-bold text-white hover:bg-teal-500 inline-flex items-center gap-2">
                  <Settings className="h-4 w-4" /> Abrir ajustes de la aplicación
                </button>
              )}
            </div>
          )}
        </div>

        <div className="p-4 bg-slate-800 border-t border-slate-700 flex items-center justify-between gap-2">
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
          <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-1.5 text-xs text-slate-300 bg-slate-700 hover:bg-slate-600 px-3 py-2 rounded-lg">
            <Image className="w-3.5 h-3.5" /> Elegir imagen
          </button>
          {mode === 'photo' && stage === 'active' && !Capacitor.isNativePlatform() && !capturedPhoto && (
            <button onClick={takeWebPhoto} className="w-12 h-12 rounded-full bg-teal-500 border-4 border-slate-900 flex items-center justify-center text-white"><Camera className="w-5 h-5" /></button>
          )}
          {mode === 'scan' && stage === 'active' && <span className="text-xs text-teal-300 flex items-center gap-1.5"><QrCode className="w-4 h-4" /> Cámara activa</span>}
          {needsDecision && stage === 'active' && Capacitor.isNativePlatform() && mode === 'photo' && (
            <button onClick={() => void takeNativePhoto()} className="text-xs text-teal-300 font-bold">Abrir cámara</button>
          )}
          <button onClick={onClose} className="text-xs text-slate-300 bg-slate-700 hover:bg-slate-600 px-3 py-2 rounded-lg">Cerrar</button>
        </div>
      </div>
    </div>
  );
};
