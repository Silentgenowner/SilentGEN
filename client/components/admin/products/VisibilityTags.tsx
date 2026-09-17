"use client";

type VisibilityTagsProps = {
  showDesktop?: boolean;
  showMobile?: boolean;
  showTablet?: boolean;
  isActive?: boolean;
};

export default function VisibilityTags({
  showDesktop = true,
  showMobile = true,
  showTablet = true,
  isActive = true,
}: VisibilityTagsProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {isActive ? (
        <span className="inline-flex items-center rounded-full bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-200">
          Active
        </span>
      ) : (
        <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-500 ring-1 ring-inset ring-gray-200">
          Hidden
        </span>
      )}

      {showDesktop && (
        <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-200">
          Desktop
        </span>
      )}

      {showTablet && (
        <span className="inline-flex items-center rounded-full bg-purple-50 px-2.5 py-1 text-xs font-medium text-purple-700 ring-1 ring-inset ring-purple-200">
          Tablet
        </span>
      )}

      {showMobile && (
        <span className="inline-flex items-center rounded-full bg-orange-50 px-2.5 py-1 text-xs font-medium text-orange-700 ring-1 ring-inset ring-orange-200">
          Mobile
        </span>
      )}
    </div>
  );
}