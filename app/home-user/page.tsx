import Image from "next/image";
import HomeUserComponent from "@/components/HomeUser";
import MenuHeaderComponent from "@/components/MenuHeader";

export default function Home() {
  return (
    <>
      <MenuHeaderComponent />
      <HomeUserComponent />
    </>
  );
}
