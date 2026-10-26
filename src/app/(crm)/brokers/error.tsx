"use client";
import { ErrorG3 } from "./error-compartido";
export default function ErrorModulo({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <ErrorG3 reset={reset} />;
}
