import { IonIcon } from "@ionic/react";
import { searchOutline, arrowForwardOutline } from "ionicons/icons";
import { useEffect, useState } from "react";
import { useLanguage } from "../i18n/useLanguage";
import "./PlaceSearch.css";

const PlaceSearch: React.FC<{
  initialValue?: string;
  onSearch: (value: string) => void;
}> = ({ initialValue = "", onSearch }) => {
  const { t } = useLanguage();
  const [value, setValue] = useState(initialValue);
  useEffect(() => setValue(initialValue), [initialValue]);
  return (
    <form
      className="place-search"
      role="search"
      onSubmit={(event) => {
        event.preventDefault();
        onSearch(value.trim());
      }}
    >
      <IonIcon icon={searchOutline} aria-hidden="true" />
      <input
        type="search"
        aria-label={t("searchPlaces")}
        placeholder={t("searchPlacesPlaceholder")}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        maxLength={100}
        enterKeyHint="search"
      />
      <button type="submit" aria-label={t("searchPlaces")}>
        <IonIcon icon={arrowForwardOutline} aria-hidden="true" />
      </button>
    </form>
  );
};
export default PlaceSearch;
