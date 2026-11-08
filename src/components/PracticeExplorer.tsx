import { useId, useRef, useState, type KeyboardEvent } from "react";
import type { Expertise } from "@/data/content";
import { useExpertises, useT } from "@/i18n";
import { Link } from "@/router";
import { ArrowRight, Plus } from "./Icons";
import "./PracticeExplorer.css";

const PRACTICE_IMAGES: Record<string, string> = {
  affaires: "https://images.pexels.com/photos/8112136/pexels-photo-8112136.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
  famille: "https://images.pexels.com/photos/30015473/pexels-photo-30015473.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
  travail: "https://images.pexels.com/photos/5668494/pexels-photo-5668494.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
  penal: "https://images.pexels.com/photos/8112199/pexels-photo-8112199.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
  mediation: "https://images.pexels.com/photos/5256820/pexels-photo-5256820.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
};

function PracticeContent({ expertise, detailed }: { expertise: Expertise; detailed: boolean }) {
  const t = useT();
  return (
    <>
      <div className="practice-explorer__image">
        <img
          src={PRACTICE_IMAGES[expertise.id] ?? expertise.image}
          alt=""
          loading="lazy"
          decoding="async"
          width={1200}
          height={627}
          onError={(event) => {
            const image = event.currentTarget;
            if (image.dataset.fallback) {
              image.style.visibility = "hidden";
            } else {
              image.dataset.fallback = "true";
              image.src = expertise.image;
            }
          }}
        />
      </div>
      <div className="practice-explorer__content">
        <p className="practice-explorer__overline">CMCB <span aria-hidden="true">/</span> {t.explorer.overline(expertise.num)}</p>
        <h3>{expertise.title}</h3>
        <p className="practice-explorer__description">{detailed ? expertise.intro : expertise.short}</p>
        <div className="practice-explorer__services">
          <p>{t.explorer.servicesTitle}</p>
          <ul>
            {expertise.services.map((service) => <li key={service.title}>{service.title}</li>)}
          </ul>
        </div>
        <div className="practice-explorer__actions">
          <Link to={`/expertises/${expertise.id}`} className="practice-explorer__discover">
            {t.explorer.discover} <ArrowRight className="h-4 w-4" />
          </Link>
          <Link to={`/contact?domaine=${expertise.id}`} className="practice-explorer__contact">
            {t.explorer.appointment}
          </Link>
        </div>
      </div>
    </>
  );
}

/** The desktop tabs and mobile accordion share the same selected practice. */
export function PracticeExplorer({ detailed = false }: { detailed?: boolean }) {
  const t = useT();
  const expertises = useExpertises();
  const [activeIndex, setActiveIndex] = useState(0);
  const [mobileOpen, setMobileOpen] = useState<number | null>(0);
  const instanceId = useId().replace(/[^a-zA-Z0-9]/g, "");
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);

  const select = (index: number) => {
    setActiveIndex(index);
    setMobileOpen(index);
  };

  const onTabKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    let next = index;
    if (event.key === "ArrowDown" || event.key === "ArrowRight") next = (index + 1) % expertises.length;
    else if (event.key === "ArrowUp" || event.key === "ArrowLeft") next = (index - 1 + expertises.length) % expertises.length;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = expertises.length - 1;
    else return;

    event.preventDefault();
    select(next);
    tabs.current[next]?.focus();
  };

  const active = expertises[activeIndex] ?? expertises[0];

  return (
    <div className={`practice-explorer${detailed ? " practice-explorer--detailed" : ""}`}>
      <div className="practice-explorer__desktop">
        <div className="practice-explorer__index">
          <div className="practice-explorer__index-heading">
            <span>{t.explorer.choose}</span>
            <span aria-hidden="true">{active.num} / 05</span>
          </div>
          <div role="tablist" aria-label={t.explorer.listLabel} aria-orientation="vertical">
            {expertises.map((expertise, index) => (
              <button
                key={expertise.id}
                ref={(element) => { tabs.current[index] = element; }}
                id={`${instanceId}-tab-${expertise.id}`}
                type="button"
                role="tab"
                aria-selected={activeIndex === index}
                aria-controls={`${instanceId}-panel-${expertise.id}`}
                tabIndex={activeIndex === index ? 0 : -1}
                className={`practice-explorer__tab${activeIndex === index ? " is-active" : ""}`}
                onClick={() => select(index)}
                onFocus={() => select(index)}
                onKeyDown={(event) => onTabKeyDown(event, index)}
              >
                <span className="practice-explorer__number">{expertise.num}</span>
                <span className="practice-explorer__tab-copy">
                  <span className="practice-explorer__tab-title">{expertise.shortTitle}</span>
                  <span className="practice-explorer__tab-note">{t.explorer.notes[expertise.id]}</span>
                </span>
                <ArrowRight className="practice-explorer__tab-arrow" />
              </button>
            ))}
          </div>
          <p className="practice-explorer__hint">{t.explorer.hint}</p>
        </div>

        <div className="practice-explorer__panels">
          {expertises.map((expertise, index) => (
            <section
              key={expertise.id}
              id={`${instanceId}-panel-${expertise.id}`}
              role="tabpanel"
              aria-labelledby={`${instanceId}-tab-${expertise.id}`}
              hidden={activeIndex !== index}
              className="practice-explorer__panel"
            >
              <PracticeContent expertise={expertise} detailed={detailed} />
            </section>
          ))}
        </div>
      </div>

      <div className="practice-explorer__mobile">
        <div className="practice-explorer__index-heading">
          <span>{t.explorer.choose}</span>
          <span aria-hidden="true">{active.num} / 05</span>
        </div>
        {expertises.map((expertise, index) => {
          const isOpen = mobileOpen === index;
          return (
            <div key={expertise.id} className="practice-explorer__mobile-item">
              <button
                id={`${instanceId}-mobile-button-${expertise.id}`}
                type="button"
                className={`practice-explorer__tab${isOpen ? " is-active" : ""}`}
                aria-expanded={isOpen}
                aria-controls={`${instanceId}-mobile-panel-${expertise.id}`}
                onClick={() => {
                  setActiveIndex(index);
                  setMobileOpen(isOpen ? null : index);
                }}
              >
                <span className="practice-explorer__number">{expertise.num}</span>
                <span className="practice-explorer__tab-copy">
                  <span className="practice-explorer__tab-title">{expertise.shortTitle}</span>
                  <span className="practice-explorer__tab-note">{t.explorer.notes[expertise.id]}</span>
                </span>
                <Plus className="practice-explorer__mobile-toggle" />
              </button>
              <section
                id={`${instanceId}-mobile-panel-${expertise.id}`}
                role="region"
                aria-labelledby={`${instanceId}-mobile-button-${expertise.id}`}
                hidden={!isOpen}
                className="practice-explorer__panel practice-explorer__mobile-panel"
              >
                <PracticeContent expertise={expertise} detailed={detailed} />
              </section>
            </div>
          );
        })}
      </div>
    </div>
  );
}
