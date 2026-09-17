"use client";

import Link from "next/link";
import {
  type ComponentProps,
} from "react";

type FastLinkProps =
  ComponentProps<typeof Link>;

export default function FastLink({
  prefetch = true,
  ...props
}: FastLinkProps) {
  return (
    <Link
      prefetch={prefetch}
      {...props}
    />
  );
}