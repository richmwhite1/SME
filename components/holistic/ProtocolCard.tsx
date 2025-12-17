import Link from "next/link";
import { cn } from "@/lib/utils";

interface ProtocolCardProps {
  title: string;
  problemSolved: string;
  slug: string;
}

export default function ProtocolCard({
  title,
  problemSolved,
  slug,
}: ProtocolCardProps) {
  return (
    <Link href={`/products/${slug}`}>
      <div className="group rounded-2xl bg-white/50 p-8 backdrop-blur-sm transition-all duration-300 hover:scale-[1.02] hover:shadow-xl">
        <h3 className="mb-3 text-2xl font-semibold text-deep-stone transition-colors duration-300 group-hover:text-earth-green">
          {title}
        </h3>
        <p className="text-deep-stone/70">{problemSolved}</p>
      </div>
    </Link>
  );
}

