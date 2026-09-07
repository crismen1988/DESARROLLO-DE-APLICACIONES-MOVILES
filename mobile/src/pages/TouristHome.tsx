import {
  IonButton,
  IonContent,
  IonHeader,
  IonIcon,
  IonPage,
  IonSpinner,
  IonTitle,
  IonToolbar,
  useIonViewWillEnter,
} from "@ionic/react";
import { CapacitorHttp } from "@capacitor/core";
import { useState } from "react";
import { useHistory } from "react-router-dom";
import {
  bedOutline,
  bicycleOutline,
  busOutline,
  calendarOutline,
  chevronDownOutline,
  compassOutline,
  leafOutline,
  locationOutline,
  medkitOutline,
  restaurantOutline,
  storefrontOutline,
  sunnyOutline,
} from "ionicons/icons";
import BottomNav from "../components/BottomNav";
import PlaceSearch from "../components/PlaceSearch";
import { useAuth } from "../auth/useAuth";
import { useLanguage } from "../i18n/useLanguage";
import "./TouristHome.css";

type Categoria = { id: number; nombre: string };
type Evento = {
  id: number;
  titulo: string;
  descripcion: string;
  fechaInicio: string;
  fechaFin: string;
  direccion: string | null;
  puntoInteres: { nombre: string } | null;
};
const iconoCategoria = (nombre: string) => {
  const texto = nombre.toLocaleLowerCase("es");
  if (texto.includes("alojamiento")) return bedOutline;
  if (texto.includes("gastronom")) return restaurantOutline;
  if (texto.includes("aventura") || texto.includes("actividades"))
    return bicycleOutline;
  if (texto.includes("atractivo") || texto.includes("naturaleza"))
    return leafOutline;
  if (texto.includes("transporte")) return busOutline;
  if (texto.includes("compra")) return storefrontOutline;
  if (texto.includes("servicio")) return medkitOutline;
  if (texto.includes("cultura")) return sunnyOutline;
  return compassOutline;
};

