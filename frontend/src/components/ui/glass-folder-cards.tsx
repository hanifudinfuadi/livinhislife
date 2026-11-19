"use client";

import * as React from "react";

/* -------------------------------------------------------------------------- */
/* Types                                                                       */
/* -------------------------------------------------------------------------- */

export type GlassFolderTone = "milk" | "smoke";

export interface GlassFolderFile {
  id: string;
  title: string;
  /** Short label rendered under the title, e.g. "Esai" or "2026". */
  meta?: string;
  /** Emoji, text or any node used as the file glyph. Defaults to a page icon. */
  icon?: React.ReactNode;
  /** Optional href. When present the file behaves like a link. */
  href?: string;
  /** Extra data kept untouched and passed back to onFileSelect. */
  [key: string]: unknown;
}

export interface GlassFolderMenuItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  onSelect?: () => void;
  danger?: boolean;
  disabled?: boolean;
}

export interface GlassFolderCardsProps {
  /** Folder heading. */
  title: string;
  /** Small uppercase line above the title. */
  eyebrow?: string;
  /** Short sentence under the title. */
  description?: string;
  /** Files shown as tabs when the folder is closed and fanned out when open. */
  files?: GlassFolderFile[];
  /** Front-panel artwork. A URL renders an image, a function renders artwork. */
  image?: string | ((tone: GlassFolderTone) => React.ReactNode);
  /** Custom auto-generated artwork function (defaults to the built-in one). */
  artwork?: (tone: GlassFolderTone) => React.ReactNode;
  /** Frosted milk glass (light) or smoky glass (dark). */
  tone?: GlassFolderTone;
  /** Show the "+" button. */
  addable?: boolean;
  /** Called by the "+" button and, when custom is false, a default file is added. */
  onAddFile?: (file: GlassFolderFile) => void;
  /** Disable the built-in fallback file so onAddFile can own the flow. */
  customAdd?: boolean;
  /** File list controlled from outside (when provided, internal state is ignored). */
  items?: GlassFolderFile[];
  /** Called whenever the file list changes. */
  onFilesChange?: (files: GlassFolderFile[]) => void;
  /** Show the "···" menu button. */
  menu?: boolean;
  /** Custom menu entries; a sensible default set is used when omitted. */
  menuItems?: GlassFolderMenuItem[];
  /** Entry animation delay in ms, useful for several folders on one page. */
  delay?: number;
  /** Fired when a file is activated (click or Enter/Space). */
  onFileSelect?: (file: GlassFolderFile) => void;
  /** Use this to navigate with the router instead of a plain link. */
  onFileNavigate?: (file: GlassFolderFile) => void;
  /** Text in the top-left of the front panel (e.g. "Arsip"). */
  badge?: React.ReactNode;
  /** Text anchored to the top-right of the front panel. */
  headerText?: React.ReactNode;
  /** Total label rendered under the folder, e.g. "6 file". */
  footerLabel?: string;
  /** Optional slot rendered under the folder, before the footer label. */
  actions?: React.ReactNode;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  className?: string;
}

export interface GlassFolderGridProps {
  children: React.ReactNode;
  className?: string;
}

/* -------------------------------------------------------------------------- */
/* Icon (kept dependency free)                                                 */
/* -------------------------------------------------------------------------- */

function SvgIcon({
  children,
  size = 16,
  className,
  ...rest
}: React.SVGProps<SVGSVGElement> & { size?: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={className}
      {...rest}
    >
      {children}
    </svg>
  );
}

const PageIcon = (props: { size?: number }) => (
  <SvgIcon {...props}>
    <path d="M14 3v4a1 1 0 0 0 1 1h4" />
    <path d="M19 8v11a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7z" />
    <path d="M9 13h6M9 17h4" />
  </SvgIcon>
);

const PlusIcon = () => (
  <SvgIcon size={14}>
    <path d="M12 5v14M5 12h14" />
  </SvgIcon>
);

const MoreIcon = () => (
  <SvgIcon size={16}>
    <circle cx="5" cy="12" r="1.4" fill="currentColor" stroke="none" />
    <circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none" />
    <circle cx="19" cy="12" r="1.4" fill="currentColor" stroke="none" />
  </SvgIcon>
);

/* -------------------------------------------------------------------------- */
/* Helpers                                                                     */
/* -------------------------------------------------------------------------- */

const EASE = "cubic-bezier(.22,1,.36,1)";

function uid() {
  return `gf-${Math.random().toString(36).slice(2, 9)}`;
}

