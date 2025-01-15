//import Image from "next/image";
import GenerateSingleUseIdComponent from "@/components/GenerateSingleUseId";
import MenuUserHeaderComponent from "@/components/MenuUserHeader";


export default function HomeUser() {
  return (
    <>
      <MenuUserHeaderComponent />
      <GenerateSingleUseIdComponent />
    </>
  );
}
