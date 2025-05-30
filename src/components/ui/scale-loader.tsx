import {useCallback} from "react";
import { cn } from "~/lib/utils"

const createAnimation = (loaderName: string, frames: string, suffix: string): string => {
  const animationName = `react-spinners-${loaderName}-${suffix}`;

  if (typeof window == "undefined" || !window.document) {
    return animationName;
  }

  const styleEl = document.createElement("style");
  document.head.appendChild(styleEl);
  const styleSheet = styleEl.sheet;

  const keyFrames = `
    @keyframes ${animationName} {
      ${frames}
    }
  `;

  if (styleSheet) {
    styleSheet.insertRule(keyFrames, 0);
  }

  return animationName;
};

const scale = createAnimation(
  "ScaleLoader",
  "0% {transform: scaley(1.0)} 50% {transform: scaley(0.4)} 100% {transform: scaley(1.0)}",
  "scale"
);



type StyleProps = {
    height?: string
    width?: string
    borderRadius?: string
    margin?: string
    speedMultiplier?: number
    loading?: boolean
    barCount?: number
    styles?: string
}

export const  ScaleLoader = ({
  speedMultiplier = 1,
  styles = "h-[35px] w-[4px] rounded-xs m-2",
  barCount = 5,
}: StyleProps & { barCount?: number }) => {

  const style = useCallback((frameIdx: number): React.CSSProperties => {
    return {
      display: "inline-block",
      animation: `${scale} ${1 / speedMultiplier}s ${frameIdx * 0.1}s infinite cubic-bezier(0.2, 0.68, 0.18, 1.08)`,
      animationFillMode: "both",
    };
  }, [speedMultiplier]);



  return (
    <span className="motion-reduce:hidden">
      {[...Array(barCount)].map((_, frameIdx) => (
        <span key={`scale-loader-frame-${frameIdx}`} style={style(frameIdx + 1)}  className={
            cn(
                "bg-black/75 dark:bg-white/75",
                styles,

            )
        }/>
      ))}
    </span>
  );
}