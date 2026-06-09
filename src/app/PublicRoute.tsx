import React from "react";
import {Navigate} from "react-router-dom";

export const PublicRoute = ({
  children,
}: any) => {

  const token =
  localStorage.getItem(
    "access_token",
  ) ||
  sessionStorage.getItem(
    "access_token",
  );

  // IF USER LOGGED IN

  if (token) {

    return (
      <Navigate
        to="/"
        replace
      />
    );
  }

  // OTHERWISE SHOW PAGE

  return children;
};