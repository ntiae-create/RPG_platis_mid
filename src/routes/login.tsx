import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { authClient } from "@/lib/auth/client";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  const nav = useNavigate();

  const [mode, setMode] = useState<"login" | "signup">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (mode === "signup") {
        const result = await authClient.signUp.email({
          name,
          email,
          password,
        });

        if (result.error) {
          setError(
            result.error.message || "Não foi possível criar a conta.",
          );
          return;
        }
      } else {
        const result = await authClient.signIn.email({
          email,
          password,
        });

        if (result.error) {
          setError(result.error.message || "E-mail ou senha inválidos.");
          return;
        }
      }

      nav({ to: "/" });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Ocorreu um erro ao autenticar.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-bg px-5 py-10">
      <img
        src="/hero.jpg"
        alt=""
        className="absolute inset-0 size-full object-cover opacity-25"
      />

      <div className="absolute inset-0 bg-gradient-to-b from-bg/70 via-bg/90 to-bg" />

      <section className="relative w-full max-w-md rounded-xl bg-bg/90 p-6 shadow-2xl backdrop-blur-md sm:p-8">
        <div className="mb-7 text-center">
          <p className="text-xs uppercase tracking-[0.28em] text-muted">
            Mesa virtual
          </p>

          <h1 className="mt-2 font-display text-4xl">
            {mode === "login" ? "Entrar em Platis" : "Criar conta"}
          </h1>

          <p className="mt-2 text-sm text-muted">
            {mode === "login"
              ? "Entre para continuar sua aventura."
              : "Crie sua conta para guardar seu progresso."}
          </p>
        </div>

        <form onSubmit={submit} className="space-y-4">
          {mode === "signup" && (
            <div className="space-y-2">
              <Label htmlFor="name">Nome</Label>
              <Input
                id="name"
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Seu nome"
                autoComplete="name"
                required
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="seu@email.com"
              autoComplete="email"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Senha</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Sua senha"
              autoComplete={
                mode === "login" ? "current-password" : "new-password"
              }
              minLength={8}
              required
            />
          </div>

          {error && (
            <div className="rounded-md bg-red-950/40 px-3 py-2 text-sm text-red-200">
              {error}
            </div>
          )}

          <Button
            type="submit"
            size="lg"
            className="w-full"
            disabled={loading}
          >
            {loading
              ? "Aguarde..."
              : mode === "login"
                ? "Entrar"
                : "Criar conta"}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm text-muted">
          {mode === "login" ? (
            <>
              Ainda não tem conta?{" "}
              <button
                type="button"
                className="text-ink underline underline-offset-4"
                onClick={() => {
                  setError("");
                  setMode("signup");
                }}
              >
                Criar conta
              </button>
            </>
          ) : (
            <>
              Já tem uma conta?{" "}
              <button
                type="button"
                className="text-ink underline underline-offset-4"
                onClick={() => {
                  setError("");
                  setMode("login");
                }}
              >
                Entrar
              </button>
            </>
          )}
        </div>

        <button
          type="button"
          className="mt-6 block w-full text-center text-xs text-muted underline-offset-4 hover:underline"
          onClick={() => nav({ to: "/" })}
        >
          Voltar
        </button>
      </section>
    </main>
  );
}

