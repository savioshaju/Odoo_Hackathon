import React from 'react';
import { useRouteError, Link } from 'react-router-dom';

export default function Errorpage() {
  const error = useRouteError();
  console.error(error);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <h1 className="text-4xl font-bold mb-4">Oops!</h1>
      <p className="text-gray-600 mb-4">Sorry, an unexpected error has occurred.</p>
      <Link to="/" className="text-blue-600 hover:underline">
        Back to Home
      </Link>
    </div>
  );
}

