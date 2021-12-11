import React from 'react';
import { redirectDependsOnUserExistence } from '../context/auth';

function Index() {
  redirectDependsOnUserExistence();

  return <></>;
}

export default Index;
