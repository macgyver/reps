import { signInWithMagicLink } from "./actions";
import styles from "./page.module.scss";
import { SubmitButton } from "./submit-button";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; sent?: string }>;
}) {
  let { error, sent } = await searchParams;

  return (
    <main className={styles.main}>
      <h1 className={styles.brand}>Reps</h1>
      {sent ? (
        <p className={styles.message}>Check your email for a sign-in link.</p>
      ) : (
        <form action={signInWithMagicLink} className={styles.form}>
          <label htmlFor="email" className={styles.label}>
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            autoFocus
            required
            className={styles.input}
          />
          {error ? (
            <p role="alert" className={styles.error}>
              {error}
            </p>
          ) : null}
          <SubmitButton />
        </form>
      )}
    </main>
  );
}
