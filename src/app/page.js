'use client';
import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import detectEthereumProvider from '@metamask/detect-provider';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import Marketplace from '../components/Marketplace';
import { CONTRACT_ABI, CONTRACT_ADDRESS } from '../../constants';

export default function Home() {
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [contract, setContract] = useState(null);
  const [account, setAccount] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        const provider = await detectEthereumProvider();
        
        if (!provider) {
          throw new Error('Please install MetaMask!');
        }

        const ethersProvider = new ethers.providers.Web3Provider(provider);
        setProvider(ethersProvider);

        const accounts = await provider.request({ method: 'eth_requestAccounts' });

        if (!accounts || !accounts[0]) {
          throw new Error('No authorized account found');
        }

        setAccount(accounts[0]);

        const signer = ethersProvider.getSigner();
        setSigner(signer);

        const marketplaceContract = new ethers.Contract(
          CONTRACT_ADDRESS,
          CONTRACT_ABI,
          signer
        );
        setContract(marketplaceContract);

        provider.on('accountsChanged', (newAccounts) => {
          if (newAccounts.length === 0) {
            setAccount('');
          } else {
            setAccount(newAccounts[0]);
          }
        });

        provider.on('chainChanged', () => {
          window.location.reload();
        });

        setLoading(false);

      } catch (err) {
        console.error('Error initializing app:', err);
        setError(err.message);
        setLoading(false);
        setIsOpen(true);
      }
    };

    init();

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', () => {});
        window.ethereum.removeListener('chainChanged', () => {});
      }
    };
  }, []);

  function closeModal() {
    setIsOpen(false);
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!provider) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <div className="text-center p-8 bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md">
          <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-yellow-400" />
          <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-gray-100">MetaMask Required</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Please install MetaMask to use this dApp
          </p>
          <div className="mt-4">
            <a
              href="https://metamask.io/download.html"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Install MetaMask
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg divide-y divide-gray-200 dark:divide-gray-700">
            <div className="px-4 py-5 sm:px-6">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Web3 Marketplace</h1>
              <div className="mt-1 flex items-center">
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Connected Account:</span>
                <span className="ml-2 text-sm font-mono bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-gray-800 dark:text-gray-200">
                  {account ? `${account.slice(0, 6)}...${account.slice(-4)}` : 'Not connected'}
                </span>
              </div>
            </div>
            <div className="px-4 py-5 sm:p-6">
              {contract && account ? (
                <Marketplace contract={contract} account={account} />
              ) : (
                <div className="text-center p-8">
                  <p className="text-xl text-gray-700 dark:text-gray-300">
                    {!account 
                      ? 'Please connect your wallet to continue' 
                      : 'Loading marketplace...'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <Transition appear show={isOpen} as={Fragment}>
        <Dialog as="div" className="relative z-10" onClose={closeModal}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black bg-opacity-25" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 p-6 text-left align-middle shadow-xl transition-all">
                  <Dialog.Title
                    as="h3"
                    className="text-lg font-medium leading-6 text-gray-900 dark:text-gray-100"
                  >
                    Error Initializing App
                  </Dialog.Title>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {error}
                    </p>
                  </div>

                  <div className="mt-4">
                    <button
                      type="button"
                      className="inline-flex justify-center rounded-md border border-transparent bg-blue-100 dark:bg-blue-800 px-4 py-2 text-sm font-medium text-blue-900 dark:text-blue-100 hover:bg-blue-200 dark:hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                      onClick={closeModal}
                    >
                      Got it, thanks!
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </main>
  );
}