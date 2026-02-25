export default function Logo({ size = "default" }: { size?: "small" | "default" | "large" }) {
  const textSize = size === "small" ? "text-lg" : size === "large" ? "text-3xl" : "text-xl";
  const barWidth = size === "small" ? "w-5" : size === "large" ? "w-8" : "w-6";
  const barHeight = size === "large" ? "h-[3px]" : "h-[2px]";

  return (
    <span className="inline-flex flex-col items-start">
      <span className={`${textSize} font-bold text-white`}>Preciso</span>
      <span className={`${barWidth} ${barHeight} rounded-full bg-emerald-500 mt-0.5`} />
    </span>
  );
}
