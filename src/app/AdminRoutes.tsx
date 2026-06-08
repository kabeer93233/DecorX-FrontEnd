import React from 'react';

import {
  Navigate,
} from 'react-router-dom';

interface Props{
  children:React.ReactNode;
}

export const AdminRoute=({
  children,
}:Props)=>{

  const role=
  localStorage.getItem(
    'role',
  );

  if(role!=='admin'){

    return(
      <Navigate to="/" />
    );
  }

  return children;
};