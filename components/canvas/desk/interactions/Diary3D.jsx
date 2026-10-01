import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal, useThree } from "@react-three/fiber";
import { PlaneGeometry } from "three";
import { Caveat } from "next/font/google";
import { gsap } from "@/libs/gsap";
import { dispatchDesk, useDesk } from "../useDesk";
import { PAGE } from "../lib/pageCurl.mjs";
import { PAGES } from "../lib/diaryPages.mjs";
import { drawBlankPage, drawPage, loadDiaryFont } from "./diaryTextures";
import { makeLeafMaterial } from "./leafMaterial";
import { useHoverLift } from "./useHoverLift";
import HitProxy from "./HitProxy";

// Self-hosted by next/font; downloads only when this lazy chunk loads.
const caveat = Caveat({ subsets: ["latin"], weight: ["400", "700"], preload: false, display: "swap" });

const SPINE = [-0.3, 0.086, 0];
const COVER_OPEN = Math.PI;
const STACK = 0.0025;
const LEAVES = [
  { front: null, back: 0, fixedTurn: 1 },
  { front: 1, back: 2, index: 0 },
  { front: 3, back: 4, index: 1 },
  { front: 5, back: 6, index: 2 },
  { front: 7, back: null, fixedTurn: 0 },
];
const restTurns = () => Object.fromEntries(LEAVES.map((leaf, k) => [k, leaf.fixedTurn ?? 0]));

export default function Diary3D({ nodes, isMobile }) {
  const diary = nodes.Interactive_Diary;
  const cover = nodes.Interactive_Diary_Cover;
  const mode = useDesk((s) => s.mode);
  const spread = useDesk((s) => s.spread);
  const open = mode === "diary";
  const invalidate = useThree((s) => s.invalidate);
  const hover = useHoverLift(diary, { enabled: mode === "desk", cursor: "pointer", lift: 0.02 });
  const [leaves, setLeaves] = useState(null);
  const group = useRef(null);
  const anim = useRef({ cover: 0, turns: LEAVES.map((l) => l.fixedTurn ?? 0), ink: PAGES.map(() => 0) });
  const geometry = useMemo(
    () =>
      new PlaneGeometry(PAGE.width, PAGE.depth, PAGE.segments, 1)
        .translate(PAGE.width / 2, 0, 0)
        .rotateX(-Math.PI / 2),
    [],
  );

  const sync = useRef(() => {});
  sync.current = () => {
    const a = anim.current;
    cover.rotation.z = a.cover;
    leaves?.forEach((material, k) => {
      const leaf = LEAVES[k];
      const u = material.userData.uniforms;
      const turn = a.turns[k];
      const right = leaf.index === undefined ? 0 : (3 - leaf.index) * STACK;
      const left = leaf.index === undefined ? 0 : (leaf.index + 1) * STACK;
      u.uTurn.value = turn;
      u.uLift.value = right + (left - right) * turn;
      u.uInkFront.value = leaf.front === null ? 1 : a.ink[leaf.front];
      u.uInkBack.value = leaf.back === null ? 1 : a.ink[leaf.back];
    });
    if (group.current) group.current.visible = Boolean(leaves) && a.cover > 0.05;
    invalidate();
  };

  // Paint the pages the first time the diary opens.
  useEffect(() => {
    if (!open || leaves) return;
    let cancelled = false;
    const family = caveat.style.fontFamily;
    loadDiaryFont(family).then(() => {
      if (cancelled) return;
      const pages = PAGES.map((page, i) => drawPage(page, i, family, isMobile));
      const blank = drawBlankPage(isMobile);
      setLeaves(
        LEAVES.map((leaf) =>
          makeLeafMaterial(
            leaf.front === null ? blank : pages[leaf.front],
            leaf.back === null ? blank : pages[leaf.back],
          ),
        ),
      );
    });
    return () => {
      cancelled = true;
    };
  }, [open, leaves]);

  useEffect(
    () => () => {
      leaves?.forEach((material) => {
        const u = material.userData.uniforms;
        [u.uFront, u.uBack, u.uMaskFront, u.uMaskBack].forEach((t) => t.value.dispose());
        material.dispose();
      });
    },
    [leaves],
  );
  useEffect(() => () => geometry.dispose(), [geometry]);

  // Cover opens after the camera has started its move; closing settles pages first.
  useEffect(() => {
    const a = anim.current;
    const timeline = gsap.timeline({ onUpdate: () => sync.current() });
    if (open) {
      timeline.to(a, { cover: COVER_OPEN, duration: 0.9, ease: "power2.inOut", delay: 0.5 });
    } else {
      timeline
        .to(a.turns, { ...restTurns(), duration: 0.5, ease: "power2.inOut" })
        .to(a, { cover: 0, duration: 0.8, ease: "power2.inOut" });
    }
    return () => timeline.kill();
  }, [open, leaves]);

  // Turn to the current spread, then ink in its sketches once.
  useEffect(() => {
    if (!open || !leaves) return;
    const a = anim.current;
    const targets = Object.fromEntries(
      LEAVES.map((leaf, k) => [k, leaf.fixedTurn ?? (leaf.index < spread ? 1 : 0)]),
    );
    const turn = gsap.to(a.turns, {
      ...targets,
      duration: 0.8,
      ease: "power2.inOut",
      onUpdate: () => sync.current(),
    });
    const ink = gsap.to(a.ink, {
      [spread * 2]: 1,
      [spread * 2 + 1]: 1,
      duration: 1.2,
      ease: "none",
      delay: a.cover < COVER_OPEN - 0.01 ? 1.4 : 0.5,
      onUpdate: () => sync.current(),
    });
    return () => {
      turn.kill();
      ink.kill();
    };
  }, [open, spread, leaves]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event) => {
      if (event.key === "ArrowRight") dispatchDesk({ type: "nextPage" });
      if (event.key === "ArrowLeft") dispatchDesk({ type: "prevPage" });
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const page = (type) => (event) => {
    event.stopPropagation();
    dispatchDesk({ type });
  };

  return (
    <>
      {mode === "desk" && (
        <HitProxy
          node={diary}
          {...hover}
          hovered={undefined}
          onClick={(event) => {
            event.stopPropagation();
            dispatchDesk({ type: "openDiary" });
          }}
        />
      )}
      {createPortal(
        <group ref={group} position={SPINE} visible={false}>
          {leaves?.map((material, k) => (
            <mesh key={k} geometry={geometry} material={material} frustumCulled={false} receiveShadow />
          ))}
          {open && (
            <>
              <mesh position={[-PAGE.width / 2, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]} visible={false} onClick={page("prevPage")}>
                <planeGeometry args={[PAGE.width, PAGE.depth]} />
              </mesh>
              <mesh position={[PAGE.width / 2, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]} visible={false} onClick={page("nextPage")}>
                <planeGeometry args={[PAGE.width, PAGE.depth]} />
              </mesh>
            </>
          )}
        </group>,
        diary,
      )}
    </>
  );
}
