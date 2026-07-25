import Image from "next/image";
import MenuHouseHeaderComponent from "@/components/MenuHouseHeader";
import HomeHouseComponent from "@/components/HomeHouse";

export default function HomeHouse() {
  return (
    <div className="clay-page min-h-screen">
      <MenuHouseHeaderComponent />
      <HomeHouseComponent />
    </div>
  );
}
