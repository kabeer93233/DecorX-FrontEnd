import React from 'react';

import {
  Navigate,
} from 'react-router-dom';

import {
  getIsLoggedIn,
} from '../utils/auth';

const ProtectedRoutes = (
  props: any,
) => {

  const isLoggedIn =
    getIsLoggedIn();

  if (!isLoggedIn) {

    return (
      <Navigate to="/login" />
    );
  }

  return props.children;
};

export default ProtectedRoutes;