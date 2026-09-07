import { IonButton, IonContent, IonHeader, IonIcon, IonItem, IonLabel, IonList, IonPage, IonSpinner, IonTitle, IonToolbar } from '@ionic/react';
import { CapacitorHttp } from '@capacitor/core';
import { peopleOutline, pieChartOutline, shieldCheckmarkOutline, warningOutline } from 'ionicons/icons';
import { useEffect, useState } from 'react';
import { Redirect, useHistory } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';
import { useLanguage } from '../i18n/useLanguage';
import './AdminDashboard.css';

type Usuario = { id: number; nombre: string; correo: string; rol: string; activo: boolean; proveedorVerificado: boolean; tipoCuenta: string };
type Reporte = { id: number; motivo: string; descripcion?: string | null; estado: string; usuario: { nombre: string }; puntoInteresId: number };

const AdminDashboard: React.FC = () => {
  const history = useHistory();
  const { accessToken, usuario, cerrarSesion } = useAuth();
  const { t } = useLanguage();
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [reportes, setReportes] = useState<Reporte[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');

  useEffect(() => {
    const headers = { Authorization: `Bearer ${accessToken ?? ''}`, 'Content-Type': 'application/json' };
    const cargar = async () => {
      try {
        const [usuariosResponse, reportesResponse] = await Promise.all([
          CapacitorHttp.get({ url: `${import.meta.env.VITE_API_URL}/usuarios`, headers }),
          CapacitorHttp.get({ url: `${import.meta.env.VITE_API_URL}/reportes`, headers }),
        ]);
        if (usuariosResponse.status < 200 || usuariosResponse.status >= 300) throw new Error('users');
        setUsuarios(usuariosResponse.data as Usuario[]);
        if (reportesResponse.status >= 200 && reportesResponse.status < 300) setReportes(reportesResponse.data as Reporte[]);
      } catch { setError(t('updateError')); } finally { setCargando(false); }
    };
    void cargar();
  }, [accessToken, t]);

  const actualizarUsuario = async (id: number, data: Record<string, boolean>) => {
    try {
      const response = await CapacitorHttp.patch({ url: `${import.meta.env.VITE_API_URL}/usuarios/${id}`, headers: { Authorization: `Bearer ${accessToken ?? ''}`, 'Content-Type': 'application/json' }, data });
      if (response.status < 200 || response.status >= 300) throw new Error('update');
      setUsuarios((actuales) => actuales.map((item) => item.id === id ? { ...item, ...data } : item));
      setMensaje(t('userUpdated'));
    } catch { setError(t('updateError')); }
  };

  const proveedoresPendientes = usuarios.filter((item) => item.tipoCuenta === 'PRESTADOR_TURISTICO' && !item.proveedorVerificado).length;
  const reportesAbiertos = reportes.filter((item) => item.estado === 'PENDIENTE' || item.estado === 'EN_REVISION').length;

  if (usuario?.rol !== 'ADMINISTRADOR') return <Redirect to="/home" />;

  return (
    <IonPage className="admin-page">
      <IonHeader><IonToolbar><IonTitle><span className="admin-brand"><strong>Baños</strong>Tour <small>{t('adminDashboard')}</small></span></IonTitle><IonButton slot="end" fill="clear" onClick={() => void cerrarSesion().finally(() => history.replace('/welcome'))}>{t('logout')}</IonButton></IonToolbar></IonHeader>
      <IonContent><div className="admin-content">
        <span className="admin-eyebrow"><IonIcon icon={shieldCheckmarkOutline} /> {t('administratorOnly')}</span>
        <h1>{t('adminDashboard')}</h1><p className="admin-intro">{t('adminWelcome')}</p>
        {cargando && <IonSpinner />}{error && <p className="admin-error" role="alert">{error}</p>}{mensaje && <p className="admin-success">{mensaje}</p>}
        <div className="admin-stats"><div><IonIcon icon={peopleOutline} /><strong>{usuarios.filter((item) => item.activo).length}</strong><span>{t('activeUsers')}</span></div><div><IonIcon icon={shieldCheckmarkOutline} /><strong>{proveedoresPendientes}</strong><span>{t('pendingProviders')}</span></div><div><IonIcon icon={warningOutline} /><strong>{reportesAbiertos}</strong><span>{t('openReports')}</span></div></div>
        <section className="admin-section"><h2>{t('usersManagement')}</h2><div className="admin-action-row"><button type="button"><IonIcon icon={peopleOutline} />{t('manageUsers')}</button><button type="button"><IonIcon icon={shieldCheckmarkOutline} />{t('manageCategories')}</button><button type="button"><IonIcon icon={pieChartOutline} />{t('createContent')}</button></div><IonList className="admin-user-list">{usuarios.slice(0, 8).map((item) => { const esCuentaActual = item.id === usuario?.id; return <IonItem key={item.id}><IonLabel><h3>{item.nombre}</h3><p>{item.correo} · {item.rol}</p></IonLabel>{!esCuentaActual && <IonButton slot="end" fill="outline" size="small" onClick={() => void actualizarUsuario(item.id, item.proveedorVerificado === false && item.tipoCuenta === 'PRESTADOR_TURISTICO' ? { proveedorVerificado: true } : { activo: !item.activo })}>{item.tipoCuenta === 'PRESTADOR_TURISTICO' && !item.proveedorVerificado ? t('approve') : item.activo ? t('deactivate') : t('active')}</IonButton>}</IonItem>; })}</IonList></section>
        <section className="admin-section"><h2>{t('reportsManagement')}</h2>{reportes.length === 0 ? <p className="admin-muted">{t('noReports')}</p> : <IonList className="admin-report-list">{reportes.slice(0, 6).map((reporte) => <IonItem key={reporte.id}><IonLabel><h3>{reporte.motivo}</h3><p>{reporte.usuario.nombre} · {t('reportStatus')}: {reporte.estado}</p></IonLabel></IonItem>)}</IonList>}</section>
      </div></IonContent>
    </IonPage>
  );
};

export default AdminDashboard;
