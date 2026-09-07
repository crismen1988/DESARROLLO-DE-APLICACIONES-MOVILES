import {
  IonButton,
  IonContent,
  IonHeader,
  IonIcon,
  IonModal,
  IonPage,
  IonPopover,
  IonSpinner,
  IonTitle,
  IonToolbar,
  useIonViewWillEnter,
} from "@ionic/react";
import { CapacitorHttp } from "@capacitor/core";
import {
  cameraOutline,
  chatbubbleOutline,
  checkmarkCircle,
  closeOutline,
  createOutline,
  gridOutline,
  heartOutline,
  locationOutline,
  menuOutline,
  star,
  imageOutline,
} from "ionicons/icons";
import { useCallback, useEffect, useRef, useState } from "react";
import { useHistory } from "react-router-dom";
import { useAuth } from "../auth/useAuth";
import { useLanguage } from "../i18n/useLanguage";
import BottomNav from "../components/BottomNav";
import LanguageSelector from "../components/LanguageSelector";
import "./Profile.css";

type Perfil = {
  id: number;
  nombre: string;
  correo: string;
  rol: string;
  tipoCuenta: string;
  proveedorVerificado: boolean;
  estadoVerificacion: string;
  nombreComercial?: string | null;
  ciudad?: string | null;
  actividadTuristica?: string | null;
  descripcion?: string | null;
  fotoPerfil?: string | null;
  fechaNacimiento?: string | null;
  edad?: number | null;
  paisOrigen?: string | null;
  direccion?: string | null;
  estadisticas: {
    favoritos: number;
    resenas: number;
    lugares: number;
    resenasRecibidas: number;
    valoracion: number | null;
  };
};
type Tab = "favoritos" | "resenas" | "lugares";
const esPerfilCompleto = (data: unknown): data is Perfil => {
  if (!data || typeof data !== "object") return false;
  const perfil = data as Partial<Perfil>;
  const estadisticas = perfil.estadisticas;
  return typeof perfil.nombre === "string" && typeof perfil.id === "number" &&
    !!estadisticas &&
    [estadisticas.favoritos, estadisticas.resenas, estadisticas.lugares, estadisticas.resenasRecibidas]
      .every(value => typeof value === "number" && Number.isFinite(value) && value >= 0) &&
    (estadisticas.valoracion === null || (typeof estadisticas.valoracion === "number" && Number.isFinite(estadisticas.valoracion)));
};
type Lugar = {
  id: number;
  nombre: string;
  descripcion: string;
  estado: string;
  calificacionPromedio: number;
  totalResenas: number;
  categoria: { nombre: string };
  imagenes: { url: string; textoAlternativo: string | null }[];
};
type Actividad = {
  id: number;
  puntoInteres: Lugar;
  comentario?: string | null;
  calificacion?: number;
  creadoEn?: string;
};
type Borrador = {
  nombre: string;
  descripcion: string;
  fotoPerfil: string | null;
  fechaNacimiento: string;
  edad: string;
  paisOrigen: string;
  direccion: string;
};
const borradorDe = (perfil: Perfil): Borrador => ({
  nombre: perfil.nombre,
  descripcion: perfil.descripcion ?? "",
  fotoPerfil: perfil.fotoPerfil ?? null,
  fechaNacimiento: perfil.fechaNacimiento?.slice(0, 10) ?? "",
  edad: perfil.edad?.toString() ?? "",
  paisOrigen: perfil.paisOrigen ?? "",
  direccion: perfil.direccion ?? "",
});

