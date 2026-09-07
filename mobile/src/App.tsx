import { Redirect, Route } from 'react-router-dom';
import { App as CapacitorApp } from '@capacitor/app';
import { useEffect } from 'react';
import { IonApp, IonRouterOutlet, setupIonicReact } from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import { useHistory } from 'react-router-dom';
import Home from './pages/Home';
import Catalog from './pages/Catalog';
import Profile from './pages/Profile';
import Welcome from './pages/Welcome';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Favorites from './pages/Favorites';
import AdminDashboard from './pages/AdminDashboard';
import '@ionic/react/css/core.css';
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';
import '@ionic/react/css/padding.css';
import '@ionic/react/css/float-elements.css';
import '@ionic/react/css/text-alignment.css';
import '@ionic/react/css/text-transformation.css';
import '@ionic/react/css/flex-utils.css';
import '@ionic/react/css/display.css';
import './theme/variables.css';
import ProtectedRoute from './auth/ProtectedRoute';

setupIonicReact();

const BackButtonHandler: React.FC = () => {
  const history = useHistory();

  useEffect(() => {
    let removeListener: (() => Promise<void>) | undefined;
    void CapacitorApp.addListener('backButton', () => {
      const path = window.location.pathname;
      if (path === '/catalogo' || path === '/favoritos' || path === '/perfil') {
        history.replace('/home');
      } else if (path === '/register' || path === '/forgot-password' || path === '/reset-password') {
        history.replace('/login');
      } else if (path === '/login' || path === '/home') {
        history.replace('/welcome');
      }
    }).then((listener) => {
      removeListener = () => listener.remove();
    });

    return () => {
      void removeListener?.();
    };
  }, [history]);

  return null;
};

const App: React.FC = () => (
  <IonApp>
    <IonReactRouter>
      <BackButtonHandler />
      <IonRouterOutlet>
        <Route exact path="/welcome"><Welcome /></Route>
        <Route exact path="/login"><Login /></Route>
        <Route exact path="/register"><Register /></Route>
        <Route exact path="/forgot-password"><ForgotPassword /></Route>
        <Route exact path="/reset-password"><ResetPassword /></Route>
        <ProtectedRoute exact path="/home"><Home /></ProtectedRoute>
        <ProtectedRoute exact path="/catalogo"><Catalog /></ProtectedRoute>
        <ProtectedRoute exact path="/perfil"><Profile /></ProtectedRoute>
        <ProtectedRoute exact path="/favoritos"><Favorites /></ProtectedRoute>
        <ProtectedRoute exact path="/admin"><AdminDashboard /></ProtectedRoute>
        <Route exact path="/"><Redirect to="/welcome" /></Route>
      </IonRouterOutlet>
    </IonReactRouter>
  </IonApp>
);

export default App;
