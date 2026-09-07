import { IonButton, IonContent, IonPage } from '@ionic/react';
import { useHistory } from 'react-router-dom';
import './Welcome.css';
import LanguageSelector from '../components/LanguageSelector';
import { useLanguage } from '../i18n/useLanguage';

const Welcome: React.FC = () => {
  const history = useHistory();
  const { t } = useLanguage();

  return (
    <IonPage>
      <IonContent fullscreen>
        <div className="welcome-content">
          <div className="welcome-overlay" />
          <LanguageSelector />
          <div className="welcome-brand" aria-label="BañosTour">
            <img
              className="welcome-brand-mark"
              src="/assets/icono_banos_tour.jpg"
              alt=""
            />
            <span><strong>Baños</strong>Tour</span>
          </div>
          <main className="welcome-hero">
            <h1>{t('welcomeTitle').split('|').map((line) => <span key={line}>{line}<br /></span>)}</h1>
            <p>{t('welcomeDescription').split('|').map((line) => <span key={line}>{line}<br /></span>)}</p>
          </main>
          <div className="welcome-action">
            <IonButton expand="block" onClick={() => history.replace('/login')}>
              {t('login')}
            </IonButton>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Welcome;
