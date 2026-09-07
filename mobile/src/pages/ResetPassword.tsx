import { IonButton, IonContent, IonPage, IonSpinner, IonText } from '@ionic/react';
import { CapacitorHttp } from '@capacitor/core';
import { useEffect, useState } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import { useLanguage } from '../i18n/useLanguage';
import './Login.css';
import './Recovery.css';

type ResetLocation = { search: string };

const ResetPassword: React.FC = () => {
  const history = useHistory();
  const location = useLocation<ResetLocation>();
  const { t } = useLanguage();
  const [token] = useState(() => new URLSearchParams(location.search).get('token') ?? '');
  const [password, setPassword] = useState('');
  const [confirmacion, setConfirmacion] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState(token ? '' : t('invalidResetLink'));
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    if (location.search) history.replace('/reset-password');
  }, [history, location.search]);

  const actualizar = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    if (!token) {
      setError(t('invalidResetLink'));
      return;
    }
    if (password.length < 8) {
      setError(t('passwordShort'));
      return;
    }
    if (password !== confirmacion) {
      setError(t('resetPasswordMismatch'));
      return;
    }

    setCargando(true);
    try {
      const response = await CapacitorHttp.post({
        url: `${import.meta.env.VITE_API_URL}/auth/reset-password`,
        headers: { 'Content-Type': 'application/json' },
        data: { token, passwordNueva: password },
      });
      if (response.status < 200 || response.status >= 300) throw new Error('reset-failed');
      setMensaje(t('passwordUpdated'));
      setPassword('');
      setConfirmacion('');
    } catch {
      setError(t('resetPasswordError'));
    } finally {
      setCargando(false);
    }
  };

  return (
    <IonPage>
      <IonContent fullscreen>
        <div className="login-page recovery-page">
          <div className="login-brand"><img src="/assets/icono_banos_tour.jpg" alt="" /><span><strong>Baños</strong>Tour</span></div>
          <form className="login-content recovery-content" noValidate onSubmit={(event) => void actualizar(event)}>
            <h2>{t('newPasswordTitle')}</h2>
            <p>{t('newPasswordDescription')}</p>
            <div className="auth-field"><label htmlFor="new-password">{t('newPassword')}</label><input id="new-password" type="password" value={password} placeholder={t('passwordPlaceholder')} autoComplete="new-password" onChange={(event) => setPassword(event.target.value)} /></div>
            <div className="auth-field"><label htmlFor="confirm-new-password">{t('confirmNewPassword')}</label><input id="confirm-new-password" type="password" value={confirmacion} placeholder={t('confirmPasswordPlaceholder')} autoComplete="new-password" onChange={(event) => setConfirmacion(event.target.value)} /></div>
            {mensaje && <IonText color="success"><p className="login-success">{mensaje}</p></IonText>}
            {error && <IonText color="danger"><p className="login-error">{error}</p></IonText>}
            <IonButton className="login-submit" expand="block" type="submit" disabled={cargando || Boolean(mensaje)}>{cargando ? <IonSpinner name="crescent" /> : t('updatePassword')}</IonButton>
            <IonButton className="login-link" fill="clear" expand="block" type="button" onClick={() => history.replace('/login')}>{t('login')}</IonButton>
          </form>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default ResetPassword;
