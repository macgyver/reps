import { Changelist } from "./changelist";
import styles from "./page.module.scss";

export default function SettingsPage() {
  return (
    <main className={styles.main}>
      <h1>Settings</h1>
      <h2 className={styles.heading}>Changes</h2>
      <Changelist />
    </main>
  );
}
