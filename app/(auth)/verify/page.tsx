"use client";

import { useState } from "react";
import { useSignUp } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";

export default function VerifyPage() {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const router = useRouter();
  const { isLoaded, signUp, setActive } = useSignUp();

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded) return;

    setLoading(true);
    setError(null);

    try {
      // Attempt to verify the email address
      const completeSignUp = await signUp.attemptEmailAddressVerification({
        code,
      });

      if (completeSignUp.status === "complete") {
        // Set the user as active (logged in)
        await setActive({ session: completeSignUp.createdSessionId });
        setSuccess(true);

        // Redirect to dashboard after successful verification
        setTimeout(() => {
          router.push("/dashboard/chat");
          router.refresh();
        }, 2000);
      } else {
        // Handle other verification statuses
        setError("La verificación no se pudo completar. Por favor, intenta de nuevo.");
      }
    } catch (err: any) {
      console.error("Verification error:", err);
      setError(err.errors?.[0]?.message || "Ocurrió un error inesperado");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">JAdmin</h1>
          <p className="text-gray-600">Sistema de Gestión de Tickets</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Verifica tu correo electrónico</CardTitle>
            <CardDescription>
              Ingresa el código de verificación que enviamos a tu correo electrónico
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleVerify} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {success && (
                <Alert className="bg-green-50 border-green-500 text-green-700">
                  <AlertDescription>
                    Verificación exitosa. Serás redirigido al panel de control...
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="code">Código de verificación</Label>
                <Input
                  id="code"
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  required
                  placeholder="Ingresa el código de verificación"
                  disabled={loading || success}
                />
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={loading || success || !isLoaded}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verificando...
                  </>
                ) : (
                  "Verificar"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
