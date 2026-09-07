import {
  IonButton,
  IonContent,
  IonHeader,
  IonIcon,
  IonPage,
  IonTitle,
  IonToolbar,
} from '@ionic/react';
import { arrowForwardOutline, businessOutline, calendarOutline, heartOutline, locationOutline, personCircleOutline, shieldCheckmarkOutline, sparklesOutline } from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import { Redirect } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';
import './Home.css';
import BottomNav from '../components/BottomNav';
import { useLanguage } from '../i18n/useLanguage';
import TouristHome from './TouristHome';

const Home: React.FC = () => {
  const history = useHistory();
  const { usuario, cerrarSesion } = useAuth();
  const { t } = useLanguage();
  const esProveedor = usuario?.rol === 'PROVEEDOR';
  const esAdministrador = usuario?.rol === 'ADMINISTRADOR';

  if (esAdministrador) return <Redirect to="/admin" />;
  if (!esProveedor) return <TouristHome />;

  return (
    <IonPage className="home-page">
      <IonHeader className="home-header">
        <IonToolbar>
          <IonTitle><span className="home-wordmark"><strong>Baños</strong>Tour</span></IonTitle>
          <IonButton className="home-profile-button" slot="end" fill="clear" onClick={() => history.push('/perfil')} aria-label={t('profile')}>
            <IonIcon icon={personCircleOutline} />
          </IonButton>
          <IonButton slot="end" fill="clear" onClick={() => void cerrarSesion().finally(() => history.replace('/welcome'))}>
            {t('logout')}
          </IonButton>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        <IonHeader collapse="condense">
          <IonToolbar>
            <IonTitle size="large">BañosTour</IonTitle>
          </IonToolbar>
        </IonHeader>
        <div className={`home-content ${esProveedor || esAdministrador ? 'provider-dashboard' : 'tourist-dashboard'}`}>
          <div className="home-welcome-row">
            <div>
              <span className="home-eyebrow">{esAdministrador ? t('adminSpace') : esProveedor ? t('providerSpace') : t('touristSpace')}</span>
              <h1>{t('greeting')}, {usuario?.nombre}</h1>
              <p>{esAdministrador ? t('adminSpace') : esProveedor ? t('providerSubtitle') : t('touristSubtitle')}</p>
            </div>
            <div className="home-avatar"><IonIcon icon={esProveedor || esAdministrador ? businessOutline : sparklesOutline} /></div>
          </div>

          <div className="home-hero-card">
            <div className="home-hero-icon"><IonIcon icon={esProveedor || esAdministrador ? businessOutline : locationOutline} /></div>
            <div><strong>{esProveedor || esAdministrador ? t('providerPrompt') : t('touristPrompt')}</strong><span>{t('appDescription')}</span></div>
          </div>

          <div className="home-action-grid">
            <button className="home-action-card home-action-primary" type="button" onClick={() => history.push('/catalogo')}>
              <IonIcon icon={esProveedor || esAdministrador ? businessOutline : locationOutline} /><span>{esProveedor || esAdministrador ? t('viewCatalog') : t('discoverPlaces')}</span><IonIcon className="action-arrow" icon={arrowForwardOutline} />
            </button>
            <button className="home-action-card" type="button" onClick={() => history.push(esProveedor || esAdministrador ? '/perfil' : '/favoritos')}>
              <IonIcon icon={esProveedor || esAdministrador ? shieldCheckmarkOutline : heartOutline} /><span>{esProveedor || esAdministrador ? t('verificationStatus') : t('savedPlaces')}</span><IonIcon className="action-arrow" icon={arrowForwardOutline} />
            </button>
            <button className="home-action-card home-action-muted" type="button" disabled>
              <IonIcon icon={calendarOutline} /><span>{esProveedor || esAdministrador ? t('manageEvents') : t('upcomingEvents')}</span><IonIcon className="action-arrow" icon={arrowForwardOutline} />
            </button>
          </div>

          {esProveedor || esAdministrador ? (
            <div className="home-verification"><IonIcon icon={shieldCheckmarkOutline} /><div><strong>{t('verificationStatus')}</strong><span>{esAdministrador ? t('verifiedProvider') : t('pendingVerification')}</span></div></div>
          ) : null}

        </div>
      </IonContent>
      <BottomNav />
    </IonPage>
  );
};

export default Home;
