import React from "react";

import {
  Navigate,
} from "react-router-dom";

import {
  getIsLoggedIn,
} from "../utils/auth";

export const PublicRoute = ({
  children,
}: any) => {

  const isLoggedIn =
    getIsLoggedIn();

  if (isLoggedIn) {

    return (
      <Navigate
        to="/"
        replace
      />
    );
  }

  return children;
};