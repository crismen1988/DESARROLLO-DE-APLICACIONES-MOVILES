import { IonFooter, IonIcon } from "@ionic/react";
import {
  compassOutline,
  heartOutline,
  homeOutline,
  personOutline,
} from "ionicons/icons";
import { NavLink } from "react-router-dom";
import { useLanguage } from "../i18n/useLanguage";
import "./BottomNav.css";

const BottomNav: React.FC = () => {
  const { t } = useLanguage();
  return (
    <IonFooter className="banos-bottom-footer">
      <nav className="banos-bottom-nav" aria-label={t("mainNavigation")}>
        {(
          [
            ["/home", homeOutline, "home"],
            ["/catalogo", compassOutline, "explore"],
            ["/favoritos", heartOutline, "favoritesTab"],
            ["/perfil", personOutline, "profile"],
          ] as const
        ).map(([to, icon, label]) => (
          <NavLink key={to} to={to} activeClassName="is-active" exact>
            <IonIcon icon={icon} aria-hidden="true" />
            <span>{t(label)}</span>
          </NavLink>
        ))}
      </nav>
    </IonFooter>
  );
};
export default BottomNav;
