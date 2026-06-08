import React from 'react';
import {  Navigate } from 'react-router-dom';

const ProtectedRoutes = (props: any) => {

  const token =
    localStorage.getItem(
      "access_token",
    );

  if (!token) {

    return (
      <Navigate to="/login" />
    );
  }

  return props.children;
};

export default ProtectedRoutes;