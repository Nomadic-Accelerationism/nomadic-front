import Image from "next/image";
import MenuUserHeaderComponent from "@/components/MenuUserHeader";
import UserProofsComponent from "@/components/UserProofs";

export default function Home() {
  return (
    <>
      <MenuUserHeaderComponent />
      <UserProofsComponent />
    </>
  );
}
