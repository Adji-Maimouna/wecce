import { useState, type InputHTMLAttributes } from "react";

type PasswordInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "className">;

/** Mot de passe avec un bouton « Afficher / Masquer ». */
export function PasswordInput({ id, ...rest }: PasswordInputProps) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="pw">
      <input className="input" id={id} type={visible ? "text" : "password"} {...rest} />
      <button type="button" aria-pressed={visible} aria-controls={id} onClick={() => setVisible((v) => !v)}>
        {visible ? "Masquer" : "Afficher"}
      </button>
    </div>
  );
}
