import Image from "next/image";
import MenuUserHeaderComponent from "@/components/MenuUserHeader";
import CreateJourneyComponent from "@/components/CreateJourney";

export default function HomeHouse() {
  return (
    <>
      <MenuUserHeaderComponent />
      <CreateJourneyComponent />
    </>
  );
}
