import { Suspense } from "react"
import { LoginForm } from "./login-form"

export const dynamic = "force-dynamic"

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center text-muted-foreground text-sm">
          Loading…
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  )
}
