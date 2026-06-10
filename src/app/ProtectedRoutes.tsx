import React from 'react';

import {
  Navigate,
} from 'react-router-dom';

import {
  getAccessToken,
} from '../utils/auth';

const ProtectedRoutes = (
  props: any,
) => {

  const token =
    getAccessToken();

  if (!token) {

    return (
      <Navigate to="/login" />
    );
  }

  return props.children;
};

export default ProtectedRoutes;