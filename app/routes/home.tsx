import type { Route } from "./+types/home";
import { Welcome } from "../components/three/scenes/home/WelcomeScene";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Threejs-House" },
    { name: "description", content: "Welcome to the 3D House!" },
  ];
}

export default function Home() {
  return <Welcome />;
}
