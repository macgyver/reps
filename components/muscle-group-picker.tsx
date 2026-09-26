"use client";

import { useRef, useState } from "react";
import styles from "./muscle-group-picker.module.scss";

export const MUSCLE_GROUPS = [
  { key: "shoulders", label: "Shoulders" },
  { key: "chest", label: "Chest" },
  { key: "biceps", label: "Biceps" },
  { key: "triceps", label: "Triceps" },
  { key: "forearms", label: "Forearms" },
  { key: "abs", label: "Abs" },
  { key: "obliques", label: "Obliques" },
  { key: "traps", label: "Traps" },
  { key: "back", label: "Back" },
  { key: "lowerBack", label: "Lower back" },
  { key: "glutes", label: "Glutes" },
  { key: "quads", label: "Quads" },
  { key: "adductors", label: "Adductors" },
  { key: "hamstrings", label: "Hamstrings" },
  { key: "calves", label: "Calves" },
] as const;

type MuscleGroupKey = (typeof MUSCLE_GROUPS)[number]["key"];

const LABEL_BY_KEY: Map<string, string> = new Map(MUSCLE_GROUPS.map((m) => [m.key, m.label]));

function Region({
  muscleKey,
  selected,
  hovered,
  onToggle,
  onHoverChange,
  children,
}: {
  muscleKey: MuscleGroupKey;
  selected: boolean;
  hovered: boolean;
  onToggle: (key: MuscleGroupKey) => void;
  onHoverChange: (key: MuscleGroupKey, hovering: boolean) => void;
  children: React.ReactNode;
}) {
  let label = LABEL_BY_KEY.get(muscleKey) ?? muscleKey;
  let classNames = [styles.region, selected ? styles.regionSelected : "", hovered ? styles.regionHovered : ""]
    .filter(Boolean)
    .join(" ");

  return (
    <g
      className={classNames}
      role="checkbox"
      aria-checked={selected}
      aria-label={label}
      tabIndex={0}
      onClick={() => onToggle(muscleKey)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onToggle(muscleKey);
        }
      }}
      onMouseEnter={() => onHoverChange(muscleKey, true)}
      onMouseLeave={() => onHoverChange(muscleKey, false)}
    >
      <title>{label}</title>
      {children}
    </g>
  );
}

