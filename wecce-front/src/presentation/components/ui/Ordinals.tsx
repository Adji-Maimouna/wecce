import { Fragment } from "react";

/** Met les ordinaux français en exposant : « 1er nov. » → 1<sup>er</sup> nov., « 1re génération », « 64e dépôt ». */
export function Ordinals({ text }: { text: string }) {
  const parts = text.split(/(\d+)(er|re|e)\b/);
  if (parts.length === 1) return <>{text}</>;
  const out = [];
  for (let i = 0; i < parts.length; i += 3) {
    out.push(<Fragment key={i}>{parts[i]}</Fragment>);
    if (parts[i + 1] !== undefined) {
      out.push(
        <Fragment key={`${i}n`}>
          {parts[i + 1]}
          <sup>{parts[i + 2]}</sup>
        </Fragment>,
      );
    }
  }
  return <>{out}</>;
}
