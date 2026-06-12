import React from 'react';

import {
  Navigate,
} from 'react-router-dom';

import {
  getRole,
} from '../utils/auth';

interface Props {

  children:
  React.ReactNode;
}

export const AdminRoute = ({
  children,
}: Props) => {

  const role =
    getRole();

  if (role !== 'admin') {

    return (
      <Navigate to="/" />
    );
  }

  return children;
};