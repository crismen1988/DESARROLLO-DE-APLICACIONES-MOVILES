import {
  IonButton,
  IonContent,
  IonIcon,
  IonPage,
  IonSpinner,
  IonText,
  useIonViewWillEnter,
} from '@ionic/react';
import { arrowBackOutline, eyeOffOutline, eyeOutline } from 'ionicons/icons';
import { useEffect, useRef, useState } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import './Login.css';
import { useAuth } from '../auth/useAuth';
import { useLanguage } from '../i18n/useLanguage';

type LoginLocationState = {
  registroExitoso?: boolean;
};

const rememberedEmailKey = 'banostour_remembered_email';
const minimumSuggestionCharacters = 3;

const Login: React.FC = () => {
  const history = useHistory();
  const { iniciarSesion: autenticar } = useAuth();
  const { t } = useLanguage();
  const location = useLocation<LoginLocationState>();
  const [correo, setCorreo] = useState('');
  const [correoRecordado] = useState(() => localStorage.getItem(rememberedEmailKey) ?? '');
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
        ? t('accountCreated')
        : '',
    );
    setCargando(false);
  });

  const mostrarSugerenciaCorreo = Boolean(
    correo.trim().length >= minimumSuggestionCharacters &&
    correoRecordado &&
    correoRecordado.toLowerCase().startsWith(correo.trim().toLowerCase()) &&
    correoRecordado.toLowerCase() !== correo.trim().toLowerCase(),
  );

  const iniciarSesion = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');

    const correoNormalizado = correo.trim();
    if (!correoNormalizado) {
      setError(t('emailRequired'));
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correoNormalizado)) {
      setError(t('emailInvalid'));
      return;
    }

    if (!password) {
      setError(t('passwordRequired'));
      return;
    }

    if (password.length < 8) {
      setError(t('passwordShort'));
      return;
    }

    setCargando(true);

    try {
      await Promise.race([
        autenticar(correo, password),
        new Promise<never>((_, reject) => {
          window.setTimeout(
            () => reject(new Error(t('requestTimeout'))),
            10000,
          );
        }),
      ]);

      localStorage.setItem(rememberedEmailKey, correoNormalizado);
      history.replace('/home');
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : t('loginError'),
      );
    } finally {
      setCargando(false);
    }
  };

  return (
    <IonPage>
      <IonContent fullscreen className="login-scroll">
        <div className="login-page">
          <header className="login-header">
            <IonButton className="login-back" fill="clear" aria-label={t('back')} onClick={() => history.replace('/welcome')}>
              <IonIcon icon={arrowBackOutline} />
            </IonButton>
            <div className="login-brand" aria-label="BañosTour">
            <img src="/assets/icono_banos_tour.jpg" alt="" />
            <span><strong>Baños</strong>Tour</span>
            </div>
          </header>

          <form
            className="login-content"
            noValidate
            onSubmit={(event) => void iniciarSesion(event)}
          >
            <h1 className="login-page-title">{t('login')}</h1>
            <p>{t('loginDescription')}</p>

            <div className="auth-field">
              <label htmlFor="login-correo">{t('email')}</label>
              <span>{t('emailHint')}</span>
              <input
                id="login-correo"
                type="email"
                value={correo}
                required
                autoComplete="email"
                placeholder={t('emailPlaceholder')}
                onChange={(event) => setCorreo(event.target.value)}
              />
              {mostrarSugerenciaCorreo && (
                <div className="remembered-email">
                  <span>{t('rememberedEmail')}</span>
                  <button type="button" onClick={() => setCorreo(correoRecordado)}>{correoRecordado}</button>
                </div>
              )}
            </div>

            <div className="auth-field">
              <label htmlFor="login-password">{t('password')}</label>
              <div className="auth-input-with-action">
                <input
                  id="login-password"
                  ref={passwordInputRef}
                  type={mostrarPassword ? 'text' : 'password'}
                  value={password}
                  required
                  minLength={8}
                  autoComplete="current-password"
                  placeholder={t('passwordPlaceholder')}
                  onChange={(event) => setPassword(event.target.value)}
                />
                <button
                  className="password-toggle"
                  type="button"
                  aria-label={mostrarPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  onClick={alternarPassword}
                  onPointerDown={(event) => event.preventDefault()}
                >
                  <IonIcon icon={mostrarPassword ? eyeOffOutline : eyeOutline} />
                </button>
              </div>
            </div>

            <button className="forgot-password" type="button" onClick={() => history.replace('/forgot-password')}>{t('forgotPassword')}</button>

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
              className="login-submit"
              expand="block"
              type="submit"
              disabled={cargando}
            >
              {cargando ? (
                <IonSpinner name="crescent" />
              ) : (
                  t('login')
              )}
            </IonButton>

            <IonButton
              className="login-link"
              fill="clear"
              expand="block"
              type="button"
              onClick={() => history.replace('/register')}
            >
              {t('createAccount')}
            </IonButton>

          </form>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Login;