/** Seeded pseudo random so the generated artwork is stable per title. */
function hashSeed(value: string) {
  let h = 2166136261;
  for (let i = 0; i < value.length; i++) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

function randomFrom(seed: number) {
  let s = seed || 1;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

/* -------------------------------------------------------------------------- */
/* Auto generated artwork (no images, no external assets)                      */
/* -------------------------------------------------------------------------- */

export function GlassFolderArtwork({
  tone = "milk",
  seed = "glass-folder",
}: {
  tone?: GlassFolderTone;
  seed?: string;
}) {
  const rand = randomFrom(hashSeed(seed));
  const milk = tone === "milk";

  const lines = React.useMemo(() => {
    const r = randomFrom(hashSeed(`${seed}-lines`));
    return Array.from({ length: 9 }, () => ({
      x1: r() * 100,
      y1: r() * 100,
      x2: r() * 100,
      y2: r() * 100,
      // deterministic but varied opacity
      o: 0.06 + r() * 0.16,
    }));
    // seeded positions
  }, [seed]);

  const stars = React.useMemo(() => {
    return Array.from({ length: 22 }, () => ({
      cx: rand() * 100,
      cy: rand() * 100,
      r: 0.2 + rand() * 0.9,
    }));
  }, [rand]);

  return (
    <div
      aria-hidden="true"
      style={{
        position: "absolute",
        inset: 0,
        overflow: "hidden",
        pointerEvents: "none",
      }}
    >
      <svg
        viewBox="0 0 100 100"
        width="100%"
        height="100%"
        preserveAspectRatio="xMidYMid slice"
        style={{ position: "absolute", inset: 0 }}
      >
        <defs>
          <linearGradient id={`gf-g1-${tone}`} x1="0" y1="0" x2="1" y2="1">
            {milk ? (
              <>
                <stop offset="0%" stopColor="#d7ccff" stopOpacity="0.85" />
                <stop offset="55%" stopColor="#f7d6e6" stopOpacity="0.55" />
                <stop offset="100%" stopColor="#cdebe6" stopOpacity="0.7" />
              </>
            ) : (
              <>
                <stop offset="0%" stopColor="#6d5bd0" stopOpacity="0.55" />
                <stop offset="55%" stopColor="#b0577e" stopOpacity="0.32" />
                <stop offset="100%" stopColor="#2f7f78" stopOpacity="0.42" />
              </>
            )}
          </linearGradient>
          <radialGradient id={`gf-g2-${tone}`} cx="0.22" cy="0.18" r="0.9">
            <stop
              offset="0%"
              stopColor={milk ? "#ffffff" : "#b9a8ff"}
              stopOpacity={milk ? 0.9 : 0.5}
            />
            <stop offset="100%" stopColor={milk ? "#e9dcff" : "#0b0a18"} stopOpacity="0" />
          </radialGradient>
          <radialGradient id={`gf-g3-${tone}`} cx="0.82" cy="0.86" r="0.7">
            <stop offset="0%" stopColor={milk ? "#ffd9ea" : "#ff7ab8"} stopOpacity={milk ? 0.9 : 0.35} />
            <stop offset="100%" stopColor={milk ? "#ffeef6" : "#120a18"} stopOpacity="0" />
          </radialGradient>
        </defs>

        <rect width="100" height="100" fill={`url(#gf-g1-${tone})`} />
        <rect width="100" height="100" fill={`url(#gf-g2-${tone})`} />
        <rect width="100" height="100" fill={`url(#gf-g3-${tone})`} />

        {/* constellation lines */}
        <g stroke={milk ? "#5b4a9e" : "#e4dcff"} strokeWidth="0.18">
          {lines.map((l, i) => (
            <line key={i} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} opacity={l.o} />
          ))}
        </g>

        {/* planet rings */}
        <g fill="none" stroke={milk ? "#6f5ec4" : "#f2ecff"} opacity={milk ? 0.5 : 0.35}>
          <ellipse cx="58" cy="52" rx="34" ry="12" strokeWidth="0.4" transform="rotate(-18 58 52)" />
          <ellipse cx="58" cy="52" rx="24" ry="8" strokeWidth="0.28" transform="rotate(-18 58 52)" />
        </g>
        <circle
          cx="58"
          cy="52"
          r="9"
          fill={milk ? "#ffffff" : "#1b1730"}
          fillOpacity={milk ? 0.55 : 0.85}
          stroke={milk ? "#7c6ad0" : "#d9cfff"}
          strokeOpacity="0.5"
          strokeWidth="0.35"
        />

        {/* stars */}
        <g fill={milk ? "#4b3d8a" : "#ffffff"}>
          {stars.map((s, i) => (
            <circle key={i} cx={s.cx} cy={s.cy} r={s.r * 0.22} opacity={milk ? 0.5 : 0.8} />
          ))}
        </g>
      </svg>

      {/* soft sheen that keeps the front panel reading as glass */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: milk
            ? "linear-gradient(145deg, rgba(255,255,255,.85) 0%, rgba(255,255,255,.25) 38%, rgba(255,255,255,0) 60%)"
            : "linear-gradient(145deg, rgba(255,255,255,.16) 0%, rgba(255,255,255,.04) 38%, rgba(0,0,0,.12) 100%)",
        }}
      />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Menu (accessible, blurred)                                                  */
/* -------------------------------------------------------------------------- */

function FolderMenu({
  items,
  tone,
  onClose,
  anchorRect,
}: {
  items: GlassFolderMenuItem[];
  tone: GlassFolderTone;
  onClose: () => void;
  anchorRect: DOMRect | null;
}) {
  const ref = React.useRef<HTMLDivElement>(null);
  const [active, setActive] = React.useState(0);

  const enabled = items.filter((i) => !i.disabled);

  React.useEffect(() => {
    setActive(0);
  }, []);

  React.useEffect(() => {
    ref.current?.focus();
  }, []);

  const move = (dir: 1 | -1) => {
    if (!enabled.length) return;
    setActive((prev) => {
      const current = items.findIndex((i) => i === enabled[prev]);
      const next = (current + dir + enabled.length) % enabled.length;
      return next;
    });
  };

  const onKeyDown = (event: React.KeyboardEvent) => {
    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        move(1);
        break;
      case "ArrowUp":
        event.preventDefault();
        move(-1);
        break;
      case "Home":
        event.preventDefault();
        setActive(0);
        break;
      case "End":
        event.preventDefault();
        setActive(Math.max(0, enabled.length - 1));
        break;
      case "Escape":
        event.preventDefault();
        event.stopPropagation();
        onClose();
        break;
      case "Tab":
        onClose();
        break;
      case "Enter":
      case " ":
        event.preventDefault();
        {
          const item = enabled[active];
          item?.onSelect?.();
          onClose();
        }
        break;
      default:
        break;
    }
  };

  const milk = tone === "milk";
  const style: React.CSSProperties = anchorRect
    ? {
        position: "fixed",
        top: Math.min(anchorRect.bottom + 8, window.innerHeight - 200),
        left: Math.min(anchorRect.right - 208, window.innerWidth - 224),
        zIndex: 90,
      }
    : { position: "absolute", right: 0, top: "100%", marginTop: 8, zIndex: 90 };

  return (
    <div style={style} data-gf-menu-root="">
      <div
        ref={ref}
        role="menu"
        aria-label="Opsi folder"
        tabIndex={0}
        onKeyDown={onKeyDown}
        onBlur={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node)) onClose();
        }}
        style={{
          width: 208,
          padding: 6,
          borderRadius: 14,
          border: milk ? "1px solid rgba(255,255,255,.85)" : "1px solid rgba(255,255,255,.14)",
          background: milk
            ? "linear-gradient(160deg, rgba(255,255,255,.82), rgba(255,255,255,.62))"
            : "linear-gradient(160deg, rgba(34,29,54,.86), rgba(18,16,30,.82))",
          backdropFilter: "blur(22px) saturate(160%)",
          WebkitBackdropFilter: "blur(22px) saturate(160%)",
          boxShadow: milk
            ? "0 18px 40px rgba(60,45,120,.18), inset 0 1px 0 rgba(255,255,255,.9)"
            : "0 22px 48px rgba(0,0,0,.55), inset 0 1px 0 rgba(255,255,255,.12)",
          color: milk ? "#2a2140" : "#efeaff",
          outline: "none",
          animation: `gfMenuIn .18s ${EASE} both`,
        }}
      >
        {items.map((item, index) => {
          const enabledIndex = enabled.indexOf(item);
          const isActive = enabledIndex === active && !item.disabled;
          return (
            <button
              key={item.id}
              type="button"
              role="menuitem"
              tabIndex={-1}
              aria-disabled={item.disabled || undefined}
              onMouseEnter={() => !item.disabled && enabledIndex >= 0 && setActive(enabledIndex)}
              onClick={() => {
                if (item.disabled) return;
                item.onSelect?.();
                onClose();
              }}
              style={{
                all: "unset",
                boxSizing: "border-box",
                display: "flex",
                alignItems: "center",
                gap: 10,
                width: "100%",
                padding: "9px 10px",
                borderRadius: 9,
                fontSize: 13,
                fontWeight: 500,
                letterSpacing: 0.2,
                cursor: item.disabled ? "not-allowed" : "pointer",
                opacity: item.disabled ? 0.45 : 1,
                color: item.danger
                  ? milk
                    ? "#b4273f"
                    : "#ff8fa3"
                  : undefined,
                background: isActive
                  ? milk
                    ? "rgba(124,106,208,.14)"
                    : "rgba(255,255,255,.12)"
                  : "transparent",
                transition: "background .14s ease",
                animation: `gfMenuIn .16s ${EASE} both`,
                animationDelay: `${index * 18}ms`,
              }}
            >
              {item.icon ? <span style={{ display: "inline-flex" }}>{item.icon}</span> : null}
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Folder                                                                      */
/* -------------------------------------------------------------------------- */

const MAX_VISIBLE_TABS = 5;

export function GlassFolderCards({
  title,
  eyebrow,
  description,
  files,
  image,
  artwork,
  tone = "milk",
  addable = false,
  onAddFile,
  customAdd = false,
  items,
  onFilesChange,
  menu = false,
  menuItems,
  delay = 0,
  onFileSelect,
  onFileNavigate,
  badge,
  headerText,
  footerLabel,
  actions,
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  className,
}: GlassFolderCardsProps) {
  const controlled = typeof openProp === "boolean";
  const [internalOpen, setInternalOpen] = React.useState(defaultOpen);
  const open = controlled ? (openProp as boolean) : internalOpen;

  const [internalFiles, setInternalFiles] = React.useState<GlassFolderFile[]>(files || []);
  const fileList = items || internalFiles;

  const [mounted, setMounted] = React.useState(false);
  const [hovered, setHovered] = React.useState(false);
  const [focused, setFocused] = React.useState(false);
  const [pointer, setPointer] = React.useState({ x: 0, y: 0 });
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [menuRect, setMenuRect] = React.useState<DOMRect | null>(null);
  const [dropping, setDropping] = React.useState<string | null>(null);
  const [activeFile, setActiveFile] = React.useState<string | null>(null);

  const rootRef = React.useRef<HTMLDivElement>(null);
  const frontRef = React.useRef<HTMLButtonElement>(null);
  const menuBtnRef = React.useRef<HTMLButtonElement>(null);
  const idRef = React.useRef(uid());

  const milk = tone === "milk";

  /* Files prop is the source for the *initial* value only. */
  React.useEffect(() => {
    if (!items && files) setInternalFiles(files);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [files]);

  /* Entry animation once the folder scrolls into view. */
  React.useEffect(() => {
    const node = rootRef.current;
    if (!node) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const reveal = () => {
      timer = setTimeout(() => setMounted(true), Math.max(0, delay));
    };
    if (typeof IntersectionObserver === "undefined") {
      reveal();
      return () => timer && clearTimeout(timer);
    }
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            reveal();
            observer.disconnect();
          }
        });
      },
      { threshold: 0.25 }
    );
    observer.observe(node);
    return () => {
      observer.disconnect();
      if (timer) clearTimeout(timer);
    };
  }, [delay]);

  const emitFiles = (next: GlassFolderFile[]) => {
    if (!items) setInternalFiles(next);
    onFilesChange?.(next);
  };

  const setOpen = (next: boolean) => {
    if (!controlled) setInternalOpen(next);
    onOpenChange?.(next);
    if (!next) setMenuOpen(false);
  };

  const toggleOpen = () => setOpen(!open);

  const onPointerMove = (event: React.PointerEvent) => {
    if (event.pointerType === "touch") return;
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;
    setPointer({ x, y });
  };

  const addFile = () => {
    const index = fileList.length + 1;
    const id = uid();
    const fallback: GlassFolderFile = {
      id,
      title: `Catatan baru ${index}`,
      meta: "Draf",
    };
    setDropping(id);
    emitFiles([...fileList, fallback]);
    onAddFile?.(fallback);
    setTimeout(() => setDropping((current) => (current === id ? null : current)), 700);
  };

  const activateFile = (file: GlassFolderFile) => {
    onFileSelect?.(file);
    if (onFileNavigate) onFileNavigate(file);
    else if (file.href) window.location.assign(file.href);
  };

  /* layered depth when open */
  const count = fileList.length;

  const visibleTabs = fileList.slice(0, MAX_VISIBLE_TABS);
  const overflow = fileList.length - visibleTabs.length;

  const resolvedMenu: GlassFolderMenuItem[] =
    menuItems && menuItems.length
      ? menuItems
      : [
          {
            id: "open",
            label: open ? "Tutup folder" : "Buka folder",
            onSelect: () => setOpen(!open),
          },
          {
            id: "first",
            label: "Buka file pertama",
            disabled: !count,
            onSelect: () => count && activateFile(fileList[0]),
          },
          {
            id: "count",
            label: `${count} file di dalam`,
            disabled: true,
            onSelect: () => undefined,
          },
          {
            id: "sort",
            label: "Urutkan judul A–Z",
            onSelect: () =>
              emitFiles(
                [...fileList].sort((a, b) =>
                  (a.title || "").localeCompare(b.title || "", "id")
                )
              ),
          },
        ];

  /* ---------------------------- style tokens ---------------------------- */

  const ink = milk ? "#241c3d" : "#f1edff";
  const inkSoft = milk ? "rgba(36,28,61,.62)" : "rgba(241,237,255,.62)";
  const panelBg = milk
    ? "linear-gradient(160deg, rgba(255,255,255,.92) 0%, rgba(246,242,255,.78) 46%, rgba(236,229,255,.74) 100%)"
    : "linear-gradient(160deg, rgba(56,48,86,.72) 0%, rgba(30,26,48,.66) 50%, rgba(16,14,28,.72) 100%)";
  const panelBorder = milk ? "rgba(255,255,255,.95)" : "rgba(255,255,255,.16)";
  const backBg = milk
    ? "linear-gradient(160deg, rgba(233,224,255,.9), rgba(247,236,246,.8))"
    : "linear-gradient(160deg, rgba(44,38,70,.86), rgba(20,17,34,.86))";
  const paperBg = milk
    ? "linear-gradient(170deg, rgba(255,255,255,.98), rgba(247,244,255,.94))"
    : "linear-gradient(170deg, rgba(52,46,78,.95), rgba(33,29,52,.95))";
  const paperBorder = milk ? "rgba(255,255,255,.9)" : "rgba(255,255,255,.12)";

  const tilt = open || !mounted ? { rx: 0, ry: 0, y: 0 } : {
    rx: hovered || focused ? -pointer.y * 9 : 4,
    ry: hovered || focused ? pointer.x * 12 : 0,
    y: hovered || focused ? -6 : 0,
  };

  const frontTransform = open
    ? "translateZ(10px) rotateX(22deg) translateY(-6px)"
    : `translateZ(22px) rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg) translateY(${tilt.y}px)`;

  const frontArtwork = () => {
    if (typeof image === "function") return image(tone);
    if (typeof image === "string") {
      return (
        <img
          src={image}
          alt=""
          aria-hidden="true"
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
        />
      );
    }
    if (artwork) return artwork(tone);
    return <GlassFolderArtwork tone={tone} seed={title} />;
  };

  return (
    <div
      ref={rootRef}
      className={["gf-folder", className].filter(Boolean).join(" ")}
      data-tone={tone}
      data-open={open ? "true" : "false"}
      style={{
        position: "relative",
        width: "100%",
        maxWidth: 460,
        margin: "0 auto",
        paddingBottom: open ? `${Math.max(count, 1) * 16 + 150}px` : 72,
        transition: `padding-bottom .6s ${EASE}`,
        opacity: mounted ? 1 : 0,
        transform: mounted ? "translateY(0)" : "translateY(28px)",
        filter: mounted ? "none" : "blur(6px)",
        transitionProperty: "opacity, transform, filter, padding-bottom",
        transitionDuration: "900ms, 900ms, 600ms",
        transitionTimingFunction: EASE,
      }}
    >
      {/* label under the folder */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          gap: 12,
          padding: "0 6px",
          marginTop: open ? 8 : 18,
          order: 2,
        }}
      >
        <div style={{ minWidth: 0 }}>
          {eyebrow ? (
            <div
              style={{
                fontSize: 10,
                letterSpacing: 1.8,
                textTransform: "uppercase",
                color: inkSoft,
                marginBottom: 6,
              }}
            >
              {eyebrow}
            </div>
          ) : null}
          <h3
            style={{
              margin: 0,
              fontSize: 18,
              lineHeight: 1.25,
              fontWeight: 600,
              letterSpacing: -0.2,
              color: ink,
            }}
          >
            {title}
          </h3>
          {description ? (
            <p style={{ margin: "6px 0 0", fontSize: 12.5, lineHeight: 1.5, color: inkSoft }}>
              {description}
            </p>
          ) : null}
        </div>
        <div style={{ flexShrink: 0, textAlign: "right" }}>
          {actions}
          <div style={{ fontSize: 11.5, color: inkSoft, letterSpacing: 0.3, marginTop: 4 }}>
            {footerLabel || `${count} file`}
          </div>
        </div>
      </div>

      {/* stage */}
      <div
        role="group"
        aria-label={`Folder ${title}`}
        onPointerMove={onPointerMove}
        onPointerLeave={() => {
          setHovered(false);
          setPointer({ x: 0, y: 0 });
        }}
        onPointerEnter={() => setHovered(true)}
        style={{
          position: "relative",
          height: open ? count * 16 + 135 : 250,
          transition: `height .6s ${EASE}`,
          perspective: 1100,
          perspectiveOrigin: "50% 20%",
          marginTop: 16,
          /* the fanned files need vertical room */
          overflow: "visible",
        }}
      >
        {/* back panel */}
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 20,
            height: open ? count * 16 + 150 : 190,
            borderRadius: "22px 22px 18px 18px",
            background: backBg,
            border: `1px solid ${panelBorder}`,
            boxShadow: milk
              ? "0 18px 40px rgba(80,62,150,.16), inset 0 1px 0 rgba(255,255,255,.9)"
              : "0 26px 50px rgba(0,0,0,.5), inset 0 1px 0 rgba(255,255,255,.1)",
            backdropFilter: "blur(18px) saturate(140%)",
            WebkitBackdropFilter: "blur(18px) saturate(140%)",
            transform: open ? "translateZ(-30px) translateY(6px)" : "translateZ(-30px)",
            transition: `transform .6s ${EASE}, height .6s ${EASE}`,
          }}
        />

        {/* files */}
        <ul
          role="list"
          aria-label={`Isi folder ${title}`}
          style={{
            all: "unset",
            position: "absolute",
            left: 0,
            right: 0,
            bottom: open ? 120 : 58,
            height: 0,
            transformStyle: "preserve-3d",
          }}
        >
          {fileList.map((file, index) => {
            const n = Math.max(count, 1);
            const spread = n === 1 ? 0 : (index - (n - 1) / 2) / ((n - 1) / 2);
            const closedY = -index * 3;
            const closedScale = 1 - index * 0.012;
            const openY = -40 - index * 16;
            const center = (index - (n - 1) / 2) * 100;
            const row = Math.floor(index / 2);
            const offsetX = center * 0.52 + row * 6;
            const rotate = open ? spread * 3.4 : 0;
            const isActive = activeFile === file.id;

            return (
              <li
                key={file.id}
                style={{
                  all: "unset",
                  position: "absolute",
                  left: "8%",
                  right: "8%",
                  bottom: 0,
                  height: open ? 62 : 54,
                  display: "block",
                  transform: open
                    ? `translate3d(${offsetX}px, ${openY}px, ${60 + index * 12}px) rotateZ(${rotate}deg)`
                    : `translate3d(0, ${closedY}px, ${4 + index * 2}px) scale(${closedScale})`,
                  opacity: open ? 1 : index === 0 ? 1 : 1,
                  transition: `transform .58s ${EASE}, opacity .4s ease`,
                  transitionDelay: `${open ? index * 45 : (count - index) * 30}ms`,
                  zIndex: open ? 30 + index : 10 - index,
                  pointerEvents: open ? "auto" : "none",
                  animation: dropping === file.id ? "gfDrop .7s cubic-bezier(.34,1.4,.64,1) both" : undefined,
                }}
              >
                <button
                  type="button"
                  data-gf-file=""
                  aria-label={`Buka ${file.title}`}
                  tabIndex={open ? 0 : -1}
                  onFocus={() => setActiveFile(file.id)}
                  onBlur={() => setActiveFile((current) => (current === file.id ? null : current))}
                  onClick={() => activateFile(file)}
                  style={{
                    all: "unset",
                    boxSizing: "border-box",
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    width: "100%",
                    height: "100%",
                    padding: "0 16px",
                    borderRadius: 14,
                    background: paperBg,
                    border: `1px solid ${paperBorder}`,
                    boxShadow: isActive
                      ? milk
                        ? "0 16px 30px rgba(90,70,160,.28), 0 0 0 2px rgba(124,106,208,.55)"
                        : "0 18px 34px rgba(0,0,0,.55), 0 0 0 2px rgba(190,175,255,.55)"
                      : milk
                      ? "0 10px 24px rgba(90,70,160,.14)"
                      : "0 14px 28px rgba(0,0,0,.42)",
                    color: ink,
                    cursor: open ? "pointer" : "default",
                    backdropFilter: "blur(10px)",
                    WebkitBackdropFilter: "blur(10px)",
                    transition: `box-shadow .2s ease, transform .2s ${EASE}`,
                  }}
                  onMouseEnter={(e) => {
                    if (open) e.currentTarget.style.transform = "translateY(-2px)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                  }}
                >
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: 34,
                      height: 34,
                      flexShrink: 0,
                      borderRadius: 10,
                      background: milk ? "rgba(124,106,208,.12)" : "rgba(255,255,255,.1)",
                      color: milk ? "#5f4bb8" : "#cdbcff",
                    }}
                  >
                    {file.icon || <PageIcon size={17} />}
                  </span>
                  <span style={{ minWidth: 0, flex: 1, textAlign: "left" }}>
                    <span
                      style={{
                        display: "block",
                        fontSize: 13.5,
                        fontWeight: 600,
                        lineHeight: 1.25,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {file.title}
                    </span>
                    {file.meta ? (
                      <span
                        style={{
                          display: "block",
                          fontSize: 10.5,
                          lineHeight: 1.4,
                          letterSpacing: 0.8,
                          textTransform: "uppercase",
                          color: inkSoft,
                          marginTop: 2,
                        }}
                      >
                        {file.meta}
                      </span>
                    ) : null}
                  </span>
                  {open ? (
                    <span aria-hidden="true" style={{ color: inkSoft, fontSize: 13 }}>
                      →
                    </span>
                  ) : null}
                </button>
              </li>
            );
          })}
        </ul>

        {/* front panel */}
        <button
          ref={frontRef}
          type="button"
          aria-expanded={open}
          aria-label={open ? `Tutup folder ${title}` : `Buka folder ${title}`}
          onClick={() => {
            if (!open) setOpen(true);
            else setOpen(false);
          }}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            all: "unset",
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            height: open ? 118 : 196,
            borderRadius: "20px 20px 18px 18px",
            transform: frontTransform,
            transformOrigin: "50% 100%",
            transition: `transform .55s ${EASE}, height .55s ${EASE}, box-shadow .3s ease`,
            transformStyle: "preserve-3d",
            overflow: "hidden",
            cursor: "pointer",
            background: panelBg,
            border: `1px solid ${panelBorder}`,
            boxShadow:
              hovered || focused
                ? milk
                  ? "0 30px 60px rgba(80,60,150,.26), inset 0 1px 0 rgba(255,255,255,1)"
                  : "0 34px 66px rgba(0,0,0,.6), inset 0 1px 0 rgba(255,255,255,.18)"
                : milk
                ? "0 18px 36px rgba(80,60,150,.16), inset 0 1px 0 rgba(255,255,255,.95)"
                : "0 22px 44px rgba(0,0,0,.5), inset 0 1px 0 rgba(255,255,255,.12)",
            backdropFilter: "blur(22px) saturate(160%)",
            WebkitBackdropFilter: "blur(22px) saturate(160%)",
            outline: focused ? `2px solid ${milk ? "#6f5ec4" : "#cdbcff"}` : "none",
            outlineOffset: 4,
            zIndex: 20,
          }}
        >
          {frontArtwork()}

          {/* tab flap */}
          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              top: 0,
              left: 18,
              width: 96,
              height: 22,
              borderRadius: "0 0 12px 12px",
              background: milk ? "rgba(255,255,255,.6)" : "rgba(255,255,255,.1)",
              border: `1px solid ${panelBorder}`,
              borderTop: "none",
            }}
          />

          {/* front panel text */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              padding: open ? "14px 18px" : "18px 18px 16px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              color: ink,
              textAlign: "left",
            }}
          >
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
              <div style={{ minWidth: 0 }}>
                {badge ? (
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      padding: "4px 9px",
                      borderRadius: 999,
                      fontSize: 9.5,
                      fontWeight: 600,
                      letterSpacing: 1.4,
                      textTransform: "uppercase",
                      background: milk ? "rgba(255,255,255,.75)" : "rgba(0,0,0,.3)",
                      border: `1px solid ${panelBorder}`,
                      color: ink,
                    }}
                  >
                    {badge}
                  </span>
                ) : null}
              </div>
              {headerText ? (
                <div
                  style={{
                    fontSize: 10.5,
                    letterSpacing: 1.4,
                    textTransform: "uppercase",
                    color: inkSoft,
                    fontWeight: 600,
                    whiteSpace: "nowrap",
                    opacity: open ? 0 : 1,
                    transition: "opacity .3s ease",
                  }}
                >
                  {headerText}
                </div>
              ) : null}
            </div>

            {!open ? (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  flexWrap: "wrap",
                }}
              >
                {visibleTabs.map((file) => (
                  <span
                    key={file.id}
                    title={file.title}
                    style={{
                      maxWidth: 90,
                      padding: "5px 9px",
                      borderRadius: 8,
                      fontSize: 10.5,
                      fontWeight: 500,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      background: milk ? "rgba(255,255,255,.72)" : "rgba(255,255,255,.1)",
                      border: `1px solid ${paperBorder}`,
                      color: ink,
                    }}
                  >
                    {file.title}
                  </span>
                ))}
                {overflow > 0 ? (
                  <span
                    style={{
                      fontSize: 10.5,
                      color: inkSoft,
                      padding: "5px 4px",
                      fontWeight: 600,
                    }}
                  >
                    +{overflow}
                  </span>
                ) : null}
                {!count ? (
                  <span style={{ fontSize: 11, color: inkSoft }}>Folder kosong</span>
                ) : null}
              </div>
            ) : (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: inkSoft }}>
                  {count} file terbuka
                </span>
                <span style={{ fontSize: 11, color: inkSoft }}>klik untuk menutup</span>
              </div>
            )}
          </div>
        </button>

        {/* add + menu buttons */}
        {(addable || menu) && (
          <div
            style={{
              position: "absolute",
              right: 10,
              bottom: 8,
              display: "flex",
              alignItems: "center",
              gap: 6,
              zIndex: 40,
              transform: "translateZ(40px)",
            }}
          >
            {addable ? (
              <button
                type="button"
                aria-label="Tambah file"
                title="Tambah file"
                onClick={(e) => {
                  e.stopPropagation();
                  addFile();
                }}
                style={{
                  all: "unset",
                  boxSizing: "border-box",
                  width: 30,
                  height: 30,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: 10,
                  cursor: "pointer",
                  color: milk ? "#4b3a94" : "#e8e1ff",
                  background: milk ? "rgba(255,255,255,.8)" : "rgba(255,255,255,.12)",
                  border: `1px solid ${panelBorder}`,
                  backdropFilter: "blur(12px)",
                  WebkitBackdropFilter: "blur(12px)",
                  boxShadow: milk ? "0 6px 14px rgba(80,60,150,.18)" : "0 6px 14px rgba(0,0,0,.45)",
                  transition: `transform .2s ${EASE}, background .2s ease`,
                }}
                onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.08)")}
                onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
                onFocus={(e) => (e.currentTarget.style.transform = "scale(1.08)")}
                onBlur={(e) => (e.currentTarget.style.transform = "scale(1)")}
              >
                <PlusIcon />
              </button>
            ) : null}

            {menu ? (
              <div style={{ position: "relative" }}>
                <button
                  ref={menuBtnRef}
                  type="button"
                  aria-label="Opsi folder"
                  aria-haspopup="menu"
                  aria-expanded={menuOpen}
                  title="Opsi"
                  onClick={(e) => {
                    e.stopPropagation();
                    const rect = e.currentTarget.getBoundingClientRect();
                    setMenuRect(rect);
                    setMenuOpen((prev) => !prev);
                  }}
                  style={{
                    all: "unset",
                    boxSizing: "border-box",
                    width: 34,
                    height: 30,
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: 10,
                    cursor: "pointer",
                    color: milk ? "#4b3a94" : "#e8e1ff",
                    background: milk ? "rgba(255,255,255,.8)" : "rgba(255,255,255,.12)",
                    border: `1px solid ${panelBorder}`,
                    backdropFilter: "blur(12px)",
                    WebkitBackdropFilter: "blur(12px)",
                    boxShadow: milk ? "0 6px 14px rgba(80,60,150,.18)" : "0 6px 14px rgba(0,0,0,.45)",
                  }}
                >
                  <MoreIcon />
                </button>
                {menuOpen ? (
                  <FolderMenu
                    items={resolvedMenu}
                    tone={tone}
                    anchorRect={menuRect}
                    onClose={() => {
                      setMenuOpen(false);
                      menuBtnRef.current?.focus();
                    }}
                  />
                ) : null}
              </div>
            ) : null}
          </div>
        )}
      </div>

      {/* global keyframes / a11y defaults for this component */}
      <style data-glass-folder="" dangerouslySetInnerHTML={{ __html: GLASS_FOLDER_CSS }} />
      <span id={idRef.current} hidden />
    </div>
  );
}

