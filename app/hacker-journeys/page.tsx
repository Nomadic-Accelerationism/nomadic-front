import Image from "next/image";
import MenuUserHeaderComponent from "@/components/MenuUserHeader";
import HackerJourneysComponent from "@/components/HackerJourneys";

export default function HomeHouse() {
  return (
    <div className="clay-page min-h-screen">
      <MenuUserHeaderComponent />
      <HackerJourneysComponent />
    </div>
  );
}
