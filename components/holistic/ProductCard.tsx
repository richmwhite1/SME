import { cn } from "@/lib/utils";

interface ProductCardProps {
  name: string;
  brand: string;
  usageInstructions: string;
}

export default function ProductCard({
  name,
  brand,
  usageInstructions,
}: ProductCardProps) {
  return (
    <div className="rounded-xl bg-white/50 p-6 backdrop-blur-sm transition-all duration-300 hover:scale-[1.02] hover:shadow-lg">
      <div className="mb-3">
        <h4 className="text-lg font-semibold text-deep-stone">{name}</h4>
        <p className="text-sm text-deep-stone/70">{brand}</p>
      </div>
      <p className="text-sm leading-relaxed text-deep-stone/80">
        {usageInstructions}
      </p>
    </div>
  );
}