const TouristHome: React.FC = () => {
  const history = useHistory();
  const { usuario } = useAuth();
  const { t, language } = useLanguage();
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [cargandoCategorias, setCargandoCategorias] = useState(true);
  const [cargandoEventos, setCargandoEventos] = useState(true);
  const [errorCategorias, setErrorCategorias] = useState(false);
  const [errorEventos, setErrorEventos] = useState(false);
  const [limiteEventos, setLimiteEventos] = useState(3);

  const cargarCategorias = async () => {
    setCargandoCategorias(true);
    setErrorCategorias(false);
    try {
      const response = await CapacitorHttp.get({
        url: `${import.meta.env.VITE_API_URL}/categorias`,
      });
      if (response.status !== 200 || !Array.isArray(response.data))
        throw new Error("categories");
      setCategorias(response.data as Categoria[]);
    } catch {
      setErrorCategorias(true);
    } finally {
      setCargandoCategorias(false);
    }
  };
  const cargarEventos = async () => {
    setCargandoEventos(true);
    setErrorEventos(false);
    try {
      const response = await CapacitorHttp.get({
        url: `${import.meta.env.VITE_API_URL}/eventos`,
      });
      if (response.status !== 200 || !Array.isArray(response.data))
        throw new Error("events");
      setEventos(response.data as Evento[]);
    } catch {
      setErrorEventos(true);
    } finally {
      setCargandoEventos(false);
    }
  };
  useIonViewWillEnter(() => {
    void cargarCategorias();
    void cargarEventos();
  }, []);
  const fecha = (value: string, options: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat(language === "es" ? "es-EC" : "en-US", {
      timeZone: "America/Guayaquil",
      ...options,
    }).format(new Date(value));

  return (
    <IonPage className="tourist-home home-page">
      <IonHeader className="tourist-home-header">
        <IonToolbar>
          <IonTitle>
            <span className="tourist-wordmark">
              <img src="/assets/icono_banos_tour.jpg" alt="" />
              <span>
                <strong>Baños</strong>Tour
              </span>
            </span>
          </IonTitle>
          <span slot="end" className="tourist-local-label">
            {t("localGuide")}
          </span>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <main className="tourist-content">
          <section className="tourist-intro" aria-labelledby="tourist-title">
            <p>
              {t("greeting")}, {usuario?.nombre.split(" ")[0]}{" "}
              <span aria-hidden="true">✦</span>
            </p>
            <h1 id="tourist-title">{t("touristHomeTitle")}</h1>
            <PlaceSearch
              onSearch={(value) =>
                history.push(
                  `/catalogo${value ? `?busqueda=${encodeURIComponent(value)}` : ""}`,
                )
              }
            />
          </section>
          <div className="tourist-discovery-layout">
            <figure className="tourist-destination">
              <img src="/assets/portada-banos.png" alt={t("banosPhotoAlt")} />
              <figcaption>
                <span className="tourist-destination-tag">
                  <IonIcon icon={locationOutline} aria-hidden="true" /> Ecuador
                </span>
                <h2>Baños de Agua Santa</h2>
                <p>{t("destinationCaption")}</p>
              </figcaption>
            </figure>
            <section
              className="tourist-categories"
              aria-labelledby="category-heading"
            >
              <div className="tourist-section-heading">
                <h2 id="category-heading">{t("chooseExperience")}</h2>
                <span>{t("atYourPace")}</span>
              </div>
              {cargandoCategorias ? (
                <div className="tourist-loading" role="status">
                  <IonSpinner />
                  <span>{t("loadingCategories")}</span>
                </div>
              ) : errorCategorias ? (
                <div className="tourist-feedback" role="alert">
                  <p>{t("categoriesError")}</p>
                  <IonButton
                    fill="clear"
                    onClick={() => void cargarCategorias()}
                  >
                    {t("retry")}
                  </IonButton>
                </div>
              ) : categorias.length ? (
                <div className="tourist-category-grid">
                  {categorias.map((categoria) => (
                    <button
                      key={categoria.id}
                      onClick={() =>
                        history.push(`/catalogo?categoriaId=${categoria.id}`)
                      }
                    >
                      <span className="tourist-category-icon">
                        <IonIcon
                          icon={iconoCategoria(categoria.nombre)}
                          aria-hidden="true"
                        />
                      </span>
                      <span>{categoria.nombre}</span>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="tourist-feedback">{t("noCategories")}</p>
              )}
            </section>
          </div>
          <section className="tourist-agenda" aria-labelledby="agenda-heading">
            <div className="tourist-section-heading">
              <h2 id="agenda-heading">{t("banosAgenda")}</h2>
              <IonIcon icon={calendarOutline} aria-hidden="true" />
            </div>
            {cargandoEventos ? (
              <div className="tourist-loading" role="status">
                <IonSpinner />
                <span>{t("loadingEvents")}</span>
              </div>
            ) : errorEventos ? (
              <div className="tourist-feedback" role="alert">
                <p>{t("eventsError")}</p>
                <IonButton fill="clear" onClick={() => void cargarEventos()}>
                  {t("retry")}
                </IonButton>
              </div>
            ) : eventos.length ? (
              <>
                <div className="tourist-event-list">
                  {eventos.slice(0, limiteEventos).map((evento) => (
                    <details className="tourist-event" key={evento.id}>
                      <summary>
                        <span className="tourist-event-date" aria-hidden="true">
                          <strong>
                            {fecha(evento.fechaInicio, { day: "2-digit" })}
                          </strong>
                          <span>
                            {fecha(evento.fechaInicio, { month: "short" })}
                          </span>
                        </span>
                        <span className="tourist-event-title">
                          <strong>{evento.titulo}</strong>
                          <time dateTime={evento.fechaInicio}>
                            {fecha(evento.fechaInicio, {
                              day: "numeric",
                              month: "long",
                              year: "numeric",
                            })}
                          </time>
                        </span>
                        <IonIcon icon={chevronDownOutline} aria-hidden="true" />
                      </summary>
                      <div className="tourist-event-detail">
                        <p>{evento.descripcion}</p>
                        {(evento.direccion || evento.puntoInteres) && (
                          <p>
                            <IonIcon
                              icon={locationOutline}
                              aria-hidden="true"
                            />{" "}
                            {evento.direccion || evento.puntoInteres?.nombre}
                          </p>
                        )}
                        <dl>
                          <div>
                            <dt>{t("eventStarts")}</dt>
                            <dd>
                              {fecha(evento.fechaInicio, {
                                dateStyle: "medium",
                                timeStyle: "short",
                              })}
                            </dd>
                          </div>
                          <div>
                            <dt>{t("eventEnds")}</dt>
                            <dd>
                              {fecha(evento.fechaFin, {
                                dateStyle: "medium",
                                timeStyle: "short",
                              })}
                            </dd>
                          </div>
                        </dl>
                      </div>
                    </details>
                  ))}
                </div>
                {eventos.length > limiteEventos && (
                  <IonButton
                    fill="clear"
                    expand="block"
                    onClick={() => setLimiteEventos((value) => value + 3)}
                  >
                    {t("loadMore")}
                  </IonButton>
                )}
              </>
            ) : (
              <div className="tourist-agenda-empty">
                <span>
                  <IonIcon icon={calendarOutline} aria-hidden="true" />
                </span>
                <div>
                  <h3>{t("noScheduledEvents")}</h3>
                  <p>{t("agendaEmptyHint")}</p>
                </div>
              </div>
            )}
          </section>
        </main>
      </IonContent>
      <BottomNav />
    </IonPage>
  );
};
export default TouristHome;
