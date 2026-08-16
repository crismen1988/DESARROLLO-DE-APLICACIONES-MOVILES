import {
  IonButton,
  IonContent,
  IonHeader,
  IonPage,
  IonSpinner,
  IonText,
  IonTitle,
  IonToolbar,
} from '@ionic/react';
import { CapacitorHttp } from '@capacitor/core';
import { useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';
import './Home.css';

const Home: React.FC = () => {
  const history = useHistory();
  const [respuesta, setRespuesta] = useState('Sin conexión comprobada');
  const [cargando, setCargando] = useState(false);

  const consultarBackend = async () => {
    setCargando(true);
    try {
      const apiUrl = import.meta.env.VITE_API_URL;
      const response = await CapacitorHttp.get({ url: `${apiUrl}/` });
      if (response.status < 200 || response.status >= 300) {
        throw new Error(`HTTP ${response.status}`);
      }
      const data = response.data as { message?: string };
      setRespuesta(data.message ?? 'Respuesta recibida correctamente');
    } catch (error) {
      setRespuesta(
        `No se pudo conectar con la API: ${error instanceof Error ? error.message : 'error desconocido'}`,
      );
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    void consultarBackend();
  }, []);

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>BañosTour</IonTitle>
          <IonButton slot="end" fill="clear" onClick={() => {
            localStorage.removeItem('banostour_access_token');
            localStorage.removeItem('banostour_usuario');
            history.replace('/welcome');
          }}>
            Salir
          </IonButton>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        <IonHeader collapse="condense">
          <IonToolbar>
            <IonTitle size="large">BañosTour</IonTitle>
          </IonToolbar>
        </IonHeader>
        <div className="home-content">
          <h1>Descubre Baños</h1>
          <p>Aplicación turística multiplataforma.</p>
          <IonText color={respuesta.startsWith('No se') ? 'danger' : 'success'}>
            <p><strong>Respuesta de la API:</strong> {respuesta}</p>
          </IonText>
          <IonButton onClick={() => void consultarBackend()} disabled={cargando}>
            {cargando ? <IonSpinner name="crescent" /> : 'Probar conexión'}
          </IonButton>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Home;