export function MuscleGroupPicker({
  name,
  defaultValue = [],
}: {
  name: string;
  defaultValue?: string[];
}) {
  let [selected, setSelected] = useState<Set<string>>(new Set(defaultValue));
  let [hoveredKey, setHoveredKey] = useState<MuscleGroupKey | null>(null);
  let wrapperRef = useRef<HTMLDivElement>(null);

  // Shared by key, not by element — so hovering a region in one view (e.g.
  // front-view shoulders) also highlights its counterpart in the other view.
  function handleHoverChange(key: MuscleGroupKey, hovering: boolean) {
    setHoveredKey((prev) => {
      if (hovering) return key;
      return prev === key ? null : prev;
    });
  }

  function toggle(key: MuscleGroupKey) {
    setSelected((prev) => {
      let next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
    // Clicking an SVG region doesn't fire a native input event the way a
    // real form control would — dispatch one so ancestors (e.g. a submit
    // button tracking "has this form been touched since it saved") see it.
    wrapperRef.current?.dispatchEvent(new Event("input", { bubbles: true }));
  }

  return (
    <div className={styles.wrapper} ref={wrapperRef}>
      {Array.from(selected).map((key) => (
        <input key={key} type="hidden" name={name} value={key} />
      ))}

      <div className={styles.diagrams}>
        <svg viewBox="0 0 160 330" className={styles.body}>
          <desc>Front view — tap a muscle group to toggle it</desc>
          <circle className={styles.decorative} cx="80" cy="22" r="18" />
          <rect className={styles.decorative} x="72" y="38" width="16" height="10" rx="3" />
          <rect className={styles.decorative} x="48" y="230" width="24" height="70" rx="10" />
          <rect className={styles.decorative} x="88" y="230" width="24" height="70" rx="10" />

          <Region
            muscleKey="shoulders"
            selected={selected.has("shoulders")}
            hovered={hoveredKey === "shoulders"}
            onToggle={toggle}
            onHoverChange={handleHoverChange}
          >
            <circle cx="30" cy="56" r="13" />
            <circle cx="130" cy="56" r="13" />
          </Region>
          <Region
            muscleKey="biceps"
            selected={selected.has("biceps")}
            hovered={hoveredKey === "biceps"}
            onToggle={toggle}
            onHoverChange={handleHoverChange}
          >
            <rect x="18" y="64" width="20" height="42" rx="9" />
            <rect x="122" y="64" width="20" height="42" rx="9" />
          </Region>
          <Region
            muscleKey="forearms"
            selected={selected.has("forearms")}
            hovered={hoveredKey === "forearms"}
            onToggle={toggle}
            onHoverChange={handleHoverChange}
          >
            <rect x="15" y="108" width="19" height="55" rx="9" />
            <rect x="126" y="108" width="19" height="55" rx="9" />
          </Region>
          <Region
            muscleKey="chest"
            selected={selected.has("chest")}
            hovered={hoveredKey === "chest"}
            onToggle={toggle}
            onHoverChange={handleHoverChange}
          >
            <rect x="50" y="52" width="60" height="30" rx="8" />
          </Region>
          <Region
            muscleKey="abs"
            selected={selected.has("abs")}
            hovered={hoveredKey === "abs"}
            onToggle={toggle}
            onHoverChange={handleHoverChange}
          >
            <rect x="58" y="84" width="44" height="38" rx="8" />
          </Region>
          <Region
            muscleKey="obliques"
            selected={selected.has("obliques")}
            hovered={hoveredKey === "obliques"}
            onToggle={toggle}
            onHoverChange={handleHoverChange}
          >
            <rect x="50" y="84" width="8" height="38" rx="4" />
            <rect x="102" y="84" width="8" height="38" rx="4" />
          </Region>
          <Region
            muscleKey="quads"
            selected={selected.has("quads")}
            hovered={hoveredKey === "quads"}
            onToggle={toggle}
            onHoverChange={handleHoverChange}
          >
            <rect x="46" y="122" width="28" height="108" rx="14" />
            <rect x="86" y="122" width="28" height="108" rx="14" />
          </Region>
          <Region
            muscleKey="adductors"
            selected={selected.has("adductors")}
            hovered={hoveredKey === "adductors"}
            onToggle={toggle}
            onHoverChange={handleHoverChange}
          >
            <rect x="68" y="122" width="12" height="70" rx="6" />
            <rect x="80" y="122" width="12" height="70" rx="6" />
          </Region>
        </svg>

        <svg viewBox="0 0 160 330" className={styles.body}>
          <desc>Back view — tap a muscle group to toggle it</desc>
          <circle className={styles.decorative} cx="80" cy="22" r="18" />
          <rect className={styles.decorative} x="72" y="38" width="16" height="10" rx="3" />

          <Region
            muscleKey="traps"
            selected={selected.has("traps")}
            hovered={hoveredKey === "traps"}
            onToggle={toggle}
            onHoverChange={handleHoverChange}
          >
            <rect x="45" y="40" width="70" height="24" rx="8" />
          </Region>
          <Region
            muscleKey="shoulders"
            selected={selected.has("shoulders")}
            hovered={hoveredKey === "shoulders"}
            onToggle={toggle}
            onHoverChange={handleHoverChange}
          >
            <circle cx="30" cy="56" r="13" />
            <circle cx="130" cy="56" r="13" />
          </Region>
          <Region
            muscleKey="triceps"
            selected={selected.has("triceps")}
            hovered={hoveredKey === "triceps"}
            onToggle={toggle}
            onHoverChange={handleHoverChange}
          >
            <rect x="18" y="64" width="20" height="42" rx="9" />
            <rect x="122" y="64" width="20" height="42" rx="9" />
          </Region>
          <Region
            muscleKey="forearms"
            selected={selected.has("forearms")}
            hovered={hoveredKey === "forearms"}
            onToggle={toggle}
            onHoverChange={handleHoverChange}
          >
            <rect x="15" y="108" width="19" height="55" rx="9" />
            <rect x="126" y="108" width="19" height="55" rx="9" />
          </Region>
          <Region
            muscleKey="back"
            selected={selected.has("back")}
            hovered={hoveredKey === "back"}
            onToggle={toggle}
            onHoverChange={handleHoverChange}
          >
            <rect x="50" y="64" width="60" height="38" rx="8" />
          </Region>
          <Region
            muscleKey="lowerBack"
            selected={selected.has("lowerBack")}
            hovered={hoveredKey === "lowerBack"}
            onToggle={toggle}
            onHoverChange={handleHoverChange}
          >
            <rect x="50" y="102" width="60" height="20" rx="6" />
          </Region>
          <Region
            muscleKey="glutes"
            selected={selected.has("glutes")}
            hovered={hoveredKey === "glutes"}
            onToggle={toggle}
            onHoverChange={handleHoverChange}
          >
            <rect x="46" y="122" width="68" height="30" rx="14" />
          </Region>
          <Region
            muscleKey="hamstrings"
            selected={selected.has("hamstrings")}
            hovered={hoveredKey === "hamstrings"}
            onToggle={toggle}
            onHoverChange={handleHoverChange}
          >
            <rect x="46" y="152" width="28" height="78" rx="14" />
            <rect x="86" y="152" width="28" height="78" rx="14" />
          </Region>
          <Region
            muscleKey="adductors"
            selected={selected.has("adductors")}
            hovered={hoveredKey === "adductors"}
            onToggle={toggle}
            onHoverChange={handleHoverChange}
          >
            <rect x="68" y="152" width="12" height="70" rx="6" />
            <rect x="80" y="152" width="12" height="70" rx="6" />
          </Region>
          <Region
            muscleKey="calves"
            selected={selected.has("calves")}
            hovered={hoveredKey === "calves"}
            onToggle={toggle}
            onHoverChange={handleHoverChange}
          >
            <rect x="48" y="230" width="24" height="70" rx="10" />
            <rect x="88" y="230" width="24" height="70" rx="10" />
          </Region>
        </svg>
      </div>

      <p className={styles.hint}>
        {selected.size > 0
          ? Array.from(selected)
              .map((key) => LABEL_BY_KEY.get(key) ?? key)
              .join(", ")
          : "Tap the muscle groups this exercise targets"}
      </p>
    </div>
  );
}
