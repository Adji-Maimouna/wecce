import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import type { DeclaredDevice } from "@/domain/entities";
import { Icon } from "@/presentation/components/ui/Icon";
import { pts } from "@/presentation/lib/format";
import { AGE_LABELS, CATEGORY_LABELS, CONDITION_LABELS } from "@/presentation/lib/labels";

/** Résumé clair de ce que l'étudiant a déclaré en ligne, avec ses photos et son prix souhaité. */
export function DeclaredPanel({ d }: { d: DeclaredDevice }) {
  const photos = d.photos ?? [];
  const [zoomIndex, setZoomIndex] = useState<number | null>(null);
  const zoomed = zoomIndex !== null ? photos[zoomIndex] ?? null : null;

  useEffect(() => {
    if (zoomIndex === null) return;
    const prevBodyOverflow = document.body.style.overflow;
    const prevHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setZoomIndex(null);
      else if (e.key === "ArrowRight" && photos.length > 1) {
        setZoomIndex((i) => (i === null ? 0 : (i + 1) % photos.length));
      } else if (e.key === "ArrowLeft" && photos.length > 1) {
        setZoomIndex((i) => (i === null ? 0 : (i - 1 + photos.length) % photos.length));
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevBodyOverflow;
      document.documentElement.style.overflow = prevHtmlOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [zoomIndex, photos.length]);

  const displayedPhotoCount = photos.length > 0 ? photos.length : d.photoCount;

  return (
    <aside className="expertise-aside">
      <div className="panel panel--sunken">
        <div className="panel__head">
          <h2 style={{ fontSize: "var(--t-md)" }}>Déclaré en ligne</h2>
          <span className="xs muted">{d.depositRef}</span>
        </div>
        <div className="panel__body">
          <dl className="dl small">
            <dt>Appareil</dt>
            <dd>
              <strong>{d.modele}</strong>
            </dd>
            <dt>Catégorie</dt>
            <dd>{CATEGORY_LABELS[d.category].label}</dd>
            <dt>Stockage</dt>
            <dd>{d.stockage || "–"}</dd>
            <dt>Âge</dt>
            <dd>{AGE_LABELS[d.age]}</dd>
            <dt>État annoncé</dt>
            <dd>{CONDITION_LABELS[d.etat]}</dd>
            <dt>Photos</dt>
            <dd>{displayedPhotoCount === 0 ? "aucune" : displayedPhotoCount}</dd>
          </dl>

          {photos.length > 0 ? (
            <div className="declared-photos" aria-label="Photos de l'appareil">
              {photos.map((p, idx) => (
                <button
                  key={`${p.src}-${idx}`}
                  type="button"
                  className="declared-photo"
                  onClick={() => setZoomIndex(idx)}
                  aria-label={`Agrandir la photo ${idx + 1}`}
                >
                  <img src={p.src} alt={p.alt} />
                  <span className="declared-photo__zoom">Agrandir</span>
                </button>
              ))}
            </div>
          ) : (
            <p className="xs muted" style={{ marginTop: 10 }}>
              Aucune image transmise lors du dépôt en ligne.
            </p>
          )}

          <div className="expertise-wish">
            <span className="small muted">Souhait de l&apos;étudiant</span>
            <span className="expertise-wish__val">{d.wish === null ? "non indiqué" : pts(d.wish)}</span>
          </div>

          <p className="xs muted" style={{ marginTop: 10, display: "flex", gap: 6, alignItems: "center" }}>
            <Icon name="private" size="sm" />
            Visible uniquement par l&apos;étudiant et vous.
          </p>
        </div>
      </div>

      <div className="panel">
        <div className="panel__body stack" style={{ gap: 6 }}>
          <span className="label">Rappel des règles</span>
          <p className="xs muted">
            • <strong>1 point = 1 FCFA</strong> sur tout le marché.
          </p>
          <p className="xs muted">
            • Tous les prix en boutique et soldes étudiants baissent de <strong>5&nbsp;% le 1<sup>er</sup> de chaque mois</strong>.
          </p>
        </div>
      </div>

      {zoomed &&
        zoomIndex !== null &&
        typeof document !== "undefined" &&
        createPortal(
          <div className="photo-lightbox" role="dialog" aria-modal="true" aria-label={zoomed.alt} onClick={() => setZoomIndex(null)}>
            <div className="photo-lightbox__dialog" onClick={(e) => e.stopPropagation()}>
              <div className="photo-lightbox__bar">
                <span className="photo-lightbox__title">
                  {d.modele}
                  {photos.length > 1 ? ` · Photo ${zoomIndex + 1} sur ${photos.length}` : ""}
                </span>
                <button type="button" className="photo-lightbox__close" onClick={() => setZoomIndex(null)} autoFocus>
                  Fermer ✕
                </button>
              </div>
              <div className="photo-lightbox__stage">
                {photos.length > 1 && (
                  <button
                    type="button"
                    className="photo-lightbox__nav photo-lightbox__nav--prev"
                    onClick={() => setZoomIndex((zoomIndex - 1 + photos.length) % photos.length)}
                    aria-label="Photo précédente"
                  >
                    <Icon name="arrow-left" size="sm" />
                  </button>
                )}
                <img className="photo-lightbox__img" src={zoomed.src} alt={zoomed.alt} />
                {photos.length > 1 && (
                  <button
                    type="button"
                    className="photo-lightbox__nav photo-lightbox__nav--next"
                    onClick={() => setZoomIndex((zoomIndex + 1) % photos.length)}
                    aria-label="Photo suivante"
                  >
                    <Icon name="arrow-right" size="sm" />
                  </button>
                )}
              </div>
            </div>
          </div>,
          document.body,
        )}
    </aside>
  );
}
