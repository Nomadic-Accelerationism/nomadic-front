import Image from "next/image";
import HomeUserComponent from "@/components/HomeUser";
import MenuUserHeaderComponent from "@/components/MenuUserHeader";

export default function Home() {
  return (
    <>
      <MenuUserHeaderComponent />
      <HomeUserComponent />
    </>
  );
}