export function GlassFolderGrid({ children, className }: GlassFolderGridProps) {
  return (
    <div
      className={className}
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(1, minmax(0,1fr))",
        gap: 32,
        alignItems: "start",
      }}
    >
      {children}
    </div>
  );
}

const GLASS_FOLDER_CSS = `
@keyframes gfMenuIn { from { opacity: 0; transform: translateY(-6px) scale(.97); } to { opacity: 1; transform: translateY(0) scale(1); } }
@keyframes gfDrop {
  0% { opacity: 0; transform: translate3d(0,-120px,80px) rotateZ(-8deg) scale(.9); }
  55% { opacity: 1; transform: translate3d(0,10px,80px) rotateZ(3deg) scale(1.02); }
  100% { transform: translate3d(0,0,80px) rotateZ(0) scale(1); }
}
.gf-folder button { font-family: inherit; }
.gf-folder button:focus-visible { outline: 2px solid currentColor; outline-offset: 3px; }
.gf-folder [data-gf-file]:focus-visible { outline: 2px solid #8a74e0; outline-offset: 2px; }
@media (prefers-reduced-motion: reduce) {
  .gf-folder, .gf-folder * { animation-duration: .001ms !important; transition-duration: .001ms !important; }
}
`;

export default GlassFolderCards;
