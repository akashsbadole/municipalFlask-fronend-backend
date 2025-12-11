import React from 'react';
import { useRouter } from 'next/router';
import Layout from '../../../components/Layout/Layout';
import { AuthProvider } from '../../../contexts/AuthContext';

const WaterConnectionDetail: React.FC = () => {
  const router = useRouter();
  const { id } = router.query;

  return (
    <AuthProvider>
      <Layout>
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">Water Connection Details</h1>
            <button
              onClick={() => router.back()}
              className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300"
            >
              Back
            </button>
          </div>
          
          <div className="bg-white shadow rounded-lg p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Connection Information</h3>
                <dl className="space-y-2">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Connection ID</dt>
                    <dd className="text-sm text-gray-900">{id}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Status</dt>
                    <dd className="text-sm text-gray-900">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                        Active
                      </span>
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Connection Date</dt>
                    <dd className="text-sm text-gray-900">January 15, 2023</dd>
                  </div>
                </dl>
              </div>
              
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Property Information</h3>
                <dl className="space-y-2">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Address</dt>
                    <dd className="text-sm text-gray-900">123 Main St, Downtown</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Property Type</dt>
                    <dd className="text-sm text-gray-900">Residential</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Meter Number</dt>
                    <dd className="text-sm text-gray-900">MTR-12345</dd>
                  </div>
                </dl>
              </div>
            </div>
            
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Readings</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Reading
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Units
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        Oct 1, 2023
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        1250
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        gallons
                      </td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        Sep 1, 2023
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        1180
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        gallons
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            
            <div className="mt-6 flex justify-end space-x-3">
              <button className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300">
                Edit Connection
              </button>
              <button className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700">
                Disconnect
              </button>
            </div>
          </div>
        </div>
      </Layout>
    </AuthProvider>
  );
};

export default WaterConnectionDetail;