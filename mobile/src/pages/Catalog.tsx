import {
  IonButton,
  IonContent,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonPage,
  IonSpinner,
  IonTitle,
  IonToolbar,
} from "@ionic/react";
import { CapacitorHttp } from "@capacitor/core";
import { locationOutline } from "ionicons/icons";
import { useEffect, useState } from "react";
import { useHistory, useLocation } from "react-router-dom";
import { useLanguage } from "../i18n/useLanguage";
import "./Catalog.css";
import BottomNav from "../components/BottomNav";
import PlaceSearch from "../components/PlaceSearch";

type Categoria = { id: number; nombre: string };
type PuntoInteres = {
  id: number;
  nombre: string;
  descripcion?: string | null;
  direccion?: string | null;
  categoria?: Categoria;
};

const Catalog: React.FC = () => {
  const history = useHistory();
  const location = useLocation();
  const { t } = useLanguage();
  const query = new URLSearchParams(location.search);
  const busqueda = (query.get("busqueda") ?? "").slice(0, 100);
  const categoriaNumero = Number(query.get("categoriaId"));
  const categoriaId =
    Number.isInteger(categoriaNumero) && categoriaNumero > 0
      ? categoriaNumero
      : null;
  const paginaNumero = Number(query.get("pagina"));
  const pagina =
    Number.isInteger(paginaNumero) && paginaNumero > 0 ? paginaNumero : 1;
  const [puntos, setPuntos] = useState<PuntoInteres[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState(false);
  const [errorCategorias, setErrorCategorias] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [revision, setRevision] = useState(0);
  const limite = 20;

  useEffect(() => {
    let vigente = true;
    setErrorCategorias(false);
    void CapacitorHttp.get({
      url: `${import.meta.env.VITE_API_URL}/categorias`,
    })
      .then((response) => {
        if (response.status !== 200 || !Array.isArray(response.data))
          throw new Error("categories");
        if (vigente) setCategorias(response.data as Categoria[]);
      })
      .catch(() => {
        if (vigente) setErrorCategorias(true);
      });
    return () => {
      vigente = false;
    };
  }, [revision]);

  useEffect(() => {
    let vigente = true;
    setCargando(true);
    setError(false);
    setPuntos([]);
    const params: Record<string, string> = {
      pagina: String(pagina),
      limite: String(limite),
    };
    if (busqueda) params.busqueda = busqueda;
    if (categoriaId) params.categoriaId = String(categoriaId);
    void CapacitorHttp.get({
      url: `${import.meta.env.VITE_API_URL}/puntos-interes`,
      params,
    })
      .then((response) => {
        if (response.status !== 200) throw new Error("catalog");
        const data = response.data as { datos: PuntoInteres[]; total: number };
        if (!Array.isArray(data.datos) || typeof data.total !== "number")
          throw new Error("catalog");
        if (vigente) {
          setPuntos(data.datos);
          setTotal(data.total);
        }
      })
      .catch(() => {
        if (vigente) setError(true);
      })
      .finally(() => {
        if (vigente) setCargando(false);
      });
    return () => {
      vigente = false;
    };
  }, [busqueda, categoriaId, pagina, revision]);

  const filtrar = (
    texto: string,
    categoria: number | null,
    nuevaPagina = 1,
  ) => {
    const siguiente = new URLSearchParams();
    if (texto) siguiente.set("busqueda", texto);
    if (categoria) siguiente.set("categoriaId", String(categoria));
    if (nuevaPagina > 1) siguiente.set("pagina", String(nuevaPagina));
    history.replace({
      pathname: "/catalogo",
      search: siguiente.toString() ? `?${siguiente}` : "",
    });
  };

  return (
    <IonPage className="catalog-page">
      <IonHeader>
        <IonToolbar>
          <IonTitle>{t("explore")}</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <main className="catalog-content">
          <PlaceSearch
            initialValue={busqueda}
            onSearch={(value) => filtrar(value, categoriaId)}
          />
          <div className="catalog-filters" aria-label={t("categories")}>
            <button
              type="button"
              aria-pressed={categoriaId === null}
              className={categoriaId === null ? "selected" : ""}
              onClick={() => filtrar(busqueda, null)}
            >
              {t("allPlaces")}
            </button>
            {categorias.map((categoria) => (
              <button
                type="button"
                aria-pressed={categoriaId === categoria.id}
                className={categoriaId === categoria.id ? "selected" : ""}
                key={categoria.id}
                onClick={() => filtrar(busqueda, categoria.id)}
              >
                {categoria.nombre}
              </button>
            ))}
          </div>
          {errorCategorias && (
            <div className="catalog-error" role="alert">
              {t("categoriesError")}
              <IonButton
                fill="clear"
                onClick={() => setRevision((value) => value + 1)}
              >
                {t("retry")}
              </IonButton>
            </div>
          )}
          <div className="catalog-results-heading">
            <h1>
              {categorias.find((categoria) => categoria.id === categoriaId)
                ?.nombre ?? t("catalogTitle")}
            </h1>
            {!cargando && !error && (
              <span aria-live="polite">
                {total} {t("placesFound")}
              </span>
            )}
          </div>
          {(busqueda || categoriaId) && (
            <IonButton
              className="catalog-clear"
              size="small"
              fill="clear"
              onClick={() => filtrar("", null)}
            >
              {t("clearFilters")}
            </IonButton>
          )}
          {cargando && (
            <div className="catalog-empty" role="status">
              <IonSpinner />
              <p>{t("loadingPlaces")}</p>
            </div>
          )}
          {error && (
            <div className="catalog-error" role="alert">
              {t("catalogLoadError")}
              <IonButton
                fill="clear"
                onClick={() => setRevision((value) => value + 1)}
              >
                {t("retry")}
              </IonButton>
            </div>
          )}
          <IonList className="catalog-list">
            {puntos.map((punto) => (
              <IonItem className="catalog-place" key={punto.id} lines="none">
                <IonIcon
                  slot="start"
                  icon={locationOutline}
                  aria-hidden="true"
                />
                <IonLabel>
                  <span className="catalog-place-category">
                    {punto.categoria?.nombre ?? t("catalogTitle")}
                  </span>
                  <h2>{punto.nombre}</h2>
                  <p>{punto.descripcion ?? t("tourismExperience")}</p>
                  {punto.direccion && <small>{punto.direccion}</small>}
                </IonLabel>
              </IonItem>
            ))}
          </IonList>
          {!cargando && !error && puntos.length === 0 && (
            <div className="catalog-empty">
              <IonIcon icon={locationOutline} />
              <h2>
                {busqueda || categoriaId
                  ? t("noSearchResults")
                  : t("emptyCatalog")}
              </h2>
              <p>
                {busqueda || categoriaId
                  ? t("adjustSearchHint")
                  : t("catalogEmptyHint")}
              </p>
            </div>
          )}
          {!cargando && !error && (pagina > 1 || pagina * limite < total) && (
            <nav className="catalog-pagination" aria-label={t("catalogPages")}>
              <IonButton
                fill="outline"
                disabled={pagina === 1}
                onClick={() => filtrar(busqueda, categoriaId, pagina - 1)}
              >
                {t("previousPage")}
              </IonButton>
              <span>
                {pagina} / {Math.max(1, Math.ceil(total / limite))}
              </span>
              <IonButton
                fill="outline"
                disabled={pagina * limite >= total}
                onClick={() => filtrar(busqueda, categoriaId, pagina + 1)}
              >
                {t("nextPage")}
              </IonButton>
            </nav>
          )}
        </main>
      </IonContent>
      <BottomNav />
    </IonPage>
  );
};
export default Catalog;
