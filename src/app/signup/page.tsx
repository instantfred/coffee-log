import { AuthForm } from "@/components/auth-form";
import { signUp } from "@/app/auth/actions";

export default function SignupPage() {
  return <AuthForm mode="signup" action={signUp} />;
}
