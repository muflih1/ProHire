import { useId } from "react";

export default function Home() {
  return (
    <div id={useId()}>home</div>
  )
}
