import React from 'react';

const Territories = () => {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Territories</h1>
      <div className="bg-white p-4 rounded shadow">
        <table className="min-w-full">
          <thead>
            <tr>
              <th className="py-2 px-4 text-left">Name</th>
              <th className="py-2 px-4 text-left">Region</th>
              <th className="py-2 px-4 text-left">Owner</th>
              <th className="py-2 px-4 text-left">Accounts</th>
              <th className="py-2 px-4 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="py-2 px-4" colSpan={5}>No territories found</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Territories;