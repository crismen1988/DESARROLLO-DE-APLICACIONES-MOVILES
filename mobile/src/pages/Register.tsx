import { IonButton, IonContent, IonHeader, IonIcon, IonInput, IonItem, IonLabel, IonPage, IonSpinner, IonText, IonTitle, IonToolbar } from '@ionic/react';
import { CapacitorHttp } from '@capacitor/core';
import { eyeOffOutline, eyeOutline } from 'ionicons/icons';
import { useEffect, useRef, useState } from 'react';
import { useHistory } from 'react-router-dom';
import './Register.css';

type RegistroResponse = { usuario?: { nombre?: string }; accessToken?: string; message?: string | string[] };

const Register: React.FC = () => {
  const history = useHistory();
  const [nombre, setNombre] = useState('');
  const [correo, setCorreo] = useState('');
  const [password, setPassword] = useState('');
  const [confirmarPassword, setConfirmarPassword] = useState('');
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
      setError('Las contraseñas no coinciden');
      return;
    }

    setCargando(true);
    try {
      const response = await CapacitorHttp.post({
        url: `${import.meta.env.VITE_API_URL}/auth/registro`,
        headers: { 'Content-Type': 'application/json' },
        data: { nombre: nombre.trim(), correo: correo.trim(), password },
      });
      const data = response.data as RegistroResponse;
      if (response.status < 200 || response.status >= 300) {
        const message = Array.isArray(data.message) ? data.message.join(', ') : data.message;
        throw new Error(message ?? `No se pudo crear la cuenta (HTTP ${response.status})`);
      }
      localStorage.removeItem('banostour_access_token');
      localStorage.removeItem('banostour_usuario');
      setMensajeExito('Usuario creado correctamente. Serás dirigido al inicio de sesión.');
      setNombre('');
      setCorreo('');
      setPassword('');
      setConfirmarPassword('');
      setMostrarPassword(false);
      setMostrarConfirmarPassword(false);
      redireccionTimer.current = window.setTimeout(() => {
        history.replace('/login', { registroExitoso: true });
      }, 1800);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Error al crear la cuenta');
    } finally {
      setCargando(false);
    }
  };

  return (
    <IonPage>
      <IonHeader><IonToolbar><IonTitle>Crear cuenta</IonTitle></IonToolbar></IonHeader>
      <IonContent fullscreen>
        <form className="register-content" onSubmit={(event) => void registrar(event)}>
          <h1>Únete a BañosTour</h1>
          <p>Crea tu cuenta para guardar y disfrutar tus experiencias.</p>
          <IonItem><IonLabel position="stacked">Nombre</IonLabel><IonInput value={nombre} required minlength={2} placeholder="Tu nombre" onIonInput={(event) => { if (typeof event.detail.value === 'string') setNombre(event.detail.value); }} /></IonItem>
          <IonItem><IonLabel position="stacked">Correo electrónico</IonLabel><IonInput type="email" value={correo} required autocomplete="email" placeholder="tu@correo.com" onIonInput={(event) => { if (typeof event.detail.value === 'string') setCorreo(event.detail.value); }} /></IonItem>
          <IonItem>
            <IonLabel position="stacked">Contraseña</IonLabel>
            <IonInput ref={passwordInputRef} type={mostrarPassword ? 'text' : 'password'} value={password} required minlength={8} autocomplete="new-password" placeholder="Mínimo 8 caracteres" onIonInput={(event) => { if (typeof event.detail.value === 'string') setPassword(event.detail.value); }} />
            <IonButton className="register-password-toggle" fill="clear" slot="end" type="button" aria-label={mostrarPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'} onClick={alternarPassword} onPointerDown={(event) => event.preventDefault()}>
              <IonIcon icon={mostrarPassword ? eyeOffOutline : eyeOutline} />
            </IonButton>
          </IonItem>
          <IonItem>
            <IonLabel position="stacked">Confirmar contraseña</IonLabel>
            <IonInput ref={confirmarPasswordInputRef} type={mostrarConfirmarPassword ? 'text' : 'password'} value={confirmarPassword} required minlength={8} autocomplete="new-password" placeholder="Repite la contraseña" onIonInput={(event) => { if (typeof event.detail.value === 'string') setConfirmarPassword(event.detail.value); }} />
            <IonButton className="register-password-toggle" fill="clear" slot="end" type="button" aria-label={mostrarConfirmarPassword ? 'Ocultar confirmación de contraseña' : 'Mostrar confirmación de contraseña'} onClick={alternarConfirmarPassword} onPointerDown={(event) => event.preventDefault()}>
              <IonIcon icon={mostrarConfirmarPassword ? eyeOffOutline : eyeOutline} />
            </IonButton>
          </IonItem>
          {mensajeExito && <IonText color="success"><p className="register-success">{mensajeExito}</p></IonText>}
          {error && <IonText color="danger"><p className="register-error">{error}</p></IonText>}
          <IonButton expand="block" type="submit" disabled={cargando}>{cargando ? <IonSpinner name="crescent" /> : 'Crear cuenta'}</IonButton>
          <IonButton fill="clear" expand="block" type="button" onClick={() => history.push('/login')}>Ya tengo una cuenta</IonButton>
        </form>
      </IonContent>
    </IonPage>
  );
};

export default Register;
