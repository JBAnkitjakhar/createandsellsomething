'use client';
import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { PlusIcon, ShoppingCartIcon, ArrowRightIcon } from '@heroicons/react/24/outline';

export default function Marketplace({ contract, account }) {
  const [items, setItems] = useState([]);
  const [ownedItems, setOwnedItems] = useState([]);
  const [newItemName, setNewItemName] = useState('');
  const [newItemPrice, setNewItemPrice] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [transferTo, setTransferTo] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);

  useEffect(() => {
    if (contract && account) {
      loadMarketplaceData();
    }
  }, [contract, account]);

  const loadMarketplaceData = async () => {
    try {
      setLoading(true);
      await Promise.all([loadItems(), loadOwnedItems()]);
    } catch (err) {
      console.error("Error loading marketplace data:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadItems = async () => {
    try {
      const itemCount = await contract.itemCount();
      const itemsArray = [];
      for (let i = 1; i <= itemCount; i++) {
        const item = await contract.items(i);
        if (item.id.toString() !== '0') {
          itemsArray.push(item);
        }
      }
      setItems(itemsArray);
    } catch (err) {
      console.error("Error loading items:", err);
      throw err;
    }
  };

  const loadOwnedItems = async () => {
    try {
      const ownedItemIds = await contract.getItemsByOwner(account);
      let ownedItems = [];
      for (let i = 0; i < ownedItemIds.length; i++) {
        const item = await contract.items(ownedItemIds[i]);
        ownedItems.push(item);
      }
      setOwnedItems(ownedItems);
    } catch (err) {
      console.error("Error loading owned items:", err);
      throw err;
    }
  };

  const listItem = async (e) => {
    e.preventDefault();
    if (!newItemName || !newItemPrice) return;
    try {
      setLoading(true);
      const tx = await contract.listItem(newItemName, ethers.utils.parseEther(newItemPrice));
      await tx.wait();
      
      // Fetch the newly created item
      const itemCount = await contract.itemCount();
      const newItem = await contract.items(itemCount);
      
      // Update the state immediately
      setItems(prevItems => [...prevItems, newItem]);
      setOwnedItems(prevOwnedItems => [...prevOwnedItems, newItem]);
      
      setNewItemName('');
      setNewItemPrice('');
    } catch (error) {
      console.error('Error listing item:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const purchaseItem = async (id, price) => {
    try {
      setLoading(true);
      const tx = await contract.purchaseItem(id, { value: price });
      await tx.wait();
      await loadMarketplaceData();
    } catch (error) {
      console.error('Error purchasing item:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const transferItem = async (id, toAddress) => {
    try {
      setLoading(true);
      const tx = await contract.transferItem(id, toAddress);
      await tx.wait();
      await loadMarketplaceData();
      setIsOpen(false);
      setTransferTo('');
    } catch (error) {
      console.error('Error transferring item:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  function closeModal() {
    setIsOpen(false);
    setTransferTo('');
    setSelectedItem(null);
  }

  function openModal(item) {
    setSelectedItem(item);
    setIsOpen(true);
  }

  if (loading) return <div className="text-center py-4">Loading marketplace data...</div>;
  if (error) return <div className="text-red-500 text-center py-4">Error: {error}</div>;

  return (
    <div className="space-y-8">
      {/* List New Item form */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">List New Item</h2>
        <form onSubmit={listItem} className="space-y-4">
          <input
            type="text"
            placeholder="Item Name"
            value={newItemName}
            onChange={(e) => setNewItemName(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
          <input
            type="text"
            placeholder="Item Price (in BNB)"
            value={newItemPrice}
            onChange={(e) => setNewItemPrice(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
          <button 
            type="submit"
            className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <PlusIcon className="mr-2 h-5 w-5" aria-hidden="true" />
            List Item
          </button>
        </form>
      </div>

      {/* Items for Sale
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">Items for Sale</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item) => (
            <div key={item.id.toString()} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 flex flex-col justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{item.name}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Price: {ethers.utils.formatEther(item.price)} BNB</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 truncate">Owner: {item.owner}</p>
              </div>
              {!item.isSold && item.owner.toLowerCase() !== account.toLowerCase() && (
                <button
                  onClick={() => purchaseItem(item.id, item.price)}
                  className="mt-4 w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  <ShoppingCartIcon className="mr-2 h-5 w-5" aria-hidden="true" />
                  Purchase
                </button>
              )}
            </div>
          ))}
        </div>
      </div> */}

      {/* Your Items */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">Your Items</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {ownedItems.map((item) => (
            <div key={item.id.toString()} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 flex flex-col justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{item.name}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Price: {ethers.utils.formatEther(item.price)} BNB</p>
              </div>
              <button
                onClick={() => openModal(item)}
                className="mt-4 w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <ArrowRightIcon className="mr-2 h-5 w-5" aria-hidden="true" />
                Transfer
              </button>
            </div>
          ))}
        </div>
      </div>


       {/* Items for Sale */}
       <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">Items for Sale</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item) => (
            <div key={item.id.toString()} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 flex flex-col justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{item.name}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Price: {ethers.utils.formatEther(item.price)} BNB</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 truncate">Owner: {item.owner}</p>
              </div>
              {!item.isSold && item.owner.toLowerCase() !== account.toLowerCase() && (
                <button
                  onClick={() => purchaseItem(item.id, item.price)}
                  className="mt-4 w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  <ShoppingCartIcon className="mr-2 h-5 w-5" aria-hidden="true" />
                  Purchase
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Transfer Modal */}
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
                    Transfer Item
                  </Dialog.Title>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Enter the address you want to transfer this item to:
                    </p>
                    <input
                      type="text"
                      value={transferTo}
                      onChange={(e) => setTransferTo(e.target.value)}
                      className="mt-2 w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      placeholder="0x..."
                    />
                  </div>

                  <div className="mt-4">
                    <button
                      type="button"
                      className="inline-flex justify-center rounded-md border border-transparent bg-blue-100 dark:bg-blue-800 px-4 py-2 text-sm font-medium text-blue-900 dark:text-blue-100 hover:bg-blue-200 dark:hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                      onClick={() => transferItem(selectedItem.id, transferTo)}
                    >
                      Transfer
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </div>
  );
}