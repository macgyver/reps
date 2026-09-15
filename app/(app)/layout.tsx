import Link from "next/link";
import { SubmitButton } from "@/components/submit-button";
import { signOut } from "@/lib/auth/actions";
import styles from "./layout.module.scss";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header className={styles.header}>
        <Link href="/" className={styles.brand}>
          Reps
        </Link>
        <nav className={styles.nav}>
          <Link href="/exercises" className={styles.navLink}>
            Exercises
          </Link>
          <form action={signOut}>
            <SubmitButton className={styles.signOut} pendingLabel="Signing out…">
              Sign out
            </SubmitButton>
          </form>
        </nav>
      </header>
      {children}
    </>
  );
}
