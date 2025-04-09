import React from 'react';

const Accounts = () => {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Accounts</h1>
      <div className="bg-white p-4 rounded shadow">
        <table className="min-w-full">
          <thead>
            <tr>
              <th className="py-2 px-4 text-left">Name</th>
              <th className="py-2 px-4 text-left">Industry</th>
              <th className="py-2 px-4 text-left">Revenue</th>
              <th className="py-2 px-4 text-left">Score</th>
              <th className="py-2 px-4 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="py-2 px-4" colSpan={5}>No accounts found</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Accounts;