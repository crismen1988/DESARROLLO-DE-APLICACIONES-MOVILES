import { CapacitorHttp } from '@capacitor/core';
import { useMemo, useRef, useState } from 'react';
import { AuthContext } from './AuthContextDef';

export type Usuario = {
  id: number;
  correo: string;
  nombre: string;
  rol: string;
};

type AuthResponse = {
  usuario: Usuario;
  accessToken: string;
  refreshToken: string;
};

const apiUrl = import.meta.env.VITE_API_URL as string | undefined;

export const AuthProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const refreshToken = useRef<string | null>(null);

  const iniciarSesion = async (correo: string, password: string) => {
    if (!apiUrl) throw new Error('La URL de la API no está configurada');

    const response = await CapacitorHttp.post({
      url: `${apiUrl}/auth/login`,
      headers: { 'Content-Type': 'application/json' },
      data: { correo: correo.trim(), password },
    });
    const data = response.data as AuthResponse & { message?: string | string[] };

    if (response.status < 200 || response.status >= 300 || !data.accessToken || !data.refreshToken) {
      const message = Array.isArray(data.message) ? data.message.join(', ') : data.message;
      throw new Error(message ?? `No se pudo iniciar sesión (HTTP ${response.status})`);
    }

    setUsuario(data.usuario);
    setAccessToken(data.accessToken);
    refreshToken.current = data.refreshToken;
  };

  const cerrarSesion = async () => {
    const token = refreshToken.current;
    try {
      if (apiUrl && token) {
        await CapacitorHttp.post({
          url: `${apiUrl}/auth/logout`,
          headers: { 'Content-Type': 'application/json' },
          data: { refreshToken: token },
        });
      }
    } finally {
      refreshToken.current = null;
      setAccessToken(null);
      setUsuario(null);
    }
  };

  const value = useMemo(
    () => ({ usuario, accessToken, iniciarSesion, cerrarSesion }),
    [usuario, accessToken],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

