import Image from "next/image";
import HomeUserComponent from "@/components/HomeUser";
import MenuUserHeaderComponent from "@/components/MenuUserHeader";

export default function HomeUser() {
  return (
    <>
      <MenuUserHeaderComponent />
      <HomeUserComponent />
    </>
  );
}
