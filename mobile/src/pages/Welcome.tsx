import {
  IonButton,
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
} from '@ionic/react';
import { useHistory } from 'react-router-dom';
import './Welcome.css';

const Welcome: React.FC = () => {
  const history = useHistory();

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>BañosTour</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        <div className="welcome-content">
          <div className="welcome-card">
            <img
              className="welcome-image"
              src="/assets/portada-banos.png"
              alt="Paisaje turístico de Baños de Agua Santa"
            />
            <div className="welcome-body">
              <span className="welcome-kicker">EXPLORA · DISFRUTA · DESCUBRE</span>
              <h1>Bienvenido a BañosTour</h1>
              <p>
                Tu guía para descubrir cascadas, miradores, aventura y los
                mejores lugares de Baños de Agua Santa.
              </p>
              <IonButton expand="block" onClick={() => history.push('/login')}>
                Iniciar sesión
              </IonButton>
            </div>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Welcome;
