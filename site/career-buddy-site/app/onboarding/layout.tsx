import type { ReactNode } from "react";

import ProtectedRoute from "../../components/ProtectedRoute";

interface OnboardingLayoutProps {
  children: ReactNode;
}

export default function OnboardingLayout({ children }: OnboardingLayoutProps) {
  return <ProtectedRoute>{children}</ProtectedRoute>;
}
