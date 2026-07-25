"use client";

import MenuUserHeaderComponent from "@/components/MenuUserHeader";
import { PassportScreen } from "@/components/passport/PassportScreen";

export default function PassportPage() {
  return (
    <div className="clay-page-gradient min-h-screen">
      <MenuUserHeaderComponent />
      <PassportScreen />
    </div>
  );
}
