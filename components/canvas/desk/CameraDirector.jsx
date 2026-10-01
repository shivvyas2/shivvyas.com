import { useEffect, useRef } from "react";
import { useThree } from "@react-three/fiber";
import { CatmullRomCurve3 } from "three";
import { gsap } from "@/libs/gsap";
import { dispatchDesk, useDesk } from "./useDesk";
import { getPose } from "./cameraFraming";
import { cameraPlan } from "./lib/cameraPlan.mjs";

// Where the hero camera looks; OrbitControls re-mounts with this target.
export const heroLook = { current: null };

export default function CameraDirector({ bounds, isMobile, diaryAnchor }) {
  const { camera, size, invalidate } = useThree();
  const mode = useDesk((s) => s.mode);
  const focus = useDesk((s) => s.diaryFocus);
  const transitioning = useDesk((s) => s.transitioning);
  const heroTextBottom = useDesk((s) => s.heroTextBottom);
  const look = useRef(null);
  const last = useRef({ mode: null, focus: null });

  useEffect(() => {
    const pose = getPose(mode, { bounds, size, isMobile, diaryAnchor, focus, heroTextBottom });
    if (mode === "hero") heroLook.current = pose.center.clone();
    const apply = (position, center, fov, up) => {
      camera.up.copy(up);
      camera.position.copy(position);
      camera.fov = fov;
      camera.updateProjectionMatrix();
      camera.lookAt(center);
      invalidate();
    };
    const plan = cameraPlan({ hasLook: Boolean(look.current), prev: last.current, mode, focus, transitioning });
    last.current = { mode, focus };

    if (plan.kind === "snap") {
      look.current = pose.center.clone();
      apply(pose.position, pose.center, pose.fov, pose.up);
      if (plan.endTransition) dispatchDesk({ type: "transitionEnd" });
      return;
    }

    const fromPos = camera.position.clone();
    const fromLook = look.current.clone();
    const fromFov = camera.fov;
    const fromUp = camera.up.clone();
    const up = fromUp.clone();
    const mid = fromPos.clone().lerp(pose.position, 0.5);
    mid.y = Math.max(fromPos.y, pose.position.y) + fromPos.distanceTo(pose.position) * 0.15;
    const curve = new CatmullRomCurve3([fromPos, mid, pose.position]);
    const progress = { t: 0 };
    const tween = gsap.to(progress, {
      t: 1,
      duration: plan.duration,
      ease: "power3.inOut",
      onUpdate: () => {
        look.current.lerpVectors(fromLook, pose.center, progress.t);
        apply(
          curve.getPoint(progress.t),
          look.current,
          fromFov + (pose.fov - fromFov) * progress.t,
          up.lerpVectors(fromUp, pose.up, progress.t).normalize(),
        );
      },
      onComplete: () => dispatchDesk({ type: "transitionEnd" }),
    });
    return () => tween.kill();
    // transitioning is read, not a trigger: toggling it must not restart tweens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, focus, bounds, size.width, size.height, isMobile, diaryAnchor, camera, invalidate, heroTextBottom]);

  return null;
}
