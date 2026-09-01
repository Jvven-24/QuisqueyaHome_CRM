import { Suspense } from "react";
import { LoginForm } from "./login-form";

export const metadata = { title: "Acceder · CRM Quisqueya Home" };

export default function LoginPage() {
  return (
    <main>
      <h1>CRM Quisqueya Home</h1>
      {/* `useSearchParams` obliga a un límite de Suspense en el App Router. */}
      <Suspense>
        <LoginForm />
      </Suspense>
    </main>
  );
}
