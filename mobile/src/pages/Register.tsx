import { IonButton, IonContent, IonIcon, IonInput, IonItem, IonLabel, IonPage, IonSegment, IonSegmentButton, IonSpinner, IonText } from '@ionic/react';
import { CapacitorHttp } from '@capacitor/core';
import { eyeOffOutline, eyeOutline } from 'ionicons/icons';
import { useEffect, useRef, useState } from 'react';
import { useHistory } from 'react-router-dom';
import './Register.css';
import { useLanguage } from '../i18n/useLanguage';

type RegistroResponse = { usuario?: { nombre?: string }; accessToken?: string; message?: string | string[] };
type TipoCuenta = 'TURISTA' | 'PRESTADOR_TURISTICO';

const Register: React.FC = () => {
  const history = useHistory();
  const { t } = useLanguage();
  const [nombre, setNombre] = useState('');
  const [correo, setCorreo] = useState('');
  const [password, setPassword] = useState('');
  const [confirmarPassword, setConfirmarPassword] = useState('');
  const [tipoCuenta, setTipoCuenta] = useState<TipoCuenta>('TURISTA');
  const [ruc, setRuc] = useState('');
  const [razonSocial, setRazonSocial] = useState('');
  const [nombreComercial, setNombreComercial] = useState('');
  const [telefono, setTelefono] = useState('');
  const [direccion, setDireccion] = useState('');
  const [ciudad, setCiudad] = useState('');
  const [actividadTuristica, setActividadTuristica] = useState('');
  const [sitioWeb, setSitioWeb] = useState('');
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [mostrarConfirmarPassword, setMostrarConfirmarPassword] = useState(false);
  const [error, setError] = useState('');
  const [mensajeExito, setMensajeExito] = useState('');
  const [cargando, setCargando] = useState(false);
  const ocultarPasswordTimer = useRef<number | undefined>(undefined);
  const ocultarConfirmarPasswordTimer = useRef<number | undefined>(undefined);
  const redireccionTimer = useRef<number | undefined>(undefined);
  const passwordInputRef = useRef<HTMLIonInputElement>(null);
  const confirmarPasswordInputRef = useRef<HTMLIonInputElement>(null);

  useEffect(() => {
    return () => {
      if (ocultarPasswordTimer.current !== undefined) {
        window.clearTimeout(ocultarPasswordTimer.current);
      }
      if (ocultarConfirmarPasswordTimer.current !== undefined) {
        window.clearTimeout(ocultarConfirmarPasswordTimer.current);
      }
      if (redireccionTimer.current !== undefined) {
        window.clearTimeout(redireccionTimer.current);
      }
    };
  }, []);

  const alternarPassword = async () => {
    const input = await passwordInputRef.current?.getInputElement();
    const selection = input
      ? { start: input.selectionStart ?? input.value.length, end: input.selectionEnd ?? input.value.length }
      : undefined;

    if (ocultarPasswordTimer.current !== undefined) {
      window.clearTimeout(ocultarPasswordTimer.current);
    }

    const mostrar = !mostrarPassword;
    setMostrarPassword(mostrar);

    window.requestAnimationFrame(async () => {
      const updatedInput = await passwordInputRef.current?.getInputElement();
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

  const alternarConfirmarPassword = async () => {
    const input = await confirmarPasswordInputRef.current?.getInputElement();
    const selection = input
      ? { start: input.selectionStart ?? input.value.length, end: input.selectionEnd ?? input.value.length }
      : undefined;

    if (ocultarConfirmarPasswordTimer.current !== undefined) {
      window.clearTimeout(ocultarConfirmarPasswordTimer.current);
    }

    const mostrar = !mostrarConfirmarPassword;
    setMostrarConfirmarPassword(mostrar);

    window.requestAnimationFrame(async () => {
      const updatedInput = await confirmarPasswordInputRef.current?.getInputElement();
      if (updatedInput && selection) {
        updatedInput.focus();
        updatedInput.setSelectionRange(selection.start, selection.end);
      }
    });

    if (mostrar) {
      ocultarConfirmarPasswordTimer.current = window.setTimeout(() => {
        setMostrarConfirmarPassword(false);
      }, 1500);
    }
  };

  const registrar = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');

    if (password !== confirmarPassword) {
      setError(t('passwordMismatch'));
      return;
    }

    if (tipoCuenta === 'PRESTADOR_TURISTICO' && !/^\d{13}$/.test(ruc.trim())) {
      setError(t('providerRucError'));
      return;
    }

    if (
      tipoCuenta === 'PRESTADOR_TURISTICO' &&
      [razonSocial, nombreComercial, telefono, direccion, ciudad, actividadTuristica].some(
        (campo) => !campo.trim(),
      )
    ) {
      setError(t('providerInfoError'));
      return;
    }

    setCargando(true);
    try {
      const response = await CapacitorHttp.post({
        url: `${import.meta.env.VITE_API_URL}/auth/registro`,
        headers: { 'Content-Type': 'application/json' },
        data: {
          nombre: nombre.trim(),
          correo: correo.trim(),
          password,
          tipoCuenta,
          ...(tipoCuenta === 'PRESTADOR_TURISTICO' ? { ruc: ruc.trim() } : {}),
          ...(tipoCuenta === 'PRESTADOR_TURISTICO'
            ? {
                razonSocial: razonSocial.trim(),
                nombreComercial: nombreComercial.trim(),
                telefono: telefono.trim(),
                direccion: direccion.trim(),
                ciudad: ciudad.trim(),
                actividadTuristica: actividadTuristica.trim(),
                ...(sitioWeb.trim() ? { sitioWeb: sitioWeb.trim() } : {}),
              }
            : {}),
        },
      });
      const data = response.data as RegistroResponse;
      if (response.status < 200 || response.status >= 300) {
        const message = Array.isArray(data.message) ? data.message.join(', ') : data.message;
        throw new Error(message ?? `No se pudo crear la cuenta (HTTP ${response.status})`);
      }
      setMensajeExito(t('accountCreatedRedirect'));
      setNombre('');
      setCorreo('');
      setPassword('');
      setConfirmarPassword('');
      setTipoCuenta('TURISTA');
      setRuc('');
      setRazonSocial('');
      setNombreComercial('');
      setTelefono('');
      setDireccion('');
      setCiudad('');
      setActividadTuristica('');
      setSitioWeb('');
      setMostrarPassword(false);
      setMostrarConfirmarPassword(false);
      redireccionTimer.current = window.setTimeout(() => {
        history.replace('/login', { registroExitoso: true });
      }, 1800);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : t('registerError'));
    } finally {
      setCargando(false);
    }
  };

  return (
    <IonPage>
      <IonContent fullscreen>
        <div className="register-page">
          <header className="register-brand" aria-label="BañosTour">
            <img src="/assets/icono_banos_tour.jpg" alt="" />
            <span><strong>Baños</strong>Tour</span>
          </header>
        <form className="register-content" onSubmit={(event) => void registrar(event)}>
          <span className="register-eyebrow">{t('createAccount')}</span>
          <h1>{t('registerTitle')}</h1>
          <p>{t('registerDescription')}</p>
          <div className="account-type-field">
            <span className="account-type-label">{t('accountType')}</span>
            <IonSegment
              value={tipoCuenta}
              onIonChange={(event) => {
                const value = event.detail.value as TipoCuenta;
                setTipoCuenta(value);
                setError('');
                if (value === 'TURISTA') setRuc('');
              }}
            >
              <IonSegmentButton value="TURISTA">{t('tourist')}</IonSegmentButton>
              <IonSegmentButton value="PRESTADOR_TURISTICO">{t('provider')}</IonSegmentButton>
            </IonSegment>
          </div>
          {tipoCuenta === 'PRESTADOR_TURISTICO' && (
            <>
              <IonItem>
                <IonLabel position="stacked">{t('ruc')}</IonLabel>
                <IonInput
                  value={ruc}
                  required
                  inputmode="numeric"
                  maxlength={13}
                  onIonInput={(event) => {
                    if (typeof event.detail.value === 'string') {
                      setRuc(event.detail.value.replace(/\D/g, '').slice(0, 13));
                    }
                  }}
                />
              </IonItem>
            </>
          )}
          <IonItem><IonLabel position="stacked">{tipoCuenta === 'TURISTA' ? t('fullName') : t('responsibleName')}</IonLabel><IonInput value={nombre} required minlength={2} onIonInput={(event) => { if (typeof event.detail.value === 'string') setNombre(event.detail.value); }} /></IonItem>
          {tipoCuenta === 'PRESTADOR_TURISTICO' && (
            <div className="provider-fields">
              <p className="register-section-title">{t('businessInfo')}</p>
              <IonItem><IonLabel position="stacked">{t('businessName')}</IonLabel><IonInput value={razonSocial} required onIonInput={(event) => { if (typeof event.detail.value === 'string') setRazonSocial(event.detail.value); }} /></IonItem>
              <IonItem><IonLabel position="stacked">{t('commercialName')}</IonLabel><IonInput value={nombreComercial} required onIonInput={(event) => { if (typeof event.detail.value === 'string') setNombreComercial(event.detail.value); }} /></IonItem>
              <IonItem><IonLabel position="stacked">{t('tourismActivity')}</IonLabel><IonInput value={actividadTuristica} required onIonInput={(event) => { if (typeof event.detail.value === 'string') setActividadTuristica(event.detail.value); }} /></IonItem>
              <IonItem><IonLabel position="stacked">{t('phone')}</IonLabel><IonInput value={telefono} required type="tel" onIonInput={(event) => { if (typeof event.detail.value === 'string') setTelefono(event.detail.value); }} /></IonItem>
              <IonItem><IonLabel position="stacked">{t('address')}</IonLabel><IonInput value={direccion} required onIonInput={(event) => { if (typeof event.detail.value === 'string') setDireccion(event.detail.value); }} /></IonItem>
              <IonItem><IonLabel position="stacked">{t('city')}</IonLabel><IonInput value={ciudad} required onIonInput={(event) => { if (typeof event.detail.value === 'string') setCiudad(event.detail.value); }} /></IonItem>
              <IonItem><IonLabel position="stacked">{t('websiteOptional')}</IonLabel><IonInput value={sitioWeb} type="url" onIonInput={(event) => { if (typeof event.detail.value === 'string') setSitioWeb(event.detail.value); }} /></IonItem>
            </div>
          )}
          <IonItem><IonLabel position="stacked">{t('email')}</IonLabel><IonInput type="email" value={correo} placeholder={t('emailPlaceholder')} required autocomplete="email" onIonInput={(event) => { if (typeof event.detail.value === 'string') setCorreo(event.detail.value); }} /></IonItem>
          <IonItem>
            <IonLabel position="stacked">{t('password')}</IonLabel>
            <IonInput ref={passwordInputRef} type={mostrarPassword ? 'text' : 'password'} value={password} placeholder={t('passwordPlaceholder')} required minlength={8} autocomplete="new-password" onIonInput={(event) => { if (typeof event.detail.value === 'string') setPassword(event.detail.value); }} />
            <IonButton className="register-password-toggle" fill="clear" slot="end" type="button" aria-label={mostrarPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'} onClick={alternarPassword} onPointerDown={(event) => event.preventDefault()}>
              <IonIcon icon={mostrarPassword ? eyeOffOutline : eyeOutline} />
            </IonButton>
          </IonItem>
          <IonItem>
            <IonLabel position="stacked">{t('confirmPassword')}</IonLabel>
            <IonInput ref={confirmarPasswordInputRef} type={mostrarConfirmarPassword ? 'text' : 'password'} value={confirmarPassword} placeholder={t('confirmPasswordPlaceholder')} required minlength={8} autocomplete="new-password" onIonInput={(event) => { if (typeof event.detail.value === 'string') setConfirmarPassword(event.detail.value); }} />
            <IonButton className="register-password-toggle" fill="clear" slot="end" type="button" aria-label={mostrarConfirmarPassword ? 'Ocultar confirmación de contraseña' : 'Mostrar confirmación de contraseña'} onClick={alternarConfirmarPassword} onPointerDown={(event) => event.preventDefault()}>
              <IonIcon icon={mostrarConfirmarPassword ? eyeOffOutline : eyeOutline} />
            </IonButton>
          </IonItem>
          {mensajeExito && <IonText color="success"><p className="register-success">{mensajeExito}</p></IonText>}
          {error && <IonText color="danger"><p className="register-error">{error}</p></IonText>}
          <IonButton className="register-submit" expand="block" type="submit" disabled={cargando}>{cargando ? <IonSpinner name="crescent" /> : t('createAccount')}</IonButton>
          <IonButton className="register-login-link" fill="clear" expand="block" type="button" onClick={() => history.replace('/login')}>{t('alreadyAccount')}</IonButton>
        </form>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Register;
