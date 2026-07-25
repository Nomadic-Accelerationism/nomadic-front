import Image from "next/image";
import HomeUserComponent from "@/components/HomeUser";
import MenuUserHeaderComponent from "@/components/MenuUserHeader";

export default function HomeUser() {
  return (
    <div className="clay-page-gradient min-h-screen">
      <MenuUserHeaderComponent />
      <HomeUserComponent />
    </div>
  );
}
