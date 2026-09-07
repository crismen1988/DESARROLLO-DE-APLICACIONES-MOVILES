import { IonButton, IonContent, IonPage, IonSpinner, IonText } from '@ionic/react';
import { CapacitorHttp } from '@capacitor/core';
import { useState } from 'react';
import { useHistory } from 'react-router-dom';
import { useLanguage } from '../i18n/useLanguage';
import './Login.css';
import './Recovery.css';

const ForgotPassword: React.FC = () => {
  const history = useHistory();
  const { t } = useLanguage();
  const [correo, setCorreo] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  const solicitar = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setMensaje('');
    const correoNormalizado = correo.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correoNormalizado)) {
      setError(t('emailInvalid'));
      return;
    }

    setCargando(true);
    try {
      await CapacitorHttp.post({
        url: `${import.meta.env.VITE_API_URL}/auth/forgot-password`,
        headers: { 'Content-Type': 'application/json' },
        data: { correo: correoNormalizado },
      });
      setMensaje(t('forgotSent'));
    } catch {
      setMensaje(t('forgotSent'));
    } finally {
      setCargando(false);
    }
  };

  return (
    <IonPage>
      <IonContent fullscreen>
        <div className="login-page recovery-page">
          <div className="login-brand"><img src="/assets/icono_banos_tour.jpg" alt="" /><span><strong>Baños</strong>Tour</span></div>
          <form className="login-content recovery-content" noValidate onSubmit={(event) => void solicitar(event)}>
            <h2>{t('forgotTitle')}</h2>
            <p>{t('forgotDescription')}</p>
            <div className="auth-field">
              <label htmlFor="forgot-email">{t('email')}</label>
              <input id="forgot-email" type="email" value={correo} placeholder={t('emailPlaceholder')} autoComplete="email" onChange={(event) => setCorreo(event.target.value)} />
            </div>
            {mensaje && <IonText color="success"><p className="login-success">{mensaje}</p></IonText>}
            {error && <IonText color="danger"><p className="login-error">{error}</p></IonText>}
            <IonButton className="login-submit" expand="block" type="submit" disabled={cargando}>
              {cargando ? <IonSpinner name="crescent" /> : t('sendInstructions')}
            </IonButton>
            <IonButton className="login-link" fill="clear" expand="block" type="button" onClick={() => history.replace('/login')}>{t('back')}</IonButton>
          </form>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default ForgotPassword;
