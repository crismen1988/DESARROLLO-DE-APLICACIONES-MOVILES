import {
  IonButton,
  IonContent,
  IonHeader,
  IonIcon,
  IonInput,
  IonItem,
  IonLabel,
  IonPage,
  IonSpinner,
  IonText,
  IonTitle,
  IonToolbar,
  useIonViewWillEnter,
} from '@ionic/react';
import { CapacitorHttp } from '@capacitor/core';
import { eyeOffOutline, eyeOutline } from 'ionicons/icons';
import { useEffect, useRef, useState } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import './Login.css';

type LoginResponse = {
  usuario?: { nombre?: string };
  accessToken?: string;
};

type ApiError = {
  message?: string | string[];
};

type LoginLocationState = {
  registroExitoso?: boolean;
};

const Login: React.FC = () => {
  const history = useHistory();
  const location = useLocation<LoginLocationState>();
  const [correo, setCorreo] = useState('');
  const [password, setPassword] = useState('');
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [cargando, setCargando] = useState(false);
  const ocultarPasswordTimer = useRef<number | undefined>(undefined);
  const passwordInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      if (ocultarPasswordTimer.current !== undefined) {
        window.clearTimeout(ocultarPasswordTimer.current);
      }
    };
  }, []);

  const alternarPassword = async () => {
    const input = passwordInputRef.current;
    const selection = input
      ? { start: input.selectionStart ?? input.value.length, end: input.selectionEnd ?? input.value.length }
      : undefined;

    if (ocultarPasswordTimer.current !== undefined) {
      window.clearTimeout(ocultarPasswordTimer.current);
    }

    const mostrar = !mostrarPassword;
    setMostrarPassword(mostrar);

    window.requestAnimationFrame(async () => {
      const updatedInput = passwordInputRef.current;
      if (updatedInput && selection) {
        updatedInput.focus();
        updatedInput.setSelectionRange(selection.start, selection.end);
      }
    });

    if (mostrar) {
      ocultarPasswordTimer.current = window.setTimeout(() => {
        setMostrarPassword(false);
      }, 1500);
    }
  };

  useIonViewWillEnter(() => {
    setCorreo('');
    setPassword('');
    setMostrarPassword(false);
    setError('');
    setMensaje(
      location.state?.registroExitoso
        ? 'Cuenta creada correctamente. Inicia sesión para continuar.'
        : '',
    );
  });

  const iniciarSesion = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setCargando(true);

    try {
      const apiUrl = import.meta.env.VITE_API_URL;

      const response = await CapacitorHttp.post({
        url: `${apiUrl}/auth/login`,
        headers: {
          'Content-Type': 'application/json',
        },
        data: {
          correo: correo.trim(),
          password,
        },
      });

      const data = response.data as LoginResponse & ApiError;

      if (
        response.status < 200 ||
        response.status >= 300 ||
        !data.accessToken
      ) {
        const message = Array.isArray(data.message)
          ? data.message.join(', ')
          : data.message;

        throw new Error(
          message ?? `No se pudo iniciar sesión (HTTP ${response.status})`,
        );
      }

      localStorage.setItem('banostour_access_token', data.accessToken);
      localStorage.setItem(
        'banostour_usuario',
        JSON.stringify(data.usuario ?? {}),
      );

      history.replace('/home');
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : 'Error al iniciar sesión',
      );
    } finally {
      setCargando(false);
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Iniciar sesión</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen>
        <form
          className="login-content"
          onSubmit={(event) => void iniciarSesion(event)}
        >
          <h1>Bienvenido</h1>
          <p>Ingresa a tu cuenta para continuar en BañosTour.</p>

          <IonItem>
            <IonLabel position="stacked">Correo electrónico</IonLabel>
            <IonInput
              type="email"
              value={correo}
              required
              autocomplete="email"
              placeholder="tu@correo.com"
              onIonInput={(event) => {
                if (typeof event.detail.value === 'string') {
                  setCorreo(event.detail.value);
                }
              }}
            />
          </IonItem>

          <IonItem>
            <IonLabel position="stacked">Contraseña</IonLabel>
            <input
              ref={passwordInputRef}
              className="login-password-input"
              type={mostrarPassword ? 'text' : 'password'}
              value={password}
              required
              minLength={8}
              autoComplete="current-password"
              placeholder="Mínimo 8 caracteres"
              onChange={(event) => setPassword(event.target.value)}
            />

            <IonButton
              className="password-toggle"
              fill="clear"
              slot="end"
              type="button"
              aria-label={
                mostrarPassword
                  ? 'Ocultar contraseña'
                  : 'Mostrar contraseña'
              }
              onClick={alternarPassword}
              onPointerDown={(event) => event.preventDefault()}
            >
              <IonIcon
                icon={
                  mostrarPassword
                    ? eyeOffOutline
                    : eyeOutline
                }
              />
            </IonButton>
          </IonItem>

          {mensaje && (
            <IonText color="success">
              <p className="login-success">{mensaje}</p>
            </IonText>
          )}

          {error && (
            <IonText color="danger">
              <p className="login-error">{error}</p>
            </IonText>
          )}

          <IonButton
            expand="block"
            type="submit"
            disabled={cargando}
          >
            {cargando ? (
              <IonSpinner name="crescent" />
            ) : (
              'Entrar'
            )}
          </IonButton>

          <IonButton
            fill="clear"
            expand="block"
            type="button"
            onClick={() => history.push('/register')}
          >
            Crear una cuenta
          </IonButton>

          <IonButton
            fill="clear"
            expand="block"
            type="button"
            onClick={() => history.push('/welcome')}
          >
            Volver
          </IonButton>
        </form>
      </IonContent>
    </IonPage>
  );
};

export default Login;
