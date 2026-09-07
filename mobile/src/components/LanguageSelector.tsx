import { IonIcon } from '@ionic/react';
import { chevronDownOutline, languageOutline } from 'ionicons/icons';
import { useEffect, useRef, useState } from 'react';
import { useLanguage } from '../i18n/useLanguage';
import './LanguageSelector.css';

const LanguageSelector: React.FC = () => {
  const { language, setLanguage, t } = useLanguage();
  const [abierto, setAbierto] = useState(false);
  const selectorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const cerrarAlHacerClickFuera = (event: MouseEvent) => {
      if (!selectorRef.current?.contains(event.target as Node)) setAbierto(false);
    };
    document.addEventListener('click', cerrarAlHacerClickFuera);
    return () => document.removeEventListener('click', cerrarAlHacerClickFuera);
  }, []);

  const seleccionarIdioma = (nextLanguage: 'es' | 'en') => {
    setLanguage(nextLanguage);
    setAbierto(false);
  };

  return (
    <div className="language-selector" ref={selectorRef}>
      <button className="language-trigger" type="button" aria-label={t('language')} aria-expanded={abierto} aria-haspopup="menu" onClick={() => setAbierto((current) => !current)}>
        <IonIcon icon={languageOutline} aria-hidden="true" />
        <span>{language === 'es' ? 'ES' : 'EN'}</span>
        <IonIcon className="language-chevron" icon={chevronDownOutline} aria-hidden="true" />
      </button>
      {abierto && (
        <div className="language-menu" role="menu" aria-label={t('language')}>
          <button type="button" role="menuitemradio" aria-checked={language === 'es'} className={language === 'es' ? 'active' : ''} onClick={() => seleccionarIdioma('es')}>
            <span className="language-code">ES</span><span>{t('spanish')}</span>
          </button>
          <button type="button" role="menuitemradio" aria-checked={language === 'en'} className={language === 'en' ? 'active' : ''} onClick={() => seleccionarIdioma('en')}>
            <span className="language-code">EN</span><span>{t('english')}</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default LanguageSelector;
