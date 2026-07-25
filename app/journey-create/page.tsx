import Image from "next/image";
import MenuUserHeaderComponent from "@/components/MenuUserHeader";
import JourneyCreateComponent from "@/components/JourneyCreate";

export default function HomeHouse() {
  return (
    <div className="clay-page min-h-screen">
      <MenuUserHeaderComponent />
      <JourneyCreateComponent />
    </div>
  );
}
