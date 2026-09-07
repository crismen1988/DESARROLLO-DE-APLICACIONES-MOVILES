import { IonButton, IonContent, IonHeader, IonIcon, IonItem, IonLabel, IonList, IonPage, IonSpinner, IonTitle, IonToolbar } from '@ionic/react';
import { CapacitorHttp } from '@capacitor/core';
import { arrowBackOutline, heartOutline, trashOutline } from 'ionicons/icons';
import { useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';
import { useLanguage } from '../i18n/useLanguage';
import './Catalog.css';
import BottomNav from '../components/BottomNav';

type Favorito = { puntoInteresId: number; puntoInteres: { id: number; nombre: string; descripcion?: string | null; direccion?: string | null; categoria?: { nombre: string } } };

const Favorites: React.FC = () => {
  const history = useHistory();
  const { accessToken } = useAuth();
  const { t } = useLanguage();
  const [favoritos, setFavoritos] = useState<Favorito[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const cargar = async () => {
      try {
        const response = await CapacitorHttp.get({ url: `${import.meta.env.VITE_API_URL}/favoritos`, headers: { Authorization: `Bearer ${accessToken ?? ''}` } });
        if (response.status < 200 || response.status >= 300) throw new Error(`HTTP ${response.status}`);
        setFavoritos(response.data as Favorito[]);
      } catch { setError(t('favoritesError')); } finally { setCargando(false); }
    };
    void cargar();
  }, [accessToken, t]);

  const eliminar = async (puntoInteresId: number) => {
    await CapacitorHttp.delete({ url: `${import.meta.env.VITE_API_URL}/favoritos/${puntoInteresId}`, headers: { Authorization: `Bearer ${accessToken ?? ''}` } });
    setFavoritos((actuales) => actuales.filter((favorito) => favorito.puntoInteresId !== puntoInteresId));
  };

  return (
    <IonPage className="catalog-page">
      <IonHeader><IonToolbar><IonButton slot="start" fill="clear" aria-label={t('home')} onClick={() => history.push('/home')}><IonIcon icon={arrowBackOutline} /></IonButton><IonTitle>{t('favoritesTitle')}</IonTitle></IonToolbar></IonHeader>
      <IonContent><div className="catalog-content"><div className="catalog-heading"><div><span className="catalog-eyebrow"><IonIcon icon={heartOutline} /> {t('savedPlaces')}</span><h1>{t('favoritesTitle')}</h1><p>{t('touristSubtitle')}</p></div></div>
        {cargando && <IonSpinner />}{error && <p className="catalog-empty" role="alert">{error}</p>}
        {!cargando && !error && favoritos.length === 0 && <p className="catalog-empty">{t('noFavorites')}</p>}
        <IonList className="catalog-list">{favoritos.map((favorito) => <IonItem className="catalog-place" key={favorito.puntoInteresId}><IonIcon slot="start" icon={heartOutline} /><IonLabel><span className="catalog-place-category">{favorito.puntoInteres.categoria?.nombre ?? t('catalogTitle')}</span><h2>{favorito.puntoInteres.nombre}</h2><p>{favorito.puntoInteres.descripcion ?? t('tourismExperience')}</p>{favorito.puntoInteres.direccion && <small>{favorito.puntoInteres.direccion}</small>}</IonLabel><IonButton fill="clear" slot="end" aria-label={t('removeFavorite')} onClick={() => void eliminar(favorito.puntoInteresId)}><IonIcon icon={trashOutline} /></IonButton></IonItem>)}</IonList>
      </div></IonContent>
      <BottomNav />
    </IonPage>
  );
};

export default Favorites;
