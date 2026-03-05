import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import RegisterForm from "@/components/auth/RegisterForm";

export const metadata = {
  title: "Create account",
};

export default async function RegisterPage() {
  const session = await getServerSession(authOptions);

  if (session) {
    redirect("/onboarding");
  }

  return <RegisterForm />;
}
