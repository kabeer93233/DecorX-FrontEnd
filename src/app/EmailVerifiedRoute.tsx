import React, {
  useEffect,
} from 'react';

import {
  Navigate,
} from 'react-router-dom';

import { toast }
from 'sonner';

import {
  getIsVerified,
} from '../utils/auth';

interface Props {

  children:
  React.ReactNode;
}

export const EmailVerifiedRoute = ({
  children,
}: Props) => {

  const isVerified =
    getIsVerified() === 'true';

  useEffect(() => {

    if (!isVerified) {

      toast.warning(
        'Please verify your email to access this feature',
      );
    }

  }, [isVerified]);

  if (!isVerified) {

    return (
      <Navigate
        to="/profile"
        replace
      />
    );
  }

  return children;
};