const comprimirFoto = (archivo: File) =>
  new Promise<string>((resolve, reject) => {
    const lector = new FileReader();
    lector.onerror = () => reject(new Error("file-read"));
    lector.onload = () => {
      const imagen = new Image();
      imagen.onerror = () => reject(new Error("image-read"));
      imagen.onload = () => {
        const escala = Math.min(1, 512 / Math.max(imagen.width, imagen.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(imagen.width * escala));
        canvas.height = Math.max(1, Math.round(imagen.height * escala));
        canvas
          .getContext("2d")
          ?.drawImage(imagen, 0, 0, canvas.width, canvas.height);
        const resultado = canvas.toDataURL("image/jpeg", 0.72);
        if (resultado.length > 95000) reject(new Error("too-large"));
        else resolve(resultado);
      };
      imagen.src = String(lector.result);
    };
    lector.readAsDataURL(archivo);
  });

const FotoLugar: React.FC<{ lugar: Lugar }> = ({ lugar }) => {
  const [fallo, setFallo] = useState(false);
  const foto = lugar.imagenes[0];
  return (
    <div className="profile-place-photo">
      {foto && !fallo ? (
        <img
          src={foto.url}
          alt={foto.textoAlternativo ?? lugar.nombre}
          loading="lazy"
          onError={() => setFallo(true)}
        />
      ) : (
        <IonIcon icon={imageOutline} aria-hidden="true" />
      )}
    </div>
  );
};

const Profile: React.FC = () => {
  const history = useHistory();
  const { accessToken, cerrarSesion } = useAuth();
  const { t, language } = useLanguage();
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [borrador, setBorrador] = useState<Borrador | null>(null);
  const [editando, setEditando] = useState(false);
  const [menu, setMenu] = useState<Event>();
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [procesandoFoto, setProcesandoFoto] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");
  const [errorEdicion, setErrorEdicion] = useState("");
  const [tab, setTab] = useState<Tab>("favoritos");
  const [actividad, setActividad] = useState<Actividad[]>([]);
  const [total, setTotal] = useState(0);
  const [pagina, setPagina] = useState(1);
  const [revision, setRevision] = useState(0);
  const [cargandoActividad, setCargandoActividad] = useState(true);
  const [errorActividad, setErrorActividad] = useState(false);
  const fotoInputRef = useRef<HTMLInputElement>(null);
  const esPrestador =
    perfil?.tipoCuenta === "PRESTADOR_TURISTICO" || perfil?.rol === "PROVEEDOR";

  const cargarPerfil = useCallback(async () => {
    if (!accessToken) return;
    setCargando(true);
    setError("");
    try {
      const response = await CapacitorHttp.get({
        url: `${import.meta.env.VITE_API_URL}/usuarios/perfil`,
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (response.status !== 200 || !esPerfilCompleto(response.data)) throw new Error("profile");
      setPerfil(response.data);
    } catch {
      setError(t("profileError"));
    } finally {
      setCargando(false);
    }
  }, [accessToken, t]);

  useIonViewWillEnter(() => {
    void cargarPerfil();
    setPagina(1);
    setRevision((value) => value + 1);
  }, [cargarPerfil]);

  useEffect(() => {
    if (!accessToken) return;
    let vigente = true;
    setCargandoActividad(true);
    setErrorActividad(false);
    if (pagina === 1) setActividad([]);
    void (async () => {
      try {
        const response = await CapacitorHttp.get({
          url: `${import.meta.env.VITE_API_URL}/usuarios/perfil/actividad`,
          params: { tipo: tab, pagina: String(pagina) },
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (response.status !== 200) throw new Error("activity");
        if (!vigente) return;
        const data = response.data as { datos: Actividad[]; total: number };
        setActividad((previous) =>
          pagina === 1 ? data.datos : [...previous, ...data.datos],
        );
        setTotal(data.total);
      } catch {
        if (vigente) setErrorActividad(true);
      } finally {
        if (vigente) setCargandoActividad(false);
      }
    })();
    return () => {
      vigente = false;
    };
  }, [accessToken, tab, pagina, revision]);

  const abrirEdicion = () => {
    if (perfil) {
      setBorrador(borradorDe(perfil));
      setErrorEdicion("");
      setMensaje("");
      setEditando(true);
      setMenu(undefined);
    }
  };
  const elegirFoto = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const archivo = event.target.files?.[0];
    if (!archivo) return;
    setProcesandoFoto(true);
    setErrorEdicion("");
    try {
      const fotoPerfil = await comprimirFoto(archivo);
      setBorrador((prev) => (prev ? { ...prev, fotoPerfil } : prev));
    } catch {
      setErrorEdicion(t("photoTooLarge"));
    } finally {
      setProcesandoFoto(false);
      event.target.value = "";
    }
  };
  const guardar = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!borrador || guardando || procesandoFoto) return;
    setGuardando(true);
    setErrorEdicion("");
    try {
      const response = await CapacitorHttp.patch({
        url: `${import.meta.env.VITE_API_URL}/usuarios/perfil`,
        headers: {
          Authorization: `Bearer ${accessToken ?? ""}`,
          "Content-Type": "application/json",
        },
        data: {
          nombre: borrador.nombre.trim(),
          descripcion: borrador.descripcion.trim(),
          fechaNacimiento: borrador.fechaNacimiento || null,
          edad: borrador.edad ? Number(borrador.edad) : null,
          paisOrigen: borrador.paisOrigen.trim(),
          direccion: borrador.direccion.trim(),
          ...(borrador.fotoPerfil ? { fotoPerfil: borrador.fotoPerfil } : {}),
        },
      });
      if (response.status !== 200 || !esPerfilCompleto(response.data)) throw new Error("save");
      setPerfil(response.data);
      setEditando(false);
      setMensaje(t("profileSaved"));
    } catch {
      setErrorEdicion(t("profileSaveError"));
    } finally {
      setGuardando(false);
    }
  };
  const cambiarTab = (next: Tab) => {
    if (next !== tab) {
      setActividad([]);
      setCargandoActividad(true);
      setTab(next);
      setPagina(1);
    }
  };
  const tabs = [
    { id: "favoritos" as const, label: t("favoritesTab"), icon: heartOutline },
    { id: "resenas" as const, label: t("myReviews"), icon: chatbubbleOutline },
    ...(esPrestador
      ? [
          {
            id: "lugares" as const,
            label: t("managePlaces"),
            icon: gridOutline,
          },
        ]
      : []),
  ];

  return (
    <IonPage className="profile-page">
      <IonHeader>
        <IonToolbar>
          <IonTitle>{t("myProfile")}</IonTitle>
          <IonButton
            slot="end"
            fill="clear"
            aria-label={t("profileSettings")}
            onClick={(event) => setMenu(event.nativeEvent)}
          >
            <IonIcon icon={menuOutline} />
          </IonButton>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <div className="profile-content">
          {cargando && !perfil && (
            <div className="profile-loading">
              <IonSpinner />
              <span>{t("profileLoading")}</span>
            </div>
          )}
          {error && (
            <div className="profile-error" role="alert">
              {error}
              <IonButton fill="clear" onClick={() => void cargarPerfil()}>
                {t("retry")}
              </IonButton>
            </div>
          )}
          {perfil && (
            <>
              <section className="profile-hero">
                <div className="profile-avatar-wrap">
                  {perfil.fotoPerfil ? (
                    <img
                      className="profile-avatar"
                      src={perfil.fotoPerfil}
                      alt={perfil.nombre}
                    />
                  ) : (
                    <div className="profile-avatar">
                      {perfil.nombre.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <h1>
                  {esPrestador && perfil.nombreComercial
                    ? perfil.nombreComercial
                    : perfil.nombre}
                </h1>
                <span className="profile-role">
                  {perfil.rol === "ADMINISTRADOR"
                    ? t("adminSpace")
                    : esPrestador
                      ? t("tourismProvider")
                      : t("tourist")}
                  {esPrestador && perfil.proveedorVerificado && (
                    <IonIcon
                      icon={checkmarkCircle}
                      aria-label={t("verifiedProvider")}
                    />
                  )}
                </span>
                {(perfil.paisOrigen || (esPrestador && perfil.ciudad)) && (
                  <p className="profile-location">
                    <IonIcon icon={locationOutline} aria-hidden="true" />
                    {[esPrestador ? perfil.ciudad : null, perfil.paisOrigen]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                )}
                <p className="profile-bio">
                  {perfil.descripcion || t("profileBioEmpty")}
                </p>
                {esPrestador && (
                  <span className="profile-verification">
                    {perfil.proveedorVerificado
                      ? t("verifiedProvider")
                      : perfil.estadoVerificacion === "RECHAZADO"
                        ? t("verificationRejected")
                        : t("pendingVerification")}
                  </span>
                )}
                <div className="profile-stats" aria-label={t("profileStats")}>
                  {esPrestador ? (
                    <>
                      <button onClick={() => cambiarTab("lugares")}>
                        <strong>{perfil.estadisticas.lugares}</strong>
                        <span>{t("publishedPlaces")}</span>
                      </button>
                      <div>
                        <strong>{perfil.estadisticas.resenasRecibidas}</strong>
                        <span>{t("receivedReviews")}</span>
                      </div>
                      <div>
                        <strong>
                          {perfil.estadisticas.valoracion?.toFixed(1) ?? "—"}
                          <IonIcon icon={star} />
                        </strong>
                        <span>{t("rating")}</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <button onClick={() => cambiarTab("favoritos")}>
                        <strong>{perfil.estadisticas.favoritos}</strong>
                        <span>{t("favoritesTab")}</span>
                      </button>
                      <button onClick={() => cambiarTab("resenas")}>
                        <strong>{perfil.estadisticas.resenas}</strong>
                        <span>{t("myReviews")}</span>
                      </button>
                    </>
                  )}
                </div>
                <div className="profile-main-actions">
                  <IonButton onClick={abrirEdicion}>
                    <IonIcon slot="start" icon={createOutline} />
                    {t("editProfile")}
                  </IonButton>
                  <IonButton
                    fill="outline"
                    onClick={() =>
                      esPrestador
                        ? cambiarTab("lugares")
                        : history.push("/catalogo")
                    }
                  >
                    <IonIcon
                      slot="start"
                      icon={esPrestador ? gridOutline : locationOutline}
                    />
                    {esPrestador ? t("managePlaces") : t("explore")}
                  </IonButton>
                </div>
              </section>
              {mensaje && (
                <p className="profile-success" role="status">
                  {mensaje}
                </p>
              )}
              <section className="profile-activity">
                <div
                  className="profile-tabs"
                  role="tablist"
                  aria-label={t("profileActivity")}
                >
                  {tabs.map((item, index) => (
                    <button
                      key={item.id}
                      id={`profile-tab-${item.id}`}
                      role="tab"
                      aria-selected={tab === item.id}
                      aria-controls="profile-panel"
                      tabIndex={tab === item.id ? 0 : -1}
                      onClick={() => cambiarTab(item.id)}
                      onKeyDown={(event) => {
                        let next = index;
                        if (event.key === "ArrowRight")
                          next = (index + 1) % tabs.length;
                        else if (event.key === "ArrowLeft")
                          next = (index + tabs.length - 1) % tabs.length;
                        else if (event.key === "Home") next = 0;
                        else if (event.key === "End") next = tabs.length - 1;
                        else return;
                        event.preventDefault();
                        cambiarTab(tabs[next].id);
                        document
                          .getElementById(`profile-tab-${tabs[next].id}`)
                          ?.focus();
                      }}
                    >
                      <IonIcon icon={item.icon} aria-hidden="true" />
                      <span>{item.label}</span>
                    </button>
                  ))}
                </div>
                <div
                  id="profile-panel"
                  role="tabpanel"
                  aria-labelledby={`profile-tab-${tab}`}
                  tabIndex={0}
                  aria-busy={cargandoActividad}
                >
                  <p className="profile-section-note">
                    {tab === "favoritos"
                      ? t("favoritesPrivate")
                      : tab === "resenas"
                        ? t("reviewsNote")
                        : t("placesNote")}
                  </p>
                  {actividad.length > 0 && (
                    <div
                      className={
                        tab === "resenas" ? "profile-reviews" : "profile-grid"
                      }
                    >
                      {actividad.map((item) => (
                        <article
                          className={
                            tab === "resenas"
                              ? "profile-review"
                              : "profile-place-card"
                          }
                          key={item.id}
                        >
                          <FotoLugar lugar={item.puntoInteres} />
                          <div className="profile-place-info">
                            <span className="profile-category">
                              {item.puntoInteres.categoria.nombre}
                            </span>
                            <h2>{item.puntoInteres.nombre}</h2>
                            <span className="profile-rating">
                              <IonIcon icon={star} aria-hidden="true" />
                              {tab === "resenas"
                                ? `${item.calificacion}/5`
                                : item.puntoInteres.totalResenas
                                  ? `${item.puntoInteres.calificacionPromedio.toFixed(1)} · ${item.puntoInteres.totalResenas} ${t("reviewsLabel")}`
                                  : t("noRating")}
                            </span>
                            {tab === "resenas" && (
                              <>
                                <p>{item.comentario || t("ratingOnly")}</p>
                                <time dateTime={item.creadoEn}>
                                  {item.creadoEn
                                    ? new Date(
                                        item.creadoEn,
                                      ).toLocaleDateString(
                                        language === "es" ? "es-EC" : "en-US",
                                        {
                                          day: "numeric",
                                          month: "short",
                                          year: "numeric",
                                        },
                                      )
                                    : ""}
                                </time>
                              </>
                            )}
                            {item.puntoInteres.estado !== "ACTIVO" && (
                              <small>{t("inactive")}</small>
                            )}
                          </div>
                        </article>
                      ))}
                    </div>
                  )}
                  {!cargandoActividad &&
                    !errorActividad &&
                    actividad.length === 0 && (
                      <div className="profile-empty">
                        <span className="profile-empty-icon">
                          <IonIcon
                            icon={tabs.find((item) => item.id === tab)?.icon}
                          />
                        </span>
                        <h2>
                          {tab === "favoritos"
                            ? t("noFavorites")
                            : tab === "resenas"
                              ? t("noMyReviews")
                              : t("noMyPlaces")}
                        </h2>
                        <p>
                          {tab === "favoritos"
                            ? t("emptyFavoritesHint")
                            : tab === "resenas"
                              ? t("emptyReviewsHint")
                              : t("emptyPlacesHint")}
                        </p>
                        <IonButton
                          fill="outline"
                          onClick={() => history.push("/catalogo")}
                        >
                          {t("exploreCatalog")}
                        </IonButton>
                      </div>
                    )}
                  {cargandoActividad && (
                    <div className="profile-loading" role="status">
                      <IonSpinner />
                      <span>{t("loadingActivity")}</span>
                    </div>
                  )}
                  {errorActividad && (
                    <div className="profile-error" role="alert">
                      {t("activityError")}
                      <IonButton
                        fill="clear"
                        onClick={() => setRevision((value) => value + 1)}
                      >
                        {t("retry")}
                      </IonButton>
                    </div>
                  )}
                  {!cargandoActividad &&
                    !errorActividad &&
                    actividad.length < total && (
                      <IonButton
                        className="profile-more"
                        fill="clear"
                        expand="block"
                        onClick={() => setPagina((value) => value + 1)}
                      >
                        {t("loadMore")}
                      </IonButton>
                    )}
                </div>
              </section>
            </>
          )}
        </div>
      </IonContent>
      <BottomNav />
      <IonPopover
        isOpen={!!menu}
        event={menu}
        onDidDismiss={() => setMenu(undefined)}
      >
        <div className="profile-settings">
          <h2>{t("profileSettings")}</h2>
          <IonButton fill="clear" onClick={abrirEdicion}>
            {t("editProfile")}
          </IonButton>
          <LanguageSelector />
          {perfil?.rol === "ADMINISTRADOR" && (
            <IonButton
              fill="clear"
              onClick={() => {
                setMenu(undefined);
                history.push("/admin");
              }}
            >
              {t("adminSpace")}
            </IonButton>
          )}
          <IonButton
            fill="clear"
            onClick={() => {
              setMenu(undefined);
              void cerrarSesion()
                .catch(() => undefined)
                .finally(() => history.replace("/welcome"));
            }}
          >
            {t("logout")}
          </IonButton>
        </div>
      </IonPopover>
      <IonModal
        className="profile-editor"
        isOpen={editando}
        canDismiss={!guardando && !procesandoFoto}
        onDidDismiss={() => {
          setEditando(false);
          setBorrador(null);
        }}
      >
        <IonHeader>
          <IonToolbar>
            <IonTitle>{t("editProfile")}</IonTitle>
            <IonButton
              slot="end"
              fill="clear"
              disabled={guardando || procesandoFoto}
              aria-label={t("cancel")}
              onClick={() => setEditando(false)}
            >
              <IonIcon icon={closeOutline} />
            </IonButton>
          </IonToolbar>
        </IonHeader>
        <IonContent>
          {borrador && (
            <form
              className="profile-edit-content"
              onSubmit={(event) => void guardar(event)}
            >
              <fieldset disabled={guardando || procesandoFoto}>
                <div className="profile-edit-avatar">
                  <div className="profile-avatar-wrap">
                    {borrador.fotoPerfil ? (
                      <img
                        className="profile-avatar"
                        src={borrador.fotoPerfil}
                        alt={t("profile")}
                      />
                    ) : (
                      <div className="profile-avatar">
                        {borrador.nombre.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <button
                      className="profile-camera"
                      type="button"
                      aria-label={t("uploadPhoto")}
                      onClick={() => fotoInputRef.current?.click()}
                    >
                      <IonIcon icon={cameraOutline} />
                    </button>
                  </div>
                  <button
                    className="profile-upload-link"
                    type="button"
                    onClick={() => fotoInputRef.current?.click()}
                  >
                    {t("uploadPhoto")}
                  </button>
                  <input
                    ref={fotoInputRef}
                    className="profile-file-input"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(event) => void elegirFoto(event)}
                  />
                </div>
                <div className="profile-form">
                  <label>
                    {t("profileName")}
                    <input
                      required
                      minLength={2}
                      maxLength={120}
                      value={borrador.nombre}
                      onChange={(event) =>
                        setBorrador({ ...borrador, nombre: event.target.value })
                      }
                    />
                  </label>
                  <label>
                    {t("description")}
                    <textarea
                      value={borrador.descripcion}
                      maxLength={300}
                      placeholder={t("descriptionPlaceholder")}
                      onChange={(event) =>
                        setBorrador({
                          ...borrador,
                          descripcion: event.target.value,
                        })
                      }
                    />
                    <span className="profile-character-count">
                      {borrador.descripcion.length}/300
                    </span>
                  </label>
                  <label>
                    {t("originCountry")}
                    <input
                      maxLength={80}
                      value={borrador.paisOrigen}
                      onChange={(event) =>
                        setBorrador({
                          ...borrador,
                          paisOrigen: event.target.value,
                        })
                      }
                    />
                  </label>
                  <h2 className="profile-private-heading">
                    {t("personalInformation")}
                  </h2>
                  <p className="profile-private-note">
                    {t("personalInformationNote")}
                  </p>
                  <label>
                    {t("profileEmail")}
                    <input type="email" value={perfil?.correo ?? ""} readOnly />
                  </label>
                  <label>
                    {t("birthDate")}
                    <input
                      type="date"
                      max={new Date().toISOString().slice(0, 10)}
                      value={borrador.fechaNacimiento}
                      onChange={(event) =>
                        setBorrador({
                          ...borrador,
                          fechaNacimiento: event.target.value,
                        })
                      }
                    />
                  </label>
                  <label>
                    {t("age")}
                    <input
                      type="number"
                      min="0"
                      max="120"
                      value={borrador.edad}
                      onChange={(event) =>
                        setBorrador({ ...borrador, edad: event.target.value })
                      }
                    />
                  </label>
                  <label>
                    {t("address")}
                    <input
                      maxLength={250}
                      value={borrador.direccion}
                      onChange={(event) =>
                        setBorrador({
                          ...borrador,
                          direccion: event.target.value,
                        })
                      }
                    />
                  </label>
                </div>
              </fieldset>
              {errorEdicion && (
                <p className="profile-error" role="alert">
                  {errorEdicion}
                </p>
              )}
              <div className="profile-form-actions">
                <IonButton
                  fill="clear"
                  disabled={guardando || procesandoFoto}
                  onClick={() => setEditando(false)}
                >
                  {t("cancel")}
                </IonButton>
                <IonButton type="submit" disabled={guardando || procesandoFoto}>
                  {guardando || procesandoFoto ? (
                    <IonSpinner />
                  ) : (
                    t("saveChanges")
                  )}
                </IonButton>
              </div>
            </form>
          )}
        </IonContent>
      </IonModal>
    </IonPage>
  );
};
export default Profile;
