import React from "react";

import {
  Navigate,
} from "react-router-dom";

import {
  getAccessToken,
} from "../utils/auth";

export const PublicRoute = ({
  children,
}: any) => {

  const token =
    getAccessToken();

  if (token) {

    return (
      <Navigate
        to="/"
        replace
      />
    );
  }

  return children;
};