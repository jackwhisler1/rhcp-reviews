import React from "react";
import { JSX } from "react";

interface RouteConfig {
  path: string;
  component: React.LazyExoticComponent<() => JSX.Element>;
  exact?: boolean;
}

export const routes: RouteConfig[] = [
  {
    path: "/",
    component: React.lazy(() => import("../pages/Home")),
    exact: true,
  },
];
