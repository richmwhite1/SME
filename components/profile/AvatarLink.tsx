import Link from "next/link";
import Image from "next/image";

interface AvatarLinkProps {
  userId: string;
  username?: string | null;
  avatarUrl?: string | null;
  fullName?: string | null;
  size?: number;
  className?: string;
  showName?: boolean;
  nameClassName?: string;
  onClick?: () => void;
}

export default function AvatarLink({
  userId,
  username,
  avatarUrl,
  fullName,
  size = 32,
  className = "",
  showName = false,
  nameClassName = "",
  onClick,
}: AvatarLinkProps) {
  // Use username route if available, otherwise use profile ID route
  const profileUrl = username ? `/u/${username}` : `/profile/${userId}`;
  const initials = fullName?.charAt(0).toUpperCase() || "U";

  const avatarContent = (
    <>
      {avatarUrl ? (
        <Image
          src={avatarUrl}
          alt={fullName || "User"}
          width={size}
          height={size}
          className="rounded-full object-cover"
          style={{ width: size, height: size }}
        />
      ) : (
        <div
          className="flex items-center justify-center rounded-full bg-soft-clay text-xs font-semibold text-deep-stone"
          style={{ width: size, height: size }}
        >
          {initials}
        </div>
      )}
      {showName && fullName && (
        <span className={nameClassName}>{fullName}</span>
      )}
    </>
  );

  if (onClick) {
    return (
      <button
        onClick={onClick}
        className={`flex items-center gap-2 transition-opacity hover:opacity-80 ${className}`}
      >
        {avatarContent}
      </button>
    );
  }

  return (
    <Link
      href={profileUrl}
      className={`flex items-center gap-2 transition-opacity hover:opacity-80 ${className}`}
    >
      {avatarContent}
    </Link>
  );
}



