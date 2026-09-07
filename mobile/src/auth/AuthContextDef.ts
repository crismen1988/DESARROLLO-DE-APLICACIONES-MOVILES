import { createContext } from 'react';
import type { Usuario } from './AuthContext';

type AuthContextValue = {
  usuario: Usuario | null;
  accessToken: string | null;
  iniciarSesion: (correo: string, password: string) => Promise<void>;
  cerrarSesion: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);
