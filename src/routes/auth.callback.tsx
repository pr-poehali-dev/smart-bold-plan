import { createFileRoute } from "@tanstack/react-router";
import OAuthCallback from "@/pages/OAuthCallback";

export const Route = createFileRoute("/auth/callback")({
  head: () => ({
    meta: [{ title: "Вход в аккаунт — 3DForm" }, { name: "robots", content: "noindex" }],
  }),
  component: AuthCallbackPage,
});

function AuthCallbackPage() {
  return (
    <>
      <h1 className="sr-only">Вход в аккаунт 3DForm через Яндекс или VK — подождите, идёт проверка авторизации</h1>
      <OAuthCallback />
    </>
  );
}
