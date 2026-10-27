import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { HeaderNav } from "./header-nav";
import styles from "./layout.module.scss";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  let user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <>
      <header className={styles.header}>
        <Link href="/" className={styles.brand}>
          Reps
        </Link>
        <HeaderNav userId={user.id} />
      </header>
      {children}
    </>
  );
}
